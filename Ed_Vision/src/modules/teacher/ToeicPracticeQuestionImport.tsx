import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  AlertCircle,
  RefreshCw,
  Filter,
  Dumbbell,
  KeyRound,
  Music,
  Scissors,
  FileUp,
  AlertTriangle,
  X,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import TeacherLayout from "./components/TeacherLayout";
import { useRef } from "react";
import {
  importToeicPracticeQuestions,
  importToeicPracticeAnswerKey,
  importToeicPracticeManualSupplement,
  listToeicPracticeQuestions,
  importPracticeAudio,
  importPracticeImages,
  type ImportPracticeQuestionsResponse,
  type ImportPracticeAnswerKeyResponse,
  type ImportPracticeManualSupplementResponse,
  type PracticeQuestionsListResponse,
  type ImportPracticeAudioResponse,
  type ImportPracticeImagesResponse,
} from "@/services/api/certificateService";

type PracticePartSelection =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "full_reading"
  | "full_listening"
  | "speaking"
  | "writing";

type ManualOptionKey = "A" | "B" | "C" | "D";

type ManualSupplementRow = {
  id: string;
  toeic_part: number;
  question_number: string;
  stem: string;
  reading_passage: string;
  options: Record<ManualOptionKey, string>;
  correct_option_key: ManualOptionKey;
};

function getSelectionConfig(selection: PracticePartSelection): {
  importScope: "single_part" | "full_reading" | "full_listening";
  toeicPart?: number;
  label: string;
  listFilter: { part?: number; skill_area?: string };
} {
  if (selection === "full_reading") {
    return {
      importScope: "full_reading",
      label: "Full Part Reading (Part 5-7)",
      listFilter: { skill_area: "reading" },
    };
  }

  if (selection === "full_listening") {
    return {
      importScope: "full_listening",
      label: "Full Part Listening (Part 1-4)",
      listFilter: { skill_area: "listening" },
    };
  }

  if (selection === "speaking") {
    return {
      importScope: "single_part",
      label: "Speaking",
      listFilter: { skill_area: "speaking" },
    };
  }

  if (selection === "writing") {
    return {
      importScope: "single_part",
      label: "Writing",
      listFilter: { skill_area: "writing" },
    };
  }

  const part = Number(selection);
  return {
    importScope: "single_part",
    toeicPart: part,
    label: `Part ${part}`,
    listFilter: { part },
  };
}

function createManualRow(
  toeicPart = 5,
  questionNumber?: number,
): ManualSupplementRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    toeic_part: toeicPart,
    question_number:
      typeof questionNumber === "number" ? String(questionNumber) : "",
    stem: "",
    reading_passage: "",
    options: {
      A: "",
      B: "",
      C: "",
      D: "",
    },
    correct_option_key: "A",
  };
}

export default function ToeicPracticeQuestionImport() {
  return (
    <TeacherLayout currentPage="toeic-practice-import">
      <ToeicPracticeQuestionImportBody />
    </TeacherLayout>
  );
}

