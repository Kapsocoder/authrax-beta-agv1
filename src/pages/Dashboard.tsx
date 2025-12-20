import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  PenSquare, 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Clock, 
  Target,
  Mic,
  Edit3,
  Link2,
  Video,
  FileText,
  Newspaper,
  MessageCircle,
  ExternalLink,
  Loader2
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Post } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { TrendingTemplates } from "@/components/templates/TrendingTemplates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { usePosts } from "@/hooks/usePosts";
import { useUserTopics } from "@/hooks/useUserTopics";
import { useTrending } from "@/hooks/useTrending";
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

  // "What's on your mind?" capture options
  const captureOptions = [
    {
      icon: Mic,
      label: "Capture an Idea",
      description: "Voice notes on the go",
      path: "/create",
      state: { mode: "voice" },
      gradient: "bg-gradient-primary",
    },
    {
      icon: Edit3,
      label: "Draft a Post",
      description: "Write with personal touch",
      path: "/create",
      state: { mode: "draft" },
      gradient: "bg-gradient-accent",
    },
    {
      icon: Calendar,
      label: "Schedule for later",
      description: "Plan your content",
      path: "/schedule",
      gradient: "from-warning to-orange-500",
    },
    {
      icon: Link2,
      label: "Import a link",
      description: "Turn articles into posts",
      path: "/create",
      state: { mode: "url" },
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Video,
      label: "From a Video",
      description: "Repurpose video content",
      path: "/create",
      state: { mode: "video" },
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: FileText,
      label: "Repurpose a PDF",
      description: "Transform documents",
      path: "/create",
      state: { mode: "pdf" },
      gradient: "from-purple-500 to-violet-500",
    },
  ];

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

  // Fetch trending data based on user's topics
  const { data: trendingData, isLoading: trendingLoading } = useTrending(trendingTopics);

  // Recent drafts - sorted by updated_at, show most recent 3
  const recentDrafts = useMemo(() => {
    return (posts || [])
      .filter(p => p.status === "draft")
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
  }, [posts]);

  const formatTimeAgo = (timestamp: number | string) => {
    const date = typeof timestamp === "number" ? new Date(timestamp * 1000) : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
  };

  // Smart edit routing - if draft has generated content (is_ai_generated), go to Edit mode
  // Otherwise go to Studio to continue working on it
  const handleEditDraft = (draft: Post) => {
    if (draft.is_ai_generated) {
      // Has generated content - go to Edit Post screen
      navigate("/create", { 
        state: { 
          mode: "edit",
          postId: draft.id,
          content: draft.content,
          aiPrompt: draft.ai_prompt 
        } 
      });
    } else {
      // No generated content - go to Studio to continue working
      navigate("/create", {
        state: {
          mode: "resume",
          postId: draft.id,
          content: draft.content,
          sourceType: draft.ai_prompt // ai_prompt stores the source type for non-generated drafts
        }
      });
    }
  };

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

        {/* What's on your mind? - Capture Options */}
        <Card className="bg-card border-border mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              What's on your mind?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {captureOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => navigate(option.path, { state: option.state })}
                  className="group relative overflow-hidden rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-md bg-secondary/50 border border-border hover:border-primary/50"
                >
                  <div className={`w-10 h-10 mx-auto rounded-lg ${option.gradient} bg-gradient-to-br flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-shadow`}>
                    <option.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h4 className="font-medium text-sm text-foreground mb-0.5">{option.label}</h4>
                  <p className="text-xs text-muted-foreground hidden md:block">{option.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

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

        {/* Trending Topics Section */}
        <Card className="bg-card border-border mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Trending Topics
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/trending")}>
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Tags */}
            <div>
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
              <Button variant="link" className="mt-3 p-0 text-primary text-sm" onClick={() => navigate("/settings")}>
                Manage your topics →
              </Button>
            </div>

            {/* News & Discussions Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Latest News */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-primary" />
                    Latest News
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-auto p-1" onClick={() => navigate("/trending")}>
                    More
                  </Button>
                </div>
                <div className="space-y-3">
                  {trendingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (trendingData?.news?.slice(0, 5) || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No news found for your topics</p>
                  ) : (
                    (trendingData?.news?.slice(0, 5) || []).map((news, index) => (
                      <div 
                        key={`${news.link}-${index}`}
                        className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 cursor-pointer transition-all"
                        onClick={() => window.open(news.link, "_blank")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{news.source}</Badge>
                            </div>
                            <h4 className="text-sm font-medium text-foreground line-clamp-2">{news.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(news.pubDate)}</p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Trending Discussions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Trending Discussions
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-auto p-1" onClick={() => navigate("/trending")}>
                    More
                  </Button>
                </div>
                <div className="space-y-3">
                  {trendingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (trendingData?.posts?.slice(0, 5) || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No discussions found for your topics</p>
                  ) : (
                    (trendingData?.posts?.slice(0, 5) || []).map((post, index) => (
                      <div 
                        key={`${post.permalink}-${index}`}
                        className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 cursor-pointer transition-all"
                        onClick={() => window.open(post.permalink, "_blank")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 mb-1">r/{post.subreddit}</Badge>
                            <h4 className="text-sm font-medium text-foreground line-clamp-2">{post.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>↑ {post.score}</span>
                              <span>{post.numComments} comments</span>
                            </div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trending Templates */}
        <div className="mb-8">
          <TrendingTemplates />
        </div>

        {/* Recent Drafts */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Drafts</CardTitle>
              {recentDrafts.length > 0 && (
                <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/drafts")}>
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentDrafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PenSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-2">No drafts yet</p>
                <Button variant="gradient" size="sm" onClick={() => navigate("/create")}>
                  Create Your First Post
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDrafts.map((draft) => (
                  <div 
                    key={draft.id}
                    className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 cursor-pointer transition-all"
                    onClick={() => handleEditDraft(draft)}
                  >
                    <p className="text-sm text-foreground line-clamp-2 mb-2">
                      {draft.content || "Empty draft..."}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(parseISO(draft.updated_at), { addSuffix: true })}</span>
                      <span>{draft.is_ai_generated ? "AI Generated" : "Draft"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
