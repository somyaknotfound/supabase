import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSkills, useUserCredits } from '@/hooks/useGlobalState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Users, 
  Star, 
  Edit, 
  Eye, Trash2, 
  Play, 
  CheckCircle,
  Clock,
  Calendar,
  Coins,
  Target,
  TrendingUp,
  Award,
  Zap,
  Flame,
  BarChart3,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

const SkillCardSkeleton = () => (
  <Card className="bg-gradient-card border-border/50">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

const TeachingSkillCard = ({ skill, onDelete }: { skill: any; onDelete: (id: string) => void }) => {
  const navigate = useNavigate();

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-2">
                <span className="text-lg font-bold">{skill.title}</span>
                <Badge variant="outline" className="text-xs">
                  {skill.skills?.category || 'General'}
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getStatusColor(skill.is_active)}`}>
                  {skill.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {skill.skills?.difficulty_level || 'Beginner'}
                </Badge>
              </div>
              {skill.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {skill.description}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/course/${skill.id}`)}
                className="hover:bg-primary hover:text-primary-foreground"
              >
                <Eye className="h-4 w-4 mr-1" />
                Manage
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onDelete(skill.id)}
                className="hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{skill.credit_price}</span>
              <span className="text-muted-foreground">credits</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">
                {skill.duration_minutes ? `${Math.round(skill.duration_minutes / 60)}h` : 'Flexible'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">
                {new Date(skill.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Enrollments</span>
              <span className="font-medium">{skill.enrollment_count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rating</span>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">4.5</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LearningSkillCard = ({ skill, onContinue }: { skill: any; onContinue: (id: string) => void }) => {
  const progress = skill.course_progress?.[0]?.progress_percent || 0;
  const isCompleted = progress === 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-2">
                <span className="text-lg font-bold">{skill.skill_listings?.title || 'Unknown Skill'}</span>
                {isCompleted && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getStatusColor(isCompleted ? 'completed' : 'in-progress')}`}>
                  {isCompleted ? 'Completed' : 'In Progress'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {skill.skill_listings?.skills?.category || 'General'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Instructor: {skill.skill_listings?.profiles?.full_name || 'Unknown'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onContinue(skill.skill_listing_id)}
                className="hover:bg-primary hover:text-primary-foreground"
              >
                <Play className="h-4 w-4 mr-1" />
                {isCompleted ? 'Review' : 'Continue'}
              </Button>
              {isCompleted && !skill.rating && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => onContinue(skill.skill_listing_id)}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Rate
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{skill.amount_paid}</span>
              <span className="text-muted-foreground">credits paid</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">
                {new Date(skill.purchased_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Next Steps */}
          {!isCompleted && (
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center space-x-2 text-blue-400">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Next: Complete Module 2</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatsOverview = ({ teachingSkills, learningSkills, userCredits }: {
  teachingSkills: any[];
  learningSkills: any[];
  userCredits: number;
}) => {
  const totalEarnings = teachingSkills.reduce((sum, skill) => sum + (skill.credit_price || 0), 0);
  const totalSpent = learningSkills.reduce((sum, skill) => sum + (skill.amount_paid || 0), 0);
  const completedCourses = learningSkills.filter(skill => 
    skill.course_progress?.[0]?.progress_percent === 100
  ).length;
  const averageProgress = learningSkills.length > 0 
    ? learningSkills.reduce((sum, skill) => sum + (skill.course_progress?.[0]?.progress_percent || 0), 0) / learningSkills.length
    : 0;

  const stats = [
    {
      title: 'Credits Balance',
      value: userCredits,
      icon: Coins,
      color: 'text-yellow-500',
      description: 'Available credits'
    },
    {
      title: 'Skills Taught',
      value: teachingSkills.length,
      icon: BookOpen,
      color: 'text-blue-500',
      description: 'Courses created'
    },
    {
      title: 'Courses Completed',
      value: completedCourses,
      icon: CheckCircle,
      color: 'text-green-500',
      description: 'Finished learning'
    },
    {
      title: 'Average Progress',
      value: `${averageProgress.toFixed(0)}%`,
      icon: BarChart3,
      color: 'text-purple-500',
      description: 'Learning progress'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-primary/10`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

const MySkillsProduction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('teaching');
  
  const { data: userSkills, isLoading: skillsLoading } = useUserSkills();
  const { data: userCredits = 0 } = useUserCredits();

  const teachingSkills = userSkills?.teaching || [];
  const learningSkills = userSkills?.learning || [];

  const handleDeleteSkill = async (skillId: string) => {
    if (!window.confirm("Are you sure you want to delete this skill? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('skill_listings')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast.success('Skill deleted successfully');
      // TODO: Invalidate queries to refresh data
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      toast.error(`Failed to delete skill: ${error.message}`);
    }
  };

  const handleContinueLearning = (skillId: string) => {
    navigate(`/my-course/${skillId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">👤</div>
            <h3 className="text-lg font-semibold mb-2">Not Signed In</h3>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your skills.
            </p>
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
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
            My Skills
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Manage the skills you teach and track your progress on the skills you're learning.
          </p>
        </motion.div>

        {/* Stats Overview */}
        <StatsOverview 
          teachingSkills={teachingSkills}
          learningSkills={learningSkills}
          userCredits={userCredits}
        />

        {/* Skills Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="teaching" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Teaching ({teachingSkills.length})</span>
              </TabsTrigger>
              <TabsTrigger value="learning" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Learning ({learningSkills.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="teaching" className="space-y-6">
              {skillsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SkillCardSkeleton key={index} />
                  ))}
                </div>
              ) : teachingSkills.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold mb-2">No Teaching Skills Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start sharing your knowledge by creating your first skill!
                  </p>
                  <Button 
                    onClick={() => navigate('/create-skill')}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Create Your First Skill
                  </Button>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {teachingSkills.map((skill) => (
                    <TeachingSkillCard
                      key={skill.id}
                      skill={skill}
                      onDelete={handleDeleteSkill}
                    />
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="learning" className="space-y-6">
              {skillsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <SkillCardSkeleton key={index} />
                  ))}
                </div>
              ) : learningSkills.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold mb-2">No Learning Skills Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Discover amazing skills to learn from our community!
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/marketplace')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {learningSkills.map((skill) => (
                    <LearningSkillCard
                      key={skill.id}
                      skill={skill}
                      onContinue={handleContinueLearning}
                    />
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default MySkillsProduction;
