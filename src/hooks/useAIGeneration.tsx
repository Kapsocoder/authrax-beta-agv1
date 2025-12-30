import { useMutation } from "@tanstack/react-query";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface GeneratePostParams {
  prompt: string;
  type: "topic" | "url" | "voice" | "repurpose" | "notes" | "freeform" | "draft" | "video" | "pdf";
  tone?: string;
  sourceUrl?: string;
  voiceTranscript?: string;
  // New fields for strict webhook payload
  postId?: string | null;
  inputContext?: string | null;
  userInstructions?: string | null;
  mediaUrls?: string[];
  templateId?: string | null;
}

interface RegeneratePostParams {
  editorContent: string;
  changeRequest: string;
  tone: string;
  templatePrompt?: string;
  postId?: string | null;
}

export function useAIGeneration() {
  const { user } = useAuth();

  const generatePost = useMutation({
    mutationFn: async (params: GeneratePostParams) => {
      // Note: httpsCallable handles auth tokens automatically
      const generatePostFn = httpsCallable(functions, 'generatePost');
      const result: any = await generatePostFn({
        prompt: params.prompt,
        type: params.type,
        tone: params.tone || "professional",
        sourceUrl: params.sourceUrl,
        voiceTranscript: params.voiceTranscript,
        // Pass strict payload fields
        postId: params.postId,
        inputContext: params.inputContext,
        userInstructions: params.userInstructions,
        mediaUrls: params.mediaUrls,
        templateId: params.templateId
      });

      return result.data.content as string;
    },
    onError: (error) => {
      toast.error("Failed to generate content: " + error.message);
    },
  });

  const regeneratePost = useMutation({
    mutationFn: async ({ editorContent, changeRequest, tone, templatePrompt, postId }: RegeneratePostParams) => {
      const generatePostFn = httpsCallable(functions, 'generatePost');
      const result: any = await generatePostFn({
        editorContent,
        changeRequest,
        tone,
        templatePrompt,
        postId,
        // Since we are using the same function for both initial and regen, 
        // passing these specific params triggers the regen logic in backend.
      });

      return result.data.content as string;
    },
    onError: (error) => {
      toast.error("Failed to regenerate content: " + error.message);
    },
  });

  return {
    generatePost,
    regeneratePost,
    isGenerating: generatePost.isPending || regeneratePost.isPending,
  };
}
