import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { NavigationGuardProvider } from "@/contexts/NavigationGuardContext";
import Index from "./pages/Index";
import Why from "./pages/Why";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Create from "./pages/Create";
import Schedule from "./pages/Schedule";
import Analytics from "./pages/Analytics";
import Voice from "./pages/Voice";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Trending from "./pages/Trending";
import Drafts from "./pages/Drafts";
import Recommendations from "./pages/Recommendations";
import Published from "./pages/Published";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

import LinkedInCallback from "./pages/auth/LinkedInCallback";
import Waitlist from "./pages/Waitlist";

const AppRoutes = () => (
  <div className="dark">
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/why" element={<Why />} />
      <Route path="/waitlist" element={<Waitlist />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/auth/callback/linkedin" element={<ProtectedRoute><LinkedInCallback /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
      <Route path="/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
      <Route path="/published" element={<ProtectedRoute><Published /></ProtectedRoute>} />
      <Route path="/trending" element={<ProtectedRoute><Trending /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/voice" element={<ProtectedRoute><Voice /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NavigationGuardProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </NavigationGuardProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
