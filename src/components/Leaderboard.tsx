import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Zap, Flame, Calendar, Clock, Star, Users, TrendingUp, TrendingDown, Crown, Gem } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LeaderboardUser, TimePeriod } from "@/hooks/useLeaderboard";
import { motion, AnimatePresence } from "framer-motion";
import { LeaderboardSkeleton } from "@/components/ui/skeleton";

interface LeaderboardProps {
  users: LeaderboardUser[];
  loading: boolean;
  error: string | null;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export const Leaderboard = ({ 
  users, 
  loading, 
  error, 
  timePeriod, 
  onTimePeriodChange 
}: LeaderboardProps) => {
  const navigate = useNavigate();

  const handleUserClick = (userId: string, username: string) => {
    navigate(`/instructor/${username || userId}`);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500 animate-pulse" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number, isTrending: boolean) => {
    if (rank <= 3) {
      const badges = {
        1: { icon: Crown, text: "🏆 Champion", variant: "default" as const, className: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white" },
        2: { icon: Medal, text: "🥈 Runner-up", variant: "secondary" as const, className: "bg-gradient-to-r from-gray-300 to-gray-500 text-white" },
        3: { icon: Award, text: "🥉 Third Place", variant: "outline" as const, className: "bg-gradient-to-r from-amber-400 to-amber-600 text-white" }
      };
      const badge = badges[rank as keyof typeof badges];
      return (
        <Badge className={`${badge.className} animate-bounce-in`}>
          <badge.icon className="h-3 w-3 mr-1" />
          {badge.text}
        </Badge>
      );
    }
    
    if (isTrending) {
      return (
        <Badge variant="destructive" className="animate-pulse-glow">
          <Flame className="h-3 w-3 mr-1" />
          🔥 Trending
        </Badge>
      );
    }
    
    return null;
  };

  const getRankDelta = (rank: number, previousRank?: number) => {
    if (!previousRank) return null;
    const delta = previousRank - rank;
    if (delta > 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center text-green-500 text-xs"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          +{delta}
        </motion.div>
      );
    } else if (delta < 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center text-red-500 text-xs"
        >
          <TrendingDown className="h-3 w-3 mr-1" />
          {Math.abs(delta)}
        </motion.div>
      );
    }
    return null;
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1: return "default";
      case 2: return "secondary";
      case 3: return "outline";
      default: return "outline";
    }
  };

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

  if (loading) {
    return (
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="p-8">
          <LeaderboardSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Leaderboard</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-glass backdrop-blur-sm border-border/50 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-accent" />
            <span>Top Instructors</span>
          </CardTitle>
          <Tabs value={timePeriod} onValueChange={onTimePeriodChange} className="w-auto">
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
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Instructors Yet</h3>
            <p className="text-muted-foreground mb-4">
              {timePeriod === 'weekly' 
                ? "No activity this week. Check back later!" 
                : timePeriod === 'monthly'
                ? "No activity this month. Check back later!"
                : "Be the first to teach a skill and appear on the leaderboard!"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => {
                  console.log('Create skill button clicked');
                  navigate('/create-skill');
                }}
                className="bg-gradient-primary hover:opacity-90"
              >
                Create Your First Skill
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Browse marketplace button clicked');
                  navigate('/marketplace');
                }}
              >
                Browse Marketplace
              </Button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {users.map((user, index) => (
              <motion.div
                key={user.user_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.1,
                  layout: { duration: 0.3 }
                }}
                onClick={() => handleUserClick(user.user_id, user.username)}
                className={`group flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 hover:shadow-glow cursor-pointer ${
                  user.rank_position <= 3 
                    ? 'bg-gradient-hero border border-accent/30 shadow-accent hover:shadow-accent' 
                    : 'bg-gradient-card hover:bg-muted/50 hover:scale-[1.02]'
                }`}
                whileHover={{ scale: user.rank_position <= 3 ? 1.01 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  className="flex items-center justify-center w-12 h-12"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {getRankIcon(user.rank_position)}
                </motion.div>
                
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
                    {getRankBadge(user.rank_position, user.is_trending)}
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
                
                <motion.div 
                  className="text-right"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <div className="flex items-center space-x-1 text-accent font-bold mb-1">
                    <span className="text-lg">{user.total_credits}</span>
                    <span className="text-sm">credits</span>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant="outline" className="text-xs">
                      Rank #{user.rank_position}
                    </Badge>
                    {getRankDelta(user.rank_position, user.previous_rank)}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};