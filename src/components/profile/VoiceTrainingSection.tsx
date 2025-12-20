import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Sparkles, FileText, Brain, Zap, Loader2, CheckCircle2, Edit3, Save, X, ChevronDown, ChevronUp, Trash2, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { toast } from "sonner";

export interface VoiceTrainingSectionRef {
  expand: () => void;
}

export const VoiceTrainingSection = forwardRef<VoiceTrainingSectionRef>(function VoiceTrainingSection(_, ref) {
  const { voiceProfile, isLoading, analyzeVoice, updateVoiceProfile } = useVoiceProfile();
  const [currentPost, setCurrentPost] = useState("");
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Expose expand method via ref
  useImperativeHandle(ref, () => ({
    expand: () => setIsExpanded(true),
  }));

  // Sync saved posts with voice profile when it loads
  useEffect(() => {
    if (voiceProfile?.sample_posts) {
      setSavedPosts(voiceProfile.sample_posts);
    }
  }, [voiceProfile?.sample_posts]);

  const handleSavePost = () => {
    if (!currentPost.trim()) {
      toast.error("Please enter a post to save");
      return;
    }

    if (currentPost.trim().length < 50) {
      toast.error("Post should be at least 50 characters");
      return;
    }

    if (savedPosts.length >= 10) {
      toast.error("Maximum 10 posts allowed. Remove one to add more.");
      return;
    }

    setSavedPosts([...savedPosts, currentPost.trim()]);
    setCurrentPost("");
    toast.success("Post saved!");
  };

  const handleRemovePost = (index: number) => {
    setSavedPosts(savedPosts.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (savedPosts.length < 3) {
      toast.error("Please save at least 3 posts to analyze your voice");
      return;
    }

    await analyzeVoice.mutateAsync(savedPosts);
  };

  const handleEditPrompt = () => {
    setEditedPrompt(voiceProfile?.system_prompt || "");
    setIsEditingPrompt(true);
  };

  const handleSavePrompt = async () => {
    await updateVoiceProfile.mutateAsync({ system_prompt: editedPrompt });
    setIsEditingPrompt(false);
  };

  const handleCancelEdit = () => {
    setIsEditingPrompt(false);
    setEditedPrompt("");
  };

  const voiceScore = voiceProfile?.is_trained ? 75 + Math.min(25, (voiceProfile.sample_posts?.length || 0) * 5) : 0;

  const voiceTraits = [
    { label: "Tone", value: voiceProfile?.tone || "Not analyzed" },
    { label: "Sentence Length", value: voiceProfile?.sentence_length || "Not analyzed" },
    { label: "Emoji Usage", value: voiceProfile?.emoji_usage || "Not analyzed" },
    { label: "Writing Style", value: voiceProfile?.writing_style || "Not analyzed" },
  ];

  return (
    <Card className="bg-card border-border">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Train Your Voice
                    {voiceProfile?.is_trained && (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    AI learns to write in your unique style
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-2xl font-bold text-gradient-primary">{voiceScore}%</span>
                  <p className="text-xs text-muted-foreground">Voice Score</p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
            <Progress value={voiceScore} className="h-1.5 mt-3" />
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Add New Post */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h4 className="font-medium text-foreground">Paste Your Best Posts</h4>
              </div>
              <Textarea
                placeholder="Paste a LinkedIn post here..."
                value={currentPost}
                onChange={(e) => setCurrentPost(e.target.value)}
                className="min-h-[100px] mb-3 text-foreground"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {savedPosts.length}/10 posts saved • Min 50 characters each
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSavePost}
                  disabled={!currentPost.trim()}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Save Post
                </Button>
              </div>
            </div>

            {/* Saved Posts Cards */}
            {savedPosts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground text-sm">
                  Saved Posts ({savedPosts.length})
                </h4>
                
                <div className="grid gap-3">
                  {savedPosts.map((post, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-secondary/50 border border-border group hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                              Post {index + 1}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {post.length} chars
                            </span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-3">
                            {post}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemovePost(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Tip: Include 5-10 of your best posts for optimal voice training
                </p>
              </div>
            )}

            {/* LinkedIn Import - Coming Soon */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span className="text-sm">LinkedIn import coming soon - Use paste method for now</span>
              </div>
            </div>

            {/* Analyze Button - Centered, activates with 3+ posts */}
            <div className="flex justify-center">
              <Button
                variant="gradient"
                size="lg"
                onClick={handleAnalyze}
                disabled={analyzeVoice.isPending || savedPosts.length < 3}
                className="gap-2 px-8"
              >
                {analyzeVoice.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze My Voice
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Voice Profile - Always show, with "Not Analyzed" state when not trained */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-primary" />
                <h4 className="font-medium text-foreground">Your Voice Profile</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">What the AI knows about your writing style</p>
              <div className="grid grid-cols-2 gap-3">
                {voiceTraits.map((trait) => (
                  <div key={trait.label} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <h5 className="text-xs font-medium text-foreground mb-1">{trait.label}</h5>
                    <p className="text-sm text-muted-foreground capitalize">
                      {voiceProfile?.is_trained ? trait.value : "Not Analyzed"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* System Prompt - Always show */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium text-foreground">System Prompt</h4>
                    <p className="text-xs text-muted-foreground">The instructions that guide AI generation in your voice</p>
                  </div>
                </div>
                {!isEditingPrompt && voiceProfile?.system_prompt && (
                  <Button variant="ghost" size="sm" onClick={handleEditPrompt}>
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditingPrompt ? (
                <div className="space-y-3">
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="min-h-[120px] text-foreground"
                    placeholder="Enter your custom system prompt..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      variant="gradient" 
                      size="sm" 
                      onClick={handleSavePrompt}
                      disabled={updateVoiceProfile.isPending}
                    >
                      {updateVoiceProfile.isPending ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : voiceProfile?.system_prompt ? (
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono p-3 rounded-lg bg-muted/50 border border-border max-h-32 overflow-y-auto">
                  {voiceProfile.system_prompt}
                </pre>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No system prompt generated yet</p>
                  <p className="text-xs mt-1">Train your voice profile to generate a custom prompt</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});
