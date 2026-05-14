import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import {
  lookupVocabWord,
  saveVocabFromReading,
} from "../../../services/api/certificateService";
import type { LookupWordResponse } from "../../../services/api/certificateService";

interface Position {
  x: number;
  y: number;
}

interface VocabHighlightState {
  isOpen: boolean;
  position: Position;
  selectedText: string;
  context: string;
  loading: boolean;
  result: LookupWordResponse | null;
  error: string | null;
  saving: boolean;
}

const INITIAL_STATE: VocabHighlightState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  selectedText: "",
  context: "",
  loading: false,
  result: null,
  error: null,
  saving: false,
};

/**
 * Hook quản lý tính năng bôi đen tra từ vựng trong bài đọc TOEIC.
 *
 * Popup hiển thị khi người dùng bôi đen từ bất kỳ đâu trong vùng
 * có thuộc tính `data-vocab-zone` (passage card & question area).
 *
 * @param enrollmentId - ID từ bảng user_certificate_enrollments (chỉ cần khi lưu từ)
 * @param isReadingSection - true khi đang ở phần Reading
 */
export function useVocabHighlight(
  enrollmentId: number | null | undefined,
  isReadingSection = false,
) {
  const [state, setState] = useState<VocabHighlightState>(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const enrollmentIdRef = useRef(enrollmentId);
  enrollmentIdRef.current = enrollmentId;

  const isReadingSectionRef = useRef(isReadingSection);
  isReadingSectionRef.current = isReadingSection;

  const closePopup = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Use stable refs so addEventListener doesn't need to be re-registered
  const handleSaveRef = useRef<() => Promise<void>>(async () => {});

  const handleMouseUp = useCallback(() => {
    if (!isReadingSectionRef.current) return;

    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";

    if (!text || !selection || selection.isCollapsed) {
      // Click outside with no selection → close popup
      if (stateRef.current.isOpen) closePopup();
      return;
    }

    // Only single English words / short phrases ≤ 50 chars
    if (text.length > 50 || !/^[a-zA-Z\s\-']+$/.test(text)) {
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Check selection is inside a data-vocab-zone element
    const el =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : (container as HTMLElement);

    const inVocabZone = el?.closest("[data-vocab-zone]");
    if (!inVocabZone) return;

    // Extract ~100-char context around the selection
    let context = "";
    if (container.nodeType === Node.TEXT_NODE) {
      const fullText = container.textContent ?? "";
      const start = Math.max(0, range.startOffset - 50);
      const end = Math.min(fullText.length, range.endOffset + 50);
      context = fullText.slice(start, end).trim();
      if (start > 0) context = "..." + context;
      if (end < fullText.length) context += "...";
    }

    const rect = range.getBoundingClientRect();

    setState({
      isOpen: true,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom,           // viewport-relative (for position:fixed popup)
      },
      selectedText: text,
      context,
      loading: true,
      result: null,
      error: null,
      saving: false,
    });

    // Lookup — fall back to eid=0 if enrollment not yet loaded (backend still returns AI result)
    const eid = enrollmentIdRef.current ?? 0;
    lookupVocabWord(eid, { word: text, context })
      .then((res) => {
        setState((prev) => ({ ...prev, loading: false, result: res }));
      })
      .catch((err: unknown) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (err as Error).message ?? "Không thể tra từ",
        }));
      });
  }, [closePopup]);

  const handleSave = useCallback(async () => {
    const cur = stateRef.current;
    const eid = enrollmentIdRef.current;

    if (!eid) {
      toast.error("Vui lòng đăng nhập để lưu từ vựng.");
      return;
    }
    if (!cur.result || cur.saving || cur.result.alreadyInBank) return;

    setState((prev) => ({ ...prev, saving: true }));

    const { selectedText, result } = cur;
    const topicSlug =
      result.status === "exists"
        ? (result.topicSlug ?? "general")
        : (result.suggestedTopicSlug ?? "general");
    const topicTitle =
      result.status === "exists" ? result.topicTitleVI : result.suggestedTopicTitleVI;

    try {
      await saveVocabFromReading(eid, {
        word: selectedText,
        topic_slug: topicSlug,
        definitions: result.definitions,
        source_context: cur.context,
      });
      toast.success(`Đã thêm "${selectedText}" vào kho từ vựng ${topicTitle} 📚`);
      setState((prev) => ({
        ...prev,
        saving: false,
        result: prev.result ? { ...prev.result, alreadyInBank: true } : null,
      }));
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Lỗi khi lưu từ vựng");
      setState((prev) => ({ ...prev, saving: false }));
    }
  }, []);

  // Keep the ref up to date so keydown handler sees latest version
  handleSaveRef.current = handleSave;

  // Register mouseup in CAPTURE phase so it runs before React's synthetic events
  useEffect(() => {
    const onMouseUp = () => handleMouseUp();
    document.addEventListener("mouseup", onMouseUp, { capture: true });
    return () => document.removeEventListener("mouseup", onMouseUp, { capture: true });
  }, [handleMouseUp]);

  // Keyboard shortcuts (capture phase to intercept Ctrl+A before browser)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const cur = stateRef.current;

      if (e.key === "Escape") {
        if (cur.isOpen) { e.stopPropagation(); closePopup(); }
        return;
      }

      // Ctrl+A or Ctrl+S → save when popup is ready
      if (
        e.ctrlKey &&
        (e.key === "a" || e.key === "A" || e.key === "s" || e.key === "S")
      ) {
        if (cur.isOpen && cur.result && !cur.loading && !cur.saving) {
          e.preventDefault();
          e.stopPropagation();
          handleSaveRef.current();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [closePopup]);

  // Auto-dismiss after 30 s
  useEffect(() => {
    if (!state.isOpen) return;
    const t = setTimeout(closePopup, 30_000);
    return () => clearTimeout(t);
  }, [state.isOpen, closePopup]);

  return { ...state, closePopup, handleSave };
}
