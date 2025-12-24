import { useMutation } from "@tanstack/react-query";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface GeneratePostParams {
  prompt: string;
  type: "topic" | "url" | "voice" | "repurpose" | "notes" | "freeform";
  tone?: string;
  sourceUrl?: string;
  voiceTranscript?: string;
}

interface RegeneratePostParams {
  editorContent: string;
  changeRequest: string;
  tone: string;
  templatePrompt?: string;
}

export function useAIGeneration() {
  const { user } = useAuth();

  const generatePost = useMutation({
    mutationFn: async ({ prompt, type, tone, sourceUrl, voiceTranscript }: GeneratePostParams) => {
      if (!user?.uid) {
        throw new Error("Not authenticated");
      }

      const token = await user.getIdToken();

      // Using onRequest function now
      const response = await fetch("https://us-central1-authrax-beta-lv1.cloudfunctions.net/generatePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt, type, tone: tone || "professional", userId: user.uid, sourceUrl, voiceTranscript
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate post");
      }

      const data = await response.json();
      return data.content as string;
    },
    onError: (error) => {
      toast.error("Failed to generate content: " + error.message);
    },
  });

  const regeneratePost = useMutation({
    mutationFn: async ({ editorContent, changeRequest, tone, templatePrompt }: RegeneratePostParams) => {
      if (!user?.uid) {
        throw new Error("Not authenticated");
      }

      const token = await user.getIdToken();

      const response = await fetch("https://us-central1-authrax-beta-lv1.cloudfunctions.net/generatePost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          // The backend expects data inside 'data' or directly in body, but let's stick to what we see in generatePost which uses flat body for some fields? 
          // Wait, generatePost in useAIGeneration.tsx sends { prompt, type ... } directly in body.
          // The backend index.ts says: `const { ... } = req.body.data || req.body;`
          // So sending directly in body is fine and safer given we are using fetch.
          // Let's pass the params expected by backend logic for regeneration: 
          // editorContent, changeRequest, templatePrompt, userId, tone.
          userId: user.uid,
          tone,
          editorContent,
          changeRequest,
          templatePrompt,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to regenerate post");
      }

      const data = await response.json();
      return data.content as string;
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
