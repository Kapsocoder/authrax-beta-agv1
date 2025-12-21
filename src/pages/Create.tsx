import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation, useBlocker } from "react-router-dom";
import { 
  ArrowLeft, 
  Eye, 
  Wand2, 
  Save, 
  Send, 
  Clock, 
  ChevronDown, 
  Loader2, 
  Sparkles,
  Mic,
  Upload,
  LayoutTemplate,
  ArrowRight,
  CheckCircle,
  Link as LinkIcon,
  FileText,
  Video,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { PostEditor } from "@/components/post/PostEditor";
import { LinkedInPreview } from "@/components/post/LinkedInPreview";
import { ToneSelector, ToneOption } from "@/components/studio/ToneSelector";
import { TrendingTemplates } from "@/components/templates/TrendingTemplates";
import { TemplateLibraryDialog } from "@/components/templates/TemplateLibraryDialog";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { FloatingVoiceBar } from "@/components/studio/FloatingVoiceBar";
import { Template, useTemplate, useTemplates } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useAIGeneration } from "@/hooks/useAIGeneration";
import { useAutoSaveDraft } from "@/hooks/useAutoSaveDraft";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

type StudioMode = "voice" | "draft" | "url" | "video" | "pdf" | null;

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { createPost, updatePost } = usePosts();
  const { generatePost, isGenerating } = useAIGeneration();
  const { data: allTemplates = [] } = useTemplates();
  
  // Mode from navigation state
  const initialMode = (location.state?.mode as StudioMode | "edit" | "resume" | "template") || null;
  const initialTopic = searchParams.get("topic") || "";
  const initialTemplateId = searchParams.get("template") || location.state?.templateId as string || "";
  const scheduledContent = location.state?.content as string | undefined;
  const prefilledContent = location.state?.prefilledContent as string | undefined;
  const resumePostId = location.state?.postId as string | undefined;
  const resumeSourceType = location.state?.sourceType as string | undefined;

  // Handle resume mode - convert sourceType back to mode
  const getInitialModeFromResume = (): StudioMode => {
    if (initialMode === "resume" && resumeSourceType) {
      if (resumeSourceType.includes("voice")) return "voice";
      if (resumeSourceType.includes("url") || resumeSourceType.includes("Source:")) return "url";
      if (resumeSourceType.includes("video")) return "video";
      if (resumeSourceType.includes("pdf")) return "pdf";
      if (resumeSourceType === "draft") return "draft";
    }
    // template mode should go to studio (null mode) but with template pre-selected
    return initialMode === "edit" || initialMode === "resume" || initialMode === "template" ? null : (initialMode as StudioMode);
  };

  const [mode, setMode] = useState<StudioMode>(getInitialModeFromResume());
  const [capturedContent, setCapturedContent] = useState(
    prefilledContent || (initialMode === "resume" ? (location.state?.content as string || "") : "")
  );
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState(
    initialMode === "edit" ? (location.state?.content as string || "") : ""
  );
  const [selectedTone, setSelectedTone] = useState<ToneOption>("professional");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState("write");
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(resumePostId || null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blockerProceedRef = useRef<(() => void) | null>(null);

  // Track unsaved changes
  useEffect(() => {
    if (generatedContent && generatedContent !== lastSavedContent) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [generatedContent, lastSavedContent]);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      hasGeneratedContent &&
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      blockerProceedRef.current = blocker.proceed;
      setShowUnsavedDialog(true);
    }
  }, [blocker.state]);

  // Auto-save draft when content is captured (but NOT when editing an existing post)
  const isEditingExisting = initialMode === "edit" || initialMode === "resume";
  const autoSaveContent = mode === "url" || mode === "video" ? urlInput : capturedContent;
  const { hasAutoSaved, reset: resetAutoSave } = useAutoSaveDraft({
    content: autoSaveContent,
    sourceUrl: urlInput || undefined,
    sourceType: mode,
    enabled: autoSaveContent.length > 10 && !isEditingExisting,
  });

  // Set initial template from URL/state once templates are loaded
  useEffect(() => {
    if (initialTemplateId && allTemplates.length > 0 && !selectedTemplate) {
      const found = allTemplates.find(t => t.id === initialTemplateId);
      if (found) {
        setSelectedTemplate(found);
      }
    }
  }, [initialTemplateId, allTemplates, selectedTemplate]);

  // If coming from schedule with content, go straight to editor
  useEffect(() => {
    if (scheduledContent) {
      setGeneratedContent(scheduledContent);
      setMode(null);
    } else if (initialTopic && !mode) {
      setCapturedContent(initialTopic);
    }
  }, [scheduledContent, initialTopic]);

  const hasGeneratedContent = generatedContent.length > 0;
  const hasCapturedContent = capturedContent.length > 0 || urlInput.length > 0 || uploadedFileName !== null;

  const handleGeneratePost = async () => {
    let prompt = capturedContent;
    let generationType: "topic" | "url" | "voice" | "repurpose" = "topic";

    if (mode === "url" || mode === "video") {
      if (!urlInput.trim()) {
        toast.error("Please enter a URL");
        return;
      }
      // Combine URL with additional context
      prompt = urlInput;
      if (additionalContext.trim()) {
        prompt = `URL: ${urlInput}\n\nAdditional context: ${additionalContext}`;
      }
      generationType = "url";
    } else if (mode === "voice") {
      generationType = "voice";
      // Add additional context if provided
      if (additionalContext.trim()) {
        prompt = `${capturedContent}\n\nAdditional notes: ${additionalContext}`;
      }
    } else if (mode === "pdf") {
      generationType = "repurpose";
      // Add additional context if provided
      if (additionalContext.trim()) {
        prompt = `${capturedContent}\n\nAdditional context: ${additionalContext}`;
      }
    } else if (mode === "draft") {
      generationType = "topic";
    }

    if (!prompt.trim()) {
      toast.error("Please add some content first");
      return;
    }

    // Add template context to prompt
    let fullPrompt = prompt;
    if (selectedTemplate) {
      fullPrompt = `${prompt}\n\nUse this template format:\nTemplate: ${selectedTemplate.name}\nStructure: ${selectedTemplate.structure}\nDescription: ${selectedTemplate.description}\nPrompt instructions: ${selectedTemplate.prompt}`;
    }

    try {
      const result = await generatePost.mutateAsync({
        prompt: fullPrompt,
        type: generationType,
        tone: selectedTone,
        sourceUrl: mode === "url" || mode === "video" ? urlInput : undefined,
        voiceTranscript: mode === "voice" ? capturedContent : undefined,
      });
      setGeneratedContent(result);
      
      // Auto-save as draft on first generation
      if (!currentDraftId) {
        try {
          const newPost = await createPost.mutateAsync({
            content: result,
            status: "draft",
            is_ai_generated: true,
            ai_prompt: capturedContent || urlInput || undefined,
          });
          setCurrentDraftId(newPost.id);
          setLastSavedContent(result);
          setHasUnsavedChanges(false);
          toast.success("Post generated and saved as draft!");
        } catch (saveError) {
          toast.success("Post generated!");
          console.error("Failed to auto-save draft:", saveError);
        }
      } else {
        toast.success("Post generated!");
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSaveDraft = async () => {
    if (!generatedContent.trim()) {
      toast.error("Generate content first!");
      return;
    }
    
    try {
      if (currentDraftId) {
        // Update existing draft
        await updatePost.mutateAsync({
          id: currentDraftId,
          content: generatedContent,
        });
        toast.success("Draft updated!");
      } else {
        // Create new draft
        const newPost = await createPost.mutateAsync({
          content: generatedContent,
          status: "draft",
          is_ai_generated: true,
        });
        setCurrentDraftId(newPost.id);
      }
      setLastSavedContent(generatedContent);
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSchedule = () => {
    if (!generatedContent.trim()) {
      toast.error("Generate content first!");
      return;
    }
    navigate("/schedule", { state: { content: generatedContent } });
  };

  const handleCopyToClipboard = async () => {
    if (!generatedContent.trim()) {
      toast.error("Generate content first!");
      return;
    }
    await navigator.clipboard.writeText(generatedContent);
    toast.success("Copied! Open LinkedIn to paste your post.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      setUploadedFileName(file.name);
      // For now, just show the file name as captured content
      // In a full implementation, you'd extract text from the PDF
      setCapturedContent(`PDF uploaded: ${file.name}\n\n[PDF content extraction would go here]`);
      toast.success("PDF uploaded successfully");
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setShowTemplateLibrary(false);
    setShowTemplatePreview(null);
  };

  // For studio view - show preview first
  const handleTemplatePreview = (template: Template) => {
    setShowTemplatePreview(template);
  };

  const handleConfirmTemplateFromPreview = () => {
    if (showTemplatePreview) {
      setSelectedTemplate(showTemplatePreview);
      setShowTemplatePreview(null);
    }
  };

  const [dialogTemplate, setDialogTemplate] = useState<Template | null>(null);

  const handleRegenerateAI = async () => {
    if (!aiPrompt.trim() && !dialogTemplate) {
      toast.error("Enter instructions or select a template");
      return;
    }

    try {
      let prompt = `${generatedContent}\n\n`;
      if (aiPrompt.trim()) {
        prompt += `Modifications requested: ${aiPrompt}\n\n`;
      }
      if (dialogTemplate) {
        prompt += `Use this template format:\nTemplate: ${dialogTemplate.name}\nStructure: ${dialogTemplate.structure}\nDescription: ${dialogTemplate.description}`;
      }

      const result = await generatePost.mutateAsync({
        prompt,
        type: "topic",
        tone: selectedTone,
      });
      setGeneratedContent(result);
      setHasUnsavedChanges(true);
      setShowAIDialog(false);
      setAiPrompt("");
      setDialogTemplate(null);
      toast.success("Content regenerated!");
    } catch (error) {
      // Error handled in hook
    }
  };

  // Handle voice transcript updates
  const handleVoiceTranscriptUpdate = useCallback((text: string) => {
    setCapturedContent(text);
  }, []);

  const userName = profile?.full_name || user?.user_metadata?.full_name || "Your Name";
  const userHeadline = profile?.headline || "Professional";

  // If we have generated content, show the editor
  if (hasGeneratedContent) {
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
                  onClick={() => setGeneratedContent("")}
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
                  disabled={createPost.isPending || updatePost.isPending || !hasUnsavedChanges}
                >
                  {(createPost.isPending || updatePost.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Save Draft</span>
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
                    value={generatedContent}
                    onChange={setGeneratedContent}
                    onGenerateAI={() => setShowAIDialog(true)}
                    isGenerating={isGenerating}
                    placeholder="Refine your post..."
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <LinkedInPreview
                    content={generatedContent}
                    authorName={userName}
                    authorTitle={userHeadline}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop Split View */}
            <div className="hidden md:grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Editor</h2>
                <PostEditor
                  value={generatedContent}
                  onChange={setGeneratedContent}
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
                  content={generatedContent}
                  authorName={userName}
                  authorTitle={userHeadline}
                />
              </div>
            </div>
          </div>

          {/* Unsaved Changes Dialog */}
          <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unsaved Changes</DialogTitle>
                <DialogDescription>
                  You have unsaved changes. Would you like to save your draft before leaving?
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUnsavedDialog(false);
                    blockerProceedRef.current?.();
                    blockerProceedRef.current = null;
                  }}
                >
                  Discard
                </Button>
                <Button
                  variant="gradient"
                  onClick={async () => {
                    await handleSaveDraft();
                    setShowUnsavedDialog(false);
                    blockerProceedRef.current?.();
                    blockerProceedRef.current = null;
                  }}
                  disabled={createPost.isPending || updatePost.isPending}
                >
                  {(createPost.isPending || updatePost.isPending) ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Draft
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* AI Regeneration Dialog */}
          <Dialog open={showAIDialog} onOpenChange={(open) => {
            setShowAIDialog(open);
            if (!open) {
              setDialogTemplate(null);
              setAiPrompt("");
            }
          }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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

                {/* Tone Selector */}
                <div>
                  <Label className="mb-2 block">Tone</Label>
                  <ToneSelector selected={selectedTone} onChange={setSelectedTone} />
                </div>

                {/* Template Selection */}
                <div>
                  <Label className="mb-2 block">Template (optional)</Label>
                  {dialogTemplate ? (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{dialogTemplate.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDialogTemplate(null)}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
                      {allTemplates.slice(0, 8).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setDialogTemplate(template)}
                          className="p-3 text-left rounded-lg border border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all"
                        >
                          <p className="text-sm font-medium text-foreground line-clamp-1">{template.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{template.category}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  variant="gradient" 
                  className="w-full" 
                  onClick={handleRegenerateAI}
                  disabled={isGenerating || (!aiPrompt.trim() && !dialogTemplate)}
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

  // Studio - Capture & Generate mode
  return (
    <AppLayout onLogout={signOut}>
      <div className={cn("min-h-screen animate-fade-in", mode === "voice" && "pb-32")}>
        {/* Header */}
        <header className="sticky top-0 z-40 glass-strong border-b border-border/50 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => mode ? setMode(null) : navigate("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {mode === "voice" && "Capture Idea"}
                {mode === "draft" && "Draft Post"}
                {mode === "url" && "Import from Link"}
                {mode === "video" && "From Video"}
                {mode === "pdf" && "From PDF"}
                {!mode && "Content Studio"}
              </h1>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          {/* No mode selected - show "What's on your mind?" options */}
          {!mode && !hasCapturedContent && (
            <Card>
              <CardHeader>
                <CardTitle>What's on your mind?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50"
                    onClick={() => setMode("voice")}
                  >
                    <Mic className="w-5 h-5 text-primary" />
                    <span className="text-xs">Capture Idea</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50"
                    onClick={() => setMode("draft")}
                  >
                    <Edit3 className="w-5 h-5 text-primary" />
                    <span className="text-xs">Draft Post</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50"
                    onClick={() => setMode("url")}
                  >
                    <LinkIcon className="w-5 h-5 text-primary" />
                    <span className="text-xs">Import Link</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50"
                    onClick={() => setMode("video")}
                  >
                    <Video className="w-5 h-5 text-primary" />
                    <span className="text-xs">From Video</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50"
                    onClick={() => setMode("pdf")}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-xs">From PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50"
                    onClick={() => navigate("/schedule")}
                  >
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-xs">Schedule</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voice Capture Mode */}
          {mode === "voice" && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" />
                  Your Idea
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Live transcription display */}
                <div className="bg-secondary/50 rounded-lg p-4 min-h-[150px]">
                  {capturedContent ? (
                    <p className="text-foreground whitespace-pre-wrap">{capturedContent}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Start speaking to capture your idea...</p>
                  )}
                </div>

                {/* Additional context */}
                <div>
                  <Label htmlFor="voice-context" className="text-sm text-muted-foreground">
                    Additional context (optional)
                  </Label>
                  <Textarea
                    id="voice-context"
                    placeholder="Add any additional notes or context..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="mt-2 min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Draft Mode */}
          {mode === "draft" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  Draft Your Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write your thoughts, ideas, or bullet points here...

Example:
• Just closed a big deal
• Learned that persistence pays off
• Want to share lessons about B2B sales"
                  value={capturedContent}
                  onChange={(e) => setCapturedContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </CardContent>
            </Card>
          )}

          {/* URL Mode */}
          {mode === "url" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  Import from Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="url-input">Article URL</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll summarize the content and remix it in your voice
                  </p>
                </div>

                {/* Additional context textarea */}
                <div>
                  <Label htmlFor="url-context">Additional context (optional)</Label>
                  <Textarea
                    id="url-context"
                    placeholder="Add your perspective or specific points you want to highlight..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="mt-2 min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Mode */}
          {mode === "video" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Import from Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="video-url-input">YouTube URL</Label>
                  <Input
                    id="video-url-input"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    We'll extract key insights and create a post
                  </p>
                </div>

                {/* Additional context textarea */}
                <div>
                  <Label htmlFor="video-context">Additional context (optional)</Label>
                  <Textarea
                    id="video-context"
                    placeholder="Add your perspective or specific points you want to highlight..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="mt-2 min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDF Mode */}
          {mode === "pdf" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Repurpose PDF/Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {uploadedFileName ? (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{uploadedFileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFileName(null);
                        setCapturedContent("");
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-32 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span>Click to upload PDF</span>
                    </div>
                  </Button>
                )}

                {/* Additional context textarea */}
                <div>
                  <Label htmlFor="pdf-context">Additional context (optional)</Label>
                  <Textarea
                    id="pdf-context"
                    placeholder="Add your perspective or specific points you want to highlight from the document..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="mt-2 min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* No mode selected but has content - show content editor */}
          {!mode && hasCapturedContent && (
            <Card>
              <CardHeader>
                <CardTitle>Your Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={capturedContent}
                  onChange={(e) => setCapturedContent(e.target.value)}
                  className="min-h-[150px]"
                />
              </CardContent>
            </Card>
          )}

          {/* Tone Selector - show when a mode is selected */}
          {mode && (
            <div className="flex justify-center">
              <ToneSelector selected={selectedTone} onChange={setSelectedTone} />
            </div>
          )}

          {/* Selected Template */}
          {selectedTemplate && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-primary" />
                    Selected Template
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                    Change
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateCard template={selectedTemplate} compact />
              </CardContent>
            </Card>
          )}

          {/* Trending Templates - show preview on click in Studio, only when mode is selected */}
          {mode && (
            <TrendingTemplates 
              onSelectTemplate={handleTemplatePreview}
              maxItems={6}
              showPreviewFirst
            />
          )}

          {/* Auto-save indicator */}
          {hasAutoSaved && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Draft auto-saved</span>
            </div>
          )}

          {/* Action Buttons - show when mode is selected */}
          {mode && (
            <div className="flex gap-3">
              {!selectedTemplate && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowTemplateLibrary(true)}
                >
                  <LayoutTemplate className="w-4 h-4 mr-2" />
                  Choose Template
                </Button>
              )}
              
              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleGeneratePost}
                disabled={isGenerating || (!hasCapturedContent && mode !== "url" && mode !== "video")}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Post
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Floating Voice Bar - only show in voice mode */}
        {mode === "voice" && (
          <FloatingVoiceBar 
            onTranscriptUpdate={handleVoiceTranscriptUpdate}
            autoStart={true}
          />
        )}

        {/* Template Library Dialog */}
        <TemplateLibraryDialog
          open={showTemplateLibrary}
          onOpenChange={setShowTemplateLibrary}
          onSelectTemplate={handleTemplateSelect}
        />

        {/* Template Preview Dialog - for studio view */}
        {showTemplatePreview && (
          <Dialog open={!!showTemplatePreview} onOpenChange={(open) => !open && setShowTemplatePreview(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 bg-background border-border">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <DialogTitle className="text-xl text-foreground">{showTemplatePreview.name}</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        {showTemplatePreview.category}
                      </DialogDescription>
                    </div>
                    {showTemplatePreview.isTrending && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
                        Trending
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="space-y-6">
                    <p className="text-foreground">{showTemplatePreview.description}</p>

                    {/* Structure */}
                    <div className="p-5 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Post Structure</h3>
                      </div>
                      <div className="space-y-3">
                        {showTemplatePreview.structure.split("→").map((step, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-primary">{index + 1}</span>
                            </div>
                            <p className="text-foreground">{step.trim()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Example */}
                    {showTemplatePreview.example && (
                      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Example</h3>
                        <p className="text-foreground text-sm whitespace-pre-wrap">{showTemplatePreview.example}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-border flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowTemplatePreview(null)}>
                    Back
                  </Button>
                  <Button variant="gradient" className="flex-1" onClick={handleConfirmTemplateFromPreview}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Use This Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}
