import { Sparkles, ExternalLink, Trash2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecommendedPost } from "@/hooks/useRecommendedPosts";
import { useAnalytics } from "@/hooks/useAnalytics";

interface RecommendedPostCardProps {
  post: RecommendedPost;
  onUse: (post: RecommendedPost) => void;
  onDelete?: (postId: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function RecommendedPostCard({ post, onUse, onDelete, compact = false, disabled = false }: RecommendedPostCardProps) {
  const { trackRecommendationUsed } = useAnalytics();
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
  };

  if (compact) {
    return (
      <Card
        className={`cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        onClick={() => {
          if (!disabled) {
            trackRecommendationUsed(post.id, post.topic);
            onUse(post);
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <Badge variant="secondary" className="text-[10px]">{post.topic}</Badge>
              </div>
              <h4 className="font-medium text-foreground line-clamp-2 text-sm mb-1">
                {post.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {post.content.substring(0, 100)}...
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-primary/50 transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <Badge variant="secondary">{post.topic}</Badge>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTimeAgo(post.generated_at)}
              </p>
            </div>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(post.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
          {post.title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {post.content.substring(0, 150)}...
        </p>

        {post.source_title && (
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
            <span className="text-primary">Inspired by:</span> {post.source_title}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="gradient"
            size="sm"
            className="flex-1"
            onClick={() => {
              trackRecommendationUsed(post.id, post.topic);
              onUse(post);
            }}
            disabled={disabled}
          >
            {disabled ? "Limit Reached" : "Use This Post"}
            {!disabled && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
          {post.source_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                window.open(post.source_url!, "_blank");
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
