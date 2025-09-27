import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Global state hooks for real-time data management

export const useUserCredits = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        return 0;
      }

      return data?.credits || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider stale after 10 seconds
  });
};

export const useMarketplaceData = () => {
  return useQuery({
    queryKey: ['marketplace-skills'],
    queryFn: async () => {
      // First get skill listings
      const { data: skillListings, error: listingsError } = await supabase
        .from('skill_listings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (listingsError) {
        console.error('Error fetching skill listings:', listingsError);
        throw listingsError;
      }

      if (!skillListings || skillListings.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(skillListings.map(listing => listing.user_id))];

      // Fetch profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, level, credits')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Get skills data
      const skillIds = [...new Set(skillListings.map(listing => listing.skill_id))];
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, category, difficulty_level')
        .in('id', skillIds);

      if (skillsError) {
        console.error('Error fetching skills:', skillsError);
        throw skillsError;
      }

      // Create lookup maps
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const skillMap = new Map(skills?.map(s => [s.id, s]) || []);

      // Combine the data
      const combinedData = skillListings.map(listing => ({
        ...listing,
        profiles: profileMap.get(listing.user_id) || {
          user_id: listing.user_id,
          full_name: 'Unknown',
          username: 'unknown',
          avatar_url: null,
          level: 1,
          credits: 0
        },
        skills: skillMap.get(listing.skill_id) || {
          id: listing.skill_id,
          name: 'Unknown Skill',
          category: 'General',
          difficulty_level: 'beginner'
        }
      }));

      return combinedData;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });
};

export const useUserSkills = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-skills', user?.id],
    queryFn: async () => {
      if (!user?.id) return { teaching: [], learning: [] };

      // Fetch teaching skills
      const { data: teachingSkills, error: teachingError } = await supabase
        .from('skill_listings')
        .select(`
          *,
          skills (name, category, difficulty_level)
        `)
        .eq('user_id', user.id);

      if (teachingError) {
        console.error('Error fetching teaching skills:', teachingError);
      }

      // Fetch learning skills (purchased skills)
      const { data: learningTransactions, error: learningError } = await supabase
        .from('transactions')
        .select(`
          id,
          skill_listing_id,
          amount,
          created_at
        `)
        .eq('student_id', user.id)
        .eq('transaction_type', 'learn');

      if (learningError) {
        console.error('Error fetching learning transactions:', learningError);
      }

      // Get skill listings for learning skills
      const skillListingIds = learningTransactions?.map(t => t.skill_listing_id) || [];
      let learningSkills = [];
      
      if (skillListingIds.length > 0) {
        const { data: skillListings, error: listingsError } = await supabase
          .from('skill_listings')
          .select(`
            id,
            title,
            skill_id,
            user_id
          `)
          .in('id', skillListingIds);

        if (listingsError) {
          console.error('Error fetching skill listings:', listingsError);
        }

        // Get skills data
        const skillIds = skillListings?.map(sl => sl.skill_id) || [];
        const { data: skills, error: skillsError } = await supabase
          .from('skills')
          .select('id, name, category, difficulty_level')
          .in('id', skillIds);

        if (skillsError) {
          console.error('Error fetching skills:', skillsError);
        }

        // Get instructor profiles
        const instructorIds = skillListings?.map(sl => sl.user_id) || [];
        const { data: instructors, error: instructorsError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', instructorIds);

        if (instructorsError) {
          console.error('Error fetching instructors:', instructorsError);
        }

        // Get course progress
        const { data: progress, error: progressError } = await supabase
          .from('course_progress')
          .select('skill_listing_id, progress_percent')
          .in('skill_listing_id', skillListingIds);

        if (progressError) {
          console.error('Error fetching progress:', progressError);
        }

        // Combine the data
        const skillMap = new Map(skills?.map(s => [s.id, s]) || []);
        const instructorMap = new Map(instructors?.map(i => [i.user_id, i]) || []);
        const progressMap = new Map(progress?.map(p => [p.skill_listing_id, p]) || []);

        learningSkills = learningTransactions?.map(transaction => {
          const skillListing = skillListings?.find(sl => sl.id === transaction.skill_listing_id);
          const skill = skillListing ? skillMap.get(skillListing.skill_id) : null;
          const instructor = skillListing ? instructorMap.get(skillListing.user_id) : null;
          const progressData = progressMap.get(transaction.skill_listing_id);

          return {
            id: transaction.id,
            skill_listing_id: transaction.skill_listing_id,
            amount: transaction.amount,
            created_at: transaction.created_at,
            skill_listings: skillListing ? {
              title: skillListing.title,
              skills: skill || { name: 'Unknown', category: 'General', difficulty_level: 'beginner' },
              profiles: instructor || { full_name: 'Unknown', username: 'unknown', avatar_url: null }
            } : null,
            course_progress: progressData ? [{ progress_percent: progressData.progress_percent }] : []
          };
        }) || [];
      }

      if (learningError) {
        console.error('Error fetching learning skills:', learningError);
      }

      return {
        teaching: teachingSkills || [],
        learning: learningSkills,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });
};

export const useLeaderboardData = (timePeriod: 'weekly' | 'monthly' | 'all_time' = 'all_time') => {
  return useQuery({
    queryKey: ['leaderboard', timePeriod],
    queryFn: async () => {
      const startDate = timePeriod === 'weekly' 
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : timePeriod === 'monthly'
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : '1970-01-01';

      // Get skill listings with profiles for the time period
      const { data: skillListings, error } = await supabase
        .from('skill_listings')
        .select(`
          user_id,
          created_at,
          profiles!inner (
            user_id,
            full_name,
            username,
            avatar_url,
            level,
            credits
          )
        `)
        .gte('created_at', startDate);

      if (error) {
        console.error('Error fetching leaderboard data:', error);
        throw error;
      }

      if (!skillListings || skillListings.length === 0) {
        return [];
      }

      // Aggregate data by user
      const userMap = new Map();
      
      skillListings.forEach((listing: any) => {
        const userId = listing.user_id;
        const profile = listing.profiles;
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            full_name: profile.full_name || profile.username || 'Unknown',
            username: profile.username || 'unknown',
            avatar_url: profile.avatar_url,
            level: profile.level || 1,
            total_credits: profile.credits || 0,
            skills_taught: 0,
            avg_rating: 4.5, // Default rating
          });
        }
        
        userMap.get(userId).skills_taught += 1;
      });

      // Convert to array and sort by credits
      const leaderboardUsers = Array.from(userMap.values())
        .sort((a, b) => b.total_credits - a.total_credits)
        .map((user, index) => ({
          ...user,
          rank_position: index + 1,
          is_trending: false, // TODO: Implement trending logic
        }));

      return leaderboardUsers;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  });
};

