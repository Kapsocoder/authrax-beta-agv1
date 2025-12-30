import { useEffect, useRef, useCallback } from "react";
import { usePosts } from "./usePosts";
import { useAuth } from "./useAuth";

interface AutoSaveOptions {
  content: string;
  sourceUrl?: string;
  sourceType?: "voice" | "draft" | "url" | "video" | "pdf" | null;
  templateId?: string | null;
  inputContext?: string;
  userInstructions?: string; // New: Replacing aiPrompt for user notes
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
  userInstructions,
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
  const lastSavedTemplateIdRef = useRef<string | null | undefined>(undefined);
  // Removed inputContext tracking from here? NO, keeping it.
  const lastSavedInputContextRef = useRef<string | undefined>(undefined);
  const lastSavedUserInstructionsRef = useRef<string | undefined>(undefined);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when prop changes
  useEffect(() => {
    if (currentDraftId) {
      draftIdRef.current = currentDraftId;
    }
  }, [currentDraftId]);

  const saveDraft = useCallback(async (contentToSave: string, urlToSave?: string) => {
    // Enable save if content, url, OR inputContext exists.
    if (!user?.uid || (!contentToSave.trim() && !urlToSave?.trim() && !inputContext?.trim())) return;

    // Check if ANYTHING has changed
    const contentChanged = contentToSave !== lastSavedContentRef.current;
    const urlChanged = urlToSave !== lastSavedSourceUrlRef.current;
    const templateChanged = templateId !== lastSavedTemplateIdRef.current;
    const inputContextChanged = inputContext !== lastSavedInputContextRef.current;
    const instructionsChanged = (userInstructions || "") !== (lastSavedUserInstructionsRef.current || "");

    // If nothing relevant changed, skip save
    if (!contentChanged && !urlChanged && !templateChanged && !inputContextChanged && !instructionsChanged) return;

    try {
      const inputContextValue = inputContext;
      const instructionsValue = userInstructions;

      if (draftIdRef.current) {
        // Update existing draft
        await updatePost.mutateAsync({
          id: draftIdRef.current,
          content: contentToSave,
          ...(urlToSave ? { source_url: urlToSave } : {}),
          ...(templateId !== undefined ? { template_id: templateId } : {}),
          ...(inputContextValue ? { input_context: inputContextValue } : {}),
          ...(sourceType ? { input_mode: sourceType } : {}),
          ...(instructionsValue !== undefined ? { user_instructions: instructionsValue } : {}),
          // removed ai_prompt update here - it is only for snapshots
        });

        // Update all refs
        lastSavedContentRef.current = contentToSave;
        lastSavedSourceUrlRef.current = urlToSave;
        lastSavedTemplateIdRef.current = templateId;
        lastSavedInputContextRef.current = inputContext;
        lastSavedUserInstructionsRef.current = userInstructions;
      } else {
        // Create new draft
        const result = await createPost.mutateAsync({
          content: contentToSave,
          status: "draft",
          is_ai_generated: false,
          user_instructions: instructionsValue || null, // Save instructions
          ai_prompt: null, // Initial draft has no AI snapshot
          template_id: templateId || null,
          input_mode: sourceType || null,
          input_context: inputContextValue || null,
          source_url: urlToSave || null,
        });
        draftIdRef.current = result.id;

        // Update all refs
        lastSavedContentRef.current = contentToSave;
        lastSavedSourceUrlRef.current = urlToSave;
        lastSavedTemplateIdRef.current = templateId;
        lastSavedInputContextRef.current = inputContext;
        lastSavedUserInstructionsRef.current = userInstructions;

        if (onDraftCreated) {
          onDraftCreated(result.id);
        }
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  }, [user?.uid, createPost, updatePost, sourceType, templateId, inputContext, userInstructions, onDraftCreated]);

  useEffect(() => {
    // Enable save if:
    // 1. Content exists OR
    // 2. Source URL exists OR
    // 3. Input Context exists (for voice/pdf/video modes)
    if (!enabled || (!content.trim() && !sourceUrl?.trim() && !inputContext?.trim())) return;

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
  }, [content, sourceUrl, enabled, debounceMs, saveDraft, inputContext, templateId, sourceType, userInstructions]);

  // Reset refs when component unmounts or content is cleared
  const reset = useCallback(() => {
    draftIdRef.current = null;
    lastSavedContentRef.current = "";
  }, []);

  return {
    draftId: draftIdRef.current,
    hasAutoSaved: !!draftIdRef.current,
    reset,
    triggerSave: saveDraft,
  };
}
