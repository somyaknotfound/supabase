import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import MarketplaceProduction from "./pages/MarketplaceProduction";
import Profile from "./pages/Profile";
import ProfileProduction from "./pages/ProfileProduction";
import Leaderboard from "./pages/Leaderboard";
import LeaderboardProduction from "./pages/LeaderboardProduction";
import CreateSkill from "./pages/CreateSkill";
import MySkills from "./pages/MySkills";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import LoginProduction from "./pages/LoginProduction";
import SkillDetail from "./pages/SkillDetail";
import CourseManagement from "./pages/CourseManagement";
import CourseDetail from "./pages/CourseDetail";
import DataSeeder from "./pages/DataSeeder";
import RequireAuth from "@/components/RequireAuth";
import Navbar from "@/components/Navbar";
import GlobalLoadingBar from "@/components/GlobalLoadingBar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <GlobalLoadingBar />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/marketplace" element={<MarketplaceProduction />} />
              <Route path="/marketplace-legacy" element={<Marketplace />} />
              <Route path="/profile" element={<RequireAuth><ProfileProduction /></RequireAuth>} />
              <Route path="/profile-legacy" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/leaderboard" element={<LeaderboardProduction />} />
              <Route path="/leaderboard-legacy" element={<Leaderboard />} />
              <Route path="/create-skill" element={<RequireAuth><CreateSkill /></RequireAuth>} />
              <Route path="/my-skills" element={<RequireAuth><MySkills /></RequireAuth>} />
              <Route path="/skills/:skillId" element={<SkillDetail />} />
              <Route path="/course/:skillId" element={<RequireAuth><CourseManagement /></RequireAuth>} />
              <Route path="/my-course/:skillId" element={<RequireAuth><CourseDetail /></RequireAuth>} />
              <Route path="/data-seeder" element={<DataSeeder />} />
              <Route path="/login" element={<LoginProduction />} />
              <Route path="/login-legacy" element={<Login />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
