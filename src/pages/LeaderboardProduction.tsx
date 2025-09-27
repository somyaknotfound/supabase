import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLeaderboardData } from '@/hooks/useGlobalState';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown, 
  Flame, 
  TrendingUp, 
  TrendingDown,
  Star,
  Users,
  Coins,
  Calendar,
  Clock,
  Zap,
  Gem,
  Target,
  BookOpen
} from 'lucide-react';

type TimePeriod = 'weekly' | 'monthly' | 'all_time';

const LeaderboardSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 rounded-lg bg-gradient-card">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

const RankIcon = ({ rank }: { rank: number }) => {
  switch (rank) {
    case 1:
      return <Crown className="h-8 w-8 text-yellow-500 animate-pulse" />;
    case 2:
      return <Medal className="h-8 w-8 text-gray-400" />;
    case 3:
      return <Award className="h-8 w-8 text-amber-600" />;
    default:
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
          <span className="text-sm font-bold">#{rank}</span>
        </div>
      );
  }
};

const RankBadge = ({ rank, isTrending }: { rank: number; isTrending: boolean }) => {
  if (rank <= 3) {
    const badges = {
      1: { text: "🏆 Champion", className: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white animate-bounce" },
      2: { text: "🥈 Runner-up", className: "bg-gradient-to-r from-gray-300 to-gray-500 text-white" },
      3: { text: "🥉 Third Place", className: "bg-gradient-to-r from-amber-400 to-amber-600 text-white" }
    };
    const badge = badges[rank as keyof typeof badges];
    return (
      <Badge className={`${badge.className} text-xs`}>
        {badge.text}
      </Badge>
    );
  }

  if (isTrending) {
    return (
      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse text-xs">
        <Flame className="h-3 w-3 mr-1" />
        🔥 Trending
      </Badge>
    );
  }

  return null;
};

const LeaderboardItem = ({ user, index }: { user: any; index: number }) => {
  const navigate = useNavigate();

  const handleUserClick = () => {
    navigate(`/instructor/${user.username || user.user_id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        layout: { duration: 0.3 }
      }}
      onClick={handleUserClick}
      className={`group flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 hover:shadow-glow cursor-pointer ${
        user.rank_position <= 3
          ? 'bg-gradient-hero border border-accent/30 shadow-accent hover:shadow-accent'
          : 'bg-gradient-card hover:bg-muted/50 hover:scale-[1.02]'
      }`}
      whileHover={{ scale: user.rank_position <= 3 ? 1.01 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Rank Icon */}
      <motion.div
        className="flex items-center justify-center w-12 h-12"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 + 0.2 }}
      >
        <RankIcon rank={user.rank_position} />
      </motion.div>

      {/* Avatar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.3 }}
      >
        <Avatar className="h-12 w-12 border-2 border-primary/30 group-hover:border-primary/60 transition-colors">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="bg-gradient-primary text-foreground font-semibold">
            {user.full_name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* User Info */}
      <motion.div
        className="flex-1 min-w-0"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.4 }}
      >
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {user.full_name}
          </h3>
          <Badge variant="secondary" className="text-xs">
            LVL {user.level}
          </Badge>
          <RankBadge rank={user.rank_position} isTrending={user.is_trending} />
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-500" />
            <span>{user.avg_rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3 text-blue-500" />
            <span>{user.skills_taught} skills</span>
          </div>
          <div className="flex items-center space-x-1">
            <Gem className="h-3 w-3 text-purple-500" />
            <span>{user.total_credits} credits</span>
          </div>
        </div>
      </motion.div>

      {/* Credits Display */}
      <motion.div
        className="text-right"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.5 }}
      >
        <div className="flex items-center space-x-1 text-accent font-bold mb-1">
          <Coins className="h-4 w-4" />
          <span className="text-lg">{user.total_credits}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Rank #{user.rank_position}
        </Badge>
      </motion.div>
    </motion.div>
  );
};

const EmptyState = ({ timePeriod }: { timePeriod: TimePeriod }) => {
  const navigate = useNavigate();

  const getTimePeriodText = () => {
    switch (timePeriod) {
      case 'weekly': return 'this week';
      case 'monthly': return 'this month';
      case 'all_time': return 'all time';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🏆
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">No Instructors Yet</h3>
      <p className="text-muted-foreground mb-6">
        {timePeriod === 'all_time'
          ? "Be the first to teach a skill and appear on the leaderboard!"
          : `No activity ${getTimePeriodText()}. Check back later!`
        }
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={() => navigate('/create-skill')}
          className="bg-gradient-primary hover:opacity-90"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Create Your First Skill
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/marketplace')}
        >
          <Target className="h-4 w-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>
    </motion.div>
  );
};

const LeaderboardProduction = () => {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all_time');
  
  const { data: users = [], isLoading, error } = useLeaderboardData(timePeriod);

  const getTimePeriodIcon = (period: TimePeriod) => {
    switch (period) {
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'monthly': return <Clock className="h-4 w-4" />;
      case 'all_time': return <Trophy className="h-4 w-4" />;
    }
  };

  const getTimePeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'all_time': return 'All-Time';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-destructive mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Leaderboard</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
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
            Top Instructors
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Top performers in the SkillSwap community. Teach skills, earn credits, and climb the ranks!
          </p>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-accent" />
                  <span>Leaderboard</span>
                </CardTitle>
                <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="weekly" className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span className="hidden sm:inline">Weekly</span>
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span className="hidden sm:inline">Monthly</span>
                    </TabsTrigger>
                    <TabsTrigger value="all_time" className="flex items-center space-x-1">
                      <Trophy className="h-3 w-3" />
                      <span className="hidden sm:inline">All-Time</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <LeaderboardSkeleton />
              ) : users.length === 0 ? (
                <EmptyState timePeriod={timePeriod} />
              ) : (
                <AnimatePresence mode="popLayout">
                  {users.map((user: any, index: number) => (
                    <LeaderboardItem
                      key={user.user_id}
                      user={user}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardProduction;
