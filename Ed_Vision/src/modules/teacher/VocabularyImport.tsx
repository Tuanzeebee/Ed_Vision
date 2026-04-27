import { useState } from "react";
import { Upload, AlertCircle, RefreshCw, BookOpen } from "lucide-react";

export function VocabularyImportBody() {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const fieldClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-colors";

  const handleImport = async () => {
    if (!file) {
      setError("Vui lòng chọn file từ vựng.");
      return;
    }
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề từ vựng.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false);
      setResult({ imported_count: 120, topic_id: `VOCAB-${topic.toUpperCase().replace(/\s+/g, '-')}` });
    }, 1500);
  };

  return (
    <div className="rounded-2xl border border-rose-200 bg-white shadow-md overflow-hidden">
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-rose-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100">
            <BookOpen className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Nạp Từ Vựng</h2>
            <p className="text-xs text-gray-500">
              Nạp danh sách từ vựng theo chủ đề, hệ thống sẽ tự động tìm phiên âm và ví dụ (nếu thiếu).
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-800 space-y-1">
          <p className="font-semibold">Định dạng CSV/Excel:</p>
          <p>
            Cột bắt buộc: Word, Meaning. Cột tùy chọn: Pronunciation, Example, Part_Of_Speech.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Chủ đề từ vựng (Topic)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="vd: Daily Life, Business, Marketing..."
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            File danh sách từ (CSV/XLSX)
          </label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200`}
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
            <p className="font-semibold">Nạp từ vựng thành công</p>
            <p className="mt-1 text-xs">
              Topic: <strong>{result.topic_id}</strong> | Đã nạp: <strong>{result.imported_count}</strong> từ.
            </p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={isSubmitting || !file || !topic.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Nạp Bộ Từ Vựng
            </>
          )}
        </button>
      </div>
    </div>
  );
}
