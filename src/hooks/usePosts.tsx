import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduled_for: string | null;
  published_at: string | null;
  linkedin_post_id: string | null;
  is_ai_generated: boolean;
  ai_prompt: string | null;
  // Draft resumption fields
  template_id?: string | null;
  input_mode?: string | null; // "voice", "url", "video", "pdf", "draft"
  input_context?: string | null;
  user_instructions?: string | null; // New field for user notes
  source_url?: string | null;
  media_urls?: string[];
  created_at: string;
  updated_at: string;
}

export function usePosts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["posts", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      try {
        const q = query(
          collection(db, "posts"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Timestamps to ISO strings if needed, or assume stored as strings. 
            // Better to handle both for safety during migration if we import as strings.
            // If new data, we probably save as ISO strings to match interface.
          } as Post;
        });
      } catch (error: any) {
        console.error("Error fetching posts:", error);
        // Fallback for missing index error
        if (error.code === 'failed-precondition') {
          toast.error("Firestore index required. Check console for link.");
        }
        throw error;
      }
    },
    enabled: !!user?.uid,
  });

  const createPost = useMutation({
    mutationFn: async (post: Partial<Post>) => {
      if (!user?.uid) throw new Error("Not authenticated");

      const newPost = {
        user_id: user.uid,
        content: post.content || "",
        status: post.status || "draft",
        scheduled_for: post.scheduled_for || null,
        is_ai_generated: post.is_ai_generated || false,
        ai_prompt: post.ai_prompt || null, // Only for generation snapshot
        template_id: post.template_id || null,
        input_mode: post.input_mode || null,
        input_context: post.input_context || null,
        user_instructions: post.user_instructions || null, // Save user instructions
        source_url: post.source_url || null,
        media_urls: post.media_urls || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "posts"), newPost);
      return { id: docRef.id, ...newPost } as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", user?.uid] });
      toast.success("Post saved");
    },
    onError: (error) => {
      toast.error("Failed to save post: " + error.message);
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Post> & { id: string }) => {
      const postRef = doc(db, "posts", id);
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      await updateDoc(postRef, updateData);

      // Fetch updated doc to return it (or just return optimistic)
      // Firestore updateDoc doesn't return data.
      return { id, ...updates, updated_at: updateData.updated_at } as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", user?.uid] });
    },
    onError: (error) => {
      toast.error("Failed to update post: " + error.message);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "posts", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", user?.uid] });
      toast.success("Post deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete post: " + error.message);
    },
  });

  return {
    posts: postsQuery.data || [],
    isLoading: postsQuery.isLoading,
    createPost,
    updatePost,
    deletePost,
  };
}
