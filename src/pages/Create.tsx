import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
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
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";
import { TemplateLibraryDialog } from "@/components/templates/TemplateLibraryDialog";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { FloatingVoiceBar } from "@/components/studio/FloatingVoiceBar";
import { GenerateImageDialog } from "@/components/studio/GenerateImageDialog";
import { Template, useTemplate, useTemplates } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVoiceProfile, isVoiceProfileReady } from "@/hooks/useVoiceProfile";
import {
  usePosts,
  type ScheduledPostV2,
  type LinkedInShareConfig,
  type CreatePostData,
  type PostMedia
} from "@/hooks/usePosts";
import { useAIGeneration } from "@/hooks/useAIGeneration";
import { useAutoSaveDraft } from "@/hooks/useAutoSaveDraft";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNavigationGuard } from "@/contexts/NavigationGuardContext";
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { functions } from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { storage } from "@/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type StudioMode = "voice" | "draft" | "url" | "video" | "pdf" | null;

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { profile, checkUsageLimit, incrementUsage, usageCount } = useProfile();
  const { voiceProfile, updateVoiceProfile } = useVoiceProfile();
  const { createPost, updatePost } = usePosts();
  const { generatePost, regeneratePost, isGenerating } = useAIGeneration();
  const { trackTemplateUsed } = useAnalytics();
  const { data: allTemplates = [] } = useTemplates();

  // Mode from navigation state
  const initialMode = (location.state?.mode as StudioMode | "edit" | "resume" | "template") || null;
  const initialTopic = searchParams.get("topic") || "";
  const initialTemplateId = searchParams.get("template") || location.state?.templateId as string || "";
  const scheduledContent = location.state?.content as string | undefined;
  const prefilledContent = location.state?.prefilledContent as string | undefined;
  const resumePostId = location.state?.postId as string | undefined;
  const resumeSourceType = location.state?.sourceType as string | undefined;
  const resumeTemplateId = location.state?.templateId as string | undefined;
  const resumeInputContext = location.state?.inputContext as string | undefined;
  const resumeSourceUrl = location.state?.sourceUrl as string | undefined;
  const aiPrompt = location.state?.aiPrompt as string | undefined;

  // Handle resume mode - convert sourceType back to mode
  const getInitialModeFromResume = (): StudioMode => {
    // Both resume and edit modes should restore the input mode
    if (initialMode === "resume" || initialMode === "edit") {
      // 1. Try explicit Source Type
      if (resumeSourceType) {
        const type = resumeSourceType.toLowerCase();
        if (type === "voice" || type.includes("voice")) return "voice";
        if (type === "url" || type.includes("url") || type.includes("link") || type.includes("source:")) return "url";
        if (type === "video" || type.includes("video") || type.includes("youtube")) return "video";
        if (type === "pdf" || type.includes("pdf")) return "pdf";
        if (type === "draft") return "draft";
      }
      // 2. Fallback: Infer from Source URL presence
      if (resumeSourceUrl) {
        if (resumeSourceUrl.includes("youtube.com") || resumeSourceUrl.includes("youtu.be")) return "video";
        return "url";
      }
      // 3. Fallback: Infer from Context/Content
      if (resumeInputContext && resumeInputContext.includes("Filename:")) return "pdf";
    }
    // template mode should go to studio (null mode) but with template pre-selected
    if (initialMode === "template") return null;

    // Default to 'draft' mode for edit/resume if no specific source type is found,
    // ensuring the editor UI is shown instead of "What's on your mind?"
    return (initialMode === "edit" || initialMode === "resume") ? "draft" : (initialMode as StudioMode);
  };

  const [mode, setMode] = useState<StudioMode>(getInitialModeFromResume());
  const [capturedContent, setCapturedContent] = useState(() => {
    if (prefilledContent) return prefilledContent;

    // Resume/Edit Logic
    if (initialMode === "resume" || initialMode === "edit") {
      // 1. Try input_context (The source text/prompt)
      const ctx = location.state?.inputContext as string;
      if (ctx) return ctx;

      // 2. Try content (Only if NOT AI generated - manual draft)
      // If it was AI generated, 'content' is the output. We want the input source here.
      const content = location.state?.content as string;
      // We can check is_ai_generated implied by 'edit' mode usually, but strict check:
      // If no inputContext and it IS ai generated, we might want to fallback to aiPrompt

      // 3. AI Prompt / Notes fallback
      if (aiPrompt && !["url", "video", "pdf", "voice"].includes(resumeSourceType || "")) return aiPrompt;

      // 4. If Manual draft and no context, content IS the input
      if (content && initialMode === "resume") return content;
    }
    return "";
  });

  const [generatedContent, setGeneratedContent] = useState(
    // In edit mode, content is the generated post. In resume mode, it might be empty.
    initialMode === "edit" ? (location.state?.content as string || "") : ""
  );
  const [selectedTone, setSelectedTone] = useState<ToneOption>("professional");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState("write");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [urlInput, setUrlInput] = useState(
    resumeSourceUrl ??
    resumeSourceUrl ??
    (((initialMode === "resume" || initialMode === "edit") && (aiPrompt?.toLowerCase().includes("source:") || aiPrompt?.toLowerCase().includes("url:")))
      ? (aiPrompt?.match(/(?:Source:|URL:)\s*(https?:\/\/[^\s]+)/i)?.[1] || "")
      : "")
  );



  // Use captured content as additional context for URL modes when resuming
  const [additionalContext, setAdditionalContext] = useState(
    location.state?.user_instructions !== undefined
      ? (location.state.user_instructions as string || "")
      : (aiPrompt || "")
  );
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(resumePostId || null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Recovery Effect: If mode is lost, try to recover based on available data
  useEffect(() => {
    if (!mode) {
      if (urlInput) {
        if (urlInput.includes("youtube.com") || urlInput.includes("youtu.be")) {
          setMode("video");
        } else if (urlInput.includes("http") || urlInput.includes("www")) {
          setMode("url");
        }
      } else if (uploadedFileName || capturedContent?.includes("Filename:")) {
        setMode("pdf");
      }
    }
  }, [mode, urlInput, uploadedFileName, capturedContent]);
  const [lastSavedContent, setLastSavedContent] = useState<string>("");
  const [localHasUnsavedChanges, setLocalHasUnsavedChanges] = useState(false);

  // Media State
  // Media State
  const [mediaItems, setMediaItems] = useState<PostMedia[]>(() => {
    if (initialMode === "resume" || initialMode === "edit") {
      return location.state?.media_items || [];
    }
    return [];
  });

  const [mediaFiles, setMediaFiles] = useState<Array<{ url: string; type: 'image' | 'video'; file?: File }>>(() => {
    if (initialMode === "resume" || initialMode === "edit") {
      const items = location.state?.media_items as PostMedia[] || [];
      const legacyUrls = location.state?.media_urls as string[] || [];

      // Prefer media_items if available
      if (items.length > 0) {
        return items.map(item => ({
          url: item.url,
          type: item.type,
          // No file object for resumed items
        }));
      }

      // Fallback to legacy media_urls
      if (legacyUrls.length > 0) {
        return legacyUrls.map(url => ({
          url,
          type: 'image', // Assume image for legacy
        }));
      }
    }
    return [];
  });
  const [showGenerateImageDialog, setShowGenerateImageDialog] = useState(false);

  // Track last used generation params to disable regenerate if no changes
  const [lastGenerationParams, setLastGenerationParams] = useState<{
    content: string;
    context: string;
    tone: string;
    templateId: string | null;
  } | null>(() => {
    // If we have generated content (Edit/Resume), initialize params so Regenerate is disabled
    if ((initialMode === "edit" || initialMode === "resume") && (location.state?.content as string)) {
      return {
        // This must match what capturedContent initializes to for the check to work
        content: (location.state?.inputContext as string) ||
          (aiPrompt && !["url", "video", "pdf", "voice"].includes(resumeSourceType || "") ? aiPrompt : "") ||
          ((initialMode === "resume" && !location.state?.inputContext) ? (location.state?.content as string) : "") ||
          "",
        context: location.state?.user_instructions as string || "",
        tone: "professional", // Default tone assumption
        templateId: location.state?.templateId as string || null
      };
    }
    return null;
  });

  const handleToggleBrandDNA = async (checked: boolean) => {
    const isReady = isVoiceProfileReady(voiceProfile);
    if (!isReady && checked) {
      toast.error("You must train your brand voice before enabling it.");
      return;
    }

    try {
      await updateVoiceProfile.mutateAsync({ isActive: checked });
      // Optional: Add analytics tracking here if needed
    } catch (error) {
      // Error handled in hook
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveDraftRef = useRef<() => Promise<void>>();

  // Global navigation guard
  const { setHasUnsavedChanges, setOnSave } = useNavigationGuard();

  // Track unsaved changes
  useEffect(() => {
    if (generatedContent && generatedContent !== lastSavedContent) {
      setLocalHasUnsavedChanges(true);
      setHasUnsavedChanges(true);
    } else {
      setLocalHasUnsavedChanges(false);
      setHasUnsavedChanges(false);
    }
  }, [generatedContent, lastSavedContent, setHasUnsavedChanges]);

  // Handle browser beforeunload for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (localHasUnsavedChanges && generatedContent) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [localHasUnsavedChanges, generatedContent]);

  // Restore PDF filename from content if resuming
  useEffect(() => {
    if ((mode === "pdf") && capturedContent && !uploadedFileName) {
      const match = capturedContent.match(/^Filename: (.*?)\n\n/);
      if (match && match[1]) {
        setUploadedFileName(match[1]);
      }
    }
  }, [mode, capturedContent, uploadedFileName]);

  // Register save function with navigation guard
  useEffect(() => {
    setOnSave(async () => {
      if (saveDraftRef.current) {
        await saveDraftRef.current();
      }
    });
    return () => {
      setHasUnsavedChanges(false);
      setOnSave(null);
    };
  }, [setHasUnsavedChanges, setOnSave]);

  // Auto-save draft when content is captured (but NOT when editing an existing post)
  const isEditingExisting = initialMode === "edit" || initialMode === "resume";

  // For all modes (including Draft), capturedContent is the INPUT (source material).
  // The 'content' field should be the GENERATED post (or empty initially), not the source.
  const autoSaveContent = generatedContent;

  const { hasAutoSaved, reset: resetAutoSave, triggerSave } = useAutoSaveDraft({
    content: autoSaveContent,
    sourceUrl: urlInput || undefined,
    sourceType: mode,
    templateId: selectedTemplate?.id || null,
    inputContext: capturedContent, // Correct mapping: Raw Content -> input_context
    userInstructions: additionalContext,   // Correct mapping: User Notes -> user_instructions
    // Enable if there is ANY content (URL or text) that is substantial enough
    // Allow auto-save for updates to existing drafts (edit/resume) too
    enabled: (
      autoSaveContent.length >= 5 ||
      (urlInput.length >= 5) ||
      (capturedContent.length >= 5) // Also check inputContext (capturedContent) presence
    ),
    currentDraftId: currentDraftId,
    onDraftCreated: (id) => setCurrentDraftId(id)
  });

  // Fetch specific template if resuming or starting with one (Robust fallback)
  const targetTemplateId = initialTemplateId || resumeTemplateId;
  const { data: resumedTemplate } = useTemplate(targetTemplateId);

  // Set initial template from resumed template data
  useEffect(() => {
    if (resumedTemplate && !selectedTemplate) {
      setSelectedTemplate(resumedTemplate);
    }
  }, [resumedTemplate, selectedTemplate]);

  // Fallback: If resumedTemplate not yet loaded or failed, try finding in allTemplates
  useEffect(() => {
    if (targetTemplateId && allTemplates.length > 0 && !selectedTemplate && !resumedTemplate) {
      const found = allTemplates.find(t => t.id === targetTemplateId);
      if (found) {
        setSelectedTemplate(found);
      }
    }
  }, [targetTemplateId, allTemplates, selectedTemplate, resumedTemplate]);

  // If coming from schedule with content, go straight to editor
  useEffect(() => {
    if (scheduledContent) {
      setGeneratedContent(scheduledContent);
      // Only clear mode if NOT resuming/editing (e.g. coming back from schedule page)
      // For Edit/Resume, we want to stay in the specific mode (e.g. Draft) to show the setup UI
      if (initialMode !== "edit" && initialMode !== "resume") {
        setMode(null);
      }
    } else if (initialTopic && !mode) {
      setCapturedContent(initialTopic);
    }
  }, [scheduledContent, initialTopic]);

  const hasGeneratedContent = generatedContent.length > 0;
  const hasCapturedContent = capturedContent.length > 0 || urlInput.length > 0 || uploadedFileName !== null;

  const handleGeneratePost = async () => {
    if (!checkUsageLimit()) {
      setShowSubscriptionModal(true);
      return;
    }

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
      // For PDF, collected text is already in capturedContent
      // For URL/Video, we might have previewed content or we just send the URL

      const functionData = {
        prompt: fullPrompt, // Using fullPrompt as it's built in the existing logic
        type: mode || 'draft',
        tone: selectedTone, // Original uses selectedTone directly
        sourceUrl: urlInput,
        voiceTranscript: null as string | null,
        inputContext: capturedContent || null,
        userInstructions: additionalContext || null,
        postId: currentDraftId,
        templateId: selectedTemplate?.id || null,
        mediaUrls: mediaFiles.map(m => m.url).filter(url => url.startsWith('http')), // Only pass real URLs
        // Pass the previewed content if available to avoid re-extraction
        originalContent: (mode === 'url' || mode === 'video' || mode === 'pdf') ? capturedContent : null
      };

      const result = await generatePost.mutateAsync({
        prompt: functionData.prompt,
        type: functionData.type as any, // Cast to any as type is more specific in functionData
        tone: functionData.tone,
        sourceUrl: functionData.sourceUrl,
        voiceTranscript: functionData.voiceTranscript,
        // New strict fields
        postId: functionData.postId,
        inputContext: functionData.inputContext,
        userInstructions: functionData.userInstructions,
        templateId: functionData.templateId,
        mediaUrls: functionData.mediaUrls
      });

      setGeneratedContent(result);

      // Track Template Usage
      if (selectedTemplate) {
        trackTemplateUsed(selectedTemplate.id, selectedTemplate.name);
      } // Backend usage_count is handled by Cloud Function

      // Update last generation params
      setLastGenerationParams({
        content: capturedContent || urlInput,
        context: additionalContext,
        tone: selectedTone,
        templateId: selectedTemplate?.id || null,
      });

      // Auto-save as draft on first generation
      // Save generated content to draft
      if (currentDraftId) {
        try {
          await updatePost.mutateAsync({
            id: currentDraftId,
            content: result,
            is_ai_generated: true,
            status: "draft",
            ai_prompt: fullPrompt, // Capture FULL snapshot on generation
            // Only update input_context if we have new content OR if in direct input mode (draft/voice)
            // This prevents wiping scraped content in URL/Video mode if re-generating without re-previewing
            ...((capturedContent || mode === 'draft' || mode === 'voice') ? { input_context: capturedContent || null } : {}),
            user_instructions: additionalContext || null
          });
          toast.success("Draft updated with generated content");
          setLastSavedContent(result);
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error("Failed to update draft:", error);
          toast.error("Failed to save draft update");
        }
      } else {
        try {
          const newPost = await createPost.mutateAsync({
            content: result,
            status: "draft",
            is_ai_generated: true,
            ai_prompt: fullPrompt, // Capture FULL snapshot
            user_instructions: additionalContext || null,
            input_context: capturedContent || null,
            input_mode: mode || "draft",
            source_url: urlInput || null,
          });
          setCurrentDraftId(newPost.id);
          setLastSavedContent(result);
          setHasUnsavedChanges(false);
          toast.success("Post generated and saved as draft!");
        } catch (saveError) {
          toast.success("Post generated!");
          console.error("Failed to auto-save draft:", saveError);
        }
      }
      incrementUsage.mutate();
    } catch (error) {
      // Error handled in hook
    }
  };

  // --- Content Preview Logic ---
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleFetchPreview = async () => {
    if (!urlInput) {
      toast.error("Please enter a URL first.");
      return;
    }

    setIsPreviewLoading(true);
    setCapturedContent("");

    try {
      const extractContentFn = httpsCallable(functions, 'extractContent');
      const result: any = await extractContentFn({ url: urlInput, type: mode });

      if (result.data.success) {
        setCapturedContent(result.data.content);
        // User requested immediate draft update when preview is generated.
        triggerSave(result.data.content, urlInput);
        toast.success("Content summary generated & saved to draft!");
      }
    } catch (error: any) {
      console.error("Preview generation failed:", error);
      setCapturedContent("⚠️ Could not generate summary. Please ensure the video is public and accessible.");
      toast.error(error.message || "Failed to generate preview.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSaveDraft = useCallback(async () => {
    if (!generatedContent.trim()) {
      toast.error("Generate content first!");
      return;
    }

    let toastId: string | number | undefined;

    try {
      // 1. Upload new media files to storage
      toastId = toast.loading("Uploading media...");

      const uploadedMediaUrls: string[] = [];
      const updatedMediaFiles = [...mediaFiles];
      // Create a map to update mediaItems by index or ID if needed. 
      // Current logic assumes mediaFiles and mediaItems are in sync by index. 
      // Wait, mediaItems might have different length or order? 
      // Actually mediaFiles and mediaItems are managed in parallel.
      // Better approach: Re-construct mediaItems from the upload results.

      const processUploads = async () => {
        // We only need to upload if there is a 'file' object.
        // If it's a URL (from AI), we just keep it. 
        // BUT, if it is a blob URL from AI (if we change AI logic), we would need to upload.
        // Current AI logic returns a remote URL from 'generateImage' cloud function?
        // Wait, 'generateImage' returns { imageUrl: ... }. Is it signed URL or public? 
        // It saves to 'generated_images/...'. It's a persistent URL.
        // So we only need to upload user files.

        await Promise.all(mediaFiles.map(async (media, index) => {
          let finalUrl = media.url;

          if (media.file) {
            // It's a user upload that hasn't been sent to storage yet
            const storageRef = ref(storage, `users/${user?.uid}/uploads/${Date.now()}_${media.file.name}`);
            await uploadBytes(storageRef, media.file);
            finalUrl = await getDownloadURL(storageRef);

            // Update local state so we don't re-upload next time
            updatedMediaFiles[index] = { ...media, url: finalUrl, file: undefined };
          }

          uploadedMediaUrls.push(finalUrl);
        }));
      };

      if (mediaFiles.length > 0 && user?.uid) {
        await processUploads();
        setMediaFiles(updatedMediaFiles);
      }

      toast.dismiss(toastId);

      // 2. Prepare mediaItems for Firestore (Sanitize undefined)
      // We must sync mediaItems URLs with the uploaded URLs.
      // mediaItems[i] corresponds to mediaFiles[i].
      const sanitizedMediaItems = mediaItems.map((item, index) => {
        // Get the final URL from the upload process
        // Note: This relies on mediaFiles and mediaItems being perfectly indexed.
        // They are added/removed together, so this should hold.
        const finalUrl = updatedMediaFiles[index]?.url || item.url;

        return {
          ...item,
          url: finalUrl,
          // Firestore doesn't accept undefined. Convert to null.
          ai_metadata: item.ai_metadata ? {
            ...item.ai_metadata,
            custom_user_prompt: item.ai_metadata.custom_user_prompt || null
          } : null,
          camera_metadata: item.camera_metadata ? {
            original_filename: item.camera_metadata.original_filename || null
          } : null
        };
      });


      if (currentDraftId) {
        // Update existing draft
        await updatePost.mutateAsync({
          id: currentDraftId,
          content: generatedContent,
          media_urls: uploadedMediaUrls,
          media_items: sanitizedMediaItems,
          // Update source fields in case they changed
          input_mode: mode,
          input_context: capturedContent || null,
          source_url: urlInput || null,
          user_instructions: additionalContext || null,
          template_id: selectedTemplate?.id || null,
        });
        toast.success("Draft updated!");
      } else {
        // Create new draft
        const newPost = await createPost.mutateAsync({
          content: generatedContent,
          status: "draft",
          is_ai_generated: true,
          media_urls: uploadedMediaUrls,
          media_items: sanitizedMediaItems,
          // Save valid inputs
          input_mode: mode,
          input_context: capturedContent || null,
          source_url: urlInput || null,
          user_instructions: additionalContext || null,
          ai_prompt: null,
          template_id: selectedTemplate?.id || null,
        });
        setCurrentDraftId(newPost.id);
      }
      setLastSavedContent(generatedContent);
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error("Save Draft Error:", error);
      toast.error("Failed to save: " + error.message);
    } finally {
      if (toastId) toast.dismiss(toastId);
    }
  }, [generatedContent, currentDraftId, createPost, updatePost, setHasUnsavedChanges, mediaFiles, mediaItems, user?.uid]);

  // Keep save ref updated
  useEffect(() => {
    saveDraftRef.current = handleSaveDraft;
  }, [handleSaveDraft]);

  const handleSchedule = async () => {
    if (!generatedContent.trim()) {
      toast.error("Generate content first!");
      return;
    }
    // Schedule action is final step in /schedule page, but clicking "Schedule" here initiates flow.
    // However, user said "Limit applies to... Scheduling Posts". 
    // Usually the limit should be at the point of *commitment*.
    // Since /schedule page handles the actual scheduling, we should enforce it there.
    // But if we want to block entry, we can do it here too.
    // Let's rely on /schedule page for the actual "Schedule" action limit, 
    // but we can check here to prevent navigation if they are already over limit?
    // User might want to see calendar. Let's leave check to /schedule page's confirm button.
    navigate("/schedule", {
      state: {
        content: generatedContent,
        postId: currentDraftId // Pass the draft ID so Schedule page can update it instead of creating new
      }
    });
  };

  const handleCopyToClipboard = async () => {
    if (!generatedContent.trim()) {
      toast.error("Generate content first!");
      return;
    }
    await navigator.clipboard.writeText(generatedContent);
    toast.success("Copied! Open LinkedIn to paste your post.");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      setUploadedFileName(file.name);

      try {
        const toastId = toast.loading("Extracting text from PDF...");
        const arrayBuffer = await file.arrayBuffer();

        // Dynamically import pdfjs-dist
        const pdfjsLib = await import('pdfjs-dist');

        // workerSrc is critical. Using unpkg as a reliable fallback for vite environments 
        // without complex worker configuration.
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = "";
        const maxPages = 50; // Limit to avoid browser crash on huge docs

        for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            // @ts-ignore
            .map((item: any) => item.str)
            .join(" ");

          fullText += `[Page ${i}]\n${pageText}\n\n`;
        }

        if (pdf.numPages > maxPages) {
          fullText += `\n... (truncated after ${maxPages} pages)`;
        }

        setCapturedContent(`Filename: ${file.name}\n\n${fullText}`);
        toast.dismiss(toastId);
        toast.success(`Extracted text from ${pdf.numPages} pages!`);

      } catch (error: any) {
        console.error("PDF Extraction Error:", error);
        toast.error("Failed to read PDF. It might be password protected or scanned.");
      }
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

  const handlePublishNow = async (visibility: "PUBLIC" | "CONNECTIONS" = "PUBLIC") => {
    if (!generatedContent.trim()) {
      toast.error("Generate content first!");
      return;
    }

    if (!checkUsageLimit()) {
      setShowSubscriptionModal(true);
      return;
    }

    const toastId = toast.loading(`Publishing to LinkedIn (${visibility === "PUBLIC" ? "Public" : "Connections only"})...`);

    try {
      // 1. Ensure all media is uploaded (Reuse upload logic - simplified for now)
      // Note: Ideally extract this upload logic to a helper
      const uploadedMediaUrls: string[] = [];
      const updatedMediaFiles = [...mediaFiles];

      if (mediaFiles.length > 0 && user?.uid) {
        // Show specific upload message if files need uploading
        if (mediaFiles.some(m => m.file)) {
          toast.message("Uploading media before publishing...", { id: toastId });
        }

        await Promise.all(mediaFiles.map(async (media, index) => {
          if (media.file) {
            const storageRef = ref(storage, `users/${user.uid}/uploads/${Date.now()}_${media.file.name}`);
            await uploadBytes(storageRef, media.file);
            const downloadUrl = await getDownloadURL(storageRef);

            uploadedMediaUrls.push(downloadUrl);
            updatedMediaFiles[index] = { ...media, url: downloadUrl, file: undefined };
          } else {
            uploadedMediaUrls.push(media.url);
          }
        }));

        setMediaFiles(updatedMediaFiles);
      }

      const publishToLinkedIn = httpsCallable(functions, 'publishToLinkedIn');
      // @ts-ignore
      const result = await publishToLinkedIn({
        content: generatedContent,
        visibility,
        mediaUrls: uploadedMediaUrls
      });

      toast.dismiss(toastId);
      // @ts-ignore
      if (result.data.success) {
        toast.success("Successfully published to LinkedIn! 🎉");
        // Update status to published if it was a draft
        // @ts-ignore
        const linkedinPostId = result.data.postId;

        if (currentDraftId) {
          await updatePost.mutateAsync({
            id: currentDraftId,
            status: "published",
            published_at: new Date().toISOString(),
            linkedin_post_id: linkedinPostId,
            media_urls: uploadedMediaUrls
          });
        } else {
          // Create and mark as published immediately
          await createPost.mutateAsync({
            content: generatedContent,
            status: "published",
            published_at: new Date().toISOString(),
            is_ai_generated: true,
            linkedin_post_id: linkedinPostId,
            media_urls: uploadedMediaUrls
          });
        }
        // Redirect to dashboard or show success state
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Publish Error:", error);
      toast.dismiss(toastId);
      toast.error("Failed to post: " + error.message);
    }
  };

  const handleConfirmTemplateFromPreview = () => {
    if (showTemplatePreview) {
      setSelectedTemplate(showTemplatePreview);
      setShowTemplatePreview(null);
    }
  };



  // Handle voice transcript updates
  const handleVoiceTranscriptUpdate = useCallback((text: string) => {
    setCapturedContent(text);
  }, []);

  // Media Handlers
  /* Media Handlers */
  const handleMediaAdd = (file: File, source: "upload" | "camera" = "upload") => {
    // Create local object URL for preview
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';

    // Add to backward compatible state
    setMediaFiles(prev => [...prev, { url, type, file }]);

    // Create new PostMedia object
    const newItem: PostMedia = {
      id: crypto.randomUUID(),
      url, // Temporary URL, will be replaced by upload URL on save? Or we upload now?
      // Note: Current logic uploads on save/publish. 
      // For now we store object URL and file, and handle upload later.
      type,
      source,
      camera_metadata: source === "camera" ? {
        original_filename: file.name
      } : undefined,
      created_at: new Date().toISOString()
    };

    setMediaItems(prev => [...prev, newItem]);
    setLocalHasUnsavedChanges(true);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaItems(prev => prev.filter((_, i) => i !== index));
    setLocalHasUnsavedChanges(true);
  };

  const handleAIImageGenerated = (url: string, metadata?: any) => {
    // Add to backward compatible state
    setMediaFiles(prev => [...prev, { url, type: 'image' }]);

    // Create new PostMedia object
    const newItem: PostMedia = {
      id: crypto.randomUUID(),
      url,
      type: 'image',
      source: 'ai_generate',
      ai_metadata: metadata,
      created_at: new Date().toISOString()
    };

    setMediaItems(prev => [...prev, newItem]);
    setLocalHasUnsavedChanges(true);
  };

  const userName = profile?.full_name || (user as any)?.user_metadata?.full_name || "Your Name";
  const userHeadline = profile?.headline || "Professional";



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

            <div className="flex items-center gap-2">
              {hasGeneratedContent && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={createPost.isPending || updatePost.isPending || !localHasUnsavedChanges}
                    className={cn(
                      "transition-all hidden md:flex",
                      localHasUnsavedChanges
                        ? "border-primary text-primary hover:bg-primary/10"
                        : "opacity-60"
                    )}
                  >
                    {(createPost.isPending || updatePost.isPending) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Draft
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
                      <DropdownMenuItem onClick={() => handlePublishNow("CONNECTIONS")}>
                        <Eye className="w-4 h-4 mr-2" />
                        Post (Connections Only)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePublishNow("PUBLIC")}>
                        <Send className="w-4 h-4 mr-2" />
                        Post Publicly
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          {/* No mode selected - show "What's on your mind?" options */}
          {!mode && !hasCapturedContent && (
            <>
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
                    {/* <Button
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary/50"
                      onClick={() => setMode("video")}
                    >
                      <Video className="w-5 h-5 text-primary" />
                      <span className="text-xs">From Video</span>
                    </Button> */}
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

              {/* Trending Templates */}
              {!selectedTemplate && (
                <TrendingTemplates
                  onSelectTemplate={handleTemplatePreview}
                  maxItems={3}
                />
              )}
            </>
          )}

          {/* Draft Mode - Explicit UI */}
          {mode === "draft" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  Draft Your Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="draft-content">Your Thoughts</Label>
                  <Textarea
                    id="draft-content"
                    value={capturedContent}
                    onChange={(e) => setCapturedContent(e.target.value)}
                    placeholder="Start typing your rough ideas, key points, or brain dump here..."
                    className="min-h-[200px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="draft-instructions" className="text-sm text-muted-foreground">
                    Instructions for AI (optional)
                  </Label>
                  <Textarea
                    id="draft-instructions"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="E.g., Polish this into a professional LinkedIn post, make it punchier, or fix the grammar..."
                    className="min-h-[80px] resize-none"
                  />
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
                  <Textarea
                    value={capturedContent}
                    onChange={(e) => setCapturedContent(e.target.value)}
                    placeholder="Start speaking to capture your idea, or type here..."
                    className="min-h-[150px] bg-transparent border-none focus-visible:ring-0 p-0 resize-none text-base"
                  />
                </div>

                {/* Additional context */}
                <div>
                  <Label htmlFor="voice-context" className="text-sm text-muted-foreground">
                    Instructions for AI (optional)
                  </Label>
                  <Textarea
                    id="voice-context"
                    placeholder="E.g., Turn this into a LinkedIn post, keep the casual tone, or focus on the second idea mentioned..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="mt-2 min-h-[80px] resize-none"
                  />
                </div>
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
                <Card className="p-6 border-2 border-dashed border-border/50 bg-secondary/20">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url-input">Paste article URL</Label>
                      <Input
                        id="url-input"
                        placeholder="https://example.com/article"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url-context">Instructions for AI (optional)</Label>
                      <Textarea
                        id="url-context"
                        placeholder="E.g., Focus on the second section, make it professional, or summarize the key takeaways..."
                        className="min-h-[100px]"
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
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
                <Card className="p-6 border-2 border-dashed border-border/50 bg-secondary/20">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="video-input">YouTube URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="video-input"
                          placeholder="https://youtube.com/watch?v=..."
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                        />
                        <Button
                          variant="outline"
                          onClick={handleFetchPreview}
                          disabled={!urlInput || isPreviewLoading}
                        >
                          {isPreviewLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Fetch Preview"
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Extracted Content Preview for Video */}
                    {capturedContent && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-sm text-muted-foreground">Transcript Preview (Editable)</Label>
                        <Textarea
                          className="min-h-[200px] font-mono text-xs"
                          value={capturedContent}
                          onChange={(e) => setCapturedContent(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="video-context">Instructions for AI (optional)</Label>
                      <Textarea
                        id="video-context"
                        placeholder="E.g., Focus on the interview segment at 5:00, extract the main tutorials, or summarize the key arguments..."
                        className="min-h-[100px]"
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
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

                {/* Extracted Content Preview */}
                {uploadedFileName && capturedContent && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm text-muted-foreground">Extracted Content Preview</Label>
                    <div className="bg-secondary/50 rounded-lg p-4 max-h-[200px] overflow-y-auto border border-border">
                      <p className="text-xs font-mono whitespace-pre-wrap text-foreground">{capturedContent}</p>
                    </div>
                  </div>
                )}

                {/* Additional context textarea */}
                <div>
                  <Label htmlFor="pdf-context">Instructions for AI (optional)</Label>
                  <Textarea
                    id="pdf-context"
                    placeholder="E.g., Summarize the findings on page 3, focus on the financial results, or rewrite the conclusion in a punchy style..."
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
            <div className="flex flex-col items-center gap-4 justify-center">
              <ToneSelector selected={selectedTone} onChange={setSelectedTone} />

              {voiceProfile?.is_trained && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20">
                  <Label htmlFor="brand-dna-toggle-create" className="text-xs font-medium cursor-pointer flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Use Brand DNA
                  </Label>
                  <Switch
                    id="brand-dna-toggle-create"
                    checked={!!voiceProfile.isActive}
                    onCheckedChange={handleToggleBrandDNA}
                    className="scale-75 origin-left"
                  />
                </div>
              )}
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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTemplate(null)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Clear
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowTemplateLibrary(true)}>
                      Change
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateCard template={selectedTemplate} compact />
              </CardContent>
            </Card>
          )}

          {/* Trending Templates - show preview on click in Studio, only when mode is selected */}
          {mode && !selectedTemplate && (
            <TrendingTemplates
              onSelectTemplate={handleTemplatePreview}
              maxItems={3}
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
              {/* Always show template button if no template selected yet, ensuring user can add one */}
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
                disabled={
                  isGenerating ||
                  (!hasCapturedContent && mode !== "url" && mode !== "video") ||
                  (hasGeneratedContent && lastGenerationParams &&
                    lastGenerationParams.content === (capturedContent || urlInput) &&
                    lastGenerationParams.context === additionalContext &&
                    lastGenerationParams.tone === selectedTone &&
                    lastGenerationParams.templateId === (selectedTemplate?.id || null)
                  )
                }
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {hasGeneratedContent ? "Regenerate" : "Generate Post"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Editor Section - Visible after generation */}
          {hasGeneratedContent && (
            <div className="mt-8 pt-8 border-t border-border animate-fade-in text-left">
              <h2 className="text-xl font-semibold mb-6 text-foreground">Your Post</h2>

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
                      isGenerating={isGenerating}
                      placeholder="Refine your post..."
                      media={mediaFiles}
                      onAddMedia={handleMediaAdd}
                      onRemoveMedia={handleRemoveMedia}
                      onGenerateImage={() => setShowGenerateImageDialog(true)}
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
                    isGenerating={isGenerating}
                    placeholder="Refine your post..."
                    media={mediaFiles}
                    onAddMedia={handleMediaAdd}
                    onRemoveMedia={handleRemoveMedia}
                    onGenerateImage={() => setShowGenerateImageDialog(true)}
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
          )}
        </div>



        <GenerateImageDialog
          open={showGenerateImageDialog}
          onOpenChange={setShowGenerateImageDialog}
          postContent={generatedContent}
          onGenerate={handleAIImageGenerated}
        />

        {/* Floating Voice Bar - only show in voice mode */}
        {mode === "voice" && (
          <FloatingVoiceBar
            onTranscriptUpdate={handleVoiceTranscriptUpdate}
            autoStart={true}
            transcript={capturedContent}
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
        <SubscriptionModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          currentUsage={usageCount}
        />
      </div>
    </AppLayout>
  );
}
