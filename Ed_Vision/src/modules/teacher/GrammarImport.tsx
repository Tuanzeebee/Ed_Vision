import { useState } from "react";
import { Upload, AlertCircle, RefreshCw, Layers } from "lucide-react";

export function GrammarImportBody() {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const fieldClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-colors";

  const handleImport = async () => {
    if (!file) {
      setError("Vui lòng chọn file ngữ pháp.");
      return;
    }
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ điểm ngữ pháp.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false);
      setResult({ imported_count: 1, structure_count: 5, topic_id: `GRAMMAR-${topic.toUpperCase().replace(/\s+/g, '-')}` });
    }, 1500);
  };

  return (
    <div className="rounded-2xl border border-cyan-200 bg-white shadow-md overflow-hidden">
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-cyan-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100">
            <Layers className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Nạp Ngữ Pháp</h2>
            <p className="text-xs text-gray-500">
              Nạp lý thuyết ngữ pháp, cấu trúc và ví dụ minh họa bằng file Markdown/PDF.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-xs text-cyan-800 space-y-1">
          <p className="font-semibold">Định dạng hỗ trợ: Markdown (.md), PDF</p>
          <p>
            Hệ thống sẽ tự động trích xuất các cấu trúc ngữ pháp (Formula) và ví dụ (Example) nếu sử dụng Markdown chuẩn.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Chủ điểm ngữ pháp
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="vd: Present Simple, Relative Clauses..."
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            File bài giảng (MD/PDF)
          </label>
          <input
            type="file"
            accept=".md,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-cyan-100 file:text-cyan-700 hover:file:bg-cyan-200`}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">Nạp chủ điểm ngữ pháp thành công</p>
            <p className="mt-1 text-xs">
              Mã chủ điểm: <strong>{result.topic_id}</strong> | Đã trích xuất <strong>{result.structure_count}</strong> cấu trúc.
            </p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={isSubmitting || !file || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Nạp Bài Giảng Ngữ Pháp
            </>
          )}
        </button>
      </div>
    </div>
  );
}
