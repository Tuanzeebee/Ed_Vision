import { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  AlertCircle, 
  RefreshCw, 
  FileUp, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Trash2,
  FolderOpen
} from "lucide-react";
import { 
  importDiagnosticTest, 
  importDiagnosticAudio, 
  importDiagnosticAnswerKey,
  listDiagnosticRepositories,
  deleteDiagnosticRepository,
  type DiagnosticRepositoryListItem
} from "../../services/api/certificateService";

export function DiagnosticImportBody({ certType }: { certType: "toeic" | "ielts" }) {
  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [skillArea, setSkillArea] = useState<string>(certType === "toeic" ? "reading" : "speaking");

  // Repository list states
  const [repoList, setRepoList] = useState<DiagnosticRepositoryListItem[]>([]);
  const [repoListLoading, setRepoListLoading] = useState(false);
  const [showRepoList, setShowRepoList] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<string | null>(null);

  const loadRepoList = async () => {
    setRepoListLoading(true);
    try {
      const data = await listDiagnosticRepositories();
      setRepoList(data);
    } catch (err) {
      console.error("Failed to load diagnostic repositories", err);
    } finally {
      setRepoListLoading(false);
    }
  };

  const executeDeleteRepo = async (slug: string) => {
    setDeletingSlug(slug);
    try {
      await deleteDiagnosticRepository(slug);
      await loadRepoList();
    } catch (err) {
      alert("Xóa đề khảo sát thất bại.");
    } finally {
      setDeletingSlug(null);
    }
  };

  useEffect(() => {
    loadRepoList();
  }, []);

  // Answer Key states
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [answerKeySlug, setAnswerKeySlug] = useState<string>("");
  const [isImportingAnswer, setIsImportingAnswer] = useState(false);
  const [answerKeyError, setAnswerKeyError] = useState<string | null>(null);
  const [answerKeyResult, setAnswerKeyResult] = useState<any>(null);
  const [showAnswerKeyGuideModal, setShowAnswerKeyGuideModal] = useState(false);
  const answerKeyFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSkillArea(certType === "toeic" ? "reading" : "speaking");
  }, [certType]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const fieldClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors";

  const handleImportAnswerKey = async () => {
    if (!answerKeyFile || !answerKeySlug.trim()) return;
    setIsImportingAnswer(true);
    setAnswerKeyError(null);
    setAnswerKeyResult(null);

    try {
      const response = await importDiagnosticAnswerKey({ repository_slug: answerKeySlug.trim() }, answerKeyFile);
      setAnswerKeyResult(response);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lỗi nạp đáp án.";
      setAnswerKeyError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsImportingAnswer(false);
    }
  };

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
      
      // Auto-fill the slug for the answer key import section
      if (response.diagnostic_set_id) {
        setAnswerKeySlug(response.diagnostic_set_id);
        loadRepoList();
      }
      
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lỗi nạp đề khảo sát.";
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Kho Đề Thi Khảo Sát Hiện Có ── */}
      <div className="rounded-2xl border border-emerald-200 bg-white shadow-md overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-emerald-50/10">
          <button
            type="button"
            onClick={() => setShowRepoList((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-emerald-950 hover:text-emerald-700 transition-colors"
          >
            <FolderOpen className="h-4 w-4 text-emerald-600 animate-pulse" />
            Kho Đề Thi Khảo Sát Hiện Có
            {repoList.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {repoList.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            {showRepoList && (
              <button
                type="button"
                onClick={loadRepoList}
                disabled={repoListLoading}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${repoListLoading ? "animate-spin" : ""}`}
                />
                Làm mới
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowRepoList((v) => !v)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1"
            >
              {showRepoList ? "Ẩn" : "Xem kho đề"}
            </button>
          </div>
        </div>

        {showRepoList && (
          <div className="p-4">
            {repoListLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Đang tải...
              </div>
            ) : repoList.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Chưa có đề thi khảo sát nào.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="pb-2 pr-4 text-left">Mã Đề (Slug)</th>
                      <th className="pb-2 pr-4 text-left">Tiêu đề</th>
                      <th className="pb-2 pr-4 text-right">Tổng câu hỏi</th>
                      <th className="pb-2 pr-4 text-left">Ngày nạp</th>
                      <th className="pb-2 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {repoList.map((repo) => (
                      <tr
                        key={repo.slug}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="py-2.5 pr-4 font-mono text-xs text-gray-600 max-w-[160px] truncate">
                          {repo.slug}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-800 max-w-[200px] truncate font-medium">
                          {repo.title}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-gray-600">
                          {repo.total_items}
                        </td>
                        <td className="py-2.5 pr-4 text-left text-gray-600 text-xs whitespace-nowrap">
                          {repo.created_at ? new Date(repo.created_at).toLocaleString("vi-VN") : "—"}
                        </td>
                        <td className="py-2.5 text-right flex items-center justify-end gap-2">
                          {!repo.has_answer_key ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAnswerKeySlug(repo.slug);
                                const answerKeyEl = document.getElementById("answer-key-section");
                                if (answerKeyEl) {
                                  answerKeyEl.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all animate-pulse shadow-sm active:scale-95"
                            >
                              (Chưa gán đáp án)
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                              Đã gán đáp án
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={deletingSlug === repo.slug}
                            onClick={() => setConfirmDeleteTarget(repo.slug)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                          >
                            {deletingSlug === repo.slug ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

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
                {typeof result.audioResult.image_mapped_count === 'number' && result.audioResult.image_mapped_count > 0 && (
                  <> | Hình ảnh (AI): <strong>{result.audioResult.image_mapped_count}</strong> câu</>
                )}
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

        {/* ── NẠP ĐÁP ÁN (ANSWER KEY) ── */}
        <div id="answer-key-section" className="mt-8 pt-6 border-t border-emerald-100 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Nạp Đáp Án Cho Đề Khảo Sát</h3>
            <p className="text-xs text-gray-500 mt-1">
              File đáp án phải là định dạng Excel hoặc CSV chứa cột số câu và đáp án tương ứng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Mã đề khảo sát (Slug)
              </label>
              <input
                type="text"
                value={answerKeySlug}
                onChange={(e) => setAnswerKeySlug(e.target.value)}
                placeholder="diag-1234..."
                className={fieldClass}
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              {/* Answer key file upload card */}
              <div 
                onClick={() => setShowAnswerKeyGuideModal(true)}
                className="group rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/20 p-6 text-center cursor-pointer transition-all duration-200 hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow-sm"
              >
                <input
                  type="file"
                  ref={answerKeyFileInputRef}
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setAnswerKeyFile(e.target.files?.[0] ?? null)}
                  onClick={(e) => e.stopPropagation()} // Prevent double-triggering
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2 text-emerald-800">
                  <div className="rounded-full bg-emerald-100 p-3 group-hover:scale-110 transition-transform duration-200">
                    <FileUp className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    Tải Lên Bảng Đáp Án Excel / CSV
                  </span>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Chỉ hỗ trợ file Excel <span className="font-semibold text-emerald-600">.xlsx, .xls</span> hoặc file <span className="font-semibold text-emerald-600">.csv</span> định dạng cột Question - Answer. Click để xem hướng dẫn chi tiết và chọn file.
                  </p>
                </div>
                
                {answerKeyFile && (
                  <div 
                    onClick={(e) => e.stopPropagation()} // Prevent triggering guide popup when clicking clear/details
                    className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm animate-fadeIn"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-[250px] font-bold">{answerKeyFile.name}</span>
                      <span className="text-xs text-gray-400">({(answerKeyFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnswerKeyFile(null)}
                      className="text-gray-400 hover:text-red-500 rounded-lg p-1 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {answerKeyError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{answerKeyError}</span>
            </div>
          )}

          {answerKeyResult && (
            <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-900 shadow-sm animate-fadeIn">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 animate-pulse animate-fadeIn" />
              <div className="space-y-1.5 flex-1 text-left">
                <p className="font-bold text-emerald-950">Nạp đáp án thành công!</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-emerald-800">
                  <p>• Mã đề khảo sát: <strong className="text-emerald-900">{answerKeyResult.slug}</strong></p>
                  <p>• Cập nhật thành công: <strong className="text-emerald-900">{answerKeyResult.updated_count} câu</strong></p>
                  {typeof answerKeyResult.total_answer_keys === "number" && (
                    <>
                      <p>• Tổng đáp án phát hiện: <strong className="text-emerald-900">{answerKeyResult.total_answer_keys} câu</strong></p>
                      <p>• Tổng câu trong đề: <strong className="text-emerald-900">{answerKeyResult.total_db_items} câu</strong></p>
                    </>
                  )}
                </div>

                {Array.isArray(answerKeyResult.unmatched_question_numbers) &&
                  answerKeyResult.unmatched_question_numbers.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 space-y-0.5 mt-2 animate-fadeIn">
                      <p className="font-bold text-amber-900 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        Đáp án có trong file Excel nhưng đề thi thiếu câu tương ứng:
                      </p>
                      <p className="font-semibold leading-relaxed">
                        Số thứ tự câu bị bỏ qua:{" "}
                        <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">
                          {answerKeyResult.unmatched_question_numbers.join(", ")}
                        </span>
                      </p>
                    </div>
                  )}

                {Array.isArray(answerKeyResult.missing_option_question_numbers) &&
                  answerKeyResult.missing_option_question_numbers.length > 0 && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 space-y-0.5 mt-2 animate-fadeIn">
                      <p className="font-bold text-red-900 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                        Câu có đáp án nhưng các phương án lựa chọn trong đề không khớp (thiếu option):
                      </p>
                      <p className="font-semibold leading-relaxed">
                        Số thứ tự câu:{" "}
                        <span className="bg-red-100 px-1.5 py-0.5 rounded text-red-900 font-mono">
                          {answerKeyResult.missing_option_question_numbers.join(", ")}
                        </span>
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          <button
            onClick={handleImportAnswerKey}
            disabled={isImportingAnswer || !answerKeyFile || !answerKeySlug.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-emerald-600 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {showAnswerKeyGuideModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                Hướng Dẫn File Đáp Án Đề Khảo Sát
              </h3>
              <button 
                onClick={() => setShowAnswerKeyGuideModal(false)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 bg-slate-50/50">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold text-amber-900">⚠️ Thay đổi phương thức nạp đáp án</p>
                <p>Để đảm bảo tính chính xác 100% cho hệ thống thi và chấm điểm, chức năng nạp đáp án hiện tại <strong>chỉ chấp nhận các file bảng tính Excel hoặc CSV</strong>. Hệ thống <strong>không chấp nhận</strong> các định dạng không cấu trúc như hình ảnh, PDF hay TXT để tránh sai sót nhận diện.</p>
              </div>

              <p className="font-bold text-slate-800 text-sm">Cấu trúc bảng dữ liệu Excel/CSV bắt buộc:</p>
              
              <ul className="list-disc ml-6 space-y-2 text-xs">
                <li><span className="font-semibold text-slate-800">Cột A (Question):</span> Chứa số thứ tự câu hỏi (ví dụ: <code className="bg-slate-100 px-1 rounded font-mono">1</code>, <code className="bg-slate-100 px-1 rounded font-mono">2</code> hoặc số câu gốc <code className="bg-slate-100 px-1 rounded font-mono">101</code>, <code className="bg-slate-100 px-1 rounded font-mono">154</code>).</li>
                <li><span className="font-semibold text-slate-800">Cột B (Answer):</span> Ký tự đáp án đúng (ví dụ: <code className="bg-slate-100 px-1 rounded font-mono">A</code>, <code className="bg-slate-100 px-1 rounded font-mono">B</code>, <code className="bg-slate-100 px-1 rounded font-mono">C</code>, <code className="bg-slate-100 px-1 rounded font-mono">D</code>).</li>
                <li>Dòng đầu tiên của Excel nên là dòng tiêu đề (ví dụ: <code className="bg-slate-100 px-1 rounded font-mono">Question</code> và <code className="bg-slate-100 px-1 rounded font-mono">Answer</code>).</li>
                <li>Đáp án không nhạy cảm chữ hoa/thường (A hay a đều được).</li>
              </ul>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
                <p className="font-bold text-xs text-slate-700">Mẫu xem trước cấu trúc Excel chuẩn:</p>
                <div className="overflow-hidden border border-slate-150 rounded-lg text-xs">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        <th className="py-2 border-r border-slate-200 w-1/12 bg-slate-100"></th>
                        <th className="py-2 border-r border-slate-200 w-5/12">Cột A (Question)</th>
                        <th className="py-2 w-5/12">Cột B (Answer)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-150">
                        <td className="py-1.5 bg-slate-50 border-r border-slate-200 text-slate-400 font-mono text-[10px]">1</td>
                        <td className="py-1.5 border-r border-slate-200 font-semibold text-slate-800">Question</td>
                        <td className="py-1.5 font-semibold text-slate-800">Answer</td>
                      </tr>
                      <tr className="border-b border-slate-150 bg-slate-50/20">
                        <td className="py-1.5 bg-slate-50 border-r border-slate-200 text-slate-400 font-mono text-[10px]">2</td>
                        <td className="py-1.5 border-r border-slate-200 font-medium text-slate-600">1</td>
                        <td className="py-1.5 font-bold text-emerald-600">A</td>
                      </tr>
                      <tr className="border-b border-slate-150">
                        <td className="py-1.5 bg-slate-50 border-r border-slate-200 text-slate-400 font-mono text-[10px]">3</td>
                        <td className="py-1.5 border-r border-slate-200 font-medium text-slate-600">2</td>
                        <td className="py-1.5 font-bold text-emerald-600">C</td>
                      </tr>
                      <tr className="bg-slate-50/20">
                        <td className="py-1.5 bg-slate-50 border-r border-slate-200 text-slate-400 font-mono text-[10px]">4</td>
                        <td className="py-1.5 border-r border-slate-200 font-medium text-slate-600">3</td>
                        <td className="py-1.5 font-bold text-emerald-600">B</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setShowAnswerKeyGuideModal(false)} 
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  setShowAnswerKeyGuideModal(false);
                  setTimeout(() => {
                    answerKeyFileInputRef.current?.click();
                  }, 100);
                }} 
                className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" /> Đã Hiểu, Chọn File Ngay
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/35 backdrop-blur-[1px] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-250">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 animate-bounce">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-bold text-gray-900">
                  Xác Nhận Xóa Đề Khảo Sát
                </h3>
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn xóa đề khảo sát <span className="font-semibold text-gray-800">"{confirmDeleteTarget}"</span>? Hành động này sẽ xóa toàn bộ câu hỏi và đáp án liên quan và không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-all shadow-sm active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = confirmDeleteTarget;
                  setConfirmDeleteTarget(null);
                  void executeDeleteRepo(target);
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all active:scale-95"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
