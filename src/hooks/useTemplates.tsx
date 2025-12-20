import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Template {
  id: string;
  name: string;
  category: string;
  userType: "founder" | "executive" | "professional";
  themes: string[];
  formats: string[];
  objectives: string[];
  description: string;
  structure: string;
  prompt: string;
  example?: string | null;
  isTrending?: boolean | null;
  isCustom?: boolean | null;
  isSystem?: boolean | null;
}

interface UseTemplatesOptions {
  userType?: string;
  trending?: boolean;
}

export function useTemplates(options: UseTemplatesOptions = {}) {
  return useQuery({
    queryKey: ["templates", options],
    queryFn: async () => {
      let query = supabase
        .from("templates")
        .select("*")
        .order("name");

      if (options.userType) {
        query = query.eq("user_type", options.userType);
      }

      if (options.trending) {
        query = query.eq("is_trending", true);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Map database fields to component-friendly format
      return (data || []).map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        userType: t.user_type as "founder" | "executive" | "professional",
        themes: t.themes || [],
        formats: t.formats || [],
        objectives: t.objectives || [],
        description: t.description,
        structure: t.structure,
        prompt: t.prompt,
        example: t.example,
        isTrending: t.is_trending,
        isCustom: t.is_custom,
        isSystem: t.is_system,
      })) as Template[];
    },
  });
}

export function useTrendingTemplates(limit = 6) {
  const { data: templates, ...rest } = useTemplates({ trending: true });
  
  return {
    ...rest,
    data: templates?.slice(0, limit) || [],
  };
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["template", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        category: data.category,
        userType: data.user_type as "founder" | "executive" | "professional",
        themes: data.themes || [],
        formats: data.formats || [],
        objectives: data.objectives || [],
        description: data.description,
        structure: data.structure,
        prompt: data.prompt,
        example: data.example,
        isTrending: data.is_trending,
        isCustom: data.is_custom,
        isSystem: data.is_system,
      } as Template;
    },
    enabled: !!id,
  });
}
