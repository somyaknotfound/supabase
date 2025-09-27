import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Users, 
  Trophy,
  BookOpen,
  Target,
  Coins,
  Star,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0 
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex items-start space-x-3 p-4 rounded-lg bg-gradient-card border border-border/50 hover:border-primary/30 transition-all duration-300"
  >
    <div className="p-2 rounded-lg bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </motion.div>
);

const LoginProduction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for magic link callback
  React.useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type === 'magiclink') {
      // Handle magic link authentication
      toast.success('Magic link verified! Redirecting...');
      navigate('/');
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsLoading(true);
      await signIn(email.trim());
      setIsSubmitted(true);
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "Learn from Experts",
      description: "Access courses taught by industry professionals"
    },
    {
      icon: Target,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics"
    },
    {
      icon: Coins,
      title: "Earn Credits",
      description: "Teach skills and earn credits for your expertise"
    },
    {
      icon: Trophy,
      title: "Leaderboards",
      description: "Compete with other instructors and climb the ranks"
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with learners and instructors worldwide"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Your data is protected with enterprise-grade security"
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="bg-gradient-card border-border/50 shadow-card">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-6xl mb-4"
              >
                ✉️
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
              <p className="text-muted-foreground mb-6">
                We've sent a magic link to <strong>{email}</strong>. 
                Click the link to sign in to your account.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Link expires in 15 minutes</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full"
                >
                  Try Different Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-screen">
          {/* Left Side - Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center space-x-2"
              >
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <motion.div
                    className="absolute inset-0 bg-primary/20 rounded-full blur-sm"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  SkillSwap
                </h1>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-muted-foreground"
              >
                The ultimate platform for skill sharing and learning
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={0.4 + index * 0.1}
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex items-center space-x-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No password required</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Secure authentication</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <Card className="w-full max-w-md bg-gradient-card border-border/50 shadow-card">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <p className="text-muted-foreground">
                  Sign in to continue your learning journey
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Sending Magic Link...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Send Magic Link</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      By signing in, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </form>

                <div className="mt-6 pt-6 border-t border-border/50">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">New to SkillSwap?</p>
                    <div className="flex items-center justify-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Join 10,000+ learners
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Trophy className="h-3 w-3 mr-1" />
                        500+ instructors
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginProduction;
