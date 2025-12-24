import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/firebaseConfig";
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const voiceProfileQuery = useQuery({
    queryKey: ["voice-profile", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;

      const docRef = doc(db, "users", user.uid, "voice_profiles", "default");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as VoiceProfile;
      }
      return null;
    },
    enabled: !!user?.uid,
  });

  const updateVoiceProfile = useMutation({
    mutationFn: async (updates: Partial<VoiceProfile>) => {
      if (!user?.uid) throw new Error("Not authenticated");

      const docRef = doc(db, "users", user.uid, "voice_profiles", "default");
      const resolvedUpdates = {
        ...updates,
        user_id: user.uid,
        updated_at: new Date().toISOString()
      };

      await setDoc(docRef, resolvedUpdates, { merge: true });

      return { ...resolvedUpdates } as VoiceProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-profile", user?.uid] });
      toast.success("Voice profile updated!");
    },
    onError: (error) => {
      toast.error("Failed to update voice profile: " + error.message);
    },
  });

  const analyzeVoice = useMutation({
    mutationFn: async (posts: string[]) => {
      if (!user?.uid) {
        throw new Error("Not authenticated");
      }

      const analyzeFn = httpsCallable(functions, 'analyzeVoice');
      const result = await analyzeFn({ posts, userId: user.uid });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-profile", user?.uid] });
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
