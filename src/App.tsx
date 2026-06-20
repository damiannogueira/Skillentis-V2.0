import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PWAInstallProvider } from "@/hooks/use-pwa-install";
import { AuthProvider } from "@/hooks/use-auth";
import { AnalysisWatcherProvider } from "@/hooks/use-analysis-watcher";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import Compare from "./pages/Compare";
import Leaderboard from "./pages/Leaderboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import InstallPWA from "./components/InstallPWA";
import OnboardingTour from "./components/OnboardingTour";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <PWAInstallProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <InstallPWA />
            <BrowserRouter>
              <AnalysisWatcherProvider>
              <OnboardingTour />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile/:username" element={<PublicProfile />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/dashboard/:username" element={<Dashboard />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </AnalysisWatcherProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </PWAInstallProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
