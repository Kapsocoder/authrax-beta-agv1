import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface UserTopic {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function useUserTopics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const topicsQuery = useQuery({
    queryKey: ["user-topics", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      const q = query(
        collection(db, "users", user.uid, "topics"),
        orderBy("created_at", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserTopic[];
    },
    enabled: !!user?.uid,
  });

  const addTopic = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.uid) throw new Error("Not authenticated");

      // 1. Check Subscription Tier
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const isPro = userData?.subscription_tier === 'pro';
      const limit = isPro ? 20 : 3;

      // 2. Check Current Count
      const topicsRef = collection(db, "users", user.uid, "topics");
      const snapshot = await getDocs(topicsRef);

      if (snapshot.size >= limit) {
        throw new Error(`You have reached the limit of ${limit} topics for your plan.`);
      }

      const newTopic = {
        user_id: user.uid,
        name,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(topicsRef, newTopic);
      return { id: docRef.id, ...newTopic };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-topics", user?.uid] });
      toast.success("Topic added!");
    },
    onError: (error) => {
      toast.error("Failed to add topic: " + error.message);
    },
  });

  const removeTopic = useMutation({
    mutationFn: async (topicId: string) => {
      if (!user?.uid) throw new Error("Not authenticated");
      await deleteDoc(doc(db, "users", user.uid, "topics", topicId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-topics", user?.uid] });
      toast.success("Topic removed");
    },
    onError: (error) => {
      toast.error("Failed to remove topic: " + error.message);
    },
  });

  const toggleTopic = useMutation({
    mutationFn: async ({ topicId, isActive }: { topicId: string; isActive: boolean }) => {
      if (!user?.uid) throw new Error("Not authenticated");

      const docRef = doc(db, "users", user.uid, "topics", topicId);
      await updateDoc(docRef, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-topics", user?.uid] });
    },
  });

  return {
    topics: topicsQuery.data ?? [],
    isLoading: topicsQuery.isLoading,
    addTopic,
    removeTopic,
    toggleTopic,
  };
}
