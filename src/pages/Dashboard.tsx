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
  Loader2,
  Lightbulb,
  LogOut,
  User,
  Settings
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
import { useTrending, NewsItem, TrendingPost } from "@/hooks/useTrending";
import { useRecommendedPosts, RecommendedPost } from "@/hooks/useRecommendedPosts";
import { RecommendedPostCard } from "@/components/recommendations/RecommendedPostCard";
import { RecommendedPostsSection } from "@/components/recommendations/RecommendedPostsSection";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [selectedPost, setSelectedPost] = useState<TrendingPost | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

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

  // --- DERIVED STATE (HOOKS BEFORE CONDITIONAL RETURN) ---

  const postsThisWeek = useMemo(() => {
    if (!posts) return 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return posts.filter(p => {
      // Strict check for published status
      if (p.status !== "published") return false;

      // Use published_at, falling back to updated_at if missing (e.g. legacy data)
      // We avoid created_at because an old draft published today should count
      const publishDate = p.published_at ? new Date(p.published_at) : new Date(p.updated_at);

      return publishDate > weekAgo;
    }).length;
  }, [posts]);

  // Recent drafts - sorted by updated_at, show most recent 3
  const recentDrafts = useMemo(() => {
    return (posts || [])
      .filter(p => p.status === "draft")
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
  }, [posts]);

  // Trending Topics Logic
  const trendingTopics = topics.length > 0
    ? topics.filter(t => t.is_active).map(t => t.name)
    : ["AI in Business", "Leadership", "Remote Work", "Career Growth", "Productivity", "Tech Trends"];

  // Fetch trending data based on user's topics
  const { data: trendingData, isLoading: trendingLoading } = useTrending(trendingTopics);

  // --------------------------------------------------------

  // "What's on your mind?" capture options (Constants)
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
    /* {
      icon: Video,
      label: "From a Video",
      description: "Repurpose video content",
      path: "/create",
      state: { mode: "video" },
      gradient: "from-red-500 to-pink-500",
    }, */
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
      label: "Brand DNA",
      description: "Train your voice",
      path: "/profile",
      state: { scrollToVoice: true },
      gradient: "from-warning to-orange-500",
    },
  ];

  const scheduledCount = posts?.filter(p => p.status === "scheduled").length || 0;

  // Voice Score / Brand DNA Status
  const getVoiceStatus = () => {
    if (voiceProfile?.is_trained && voiceProfile?.isActive) return "Active";
    if (voiceProfile?.is_trained && !voiceProfile?.isActive) return "Inactive";
    return "Analyze";
  };

  const voiceStatus = getVoiceStatus();

  const stats = [
    { label: "Posts This Week", value: String(postsThisWeek), icon: PenSquare, path: "/drafts" },
    { label: "Total Impressions", value: "—", icon: TrendingUp, path: "/analytics" },
    { label: "Scheduled", value: String(scheduledCount), icon: Clock, path: "/schedule" },
    { label: "Brand DNA", value: voiceStatus, icon: Target, path: "/profile", state: { scrollToVoice: true } },
  ];

  const rawName = user?.displayName || profile?.full_name || user?.email?.split('@')[0] || "there";
  const userName = useMemo(() => {
    const firstPart = rawName.split(/[ _]/)[0];
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
  }, [rawName]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

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

  const handleCreatePostFromPost = (post: TrendingPost) => {
    const prefilledContent = `Topic: ${post.title}\n\nContext: ${post.selftext || "Trending discussion from r/" + post.subreddit}\n\nSource: https://reddit.com${post.permalink}`;
    navigate("/create", { state: { mode: "draft", prefilledContent } });
  };

  const handleCreatePostFromNews = (news: NewsItem) => {
    const prefilledContent = `Topic: ${news.title}\n\nSummary: ${news.description}\n\nSource: ${news.link}`;
    navigate("/create", { state: { mode: "draft", prefilledContent } });
  };

  // Smart edit routing - if draft has generated content (is_ai_generated), go to Edit mode
  // Otherwise go to Studio to continue working on it
  const handleEditDraft = (draft: Post) => {
    // Determine target mode based on saved input_mode or fallback
    const sourceType = draft.input_mode || draft.ai_prompt || "draft";

    if (draft.is_ai_generated) {
      // Has generated content - go to Edit Post screen
      navigate("/create", {
        state: {
          mode: "edit",
          postId: draft.id,
          content: draft.content,
          aiPrompt: draft.ai_prompt,
          // Hydrate other fields
          inputContext: draft.input_context,
          sourceUrl: draft.source_url,
          sourceType: sourceType,
          templateId: draft.template_id,
          user_instructions: draft.user_instructions,
          media_items: draft.media_items,
          media_urls: draft.media_urls
        }
      });
    } else {
      // No generated content - go to Studio to continue working
      navigate("/create", {
        state: {
          mode: "resume",
          postId: draft.id,
          content: draft.content,
          // For resume mode, we primarily need the source type and context
          sourceType: sourceType,
          inputContext: draft.input_context,
          sourceUrl: draft.source_url,
          templateId: draft.template_id,
          aiPrompt: draft.ai_prompt,
          user_instructions: draft.user_instructions,
          media_items: draft.media_items,
          media_urls: draft.media_urls
        }
      });
    }
  };

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => setShowOnboarding(false)}
        isLinkedInLogin={isLinkedInOnboarding}
      />
    );
  }

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-muted-foreground">
              Let's build your personal brand today
            </p>
          </div>

          {/* Profile Dropdown (Mobile visible mainly, but good for Desktop too) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10 border border-border shadow-sm">
                  <AvatarImage src={user?.photoURL || undefined} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-medium">
                    {userName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <Card
              key={stat.label}
              className="bg-card border-border cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
              onClick={() => navigate(stat.path, { state: (stat as any).state })}
            >
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
                  ) : (trendingData?.news?.slice(0, 3) || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No news found for your topics</p>
                  ) : (
                    (trendingData?.news?.slice(0, 3) || []).map((news, index) => (
                      <div
                        key={`${news.link}-${index}`}
                        className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 cursor-pointer transition-all"
                        onClick={() => setSelectedNews(news)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              {news.topic && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{news.topic}</Badge>}
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
                  ) : (trendingData?.posts?.slice(0, 3) || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No discussions found for your topics</p>
                  ) : (
                    (trendingData?.posts?.slice(0, 3) || []).map((post, index) => (
                      <div
                        key={`${post.permalink}-${index}`}
                        className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 cursor-pointer transition-all"
                        onClick={() => setSelectedPost(post)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-1 mb-1">
                              {post.topic && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{post.topic}</Badge>}
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">r/{post.subreddit}</Badge>
                            </div>
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

        {/* Recommended Posts Section */}
        <RecommendedPostsSection />

        {/* Trending Templates */}
        <div className="mb-8">
          <TrendingTemplates maxItems={3} />
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

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">r/{selectedPost?.subreddit}</Badge>
              Trending Discussion
            </DialogTitle>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{selectedPost.title}</h3>
                {selectedPost.selftext && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedPost.selftext}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span>↑ {selectedPost.score} upvotes</span>
                  <span>{selectedPost.numComments} comments</span>
                  <span>by u/{selectedPost.author}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={() => {
                    handleCreatePostFromPost(selectedPost);
                    setSelectedPost(null);
                  }}
                >
                  Create Post About This
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedPost.permalink, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Reddit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* News Detail Dialog */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="secondary">{selectedNews?.source}</Badge>
              News Article
            </DialogTitle>
          </DialogHeader>

          {selectedNews && (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{selectedNews.title}</h3>
                <p className="text-muted-foreground">
                  {selectedNews.description}
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Badge variant="outline">{selectedNews.category}</Badge>
                  <span>{formatTimeAgo(selectedNews.pubDate)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={() => {
                    handleCreatePostFromNews(selectedNews);
                    setSelectedNews(null);
                  }}
                >
                  Create Post About This
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedNews.link, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Read Full Article
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
