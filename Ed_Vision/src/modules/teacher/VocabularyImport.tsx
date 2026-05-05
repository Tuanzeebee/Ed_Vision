import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, AlertCircle, RefreshCw, BookOpen, CheckCircle2,
  Trash2, Plus, ChevronDown, Eye, Save, X, FileText,
  Image, FileSpreadsheet, FolderOpen,
} from "lucide-react";
import { buildUrl } from "@/services/api/config";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token') ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ParsedWord {
  word: string;
  topic_id?: number;     // có khi giảng viên chọn topic từ dropdown
  topic_slug?: string;   // có khi AI tự phân loại
  topic_vi: string;
  topic_en: string;
  level: string;
  freq: number;
  definitions: { pos: string; meaning: string; example_en: string; example_vi: string }[];
}

interface Topic { id: number; slug: string; titleVI: string; titleEN: string; emoji: string; wordCount: number; }

// ── File icon helper ───────────────────────────────────────────────────────────
function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg","jpeg","png","webp","bmp"].includes(ext)) return <Image size={16} className="text-blue-500" />;
  if (["csv","xlsx","xls"].includes(ext)) return <FileSpreadsheet size={16} className="text-green-500" />;
  return <FileText size={16} className="text-slate-500" />;
}

const LEVEL_COLORS: Record<string, string> = {
  "Cơ bản": "bg-emerald-100 text-emerald-700",
  "Trung bình": "bg-amber-100 text-amber-700",
  "Nâng cao": "bg-rose-100 text-rose-700",
};
const POS_COLORS: Record<string, string> = {
  "n.": "bg-blue-100 text-blue-700",
  "v.": "bg-purple-100 text-purple-700",
  "adj.": "bg-orange-100 text-orange-700",
  "adv.": "bg-teal-100 text-teal-700",
};