export const useSkillPurchase = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ skillId, cost, discount }: { skillId: string; cost: number; discount: number }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const finalAmount = Math.round(cost * (100 - discount) / 100);

      // Call the purchase function
      const { data, error } = await supabase.rpc('purchase_skill_with_discount', {
        p_skill_listing_id: skillId,
        p_student_id: user.id
      });

      if (error) {
        console.error('Purchase error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Purchase failed');
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['user-credits'] });
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-skills'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      
      toast.success(`Skill purchased successfully! You saved ${data.discount_amount} credits.`);
    },
    onError: (error: any) => {
      toast.error(`Purchase failed: ${error.message}`);
    },
  });
};

export const useCreateSkill = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (skillData: {
      title: string;
      description: string;
      credit_price: number;
      duration_minutes?: number;
      category: string;
      difficulty_level: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First create the skill
      const { data: skill, error: skillError } = await supabase
        .from('skills')
        .insert({
          name: skillData.title,
          category: skillData.category,
          difficulty_level: skillData.difficulty_level,
        })
        .select()
        .single();

      if (skillError) throw skillError;

      // Then create the skill listing
      const { data: listing, error: listingError } = await supabase
        .from('skill_listings')
        .insert({
          user_id: user.id,
          skill_id: skill.id,
          title: skillData.title,
          description: skillData.description,
          credit_price: skillData.credit_price,
          duration_minutes: skillData.duration_minutes,
          is_active: true,
        })
        .select()
        .single();

      if (listingError) throw listingError;

      return listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-skills'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success('Skill created successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to create skill: ${error.message}`);
    },
  });
};

export const useNotifications = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get recent transactions, messages, and course updates
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          skill_listings (title)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // 30 seconds
  });
};
