import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  created_at: string;
  updated_at: string;
}

export function usePosts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["posts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Post[];
    },
    enabled: !!user?.id,
  });

  const createPost = useMutation({
    mutationFn: async (post: Partial<Post>) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: post.content || "",
          status: post.status || "draft",
          scheduled_for: post.scheduled_for,
          is_ai_generated: post.is_ai_generated || false,
          ai_prompt: post.ai_prompt,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", user?.id] });
      toast.success("Post saved");
    },
    onError: (error) => {
      toast.error("Failed to save post: " + error.message);
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Post> & { id: string }) => {
      const { data, error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", user?.id] });
    },
    onError: (error) => {
      toast.error("Failed to update post: " + error.message);
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", user?.id] });
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
