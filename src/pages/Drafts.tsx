import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Edit3, Trash2, Calendar, Clock, Sparkles, Plus, Search, Link2, Video, FileText as PDFIcon, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { usePosts, Post } from "@/hooks/usePosts";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export default function Drafts() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { posts, deletePost, isLoading } = usePosts();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter only drafts
  const drafts = useMemo(() => {
    return posts
      .filter(post => post.status === "draft")
      .filter(post => 
        searchQuery === "" || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [posts, searchQuery]);

  const handleEdit = (post: Post) => {
    navigate("/create", { 
      state: { 
        mode: "edit",
        postId: post.id,
        content: post.content,
        aiPrompt: post.ai_prompt 
      } 
    });
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      await deletePost.mutateAsync(postId);
    }
  };

  const handleSchedule = (post: Post) => {
    navigate("/schedule", { state: { content: post.content } });
  };

  // Get icon based on content type
  const getContentTypeIcon = (post: Post) => {
    if (post.ai_prompt?.includes("voice")) return Mic;
    if (post.ai_prompt?.includes("url") || post.ai_prompt?.includes("link")) return Link2;
    if (post.ai_prompt?.includes("video")) return Video;
    if (post.ai_prompt?.includes("pdf")) return PDFIcon;
    if (post.is_ai_generated) return Sparkles;
    return FileText;
  };

  const getContentTypeBadge = (post: Post) => {
    if (post.ai_prompt?.includes("voice")) return "Voice Note";
    if (post.ai_prompt?.includes("url") || post.ai_prompt?.includes("link")) return "From Link";
    if (post.ai_prompt?.includes("video")) return "From Video";
    if (post.ai_prompt?.includes("pdf")) return "From PDF";
    if (post.is_ai_generated) return "AI Generated";
    return "Manual";
  };

  return (
    <AppLayout onLogout={signOut}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Drafts
            </h1>
            <p className="text-muted-foreground">
              {drafts.length} draft{drafts.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Button variant="gradient" onClick={() => navigate("/create")}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search drafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Drafts Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardContent className="p-5">
                  <div className="h-4 bg-secondary rounded w-1/3 mb-3" />
                  <div className="h-20 bg-secondary rounded mb-3" />
                  <div className="h-8 bg-secondary rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No drafts yet</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No drafts match your search" : "Start creating content and your drafts will appear here"}
              </p>
              <Button variant="gradient" onClick={() => navigate("/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((draft) => {
              const ContentIcon = getContentTypeIcon(draft);
              return (
                <Card 
                  key={draft.id} 
                  className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-md group"
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <ContentIcon className="w-3 h-3" />
                        {getContentTypeBadge(draft)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(draft.updated_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Content Preview */}
                    <p className="text-sm text-foreground line-clamp-4 mb-4 min-h-[80px]">
                      {draft.content || "Empty draft..."}
                    </p>

                    {/* AI Prompt hint */}
                    {draft.ai_prompt && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-1 italic">
                        Prompt: {draft.ai_prompt}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => handleEdit(draft)}
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 gap-1"
                        onClick={() => handleSchedule(draft)}
                      >
                        <Calendar className="w-3 h-3" />
                        Schedule
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(draft.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Coming Soon Features */}
        <Card className="bg-primary/5 border-primary/20 mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Coming Soon
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <h4 className="font-medium text-foreground mb-1">🎠 Carousel Creator</h4>
                <p className="text-sm text-muted-foreground">
                  Design multi-slide visual posts with our drag-and-drop carousel builder
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <h4 className="font-medium text-foreground mb-1">📊 Bulk Upload</h4>
                <p className="text-sm text-muted-foreground">
                  Import a spreadsheet to create multiple posts as drafts and schedule them
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
