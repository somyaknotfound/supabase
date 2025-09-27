import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMarketplaceData, useSkillPurchase, useUserCredits, useUserSkills } from '@/hooks/useGlobalState';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  Zap, 
  TrendingUp,
  BookOpen,
  Play,
  CheckCircle,
  Coins,
  Award,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';

const SkillCard = ({ skill, onPurchase, isPurchased, userCredits, loading }: {
  skill: any;
  onPurchase: (skillId: string, cost: number, discount: number) => void;
  isPurchased: boolean;
  userCredits: number;
  loading: boolean;
}) => {
  const navigate = useNavigate();
  const [discount, setDiscount] = useState(0);

  // Calculate discount based on credit similarity
  React.useEffect(() => {
    const calculateDiscount = async () => {
      try {
        const { data } = await supabase.rpc('calculate_credit_discount', {
          tutor_credits: skill.profiles.credits,
          student_credits: userCredits
        });
        setDiscount(data || 0);
      } catch (error) {
        console.error('Error calculating discount:', error);
        setDiscount(0);
      }
    };

    if (userCredits > 0) {
      calculateDiscount();
    }
  }, [skill.profiles.credits, userCredits]);

  const finalPrice = Math.round(skill.credit_price * (100 - discount) / 100);
  const savings = skill.credit_price - finalPrice;

  const handlePurchase = () => {
    if (isPurchased) {
      navigate(`/my-course/${skill.id}`);
      return;
    }

    if (userCredits < finalPrice) {
      toast.error('Insufficient credits! Earn more by teaching skills.');
      return;
    }

    onPurchase(skill.id, skill.credit_price, discount);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group relative overflow-hidden bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow">
        {/* Trending Badge */}
        {skill.is_trending && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse">
              <Flame className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              {discount}% OFF
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                {skill.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {skill.skills?.category || 'General'}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    skill.skills?.difficulty_level === 'beginner' ? 'text-green-500' :
                    skill.skills?.difficulty_level === 'intermediate' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}
                >
                  {skill.skills?.difficulty_level || 'Beginner'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Instructor Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={skill.profiles?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                {skill.profiles?.full_name?.charAt(0) || skill.profiles?.username?.charAt(0) || 'I'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {skill.profiles?.full_name || skill.profiles?.username || 'Unknown Instructor'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  LVL {skill.profiles?.level || 1}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>4.5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>{skill.duration_minutes ? `${Math.round(skill.duration_minutes / 60)}h` : 'Flexible'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span>{skill.enrollment_count || 0} students</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Price</span>
              </div>
              <div className="text-right">
                {discount > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{finalPrice}</span>
                      <span className="text-sm text-muted-foreground line-through">{skill.credit_price}</span>
                    </div>
                    <div className="text-xs text-green-500">
                      Save {savings} credits!
                    </div>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-primary">{skill.credit_price}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handlePurchase}
            disabled={loading}
            className={`w-full ${
              isPurchased 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gradient-primary hover:opacity-90'
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : isPurchased ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                View Course
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Enroll Now
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MarketplaceSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, index) => (
      <Card key={index} className="bg-gradient-card border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const MarketplaceProduction = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'rating'>('newest');

  const { data: skills = [], isLoading, error } = useMarketplaceData();
  const { data: userCredits = 0 } = useUserCredits();
  const purchaseMutation = useSkillPurchase();

  // Get user's purchased skills
  const { data: userSkills } = useUserSkills();
  const purchasedSkillIds = new Set(
    userSkills?.learning?.map((skill: any) => skill.skill_listing_id) || []
  );

  const categories = [
    { name: 'Programming', icon: '💻', count: 0 },
    { name: 'Design', icon: '🎨', count: 0 },
    { name: 'Music', icon: '🎵', count: 0 },
    { name: 'Photography', icon: '📸', count: 0 },
    { name: 'Languages', icon: '🌍', count: 0 },
    { name: 'Business', icon: '💼', count: 0 },
  ];

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let filtered = skills.filter((skill: any) => {
      const matchesSearch = searchQuery === '' || 
        skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.skills?.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || 
        skill.skills?.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Sort skills
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'price':
          return a.credit_price - b.credit_price;
        case 'rating':
          return 4.5 - 4.5; // Default rating for now
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [skills, searchQuery, selectedCategory, sortBy]);

  const handlePurchase = (skillId: string, cost: number, discount: number) => {
    purchaseMutation.mutate({ skillId, cost, discount });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="text-destructive mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Marketplace</h3>
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
            Skill Marketplace
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover and learn new skills from a vibrant community of instructors.
            {user && (
              <span className="block mt-2 text-sm">
                You have <span className="font-bold text-primary">{userCredits}</span> credits available
              </span>
            )}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8 space-y-6"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for skills, instructors, or categories..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gradient-card border-border/50 focus:border-primary transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.name ? null : category.name
                )}
                className="flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex gap-2">
              {[
                { value: 'newest', label: 'Newest' },
                { value: 'price', label: 'Price' },
                { value: 'rating', label: 'Rating' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={sortBy === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option.value as any)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skills Grid */}
        {isLoading ? (
          <MarketplaceSkeleton />
        ) : filteredSkills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No Skills Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory
                ? "Try adjusting your search or filters."
                : "No skills available yet. Be the first to create one!"
              }
            </p>
            {user && (
              <Button onClick={() => navigate('/create-skill')}>
                Create Your First Skill
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredSkills.map((skill: any) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onPurchase={handlePurchase}
                  isPurchased={purchasedSkillIds.has(skill.id)}
                  userCredits={userCredits}
                  loading={purchaseMutation.isPending}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceProduction;
