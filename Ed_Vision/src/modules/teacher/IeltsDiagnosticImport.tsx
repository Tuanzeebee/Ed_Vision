/**
 * IeltsDiagnosticImport.tsx
 * ─────────────────────────
 * Trang nạp đề khảo sát đầu vào IELTS (Placement / Diagnostic).
 *
 * Dữ liệu nạp vào bảng `ielts_questions` với `is_placement = true`
 * để phục vụ bài thi khảo sát đầu vào (adaptive placement test).
 *
 * Tham khảo logic nạp TOEIC diagnostic (DiagnosticImport.tsx)
 * nhưng sử dụng các endpoint riêng của IELTS:
 *   - POST /teacher/ielts-repository/import-ocr   → nạp đề (PDF/TXT)
 *   - POST /teacher/ielts-repository/upload-audio  → nạp audio (Listening)
 *   - POST /teacher/ielts-repository/import-answer-key → nạp đáp án
 */

import { useState } from "react";
import { Upload, AlertCircle, RefreshCw, FileUp, Headphones, CheckCircle2 } from "lucide-react";
import {
  importIeltsExamFromOcrFile,
  uploadIeltsListeningAudio,
  importIeltsAnswerKeyFromFile,
  type IeltsOcrImportResponse,
  type IeltsAudioUploadResponse,
  type IeltsAnswerKeyImportResponse,
} from "../../services/api/certificateService";

// ─── Constants ──────────────────────────────────────────────────────────────
const SKILL_OPTIONS = [
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
] as const;

const BAND_PRESETS = [
  { label: "Band 3.0 – 4.5 (Beginner)", value: "3-4.5" },
  { label: "Band 4.5 – 6.0 (Pre-Intermediate)", value: "4.5-6" },
  { label: "Band 6.0 – 7.0 (Intermediate)", value: "6-7" },
  { label: "Band 7.0 – 8.0 (Upper-Intermediate)", value: "7-8" },
  { label: "Band 8.0 – 9.0 (Advanced)", value: "8-9" },
] as const;

type SkillArea = "reading" | "listening";

// ─── Shared style tokens ────────────────────────────────────────────────────
const fieldClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-colors";

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 12px center",
  paddingRight: "36px",
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface AudioSectionState {
  file: File | null;
  uploaded: boolean;
  result: IeltsAudioUploadResponse | null;
  error: string | null;
}

const INITIAL_AUDIO_SECTIONS: AudioSectionState[] = [
  { file: null, uploaded: false, result: null, error: null },
  { file: null, uploaded: false, result: null, error: null },
  { file: null, uploaded: false, result: null, error: null },
  { file: null, uploaded: false, result: null, error: null },
];

