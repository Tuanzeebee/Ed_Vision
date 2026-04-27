import { useState, useEffect } from "react";
import { Upload, AlertCircle, RefreshCw, FileUp } from "lucide-react";
import { importDiagnosticTest, importDiagnosticAudio } from "../../services/api/certificateService";

export function DiagnosticImportBody({ certType }: { certType: "toeic" | "ielts" }) {
  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [skillArea, setSkillArea] = useState<string>(certType === "toeic" ? "reading" : "speaking");

  useEffect(() => {
    setSkillArea(certType === "toeic" ? "reading" : "speaking");
  }, [certType]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const fieldClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors";

  const handleImport = async () => {
    if (!file) {
      setError("Vui lòng chọn file đề khảo sát.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await importDiagnosticTest({ cert_type: certType, skill_area: skillArea }, file);
      
      let audioResult = null;
      if (skillArea === "listening" && audioFile) {
        audioResult = await importDiagnosticAudio(response.diagnostic_set_id, audioFile);
      }
      
      setResult({ ...response, audioResult });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lỗi nạp đề khảo sát.";
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white shadow-md overflow-hidden">
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center gap-3 pb-1 border-b border-emerald-100">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <FileUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Nạp Đề Khảo Sát (Diagnostic Test)</h2>
            <p className="text-xs text-gray-500">
              Nạp bộ câu hỏi khảo sát năng lực đầu vào dạng rút gọn.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 space-y-1">
          <p className="font-semibold">Định dạng chấp nhận:</p>
          <p>
            File định dạng TXT/PDF. Parser sẽ tự động phân loại mức độ dễ, trung bình, khó dựa trên thuật toán heuristic và chỉ lọc lấy câu hỏi thuộc kỹ năng bạn chọn.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Kỹ năng (Skill Area)
            </label>
            <select
              value={skillArea}
              onChange={(e) => setSkillArea(e.target.value)}
              className={`${fieldClass} appearance-none cursor-pointer`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                paddingRight: "36px",
              }}
            >
              {certType === "toeic" ? (
                <>
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                </>
              ) : (
                <>
                  <option value="speaking">Speaking</option>
                  <option value="writing">Writing</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              File đề khảo sát (TXT/PDF)
            </label>
            <input
              type="file"
              accept=".txt,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200`}
            />
          </div>

          {skillArea === "listening" && (
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                File Audio (MP3/WAV)
              </label>
              <input
                type="file"
                accept="audio/*,.mp3,.wav"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200`}
              />
              <p className="mt-1 text-[10px] text-gray-500">
                Nếu tải lên file mp3 đơn lẻ chứa toàn bộ bài, hệ thống sẽ tự động dùng AI cắt và ghép vào từng câu hỏi.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">Nạp đề khảo sát thành công</p>
            <p className="mt-1 text-xs">
              Mã đề: <strong>{result.diagnostic_set_id}</strong> | Đã nạp: <strong>{result.imported_count}</strong> câu.
            </p>
            {result.audioResult && (
              <p className="mt-1 text-xs text-emerald-600">
                Audio đã xử lý: <strong>{result.audioResult.total_chunks}</strong> chunks, auto-mapped <strong>{result.audioResult.auto_mapped_count}</strong>.
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={isSubmitting || !file}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" /> Đang xử lý...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Nạp Đề Khảo Sát
            </>
          )}
        </button>
      </div>
    </div>
  );
}
