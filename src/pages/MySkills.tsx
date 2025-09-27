import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, Star, Edit, Eye, Trash2, Play, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TeachingSkill {
  id: string;
  title: string;
  category: string;
  description: string;
  credit_price: number;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  skills: {
    name: string;
    category: string;
    difficulty_level: string;
  };
}

interface LearningSkill {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  status: string;
  nextSession?: string;
  completedDate?: string;
  rating?: number;
  skill_listing_id: string;
  purchased_at: string;
  amount_paid: number;
  skills: {
    name: string;
    category: string;
    difficulty_level: string;
  };
}

const MySkills = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("teaching");
  const [teachingSkills, setTeachingSkills] = useState<TeachingSkill[]>([]);
  const [learningSkills, setLearningSkills] = useState<LearningSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTeachingSkills = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('skill_listings')
        .select(`
          id,
          title,
          description,
          credit_price,
          duration_minutes,
          is_active,
          created_at,
          skills (
            name,
            category,
            difficulty_level
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachingSkills(data || []);
    } catch (err: any) {
      toast({ title: "Failed to fetch teaching skills", description: err.message });
    }
  };

  const fetchLearningSkills = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's purchased skills from transactions
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          id,
          skill_listing_id,
          amount,
          created_at,
          skill_listings (
            id,
            title,
            description,
            skills (
              name,
              category,
              difficulty_level
            ),
            profiles (
              username,
              full_name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('transaction_type', 'purchase')
        .order('created_at', { ascending: false });

      if (transactionError) throw transactionError;

      // Transform the data to match our interface
      const purchasedSkills: LearningSkill[] = (transactions || []).map(transaction => ({
        id: transaction.id,
        title: transaction.skill_listings?.title || 'Unknown Skill',
        instructor: transaction.skill_listings?.profiles?.full_name || 
                   transaction.skill_listings?.profiles?.username || 
                   'Unknown Instructor',
        progress: Math.floor(Math.random() * 100), // TODO: Implement real progress tracking
        status: Math.random() > 0.5 ? 'in-progress' : 'completed',
        nextSession: Math.random() > 0.5 ? 'Tomorrow 2:00 PM' : undefined,
        completedDate: Math.random() > 0.5 ? new Date().toISOString().split('T')[0] : undefined,
        rating: Math.random() > 0.5 ? Math.round((4 + Math.random()) * 10) / 10 : undefined,
        skill_listing_id: transaction.skill_listing_id,
        purchased_at: transaction.created_at,
        amount_paid: transaction.amount,
        skills: transaction.skill_listings?.skills || {
          name: 'Unknown',
          category: 'General',
          difficulty_level: 'beginner'
        }
      }));

      setLearningSkills(purchasedSkills);
    } catch (err: any) {
      toast({ title: "Failed to fetch learning skills", description: err.message });
    }
  };

  useEffect(() => {
    const loadSkills = async () => {
      setLoading(true);
      await Promise.all([fetchTeachingSkills(), fetchLearningSkills()]);
      setLoading(false);
    };
    loadSkills();
  }, []);

  // Listen for focus events to refresh data when returning from other pages
  useEffect(() => {
    const handleFocus = () => {
      fetchLearningSkills();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);


  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300";
      case "inactive":
        return "bg-gray-500/20 text-gray-300";
      case "in-progress":
        return "bg-blue-500/20 text-blue-300";
      case "completed":
        return "bg-purple-500/20 text-purple-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            My Skills
          </h1>
          <p className="text-muted-foreground">
            Manage your teaching and learning journey
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
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

            <TabsContent value="teaching" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading your skills...</div>
              ) : teachingSkills.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Teaching Skills Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start sharing your knowledge by creating your first skill!
                  </p>
                  <Button
                    onClick={() => {
                      console.log('Create skill button clicked in MySkills');
                      navigate('/create-skill');
                    }}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Create Your First Skill
                  </Button>
                </div>
              ) : (
                teachingSkills.map((skill) => (
                  <Card key={skill.id} className="bg-gradient-glass backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="flex items-center space-x-2">
                            <span>{skill.title}</span>
                            <Badge variant="outline">{skill.skills?.category || 'General'}</Badge>
                          </CardTitle>
                          <Badge className={getStatusColor(skill.is_active ? 'active' : 'inactive')}>
                            {skill.is_active ? 'active' : 'inactive'}
                          </Badge>
                          {skill.description && (
                            <p className="text-sm text-muted-foreground">{skill.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/course/${skill.id}`)}
                            title="Manage Course"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{skill.credit_price}</div>
                          <div className="text-sm text-muted-foreground">Credits</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent">
                            {skill.duration_minutes ? `${skill.duration_minutes}m` : 'Flexible'}
                          </div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-success">
                            {skill.skills?.difficulty_level || 'beginner'}
                          </div>
                          <div className="text-sm text-muted-foreground">Level</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {new Date(skill.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Created</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="learning" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading your learning skills...</div>
              ) : learningSkills.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Learning Skills Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Discover amazing skills to learn from our community!
                  </p>
                  <Button
                    onClick={() => {
                      console.log('Browse marketplace button clicked in MySkills');
                      navigate('/marketplace');
                    }}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    Browse Marketplace
                  </Button>
                </div>
              ) : (
                learningSkills.map((skill) => (
                <Card key={skill.id} className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center space-x-2">
                          <span>{skill.title}</span>
                          {skill.status === "completed" && (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Instructor: {skill.instructor}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(skill.status)}>
                            {skill.status.replace("-", " ")}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {skill.skills.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {skill.amount_paid} credits
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/my-course/${skill.skill_listing_id}`)}
                          title="View Course Progress"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/my-course/${skill.skill_listing_id}`)}
                          title="View Course Progress"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {skill.status === "completed" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">100%</div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-2xl font-bold">{skill.rating}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">Your Rating</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">{skill.progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                            style={{ width: `${skill.progress}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{skill.nextSession}</div>
                          <div className="text-xs text-muted-foreground">Next Session</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MySkills;