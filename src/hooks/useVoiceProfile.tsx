import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface VoiceProfile {
  id: string;
  user_id: string;
  tone: string | null;
  writing_style: string | null;
  emoji_usage: string | null;
  sentence_length: string | null;
  formatting_patterns: string[] | null;
  sample_posts: string[] | null;
  analysis_summary: string | null;
  system_prompt: string | null;
  source_type: string | null;
  is_trained: boolean | null;
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

  const updateVoiceProfile = useMutation({
    mutationFn: async (updates: Partial<VoiceProfile>) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("voice_profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as VoiceProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-profile", user?.id] });
      toast.success("Voice profile updated!");
    },
    onError: (error) => {
      toast.error("Failed to update voice profile: " + error.message);
    },
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
    updateVoiceProfile,
    analyzeVoice,
  };
}
