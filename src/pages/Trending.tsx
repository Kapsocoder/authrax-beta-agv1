import { useState, useMemo } from "react";
import { TrendingUp, Search, X, Sparkles, ExternalLink, Clock, ThumbsUp, MessageCircle, Zap, RefreshCw, Newspaper, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserTopics } from "@/hooks/useUserTopics";
import { useNavigate } from "react-router-dom";

// Mock trending data - In production, this would come from an API/edge function
const mockTrendingPosts = [
  {
    id: "1",
    title: "The Future of AI in Enterprise: 5 Key Predictions for 2025",
    source: "LinkedIn",
    author: "Sarah Chen",
    authorTitle: "AI Research Lead @ Google",
    excerpt: "As we enter 2025, the enterprise AI landscape is evolving rapidly. Here are my top predictions based on emerging trends...",
    engagement: { likes: 2450, comments: 189 },
    timeAgo: "2h ago",
    topics: ["AI", "Enterprise Tech"],
    url: "#",
  },
  {
    id: "2",
    title: "Why Remote Work Is Here to Stay: Data from 10,000 Companies",
    source: "Harvard Business Review",
    author: "Marcus Johnson",
    authorTitle: "Workplace Researcher",
    excerpt: "Our comprehensive study of 10,000 companies reveals that hybrid and remote work models are not just surviving—they're thriving...",
    engagement: { likes: 1890, comments: 267 },
    timeAgo: "4h ago",
    topics: ["Remote Work", "Leadership"],
    url: "#",
  },
  {
    id: "3",
    title: "The Leadership Skill Nobody Talks About: Emotional Granularity",
    source: "LinkedIn",
    author: "Dr. Emily Park",
    authorTitle: "Executive Coach",
    excerpt: "Most leadership advice focuses on EQ, but there's a deeper skill that separates great leaders: emotional granularity...",
    engagement: { likes: 3200, comments: 421 },
    timeAgo: "6h ago",
    topics: ["Leadership", "Career Growth"],
    url: "#",
  },
  {
    id: "4",
    title: "Building in Public: How Transparency Drives Growth",
    source: "Tech Crunch",
    author: "Alex Rivera",
    authorTitle: "Founder @ BuildCo",
    excerpt: "Our startup grew 300% after we started sharing everything publicly. Here's the exact playbook we used...",
    engagement: { likes: 1567, comments: 198 },
    timeAgo: "8h ago",
    topics: ["Startups", "Growth"],
    url: "#",
  },
];

const mockNewsArticles = [
  {
    id: "n1",
    title: "OpenAI Announces GPT-5: What It Means for Businesses",
    source: "TechCrunch",
    timeAgo: "1h ago",
    topics: ["AI", "Tech News"],
    url: "#",
  },
  {
    id: "n2",
    title: "LinkedIn Introduces New Creator Tools for Personal Branding",
    source: "The Verge",
    timeAgo: "3h ago",
    topics: ["LinkedIn", "Personal Branding"],
    url: "#",
  },
  {
    id: "n3",
    title: "Study: Companies with Strong Employer Brands See 50% More Applicants",
    source: "Forbes",
    timeAgo: "5h ago",
    topics: ["HR", "Employer Branding"],
    url: "#",
  },
];

export default function Trending() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { topics: userTopics } = useUserTopics();
  const [searchInput, setSearchInput] = useState("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Convert user topics to display
  const preSelectedTopics = useMemo(() => {
    return userTopics.filter(t => t.is_active).map(t => t.name);
  }, [userTopics]);

  // Handle search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = searchInput.trim().replace(",", "");
      if (value && !searchTags.includes(value)) {
        setSearchTags([...searchTags, value]);
        setSearchInput("");
      }
    } else if (e.key === "Backspace" && !searchInput && searchTags.length > 0) {
      setSearchTags(searchTags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setSearchTags(searchTags.filter(t => t !== tag));
  };

  const addTagFromSuggestion = (topic: string) => {
    if (!searchTags.includes(topic)) {
      setSearchTags([...searchTags, topic]);
    }
  };

  // Filter content based on search tags
  const filteredPosts = useMemo(() => {
    if (searchTags.length === 0) return mockTrendingPosts;
    return mockTrendingPosts.filter(post => 
      post.topics.some(topic => 
        searchTags.some(tag => topic.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }, [searchTags]);

  const filteredNews = useMemo(() => {
    if (searchTags.length === 0) return mockNewsArticles;
    return mockNewsArticles.filter(article => 
      article.topics.some(topic => 
        searchTags.some(tag => topic.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }, [searchTags]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleCreatePost = (topic: string, title?: string) => {
    navigate("/create", { 
      state: { 
        mode: "draft",
        inspiration: title ? `Inspired by: "${title}"` : undefined,
        topic 
      } 
    });
  };

  return (
    <AppLayout onLogout={signOut}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Trending
            </h1>
            <p className="text-muted-foreground">
              Discover what's worth talking about on LinkedIn
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Search Bar with Tags */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-secondary/50 border border-border focus-within:border-primary transition-colors min-h-[48px]">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              {searchTags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="default"
                  className="px-3 py-1 gap-1 bg-primary/20 text-primary hover:bg-primary/30"
                >
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
              <Input
                placeholder={searchTags.length === 0 ? "Search topics (separate with comma or Enter)..." : "Add more..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1 min-w-[150px] border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
              />
            </div>
            
            {/* Pre-selected topics from profile */}
            {preSelectedTopics.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Your interests:</p>
                <div className="flex flex-wrap gap-2">
                  {preSelectedTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => addTagFromSuggestion(topic)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        searchTags.includes(topic)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary"
                      }`}
                    >
                      <Hash className="w-3 h-3 inline mr-1" />
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {preSelectedTopics.length === 0 && (
              <Button 
                variant="link" 
                size="sm" 
                className="mt-2 p-0 text-primary"
                onClick={() => navigate("/profile")}
              >
                Add topics of interest in your Profile →
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trending Posts */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Trending Posts</h2>
            </div>
            
            {filteredPosts.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No trending posts found for these topics</p>
                  <Button 
                    variant="link" 
                    onClick={() => setSearchTags([])}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span className="font-medium text-primary">{post.source}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{post.timeAgo}</span>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2 hover:text-primary cursor-pointer">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <span className="font-medium text-foreground">{post.author}</span>
                      <span>•</span>
                      <span>{post.authorTitle}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.topics.map((topic) => (
                        <Badge 
                          key={topic} 
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => addTagFromSuggestion(topic)}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {post.engagement.likes.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.engagement.comments.toLocaleString()}
                        </span>
                      </div>
                      <Button 
                        variant="gradient" 
                        size="sm"
                        onClick={() => handleCreatePost(post.topics[0], post.title)}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Create Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* News Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Newspaper className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Latest News</h2>
            </div>
            
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-4">
                {filteredNews.map((article, index) => (
                  <div 
                    key={article.id}
                    className={`${index !== filteredNews.length - 1 ? "pb-4 border-b border-border" : ""}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-primary">{article.source}</span>
                      <span>•</span>
                      <span>{article.timeAgo}</span>
                    </div>
                    <h4 className="text-sm font-medium text-foreground hover:text-primary cursor-pointer mb-2">
                      {article.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {article.topics.map((topic) => (
                          <Badge 
                            key={topic} 
                            variant="outline"
                            className="text-xs px-2 py-0"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => handleCreatePost(article.topics[0], article.title)}
                      >
                        <Sparkles className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Coming Soon: Notifications */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Coming Soon</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get push notifications when topics you care about start trending. Configure your preferences in Profile settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
