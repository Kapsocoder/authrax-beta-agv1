import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/firebaseConfig";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface VoiceProfile {
  id: string;
  user_id: string;
  // 4-Layer Schema
  version?: string;
  expression_layer?: {
    primary_tone: string;
    secondary_tone: string;
    sentence_style: string;
    emoji_policy: string;
    formatting_habits: string[];
  };
  belief_layer?: {
    core_beliefs_list: Array<{
      trait: string;
      rationale: string;
      evidence: string;
    }>;
    moral_posture: string;
  };
  judgement_layer?: {
    supports: string[];
    opposes: string[];
    disliked_styles: string[];
  };
  governance_layer?: {
    forbidden_zones: string[];
    hard_constraints: string[];
  };
  // Legacy / Flat Fallbacks (optional)
  tone?: string | null;
  writing_style?: string | null;
  emoji_usage?: string | null;
  sentence_length?: string | null;
  formatting_patterns?: string[] | null;

  draft_posts: string[] | null;
  sample_posts: string[] | null;
  analysis_summary: string | null;
  system_prompt: string | null;
  source_type: string | null;
  isActive?: boolean;
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

      // 1. Fetch the posts from "BestPostsFromUser" (new standard) or "default" (legacy)
      const bestPostsRef = doc(db, "users", user.uid, "voice_profiles", "BestPostsFromUser");
      const bestPostsSnap = await getDoc(bestPostsRef);

      let draftPosts: string[] = [];
      let bestPostsData: any = {};

      if (bestPostsSnap.exists()) {
        bestPostsData = bestPostsSnap.data();
        // Merge sample_posts and last_analyzed_posts, removing duplicates
        const samples = bestPostsData.sample_posts || [];
        const analyzed = bestPostsData.last_analyzed_posts || [];
        // Use Set for unique strings
        draftPosts = Array.from(new Set([...samples, ...analyzed]));
      } else {
        // Fallback: Check 'default' doc if BestPostsFromUser doesn't exist yet
        const defaultRef = doc(db, "users", user.uid, "voice_profiles", "default");
        const defaultSnap = await getDoc(defaultRef);
        if (defaultSnap.exists()) {
          const data = defaultSnap.data();
          const samples = data.sample_posts || [];
          const analyzed = data.last_analyzed_posts || [];
          draftPosts = Array.from(new Set([...samples, ...analyzed]));
        }
      }

      // 2. Query the LATEST trained profile (regardless of Active status)
      // We want to be able to toggle it on/off, so we need to fetch it even if inactive.
      const collectionRef = collection(db, "users", user.uid, "voice_profiles");
      const q = query(
        collectionRef,
        where("is_trained", "==", true),
        orderBy("created_at", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      let activeProfileData: any = {};
      let activeProfileId = "BestPostsFromUser"; // Default ID if no active profile found

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        activeProfileData = docSnap.data();
        activeProfileId = docSnap.id;

        // Helper to safely convert Firestore Timestamps to ISO strings
        const toISO = (dateVal: any) => {
          if (!dateVal) return null;
          if (typeof dateVal.toDate === 'function') {
            return dateVal.toDate().toISOString();
          }
          if (dateVal instanceof Date) {
            return dateVal.toISOString();
          }
          return dateVal; // Assume string
        };

        if (activeProfileData.created_at || activeProfileData.createdAt) {
          activeProfileData.created_at = toISO(activeProfileData.created_at || activeProfileData.createdAt);
        }
        if (activeProfileData.updated_at || activeProfileData.updatedAt) {
          activeProfileData.updated_at = toISO(activeProfileData.updated_at || activeProfileData.updatedAt);
        }
        if (activeProfileData.trained_at || activeProfileData.trainedAt) {
          activeProfileData.trained_at = toISO(activeProfileData.trained_at || activeProfileData.trainedAt);
        }
      }

      // 3. Merge: Return ONE object. 
      // draft_posts = what the user is editing (from BestPostsFromUser)
      // sample_posts = what the active profile was trained on. source: Active Profile > BestPosts snapshot > Empty
      const effectiveSamplePosts = (activeProfileData.sample_posts && activeProfileData.sample_posts.length > 0)
        ? activeProfileData.sample_posts
        : draftPosts; // Fallback to the merged draft posts if active profile has none

      return {
        id: activeProfileId,
        ...activeProfileData,
        draft_posts: draftPosts,
        sample_posts: effectiveSamplePosts,
        // Ensure user_id is set
        user_id: user.uid,
      } as VoiceProfile;
    },
    enabled: !!user?.uid,
    refetchInterval: (query) => {
      // Poll every second if we are waiting for an update
      return 1000;
    }
  });

  const updateVoiceProfile = useMutation({
    mutationFn: async (updates: Partial<VoiceProfile>) => {
      if (!user?.uid) throw new Error("Not authenticated");

      // Logic:
      // - If we are saving posts, we write to "BestPostsFromUser"
      // - If we are updating other things (like prompt), we write to the active profile ID (or create one if none?)
      // Since the UI treats it as one object, we need to split writes.

      const writes = [];

      // 1. Handle Draft Posts Update -> BestPostsFromUser
      // The UI will now send 'draft_posts' instead of 'sample_posts' for saved posts
      if (updates.draft_posts) {
        const postsRef = doc(db, "users", user.uid, "voice_profiles", "BestPostsFromUser");
        writes.push(setDoc(postsRef, {
          sample_posts: updates.draft_posts, // We still store it as 'sample_posts' in the document
          user_id: user.uid,
          updated_at: new Date().toISOString()
        }, { merge: true }));
      }

      // 2. Handle System Prompt or other DNA updates -> Active Profile
      // If we have an ID from the query that isn't BestPostsFromUser or default, use it.
      // If not, we might not have an active profile to update prompt on... 
      // But the modal only shows if is_trained/isActive, so we likely have an ID.
      const currentId = voiceProfileQuery.data?.id;
      if (currentId && currentId !== "BestPostsFromUser" && currentId !== "default") {
        const profileRef = doc(db, "users", user.uid, "voice_profiles", currentId);
        // Filter out draft_posts from this write
        const { draft_posts, sample_posts, ...otherUpdates } = updates;
        if (Object.keys(otherUpdates).length > 0) {
          writes.push(setDoc(profileRef, {
            ...otherUpdates,
            updated_at: new Date().toISOString()
          }, { merge: true }));
        }
      }

      await Promise.all(writes);

      return { ...updates } as VoiceProfile;
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

      // Snapshot the posts being analyzed as the "last_analyzed_posts"
      // This ensures we have a local truth even if the backend/n8n doesn't copy them to the new profile immediately
      const postsRef = doc(db, "users", user.uid, "voice_profiles", "BestPostsFromUser");
      await setDoc(postsRef, {
        last_analyzed_posts: posts,
        updated_at: new Date().toISOString()
      }, { merge: true });

      const token = await user.getIdToken();
      // Ensure we save the posts to BestPostsFromUser first/concurrently is handled by the UI calling update first usually,
      // but here we just trigger analysis. The backend likely reads or receives the posts.
      // The current backend function accepts 'posts' in body.

      const response = await fetch("https://us-central1-authrax-beta-lv1.cloudfunctions.net/analyzeVoice", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ posts, userId: user.uid })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to analyze voice");
      }

      return await response.json();
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
