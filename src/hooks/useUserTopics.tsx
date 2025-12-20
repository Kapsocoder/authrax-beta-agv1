import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
    queryKey: ["user-topics", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_topics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as UserTopic[];
    },
    enabled: !!user?.id,
  });

  const addTopic = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("user_topics")
        .insert({ user_id: user.id, name })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-topics", user?.id] });
      toast.success("Topic added!");
    },
    onError: (error) => {
      toast.error("Failed to add topic: " + error.message);
    },
  });

  const removeTopic = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from("user_topics")
        .delete()
        .eq("id", topicId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-topics", user?.id] });
      toast.success("Topic removed");
    },
    onError: (error) => {
      toast.error("Failed to remove topic: " + error.message);
    },
  });

  const toggleTopic = useMutation({
    mutationFn: async ({ topicId, isActive }: { topicId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("user_topics")
        .update({ is_active: isActive })
        .eq("id", topicId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-topics", user?.id] });
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
