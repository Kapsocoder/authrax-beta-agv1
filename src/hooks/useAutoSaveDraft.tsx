import { useEffect, useRef, useCallback } from "react";
import { usePosts } from "./usePosts";
import { useAuth } from "./useAuth";

interface AutoSaveOptions {
  content: string;
  sourceUrl?: string;
  sourceType?: "voice" | "draft" | "url" | "video" | "pdf" | null;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoSaveDraft({
  content,
  sourceUrl,
  sourceType,
  enabled = true,
  debounceMs = 2000,
}: AutoSaveOptions) {
  const { user } = useAuth();
  const { createPost } = usePosts();
  const draftIdRef = useRef<string | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSavedRef = useRef(false);

  const saveDraft = useCallback(async (contentToSave: string) => {
    if (!user?.id || !contentToSave.trim()) return;
    
    // Don't save if content hasn't changed
    if (contentToSave === lastSavedContentRef.current) return;
    
    try {
      // Create a new draft if we haven't already
      if (!hasAutoSavedRef.current) {
        const result = await createPost.mutateAsync({
          content: contentToSave,
          status: "draft",
          is_ai_generated: false,
          ai_prompt: sourceUrl ? `Source: ${sourceUrl}` : sourceType || undefined,
        });
        draftIdRef.current = result.id;
        hasAutoSavedRef.current = true;
        lastSavedContentRef.current = contentToSave;
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [user?.id, createPost, sourceUrl, sourceType]);

  useEffect(() => {
    if (!enabled || !content.trim()) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      saveDraft(content);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, debounceMs, saveDraft]);

  // Reset refs when component unmounts or content is cleared
  const reset = useCallback(() => {
    draftIdRef.current = null;
    lastSavedContentRef.current = "";
    hasAutoSavedRef.current = false;
  }, []);

  return {
    draftId: draftIdRef.current,
    hasAutoSaved: hasAutoSavedRef.current,
    reset,
  };
}
