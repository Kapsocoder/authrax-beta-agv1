import { useState } from "react";
import { Sparkles, FileText, Link, Brain, Zap, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { Progress } from "@/components/ui/progress";

export default function Voice() {
  const { signOut } = useAuth();
  const { voiceProfile, isLoading, analyzeVoice } = useVoiceProfile();
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [pastedPosts, setPastedPosts] = useState("");

  const handleAnalyze = async () => {
    if (!pastedPosts.trim()) {
      return;
    }

    // Split posts by double newlines or separator
    const posts = pastedPosts
      .split(/\n\n+|---+/)
      .map(p => p.trim())
      .filter(p => p.length > 50); // Only keep substantial posts

    if (posts.length < 2) {
      return;
    }

    await analyzeVoice.mutateAsync(posts);
    setPastedPosts("");
  };

  const voiceScore = voiceProfile?.is_trained ? 75 + Math.min(25, (voiceProfile.sample_posts?.length || 0) * 5) : 0;

  const voiceTraits = [
    { 
      label: "Tone", 
      value: voiceProfile?.tone || "Not analyzed", 
      description: "Professional, Casual, etc." 
    },
    { 
      label: "Sentence Length", 
      value: voiceProfile?.sentence_length || "Not analyzed", 
      description: "Short, Medium, Long" 
    },
    { 
      label: "Emoji Usage", 
      value: voiceProfile?.emoji_usage || "Not analyzed", 
      description: "Minimal, Moderate, Heavy" 
    },
    { 
      label: "Writing Style", 
      value: voiceProfile?.writing_style || "Not analyzed", 
      description: "Story-driven, Data-backed, etc." 
    },
  ];

  return (
    <AppLayout onLogout={signOut}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Voice Training
          </h1>
          <p className="text-muted-foreground">
            Train the AI to write in your unique style
          </p>
        </div>

        {/* Voice Score Card */}
        <Card className="bg-gradient-card border-border mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Voice Profile Score</h3>
                <p className="text-sm text-muted-foreground">
                  {voiceScore === 0 ? "Add content to train your voice profile" : "Based on your writing samples"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold text-gradient-primary">{voiceScore}%</span>
              </div>
            </div>
            <Progress value={voiceScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {voiceScore < 50 
                ? "Add more posts for better AI accuracy" 
                : voiceScore < 90 
                  ? "Good foundation! Keep adding content for best results."
                  : "Excellent! Your AI voice is well-trained."}
            </p>
            {voiceProfile?.sample_posts && voiceProfile.sample_posts.length > 0 && (
              <p className="text-xs text-primary mt-1">
                {voiceProfile.sample_posts.length} posts analyzed
              </p>
            )}
          </CardContent>
        </Card>

        {/* Training Methods */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Paste Posts */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Paste Your Posts
              </CardTitle>
              <CardDescription>
                Copy and paste your best LinkedIn posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your LinkedIn posts here (one per line or separated by blank lines)..."
                value={pastedPosts}
                onChange={(e) => setPastedPosts(e.target.value)}
                className="min-h-[200px] mb-4"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Include at least 5-10 posts for best results
              </p>
            </CardContent>
          </Card>

          {/* LinkedIn URL */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Import from LinkedIn
              </CardTitle>
              <CardDescription>
                We'll analyze your public posts (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="https://linkedin.com/in/your-profile"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                className="mb-4"
                disabled
              />
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  LinkedIn import requires OAuth setup. Use paste method for now.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center mb-8">
          <Button
            variant="gradient"
            size="xl"
            onClick={handleAnalyze}
            disabled={analyzeVoice.isPending || !pastedPosts.trim()}
            className="gap-2"
          >
            {analyzeVoice.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze My Voice
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>

        {/* Voice Traits */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Your Voice Profile
              {voiceProfile?.is_trained && (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />
              )}
            </CardTitle>
            <CardDescription>
              What the AI knows about your writing style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {voiceTraits.map((trait) => (
                <div key={trait.label} className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <h4 className="font-medium text-foreground mb-1">{trait.label}</h4>
                  <p className="text-sm text-muted-foreground capitalize">{trait.value}</p>
                </div>
              ))}
            </div>
            
            {voiceProfile?.analysis_summary && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-medium text-foreground mb-2">AI Summary</h4>
                <p className="text-sm text-muted-foreground">{voiceProfile.analysis_summary}</p>
              </div>
            )}

            {voiceProfile?.formatting_patterns && voiceProfile.formatting_patterns.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-foreground mb-2">Formatting Patterns</h4>
                <div className="flex flex-wrap gap-2">
                  {voiceProfile.formatting_patterns.map((pattern, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-secondary text-xs text-foreground">
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
