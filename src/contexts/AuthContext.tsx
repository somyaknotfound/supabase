import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface User {
  id: string;
  email?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  credits: number;
  level: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch user profile data
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user state when profile data changes
  useEffect(() => {
    if (profile && user) {
      setUser(prev => {
        if (!prev) return null;
        
        // Only update if there are actual changes to prevent infinite loops
        const hasChanges = 
          prev.full_name !== profile.full_name ||
          prev.username !== profile.username ||
          prev.avatar_url !== profile.avatar_url ||
          prev.credits !== (profile.credits || 0) ||
          prev.level !== (profile.level || 1);
          
        if (!hasChanges) return prev;
        
        return {
          ...prev,
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
          credits: profile.credits || 0,
          level: profile.level || 1,
        };
      });
    }
  }, [profile?.full_name, profile?.username, profile?.avatar_url, profile?.credits, profile?.level, user?.id]);

  const signIn = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success('Magic link sent! Check your email.');
    } catch (error: any) {
      toast.error(`Sign in failed: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      queryClient.clear();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(`Sign out failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          username: updates.username,
          avatar_url: updates.avatar_url,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, ...updates } : null);
      await refetchProfile();
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(`Profile update failed: ${error.message}`);
      throw error;
    }
  };

  const refreshUser = async () => {
    await refetchProfile();
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || undefined,
          });
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || undefined,
            });
          } else {
            setUser(null);
            queryClient.clear();
          }
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