// ─── Component ──────────────────────────────────────────────────────────────
export function IeltsDiagnosticImportBody() {
  // ── Step 1: Import questions ──
  const [skillArea, setSkillArea] = useState<SkillArea>("reading");
  const [bandRange, setBandRange] = useState<string>(BAND_PRESETS[2].value);
  const [file, setFile] = useState<File | null>(null);
  const [audioSections, setAudioSections] = useState<AudioSectionState[]>(INITIAL_AUDIO_SECTIONS);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IeltsOcrImportResponse | null>(null);

  // ── Step 2: Answer Key ──
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [answerKeyClear, setAnswerKeyClear] = useState(false);
  const [isImportingAnswer, setIsImportingAnswer] = useState(false);
  const [answerKeyError, setAnswerKeyError] = useState<string | null>(null);
  const [answerKeyResult, setAnswerKeyResult] = useState<IeltsAnswerKeyImportResponse | null>(null);

  const activeSlug = result?.slug ?? "";

  // ── Helpers ──
  const setAudioFile = (sectionIndex: number, file: File | null) => {
    setAudioSections((prev) => {
      const next = [...prev];
      next[sectionIndex] = { ...next[sectionIndex], file, uploaded: false, result: null, error: null };
      return next;
    });
  };

  // ── Handlers ──
  const handleImport = async () => {
    if (!file) {
      setError("Vui lòng chọn file đề khảo sát.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);
    setAudioSections(INITIAL_AUDIO_SECTIONS);

    try {
      const slug = `ielts-diag-${skillArea}-${Date.now()}`;

      const response = await importIeltsExamFromOcrFile(
        {
          repository_slug: slug,
          repository_title: `IELTS Diagnostic – ${skillArea.charAt(0).toUpperCase() + skillArea.slice(1)} (${bandRange})`,
          skill_area: skillArea,
          replace_existing: replaceExisting,
          band_range: bandRange,
        },
        file,
      );

      setResult(response);

      // Upload audio files for each section (listening only)
      if (skillArea === "listening" && response.slug) {
        const audioErrors: string[] = [];
        const updatedSections = [...audioSections];

        for (let i = 0; i < 4; i++) {
          const secFile = audioSections[i].file;
          if (!secFile) continue;

          try {
            const audioRes = await uploadIeltsListeningAudio(response.slug, secFile, i + 1);
            updatedSections[i] = { ...updatedSections[i], uploaded: true, result: audioRes, error: null };
          } catch (audioErr: any) {
            const msg = audioErr.response?.data?.message || audioErr.message || "Lỗi upload audio.";
            const errStr = typeof msg === "string" ? msg : JSON.stringify(msg);
            updatedSections[i] = { ...updatedSections[i], uploaded: false, error: errStr };
            audioErrors.push(`Section ${i + 1}: ${errStr}`);
          }
        }

        setAudioSections(updatedSections);
        if (audioErrors.length > 0) {
          setError(`Đề đã nạp thành công. Lỗi audio: ${audioErrors.join("; ")}`);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lỗi nạp đề khảo sát IELTS.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportAnswerKey = async () => {
    if (!answerKeyFile || !activeSlug) return;
    setIsImportingAnswer(true);
    setAnswerKeyError(null);
    setAnswerKeyResult(null);

    try {
      const response = await importIeltsAnswerKeyFromFile(
        { repository_slug: activeSlug, clear_existing: answerKeyClear },
        answerKeyFile,
      );
      setAnswerKeyResult(response);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lỗi nạp đáp án.";
      setAnswerKeyError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsImportingAnswer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── STEP 1: NẠP ĐỀ KHẢO SÁT ── */}
      <div className="rounded-2xl border border-teal-200 bg-white shadow-md overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 pb-1 border-b border-teal-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100">
              <FileUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Bước 1: Nạp Đề Khảo Sát Đầu Vào · IELTS
              </h2>
              <p className="text-xs text-gray-500">
                Nạp bộ câu hỏi vào pool khảo sát năng lực IELTS (Placement Test). Dữ liệu sẽ được đánh
                dấu <code className="text-teal-600 font-semibold">is_placement = true</code> trong bảng{" "}
                <code className="text-teal-600 font-semibold">ielts_questions</code>.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-xs text-teal-800 space-y-1">
            <p className="font-semibold">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Chỉ hỗ trợ <strong>Reading</strong> và <strong>Listening</strong> (backend parser cho dạng MCQ, T/F/NG, Fill-in-blank, Matching).</li>
              <li>File PDF/TXT — hệ thống sẽ tự phân loại và gán IRT bootstrap dựa trên band range.</li>
              <li>Listening: tải thêm file audio (.mp3/.wav) để auto-map vào câu hỏi.</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Skill Area */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Kỹ năng (Skill Area)
              </label>
              <select
                value={skillArea}
                onChange={(e) => setSkillArea(e.target.value as SkillArea)}
                className={`${fieldClass} appearance-none cursor-pointer`}
                style={selectStyle}
              >
                {SKILL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Band Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Band Range (Mức độ)
              </label>
              <select
                value={bandRange}
                onChange={(e) => setBandRange(e.target.value)}
                className={`${fieldClass} appearance-none cursor-pointer`}
                style={selectStyle}
              >
                {BAND_PRESETS.map((bp) => (
                  <option key={bp.value} value={bp.value}>
                    {bp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File upload */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                File đề khảo sát (PDF/TXT/DOCX)
              </label>
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200`}
              />
            </div>

            {/* Audio upload (Listening only) — 4 sections */}
            {skillArea === "listening" && (
              <div className="col-span-2 space-y-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                  <Headphones className="h-3.5 w-3.5 text-blue-500" />
                  Audio Listening (4 Sections)
                </label>
                <p className="text-[10px] text-gray-500 -mt-2">
                  Mỗi section tương ứng với 1 file audio. Section 1 = Q1–10, Section 2 = Q11–20, Section 3 = Q21–30, Section 4 = Q31–40.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((sec) => (
                    <div key={sec} className="relative">
                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                        Section {sec} (Q{(sec - 1) * 10 + 1}–{sec * 10})
                        {audioSections[sec - 1].uploaded && (
                          <CheckCircle2 className="inline h-3 w-3 ml-1 text-green-500" />
                        )}
                      </label>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a"
                        onChange={(e) => setAudioFile(sec - 1, e.target.files?.[0] ?? null)}
                        className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer file:mr-2 file:border-0 file:rounded file:px-2 file:py-0.5 file:text-[10px] file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                      />
                      {audioSections[sec - 1].error && (
                        <p className="text-[10px] text-red-500 mt-0.5">{audioSections[sec - 1].error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded"
              checked={replaceExisting}
              onChange={(e) => setReplaceExisting(e.target.checked)}
            />
            Ghi đè nếu đã tồn tại (replace existing)
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 space-y-1">
              <p className="font-semibold">Nạp đề khảo sát IELTS thành công</p>
              <p className="text-xs">
                Slug: <strong>{result.slug}</strong> | Skill:{" "}
                <strong>{result.skill_area}</strong> | Đã nạp:{" "}
                <strong>{result.imported_count}</strong> câu
                {result.skipped_count > 0 && (
                  <> | Bỏ qua: <strong>{result.skipped_count}</strong></>
                )}
              </p>
              {audioSections.some((s) => s.uploaded) && (
                <div className="text-xs text-blue-700 space-y-0.5">
                  {audioSections.map((s, i) =>
                    s.uploaded && s.result ? (
                      <p key={i}>
                        Section {i + 1}: <strong>{s.result.filename}</strong>
                      </p>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={isSubmitting || !file}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Nạp Đề Khảo Sát IELTS
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── STEP 2: NẠP ĐÁP ÁN ── */}
      <div className={!activeSlug ? "opacity-50 pointer-events-none" : ""}>
        <div className="rounded-2xl border border-teal-200 bg-white shadow-md overflow-hidden">
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3 pb-1 border-b border-teal-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <FileUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">
                  Bước 2: Nạp Đáp Án Cho Đề Khảo Sát
                </h3>
                <p className="text-xs text-gray-500">
                  File đáp án dạng: <code>1. TRUE</code>, <code>2. B</code>, <code>3. NOT GIVEN</code>, v.v. (PDF/TXT/Image).
                  Tự động gắn vào bộ đề vừa nạp ở Bước 1.
                </p>
              </div>
            </div>

            {activeSlug && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-500">
                  Đang áp dụng cho đề: <strong className="text-teal-700">{activeSlug}</strong>
                </p>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded"
                checked={answerKeyClear}
                onChange={(e) => setAnswerKeyClear(e.target.checked)}
              />
              Xóa đáp án cũ trước khi import
            </label>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                File Đáp Án (PDF/TXT/DOCX/Image)
              </label>
              <input
                type="file"
                accept=".txt,.pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setAnswerKeyFile(e.target.files?.[0] ?? null)}
                className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200`}
              />
            </div>

            {/* Error */}
            {answerKeyError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{answerKeyError}</span>
              </div>
            )}

            {/* Success */}
            {answerKeyResult && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800 space-y-1">
                <p className="font-semibold">Nạp đáp án thành công</p>
                <p className="text-xs">
                  Slug: <strong>{answerKeyResult.slug}</strong> | Cập nhật:{" "}
                  <strong>{answerKeyResult.applied_items}</strong> câu
                  {typeof answerKeyResult.total_answers_detected === "number" && (
                    <> | Tổng đáp án phát hiện:{" "}
                      <strong>{answerKeyResult.total_answers_detected}</strong>
                    </>
                  )}
                  {typeof answerKeyResult.unanswered_items === "number" &&
                    answerKeyResult.unanswered_items > 0 && (
                      <> | Chưa có đáp án:{" "}
                        <strong className="text-amber-700">{answerKeyResult.unanswered_items}</strong>
                      </>
                    )}
                </p>
                {answerKeyResult.unknown_question_numbers &&
                  answerKeyResult.unknown_question_numbers.length > 0 && (
                    <p className="text-xs text-amber-700">
                      Câu chưa có đáp án (OCR không phát hiện trong file đáp án):{" "}
                      <strong>{answerKeyResult.unknown_question_numbers.join(", ")}</strong>
                      <br />
                      <span className="text-[11px] text-gray-600">
                        Bạn có thể chỉnh tay đáp án cho các câu này, hoặc upload lại file đáp án rõ hơn.
                      </span>
                    </p>
                  )}
              </div>
            )}

            <button
              onClick={handleImportAnswerKey}
              disabled={isImportingAnswer || !answerKeyFile || !activeSlug}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-teal-600 px-4 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImportingAnswer ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Đang xử lý đáp án...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4" /> Nạp Đáp Án
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
