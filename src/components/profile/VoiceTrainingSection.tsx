import { useState } from "react";
import { Sparkles, FileText, Brain, Zap, ArrowRight, Loader2, CheckCircle2, Edit3, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { toast } from "sonner";

export function VoiceTrainingSection() {
  const { voiceProfile, isLoading, analyzeVoice, updateVoiceProfile } = useVoiceProfile();
  const [pastedPosts, setPastedPosts] = useState("");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAnalyze = async () => {
    if (!pastedPosts.trim()) {
      toast.error("Please paste some posts to analyze");
      return;
    }

    const posts = pastedPosts
      .split(/\n\n+|---+/)
      .map(p => p.trim())
      .filter(p => p.length > 50);

    if (posts.length < 2) {
      toast.error("Please provide at least 2 substantial posts (50+ characters each)");
      return;
    }

    await analyzeVoice.mutateAsync(posts);
    setPastedPosts("");
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
            {/* Training Input */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h4 className="font-medium text-foreground">Paste Your Best Posts</h4>
              </div>
              <Textarea
                placeholder="Paste your LinkedIn posts here (one per line or separated by blank lines)..."
                value={pastedPosts}
                onChange={(e) => setPastedPosts(e.target.value)}
                className="min-h-[120px] mb-3 text-foreground"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Tip: Include at least 5-10 posts for best results
                </p>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={analyzeVoice.isPending || !pastedPosts.trim()}
                  className="gap-2"
                >
                  {analyzeVoice.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Voice Traits */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-primary" />
                <h4 className="font-medium text-foreground">Your Voice Profile</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {voiceTraits.map((trait) => (
                  <div key={trait.label} className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <h5 className="text-xs font-medium text-muted-foreground mb-1">{trait.label}</h5>
                    <p className="text-sm text-foreground capitalize">{trait.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            {voiceProfile?.analysis_summary && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-medium text-foreground mb-2 text-sm">AI Summary</h4>
                <p className="text-sm text-muted-foreground">{voiceProfile.analysis_summary}</p>
              </div>
            )}

            {/* System Prompt */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  <h4 className="font-medium text-foreground">System Prompt</h4>
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
                  <p className="text-sm">Train your voice to generate a custom prompt</p>
                </div>
              )}
            </div>

            {/* LinkedIn Import - Coming Soon */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span className="text-sm">LinkedIn import coming soon - Use paste method for now</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
