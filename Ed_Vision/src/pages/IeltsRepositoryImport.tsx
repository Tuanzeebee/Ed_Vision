/**
 * IeltsRepositoryImport.tsx
 * ─────────────────────────
 * Trang import đề IELTS — độc lập hoàn toàn với ToeicRepositoryImport.tsx
 */

import { useRef, useState } from "react";
import {
  importIeltsExamFromOcrFile,
  importIeltsAnswerKeyFromFile,
  importIeltsPracticeQuestions,
  type IeltsOcrImportResponse,
  type IeltsAnswerKeyImportResponse,
  type IeltsPracticeImportResponse,
} from "@/services/api/certificateService";

// ─── Constants ────────────────────────────────────────────────────────────────
const SKILL_AREAS = ["reading", "listening", "speaking", "writing"] as const;
type SkillArea = (typeof SKILL_AREAS)[number];

const BAND_PRESETS = [
  { label: "Band 3.0 – 4.5 (Beginner)",          value: "3-4.5",  min: 3,   max: 4.5 },
  { label: "Band 4.5 – 6.0 (Pre-Intermediate)",   value: "4.5-6",  min: 4.5, max: 6   },
  { label: "Band 6.0 – 7.0 (Intermediate)",       value: "6-7",    min: 6,   max: 7   },
  { label: "Band 7.0 – 8.0 (Upper-Intermediate)", value: "7-8",    min: 7,   max: 8   },
  { label: "Band 8.0 – 9.0 (Advanced)",           value: "8-9",    min: 8,   max: 9   },
] as const;

type BandPreset = (typeof BAND_PRESETS)[number];

// ─── Shared style tokens ──────────────────────────────────────────────────────
const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition";

const btnPrimary =
  "flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed";

const btnSecondary =
  "flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed";

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-md p-6 space-y-5">
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, badge }: { icon: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xl">{icon}</span>
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      {badge && (
        <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
          {badge}
        </span>
      )}
    </div>
  );
}

function FileDropZone({
  file,
  onFile,
  accept = ".pdf,.docx,.txt",
}: {
  file: File | null;
  onFile: (f: File) => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 cursor-pointer transition
        ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300"}`}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      <span className="text-3xl mb-2">{file ? "📄" : "☁️"}</span>
      {file ? (
        <p className="text-sm font-medium text-blue-600">{file.name}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-600">Kéo thả hoặc click để chọn file</p>
          <p className="text-xs text-gray-400 mt-0.5">{accept}</p>
        </>
      )}
    </div>
  );
}

function ResultBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold
        ${ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IeltsRepositoryImport({ mode }: { mode: string }) {
  // const [activeTab, setActiveTab] = useState<"exam" | "practice">("exam");
  const activeTab = mode as "exam" | "practice";

  // ── Tab "Đề thi" — Bước 1 ──
  const [examFile, setExamFile] = useState<File | null>(null);
  const [examSkill, setExamSkill] = useState<SkillArea>("reading");
  const [examBandPreset, setExamBandPreset] = useState<BandPreset>(BAND_PRESETS[2]);
  const [examTitle, setExamTitle] = useState("");
  const [examYear, setExamYear] = useState<string>(String(new Date().getFullYear()));
  const [examReplace, setExamReplace] = useState(false);
  const [examAudioFile, setExamAudioFile] = useState<File | null>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examResult, setExamResult] = useState<IeltsOcrImportResponse | null>(null);
  const [examError, setExamError] = useState<string | null>(null);

  // ── Tab "Đề thi" — Bước 2 ──
  const [examAkFile, setExamAkFile] = useState<File | null>(null);
  const [examAkClear, setExamAkClear] = useState(false);
  const [examAkLoading, setExamAkLoading] = useState(false);
  const [examAkResult, setExamAkResult] = useState<IeltsAnswerKeyImportResponse | null>(null);
  const [examAkError, setExamAkError] = useState<string | null>(null);

  const examActiveSlug = examResult?.slug ?? "";

  // ── Tab "Luyện tập" — Bước 1 ──
  const [prFile, setPrFile] = useState<File | null>(null);
  const [prSkill, setPrSkill] = useState<SkillArea>("reading");
  const [prBandPreset, setPrBandPreset] = useState<BandPreset>(BAND_PRESETS[2]);
  const [prReplace, setPrReplace] = useState(false);
  const [prAudioFile, setPrAudioFile] = useState<File | null>(null);
  const [prLoading, setPrLoading] = useState(false);
  const [prResult, setPrResult] = useState<IeltsPracticeImportResponse | null>(null);
  const [prError, setPrError] = useState<string | null>(null);

  // ── Tab "Luyện tập" — Bước 2 ──
  const [prAkFile, setPrAkFile] = useState<File | null>(null);
  const [prAkClear, setPrAkClear] = useState(false);
  const [prAkLoading, setPrAkLoading] = useState(false);
  const [prAkResult, setPrAkResult] = useState<IeltsAnswerKeyImportResponse | null>(null);
  const [prAkError, setPrAkError] = useState<string | null>(null);

  const prActiveSlug = prResult?.slug ?? "";

  // ── Handlers ──
  async function handleExamSubmit() {
    if (!examFile) return;
    setExamLoading(true); setExamError(null); setExamResult(null);
    try {
      const slug = `ielts-${examSkill}-${Date.now()}`;
      const res = await importIeltsExamFromOcrFile(
        {
          repository_slug: slug,
          repository_title: examTitle.trim() || slug,
          skill_area: examSkill,
          replace_existing: examReplace,
          band_range: examBandPreset.value,
          exam_year: examYear || undefined,
        },
        examFile,
      );
      setExamResult(res);
    } catch (e: any) {
      setExamError(e?.response?.data?.message ?? e.message ?? "Lỗi không xác định");
    } finally {
      setExamLoading(false);
    }
  }

  async function handleExamAkSubmit() {
    if (!examAkFile || !examActiveSlug) return;
    setExamAkLoading(true); setExamAkError(null); setExamAkResult(null);
    try {
      const res = await importIeltsAnswerKeyFromFile(
        { repository_slug: examActiveSlug, clear_existing: examAkClear },
        examAkFile,
      );
      setExamAkResult(res);
    } catch (e: any) {
      setExamAkError(e?.response?.data?.message ?? e.message ?? "Lỗi không xác định");
    } finally {
      setExamAkLoading(false);
    }
  }

  async function handlePrSubmit() {
    if (!prFile) return;
    setPrLoading(true); setPrError(null); setPrResult(null);
    try {
      const slug = `ielts-practice-${prSkill}-${Date.now()}`;
      const res = await importIeltsPracticeQuestions(
        {
          skill_area: prSkill,
          band_min: prBandPreset.min,
          band_max: prBandPreset.max,
          replace_existing: prReplace,
          // note: backend might need slug if it returns one
        },
        prFile,
      );
      setPrResult(res);
    } catch (e: any) {
      setPrError(e?.response?.data?.message ?? e.message ?? "Lỗi không xác định");
    } finally {
      setPrLoading(false);
    }
  }

  async function handlePrAkSubmit() {
    if (!prAkFile || !prActiveSlug) return;
    setPrAkLoading(true); setPrAkError(null); setPrAkResult(null);
    try {
      const res = await importIeltsAnswerKeyFromFile(
        { repository_slug: prActiveSlug, clear_existing: prAkClear },
        prAkFile,
      );
      setPrAkResult(res);
    } catch (e: any) {
      setPrAkError(e?.response?.data?.message ?? e.message ?? "Lỗi không xác định");
    } finally {
      setPrAkLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Internal Tab Switcher removed — controlled by parent card */}

      <div className={activeTab === "exam" ? "block space-y-6" : "hidden"}>
        {/* Exam Step 1 */}
        <SectionCard>
          <SectionTitle icon="📤" title="Bước 1: Upload Đề thi (OCR)" badge="IELTS Exam" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Kỹ năng</label>
              <select className={fieldClass} value={examSkill} onChange={(e) => setExamSkill(e.target.value as SkillArea)}>
                {SKILL_AREAS.map(s => <option className="bg-white text-gray-900" key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Band mục tiêu</label>
              <select className={fieldClass} value={examBandPreset.value} onChange={(e) => {
                const p = BAND_PRESETS.find(b => b.value === e.target.value);
                if (p) setExamBandPreset(p);
              }}>
                {BAND_PRESETS.map(b => <option className="bg-white text-gray-900" key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tiêu đề kho đề</label>
              <input className={fieldClass} placeholder="Cambridge 18 Reading Test 1" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Năm đề</label>
              <input type="number" className={fieldClass} placeholder="2023" value={examYear} onChange={(e) => setExamYear(e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" className="rounded" checked={examReplace} onChange={(e) => setExamReplace(e.target.checked)} />
            Ghi đè nếu đã tồn tại
          </label>

          <FileDropZone file={examFile} onFile={setExamFile} accept=".pdf,.docx,.txt" />

          {examSkill === "listening" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Audio File (.mp3, .wav, .m4a)</label>
              <input type="file" accept=".mp3,.wav,.m4a" className={fieldClass} onChange={(e) => setExamAudioFile(e.target.files?.[0] || null)} />
            </div>
          )}

          <div className="flex gap-3">
            <button className={btnPrimary} disabled={!examFile || examLoading} onClick={handleExamSubmit}>
              {examLoading ? "⏳ Đang xử lý..." : "🚀 Upload & OCR"}
            </button>
            {examFile && <button className={btnSecondary} onClick={() => { setExamFile(null); setExamResult(null); }}>✕ Hủy</button>}
          </div>

          {examError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">⚠️ {examError}</p>}
          {examResult && (
            <div className="bg-green-50 p-4 rounded-xl space-y-2 text-sm">
              <p className="font-bold text-green-800">✅ Import thành công</p>
              <div className="flex flex-wrap gap-2">
                <ResultBadge ok={true} label={`${examResult.imported_count} câu`} />
                <ResultBadge ok={examResult.skipped_count === 0} label={`${examResult.skipped_count} skipped`} />
              </div>
            </div>
          )}
        </SectionCard>

        {/* Exam Step 2 */}
        <div className={!examActiveSlug ? "opacity-50 pointer-events-none" : ""}>
          <SectionCard>
            <SectionTitle icon="🗝️" title="Bước 2: Upload Answer Key" badge="Exam Answers" />
            <p className="text-xs text-gray-500">Tự động gắn đáp án vào kho đề vừa nạp ở Bước 1.</p>
            
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" className="rounded" checked={examAkClear} onChange={(e) => setExamAkClear(e.target.checked)} />
              Xóa đáp án cũ trước khi import
            </label>

            <FileDropZone file={examAkFile} onFile={setExamAkFile} accept=".pdf,.docx,.xlsx,.txt" />

            <div className="flex gap-3">
              <button className={btnPrimary} disabled={!examAkFile || examAkLoading || !examActiveSlug} onClick={handleExamAkSubmit}>
                {examAkLoading ? "⏳ Đang gán..." : "🗝️ Import Answer Key"}
              </button>
              {examAkFile && <button className={btnSecondary} onClick={() => { setExamAkFile(null); setExamAkResult(null); }}>✕ Hủy</button>}
            </div>

            {examAkError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">⚠️ {examAkError}</p>}
            {examAkResult && (
              <div className="bg-green-50 p-4 rounded-xl space-y-2 text-sm">
                <p className="font-bold text-green-800">✅ Answer key applied</p>
                <ResultBadge ok={true} label={`${examAkResult.applied_items} items`} />
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <div className={activeTab === "practice" ? "block space-y-6" : "hidden"}>
        {/* Practice Step 1 */}
        <SectionCard>
          <SectionTitle icon="📝" title="Bước 1: Upload Câu hỏi luyện tập" badge="IELTS Practice" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Kỹ năng</label>
              <select className={fieldClass} value={prSkill} onChange={(e) => setPrSkill(e.target.value as SkillArea)}>
                {SKILL_AREAS.map(s => <option className="bg-white text-gray-900" key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Band mục tiêu</label>
              <select className={fieldClass} value={prBandPreset.value} onChange={(e) => {
                const p = BAND_PRESETS.find(b => b.value === e.target.value);
                if (p) setPrBandPreset(p);
              }}>
                {BAND_PRESETS.map(b => <option className="bg-white text-gray-900" key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input type="checkbox" className="rounded" checked={prReplace} onChange={(e) => setPrReplace(e.target.checked)} />
            Ghi đè nếu đã tồn tại
          </label>

          <FileDropZone file={prFile} onFile={setPrFile} accept=".pdf,.docx,.txt" />

          {prSkill === "listening" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Audio File (.mp3, .wav, .m4a)</label>
              <input type="file" accept=".mp3,.wav,.m4a" className={fieldClass} onChange={(e) => setPrAudioFile(e.target.files?.[0] || null)} />
            </div>
          )}

          <div className="flex gap-3">
            <button className={btnPrimary} disabled={!prFile || prLoading} onClick={handlePrSubmit}>
              {prLoading ? "⏳ Đang xử lý..." : "🚀 Nạp Luyện tập"}
            </button>
            {prFile && <button className={btnSecondary} onClick={() => { setPrFile(null); setPrResult(null); }}>✕ Hủy</button>}
          </div>

          {prError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">⚠️ {prError}</p>}
          {prResult && (
            <div className="bg-green-50 p-4 rounded-xl space-y-2 text-sm">
              <p className="font-bold text-green-800">✅ Practice import thành công</p>
              <ResultBadge ok={true} label={`${prResult.imported_count} câu`} />
            </div>
          )}
        </SectionCard>

        {/* Practice Step 2 */}
        <div className={!prActiveSlug ? "opacity-50 pointer-events-none" : ""}>
          <SectionCard>
            <SectionTitle icon="🗝️" title="Bước 2: Upload Answer Key (Practice)" badge="Practice Answers" />
            
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" className="rounded" checked={prAkClear} onChange={(e) => setPrAkClear(e.target.checked)} />
              Xóa đáp án cũ trước khi import
            </label>

            <FileDropZone file={prAkFile} onFile={setPrAkFile} accept=".pdf,.docx,.xlsx,.txt" />

            <div className="flex gap-3">
              <button className={btnPrimary} disabled={!prAkFile || prAkLoading || !prActiveSlug} onClick={handlePrAkSubmit}>
                {prAkLoading ? "⏳ Đang gán..." : "🗝️ Import Answer Key"}
              </button>
              {prAkFile && <button className={btnSecondary} onClick={() => { setPrAkFile(null); setPrAkResult(null); }}>✕ Hủy</button>}
            </div>

            {prAkError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">⚠️ {prAkError}</p>}
            {prAkResult && (
              <div className="bg-green-50 p-4 rounded-xl space-y-2 text-sm">
                <p className="font-bold text-green-800">✅ Answer key applied</p>
                <ResultBadge ok={true} label={`${prAkResult.applied_items} items`} />
              </div>
            )}
          </SectionCard>
        </div>
      </div>
      {activeTab !== "exam" && activeTab !== "practice" && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-8 text-center text-gray-400">
          Giao diện IELTS cho loại nạp này đang được cập nhật.
        </div>
      )}
    </div>
  );
}