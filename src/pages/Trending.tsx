import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Newspaper, MessageCircle, X, ExternalLink, ArrowUpRight, Loader2, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserTopics } from "@/hooks/useUserTopics";
import { useQueryClient } from "@tanstack/react-query";
import { useTrending, NewsItem, TrendingPost, Timeframe, fetchTrendingData } from "@/hooks/useTrending";
import { useProfile } from "@/hooks/useProfile";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

export default function Trending() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { topics: userTopics } = useUserTopics();

  const [searchInput, setSearchInput] = useState("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [usePreselectedTopics, setUsePreselectedTopics] = useState(true);
  const [selectedPost, setSelectedPost] = useState<TrendingPost | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("7d");
  const [postsPage, setPostsPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { checkFeatureAccess, usageCount } = useProfile();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Get active topics for filtering
  const activeTopicNames = userTopics
    .filter(t => t.is_active)
    .map(t => t.name);

  // Use search tags only when user has searched, otherwise use preselected topics
  const topicsToFetch = searchTags.length > 0
    ? searchTags
    : (usePreselectedTopics ? activeTopicNames : []);

  // Fetch trending data with timeframe
  const { data: trendingData, isLoading, refetch, isRefetching } = useTrending(topicsToFetch, "all", timeframe);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput.trim()) {
      e.preventDefault();
      if (!searchTags.includes(searchInput.trim())) {
        setSearchTags([...searchTags, searchInput.trim()]);
        setUsePreselectedTopics(false);
      }
      setSearchInput("");
      // Reset pagination when search changes
      setPostsPage(1);
      setNewsPage(1);
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      const newTags = searchTags.slice(0, -1);
      setSearchTags(newTags);
      if (newTags.length === 0) {
        setUsePreselectedTopics(true);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    if (newTags.length === 0) {
      setUsePreselectedTopics(true);
    }
  };

  const clearSearch = () => {
    setSearchTags([]);
    setUsePreselectedTopics(true);
    setPostsPage(1);
    setNewsPage(1);
  };

  const handleTimeframeChange = (value: Timeframe) => {
    if (value === '24h' && !checkFeatureAccess('trending_realtime')) {
      setShowSubscriptionModal(true);
      return;
    }
    setTimeframe(value);
    setPostsPage(1);
    setNewsPage(1);
  };

  const handleCreatePostFromPost = (post: TrendingPost) => {
    const prefilledContent = `Topic: ${post.title}\n\nContext: ${post.selftext || "Trending discussion from r/" + post.subreddit}\n\nSource: https://reddit.com${post.permalink}`;
    navigate("/create", { state: { mode: "draft", prefilledContent } });
  };

  const handleCreatePostFromNews = (news: NewsItem) => {
    const prefilledContent = `Topic: ${news.title}\n\nSummary: ${news.description}\n\nSource: ${news.link}`;
    navigate("/create", { state: { mode: "draft", prefilledContent } });
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

  // Dynamic Loading Messages
  const [loadingMsg, setLoadingMsg] = useState("Scanning latest news...");

  // Cycle loading messages
  useEffect(() => {
    if (!isLoading && !isRefreshing) return;

    const messages = [
      "Scanning latest news...",
      "Searching social discussions...",
      "Analyzing trending topics...",
      "Enriching content with social metrics...",
      "Finalizing your personalized trends..."
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMsg(messages[index]);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isLoading, isRefreshing]);

  // Paginate displayed items - load more in increments of 5
  const postsPerPage = 5;
  const newsPerPage = 5;
  const displayedPosts = trendingData?.posts?.slice(0, postsPage * postsPerPage) || [];
  const displayedNews = trendingData?.news?.slice(0, newsPage * newsPerPage) || [];
  const hasMorePosts = (trendingData?.posts?.length || 0) > postsPage * postsPerPage;
  const hasMoreNews = (trendingData?.news?.length || 0) > newsPage * newsPerPage;

  const handleManualRefresh = async () => {
    if (!checkFeatureAccess('trending_realtime')) {
      setShowSubscriptionModal(true);
      return;
    }
    setIsRefreshing(true);
    // Reset message immediately
    setLoadingMsg("Starting fresh scan...");
    try {
      const newData = await fetchTrendingData(topicsToFetch, "all", timeframe, true);
      queryClient.setQueryData(["trending", topicsToFetch, "all", timeframe], newData);
    } catch (error) {
      console.error("Failed to refresh trending data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AppLayout onLogout={signOut}>
      <div className="min-h-screen p-4 md:p-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Trending Topics
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover what's trending and find inspiration for your next post
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Timeframe Selector */}
              <Select value={timeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="w-[160px] bg-card border-border text-foreground">
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-foreground">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>


              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefetching || isRefreshing}
              >
                {isRefetching || isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 flex-wrap p-2 border rounded-lg bg-background">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                {searchTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
                <Input
                  type="text"
                  placeholder="Search topics (press Enter to add)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 min-w-[200px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pre-selected Topics */}
          {activeTopicNames.length > 0 && (
            <Card className={`border-primary/20 ${!usePreselectedTopics && searchTags.length > 0 ? 'opacity-50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">
                    Your Topics of Interest {searchTags.length > 0 && !usePreselectedTopics && "(disabled while searching)"}
                  </CardTitle>
                  {searchTags.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={clearSearch}>
                      Clear search & restore
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {activeTopicNames.map((topic) => (
                    <Badge
                      key={topic}
                      variant="outline"
                      className={`border-primary/50 ${!usePreselectedTopics && searchTags.length > 0 ? 'line-through' : ''}`}
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Manage your topics in Profile settings • Push notifications coming soon!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-background rounded-full" />
                </div>
              </div>
              <p className="text-lg font-medium text-foreground animate-pulse">
                {loadingMsg}
              </p>
              <p className="text-sm text-muted-foreground">
                {(isRefreshing || timeframe === '24h') ? "This might take a moment as we scan live sources." : "Curating the best content for you."}
              </p>
            </div>
          )}

          {!isLoading && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Trending Posts */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Trending Discussions
                  {trendingData?.cached && (
                    <Badge variant="outline" className="text-xs">Cached</Badge>
                  )}
                </h2>

                {displayedPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No trending posts found. Try different topics.
                    </CardContent>
                  </Card>
                ) : (
                  displayedPosts.map((post, index) => (
                    <Card
                      key={`${post.permalink}-${index}`}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedPost(post)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-2 mb-2">
                              {post.topic && <Badge variant="secondary">{post.topic}</Badge>}
                              <Badge variant="outline">r/{post.subreddit}</Badge>
                            </div>
                            <h3 className="font-medium text-foreground line-clamp-2 mb-2">
                              {post.title}
                            </h3>
                            {(post.selftext && post.selftext !== post.title) && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {post.selftext}
                              </p>
                            )}
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>↑ {post.score}</span>
                          <span>{post.numComments} comments</span>
                          <span>{formatTimeAgo(post.createdUtc)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {hasMorePosts && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setPostsPage(p => p + 1)}
                  >
                    Load More Discussions
                  </Button>
                )}
              </div>

              {/* Latest News */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Newspaper className="w-5 h-5 text-primary" />
                  Latest News
                </h2>

                {displayedNews.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No news found. Try different topics.
                    </CardContent>
                  </Card>
                ) : (
                  displayedNews.map((news, index) => (
                    <Card
                      key={`${news.link}-${index}`}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedNews(news)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {news.topic && <Badge variant="secondary">{news.topic}</Badge>}
                              <Badge variant="secondary">{news.source}</Badge>
                              <Badge variant="outline">{news.category}</Badge>
                            </div>
                            <h3 className="font-medium text-foreground line-clamp-2 mb-2">
                              {news.title}
                            </h3>
                            {(news.description && news.description !== news.title) && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {news.description}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <span>{formatTimeAgo(news.pubDate)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}

                {hasMoreNews && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setNewsPage(p => p + 1)}
                  >
                    Load More News
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPost?.topic && <Badge variant="secondary">{selectedPost.topic}</Badge>}
              <Badge variant="outline">r/{selectedPost?.subreddit}</Badge>
              Trending Discussion
            </DialogTitle>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{selectedPost.title}</h3>
                {(selectedPost?.selftext && selectedPost?.selftext !== selectedPost?.title) && (
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
                  Read at Source
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
      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        currentUsage={usageCount}
      />
    </AppLayout>
  );
}