// ── Main Component ─────────────────────────────────────────────────────────────
export function VocabularyImportBody() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [topicId, setTopicId] = useState<string>("");
  const [certType] = useState("toeic");
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedWord[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [newTopicMode, setNewTopicMode] = useState(false);
  const [newTopic, setNewTopic] = useState({ title_vi: "", title_en: "", emoji: "📚" });
  const fileRef = useRef<HTMLInputElement>(null);

  // Load topics on mount
  const loadTopics = useCallback(async () => {
    try {
      const res = await fetch(buildUrl("teacher/vocab/topics", { cert_type: certType }), { headers: getAuthHeader() });
      if (res.ok) setTopics(await res.json());
    } catch { /* ignore */ }
  }, [certType]);

  useEffect(() => { loadTopics(); }, [loadTopics]);

  const handleFile = (f: File) => { setFile(f); setError(null); setPreview([]); setStep("upload"); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // Create new topic
  const handleCreateTopic = async () => {
    if (!newTopic.title_vi.trim()) return;
    try {
      const res = await fetch(buildUrl("teacher/vocab/topics"), {
        method: "POST", headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTopic, cert_type: certType }),
      });
      const created = await res.json() as { id: number };
      await loadTopics();
      setTopicId(String(created.id));
      setNewTopicMode(false);
      setNewTopic({ title_vi: "", title_en: "", emoji: "📚" });
    } catch (e) { setError("Không thể tạo chủ đề."); }
  };

  // Upload & preview
  const handlePreview = async () => {
    if (!file) { setError("Vui lòng chọn file."); return; }
    setIsProcessing(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (topicId) fd.append("topic_id", topicId);
      fd.append("cert_type", certType);
      const res = await fetch(buildUrl("teacher/vocab/import/preview"), {
        method: "POST", headers: getAuthHeader(), body: fd,
      });
      if (!res.ok) { const e = await res.json() as { message?: string }; throw new Error(e.message ?? "Lỗi xử lý file."); }
      const data = await res.json() as { preview: ParsedWord[] };
      if (!data.preview?.length) { setError("Không phân tích được từ vựng nào. Thử file khác hoặc định dạng khác."); return; }
      setPreview(data.preview);
      setStep("preview");
    } catch (e: any) { setError(e.message ?? "Lỗi không xác định."); }
    finally { setIsProcessing(false); }
  };

  // Remove a word from preview
  const removeWord = (idx: number) => setPreview(p => p.filter((_, i) => i !== idx));

  // Confirm & save
  const handleConfirm = async () => {
    if (!preview.length) return;
    setIsSaving(true); setError(null);
    try {
      // Build payload: nếu word có topic_id (chọn thủ công) thì dùng, còn không dùng topic_slug
      const words = preview.map(w => ({
        word: w.word,
        topic_id: w.topic_id || undefined,
        topic_slug: w.topic_slug || undefined,
        level: w.level,
        freq: w.freq,
        definitions: w.definitions,
      }));
      const res = await fetch(buildUrl("teacher/vocab/import/confirm"), {
        method: "POST", headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Lưu thất bại (${res.status}).`);
      }
      const data = await res.json() as { imported: number };
      setSavedCount(data.imported);
      setStep("done");
      await loadTopics();
    } catch (e: any) { setError(e.message); }
    finally { setIsSaving(false); }
  };

  const resetAll = () => {
    setFile(null); setPreview([]); setStep("upload");
    setError(null); setSavedCount(0); setTopicId("");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-[#E8DCCF] bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#F0E8DF] bg-gradient-to-r from-[#FDFBF7] to-white flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#A67B5B]/10">
          <BookOpen className="h-5 w-5 text-[#A67B5B]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Nạp Từ Vựng TOEIC</h2>
          <p className="text-xs text-slate-500">Hỗ trợ: ảnh, PDF, CSV, Excel, JSON, TXT — AI tự phân loại chủ đề & mức độ</p>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-2">
          {["upload","preview","done"].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${step === s ? "bg-[#A67B5B] text-white" : (["upload","preview","done"].indexOf(step) > i ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}`}>
                {["upload","preview","done"].indexOf(step) > i ? "✓" : i+1}
              </div>
              {i < 2 && <div className="w-6 h-px bg-slate-200"/>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* ── STEP 1: UPLOAD ── */}
        {step === "upload" && (
          <>
            {/* Topic selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">Chủ đề đích</label>
              {!newTopicMode ? (
                <div className="flex gap-2">
                  <select value={topicId} onChange={e => setTopicId(e.target.value)}
                    className="flex-1 border border-[#E8DCCF] rounded-xl px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30 focus:border-[#A67B5B] transition">
                    <option value="">🤖 Tự động (AI phát hiện)</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.titleVI} — {t.wordCount} từ</option>)}
                  </select>
                  <button onClick={() => setNewTopicMode(true)} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#A67B5B] border border-[#E8DCCF] rounded-xl hover:bg-[#FDFBF7] transition">
                    <Plus size={14}/> Tạo mới
                  </button>
                </div>
              ) : (
                <div className="border border-[#E8DCCF] rounded-xl p-4 space-y-3 bg-[#FDFBF7]">
                  <div className="flex gap-2">
                    <input placeholder="Emoji 🏢" value={newTopic.emoji} onChange={e => setNewTopic(p=>({...p,emoji:e.target.value}))}
                      className="w-16 border border-[#E8DCCF] rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30"/>
                    <input placeholder="Tên tiếng Việt" value={newTopic.title_vi} onChange={e => setNewTopic(p=>({...p,title_vi:e.target.value}))}
                      className="flex-1 border border-[#E8DCCF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30"/>
                    <input placeholder="English name" value={newTopic.title_en} onChange={e => setNewTopic(p=>({...p,title_en:e.target.value}))}
                      className="flex-1 border border-[#E8DCCF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/30"/>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setNewTopicMode(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Hủy</button>
                    <button onClick={handleCreateTopic} className="px-4 py-1.5 text-xs font-semibold bg-[#A67B5B] text-white rounded-lg hover:bg-[#8B6344] transition">Tạo chủ đề</button>
                  </div>
                </div>
              )}
            </div>

            {/* Drag & Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragging ? "border-[#A67B5B] bg-[#FDFBF7]" : "border-[#E8DCCF] hover:border-[#A67B5B] hover:bg-[#FDFBF7]"}`}>
              <input ref={fileRef} type="file" className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.bmp,.pdf,.txt,.csv,.xlsx,.xls,.json,.md"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#A67B5B]/10 flex items-center justify-center">
                  {file ? <FileIcon name={file.name}/> : <Upload size={24} className="text-[#A67B5B]"/>}
                </div>
                {file ? (
                  <>
                    <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size/1024).toFixed(1)} KB — click để thay file</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700">Kéo thả file vào đây hoặc click để chọn</p>
                    <p className="text-xs text-slate-400">JPG · PNG · PDF · CSV · XLSX · JSON · TXT (tối đa 25MB)</p>
                  </>
                )}
              </div>
            </div>

            {/* Format hint */}
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">💡 Định dạng được hỗ trợ:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li><strong>Ảnh/PDF:</strong> Chụp trang từ vựng — OCR tự động trích xuất</li>
                <li><strong>CSV/Excel:</strong> Cột: Word, Meaning, POS, Example (EN), Example (VI)</li>
                <li><strong>TXT:</strong> Mỗi dòng: <code>word (pos): nghĩa — ví dụ</code></li>
                <li><strong>JSON:</strong> Array of {`{word, definitions:[{pos,meaning,example_en,example_vi}]}`}</li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0"/><span>{error}</span>
              </div>
            )}

            <button onClick={handlePreview} disabled={isProcessing || !file}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#A67B5B] hover:bg-[#8B6344] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
              {isProcessing ? <><RefreshCw className="h-4 w-4 animate-spin"/>Đang phân tích (AI)...</> : <><Eye className="h-4 w-4"/>Phân tích & Xem trước</>}
            </button>
          </>
        )}

        {/* ── STEP 2: PREVIEW ── */}
        {step === "preview" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Kết quả phân tích</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kiểm tra và chỉnh sửa trước khi lưu vào hệ thống</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-teal-100 text-teal-700 px-3 py-1 rounded-full">{preview.length} từ</span>
                <button onClick={resetAll} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"><X size={16}/></button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0"/><span>{error}</span>
              </div>
            )}

            {/* Preview table */}
            <div className="border border-[#E8DCCF] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-[#FDFBF7] border-b border-[#E8DCCF] sticky top-0">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Từ vựng</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Chủ đề</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Mức độ</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Nghĩa đầu tiên</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-600">Defs</th>
                      <th className="px-3 py-2.5"/>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E8DF]">
                    {preview.map((w, i) => (
                      <tr key={i} className="hover:bg-[#FDFBF7] transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{w.word}</span>
                            {w.definitions[0] && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${POS_COLORS[w.definitions[0].pos] ?? "bg-slate-100 text-slate-600"}`}>
                                {w.definitions[0].pos}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">{w.topic_vi || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LEVEL_COLORS[w.level] ?? "bg-slate-100 text-slate-600"}`}>
                            {w.level}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-[200px] truncate">
                          {w.definitions[0]?.meaning ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] inline-flex items-center justify-center">
                            {w.definitions.length}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => removeWord(i)} className="p-1 text-slate-300 hover:text-red-500 transition rounded">
                            <Trash2 size={13}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={resetAll} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#E8DCCF] px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                <FolderOpen size={15}/> Chọn file khác
              </button>
              <button onClick={handleConfirm} disabled={isSaving || !preview.length}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#A67B5B] hover:bg-[#8B6344] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm">
                {isSaving ? <><RefreshCw className="h-4 w-4 animate-spin"/>Đang lưu...</> : <><Save size={15}/>Xác nhận & Lưu {preview.length} từ</>}
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: DONE ── */}
        {step === "done" && (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-500"/>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Nạp từ vựng thành công!</h3>
              <p className="text-sm text-slate-500 mt-1">Đã lưu <strong className="text-emerald-600">{savedCount}</strong> từ vựng vào hệ thống</p>
            </div>
            {/* Updated topic list */}
            <div className="w-full mt-2 border border-[#E8DCCF] rounded-2xl overflow-hidden">
              <div className="bg-[#FDFBF7] px-4 py-2.5 text-xs font-semibold text-slate-600 border-b border-[#E8DCCF]">
                Danh sách chủ đề hiện tại
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-[#F0E8DF]">
                {topics.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FDFBF7]">
                    <span className="text-sm font-medium text-slate-700">{t.emoji} {t.titleVI}</span>
                    <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{t.wordCount} từ</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={resetAll} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#A67B5B] hover:bg-[#8B6344] text-sm font-semibold text-white transition shadow-sm">
              <Upload size={15}/> Nạp thêm từ vựng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
