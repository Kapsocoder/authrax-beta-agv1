import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useVoiceProfile } from "@/hooks/useVoiceProfile";
import { useProfile } from "@/hooks/useProfile";
import { 
  Linkedin, 
  FileText, 
  PenLine, 
  ArrowRight, 
  ArrowLeft,
  Check,
  Upload,
  ExternalLink,
  Sparkles,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type OnboardingStep = "link-linkedin" | "data-export" | "manual-paste" | "analyzing" | "complete";

interface OnboardingFlowProps {
  onComplete: () => void;
  isLinkedInLogin?: boolean;
}

export function OnboardingFlow({ onComplete, isLinkedInLogin = false }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    isLinkedInLogin ? "analyzing" : "link-linkedin"
  );
  const [pastedPosts, setPastedPosts] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { analyzeVoice } = useVoiceProfile();
  const { completeOnboarding, updateProfile } = useProfile();

  const handleLinkLinkedIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/dashboard?onboarding=linkedin`,
      },
    });
    
    if (error) {
      toast.error("Failed to link LinkedIn: " + error.message);
    }
  };

  const handleSkipToExport = () => {
    setCurrentStep("data-export");
  };

  const handleSkipToManual = () => {
    setCurrentStep("manual-paste");
  };

  const handleAnalyzePosts = async () => {
    const posts = pastedPosts
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(p => p.length > 50);
    
    if (posts.length < 3) {
      toast.error("Please paste at least 3 posts (separated by blank lines)");
      return;
    }
    
    setIsAnalyzing(true);
    setCurrentStep("analyzing");
    
    try {
      await analyzeVoice.mutateAsync(posts);
      await updateProfile.mutateAsync({ onboarding_completed: true });
      setCurrentStep("complete");
    } catch (error) {
      toast.error("Failed to analyze your voice. Please try again.");
      setCurrentStep("manual-paste");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSkipOnboarding = async () => {
    await completeOnboarding.mutateAsync();
    onComplete();
  };

  const getProgress = () => {
    switch (currentStep) {
      case "link-linkedin": return 25;
      case "data-export": return 50;
      case "manual-paste": return 75;
      case "analyzing": return 90;
      case "complete": return 100;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Set Up Your Voice Profile
          </h1>
          <p className="text-muted-foreground">
            Help us learn your writing style to create authentic content
          </p>
          <Progress value={getProgress()} className="mt-4 h-2" />
        </div>

        {currentStep === "link-linkedin" && (
          <Card className="border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0A66C2] flex items-center justify-center mx-auto mb-4">
                <Linkedin className="w-8 h-8 text-white" />
              </div>
              <CardTitle>Link Your LinkedIn Account</CardTitle>
              <CardDescription>
                We'll automatically analyze your recent posts to capture your unique voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleLinkLinkedIn}
                className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                size="lg"
              >
                <Linkedin className="w-5 h-5 mr-2" />
                Connect LinkedIn
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleSkipToExport}
                className="w-full"
              >
                Use Data Export Instead
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleSkipOnboarding}
                className="w-full text-muted-foreground"
              >
                Skip for now
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "data-export" && (
          <Card className="border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Upload LinkedIn Data Export</CardTitle>
              <CardDescription>
                Download your data from LinkedIn and upload it here
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">How to export your LinkedIn data:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Go to LinkedIn Settings & Privacy</li>
                  <li>Click "Get a copy of your data"</li>
                  <li>Select "Posts" and click "Request archive"</li>
                  <li>Download when ready (usually within 24 hours)</li>
                </ol>
                <a 
                  href="https://www.linkedin.com/mypreferences/d/download-my-data"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  Go to LinkedIn Data Export
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
              
              <Button variant="outline" className="w-full" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Upload ZIP/CSV (Coming Soon)
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              
              <Button 
                onClick={handleSkipToManual}
                className="w-full"
              >
                <PenLine className="w-4 h-4 mr-2" />
                Paste Posts Manually
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep("link-linkedin")}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleSkipOnboarding}
                  className="flex-1 text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "manual-paste" && (
          <Card className="border-border">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <PenLine className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Paste Your Best Posts</CardTitle>
              <CardDescription>
                Share 3-5 of your favorite LinkedIn posts, articles, or writings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`Paste your posts here, separated by blank lines...

Example:
Just had an amazing breakthrough with our product launch! Here's what I learned...

---

Leadership isn't about having all the answers. It's about asking the right questions...

---

5 things I wish I knew when starting my career...`}
                className="min-h-[250px] resize-none"
                value={pastedPosts}
                onChange={(e) => setPastedPosts(e.target.value)}
              />
              
              <p className="text-xs text-muted-foreground text-center">
                Separate each post with a blank line. Include at least 3 posts for best results.
              </p>
              
              <Button 
                onClick={handleAnalyzePosts}
                className="w-full"
                disabled={pastedPosts.trim().length < 100}
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze My Voice
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep("data-export")}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleSkipOnboarding}
                  className="flex-1 text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "analyzing" && (
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyzing Your Voice...</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our AI is studying your writing patterns, tone, and style to create your unique voice profile.
              </p>
            </CardContent>
          </Card>
        )}

        {currentStep === "complete" && (
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Voice Profile Created!</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Your AI writing assistant now understands your unique style. All generated content will sound authentically you.
              </p>
              <Button onClick={onComplete} size="lg">
                Start Creating Content
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
