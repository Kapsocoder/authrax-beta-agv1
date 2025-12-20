import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PenSquare, TrendingUp, Calendar, Sparkles, ArrowRight, Zap, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { usePosts } from "@/hooks/usePosts";
import { useUserTopics } from "@/hooks/useUserTopics";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile, needsOnboarding, isLoading: profileLoading } = useProfile();
  const { voiceProfile } = useVoiceProfile();
  const { posts } = usePosts();
  const { topics } = useUserTopics();
  const [greeting, setGreeting] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if coming from LinkedIn OAuth onboarding
  const isLinkedInOnboarding = searchParams.get("onboarding") === "linkedin";

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (!profileLoading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [profileLoading, needsOnboarding]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={() => setShowOnboarding(false)} 
        isLinkedInLogin={isLinkedInOnboarding}
      />
    );
  }


  const quickActions = [
    {
      icon: PenSquare,
      label: "Create Post",
      description: "Write with AI assistance",
      path: "/create",
      gradient: "bg-gradient-primary",
    },
    {
      icon: Calendar,
      label: "Schedule",
      description: "Plan your content",
      path: "/schedule",
      gradient: "bg-gradient-accent",
    },
    {
      icon: Sparkles,
      label: "Train Voice",
      description: "Improve AI accuracy",
      path: "/voice",
      gradient: "from-warning to-orange-500",
    },
  ];

  const postsThisWeek = posts?.filter(p => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(p.created_at) > weekAgo;
  }).length || 0;

  const scheduledCount = posts?.filter(p => p.status === "scheduled").length || 0;
  const voiceScore = voiceProfile?.is_trained ? "85%" : "Train";

  const stats = [
    { label: "Posts This Week", value: String(postsThisWeek), icon: PenSquare },
    { label: "Total Impressions", value: "—", icon: TrendingUp },
    { label: "Scheduled", value: String(scheduledCount), icon: Clock },
    { label: "Voice Score", value: voiceScore, icon: Target },
  ];

  const userName = user?.user_metadata?.full_name || profile?.full_name || user?.email?.split('@')[0] || "there";

  const trendingTopics = topics.length > 0 
    ? topics.filter(t => t.is_active).map(t => t.name)
    : ["AI in Business", "Leadership", "Remote Work", "Career Growth", "Productivity", "Tech Trends"];

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Let's build your personal brand today
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-elevated bg-card border border-border"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${action.gradient} opacity-10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:opacity-20 transition-opacity`} />
              <div className={`w-12 h-12 rounded-xl ${action.gradient} bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg`}>
                <action.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                {action.label}
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trending Topics */}
        <Card className="bg-card border-border mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.slice(0, 6).map((topic) => (
                <button
                  key={topic}
                  onClick={() => navigate(`/create?topic=${encodeURIComponent(topic)}`)}
                  className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
            <Button variant="link" className="mt-4 p-0 text-primary" onClick={() => navigate("/settings")}>
              Manage your topics →
            </Button>
          </CardContent>
        </Card>

        {/* Recent Drafts Placeholder */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <PenSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No drafts yet</p>
              <Button variant="gradient" size="sm" onClick={() => navigate("/create")}>
                Create Your First Post
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