export function ToeicPracticeQuestionImportBody({
  certType: _externalCertType,
}: {
  certType?: "toeic" | "ielts";
} = {}) {
  const [showFormatModal, setShowFormatModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [practiceFile, setPracticeFile] = useState<File | null>(null);
  const [practicePartSelection, setPracticePartSelection] =
    useState<PracticePartSelection>(_externalCertType === "ielts" ? "speaking" : "5");
  const [practiceBandMin, setPracticeBandMin] = useState<number>(0);
  const [practiceBandMax, setPracticeBandMax] = useState<number>(400);
  const [practiceReplaceExisting, setPracticeReplaceExisting] = useState(false);
  const [isPracticeSubmitting, setIsPracticeSubmitting] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [practiceResult, setPracticeResult] =
    useState<ImportPracticeQuestionsResponse | null>(null);
  const [manualRows, setManualRows] = useState<ManualSupplementRow[]>([]);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualResult, setManualResult] =
    useState<ImportPracticeManualSupplementResponse | null>(null);

  const [practiceSetId, setPracticeSetId] = useState("");
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [isAnswerKeySubmitting, setIsAnswerKeySubmitting] = useState(false);
  const [answerKeyError, setAnswerKeyError] = useState<string | null>(null);
  const [answerKeyResult, setAnswerKeyResult] =
    useState<ImportPracticeAnswerKeyResponse | null>(null);

  // Audio chunking state (Listening practice)
  const [practiceAudioFile, setPracticeAudioFile] = useState<File | null>(null);
  const [isAudioChunking, setIsAudioChunking] = useState(false);
  const [audioChunkError, setAudioChunkError] = useState<string | null>(null);
  const [audioChunkResult, setAudioChunkResult] =
    useState<ImportPracticeAudioResponse | null>(null);

  // Image PDF import state (Listening practice)
  const [practiceImagePdf, setPracticeImagePdf] = useState<File | null>(null);
  const [isImageImporting, setIsImageImporting] = useState(false);
  const [imageImportError, setImageImportError] = useState<string | null>(null);
  const [imageImportResult, setImageImportResult] =
    useState<ImportPracticeImagesResponse | null>(null);

  const [practiceQuestionList, setPracticeQuestionList] =
    useState<PracticeQuestionsListResponse | null>(null);
  const [practiceListLoading, setPracticeListLoading] = useState(false);
  const [showPracticeList, setShowPracticeList] = useState(false);

  const fieldClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors";

  const selectionConfig = useMemo(
    () => getSelectionConfig(practicePartSelection),
    [practicePartSelection],
  );
  const defaultManualPart = useMemo(() => {
    if (selectionConfig.toeicPart) return selectionConfig.toeicPart;
    return selectionConfig.importScope === "full_listening" ? 1 : 5;
  }, [selectionConfig.importScope, selectionConfig.toeicPart]);

  const loadPracticeQuestionList = async () => {
    setPracticeListLoading(true);
    try {
      const data = await listToeicPracticeQuestions(
        practiceSetId.trim().length > 0
          ? { practice_set_id: practiceSetId.trim() }
          : selectionConfig.listFilter,
      );
      setPracticeQuestionList(data);
    } catch {
      // Keep UX calm if list API is unavailable; user still can import.
    } finally {
      setPracticeListLoading(false);
    }
  };

  useEffect(() => {
    if (showPracticeList) {
      void loadPracticeQuestionList();
    }
  }, [
    showPracticeList,
    practicePartSelection,
    selectionConfig.listFilter,
    practiceSetId,
  ]);

  const handlePracticeImport = async () => {
    if (!practiceFile) {
      setPracticeError("Vui lòng chọn file câu hỏi.");
      return;
    }

    if (practiceBandMin > practiceBandMax) {
      setPracticeError("Điểm tối thiểu không được lớn hơn điểm tối đa.");
      return;
    }

    setIsPracticeSubmitting(true);
    setPracticeError(null);
    setPracticeResult(null);
    setManualError(null);
    setManualResult(null);
    setManualRows([]);

    try {
      const res = await importToeicPracticeQuestions(
        {
          import_scope: selectionConfig.importScope,
          toeic_part: selectionConfig.toeicPart,
          score_band_min: practiceBandMin,
          score_band_max: practiceBandMax,
          replace_existing: practiceReplaceExisting,
        },
        practiceFile,
      );
      setPracticeResult(res);
      setPracticeSetId(res.practice_set_id);

      const seededRows = res.skipped_duplicates
        .slice(0, 50)
        .map((duplicate) =>
          createManualRow(
            duplicate.part || defaultManualPart,
            duplicate.question_number,
          ),
        );
      setManualRows(
        seededRows.length > 0
          ? seededRows
          : [createManualRow(defaultManualPart)],
      );

      if (showPracticeList) {
        void loadPracticeQuestionList();
      }

      // Auto-chunk audio if provided and applicable
      if (
        practiceAudioFile &&
        (selectionConfig.importScope === "full_listening" ||
          ["1", "2", "3", "4"].includes(practicePartSelection))
      ) {
        setIsAudioChunking(true);
        try {
          const audioRes = await importPracticeAudio(
            res.practice_set_id,
            practiceAudioFile,
          );
          setAudioChunkResult(audioRes);
        } catch (audioErr: any) {
          setAudioChunkError(
            audioErr?.response?.data?.message ??
            audioErr?.message ??
            "Không thể tách audio. Vui lòng thử lại sau.",
          );
        } finally {
          setIsAudioChunking(false);
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ??
        (err as any)?.message ??
        "Lỗi khi nạp câu hỏi.";
      setPracticeError(Array.isArray(msg) ? msg.join(" ") : String(msg));
    } finally {
      setIsPracticeSubmitting(false);
    }
  };

  const handleImportAnswerKey = async () => {
    if (!practiceSetId.trim()) {
      setAnswerKeyError("Vui lòng nhập mã bộ câu hỏi để gán đáp án.");
      return;
    }

    if (!answerKeyFile) {
      setAnswerKeyError("Vui lòng chọn file đáp án.");
      return;
    }

    setIsAnswerKeySubmitting(true);
    setAnswerKeyError(null);
    setAnswerKeyResult(null);

    try {
      const res = await importToeicPracticeAnswerKey(
        {
          practice_set_id: practiceSetId.trim(),
          clear_existing: true,
        },
        answerKeyFile,
      );
      setAnswerKeyResult(res);
      if (showPracticeList) {
        void loadPracticeQuestionList();
      }
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ??
        (err as any)?.message ??
        "Lỗi khi nạp đáp án.";
      setAnswerKeyError(Array.isArray(msg) ? msg.join(" ") : String(msg));
    } finally {
      setIsAnswerKeySubmitting(false);
    }
  };

  const handlePracticeAudioChunk = async () => {
    const sid = practiceSetId.trim() || practiceResult?.practice_set_id || "";
    if (!sid) {
      setAudioChunkError("Vui lòng nạp câu hỏi trước hoặc nhập mã bộ câu hỏi.");
      return;
    }
    if (!practiceAudioFile) {
      setAudioChunkError("Vui lòng chọn file audio.");
      return;
    }
    setIsAudioChunking(true);
    setAudioChunkError(null);
    setAudioChunkResult(null);
    try {
      const res = await importPracticeAudio(sid, practiceAudioFile);
      setAudioChunkResult(res);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Không thể tách audio. Vui lòng thử lại.";
      setAudioChunkError(String(msg));
    } finally {
      setIsAudioChunking(false);
    }
  };

  const handlePracticeImageImport = async () => {
    const sid = practiceSetId.trim() || practiceResult?.practice_set_id || "";
    if (!sid) {
      setImageImportError("Vui lòng nạp câu hỏi trước hoặc nhập mã bộ câu hỏi.");
      return;
    }
    if (!practiceImagePdf) {
      setImageImportError("Vui lòng chọn file PDF chứa hình ảnh.");
      return;
    }
    setIsImageImporting(true);
    setImageImportError(null);
    setImageImportResult(null);
    try {
      const res = await importPracticeImages(sid, practiceImagePdf);
      setImageImportResult(res);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "Không thể trích xuất hình ảnh. Vui lòng thử lại.";
      setImageImportError(String(msg));
    } finally {
      setIsImageImporting(false);
    }
  };

  const updateManualRow = (
    rowId: string,
    updater: (row: ManualSupplementRow) => ManualSupplementRow,
  ) => {
    setManualRows((prev) =>
      prev.map((row) => (row.id === rowId ? updater(row) : row)),
    );
  };

  const addManualRow = () => {
    setManualRows((prev) => [...prev, createManualRow(defaultManualPart)]);
  };

  const removeManualRow = (rowId: string) => {
    setManualRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleManualSupplementSubmit = async () => {
    if (!practiceResult?.practice_set_id && !practiceSetId.trim()) {
      setManualError(
        "Không tìm thấy mã bộ câu hỏi để nạp bổ sung. Vui lòng nạp câu hỏi trước hoặc nhập mã thủ công.",
      );
      return;
    }

    const activeRows = manualRows.filter((row) => row.stem.trim().length > 0);
    if (activeRows.length === 0) {
      setManualError("Vui lòng nhập nội dung cho ít nhất 1 câu bổ sung.");
      return;
    }

    for (let i = 0; i < activeRows.length; i += 1) {
      const row = activeRows[i];
      const filledOptions = (
        Object.entries(row.options) as Array<[ManualOptionKey, string]>
      ).filter(([, text]) => text.trim().length > 0);

      if (filledOptions.length < 2) {
        setManualError(`Câu bổ sung #${i + 1} cần ít nhất 2 đáp án.`);
        return;
      }

      if (!filledOptions.some(([key]) => key === row.correct_option_key)) {
        setManualError(
          `Câu bổ sung #${i + 1} chưa có nội dung cho đáp án đúng ${row.correct_option_key}.`,
        );
        return;
      }
    }

    setManualSubmitting(true);
    setManualError(null);
    setManualResult(null);

    try {
      const payloadItems = activeRows.map((row) => {
        const options = (
          Object.entries(row.options) as Array<[ManualOptionKey, string]>
        )
          .filter(([, text]) => text.trim().length > 0)
          .map(([key, text]) => ({
            option_key: key,
            option_text: text.trim(),
          }));

        return {
          toeic_part: row.toeic_part,
          question_number:
            row.question_number.trim().length > 0
              ? Number(row.question_number)
              : undefined,
          stem: row.stem.trim(),
          reading_passage:
            row.reading_passage.trim().length > 0
              ? row.reading_passage.trim()
              : undefined,
          options,
          correct_option_key: row.correct_option_key,
        };
      });

      const res = await importToeicPracticeManualSupplement({
        score_band_min: practiceBandMin,
        score_band_max: practiceBandMax,
        practice_set_id:
          practiceSetId.trim() || practiceResult?.practice_set_id,
        items: payloadItems,
      });

      setManualResult(res);
      setPracticeSetId(res.practice_set_id);

      if (showPracticeList) {
        void loadPracticeQuestionList();
      }
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ??
        (err as any)?.message ??
        "Lỗi khi nạp bổ sung thủ công.";
      setManualError(Array.isArray(msg) ? msg.join(" ") : String(msg));
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="rounded-2xl border border-amber-200 bg-white shadow-md overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 pb-1 border-b border-amber-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <FileUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Nạp Câu Hỏi Ôn Luyện (Practice Test)</h2>
              <p className="text-xs text-gray-500">
                Nạp các câu hỏi riêng lẻ cho ngân hàng ôn luyện. Parser sẽ bóc tách câu hỏi và hình ảnh theo từng Part.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Định dạng chấp nhận:</p>
            <p>File câu hỏi: PDF</p>
            <p>File đáp án: Image, PDF</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Chế độ nạp
              </label>
              <select
                value={practicePartSelection}
                onChange={(e) =>
                  setPracticePartSelection(
                    e.target.value as PracticePartSelection,
                  )
                }
                className={fieldClass}
              >
                {_externalCertType !== "ielts" ? (
                  <>
                    <option value="1">Part 1 - Listening</option>
                    <option value="2">Part 2 - Listening</option>
                    <option value="3">Part 3 - Listening</option>
                    <option value="4">Part 4 - Listening</option>
                    <option value="5">Part 5 - Reading</option>
                    <option value="6">Part 6 - Reading</option>
                    <option value="7">Part 7 - Reading</option>
                    <option value="full_reading">Full Part Reading (5-7)</option>
                    <option value="full_listening">Full Part Listening (1-4)</option>
                  </>
                ) : (
                  <>
                    <option value="speaking">Speaking</option>
                    <option value="writing">Writing</option>
                  </>
                )}
              </select>
              <p className="mt-1 text-[11px] text-gray-500">
                Đang chọn: {selectionConfig.label}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Điểm tối thiểu
              </label>
              <select
                value={practiceBandMin}
                onChange={(e) => setPracticeBandMin(Number(e.target.value))}
                className={fieldClass}
              >
                {[0, 300, 400, 500, 600, 700, 800].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Điểm tối đa
              </label>
              <select
                value={practiceBandMax}
                onChange={(e) => setPracticeBandMax(Number(e.target.value))}
                className={fieldClass}
              >
                {[300, 400, 500, 600, 700, 800, 990].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                File câu hỏi (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  setPracticeFile(e.target.files?.[0] ?? null);
                }}
              />
              <button
                type="button"
                onClick={() => setShowFormatModal(true)}
                className={`${fieldClass} cursor-pointer w-full text-left flex items-center justify-between min-h-[42px]`}
              >
                <span className="truncate pr-2 text-gray-600">
                  {practiceFile ? practiceFile.name : "Nhấn để chọn file PDF..."}
                </span>
                <span className="shrink-0 rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200 transition-colors">
                  Duyệt file
                </span>
              </button>
            </div>

            {(selectionConfig.importScope === "full_listening" ||
              ["1", "2", "3", "4"].includes(practicePartSelection)) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    File Audio (MP3/WAV)
                  </label>
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav"
                    onChange={(e) =>
                      setPracticeAudioFile(e.target.files?.[0] ?? null)
                    }
                    className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200`}
                  />
                  <p className="mt-1 text-[10px] text-gray-500">
                    Nếu tải lên file mp3 đơn lẻ chứa toàn bộ bài, hệ thống sẽ tự
                    động dùng AI cắt và ghép vào từng câu hỏi.
                  </p>
                </div>
              )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={practiceReplaceExisting}
              onChange={(e) => setPracticeReplaceExisting(e.target.checked)}
              className="rounded border-gray-300 text-amber-600"
            />
            <span className="text-xs text-gray-600">
              Xóa câu hỏi cũ cùng phạm vi điểm và scope đang chọn trước khi
              nạp
            </span>
          </label>

          {practiceError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{practiceError}</span>
            </div>
          )}

          {practiceResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p className="font-semibold">Nạp thành công</p>
              <p className="mt-1 text-xs">
                Đã nạp: <strong>{practiceResult.imported_count}</strong> câu |
                Bỏ qua: <strong>{practiceResult.skipped_count}</strong>
              </p>
              <p className="mt-1 text-xs">
                Mã bộ câu hỏi:{" "}
                <strong>{practiceResult.practice_set_id}</strong>
              </p>
              <p className="mt-1 text-xs">
                Detected parts:{" "}
                <strong>
                  {practiceResult.detected_parts.join(", ") || "(none)"}
                </strong>
              </p>
              {typeof practiceResult.extracted_image_count === 'number' && practiceResult.extracted_image_count > 0 && (
                <p className="mt-1 text-xs text-emerald-600">
                  Hình ảnh trích xuất từ PDF: <strong>{practiceResult.extracted_image_count}</strong> ảnh
                </p>
              )}
            </div>
          )}

          {isAudioChunking && (
            <div className="flex items-center gap-2 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-700">
              <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
              <span>Đang tách audio, vui lòng chờ...</span>
            </div>
          )}

          {audioChunkError && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Audio: {audioChunkError}</span>
            </div>
          )}

          {audioChunkResult && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              <p className="font-semibold">Tách audio thành công ✓</p>
              <p className="mt-1 text-xs">
                Tổng chunks: <strong>{audioChunkResult.total_chunks}</strong> | Đã gắn audio: <strong>{audioChunkResult.auto_mapped_count}</strong> câu
                {typeof audioChunkResult.image_mapped_count === 'number' && audioChunkResult.image_mapped_count > 0 && (
                  <> | Đã gắn hình ảnh (AI): <strong>{audioChunkResult.image_mapped_count}</strong> câu</>
                )}
              </p>
            </div>
          )}

          {!!practiceResult?.skipped_duplicates?.length && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <p className="font-semibold">
                Đã lược bỏ {practiceResult.skipped_duplicates.length} câu
                trùng (không ghi đè dữ liệu cũ)
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {practiceResult.skipped_duplicates
                  .slice(0, 40)
                  .map((dup, idx) => (
                    <span
                      key={`${dup.part}-${dup.question_number}-${idx}`}
                      className="rounded-md border border-amber-300 bg-white px-2 py-1"
                    >
                      Part {dup.part} - Câu {dup.question_number}
                    </span>
                  ))}
              </div>
              {practiceResult.skipped_duplicates.length > 40 && (
                <p className="mt-2 text-[11px] text-amber-700">
                  Hiển thị 40/{practiceResult.skipped_duplicates.length} câu
                  bị lược bỏ.
                </p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-sky-800">
                  Bổ sung thủ công câu hỏi
                </p>
                <p className="text-[11px] text-sky-700">
                  Có thể thêm nhiều câu, chỉ lưu câu mới chưa tồn tại theo
                  Part + nội dung + đáp án.
                </p>
              </div>
              <button
                type="button"
                onClick={addManualRow}
                className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
              >
                + Thêm 1 câu
              </button>
            </div>

            {manualRows.length === 0 && (
              <p className="text-xs text-sky-700">
                Chưa có dòng bổ sung. Bấm "Thêm 1 câu" để bắt đầu.
              </p>
            )}

            {!!practiceResult?.skipped_duplicates?.length && (
              <div className="rounded-md border border-sky-300 bg-white px-3 py-2 text-[11px] text-sky-700">
                Hệ thống đã seed sẵn{" "}
                {Math.min(practiceResult.skipped_duplicates.length, 50)} dòng
                từ danh sách câu bị trùng để bạn bổ sung nhanh.
              </div>
            )}

            <div className="space-y-3">
              {manualRows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-sky-200 bg-white p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-700">
                      Câu bổ sung #{index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeManualRow(row.id)}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                    >
                      Xóa dòng
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Part
                      </label>
                      <select
                        value={row.toeic_part}
                        onChange={(e) =>
                          updateManualRow(row.id, (current) => ({
                            ...current,
                            toeic_part: Number(e.target.value),
                          }))
                        }
                        className={fieldClass}
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map((part) => (
                          <option key={part} value={part}>
                            Part {part}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Số thứ tự câu
                      </label>
                      <input
                        value={row.question_number}
                        onChange={(e) =>
                          updateManualRow(row.id, (current) => ({
                            ...current,
                            question_number: e.target.value,
                          }))
                        }
                        className={fieldClass}
                        placeholder="vd: 153"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Đáp án đúng
                      </label>
                      <select
                        value={row.correct_option_key}
                        onChange={(e) =>
                          updateManualRow(row.id, (current) => ({
                            ...current,
                            correct_option_key: e.target
                              .value as ManualOptionKey,
                          }))
                        }
                        className={fieldClass}
                      >
                        {(["A", "B", "C", "D"] as ManualOptionKey[]).map(
                          (k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Nội dung câu hỏi
                    </label>
                    <textarea
                      value={row.stem}
                      onChange={(e) =>
                        updateManualRow(row.id, (current) => ({
                          ...current,
                          stem: e.target.value,
                        }))
                      }
                      className={`${fieldClass} min-h-[70px]`}
                      placeholder="Nhập nội dung câu hỏi..."
                    />
                  </div>

                  {[6, 7].includes(row.toeic_part) && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        📄 Đoạn văn (Reading Passage) — Part {row.toeic_part}
                      </label>
                      <textarea
                        value={row.reading_passage}
                        onChange={(e) =>
                          updateManualRow(row.id, (current) => ({
                            ...current,
                            reading_passage: e.target.value,
                          }))
                        }
                        className={`${fieldClass} min-h-[100px]`}
                        placeholder="Dán đoạn văn (passage) mà câu hỏi liên quan vào đây... Ví dụ: Questions 131-134 refer to the following email..."
                      />
                      <p className="mt-1 text-[10px] text-gray-400">
                        Đoạn văn sẽ hiển thị cho sinh viên phía trên câu hỏi. Các câu cùng nhóm (ví dụ 131-134) nên dùng chung đoạn văn.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(["A", "B", "C", "D"] as ManualOptionKey[]).map(
                      (key) => (
                        <div key={key}>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Đáp án {key}
                          </label>
                          <input
                            value={row.options[key]}
                            onChange={(e) =>
                              updateManualRow(row.id, (current) => ({
                                ...current,
                                options: {
                                  ...current.options,
                                  [key]: e.target.value,
                                },
                              }))
                            }
                            className={fieldClass}
                            placeholder={`Nhập phương án ${key}`}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>

            {manualError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            {manualResult && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                <p className="font-semibold">Nạp bổ sung thành công</p>
                <p className="mt-1">
                  Inserted: <strong>{manualResult.inserted_count}</strong> |
                  Skipped: <strong>{manualResult.skipped_count}</strong>
                </p>
                {manualResult.skipped_duplicates.length > 0 && (
                  <p className="mt-1 text-[11px]">
                    Trùng và bị bỏ qua:{" "}
                    {manualResult.skipped_duplicates
                      .slice(0, 20)
                      .map((dup) => `P${dup.part}-Q${dup.question_number}`)
                      .join(", ")}
                    {manualResult.skipped_duplicates.length > 20
                      ? " ..."
                      : ""}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleManualSupplementSubmit}
              disabled={manualSubmitting || manualRows.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {manualSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Dang nạp bổ
                  sung...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Nạp Câu Bổ Sung Thủ Công
                </>
              )}
            </button>
          </div>

          <button
            onClick={handlePracticeImport}
            disabled={isPracticeSubmitting || !practiceFile}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPracticeSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Nạp Câu Hỏi Ôn Luyện
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Audio Chunking (Listening only) ── */}
      {(selectionConfig.importScope === "full_listening" || ["1", "2", "3", "4"].includes(practicePartSelection)) && (
        <div className="rounded-2xl border border-teal-200 bg-white shadow-md overflow-hidden">
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3 pb-1 border-b border-teal-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                <Scissors className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Tách Audio Nghe (Listening)</h2>
                <p className="text-xs text-gray-500">
                  Upload file audio TOEIC nguyên bản — hệ thống AI sẽ tự động phân tích và cắt thành từng chunk cho từng câu.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-xs text-teal-800 space-y-1">
              <p className="font-semibold">Lưu ý:</p>
              <p>Bạn cần nạp câu hỏi listening trước để lấy mã bộ câu hỏi. Audio sẽ được cắt chính xác theo từng Part 1-4 và tự động gắn vào câu hỏi tương ứng.</p>
              <p>Đường dẫn lưu: <code className="bg-teal-100 px-1 rounded">TOEIC/toeic-listening-practice/&#123;id&#125;/audio/</code></p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Mã bộ câu hỏi (practice_set_id)
                </label>
                <input
                  value={practiceSetId}
                  onChange={(e) => setPracticeSetId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-colors"
                  placeholder={practiceResult?.practice_set_id || "Sẽ tự điền sau khi nạp câu hỏi"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  File Audio (MP3/WAV)
                </label>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav"
                  onChange={(e) => setPracticeAudioFile(e.target.files?.[0] ?? null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200"
                />
              </div>
            </div>

            {audioChunkError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{audioChunkError}</span>
              </div>
            )}

            {audioChunkResult && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                <p className="font-semibold">Tách audio thành công ✓</p>
                <p className="mt-1 text-xs">
                  Tổng chunks: <strong>{audioChunkResult.total_chunks}</strong> | Đã gắn tự động: <strong>{audioChunkResult.auto_mapped_count}</strong> câu
                </p>
                <p className="mt-1 text-xs">Mã bộ: <strong>{audioChunkResult.practice_set_id}</strong></p>
              </div>
            )}

            <button
              onClick={handlePracticeAudioChunk}
              disabled={isAudioChunking || !practiceAudioFile}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAudioChunking ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Đang tách audio...</>
              ) : (
                <><Music className="h-4 w-4" /> Tách Audio Listening</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Image PDF Import (Listening only) ── */}
      {(selectionConfig.importScope === "full_listening" || ["1", "2", "3", "4"].includes(practicePartSelection)) && (
        <div className="rounded-2xl border border-violet-200 bg-white shadow-md overflow-hidden">
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-3 pb-1 border-b border-violet-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                <ImageIcon className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Nạp Hình Ảnh Từ PDF (Listening)</h2>
                <p className="text-xs text-gray-500">
                  Upload file PDF chứa hình ảnh đề thi Listening — hệ thống sẽ trích xuất ảnh Part 1 và các biểu đồ/bản đồ Part 3-4 rồi tự động gắn vào câu hỏi.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs text-violet-800 space-y-1">
              <p className="font-semibold">Lưu ý:</p>
              <p>Bạn cần nạp câu hỏi listening trước để lấy mã bộ câu hỏi. Hình ảnh Part 1 sẽ tự gắn theo thứ tự. Hình ảnh Part 3/4 (biểu đồ, bản đồ, lịch trình...) sẽ được gắn khi tách audio bằng AI.</p>
              <p>Nếu file câu hỏi PDF đã chứa hình ảnh, hệ thống đã tự trích xuất. Dùng chức năng này khi cần nạp hình từ file PDF riêng.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Mã bộ câu hỏi (practice_set_id)
                </label>
                <input
                  value={practiceSetId}
                  onChange={(e) => setPracticeSetId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-colors"
                  placeholder={practiceResult?.practice_set_id || "Sẽ tự điền sau khi nạp câu hỏi"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  File Hình Ảnh (PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPracticeImagePdf(e.target.files?.[0] ?? null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                />
              </div>
            </div>

            {imageImportError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{imageImportError}</span>
              </div>
            )}

            {imageImportResult && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                <p className="font-semibold">Trích xuất hình ảnh thành công ✓</p>
                <p className="mt-1 text-xs">
                  Tổng ảnh trích xuất: <strong>{imageImportResult.extracted_count}</strong> | Đã gắn Part 1: <strong>{imageImportResult.part1_mapped}</strong> câu
                </p>
                <p className="mt-1 text-xs">Mã bộ: <strong>{imageImportResult.practice_set_id}</strong></p>
                {imageImportResult.extracted_count > imageImportResult.part1_mapped && (
                  <p className="mt-1 text-[11px] text-violet-600">
                    Còn {imageImportResult.extracted_count - imageImportResult.part1_mapped} ảnh Part 3/4 sẽ được AI gắn tự động khi bạn tách audio.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handlePracticeImageImport}
              disabled={isImageImporting || !practiceImagePdf}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImageImporting ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Đang trích xuất hình ảnh...</>
              ) : (
                <><ImageIcon className="h-4 w-4" /> Nạp Hình Ảnh Từ PDF</>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-blue-200 bg-white shadow-md overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 pb-1 border-b border-blue-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <KeyRound className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-blue-900">
                Gán Đáp Án Cho Bộ Câu Hỏi
              </h2>
              <p className="text-[11px] text-blue-500 mt-0.5">
                Upload file đáp án để hệ thống tự động khớp và gán vào từng
                câu.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Mã bộ câu hỏi
            </label>
            <input
              className={fieldClass}
              placeholder="Tự động điền sau khi nạp câu hỏi..."
              value={practiceSetId}
              onChange={(e) => setPracticeSetId(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Được tự động điền sau khi nạp câu hỏi thành công. Có thể nhập
              thủ công nếu cần.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              File đáp án (TXT/PDF/DOC/DOCX/Ảnh)
            </label>
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff"
              onChange={(e) => setAnswerKeyFile(e.target.files?.[0] ?? null)}
              className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200`}
            />
            {answerKeyFile && (
              <p className="mt-1 text-xs text-gray-500">
                Đã chọn: {answerKeyFile.name} (
                {(answerKeyFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {answerKeyError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{answerKeyError}</span>
            </div>
          )}

          {answerKeyResult && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <p className="font-semibold">Nạp đáp án thành công</p>
              <p className="mt-1 text-xs">
                Matched: <strong>{answerKeyResult.matched_questions}</strong>{" "}
                | Updated:{" "}
                <strong>{answerKeyResult.updated_questions}</strong> |
                Unanswered:{" "}
                <strong>{answerKeyResult.unanswered_questions}</strong>
              </p>
              {answerKeyResult.unmatched_question_numbers.length > 0 && (
                <p className="mt-1 text-xs">
                  Không khớp số câu:{" "}
                  {answerKeyResult.unmatched_question_numbers
                    .slice(0, 20)
                    .join(", ")}
                  {answerKeyResult.unmatched_question_numbers.length > 20
                    ? " ..."
                    : ""}
                </p>
              )}
              {!!answerKeyResult.missing_option_question_numbers?.length && (
                <p className="mt-1 text-xs text-amber-700">
                  Câu thiếu đáp án {"("}đã tạo placeholder, vui lòng cập nhật
                  nội dung{")"}:{" "}
                  {answerKeyResult.missing_option_question_numbers
                    .slice(0, 20)
                    .join(", ")}
                  {answerKeyResult.missing_option_question_numbers.length > 20
                    ? " ..."
                    : ""}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleImportAnswerKey}
            disabled={
              isAnswerKeySubmitting || !answerKeyFile || !practiceSetId.trim()
            }
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnswerKeySubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Đang gán đáp
                án...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Nạp Đáp Án Cho Bộ Câu Hỏi
              </>
            )}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
        <div className="px-6 py-5 space-y-3">
          <button
            type="button"
            onClick={() => setShowPracticeList((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            {showPracticeList ? "Ẩn" : "Xem"} danh sách câu hỏi đã nạp
          </button>

          {showPracticeList && (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {practiceListLoading ? (
                <p className="px-4 py-3 text-xs text-gray-500">Đang tải...</p>
              ) : !practiceQuestionList ||
                practiceQuestionList.items.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-500">
                  Chưa có câu hỏi theo bộ lọc hiện tại.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                          ID
                        </th>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                          Set
                        </th>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                          QNo
                        </th>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                          Part
                        </th>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                          Band
                        </th>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                          Đáp án
                        </th>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                          Câu hỏi
                        </th>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                          Passage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {practiceQuestionList.items.slice(0, 20).map((q) => (
                        <tr key={q.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400 tabular-nums">
                            {q.id}
                          </td>
                          <td className="px-3 py-2 text-gray-500 max-w-[130px] truncate">
                            {q.practice_set_id ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-500 tabular-nums">
                            {q.question_number ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-500 tabular-nums">
                            {q.part ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-500 tabular-nums">
                            {q.score_band_min}-{q.score_band_max}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${q.has_answer_key
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                }`}
                            >
                              {q.has_answer_key ? "Đã map" : "Chưa map"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-800 max-w-xs truncate">
                            {q.stem}
                          </td>
                          <td className="px-3 py-2 text-gray-500 max-w-[200px]">
                            {(q as any).reading_passage ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700" title={(q as any).reading_passage}>
                                Có passage
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="px-3 py-2 text-[10px] text-gray-400 bg-gray-50 border-t border-gray-100">
                    Hiển thị 20/{practiceQuestionList.total} câu hỏi
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showFormatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Hướng Dẫn Định Dạng File Chuẩn
              </h3>
              <button onClick={() => setShowFormatModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700 bg-gray-50/50">
              <p className="font-medium text-gray-900 text-base">Để hệ thống nhận diện chính xác câu hỏi, file PDF của bạn CẦN tuân thủ các quy tắc sau:</p>
              
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">1</div>
                    <span className="font-bold text-gray-800">Số thứ tự câu hỏi rõ ràng:</span>
                  </div>
                  <ul className="list-disc ml-9 text-gray-600 space-y-2">
                    <li>Mỗi câu hỏi <strong className="text-rose-500">bắt buộc</strong> phải bắt đầu bằng số thứ tự kèm dấu chấm hoặc ngoặc đơn ở đầu dòng.</li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold w-12 shrink-0">ĐÚNG:</span>
                      <span><code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-[13px]">101. The manager...</code> hoặc <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-[13px]">101) The manager...</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold w-12 shrink-0">SAI:</span>
                      <span>Câu hỏi mất số thứ tự hoặc dính liền chữ (vd: <code className="bg-red-50 text-red-800 border border-red-100 px-1.5 py-0.5 rounded font-mono text-[13px]">101The manager...</code>).</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">2</div>
                    <span className="font-bold text-gray-800">Định dạng đáp án:</span>
                  </div>
                  <ul className="list-disc ml-9 text-gray-600 space-y-2">
                    <li>Phải có đủ đáp án và bắt đầu bằng <strong className="text-gray-800">A, B, C, D</strong> in hoa kèm dấu chấm/ngoặc.</li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold w-12 shrink-0">ĐÚNG:</span>
                      <span><code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-[13px]">A. report</code> hoặc <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-[13px]">(A) report</code></span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs">3</div>
                    <span className="font-bold text-gray-800">Nội dung không hợp lệ:</span>
                  </div>
                  <ul className="list-disc ml-9 text-gray-600 space-y-1">
                    <li>Không chứa các ký hiệu Toán học phức tạp (<code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-[13px]">∫, ∑, lim</code>) hay các môn học khác.</li>
                    <li>Hệ thống sẽ <strong className="text-rose-600">từ chối hoàn toàn</strong> file nếu phát hiện rác hoặc cấu trúc dị thường.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button onClick={() => setShowFormatModal(false)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-bg-50 rounded-xl transition-colors shadow-sm">
                Hủy thao tác
              </button>
              <button onClick={() => {
                setShowFormatModal(false);
                fileInputRef.current?.click();
              }} className="px-6 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95">
                <CheckCircle2 className="h-4 w-4" /> Đã Hiểu & Chọn File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
