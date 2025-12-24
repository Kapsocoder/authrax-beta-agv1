import { useQuery } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

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
  usageCount?: number;
}

interface UseTemplatesOptions {
  userType?: string;
  trending?: boolean;
}

export function useTemplates(options: UseTemplatesOptions = {}) {
  return useQuery({
    queryKey: ["templates", options],
    queryFn: async () => {
      const constraints = [];

      if (options.userType) {
        constraints.push(where("user_type", "==", options.userType));
      }

      if (options.trending) {
        // Use usage_count for trending, descending
        constraints.push(orderBy("usage_count", "desc"));
      } else {
        constraints.push(orderBy("name"));
      }

      const q = query(collection(db, "templates"), ...constraints);
      const snapshot = await getDocs(q);

      // Map database fields to component-friendly format
      return snapshot.docs.map((doc) => {
        const t = doc.data();
        return {
          id: doc.id,
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
          usageCount: t.usage_count || 0,
        };
      }) as Template[];
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

      const docRef = doc(db, "templates", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();

      return {
        id: docSnap.id,
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
        usageCount: data.usage_count || 0,
      } as Template;
    },
    enabled: !!id,
  });
}
