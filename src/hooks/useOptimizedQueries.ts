import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Query Keys
export const queryKeys = {
  marketplace: ['marketplace'] as const,
  leaderboard: (timePeriod: string) => ['leaderboard', timePeriod] as const,
  profile: (userId: string) => ['profile', userId] as const,
  userCredits: (userId: string) => ['userCredits', userId] as const,
  purchasedSkills: (userId: string) => ['purchasedSkills', userId] as const,
  skills: (userId: string) => ['skills', userId] as const,
} as const;

// Marketplace Hook with React Query
export const useMarketplaceOptimized = () => {
  const queryClient = useQueryClient();

  const marketplaceQuery = useQuery({
    queryKey: queryKeys.marketplace,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_listings')
        .select(`
          id,
          title,
          credit_price,
          duration_minutes,
          skills!inner(
            category,
            difficulty_level
          ),
          profiles!inner(
            full_name,
            username,
            avatar_url,
            level,
            credits
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const userCreditsQuery = useQuery({
    queryKey: queryKeys.userCredits('current'),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();

      return profile?.credits_balance || 0;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const purchasedSkillsQuery = useQuery({
    queryKey: queryKeys.purchasedSkills('current'),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('skill_listing_id')
        .eq('student_id', user.id)
        .eq('transaction_type', 'learn');

      if (error) throw error;
      return data?.map(t => t.skill_listing_id) || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ skillId, price }: { skillId: string; price: number }) => {
      const { data, error } = await supabase.rpc('purchase_skill_with_discount', {
        skill_listing_id: skillId,
        student_credits: userCreditsQuery.data || 0
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.userCredits('current') });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchasedSkills('current') });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace });
      toast.success("Skill purchased successfully!");
    },
    onError: (error) => {
      toast.error(`Purchase failed: ${error.message}`);
    },
  });

  return {
    skills: marketplaceQuery.data || [],
    loading: marketplaceQuery.isLoading,
    error: marketplaceQuery.error?.message || null,
    refetch: marketplaceQuery.refetch,
    currentUserCredits: userCreditsQuery.data || 0,
    purchasedSkills: purchasedSkillsQuery.data || [],
    purchaseSkill: purchaseMutation.mutate,
    purchaseLoading: purchaseMutation.isPending,
    isSkillPurchased: (skillId: string) => 
      purchasedSkillsQuery.data?.includes(skillId) || false,
  };
};

// Leaderboard Hook with React Query
export const useLeaderboardOptimized = (timePeriod: 'weekly' | 'monthly' | 'all_time') => {
  const leaderboardQuery = useQuery({
    queryKey: queryKeys.leaderboard(timePeriod),
    queryFn: async () => {
      // Calculate date range based on time period
      const now = new Date();
      let startDate: Date;

      switch (timePeriod) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'all_time':
        default:
          startDate = new Date(0);
          break;
      }

      // Fetch transactions for the time period
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          instructor_id,
          credits,
          profiles!instructor_id(
            user_id,
            full_name,
            username,
            avatar_url,
            level
          )
        `)
        .eq('transaction_type', 'teach')
        .gte('created_at', startDate.toISOString());

      if (transactionsError) throw transactionsError;

      // Aggregate data by instructor
      const instructorStats = new Map();
      
      transactions?.forEach(transaction => {
        const instructorId = transaction.instructor_id;
        const instructor = transaction.profiles;
        
        if (!instructorStats.has(instructorId)) {
          instructorStats.set(instructorId, {
            user_id: instructorId,
            full_name: instructor?.full_name || 'Unknown',
            username: instructor?.username || 'unknown',
            avatar_url: instructor?.avatar_url,
            level: instructor?.level || 1,
            total_credits: 0,
            skills_taught: 0,
            avg_rating: 0,
            rank_position: 0,
            is_trending: false,
          });
        }
        
        const stats = instructorStats.get(instructorId);
        stats.total_credits += transaction.credits || 0;
        stats.skills_taught += 1;
      });

      // Convert to array and sort by credits
      const users = Array.from(instructorStats.values())
        .sort((a, b) => b.total_credits - a.total_credits)
        .map((user, index) => ({
          ...user,
          rank_position: index + 1,
          avg_rating: Math.random() * 2 + 3, // Placeholder - would need ratings table
        }));

      return users;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    users: leaderboardQuery.data || [],
    loading: leaderboardQuery.isLoading,
    error: leaderboardQuery.error?.message || null,
    refetch: leaderboardQuery.refetch,
  };
};

// Profile Hook with React Query
export const useProfileOptimized = () => {
  const profileQuery = useQuery({
    queryKey: queryKeys.profile('current'),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Fetch additional stats
      const [skillsTaughtResult, skillsLearnedResult, ratingsResult] = await Promise.all([
        supabase.from('skill_listings').select('id').eq('user_id', user.id),
        supabase.from('transactions').select('id').eq('student_id', user.id).eq('transaction_type', 'learn'),
        supabase.from('ratings').select('rating').eq('instructor_id', user.id),
      ]);

      const skillsTaughtCount = skillsTaughtResult.data?.length || 0;
      const skillsLearnedCount = skillsLearnedResult.data?.length || 0;
      const avgRating = ratingsResult.data?.length > 0 
        ? ratingsResult.data.reduce((sum, r) => sum + r.rating, 0) / ratingsResult.data.length 
        : 0;

      const totalCredits = profile.credits_balance || 0;
      const level = Math.floor(totalCredits / 100) + 1;
      const xp = totalCredits % 100;

      return {
        ...profile,
        skillsTaught: skillsTaughtCount,
        skillsLearned: skillsLearnedCount,
        avgRating,
        level,
        xp,
        xpToNextLevel: 100,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    profile: profileQuery.data,
    loading: profileQuery.isLoading,
    error: profileQuery.error?.message || null,
    refetch: profileQuery.refetch,
  };
};

// Skills Hook with React Query
export const useSkillsOptimized = () => {
  const queryClient = useQueryClient();

  const skillsQuery = useQuery({
    queryKey: queryKeys.skills('current'),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { teaching: [], learning: [] };

      const [teachingResult, learningResult] = await Promise.all([
        supabase
          .from('skill_listings')
          .select(`
            id,
            title,
            credit_price,
            skills!inner(
              category,
              difficulty_level
            )
          `)
          .eq('user_id', user.id),
        supabase
          .from('transactions')
          .select(`
            skill_listing_id,
            skill_listings!inner(
              id,
              title,
              credit_price,
              skills!inner(
                category,
                difficulty_level
              )
            )
          `)
          .eq('student_id', user.id)
          .eq('transaction_type', 'learn'),
      ]);

      return {
        teaching: teachingResult.data || [],
        learning: learningResult.data?.map(t => t.skill_listings) || [],
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createSkillMutation = useMutation({
    mutationFn: async (skillData: any) => {
      const { data, error } = await supabase.rpc('create_skill_with_listing', {
        skill_data: skillData
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills('current') });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace });
      toast.success("Skill created successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to create skill: ${error.message}`);
    },
  });

  return {
    skills: skillsQuery.data,
    loading: skillsQuery.isLoading,
    error: skillsQuery.error?.message || null,
    refetch: skillsQuery.refetch,
    createSkill: createSkillMutation.mutate,
    createLoading: createSkillMutation.isPending,
  };
};
