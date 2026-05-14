import React from 'react';
import { Loader2, Plus, Check, X, BookOpen } from 'lucide-react';
import type { LookupWordResponse } from '../../../services/api/certificateService';

interface VocabHighlightPopupProps {
  isOpen: boolean;
  position: { x: number; y: number };
  word: string;
  loading: boolean;
  result: LookupWordResponse | null;
  error: string | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function VocabHighlightPopup({
  isOpen,
  position,
  word,
  loading,
  result,
  error,
  saving,
  onSave,
  onClose,
}: VocabHighlightPopupProps) {
  if (!isOpen) return null;

  const POPUP_WIDTH = 288; // w-72 = 18rem = 288px
  const POPUP_HEIGHT = 260; // approximate max height
  const MARGIN = 10;

  // Clamp horizontal so popup doesn't overflow viewport
  const left = Math.min(
    Math.max(MARGIN, position.x - POPUP_WIDTH / 2),
    window.innerWidth - POPUP_WIDTH - MARGIN,
  );

  // If not enough space below, flip popup above the selection
  const spaceBelow = window.innerHeight - position.y - MARGIN;
  const top =
    spaceBelow >= POPUP_HEIGHT
      ? position.y + MARGIN
      : position.y - POPUP_HEIGHT - MARGIN;

  return (
    <div
      className="vocab-highlight-popup fixed z-[9999] w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-sm flex flex-col"
      style={{ left: `${left}px`, top: `${top}px` }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent closing when interacting with popup
    >
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-teal-600" />
          {word}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-4 text-slate-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
            <span className="text-xs font-medium">Đang tra nghĩa...</span>
            <span className="text-[10px] text-slate-400">Có thể dùng Ctrl+A để lưu nhanh</span>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-xs py-2 text-center">
            {error}
          </div>
        )}

        {!loading && result && (
          <div className="flex flex-col gap-3">
            {/* Nghĩa đầu tiên */}
            {result.definitions && result.definitions.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-slate-500 italic">
                    {result.definitions[0].pos}
                  </span>
                  <span className="text-slate-800 font-medium leading-snug">
                    {result.definitions[0].meaning}
                  </span>
                </div>
                {result.definitions[0].example_en && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                    <p className="text-xs text-slate-700 font-medium">
                      "{result.definitions[0].example_en}"
                    </p>
                    {result.definitions[0].example_vi && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {result.definitions[0].example_vi}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">
                Không tìm thấy định nghĩa.
              </div>
            )}

            {/* Thông tin Topic */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md w-fit">
              <span>Chủ đề:</span>
              <span className="font-semibold text-slate-700">
                {result.status === 'exists' ? result.topicTitleVI : result.suggestedTopicTitleVI}
              </span>
            </div>

            {/* Nút hành động */}
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                Mẹo: Bấm <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 shadow-sm">Ctrl</kbd> + <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200 shadow-sm">A</kbd> để lưu
              </span>
              
              {result.alreadyInBank ? (
                <button
                  disabled
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-teal-600 text-xs font-semibold rounded-lg ml-auto"
                >
                  <Check className="w-3.5 h-3.5" />
                  Đã trong kho
                </button>
              ) : (
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors ml-auto shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Thêm vào kho
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
