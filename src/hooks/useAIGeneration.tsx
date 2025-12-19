import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface GeneratePostParams {
  prompt: string;
  type: "topic" | "url" | "notes" | "freeform";
}

export function useAIGeneration() {
  const { user, session } = useAuth();

  const generatePost = useMutation({
    mutationFn: async ({ prompt, type }: GeneratePostParams) => {
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }
      
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: { prompt, type, userId: user?.id },
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
