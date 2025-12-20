import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface GeneratePostParams {
  prompt: string;
  type: "topic" | "url" | "voice" | "repurpose" | "notes" | "freeform";
  tone?: string;
  sourceUrl?: string;
  voiceTranscript?: string;
}

export function useAIGeneration() {
  const { user, session } = useAuth();

  const generatePost = useMutation({
    mutationFn: async ({ prompt, type, tone, sourceUrl, voiceTranscript }: GeneratePostParams) => {
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }
      
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: { 
          prompt, 
          type, 
          userId: user?.id,
          tone: tone || "professional",
          sourceUrl,
          voiceTranscript,
        },
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.content as string;
    },
    onError: (error) => {
      toast.error("Failed to generate content: " + error.message);
    },
  });

  return {
    generatePost,
    isGenerating: generatePost.isPending,
  };
}
