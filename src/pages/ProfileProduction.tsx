import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSkills, useUserCredits, useNotifications } from '@/hooks/useGlobalState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Settings, 
  Edit, 
  Trophy, 
  Star, 
  Coins, 
  Target, 
  BookOpen, 
  Users, 
  TrendingUp,
  Award,
  Calendar,
  Clock,
  Zap,
  Gem,
  Bell,
  Activity,
  BarChart3,
  Target as TargetIcon,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';

const ProfileSkeleton = () => (
  <div className="space-y-6">
    {/* Profile Header Skeleton */}
    <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
      <CardContent className="p-8">
        <div className="flex items-center space-x-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Stats Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="bg-gradient-card border-border/50">
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description, 
  color = "primary" 
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: string;
  description?: string;
  color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-${color}/10`}>
            <Icon className={`h-5 w-5 text-${color}`} />
          </div>
          {trend && (
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {trend}
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="text-sm text-muted-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const BadgeCard = ({ badge, earned }: { badge: any; earned: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: earned ? 1.05 : 1 }}
    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
      earned 
        ? 'border-yellow-500 bg-yellow-500/10 shadow-glow' 
        : 'border-muted bg-muted/20'
    }`}
  >
    <div className="text-center space-y-2">
      <div className="text-3xl">{badge.icon}</div>
      <h4 className="font-semibold text-sm">{badge.name}</h4>
      <p className="text-xs text-muted-foreground">{badge.description}</p>
      {earned && (
        <Badge className="bg-yellow-500 text-white text-xs">
          <Award className="h-3 w-3 mr-1" />
          Earned
        </Badge>
      )}
    </div>
  </motion.div>
);

const ActivityItem = ({ activity }: { activity: any }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
  >
    <div className="p-2 rounded-full bg-primary/10">
      <Activity className="h-4 w-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{activity.title}</p>
      <p className="text-xs text-muted-foreground">{activity.description}</p>
    </div>
    <div className="text-xs text-muted-foreground">
      {activity.time}
    </div>
  </motion.div>
);

