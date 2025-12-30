import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/firebaseConfig";
import { useAuth } from "./useAuth";
import { useUserTopics } from "./useUserTopics";
import { toast } from "sonner";

export interface RecommendedPost {
  id: string;
  user_id: string;
  topic: string;
  title: string;
  content: string;
  source_type: string;
  source_url: string | null;
  source_title: string | null;
  is_used: boolean;
  used_at?: string;
  generated_at: string;
  expires_at: string;
  created_at: string;
}

export function useRecommendedPosts() {
  const { user } = useAuth();
  const { topics } = useUserTopics();
  const queryClient = useQueryClient();

  const activeTopics = topics.filter(t => t.is_active).map(t => t.name);

  const recommendedPostsQuery = useQuery({
    queryKey: ["recommended-posts", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];


      try {
        const q = query(
          collection(db, "recommended_posts"),
          where("user_id", "==", user.uid),
          where("is_used", "==", false),
          where("expires_at", ">", new Date().toISOString()),
          orderBy("expires_at") // Firestore restriction: first orderBy must be same as inequality filter
        );

        const snapshot = await getDocs(q);

        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecommendedPost[];

        // Sort in memory to avoid composite index requirement
        return posts.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
      } catch (error) {
        console.error("useRecommendedPosts: Query failed", error);
        throw error;
      }
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });

  const usageQuery = useQuery({
    queryKey: ["recommendation-usage", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return { count: 0, isLimited: false };

      // Get start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);

      // Check subscription
      const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
      const userData = userDoc.docs[0]?.data();
      // Optimization: Could cache user profile or use AuthContext if it had custom claims
      const isPro = userData?.subscription_tier === 'pro';

      if (isPro) return { count: 0, isLimited: false };

      // Query used posts this week
      const q = query(
        collection(db, "recommended_posts"),
        where("user_id", "==", user.uid),
        where("is_used", "==", true),
        where("used_at", ">=", startOfWeek.toISOString())
      );

      const snapshot = await getDocs(q);
      return {
        count: snapshot.size,
        isLimited: snapshot.size >= 1
      };
    },
    enabled: !!user?.uid,
  });

  const generateRecommendations = useMutation({
    mutationFn: async (forceRefresh: boolean = false) => {


      if (!user?.uid) {
        console.error("generateRecommendations: No User ID");
        throw new Error("No user logged in");
      }
      if (activeTopics.length === 0) {
        console.error("generateRecommendations: No active topics");
        throw new Error("No topics configured");
      }


      try {
        const token = await user.getIdToken();
        const response = await fetch("https://us-central1-authrax-beta-lv1.cloudfunctions.net/generateRecommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user.uid,
            topics: activeTopics,
            forceRefresh,
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        const data = await response.json();

        return data as any;
      } catch (err) {
        console.error("generateRecommendations: Function call failed", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recommended-posts", user?.uid] });
      if (data.cached) {
        toast.success("Loaded saved recommendations");
      } else {
        toast.success(`Generated ${data.recommendations?.length || 0} new recommendations`);
      }
    },
    onError: (error) => {
      toast.error("Failed to generate recommendations: " + error.message);
    },
  });

  const markAsUsed = useMutation({
    mutationFn: async (postId: string) => {
      const docRef = doc(db, "recommended_posts", postId);
      await updateDoc(docRef, {
        is_used: true,
        used_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommended-posts", user?.uid] });
    },
  });

  const deleteRecommendation = useMutation({
    mutationFn: async (postId: string) => {
      const docRef = doc(db, "recommended_posts", postId);
      await deleteDoc(docRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommended-posts", user?.uid] });
      toast.success("Recommendation removed");
    },
    onError: (error) => {
      toast.error("Failed to remove: " + error.message);
    },
  });

  return {
    recommendations: recommendedPostsQuery.data || [],
    isLoading: recommendedPostsQuery.isLoading,
    generateRecommendations,
    markAsUsed,
    deleteRecommendation,
    hasTopics: activeTopics.length > 0,
    usage: usageQuery.data || { count: 0, isLimited: false },
    checkUsage: usageQuery.refetch,
  };
}
