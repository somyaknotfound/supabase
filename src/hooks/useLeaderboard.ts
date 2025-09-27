import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TimePeriod = 'weekly' | 'monthly' | 'all_time';

export interface LeaderboardUser {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  level: number;
  total_credits: number;
  skills_taught: number;
  avg_rating: number;
  rank_position: number;
  is_trending: boolean;
}

export const useLeaderboard = (timePeriod: TimePeriod = 'all_time') => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching leaderboard for time period:', timePeriod);

      // Use separate queries to avoid relationship issues
      const startDate = timePeriod === 'weekly' 
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : timePeriod === 'monthly'
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : '1970-01-01';

      console.log('Start date for filtering:', startDate);

      // First, let's check what transactions exist
      const { data: allTransactions, error: allTransactionsError } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate);

      console.log('All transactions found:', allTransactions);

      // Get teach transactions (try different possible column names)
      const { data: teachTransactions, error: teachError } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_type', 'teach')
        .gte('created_at', startDate);

      console.log('Teach transactions found:', teachTransactions);

      // If no teach transactions, let's try to get all transactions and filter
      let transactions = teachTransactions;
      if (!teachTransactions || teachTransactions.length === 0) {
        console.log('No teach transactions found, trying alternative approach...');
        
        // Try to get transactions where instructor_id is not null
        const { data: instructorTransactions, error: instructorError } = await supabase
          .from('transactions')
          .select('*')
          .not('instructor_id', 'is', null)
          .gte('created_at', startDate);

        console.log('Instructor transactions found:', instructorTransactions);
        transactions = instructorTransactions;
      }

      if (teachError && !transactions) {
        console.error('Transactions query error:', teachError);
        throw teachError;
      }

      // If still no transactions, let's try a different approach - get from skill_listings
      if (!transactions || transactions.length === 0) {
        console.log('No transactions found, trying skill_listings approach...');
        
        const { data: skillListings, error: skillListingsError } = await supabase
          .from('skill_listings')
          .select(`
            user_id,
            created_at,
            profiles!inner(
              user_id,
              full_name,
              username,
              avatar_url,
              level,
              credits
            )
          `)
          .gte('created_at', startDate);

        console.log('Skill listings found:', skillListings);

        if (skillListingsError) {
          console.error('Skill listings query error:', skillListingsError);
          throw skillListingsError;
        }

        if (skillListings && skillListings.length > 0) {
          // Create leaderboard from skill listings
          const leaderboardUsers: LeaderboardUser[] = skillListings
            .map((listing: any, index: number) => ({
              user_id: listing.user_id,
              full_name: listing.profiles.full_name || listing.profiles.username || 'Unknown',
              username: listing.profiles.username || 'unknown',
              avatar_url: listing.profiles.avatar_url,
              level: listing.profiles.level || 1,
              total_credits: listing.profiles.credits || 0,
              skills_taught: 1, // Each listing represents one skill taught
              avg_rating: 4.5, // Default rating
              rank_position: index + 1,
              is_trending: false
            }))
            .sort((a, b) => b.total_credits - a.total_credits)
            .map((user, index) => ({
              ...user,
              rank_position: index + 1
            }));

          setUsers(leaderboardUsers);
          return;
        }
      }

      // Get unique instructor IDs from transactions
      const instructorIds = [...new Set((transactions || []).map(t => t.user_id))];

      console.log('Instructor IDs found:', instructorIds);

      if (instructorIds.length === 0) {
        setUsers([]);
        return;
      }

      // Then, get profiles for these instructors
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, level, credits')
        .in('user_id', instructorIds);

      console.log('Profiles found:', profiles);

      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        throw profilesError;
      }

      // Create a map of profiles for quick lookup
      const profileMap = new Map();
      (profiles || []).forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });

      // Aggregate the data
      const instructorMap = new Map<string, {
        user_id: string;
        full_name: string;
        username: string;
        avatar_url?: string;
        level: number;
        total_credits: number;
        skills_taught: Set<string>;
        transactions: any[];
      }>();

      (transactions || []).forEach((transaction: any) => {
        const instructorId = transaction.user_id;
        const profile = profileMap.get(instructorId);
        
        if (!instructorMap.has(instructorId)) {
          instructorMap.set(instructorId, {
            user_id: instructorId,
            full_name: profile?.full_name || profile?.username || 'Unknown',
            username: profile?.username || 'unknown',
            avatar_url: profile?.avatar_url,
            level: profile?.level || 1,
            total_credits: profile?.credits || 0,
            skills_taught: new Set(),
            transactions: []
          });
        }
        
        const instructor = instructorMap.get(instructorId)!;
        instructor.total_credits += Math.abs(transaction.amount || transaction.credits || 0);
        instructor.skills_taught.add(transaction.skill_listing_id || transaction.skill_id);
        instructor.transactions.push(transaction);
      });

      // Transform the data to match our interface
      const leaderboardUsers: LeaderboardUser[] = Array.from(instructorMap.values())
        .sort((a, b) => b.total_credits - a.total_credits)
        .map((instructor, index) => ({
          user_id: instructor.user_id,
          full_name: instructor.full_name,
          username: instructor.username,
          avatar_url: instructor.avatar_url,
          level: instructor.level,
          total_credits: instructor.total_credits,
          skills_taught: instructor.skills_taught.size,
          avg_rating: 4.5, // Default rating for now
          rank_position: index + 1,
          is_trending: false // TODO: Implement trending logic
        }));

      console.log('Final leaderboard users:', leaderboardUsers);
      setUsers(leaderboardUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard data');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    users,
    loading,
    error,
    refetch: fetchLeaderboard,
    timePeriod
  };
};