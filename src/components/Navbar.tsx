import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";
import { 
  Home, 
  Store, 
  Trophy, 
  BookOpen, 
  Plus, 
  User, 
  LogOut, 
  CreditCard,
  Menu,
  X,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";

interface AuthUserInfo {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  credits_balance?: number;
}

const purgeSupabaseSessionKeys = () => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (key.startsWith("sb-") && key.includes("-auth-token")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (_) {
    // ignore
  }
};

const Navbar = () => {
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled && user) {
        setUser({ 
          id: user.id, 
          email: user.email || undefined 
        });
        
        // Fetch user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUser(prev => prev ? {
            ...prev,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            credits_balance: profile.credits || 0
          } : null);
        }
      }
    })();
    
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email || undefined 
        });
      } else {
        setUser(null);
      }
    });
    
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    purgeSupabaseSessionKeys();
    navigate("/login");
  };

  const handleNavClick = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Marketplace", href: "/marketplace", icon: Store },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { label: "My Skills", href: "/my-skills", icon: BookOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
          <div className="relative">
            <motion.div
              className="text-2xl font-bold italic text-primary"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-primary">S</span>
              <span className="text-foreground">killswap</span>
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-primary/10 rounded-lg blur-sm -z-10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                isActive(item.href) 
                  ? 'bg-primary text-primary-foreground shadow-glow' 
                  : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <DarkModeToggle />
          
          {user ? (
            <>
              {/* Credits Display */}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
                    <CreditCard className="h-4 w-4" />
                    <span>{user.credits_balance || 0}</span>
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Credits Balance</h4>
                    <p className="text-sm text-muted-foreground">
                      You have {user.credits_balance || 0} credits available for purchasing skills.
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Earn credits by teaching skills to other students!
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.full_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavClick('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick('/create-skill')}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create Skill</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => handleNavClick('/login')}>
                Sign in
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleNavClick('/create-skill')}>
                Create Skill
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full text-left ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;