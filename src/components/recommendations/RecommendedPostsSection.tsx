import { useNavigate } from "react-router-dom";
import { ArrowRight, Lightbulb, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecommendedPosts, RecommendedPost } from "@/hooks/useRecommendedPosts";
import { RecommendedPostCard } from "./RecommendedPostCard";
import { useProfile } from "@/hooks/useProfile";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { useState } from "react";

export function RecommendedPostsSection() {
  const navigate = useNavigate();
  const {
    recommendations,
    isLoading,
    generateRecommendations,
    hasTopics
  } = useRecommendedPosts();
  const { checkUsageLimit, incrementUsage, usageCount } = useProfile();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleGenerate = () => {
    if (!checkUsageLimit()) {
      setShowSubscriptionModal(true);
      return;
    }
    generateRecommendations.mutate(false, {
      onSuccess: () => {
        incrementUsage.mutate();
      }
    });
  };

  const uniqueRecommendations = recommendations.filter((post, index, self) =>
    index === self.findIndex((t) => t.title === post.title)
  );
  const displayedRecommendations = uniqueRecommendations.slice(0, 3);

  const handleUsePost = (post: RecommendedPost) => {
    navigate("/create", {
      state: {
        mode: "edit",
        prefilledContent: post.content,
        recommendedPostId: post.id,
        title: post.title,
        sourceUrl: post.source_url,
        inputContext: post.source_title ? `Source: ${post.source_title}` : undefined
      },
    });
  };

  if (!hasTopics) {
    return (
      <Card className="bg-card border-border mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Recommended Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">Set up your topics to get personalized recommendations</p>
            <Button variant="gradient" size="sm" onClick={() => navigate("/settings")}>
              Configure Topics
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border mb-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Recommended Posts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              disabled={generateRecommendations.isPending}
            >
              {generateRecommendations.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate("/recommendations")}>
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayedRecommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">No recommendations yet</p>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                if (!checkUsageLimit()) {
                  setShowSubscriptionModal(true);
                  return;
                }
                generateRecommendations.mutate(true, {
                  onSuccess: () => incrementUsage.mutate()
                });
              }}
              disabled={generateRecommendations.isPending}
            >
              {generateRecommendations.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Generate Recommendations"
              )}
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {displayedRecommendations.map((post) => (
              <RecommendedPostCard
                key={post.id}
                post={post}
                onUse={handleUsePost}
                compact
              />
            ))}
          </div>
        )}
      </CardContent>
      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        currentUsage={usageCount}
      />
    </Card>
  );
}
