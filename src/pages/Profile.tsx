import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/components/UserProfile";
import { ProfileSkeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Star, 
  BookOpen, 
  Users, 
  Coins, 
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Target,
  Zap
} from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  credits: number;
  skillsTaught: number;
  skillsLearned: number;
  rating: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    rarity: "common" | "rare" | "epic" | "legendary";
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'skill_created' | 'skill_purchased' | 'rating_received' | 'level_up';
    title: string;
    description: string;
    timestamp: string;
    icon: string;
  }>;
}

const Profile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Not authenticated");
          return;
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          setError("Profile not found");
          return;
        }

        // Fetch skills taught
        const { data: skillsTaught } = await supabase
          .from('skill_listings')
          .select('id')
          .eq('user_id', user.id);

        // Fetch skills learned
        const { data: skillsLearned } = await supabase
          .from('transactions')
          .select('id')
          .eq('student_id', user.id)
          .eq('transaction_type', 'learn');

        // Fetch ratings received
        const { data: ratings } = await supabase
          .from('ratings')
          .select('rating')
          .eq('instructor_id', user.id);

        // Calculate stats
        const skillsTaughtCount = skillsTaught?.length || 0;
        const skillsLearnedCount = skillsLearned?.length || 0;
        const avgRating = ratings?.length > 0 
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
          : 0;

        // Calculate level and XP (simplified formula)
        const totalCredits = profile.credits_balance || 0;
        const level = Math.floor(totalCredits / 100) + 1;
        const xp = totalCredits % 100;
        const xpToNextLevel = 100;

        // Generate badges based on achievements
        const badges = [];
        if (skillsTaughtCount >= 10) {
          badges.push({
            id: "master_teacher",
            name: "Master Teacher",
            icon: "🎓",
            description: "Taught 10+ skills",
            rarity: "epic" as const
          });
        }
        if (skillsLearnedCount >= 5) {
          badges.push({
            id: "quick_learner",
            name: "Quick Learner",
            icon: "⚡",
            description: "Learned 5+ skills",
            rarity: "rare" as const
          });
        }
        if (avgRating >= 4.5) {
          badges.push({
            id: "top_rated",
            name: "Top Rated",
            icon: "🏆",
            description: "4.5+ average rating",
            rarity: "legendary" as const
          });
        }
        if (level >= 10) {
          badges.push({
            id: "veteran",
            name: "Veteran",
            icon: "🌟",
            description: "Level 10+",
            rarity: "epic" as const
          });
        }

        // Generate recent activity
        const recentActivity = [];
        if (skillsTaughtCount > 0) {
          recentActivity.push({
            id: "skill_created",
            type: "skill_created" as const,
            title: "Created Skill",
            description: `You've created ${skillsTaughtCount} skill${skillsTaughtCount > 1 ? 's' : ''}`,
            timestamp: new Date().toISOString(),
            icon: "📚"
          });
        }
        if (skillsLearnedCount > 0) {
          recentActivity.push({
            id: "skill_purchased",
            type: "skill_purchased" as const,
            title: "Enrolled in Course",
            description: `You've enrolled in ${skillsLearnedCount} course${skillsLearnedCount > 1 ? 's' : ''}`,
            timestamp: new Date().toISOString(),
            icon: "🎯"
          });
        }

        const profileData: ProfileData = {
          id: user.id,
          name: profile.full_name || user.email?.split('@')[0] || 'User',
          avatar: profile.avatar_url,
          level,
          xp,
          xpToNextLevel,
          credits: totalCredits,
          skillsTaught: skillsTaughtCount,
          skillsLearned: skillsLearnedCount,
          rating: avgRating,
          badges,
          achievements: [], // Could be expanded with more complex logic
          recentActivity
        };

        setProfileData(profileData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <ProfileSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
              <CardContent className="p-8 text-center">
                <div className="text-destructive mb-4">⚠️</div>
                <h3 className="text-lg font-semibold mb-2">Error Loading Profile</h3>
                <p className="text-muted-foreground">{error || "Profile not found"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <UserProfile user={profileData} />
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profileData.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                    <p className="text-muted-foreground">
                      Start teaching or learning skills to see your activity here!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileData.recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-3 rounded-lg bg-gradient-card hover:shadow-glow transition-all duration-300"
                      >
                        <div className="text-2xl">{activity.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
                <div className="text-2xl font-bold text-success">{profileData.level}</div>
                <div className="text-sm text-muted-foreground">Current Level</div>
                <Progress value={(profileData.xp / profileData.xpToNextLevel) * 100} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {profileData.xp}/{profileData.xpToNextLevel} XP to next level
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-primary">{profileData.skillsTaught}</div>
                <div className="text-sm text-muted-foreground">Skills Taught</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {profileData.skillsLearned} skills learned
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
              <CardContent className="p-6 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-accent" />
                <div className="text-2xl font-bold text-accent">{profileData.badges.length}</div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {profileData.rating > 0 ? `${profileData.rating.toFixed(1)}⭐ average rating` : 'No ratings yet'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;