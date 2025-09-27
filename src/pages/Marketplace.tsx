import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkillCard } from "@/components/SkillCard";
import { Search, Code, Music, Palette, Camera, Globe, TrendingUp, Filter } from "lucide-react";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useSkillPurchase } from "@/hooks/useSkillPurchase";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CardSkeleton } from "@/components/ui/skeleton";

const Marketplace = () => {
  const { skills, loading, error, currentUserCredits, refetch, isSkillPurchased } = useMarketplace();
  const { purchaseSkill, loading: purchaseLoading } = useSkillPurchase();
  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { name: "Programming", icon: Code, count: 124, color: "text-primary" },
    { name: "Design", icon: Palette, count: 89, color: "text-secondary" },
    { name: "Music", icon: Music, count: 67, color: "text-accent" },
    { name: "Photography", icon: Camera, count: 45, color: "text-success" },
    { name: "Languages", icon: Globe, count: 156, color: "text-destructive" },
    { name: "Business", icon: TrendingUp, count: 78, color: "text-muted-foreground" },
  ];

  // Calculate discounts for all skills
  useEffect(() => {
    const calculateDiscounts = async () => {
      if (currentUserCredits === 0 || skills.length === 0) return;
      
      const newDiscounts: Record<string, number> = {};
      
      for (const skill of skills) {
        try {
          const { data } = await supabase.rpc('calculate_credit_discount', {
            tutor_credits: skill.profiles.credits,
            student_credits: currentUserCredits
          });
          newDiscounts[skill.id] = data || 0;
        } catch (error) {
          console.error('Error calculating discount for skill:', skill.id, error);
          newDiscounts[skill.id] = 0;
        }
      }
      
      setDiscounts(newDiscounts);
    };

    calculateDiscounts();
  }, [skills, currentUserCredits]);

  const handleLearnSkill = async (skillId: string) => {
    const result = await purchaseSkill(skillId);
    if (result.success) {
      refetch(); // Refresh the marketplace data
    }
  };

  // Filter skills based on selected category and search query
  const filteredSkills = skills.filter(skill => {
    const matchesCategory = !selectedCategory || skill.skills.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.skills.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.profiles.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get actual counts for each category
  const getCategoryCount = (categoryName: string) => {
    return skills.filter(skill => 
      skill.skills.category.toLowerCase() === categoryName.toLowerCase()
    ).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Skill Marketplace
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover amazing skills taught by expert instructors. Earn credits by teaching and spend them to learn new abilities.
            </p>
          </div>

          {/* Search and Categories */}
          <div className="space-y-6">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border/50 focus:border-primary/50"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card 
                key="all" 
                className={`bg-gradient-glass backdrop-blur-sm border-border/50 hover:shadow-glow transition-smooth cursor-pointer group ${
                  selectedCategory === null ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                <CardContent className="p-4 text-center">
                  <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center bg-primary/20 rounded-full">
                    <span className="text-primary font-bold">All</span>
                  </div>
                  <h3 className="font-semibold text-sm">All Skills</h3>
                  <p className="text-xs text-muted-foreground">{skills.length} skills</p>
                </CardContent>
              </Card>
              {categories.map((category) => (
                <Card 
                  key={category.name} 
                  className={`bg-gradient-glass backdrop-blur-sm border-border/50 hover:shadow-glow transition-smooth cursor-pointer group ${
                    selectedCategory === category.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardContent className="p-4 text-center">
                    <category.icon className={`h-8 w-8 mx-auto mb-2 ${category.color} group-hover:animate-scale-bounce`} />
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{getCategoryCount(category.name)} skills</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* User Credits Display */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-glass backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2">
              <span className="text-sm text-muted-foreground">Your Credits:</span>
              <span className="text-lg font-bold text-accent">{currentUserCredits}</span>
            </div>
          </div>

          {/* Category Filter Display */}
          {selectedCategory && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-gradient-glass backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2">
                <span className="text-sm text-muted-foreground">Showing:</span>
                <span className="text-lg font-bold text-primary">{selectedCategory}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs"
                >
                  ✕
                </Button>
              </div>
            </div>
          )}

          {/* Skills Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CardSkeleton />
                </motion.div>
              ))}
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={refetch} variant="outline">Try Again</Button>
            </motion.div>
          ) : filteredSkills.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? `No skills found in ${selectedCategory} category.` 
                  : searchQuery 
                    ? `No skills found matching "${searchQuery}".` 
                    : "No skills available yet. Be the first to create one!"
                }
              </p>
              {(selectedCategory || searchQuery) && (
                <Button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }} 
                  variant="outline" 
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filteredSkills.map((skill, index) => (
                  <motion.div
                    key={skill.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.1,
                      layout: { duration: 0.3 }
                    }}
                    whileHover={{ y: -5 }}
                  >
                    <SkillCard
                      skill={{
                        id: skill.id,
                        title: skill.title,
                        category: skill.skills.category,
                        instructor: {
                          name: skill.profiles.full_name || skill.profiles.username,
                          avatar: skill.profiles.avatar_url,
                          level: skill.profiles.level,
                          credits: skill.profiles.credits
                        },
                        duration: skill.duration_minutes ? `${Math.round(skill.duration_minutes / 60)} hours` : "Duration varies",
                        cost: skill.credit_price,
                        difficulty: (skill.skills.difficulty_level?.charAt(0).toUpperCase() + skill.skills.difficulty_level?.slice(1)) as any || "Beginner"
                      }}
                      onLearn={handleLearnSkill}
                      discountPercentage={discounts[skill.id] || 0}
                      currentUserCredits={currentUserCredits}
                      loading={purchaseLoading}
                      isPurchased={isSkillPurchased(skill.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;