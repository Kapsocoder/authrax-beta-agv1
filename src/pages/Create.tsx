import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, Eye, Wand2, Save, Send, Clock, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostEditor } from "@/components/post/PostEditor";
import { LinkedInPreview } from "@/components/post/LinkedInPreview";
import { ContentSourceSelector, ContentSource } from "@/components/studio/ContentSourceSelector";
import { ToneSelector, ToneOption } from "@/components/studio/ToneSelector";
import { VoiceInputButton } from "@/components/studio/VoiceInputButton";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useAIGeneration } from "@/hooks/useAIGeneration";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StudioStep = "source" | "editor";

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { createPost, updatePost } = usePosts();
  const { generatePost, isGenerating } = useAIGeneration();
  
  const [step, setStep] = useState<StudioStep>("source");
  const [content, setContent] = useState("");
  const [selectedTone, setSelectedTone] = useState<ToneOption>("professional");
  const [activeTab, setActiveTab] = useState("write");
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const initialTopic = searchParams.get("topic") || "";
  const scheduledContent = location.state?.content as string | undefined;

  // If coming from schedule with content or with a topic param, go straight to editor
  useEffect(() => {
    if (scheduledContent) {
      setContent(scheduledContent);
      setStep("editor");
    } else if (initialTopic) {
      // Stay on source step but prefill the topic
    }
  }, [scheduledContent, initialTopic]);

  const handleSourceSelect = async (source: ContentSource) => {
    let prompt = "";
    let generationType: "topic" | "url" | "voice" | "repurpose" = "topic";

    switch (source.type) {
      case "idea":
        prompt = source.content;
        generationType = "topic";
        break;
      case "url":
        prompt = `Create a post based on this ${source.urlType === "youtube" ? "video" : "article"}: ${source.url}`;
        generationType = "url";
        break;
      case "voice":
        prompt = source.transcript;
        generationType = "voice";
        break;
    }

    try {
      const generatedContent = await generatePost.mutateAsync({
        prompt,
        type: generationType,
        tone: selectedTone,
        sourceUrl: source.type === "url" ? source.url : undefined,
        voiceTranscript: source.type === "voice" ? source.transcript : undefined,
      });
      setContent(generatedContent);
      setStep("editor");
      toast.success("Content generated!");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim() && !initialTopic) {
      setShowAIDialog(true);
      return;
    }

    const prompt = aiPrompt.trim() || initialTopic;
    try {
      const generatedContent = await generatePost.mutateAsync({
        prompt,
        type: "topic",
        tone: selectedTone,
      });
      setContent(generatedContent);
      setShowAIDialog(false);
      setAiPrompt("");
      toast.success("Content generated!");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    
    await createPost.mutateAsync({
      content,
      status: "draft",
      is_ai_generated: true,
    });
  };

  const handleSchedule = () => {
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    navigate("/schedule", { state: { content } });
  };

  const handleCopyToClipboard = async () => {
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    await navigator.clipboard.writeText(content);
    toast.success("Copied! Open LinkedIn to paste your post.");
  };

  const handleVoiceAppend = (transcript: string) => {
    setContent(prev => prev + (prev ? "\n\n" : "") + transcript);
  };

  const userName = profile?.full_name || user?.user_metadata?.full_name || "Your Name";
  const userHeadline = profile?.headline || "Professional";

  // Source Selection Step
  if (step === "source") {
    return (
      <AppLayout onLogout={signOut}>
        <div className="min-h-screen animate-fade-in">
          {/* Header */}
          <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard")}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Content Studio
                </h1>
              </div>
            </div>
          </header>

          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {/* Tone Selector */}
            <div className="mb-6 flex justify-center">
              <div className="inline-block">
                <ToneSelector selected={selectedTone} onChange={setSelectedTone} />
              </div>
            </div>

            {/* Content Source Selector */}
            <ContentSourceSelector
              onSelect={handleSourceSelect}
              onCancel={() => navigate("/dashboard")}
              isLoading={isGenerating}
              prefilledTopic={initialTopic}
            />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Editor Step
  return (
    <AppLayout onLogout={signOut}>
      <div className="min-h-screen animate-fade-in">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep("source")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-semibold text-foreground">Edit Post</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSaveDraft}
                disabled={createPost.isPending}
              >
                {createPost.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span className="hidden sm:inline">Save</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="gradient" size="sm">
                    Publish
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleCopyToClipboard}>
                    <Send className="w-4 h-4 mr-2" />
                    Copy & Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSchedule}>
                    <Clock className="w-4 h-4 mr-2" />
                    Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Post Now (Soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {/* Tone indicator */}
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Tone:</span>
            <ToneSelector selected={selectedTone} onChange={setSelectedTone} />
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <PostEditor
                  value={content}
                  onChange={setContent}
                  onGenerateAI={() => setShowAIDialog(true)}
                  isGenerating={isGenerating}
                  placeholder="Refine your post..."
                />
                <div className="mt-3 flex justify-end">
                  <VoiceInputButton onTranscript={handleVoiceAppend} size="sm" />
                </div>
              </TabsContent>
              <TabsContent value="preview">
                <LinkedInPreview
                  content={content}
                  authorName={userName}
                  authorTitle={userHeadline}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop Split View */}
          <div className="hidden md:grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-muted-foreground">Editor</h2>
                <VoiceInputButton onTranscript={handleVoiceAppend} size="sm" />
              </div>
              <PostEditor
                value={content}
                onChange={setContent}
                onGenerateAI={() => setShowAIDialog(true)}
                isGenerating={isGenerating}
                placeholder="Refine your post..."
              />
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                LinkedIn Preview
              </h2>
              <LinkedInPreview
                content={content}
                authorName={userName}
                authorTitle={userHeadline}
              />
            </div>
          </div>
        </div>

        {/* AI Regeneration Dialog */}
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Regenerate with AI
              </DialogTitle>
              <DialogDescription>
                Describe what changes you'd like and let AI create a new version.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="ai-prompt">What would you like to change?</Label>
                <Input
                  id="ai-prompt"
                  placeholder="e.g., 'Make it more punchy' or 'Add a call to action'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="mb-4">
                <ToneSelector selected={selectedTone} onChange={setSelectedTone} />
              </div>
              <Button 
                variant="gradient" 
                className="w-full" 
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiPrompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