const ProfileProduction = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
  });

  const { data: userSkills, isLoading: skillsLoading } = useUserSkills();
  const { data: userCredits = 0 } = useUserCredits();
  const { data: notifications = [] } = useNotifications();

  const teachingSkills = userSkills?.teaching || [];
  const learningSkills = userSkills?.learning || [];

  // Calculate stats
  const totalEarnings = teachingSkills.reduce((sum: number, skill: any) => sum + (skill.credit_price || 0), 0);
  const totalSpent = learningSkills.reduce((sum: number, skill: any) => sum + (skill.amount || 0), 0);
  const averageRating = 4.5; // TODO: Calculate from actual ratings
  const completionRate = learningSkills.length > 0 
    ? learningSkills.filter((skill: any) => skill.course_progress?.[0]?.progress_percent === 100).length / learningSkills.length * 100
    : 0;

  // Badges system
  const badges = [
    {
      id: 'first_skill',
      name: 'First Steps',
      icon: '🎯',
      description: 'Create your first skill',
      earned: teachingSkills.length > 0
    },
    {
      id: 'credit_earner',
      name: 'Credit Earner',
      icon: '💰',
      description: 'Earn 100+ credits',
      earned: userCredits >= 100
    },
    {
      id: 'skillful_teacher',
      name: 'Skillful Teacher',
      icon: '👨‍🏫',
      description: 'Teach 5+ skills',
      earned: teachingSkills.length >= 5
    },
    {
      id: 'dedicated_learner',
      name: 'Dedicated Learner',
      icon: '📚',
      description: 'Complete 3+ courses',
      earned: learningSkills.filter((skill: any) => skill.course_progress?.[0]?.progress_percent === 100).length >= 3
    },
    {
      id: 'top_performer',
      name: 'Top Performer',
      icon: '🏆',
      description: 'Reach top 10 in leaderboard',
      earned: false // TODO: Implement leaderboard position check
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      icon: '🦋',
      description: 'Get 10+ ratings',
      earned: false // TODO: Implement rating count check
    }
  ];

  // Recent activity
  const recentActivity = [
    {
      title: 'Completed "React Fundamentals"',
      description: 'Great job! You earned 50 XP',
      time: '2 hours ago'
    },
    {
      title: 'New student enrolled in your course',
      description: '"JavaScript Basics" gained a new student',
      time: '1 day ago'
    },
    {
      title: 'Received 5-star rating',
      description: 'Amazing teaching! - Sarah M.',
      time: '2 days ago'
    },
    {
      title: 'Level up!',
      description: 'You reached Level 3',
      time: '3 days ago'
    }
  ];

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">👤</div>
            <h3 className="text-lg font-semibold mb-2">Not Signed In</h3>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your progress, achievements, and activity in the SkillSwap community.
          </p>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
            <CardContent className="p-8">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24 border-4 border-primary/30">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editData.full_name}
                          onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                          placeholder="Full name"
                        />
                        <input
                          type="text"
                          value={editData.username}
                          onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border"
                          placeholder="Username"
                        />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-2xl font-bold">{user.full_name || 'Anonymous User'}</h2>
                        <p className="text-muted-foreground">@{user.username || 'username'}</p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isEditing) {
                          handleSaveProfile();
                        } else {
                          setIsEditing(true);
                          setEditData({
                            full_name: user.full_name || '',
                            username: user.username || '',
                          });
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Save' : 'Edit'}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className="bg-gradient-primary text-primary-foreground">
                      <Trophy className="h-3 w-3 mr-1" />
                      Level {user.level}
                    </Badge>
                    <Badge variant="secondary">
                      <Coins className="h-3 w-3 mr-1" />
                      {userCredits} Credits
                    </Badge>
                    <Badge variant="outline">
                      <Star className="h-3 w-3 mr-1" />
                      {averageRating.toFixed(1)} Rating
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            title="Credits Earned"
            value={totalEarnings}
            icon={Coins}
            color="yellow"
            description="From teaching skills"
          />
          <StatCard
            title="Credits Spent"
            value={totalSpent}
            icon={Target}
            color="blue"
            description="On learning skills"
          />
          <StatCard
            title="Skills Taught"
            value={teachingSkills.length}
            icon={BookOpen}
            color="green"
            description="Courses created"
          />
          <StatCard
            title="Completion Rate"
            value={`${completionRate.toFixed(0)}%`}
            icon={BarChart3}
            color="purple"
            description="Courses completed"
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Skills Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span>Teaching Skills</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teachingSkills.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Skills Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start sharing your knowledge by creating your first skill!
                        </p>
                        <Button className="bg-gradient-primary hover:opacity-90">
                          Create Skill
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {teachingSkills.slice(0, 3).map((skill: any) => (
                          <div key={skill.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                            <div className="flex-1">
                              <h4 className="font-medium">{skill.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {skill.credit_price} credits • {skill.skills?.category}
                              </p>
                            </div>
                            <Badge variant={skill.is_active ? "default" : "secondary"}>
                              {skill.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                        {teachingSkills.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{teachingSkills.length - 3} more skills
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span>Learning Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {learningSkills.length === 0 ? (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Learning Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Discover amazing skills to learn from our community!
                        </p>
                        <Button variant="outline">
                          Browse Marketplace
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {learningSkills.slice(0, 3).map((skill: any) => (
                          <div key={skill.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{skill.skill_listings?.title}</h4>
                              <span className="text-sm text-muted-foreground">
                                {skill.course_progress?.[0]?.progress_percent || 0}%
                              </span>
                            </div>
                            <Progress 
                              value={skill.course_progress?.[0]?.progress_percent || 0} 
                              className="h-2"
                            />
                          </div>
                        ))}
                        {learningSkills.length > 3 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{learningSkills.length - 3} more courses
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="badges" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span>Achievements & Badges</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {badges.map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} earned={badge.earned} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentActivity.map((activity, index) => (
                      <ActivityItem key={index} activity={activity} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Account Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Type</label>
                    <p className="text-sm text-muted-foreground">
                      {teachingSkills.length > 0 ? 'Instructor' : 'Student'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileProduction;
