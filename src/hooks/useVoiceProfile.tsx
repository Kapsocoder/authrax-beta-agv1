import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface VoiceProfile {
  id: string;
  user_id: string;
  tone: string | null;
  writing_style: string | null;
  emoji_usage: string;
  sentence_length: string;
  formatting_patterns: string[];
  sample_posts: string[];
  analysis_summary: string | null;
  is_trained: boolean;
  trained_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useVoiceProfile() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const voiceProfileQuery = useQuery({
    queryKey: ["voice-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("voice_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as VoiceProfile | null;
    },
    enabled: !!user?.id,
  });

  const analyzeVoice = useMutation({
    mutationFn: async (posts: string[]) => {
      if (!user?.id || !session?.access_token) {
        throw new Error("Not authenticated");
      }
      
      const { data, error } = await supabase.functions.invoke("analyze-voice", {
        body: { posts, userId: user.id },
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-profile", user?.id] });
      toast.success("Voice profile updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to analyze voice: " + error.message);
    },
  });

  return {
    voiceProfile: voiceProfileQuery.data,
    isLoading: voiceProfileQuery.isLoading,
    analyzeVoice,
  };
}
