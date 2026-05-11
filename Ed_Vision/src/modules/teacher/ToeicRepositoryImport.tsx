import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Image,
  FolderOpen,
  Trash2,
  RefreshCw,
  FileUp,
} from "lucide-react";
import TeacherLayout from "./components/TeacherLayout";
import { buildAssetUrl } from "@/services/api/config";
import {
  importIeltsExamFromOcrFile,
  importToeicExamFromOcrFile,
  importToeicAnswerKeyFromFile,
  importToeicListeningFromPdfFile,
  listIeltsRepositories,
  deleteIeltsRepository,
  type IeltsOcrImportResponse,
  type IeltsRepositoryListItem,
  type ToeicOcrImportResponse,
  type ToeicAnswerKeyImportResponse,
  type ToeicListeningImportResponse,
  uploadFullListeningAudio,
  type FullAudioUploadResponse,
  listToeicRepositories,
  deleteToeicRepository,
  type ToeicRepositoryListItem,
} from "@/services/api/certificateService";

type RepositoryListItem = ToeicRepositoryListItem | IeltsRepositoryListItem;

const PART_COLORS: Record<
  number,
  {
    border: string;
    bg: string;
    text: string;
    badge: string;
    file: string;
    hover: string;
  }
> = {
  1: {
    border: "border-blue-300",
    bg: "bg-blue-50/30",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    file: "file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200",
    hover: "hover:border-blue-400 hover:bg-blue-50/60",
  },
  2: {
    border: "border-purple-300",
    bg: "bg-purple-50/30",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700",
    file: "file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200",
    hover: "hover:border-purple-400 hover:bg-purple-50/60",
  },
  3: {
    border: "border-teal-300",
    bg: "bg-teal-50/30",
    text: "text-teal-700",
    badge: "bg-teal-100 text-teal-700",
    file: "file:bg-teal-100 file:text-teal-700 hover:file:bg-teal-200",
    hover: "hover:border-teal-400 hover:bg-teal-50/60",
  },
  4: {
    border: "border-orange-300",
    bg: "bg-orange-50/30",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700",
    file: "file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200",
    hover: "hover:border-orange-400 hover:bg-orange-50/60",
  },
};

export default function ToeicRepositoryImport() {
  return (
    <TeacherLayout currentPage="toeic-repository-import">
      <ToeicRepositoryImportBody />
    </TeacherLayout>
  );
}

