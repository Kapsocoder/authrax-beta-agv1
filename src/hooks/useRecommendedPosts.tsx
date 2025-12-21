import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    queryKey: ["recommended-posts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("recommended_posts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false });
      
      if (error) throw error;
      return data as RecommendedPost[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const generateRecommendations = useMutation({
    mutationFn: async (forceRefresh: boolean = false) => {
      if (!user?.id || activeTopics.length === 0) {
        throw new Error("No topics configured");
      }

      const { data, error } = await supabase.functions.invoke("generate-recommendations", {
        body: { 
          userId: user.id, 
          topics: activeTopics,
          forceRefresh,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recommended-posts", user?.id] });
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
      const { error } = await supabase
        .from("recommended_posts")
        .update({ is_used: true })
        .eq("id", postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommended-posts", user?.id] });
    },
  });

  const deleteRecommendation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("recommended_posts")
        .delete()
        .eq("id", postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommended-posts", user?.id] });
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
  };
}
