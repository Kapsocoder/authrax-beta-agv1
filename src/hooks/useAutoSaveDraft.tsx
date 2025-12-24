import { useEffect, useRef, useCallback } from "react";
import { usePosts } from "./usePosts";
import { useAuth } from "./useAuth";

interface AutoSaveOptions {
  content: string;
  sourceUrl?: string;
  sourceType?: "voice" | "draft" | "url" | "video" | "pdf" | null;
  templateId?: string | null;
  inputContext?: string;
  enabled?: boolean;
  debounceMs?: number;
  currentDraftId?: string | null;
  onDraftCreated?: (id: string) => void;
}

export function useAutoSaveDraft({
  content,
  sourceUrl,
  sourceType,
  templateId,
  inputContext,
  enabled = true,
  debounceMs = 2000,
  currentDraftId,
  onDraftCreated,
}: AutoSaveOptions) {
  const { user } = useAuth();
  const { createPost, updatePost } = usePosts();
  const draftIdRef = useRef<string | null>(currentDraftId || null);
  const lastSavedContentRef = useRef<string>("");
  const lastSavedSourceUrlRef = useRef<string | undefined>(undefined);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when prop changes
  useEffect(() => {
    if (currentDraftId) {
      draftIdRef.current = currentDraftId;
    }
  }, [currentDraftId]);

  const saveDraft = useCallback(async (contentToSave: string, urlToSave?: string) => {
    if (!user?.uid || !contentToSave.trim()) return;

    // Don't save if content hasn't changed from last save
    // TODO: We should also check if other fields changed, but for now focus on content trigger
    if (contentToSave === lastSavedContentRef.current && urlToSave === lastSavedSourceUrlRef.current) return;

    try {
      if (draftIdRef.current) {
        // Update existing draft
        await updatePost.mutateAsync({
          id: draftIdRef.current,
          content: contentToSave,
          ...(urlToSave ? { source_url: urlToSave } : {}),
          ...(templateId ? { template_id: templateId } : {}),
          ...(inputContext ? { input_context: inputContext } : {}),
          ...(sourceType ? { input_mode: sourceType } : {}),
        });
        lastSavedContentRef.current = contentToSave;
        lastSavedSourceUrlRef.current = urlToSave;
      } else {
        // Create new draft
        const result = await createPost.mutateAsync({
          content: contentToSave,
          status: "draft",
          is_ai_generated: false,
          ai_prompt: urlToSave ? `Source: ${urlToSave}` : sourceType || undefined, // Keep legacy field for compatibility
          template_id: templateId || null,
          input_mode: sourceType || null,
          input_context: inputContext || null,
          source_url: urlToSave || null,
        });
        draftIdRef.current = result.id;
        lastSavedContentRef.current = contentToSave;
        lastSavedSourceUrlRef.current = urlToSave;

        if (onDraftCreated) {
          onDraftCreated(result.id);
        }
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [user?.uid, createPost, updatePost, sourceUrl, sourceType, onDraftCreated]);


  useEffect(() => {
    if (!enabled || (!content.trim() && !sourceUrl?.trim())) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      saveDraft(content, sourceUrl);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, sourceUrl, enabled, debounceMs, saveDraft]);

  // Reset refs when component unmounts or content is cleared
  const reset = useCallback(() => {
    draftIdRef.current = null;
    lastSavedContentRef.current = "";
  }, []);

  return {
    draftId: draftIdRef.current,
    hasAutoSaved: !!draftIdRef.current,
    reset,
  };
}