export function ToeicRepositoryImportBody({
  certType: externalCertType,
}: {
  certType?: "toeic" | "ielts";
} = {}) {
  const [examType, setExamType] = useState<"toeic" | "ielts">(
    externalCertType ?? "toeic",
  );
  const [file, setFile] = useState<File | null>(null);
  const [skillArea, setSkillArea] = useState<"reading" | "listening" | "speaking" | "writing">(
    externalCertType === "ielts" ? "speaking" : "reading",
  );
  const [repositorySlug, setRepositorySlug] = useState("");
  const [repositoryTitle, setRepositoryTitle] = useState("");
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [examYear, setExamYear] = useState<number | "">(
    new Date().getFullYear(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToeicOcrImportResponse | null>(null);
  const [ieltsResult, setIeltsResult] = useState<IeltsOcrImportResponse | null>(
    null,
  );

  // Listening-specific state
  const [listeningResult, setListeningResult] =
    useState<ToeicListeningImportResponse | null>(null);

  // Inline audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [fullAudioResult, setFullAudioResult] =
    useState<FullAudioUploadResponse | null>(null);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);

  // Answer key state
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [answerKeyRepositorySlug, setAnswerKeyRepositorySlug] = useState("");
  const [answerKeyClearExisting, setAnswerKeyClearExisting] = useState(true);
  const [isAnswerKeySubmitting, setIsAnswerKeySubmitting] = useState(false);
  const [answerKeyError, setAnswerKeyError] = useState<string | null>(null);
  const [answerKeyResult, setAnswerKeyResult] =
    useState<ToeicAnswerKeyImportResponse | null>(null);

  // Repository management state
  const [showRepoList, setShowRepoList] = useState(false);
  const [repoList, setRepoList] = useState<RepositoryListItem[]>([]);
  const [repoListLoading, setRepoListLoading] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fieldClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors";

  const loadRepoList = async () => {
    setRepoListLoading(true);
    try {
      const data =
        examType === "toeic"
          ? await listToeicRepositories()
          : await listIeltsRepositories();
      setRepoList(data);
    } catch {
      // silently ignore – list is optional
    } finally {
      setRepoListLoading(false);
    }
  };

  useEffect(() => {
    if (showRepoList) {
      void loadRepoList();
    }
  }, [showRepoList, examType]);

  // Sync certType from external prop (ExamPracticeImport wrapper)
  useEffect(() => {
    if (externalCertType && externalCertType !== examType) {
      setExamType(externalCertType);
      // Reset skill area based on cert type
      setSkillArea(externalCertType === "toeic" ? "reading" : "speaking");
      setError(null);
      setResult(null);
      setIeltsResult(null);
      setListeningResult(null);
      setAnswerKeyResult(null);
      setFile(null);
    }
  }, [externalCertType]);

  const handleSubmit = async () => {
    if (!file) {
      setError("Vui lòng chọn file đề thi trước khi upload.");
      return;
    }
    const loweredFileName = file.name.toLowerCase();
    if (examType === "toeic") {
      if (skillArea === "listening") {
        if (!loweredFileName.endsWith(".pdf")) {
          setError("TOEIC Listening chỉ hỗ trợ file PDF. Vui lòng chọn file .pdf.");
          return;
        }
      } else {
        const allowedExts = [".pdf", ".txt"];
        if (!allowedExts.some(ext => loweredFileName.endsWith(ext))) {
          setError("TOEIC Reading hỗ trợ file PDF hoặc TXT. Vui lòng chọn đúng định dạng.");
          return;
        }
      }
    } else {
      const allowedIeltsFile = [".pdf", ".txt", ".xlsx", ".xls"].some((ext) =>
        loweredFileName.endsWith(ext),
      );
      if (!allowedIeltsFile) {
        setError(
          "IELTS hỗ trợ PDF, TXT, XLSX hoặc XLS. Vui lòng chọn đúng định dạng.",
        );
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);
    setIeltsResult(null);
    setListeningResult(null);
    setFullAudioResult(null);
    setAudioUploadError(null);

    try {
      if (examType === "ielts") {
        const fallbackSlug =
          repositorySlug.trim() || `ielts-${skillArea}-${Date.now()}`;
        const yearTag =
          typeof examYear === "number"
            ? String(examYear)
            : String(new Date().getFullYear());
        const fallbackTitle =
          repositoryTitle.trim() ||
          `IELTS ${skillArea === "listening" ? "Listening" : "Reading"} ${yearTag}`;

        const response = await importIeltsExamFromOcrFile(
          {
            repository_slug: fallbackSlug,
            repository_title: fallbackTitle,
            skill_area: skillArea,
            replace_existing: replaceExisting,
            exam_year:
              typeof examYear === "number" ? String(examYear) : undefined,
          },
          file,
        );

        setIeltsResult(response);
        if (showRepoList) void loadRepoList();
        return;
      }

      if (skillArea === "listening") {
        const response = await importToeicListeningFromPdfFile(
          {
            repository_slug: repositorySlug || undefined,
            repository_title: repositoryTitle || undefined,
            replace_existing: replaceExisting,
            exam_year: examYear || undefined,
          },
          file,
        );
        setListeningResult(response);
        setAnswerKeyRepositorySlug(response.slug);
        if (showRepoList) void loadRepoList();

        // Upload full audio (no chunking) if provided
        if (audioFile) {
          setIsAudioUploading(true);
          try {
            const audioRes = await uploadFullListeningAudio(
              response.slug,
              audioFile,
            );
            setFullAudioResult(audioRes);
          } catch (audioErr: any) {
            setAudioUploadError(
              audioErr?.response?.data?.message ??
              audioErr?.message ??
              "Upload audio thất bại. Bạn có thể thử lại sau.",
            );
          } finally {
            setIsAudioUploading(false);
          }
        }
      } else {
        const response = await importToeicExamFromOcrFile(
          {
            repository_slug: repositorySlug || undefined,
            repository_title: repositoryTitle || undefined,
            skill_area: skillArea as "reading" | "listening",
            replace_existing: replaceExisting,
            exam_year: examYear || undefined,
          },
          file,
        );
        setResult(response);
        setAnswerKeyRepositorySlug(response.slug);
        if (showRepoList) void loadRepoList();
      }
    } catch (err: unknown) {
      const typedErr = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const message =
        typedErr?.response?.data?.message ||
        typedErr?.message ||
        "Không thể nạp đề từ file. Vui lòng kiểm tra định dạng file.";
      setError(Array.isArray(message) ? message.join(" ") : String(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswerKey = async () => {
    if (!answerKeyRepositorySlug.trim()) {
      setAnswerKeyError("Vui lòng chọn kho đề cần gán đáp án.");
      return;
    }

    if (!answerKeyFile) {
      setAnswerKeyError("Vui lòng chọn file đáp án trước khi upload.");
      return;
    }

    setIsAnswerKeySubmitting(true);
    setAnswerKeyError(null);
    setAnswerKeyResult(null);

    try {
      const response = await importToeicAnswerKeyFromFile(
        {
          repository_slug: answerKeyRepositorySlug.trim(),
          clear_existing: answerKeyClearExisting,
        },
        answerKeyFile,
      );
      setAnswerKeyResult(response);
    } catch (err: unknown) {
      const typedErr = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const message =
        typedErr?.response?.data?.message ||
        typedErr?.message ||
        "Không thể import file đáp án.";
      setAnswerKeyError(
        Array.isArray(message) ? message.join(" ") : String(message),
      );
    } finally {
      setIsAnswerKeySubmitting(false);
    }
  };

  const activeSlug =
    listeningResult?.slug ?? result?.slug ?? ieltsResult?.slug ?? "";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* ── Quick guide ── */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-6 py-5">
        <h2 className="mb-3 text-sm font-bold text-blue-800">
          Hướng dẫn nhập nhanh
        </h2>
        <ul className="space-y-1.5">
          {(examType === "toeic"
            ? [
              "Kỹ năng: chọn Reading cho Part 5-7, Listening cho Part 1-4.",
              "Mã kho đề: mã duy nhất, ví dụ toeic-reading-mock-01. Để trống sẽ tự tạo.",
              "Tiêu đề kho đề: tên hiển thị cho học viên. Để trống sẽ tự đặt tên mặc định.",
              "Năm đề thi: nhập năm để hệ thống tự động sắp xếp đề theo thứ tự từ cũ đến mới cho học viên.",
              "File: TOEIC chỉ hỗ trợ PDF. Listening có thể trích xuất ảnh và câu hỏi tự động.",
              "Nếu file đề chưa có đáp án chuẩn, có thể bổ sung đáp án ở phần bên dưới.",
            ]
            : [
              "Loại đề: chọn IELTS để nạp đúng vào kho đề IELTS.",
              "Kỹ năng: chọn Reading hoặc Listening theo bộ đề.",
              "Mã & tiêu đề kho đề: nếu để trống hệ thống sẽ tự sinh mặc định.",
              "Năm đề thi: có thể nhập để quản trị và sắp xếp dễ hơn.",
              "File: IELTS hỗ trợ PDF, TXT, XLSX, XLS.",
              "Sau khi nạp xong, dữ liệu sẽ được lưu vào kho đề IELTS của hệ thống.",
            ]
          ).map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-blue-700 leading-relaxed"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-200 text-blue-700 font-bold text-[10px]">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Repository list panel ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setShowRepoList((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-gray-800 hover:text-indigo-600 transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            Kho Đề {examType.toUpperCase()} Hiện Có
            {repoList.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
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
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
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
                Chưa có repository {examType.toUpperCase()} nào.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="pb-2 pr-4">Skill</th>
                      <th className="pb-2 pr-4">Slug</th>
                      <th className="pb-2 pr-4">Tiêu đề</th>
                      <th className="pb-2 pr-4 text-right">Câu hỏi</th>
                      <th className="pb-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {repoList.map((repo) => (
                      <tr
                        key={repo.slug}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="py-2.5 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${repo.skill_area === "listening"
                                ? "bg-teal-100 text-teal-700"
                                : "bg-blue-100 text-blue-700"
                              }`}
                          >
                            {repo.skill_area}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-gray-600 max-w-[160px] truncate">
                          {repo.slug}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-800 max-w-[200px] truncate">
                          {repo.title}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-gray-600">
                          {repo.total_items}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            disabled={deletingSlug === repo.slug}
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Xóa repository ${examType.toUpperCase()} "${repo.slug}"?\nHành động này không thể hoàn tác. Tất cả ${repo.total_items} câu hỏi sẽ bị xóa.`,
                                )
                              )
                                return;
                              setDeletingSlug(repo.slug);
                              try {
                                if (examType === "toeic") {
                                  await deleteToeicRepository(repo.slug);
                                } else {
                                  await deleteIeltsRepository(repo.slug);
                                }
                                await loadRepoList();
                              } finally {
                                setDeletingSlug(null);
                              }
                            }}
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

      {/* ── Main import form ── */}
      <div className="rounded-2xl border border-indigo-200 bg-white shadow-md overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 pb-1 border-b border-indigo-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
              <FileUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Nạp Đề Thi {examType.toUpperCase()}</h2>
              <p className="text-xs text-gray-500">
                Nạp nguyên bộ đề thi hoàn chỉnh. Parser sẽ tự động bóc tách câu hỏi và hình ảnh theo chuẩn {examType.toUpperCase()}.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Skill area */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Skill Area
              </label>
              <select
                className={fieldClass}
                value={skillArea}
                onChange={(e) => {
                  setSkillArea(e.target.value as "reading" | "listening" | "speaking" | "writing");
                  setResult(null);
                  setIeltsResult(null);
                  setListeningResult(null);
                  setError(null);
                }}
              >
                {examType === "toeic" ? (
                  <>
                    <option value="reading">Reading (Part 5-7)</option>
                    <option value="listening">Listening (Part 1-4)</option>
                  </>
                ) : (
                  <>
                    <option value="speaking">Speaking</option>
                    <option value="writing">Writing</option>
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                {examType === "toeic"
                  ? "Dùng Reading cho đề đọc và Listening cho đề nghe TOEIC."
                  : "Chọn kỹ năng IELTS tương ứng với file bạn đang nạp."}
              </p>
            </div>

            {/* Mã kho đề */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Mã kho đề{" "}
                <span className="font-normal text-gray-400">
                  (không bắt buộc)
                </span>
              </label>
              <input
                className={fieldClass}
                placeholder={`${examType}-${skillArea}-mock-01`}
                value={repositorySlug}
                onChange={(e) => setRepositorySlug(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">
                Chỉ gồm chữ thường, số và dấu gạch ngang. Để trống sẽ tự sinh.
              </p>
            </div>

            {/* Tiêu đề kho đề */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Tiêu đề kho đề{" "}
                <span className="font-normal text-gray-400">
                  (không bắt buộc)
                </span>
              </label>
              <input
                className={fieldClass}
                placeholder={`${examType.toUpperCase()} ${skillArea.charAt(0).toUpperCase() + skillArea.slice(1)
                  } Mock Test 01`}
                value={repositoryTitle}
                onChange={(e) => setRepositoryTitle(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">
                Tên hiển thị trên trang thi của học viên.
              </p>
            </div>

            {/* Exam year */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Năm đề thi{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min={2000}
                max={2100}
                className={fieldClass}
                placeholder={String(new Date().getFullYear())}
                value={examYear}
                onChange={(e) =>
                  setExamYear(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
              <p className="mt-1 text-xs text-gray-400">
                Ví dụ: 2024, 2025. Dùng để sắp xếp đề thi theo năm.
              </p>
            </div>

            {/* Replace existing checkbox */}
            <div className="flex items-center gap-3 pt-7">
              <input
                id="replace-existing"
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="replace-existing"
                className="text-sm text-gray-700 leading-snug"
              >
                Xóa toàn bộ câu cũ trong repository {examType.toUpperCase()}{" "}
                trước khi nạp mới
              </label>
            </div>
          </div>

          {/* File upload section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
            {/* PDF file */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                File đề thi {examType === "toeic" ? (skillArea === "listening" ? "(PDF)" : "(PDF/TXT)") : "(PDF/TXT/XLSX)"}
              </label>
              <input
                type="file"
                accept={examType === "toeic" ? (skillArea === "listening" ? ".pdf" : ".pdf,.txt") : ".pdf,.txt,.xlsx,.xls"}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200`}
              />
              <p className="mt-1 text-[10px] text-gray-500">
                {examType === "toeic"
                  ? skillArea === "listening"
                    ? "Hệ thống sẽ tự động tách câu hỏi và trích xuất ảnh (Part 1)."
                    : "Hỗ trợ PDF/TXT. Parser sẽ tự động phân tích câu hỏi theo chuẩn TOEIC Reading."
                  : "Hỗ trợ: PDF, TXT, XLSX, XLS cho luồng import IELTS."}
              </p>
            </div>

            {/* Audio file (Listening only) */}
            {examType === "toeic" && skillArea === "listening" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  File Audio (MP3/WAV)
                </label>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  className={`${fieldClass} cursor-pointer file:mr-3 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200`}
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Upload file audio xuyên suốt bài thi (không tách). Audio sẽ chạy liên tục khi thí sinh làm bài như thi thật.
                </p>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div>
            <button
              onClick={handleSubmit}
              disabled={!file || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {isSubmitting
                ? "Đang xử lý..."
                : `Nạp Đề ${examType.toUpperCase()}`}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {ieltsResult && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="space-y-0.5">
                <p className="font-semibold text-green-800">
                  Nạp đề IELTS thành công
                </p>
                <p>
                  Slug:{" "}
                  <span className="font-medium">{ieltsResult.slug}</span>
                </p>
                <p>
                  Skill:{" "}
                  <span className="font-medium">
                    {ieltsResult.skill_area}
                  </span>
                </p>
                <p>
                  Parsed:{" "}
                  <span className="font-medium">
                    {ieltsResult.total_detected} câu
                  </span>
                </p>
                <p>
                  Imported:{" "}
                  <span className="font-medium">
                    {ieltsResult.imported_count} câu
                  </span>
                </p>
                <p>
                  Skipped:{" "}
                  <span className="font-medium">
                    {ieltsResult.skipped_count} câu
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Reading success */}
          {result && skillArea === "reading" && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="space-y-0.5">
                <p className="font-semibold text-green-800">
                  Nạp đề thành công
                </p>
                <p>
                  Slug: <span className="font-medium">{result.slug}</span>
                </p>
                <p>
                  Skill:{" "}
                  <span className="font-medium">{result.skill_area}</span>
                </p>
                <p>
                  Parsed:{" "}
                  <span className="font-medium">
                    {result.total_detected} câu
                  </span>
                </p>
                <p>
                  Imported:{" "}
                  <span className="font-medium">
                    {result.imported_count} câu
                  </span>
                </p>
                <p>
                  Skipped:{" "}
                  <span className="font-medium">
                    {result.skipped_count} câu
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Full audio upload result */}
          {isAudioUploading && (
            <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
              <span>Đang upload audio...</span>
            </div>
          )}
          {audioUploadError && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Audio: {audioUploadError}</span>
            </div>
          )}
          {fullAudioResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <p className="font-semibold">Upload audio thành công</p>
              <p className="mt-1 text-xs">
                Audio xuyên suốt đã được lưu cho bộ đề <span className="font-medium">{fullAudioResult.slug}</span>
              </p>
            </div>
          )}

          {/* Listening success stats */}
          {listeningResult && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-green-800">
                    Nạp đề Listening thành công
                  </p>
                  <p>
                    Slug:{" "}
                    <span className="font-medium">
                      {listeningResult.slug}
                    </span>
                  </p>
                  <p>
                    Skill:{" "}
                    <span className="font-medium">
                      {listeningResult.skill_area}
                    </span>
                  </p>
                  <p>
                    Parsed:{" "}
                    <span className="font-medium">
                      {listeningResult.total_detected} câu
                    </span>
                  </p>
                  <p>
                    Imported:{" "}
                    <span className="font-medium">
                      {listeningResult.imported_count} câu
                    </span>
                  </p>
                  <p>
                    Skipped:{" "}
                    <span className="font-medium">
                      {listeningResult.skipped_count} câu
                    </span>
                  </p>
                  <p>
                    File:{" "}
                    <span className="font-medium">
                      {listeningResult.source_filename}
                    </span>
                  </p>
                </div>
              </div>

              {/* Image extract error warning */}
              {listeningResult.image_extract_error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-semibold">
                      Không thể trích xuất ảnh từ PDF
                    </p>
                    <p className="text-xs leading-relaxed">
                      {listeningResult.image_extract_error}
                    </p>
                    <p className="text-xs leading-relaxed text-amber-600">
                      Để trích xuất ảnh tự động, hãy cài thêm thư viện:{" "}
                      <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-amber-800">
                        pip install pymupdf Pillow
                      </code>{" "}
                      trên server backend rồi thử lại.
                    </p>
                  </div>
                </div>
              )}

              {/* Extracted images grid */}
              {listeningResult.image_assets &&
                listeningResult.image_assets.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-6 py-4">
                      <h3 className="flex items-center gap-2 border-l-4 border-sky-500 pl-3 text-base font-bold text-gray-800">
                        <Image className="h-4 w-4 text-sky-500" />
                        Ảnh đã trích xuất
                        <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          {listeningResult.image_assets.length} ảnh
                        </span>
                      </h3>
                      <p className="mt-1 pl-3.5 text-xs text-gray-500">
                        Các ảnh được trích xuất từ PDF và sẽ được dùng làm
                        hình minh hoạ cho câu hỏi Listening Part 1 / Part 2.
                      </p>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {listeningResult.image_assets.map((img, idx) => (
                          <div
                            key={idx}
                            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <img
                              src={buildAssetUrl(img.url)}
                              alt={img.filename}
                              className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%239ca3af' font-size='12'%3ENo img%3C/text%3E%3C/svg%3E";
                              }}
                            />
                            <div className="px-2 py-1.5">
                              <p
                                className="truncate text-[10px] font-medium text-gray-600"
                                title={img.filename}
                              >
                                {img.filename}
                              </p>
                              <div className="mt-0.5 flex items-center justify-between gap-1">
                                <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">
                                  P{img.part_hint}
                                </span>
                                <span className="text-[9px] text-gray-400">
                                  pg.{img.page}
                                </span>
                                <span className="text-[9px] text-gray-400">
                                  {img.width}×{img.height}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* ── TOEIC answer key section ── */}
      {examType === "toeic" && false && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-md">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="flex items-center gap-2 border-l-4 border-green-500 pl-3 text-base font-bold text-gray-800">
              <Music className="h-5 w-5 text-green-600" />
              Upload Audio Listening
            </h2>
            <p className="mt-1 pl-3.5 text-xs text-gray-500">
              Upload từng file audio theo part và track để hệ thống tự gán vào
              câu hỏi tương ứng.
            </p>
          </div>

          <div className="space-y-5 p-6">
            {/* Audio naming guide */}
            <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-green-800">
                <Volume2 className="h-4 w-4" />
                Hướng dẫn đặt tên audio
              </h3>
              <ul className="space-y-1">
                {[
                  `File audio nên đặt tên theo format: ${listeningResult.slug}_part{N}_{track}.mp3`,
                  "Part 1: 6 files (1 câu/file) — track 1–6",
                  "Part 2: 25 files (1 câu/file) — track 1–25",
                  "Part 3: 13 tracks × 3 câu — track 1–13",
                  "Part 4: 10 tracks × 3 câu — track 1–10",
                ].map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-green-700 leading-relaxed"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                    {i === 0 ? (
                      <span>
                        File audio nên đặt tên theo format:{" "}
                        <code className="rounded bg-green-100 px-1 font-mono text-green-800">
                          {listeningResult.slug}_part{"{N}"}_{"{track}"}.mp3
                        </code>
                      </span>
                    ) : (
                      line
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Upload form */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Part selector */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Part
                </label>
                <select
                  className={fieldClass}
                  value={audioPart}
                  onChange={(e) => setAudioPart(Number(e.target.value))}
                >
                  <option value={1}>Part 1 — Photos</option>
                  <option value={2}>Part 2 — Q&amp;A</option>
                  <option value={3}>Part 3 — Conversations</option>
                  <option value={4}>Part 4 — Talks</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${PART_COLORS[audioPart].badge}`}
                  >
                    Part {audioPart}
                  </span>
                </p>
              </div>

              {/* Track number */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Track number
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className={fieldClass}
                  value={audioTrackNumber}
                  onChange={(e) =>
                    setAudioTrackNumber(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Số thứ tự track trong part (bắt đầu từ 1).
                </p>
              </div>

              {/* Mã kho đề (read-only) */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Mã kho đề
                </label>
                <input
                  className={`${fieldClass} bg-gray-50 cursor-default`}
                  value={listeningResult.slug}
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-400">
                  Tự điền từ kết quả import.
                </p>
              </div>
            </div>

            {/* Audio file picker */}
            <div
              className={`group rounded-xl border-2 border-dashed ${PART_COLORS[audioPart].border} ${PART_COLORS[audioPart].bg} p-5 transition-colors ${PART_COLORS[audioPart].hover}`}
            >
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Chọn file audio
              </label>
              <input
                key={audioFile ? "has-file" : "no-file"}
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.aac"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className={`w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-semibold cursor-pointer ${PART_COLORS[audioPart].file}`}
              />
              <p className="mt-2 text-xs text-gray-400">
                Hỗ trợ: MP3, WAV, M4A, OGG, AAC.
              </p>
              {audioFile && (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${PART_COLORS[audioPart].badge}`}
                >
                  <Music className="h-4 w-4 shrink-0" />
                  {audioFile.name}
                </div>
              )}
            </div>

            {/* Upload button */}
            <div>
              <button
                onClick={handleSubmitAudio}
                disabled={!audioFile || isAudioSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Volume2 className="h-4 w-4" />
                {isAudioSubmitting ? "Đang upload audio..." : "Upload audio"}
              </button>
            </div>

            {/* Audio error */}
            {audioError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{audioError}</span>
              </div>
            )}

            {/* Uploaded tracks list */}
            {audioResults.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-bold text-gray-700">
                  Đã upload ({audioResults.length} track)
                </h4>
                <ul className="space-y-2">
                  {audioResults.map((r, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      <div className="min-w-0 flex-1">
                        <span className="truncate font-medium text-gray-800">
                          {r.filename}
                        </span>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {r.part !== undefined && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PART_COLORS[r.part]?.badge ?? "bg-gray-100 text-gray-600"}`}
                            >
                              Part {r.part}
                            </span>
                          )}
                          {r.track_number !== undefined && (
                            <span className="text-xs text-gray-500">
                              Track {r.track_number}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            → mapped to{" "}
                            <span className="font-semibold text-green-700">
                              {r.mapped_item_ids.length} câu
                            </span>
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOEIC answer key section ── */}


      {/* ── TOEIC answer key section ── */}
      {examType === "toeic" && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-md">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="border-l-4 border-emerald-500 pl-3 text-base font-bold text-gray-800">
              Gán Đáp Án Chuẩn
            </h2>
            <p className="mt-1 pl-3.5 text-xs text-gray-500">
              Dùng file đáp án để gán chính xác đáp án đúng cho từng câu trong
              kho đề.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Answer key slug */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Kho đề cần gán đáp án
                </label>
                <input
                  className={fieldClass}
                  placeholder={`${examType}-${skillArea}-mock-01`}
                  value={answerKeyRepositorySlug}
                  onChange={(e) => setAnswerKeyRepositorySlug(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Tự điền theo lần nạp đề mới nhất.
                </p>
              </div>

              {/* Clear existing checkbox */}
              <div className="flex items-center gap-3 pt-7">
                <input
                  id="answer-key-clear-existing"
                  type="checkbox"
                  checked={answerKeyClearExisting}
                  onChange={(e) =>
                    setAnswerKeyClearExisting(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="answer-key-clear-existing"
                  className="text-sm text-gray-700 leading-snug"
                >
                  Reset đáp án cũ trước khi gán đáp án mới
                </label>
              </div>
            </div>

            {/* Answer key file upload */}
            <div className="group rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 p-5 transition-colors hover:border-emerald-400 hover:bg-emerald-50/60">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Chọn file đáp án
              </label>
              <input
                type="file"
                accept=".txt,.md,.csv,.json,.xls,.xlsx,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff"
                onChange={(e) =>
                  setAnswerKeyFile(e.target.files?.[0] ?? null)
                }
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200 cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-400">
                Hỗ trợ: ảnh (PNG/JPG/WEBP/BMP/TIF), PDF, DOC/DOCX, TXT, CSV,
                JSON, XLS/XLSX. Có thể OCR bảng đáp án dạng 1.A 2.D 3.C ...
              </p>
              {answerKeyFile && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                  <FileText className="h-4 w-4 shrink-0" />
                  {answerKeyFile.name}
                </div>
              )}
            </div>

            {/* Submit answer key button */}
            <div>
              <button
                onClick={handleSubmitAnswerKey}
                disabled={
                  !answerKeyFile ||
                  !answerKeyRepositorySlug.trim() ||
                  isAnswerKeySubmitting
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {isAnswerKeySubmitting ? "Đang gán đáp án..." : "Gán đáp án"}
              </button>
            </div>

            {/* Answer key error */}
            {answerKeyError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{answerKeyError}</span>
              </div>
            )}

            {/* Answer key success */}
            {answerKeyResult && (
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-green-800">
                    Import đáp án thành công
                  </p>
                  <p>
                    Slug:{" "}
                    <span className="font-medium">
                      {answerKeyResult.slug}
                    </span>
                  </p>
                  <p>
                    Skill:{" "}
                    <span className="font-medium">
                      {answerKeyResult.skill_area}
                    </span>
                  </p>
                  <p>
                    Detected answers:{" "}
                    <span className="font-medium">
                      {answerKeyResult.total_answers_detected}
                    </span>
                  </p>
                  <p>
                    Applied items:{" "}
                    <span className="font-medium">
                      {answerKeyResult.applied_items}
                    </span>
                  </p>
                  <p>
                    Unanswered items:{" "}
                    <span className="font-medium">
                      {answerKeyResult.unanswered_items}
                    </span>
                  </p>
                  {answerKeyResult.unknown_question_numbers.length > 0 && (
                    <p>
                      Unknown question numbers:{" "}
                      <span className="font-medium">
                        {answerKeyResult.unknown_question_numbers
                          .slice(0, 20)
                          .join(", ")}
                        {answerKeyResult.unknown_question_numbers.length > 20
                          ? " ..."
                          : ""}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* bottom slug quick-copy hint */}
      {activeSlug && (
        <p className="text-center text-xs text-gray-400">
          Active repository:{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">
            {activeSlug}
          </code>
        </p>
      )}
    </div>
  );
}
