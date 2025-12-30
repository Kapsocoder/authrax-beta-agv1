import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Eye, ThumbsUp, MessageCircle, Share2, BarChart3, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { functions } from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { useQuery } from "@tanstack/react-query";

export default function Analytics() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isLinkedInLinked, profile, isLoading: profileLoading } = useProfile();
  const { posts, isLoading: postsLoading } = usePosts();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth/login");
    } catch (error: any) {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    if (!user) {
      // navigate("/auth"); // Handled by AppLayout
    }
  }, [user, navigate]);

  // Filter for published posts that have a LinkedIn ID
  const publishedPosts = useMemo(() => {
    return posts.filter(p => p.status === "published" && p.linkedin_post_id);
  }, [posts]);

  // Fetch analytics for these posts
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['postAnalytics', publishedPosts.map(p => p.linkedin_post_id).join(',')],
    queryFn: async () => {
      if (publishedPosts.length === 0) return {};

      const postIds = publishedPosts.map(p => p.linkedin_post_id!);

      try {
        const getAnalyticsFn = httpsCallable(functions, 'getPostAnalytics');
        const result: any = await getAnalyticsFn({ postIds });
        return result.data.stats || {};
      } catch (error) {
        console.error("Failed to fetch analytics", error);
        return {};
      }
    },
    enabled: isLinkedInLinked && publishedPosts.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Calculate aggregates
  const aggregates = useMemo(() => {
    let totalLikes = 0;
    let totalComments = 0;

    // We don't get impressions from the simple socialActions API easily yet without specialized access
    // So we'll focus on Likes and Comments which are reliable

    Object.values(analyticsData || {}).forEach((stat: any) => {
      if (stat.likes) totalLikes += stat.likes;
      if (stat.comments) totalComments += stat.comments;
    });

    return { totalLikes, totalComments };
  }, [analyticsData]);

  if (profileLoading) {
    return (
      <AppLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const stats = [
    { label: "Total Posts Tracked", value: publishedPosts.length.toString(), icon: Share2, change: null },
    { label: "Total Likes", value: aggregates.totalLikes.toString(), icon: ThumbsUp, change: null },
    { label: "Total Comments", value: aggregates.totalComments.toString(), icon: MessageCircle, change: null },
    // { label: "Shares", value: "0", icon: Share2, change: null }, // Hidden until supported
  ];

  return (
    <AppLayout onLogout={handleLogout}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Analytics</h1>
          <p className="text-muted-foreground">Track your LinkedIn performance</p>
        </div>

        {!isLinkedInLinked ? (
          <Card className="mb-8 bg-blue-50/50 border-blue-200">
            <CardContent className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Connect LinkedIn</h3>
                  <p className="text-sm text-muted-foreground">Go to your profile to link your account and see analytics.</p>
                </div>
              </div>
              <div className="w-full md:w-auto min-w-[200px]">
                <Button
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                  onClick={() => navigate("/profile")}
                >
                  Go to Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile?.full_name || "LinkedIn User"}</h2>
                  <p className="text-muted-foreground">{profile?.headline || "Linked Profile"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Analytics for posts published via Authrax</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Posts List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Posts Performance</CardTitle>
            <CardDescription>Stats may take some time to update from LinkedIn</CardDescription>
          </CardHeader>
          <CardContent>
            {publishedPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No published posts found.</p>
                <p className="text-sm">Start creating and publishing posts to see analytics here!</p>
                <Button variant="link" onClick={() => navigate("/create")} className="mt-2 text-primary">
                  Create a Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {publishedPosts.slice(0, 10).map(post => {
                  const postStats = analyticsData?.[post.linkedin_post_id!] || {};
                  return (
                    <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2 mb-1">{post.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.published_at!).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5 min-w-[60px]" title="Likes">
                          <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{postStats.likes !== undefined ? postStats.likes : "-"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-[60px]" title="Comments">
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{postStats.comments !== undefined ? postStats.comments : "-"}</span>
                        </div>
                        {/* <a 
                              href={`https://www.linkedin.com/feed/update/${post.linkedin_post_id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                           >
                              <Share2 className="w-4 h-4" />
                           </a> */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
