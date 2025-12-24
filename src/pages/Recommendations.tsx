import { useNavigate } from "react-router-dom";
import { Sparkles, RefreshCw, Loader2, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { RecommendedPostCard } from "@/components/recommendations/RecommendedPostCard";
import { useAuth } from "@/hooks/useAuth";
import { useRecommendedPosts, RecommendedPost } from "@/hooks/useRecommendedPosts";
import { useUserTopics } from "@/hooks/useUserTopics";
import { useProfile } from "@/hooks/useProfile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { useState } from "react";

export default function Recommendations() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { topics } = useUserTopics();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const {
    recommendations,
    isLoading,
    generateRecommendations,
    markAsUsed,
    deleteRecommendation,
    hasTopics,
    usage
  } = useRecommendedPosts();

  const { isPro } = useProfile();

  const activeTopics = topics.filter(t => t.is_active);

  const handleUsePost = async (post: RecommendedPost) => {
    await markAsUsed.mutateAsync(post.id);
    navigate("/create", {
      state: {
        mode: "edit",
        content: post.content,
        prefilledContent: post.content,
        aiPrompt: `Recommended post about ${post.topic}`,
      },
    });
  };

  const handleDelete = (postId: string) => {
    deleteRecommendation.mutate(postId);
  };

  const handleGenerate = () => {
    generateRecommendations.mutate(true);
  };

  // Group recommendations by topic
  const groupedByTopic = recommendations.reduce((acc, post) => {
    if (!acc[post.topic]) {
      acc[post.topic] = [];
    }
    acc[post.topic].push(post);
    return acc;
  }, {} as Record<string, RecommendedPost[]>);

  return (
    <AppLayout onLogout={signOut}>
      <div className="min-h-screen p-4 md:p-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Recommended Posts
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-generated post ideas based on trending topics and your writing style
              </p>
            </div>
            <Button
              variant="gradient"
              onClick={handleGenerate}
              disabled={generateRecommendations.isPending || !hasTopics}
            >
              {generateRecommendations.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Generate New
            </Button>
          </div>

          {/* Topics Info */}
          {activeTopics.length > 0 && (
            <div className="space-y-4">
              {!isPro && activeTopics.length > 3 && (
                <Alert className="bg-yellow-500/10 border-yellow-500/50 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Topic Limit Reached</AlertTitle>
                  <AlertDescription>
                    Free plan includes 3 active topics. Only the first 3 will be used. <button onClick={() => setShowUpgradeModal(true)} className="underline font-medium">Upgrade to Pro</button> for up to 20 topics.
                  </AlertDescription>
                </Alert>
              )}
              <Card className="border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Your topics:</span>
                      {activeTopics.map((topic) => (
                        <span
                          key={topic.id}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                        >
                          {topic.name}
                        </span>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
                      <Settings className="w-4 h-4 mr-1" />
                      Manage Topics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No Topics State */}
          {!hasTopics && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Topics Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Add topics of interest to get personalized post recommendations
                </p>
                <Button variant="gradient" onClick={() => navigate("/settings")}>
                  Add Topics
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && hasTopics && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading recommendations...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && hasTopics && recommendations.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate AI-powered post recommendations based on trending topics
                </p>
                <Button
                  variant="gradient"
                  onClick={handleGenerate}
                  disabled={generateRecommendations.isPending}
                >
                  {generateRecommendations.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Recommendations
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recommendations by Topic */}
          {!isLoading && Object.keys(groupedByTopic).length > 0 && (
            <div className="space-y-8">
              {Object.entries(groupedByTopic).map(([topic, posts]) => (
                <div key={topic}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {topic}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({posts.length} posts)
                    </span>
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map((post) => (
                      <RecommendedPostCard
                        key={post.id}
                        post={post}
                        onUse={(p) => {
                          if (usage.isLimited) {
                            setShowUpgradeModal(true);
                          } else {
                            handleUsePost(p);
                          }
                        }}
                        onDelete={handleDelete}
                        disabled={usage.isLimited}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SubscriptionModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentUsage={usage.count}
      />
    </AppLayout>
  );
}
