import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  MessageSquare, 
  Upload, 
  FileText, 
  Calendar,
  Plus,
  Download,
  Send
} from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import ChatProduction from "@/components/ChatProduction";

interface CourseInfo {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    username: string;
    avatar_url: string;
  };
  isInstructor: boolean;
  enrolledStudents: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  max_points: number;
  created_at: string;
  submissions_count: number;
}

interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

const CourseManagement = () => {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showFileUpload, setShowFileUpload] = useState(false);

  useEffect(() => {
    if (skillId) {
      fetchCourseData();
    }
  }, [skillId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch course info
      const { data: courseData, error: courseError } = await supabase
        .from('skill_listings')
        .select(`
          id,
          title,
          description,
          user_id,
          profiles (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('id', skillId)
        .eq('is_active', true)
        .single();

      if (courseError) throw courseError;
      if (!courseData) throw new Error('Course not found');

      // Check if user is instructor
      const isInstructor = courseData.user_id === user.id;

      // Get enrolled students count
      const { count: enrolledCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('skill_listing_id', skillId)
        .eq('transaction_type', 'purchase');

      setCourseInfo({
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        instructor: {
          name: courseData.profiles.full_name || courseData.profiles.username,
          username: courseData.profiles.username,
          avatar_url: courseData.profiles.avatar_url
        },
        isInstructor,
        enrolledStudents: enrolledCount || 0
      });

      // Fetch assignments
      await fetchAssignments();
      
      // Fetch materials
      await fetchMaterials();

    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to load course data",
        variant: "destructive"
      });
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          max_points,
          created_at,
          assignment_submissions (id)
        `)
        .eq('skill_listing_id', skillId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assignmentsWithCounts = (data || []).map(assignment => ({
        ...assignment,
        submissions_count: assignment.assignment_submissions?.length || 0
      }));

      setAssignments(assignmentsWithCounts);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!courseInfo) {
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
                onClick={() => navigate('/marketplace')} 
                variant="ghost" 
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{courseInfo.title}</h1>
                <p className="text-muted-foreground">by {courseInfo.instructor.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {courseInfo.enrolledStudents} students
              </Badge>
              {courseInfo.isInstructor && (
                <Badge variant="secondary">Instructor</Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignments">
                Assignments ({assignments.length})
              </TabsTrigger>
              <TabsTrigger value="materials">
                Materials ({materials.length})
              </TabsTrigger>
              <TabsTrigger value="chat">
                Chat
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Course Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {courseInfo.description || "No description available."}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{assignments.length}</div>
                    <div className="text-sm text-muted-foreground">Assignments</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardContent className="p-6 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-accent" />
                    <div className="text-2xl font-bold">{materials.length}</div>
                    <div className="text-sm text-muted-foreground">Materials</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-success" />
                    <div className="text-2xl font-bold">{courseInfo.enrolledStudents}</div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Assignments</h2>
                {courseInfo.isInstructor && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                )}
              </div>

              {assignments.length === 0 ? (
                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                    <p className="text-muted-foreground">
                      {courseInfo.isInstructor 
                        ? "Create your first assignment to get started." 
                        : "No assignments have been posted yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="bg-gradient-glass backdrop-blur-sm border-border/50">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold">{assignment.title}</h3>
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
                              {courseInfo.isInstructor && (
                                <span>{assignment.submissions_count} submissions</span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {courseInfo.isInstructor ? (
                              <>
                                <Button variant="outline" size="sm">
                                  View Submissions
                                </Button>
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              </>
                            ) : (
                              <Button variant="outline" size="sm">
                                Submit Assignment
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Course Materials</h2>
                {courseInfo.isInstructor && (
                  <Button onClick={() => setShowFileUpload(!showFileUpload)}>
                    <Upload className="h-4 w-4 mr-2" />
                    {showFileUpload ? 'Cancel Upload' : 'Upload Material'}
                  </Button>
                )}
              </div>

              {showFileUpload && courseInfo.isInstructor && (
                <FileUpload
                  skillListingId={skillId!}
                  onUploadComplete={() => {
                    setShowFileUpload(false);
                    fetchMaterials();
                  }}
                  onCancel={() => setShowFileUpload(false)}
                />
              )}

              {materials.length === 0 ? (
                <Card className="bg-gradient-glass backdrop-blur-sm border-border/50">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
                    <p className="text-muted-foreground">
                      {courseInfo.isInstructor 
                        ? "Upload your first course material to get started." 
                        : "No materials have been uploaded yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {materials.map((material) => (
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
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Course Chat</h2>
              </div>

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

export default CourseManagement;
