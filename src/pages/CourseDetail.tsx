import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  MessageSquare, 
  FileText, 
  Calendar,
  Clock,
  Star,
  CheckCircle,
  Play,
  Download,
  Trophy,
  Target,
  TrendingUp
} from "lucide-react";
import ChatProduction from "@/components/ChatProduction";

interface CourseDetailData {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    username: string;
    avatar_url: string;
    level: number;
    credits: number;
  };
  progress: {
    percentage: number;
    completed_assignments: number;
    total_assignments: number;
    enrolled_at: string;
    last_activity: string;
    completed_at?: string;
  };
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    due_date: string | null;
    max_points: number;
    status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
    grade?: number;
    submitted_at?: string;
  }>;
  materials: Array<{
    id: string;
    title: string;
    description: string;
    file_name: string;
    file_url: string;
    file_size: number;
    created_at: string;
  }>;
  recent_activity: Array<{
    id: string;
    activity_type: string;
    description: string;
    created_at: string;
  }>;
  isInstructor: boolean;
}

const CourseDetail = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [courseData, setCourseData] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (skillId) {
      fetchCourseDetail();
    }
  }, [skillId]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch course basic info
      const { data: courseInfo, error: courseError } = await supabase
        .from('skill_listings')
        .select(`
          id,
          title,
          description,
          user_id,
          profiles (
            username,
            full_name,
            avatar_url,
            level,
            credits
          )
        `)
        .eq('id', skillId)
        .eq('is_active', true)
        .single();

      if (courseError) throw courseError;
      if (!courseInfo) throw new Error('Course not found');

      const isInstructor = courseInfo.user_id === user.id;

      // Fetch progress data
      const { data: progressData } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('skill_listing_id', skillId)
        .single();

      // Fetch assignments with submission status
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          max_points,
          created_at,
          assignment_submissions!left (
            id,
            student_id,
            submitted_at,
            grade
          )
        `)
        .eq('skill_listing_id', skillId)
        .order('created_at', { ascending: false });

      // Process assignments with status
      const assignments = (assignmentsData || []).map(assignment => {
        const userSubmission = assignment.assignment_submissions?.find(
          (sub: any) => sub.student_id === user.id
        );
        
        let status: 'not_started' | 'in_progress' | 'submitted' | 'graded' = 'not_started';
        if (userSubmission) {
          if (userSubmission.grade !== null) {
            status = 'graded';
          } else {
            status = 'submitted';
          }
        }

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.due_date,
          max_points: assignment.max_points,
          status,
          grade: userSubmission?.grade,
          submitted_at: userSubmission?.submitted_at
        };
      });

      // Fetch materials
      const { data: materialsData } = await supabase
        .from('course_materials')
        .select(`
          id,
          title,
          description,
          file_name,
          file_url,
          file_size,
          created_at
        `)
        .eq('skill_listing_id', skillId)
        .order('created_at', { ascending: false });

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('course_activity')
        .select(`
          id,
          activity_type,
          activity_data,
          created_at
        `)
        .eq('user_id', user.id)
        .eq('skill_listing_id', skillId)
        .order('created_at', { ascending: false })
        .limit(10);

      const recent_activity = (activityData || []).map(activity => ({
        id: activity.id,
        activity_type: activity.activity_type,
        description: getActivityDescription(activity.activity_type, activity.activity_data),
        created_at: activity.created_at
      }));

      setCourseData({
        id: courseInfo.id,
        title: courseInfo.title,
        description: courseInfo.description,
        instructor: {
          name: courseInfo.profiles.full_name || courseInfo.profiles.username,
          username: courseInfo.profiles.username,
          avatar_url: courseInfo.profiles.avatar_url,
          level: courseInfo.profiles.level,
          credits: courseInfo.profiles.credits
        },
        progress: {
          percentage: progressData?.progress_percentage || 0,
          completed_assignments: progressData?.completed_assignments || 0,
          total_assignments: progressData?.total_assignments || assignments.length,
          enrolled_at: progressData?.enrolled_at || new Date().toISOString(),
          last_activity: progressData?.last_activity || new Date().toISOString(),
          completed_at: progressData?.completed_at
        },
        assignments,
        materials: materialsData || [],
        recent_activity,
        isInstructor
      });

    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to load course details",
        variant: "destructive"
      });
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const getActivityDescription = (type: string, data: any) => {
    switch (type) {
      case 'enrolled':
        return 'Enrolled in the course';
      case 'assignment_submitted':
        return `Submitted assignment: ${data?.assignment_title || 'Unknown'}`;
      case 'material_viewed':
        return `Viewed material: ${data?.material_title || 'Unknown'}`;
      case 'chat_message':
        return 'Sent a message in course chat';
      case 'video_call':
        return 'Joined video call';
      case 'completed':
        return 'Completed the course!';
      default:
        return 'Course activity';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded': return 'bg-green-500';
      case 'submitted': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'graded': return 'Graded';
      case 'submitted': return 'Submitted';
      case 'in_progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Course Not Found</h1>
          <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/marketplace')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/my-skills')} 
                variant="ghost" 
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Skills
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{courseData.title}</h1>
                <p className="text-muted-foreground">by {courseData.instructor.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {courseData.progress.completed_at && (
                <Badge variant="secondary" className="bg-green-500">
                  <Trophy className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {courseData.isInstructor && (
                <Badge variant="outline">Instructor</Badge>
              )}
            </div>
          </div>

          {/* Progress Overview */}
          <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Your Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {courseData.progress.percentage}%
                  </span>
                </div>
                <Progress value={courseData.progress.percentage} className="h-2" />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {courseData.progress.completed_assignments}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {courseData.progress.total_assignments}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {courseData.materials.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Materials</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gaming">
                      {courseData.recent_activity.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Activities</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignments">
                Assignments ({courseData.assignments.length})
              </TabsTrigger>
              <TabsTrigger value="materials">
                Materials ({courseData.materials.length})
              </TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Description */}
                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Course Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {courseData.description || "No description available."}
                    </p>
                  </CardContent>
                </Card>

                {/* Instructor Info */}
                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={courseData.instructor.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-foreground">
                          {courseData.instructor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{courseData.instructor.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Level {courseData.instructor.level} • {courseData.instructor.credits} credits
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {courseData.recent_activity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {courseData.recent_activity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <h2 className="text-2xl font-bold">Assignments</h2>
              
              {courseData.assignments.length === 0 ? (
                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                    <p className="text-muted-foreground">
                      {courseData.isInstructor 
                        ? "Create assignments to help students learn." 
                        : "No assignments have been posted yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {courseData.assignments.map((assignment) => (
                    <Card key={assignment.id} className="bg-gradient-glass backdrop-blur-sm border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-xl font-semibold">{assignment.title}</h3>
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(assignment.status)}`}></div>
                              <Badge variant="outline" className="text-xs">
                                {getStatusText(assignment.status)}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{assignment.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {assignment.due_date 
                                    ? `Due: ${new Date(assignment.due_date).toLocaleDateString()}`
                                    : 'No due date'
                                  }
                                </span>
                              </div>
                              <span>{assignment.max_points} points</span>
                              {assignment.grade !== undefined && (
                                <span className="text-green-500 font-medium">
                                  Grade: {assignment.grade}/{assignment.max_points}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {assignment.status === 'not_started' ? (
                              <Button variant="outline" size="sm">
                                <Play className="h-4 w-4 mr-2" />
                                Start Assignment
                              </Button>
                            ) : assignment.status === 'submitted' ? (
                              <Button variant="outline" size="sm" disabled>
                                Submitted
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-4">
              <h2 className="text-2xl font-bold">Course Materials</h2>
              
              {courseData.materials.length === 0 ? (
                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
                    <p className="text-muted-foreground">
                      {courseData.isInstructor 
                        ? "Upload course materials to help students learn." 
                        : "No materials have been uploaded yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {courseData.materials.map((material) => (
                    <Card key={material.id} className="bg-gradient-glass backdrop-blur-sm border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <h3 className="text-lg font-semibold">{material.title}</h3>
                              <p className="text-muted-foreground">{material.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                <span>{material.file_name}</span>
                                <span>{formatFileSize(material.file_size)}</span>
                                <span>{new Date(material.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="space-y-4">
              <h2 className="text-2xl font-bold">Course Chat</h2>
              <ChatProduction 
                skillId={skillId!} 
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
