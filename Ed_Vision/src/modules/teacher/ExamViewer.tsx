import { useState, useEffect } from "react";
import {
  Eye,
  Lock,
  FileText,
  Dumbbell,
  Target,
  BookOpen,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Filter,
} from "lucide-react";
import TeacherLayout from "./components/TeacherLayout";
import {
  verifyExamViewerPassword,
  getExamViewerToeicRepositories,
  getExamViewerToeicRepositoryDetail,
  getExamViewerToeicPracticeSets,
  getExamViewerToeicPracticeDetail,
  getExamViewerToeicDiagnosticTests,
  getExamViewerToeicDiagnosticDetail,
  getExamViewerIeltsRepositories,
  getExamViewerIeltsRepositoryDetail,
  getExamViewerIeltsPracticeSets,
  getExamViewerIeltsPracticeDetail,
  getExamViewerIeltsDiagnosticTests,
  getExamViewerIeltsDiagnosticDetail,
} from "@/services/api/certificateService";

type CertType = "toeic" | "ielts";
type ExamType = "mock" | "practice" | "diagnostic";

export default function ExamViewer() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [certType, setCertType] = useState<CertType>("toeic");
  const [examType, setExamType] = useState<ExamType>("mock");
  const [skillFilter, setSkillFilter] = useState<string>("");

  const [examList, setExamList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [examDetail, setExamDetail] = useState<any | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    try {
      const result = await verifyExamViewerPassword(password);
      if (result.success) {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setAuthError(
        err?.response?.data?.message || "Mật khẩu không chính xác. Vui lòng thử lại.",
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loadExamList = async () => {
    setIsLoadingList(true);
    setExamList([]);
    setSelectedExam(null);
    setExamDetail(null);

    try {
      let data: any[] = [];

      if (certType === "toeic") {
        if (examType === "mock") {
          data = await getExamViewerToeicRepositories(skillFilter || undefined);
        } else if (examType === "practice") {
          data = await getExamViewerToeicPracticeSets();
        } else if (examType === "diagnostic") {
          data = await getExamViewerToeicDiagnosticTests();
        }
      } else if (certType === "ielts") {
        if (examType === "mock") {
          data = await getExamViewerIeltsRepositories(skillFilter || undefined);
        } else if (examType === "practice") {
          data = await getExamViewerIeltsPracticeSets();
        } else if (examType === "diagnostic") {
          data = await getExamViewerIeltsDiagnosticTests();
        }
      }

      setExamList(data);
    } catch (err) {
      console.error("Failed to load exam list", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const loadExamDetail = async (exam: any) => {
    setIsLoadingDetail(true);
    setExamDetail(null);

    try {
      let detail: any = null;

      if (certType === "toeic") {
        if (examType === "mock") {
          detail = await getExamViewerToeicRepositoryDetail(exam.slug);
        } else if (examType === "practice") {
          detail = await getExamViewerToeicPracticeDetail(exam.practice_set_id);
        } else if (examType === "diagnostic") {
          detail = await getExamViewerToeicDiagnosticDetail(exam.slug);
        }
      } else if (certType === "ielts") {
        if (examType === "mock") {
          detail = await getExamViewerIeltsRepositoryDetail(exam.slug);
        } else if (examType === "practice") {
          detail = await getExamViewerIeltsPracticeDetail(exam.practice_set_id);
        } else if (examType === "diagnostic") {
          detail = await getExamViewerIeltsDiagnosticDetail(exam.slug);
        }
      }

      setExamDetail(detail);
    } catch (err) {
      console.error("Failed to load exam detail", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    sessionStorage.removeItem("exam_viewer_auth");
    return () => {
      setIsAuthenticated(false);
      setPassword("");
      setAuthError("");
      sessionStorage.removeItem("exam_viewer_auth");
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadExamList();
    }
  }, [isAuthenticated, certType, examType, skillFilter]);

  if (!isAuthenticated) {
    return (
      <TeacherLayout currentPage="exam-viewer">
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-8 py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Xác Thực Bảo Mật</h2>
                <p className="mt-2 text-sm text-indigo-100">
                  Nhập mật khẩu để truy cập nội dung đề thi
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mật khẩu truy cập
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
                    placeholder="Nhập mật khẩu..."
                    autoFocus
                  />
                </div>

                {authError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthenticating || !password.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Xác Thực
                    </>
                  )}
                </button>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  <p className="font-semibold mb-1">⚠️ Lưu ý bảo mật:</p>
                  <p>
                    Nội dung đề thi được mã hóa. Chỉ giáo viên được cấp quyền mới có thể xem.
                    Vui lòng liên hệ quản trị viên nếu bạn quên mật khẩu.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout currentPage="exam-viewer">
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-8 py-7 shadow-xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Xem Nội Dung Đề Thi
              </h1>
              <p className="mt-1 text-sm text-indigo-100/90">
                Xem chi tiết câu hỏi và đáp án từ các đề thi đã nạp vào hệ thống
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-800">Bộ lọc</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Loại chứng chỉ
              </label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as CertType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              >
                <option value="toeic">TOEIC</option>
                <option value="ielts">IELTS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Loại đề thi
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              >
                <option value="mock">📘 Đề Thi Mô Phỏng (Mock Test)</option>
                <option value="practice">📝 Câu Hỏi Ôn Luyện (Practice)</option>
                <option value="diagnostic">🎯 Đề Khảo Sát (Diagnostic)</option>
              </select>
            </div>

            {examType === "mock" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Kỹ năng
                </label>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                >
                  <option value="">Tất cả</option>
                  <option value="listening">Listening</option>
                  <option value="reading">Reading</option>
                  {certType === "ielts" && (
                    <>
                      <option value="speaking">Speaking</option>
                      <option value="writing">Writing</option>
                    </>
                  )}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam List */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  {examType === "mock" && <FileText className="h-4 w-4 text-indigo-500" />}
                  {examType === "practice" && <Dumbbell className="h-4 w-4 text-amber-500" />}
                  {examType === "diagnostic" && <Target className="h-4 w-4 text-emerald-500" />}
                  Danh sách đề thi
                  {examList.length > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {examList.length}
                    </span>
                  )}
                </h3>
              </div>

              <div className="p-4 max-h-[600px] overflow-y-auto">
                {isLoadingList ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Đang tải...
                  </div>
                ) : examList.length === 0 ? (
                  <p className="py-12 text-center text-sm text-gray-400">
                    Không có đề thi nào.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {examList.map((exam) => {
                      const examId = exam.slug || exam.practice_set_id || exam._id;
                      const isSelected = selectedExam && (selectedExam.slug === exam.slug || selectedExam.practice_set_id === exam.practice_set_id);

                      return (
                        <button
                          key={examId}
                          onClick={() => {
                            setSelectedExam(exam);
                            void loadExamDetail(exam);
                          }}
                          className={`w-full text-left rounded-lg border p-3 transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {exam.title || exam.slug || exam.practice_set_id}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {exam.skill_area && (
                                  <span className="capitalize">{exam.skill_area}</span>
                                )}
                                {exam.total_items && (
                                  <span className="ml-2">• {exam.total_items} câu</span>
                                )}
                              </p>
                              {exam.has_answer_key !== undefined && (
                                <div className="mt-2">
                                  {exam.has_answer_key ? (
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                                      ✓ Có đáp án
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                                      ✗ Chưa có đáp án
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? "text-indigo-600 rotate-90" : "text-gray-400"}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exam Detail */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  Chi tiết câu hỏi
                </h3>
              </div>

              <div className="p-6 max-h-[600px] overflow-y-auto">
                {!selectedExam ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Eye className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">Chọn một đề thi để xem chi tiết</p>
                  </div>
                ) : isLoadingDetail ? (
                  <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    Đang tải chi tiết...
                  </div>
                ) : !examDetail ? (
                  <div className="flex items-center justify-center py-20 text-red-500 text-sm">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Không thể tải chi tiết đề thi
                  </div>
                ) : (
                  <ExamDetailView examDetail={examDetail} examType={examType} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

function normalizeViewerQuestions(examDetail: any): any[] {
  const raw = examDetail.items || examDetail.questions || [];
  return raw.map((question: any, index: number) => {
    if (question.stem) {
      return question;
    }

    const questionText = question.questionText ?? question.question_text;
    if (!questionText) {
      return question;
    }

    const rawOptions = Array.isArray(question.options) ? question.options : [];
    const options = rawOptions.map((opt: any) => {
      const optionKey = opt.option_key ?? opt.key ?? "";
      const optionText = opt.option_text ?? opt.text ?? "";
      return {
        ...opt,
        option_key: optionKey,
        option_text: optionText,
        is_correct:
          opt.is_correct ??
          optionKey === (question.correctAnswer ?? question.correct_answer),
      };
    });

    return {
      ...question,
      stem: questionText,
      question_number:
        question.question_number ?? question.item_order ?? index + 1,
      options,
      reading_passage:
        question.reading_passage ?? question.passage?.content ?? null,
    };
  });
}

function ExamDetailView({ examDetail, examType }: { examDetail: any; examType: ExamType }) {
  const questions = normalizeViewerQuestions(examDetail);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-bold text-gray-800 mb-2">Thông tin tổng quan</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-500">Tổng số câu:</span>
            <span className="ml-2 font-semibold text-gray-800">{questions.length}</span>
          </div>
          {examDetail.skill_area && (
            <div>
              <span className="text-gray-500">Kỹ năng:</span>
              <span className="ml-2 font-semibold text-gray-800 capitalize">
                {examDetail.skill_area}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((question: any, index: number) => {
          const questionNumber = question.question_number || question.item_order || index + 1;
          const options = question.options || [];
          const correctOption = options.find((opt: any) => opt.is_correct);

          return (
            <div
              key={question.id || index}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                  {questionNumber}
                </div>
                <div className="flex-1">
                  {question.part && (
                    <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 mb-2">
                      Part {question.part || question.toeic_part}
                    </span>
                  )}
                  {question.reading_passage && (
                    <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                      <p className="font-semibold text-gray-800 mb-1">📄 Đoạn văn:</p>
                      <p className="whitespace-pre-wrap">{question.reading_passage}</p>
                    </div>
                  )}
                  {question.stem && (
                    <p className="text-sm text-gray-800 font-medium mb-3">
                      {question.stem}
                    </p>
                  )}
                  {question.context_image && (
                    <div className="mb-3">
                      <img
                        src={question.context_image || question.media_image_url}
                        alt="Question context"
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {question.context_audio && (
                    <div className="mb-3">
                      <audio controls className="w-full">
                        <source src={question.context_audio || question.media_audio_url} />
                      </audio>
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              {options.length > 0 && (
                <div className="ml-11 space-y-2">
                  {options.map((option: any) => {
                    const isCorrect = option.is_correct;
                    return (
                      <div
                        key={option.id || option.option_key}
                        className={`rounded-lg border p-3 text-sm ${
                          isCorrect
                            ? "border-green-300 bg-green-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-gray-700">
                            {option.option_key}:
                          </span>
                          <span className="flex-1 text-gray-800">
                            {option.option_text}
                          </span>
                          {isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          )}
                        </div>
                        {option.rationale && (
                          <p className="mt-2 text-xs text-gray-600 italic">
                            💡 {option.rationale}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Correct Answer (for non-multiple-choice) */}
              {question.correct_answer && !options.length && (
                <div className="ml-11 mt-3 rounded-lg border border-green-300 bg-green-50 p-3 text-sm">
                  <span className="font-semibold text-green-800">Đáp án đúng:</span>
                  <span className="ml-2 text-gray-800">{question.correct_answer}</span>
                </div>
              )}

              {/* Explanation */}
              {(question.explanation || question.ai_explanation) && (
                <div className="ml-11 mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                  <p className="font-semibold mb-1">📝 Giải thích:</p>
                  <p className="whitespace-pre-wrap">
                    {question.explanation || question.ai_explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
