import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Clock,
  Headphones,
  Lock,
  Map,
  RotateCcw,
  Trophy,
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useToeicScrollReset } from "../../hooks/useToeicScrollReset";
import {
  getToeicExamRepositoryDetail,
  type ToeicRepositoryDetailResponse,
} from "@/services/api/certificateService";

interface LearningMapState {
  listening: {
    unlockedUpTo: number;
    completedNodes: number[];
    nodeScores: number[];
  };
  reading: {
    unlockedUpTo: number;
    completedNodes: number[];
    nodeScores: number[];
  };
}

type AnswerKey = "A" | "B" | "C" | "D";

type ExamPhase = "intro" | "exam" | "summary";

interface ExamQuestion {
  id: string;
  part: number;
  partName: string;
  context?: string;
  question: string;
  options: { key: AnswerKey; text: string }[];
  correctAnswer: AnswerKey | null;
  explanation: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface ExamResult {
  examType: "listening" | "reading";
  score: number;
  correctCount: number;
  totalCount: number;
  completedAt: string;
  repositorySlug: string;
}

interface PartInfo {
  part: number;
  partName: string;
  questionCount: number;
  startIndex: number;
}

const MAP_STORAGE_KEY = "edvision.toeic.learningmap.v2";
const RESULTS_STORAGE_KEY = "edvision.toeic.exam.results.v1";

function getPartName(part: number): string {
  const labels: Record<number, string> = {
    1: "Part 1 - Photographs",
    2: "Part 2 - Question-Response",
    3: "Part 3 - Conversations",
    4: "Part 4 - Short Talks",
    5: "Part 5 - Incomplete Sentences",
    6: "Part 6 - Text Completion",
    7: "Part 7 - Reading Comprehension",
  };
  return labels[part] ?? `Part ${part}`;
}

function inferPart(
  item: ToeicRepositoryDetailResponse["items"][number],
  examType: "listening" | "reading",
  index: number,
): number {
  if (typeof item.part === "number" && item.part >= 1 && item.part <= 7) {
    return item.part;
  }

  if (examType === "listening") {
    const buckets = [1, 1, 2, 2, 3, 3, 4, 4];
    return buckets[Math.min(index, buckets.length - 1)] ?? 4;
  }

  const readingBuckets = [5, 5, 5, 6, 6, 6, 7, 7, 7];
  return readingBuckets[Math.min(index, readingBuckets.length - 1)] ?? 7;
}

function toExamQuestions(
  detail: ToeicRepositoryDetailResponse,
  examType: "listening" | "reading",
): ExamQuestion[] {
  const fallbackKeys: AnswerKey[] = ["A", "B", "C", "D"];

  return detail.items.reduce<ExamQuestion[]>((acc, item, idx) => {
    const options = [...(item.options ?? [])]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .slice(0, 4)
      .map((opt, optionIdx) => {
        const raw = String(
          opt.option_key ?? fallbackKeys[optionIdx],
        ).toUpperCase();
        const safeKey = (
          ["A", "B", "C", "D"].includes(raw) ? raw : fallbackKeys[optionIdx]
        ) as AnswerKey;
        return {
          key: safeKey,
          text: String(opt.option_text ?? "").trim(),
          isCorrect: Boolean(opt.is_correct),
        };
      })
      .filter((opt) => opt.text.length > 0);

    if (options.length < 2) return acc;

    const correct = options.find((opt) => opt.isCorrect)?.key ?? null;
    const part = inferPart(item, examType, idx);

    acc.push({
      id: String(item.id),
      part,
      partName: getPartName(part),
      context: item.reading_passage ?? undefined,
      question: String(item.stem ?? "").trim(),
      options: options.map((opt) => ({ key: opt.key, text: opt.text })),
      correctAnswer: correct,
      explanation:
        String(item.explanation ?? "").trim() ||
        "Hệ thống chưa có lời giải chi tiết cho câu này.",
      imageUrl: item.media_image_url ?? undefined,
      audioUrl: item.media_audio_url ?? undefined,
    } satisfies ExamQuestion);

    return acc;
  }, []);
}

function getPartsInfo(questions: ExamQuestion[]): PartInfo[] {
  const partsMap: Record<number, PartInfo> = {};
  questions.forEach((q, idx) => {
    if (!partsMap[q.part]) {
      partsMap[q.part] = {
        part: q.part,
        partName: q.partName,
        questionCount: 0,
        startIndex: idx,
      };
    }
    partsMap[q.part].questionCount += 1;
  });
  return Object.values(partsMap).sort((a, b) => a.part - b.part);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calcScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 495);
}

export default function ToeicExamSimulationPage() {
  const { examType } = useParams<{ examType: string }>();
  const navigate = useNavigate();

  useToeicScrollReset();

  const resolvedExamType =
    examType === "listening" || examType === "reading" ? examType : null;
  const isListening = resolvedExamType === "listening";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [repositorySlug, setRepositorySlug] = useState("");
  const [repositoryTitle, setRepositoryTitle] = useState("");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const totalQuestions = questions.length;
  const examDurationSeconds = useMemo(() => {
    if (totalQuestions <= 0) {
      return isListening ? 45 * 60 : 30 * 60;
    }
    const perQuestionSeconds = isListening ? 75 : 65;
    const floor = isListening ? 20 * 60 : 15 * 60;
    return Math.max(floor, totalQuestions * perQuestionSeconds);
  }, [isListening, totalQuestions]);

  useEffect(() => {
    // Reset all exam state immediately so stale reading data never bleeds into
    // a listening session (and vice-versa) during SPA navigation.
    setQuestions([]);
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(0);
    setExamStarted(false);
    setLoadError(null);

    if (!resolvedExamType) {
      setLoading(false);
      setLoadError("examType không hợp lệ. Chỉ hỗ trợ listening hoặc reading.");
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    getToeicExamRepositoryDetail(resolvedExamType)
      .then((detail) => {
        if (!active) return;
        const mapped = toExamQuestions(detail, resolvedExamType);
        setRepositorySlug(detail.slug);
        setRepositoryTitle(detail.title);
        setQuestions(mapped);
        if (mapped.length === 0) {
          setLoadError(
            "Repository đã nạp nhưng chưa có câu hỏi hợp lệ để thi.",
          );
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const typedErr = err as {
          response?: { data?: { message?: string | string[] } };
          message?: string;
        };
        const message =
          typedErr?.response?.data?.message ||
          typedErr?.message ||
          "Không tải được đề thi từ hệ thống.";
        setLoadError(
          Array.isArray(message) ? message.join(" ") : String(message),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resolvedExamType]);

  const { isUnlocked, completedCount, requiredCount } = useMemo(() => {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    const required = isListening ? 5 : 4;
    if (!raw) {
      return { isUnlocked: false, completedCount: 0, requiredCount: required };
    }
    try {
      const state: LearningMapState = JSON.parse(raw);
      const skill = isListening ? state.listening : state.reading;
      const completed = skill?.completedNodes?.length ?? 0;
      return {
        isUnlocked: completed >= required,
        completedCount: completed,
        requiredCount: required,
      };
    } catch {
      return { isUnlocked: false, completedCount: 0, requiredCount: required };
    }
  }, [isListening]);

  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});
  const [timeLeft, setTimeLeft] = useState(examDurationSeconds);
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    setTimeLeft(examDurationSeconds);
  }, [examDurationSeconds]);

  const partsInfo = useMemo(() => getPartsInfo(questions), [questions]);
  const answerKeyMissingCount = useMemo(
    () => questions.filter((q) => q.correctAnswer === null).length,
    [questions],
  );
  const gradableTotal = useMemo(
    () => questions.filter((q) => q.correctAnswer !== null).length,
    [questions],
  );

  useEffect(() => {
    if (!examStarted || phase !== "exam") return;
    if (timeLeft <= 0) {
      setPhase("summary");
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, phase, timeLeft]);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const correctCount = useMemo(() => {
    return questions.filter((q, idx) => {
      if (q.correctAnswer === null) return false;
      return answers[idx] === q.correctAnswer;
    }).length;
  }, [questions, answers]);

  const handleStartExam = useCallback(() => {
    setPhase("exam");
    setExamStarted(true);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(examDurationSeconds);
  }, [examDurationSeconds]);

  const handleSelectAnswer = useCallback(
    (key: AnswerKey) => {
      if (answers[currentIndex] !== undefined) return;
      setAnswers((prev) => ({ ...prev, [currentIndex]: key }));
    },
    [answers, currentIndex],
  );

  const handleSubmit = useCallback(() => {
    if (!resolvedExamType) return;
    const result: ExamResult = {
      examType: resolvedExamType,
      score: calcScore(correctCount, gradableTotal),
      correctCount,
      totalCount: gradableTotal,
      completedAt: new Date().toISOString(),
      repositorySlug: repositorySlug || "unknown",
    };

    try {
      const existing: ExamResult[] = JSON.parse(
        localStorage.getItem(RESULTS_STORAGE_KEY) ?? "[]",
      );
      existing.push(result);
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(existing));
    } catch {
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify([result]));
    }

    setPhase("summary");
  }, [correctCount, gradableTotal, repositorySlug, resolvedExamType]);

  const handleRetry = useCallback(() => {
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers({});
    setExamStarted(false);
    setTimeLeft(examDurationSeconds);
  }, [examDurationSeconds]);

  const handleGoToMap = useCallback(() => {
    if (!resolvedExamType) return;
    navigate(`/student/certificate-review/toeic/skill/${resolvedExamType}`);
  }, [navigate, resolvedExamType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">
              Đang tải đề thi từ database...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-2xl p-6 text-center shadow-sm">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Không thể mở bài thi
            </h2>
            <p className="text-gray-600 text-sm mb-4">{loadError}</p>
            <button
              onClick={handleGoToMap}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition-colors"
            >
              Quay lại trang luyện tập
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-10 max-w-md w-full text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Bài thi chưa mở khóa
            </h2>
            <p className="text-gray-600 mb-6">
              Hoàn thành {requiredCount} node luyện tập để mở khóa.
            </p>
            <p className="text-sm text-gray-500 mb-5">
              Tiến độ hiện tại: {completedCount}/{requiredCount} node.
            </p>
            <button
              onClick={handleGoToMap}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <Map className="w-4 h-4" />
                Đến trang luyện tập
              </span>
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-center mb-4">
              {isListening ? (
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center">
                  <Headphones className="w-7 h-7 text-teal-600" />
                </div>
              ) : (
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-blue-600" />
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              TOEIC {isListening ? "Listening" : "Reading"} Exam
            </h1>
            <p className="text-gray-600 text-center text-sm mb-1">
              {repositoryTitle}
            </p>
            <p className="text-gray-400 text-center text-xs mb-6">
              Slug: {repositorySlug}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-xs mb-1">Số câu</p>
                <p className="text-gray-900 font-bold text-lg">
                  {totalQuestions}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-xs mb-1">Số phần</p>
                <p className="text-gray-900 font-bold text-lg">
                  {partsInfo.length}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-gray-500 text-xs mb-1">Thời gian</p>
                <p className="text-gray-900 font-bold text-lg">
                  {Math.round(examDurationSeconds / 60)} phút
                </p>
              </div>
            </div>

            {answerKeyMissingCount > 0 && (
              <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Bộ đề này còn {answerKeyMissingCount}/{totalQuestions} câu chưa
                có đáp án chính thức. Hệ thống chỉ chấm điểm trên{" "}
                {gradableTotal} câu đã xác nhận đáp án.
              </div>
            )}

            <div className="space-y-2 mb-6">
              {partsInfo.map((part) => (
                <div
                  key={part.part}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center justify-between"
                >
                  <span className="text-gray-700 text-sm font-medium">
                    {part.partName}
                  </span>
                  <span className="text-gray-400 text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5">
                    {part.questionCount} câu
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartExam}
              disabled={totalQuestions === 0}
              className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold disabled:opacity-50 hover:bg-teal-500 transition-colors shadow-sm"
            >
              Bắt đầu thi
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (phase === "summary") {
    const estimatedScore = calcScore(correctCount, gradableTotal);
    const accuracy =
      gradableTotal > 0 ? Math.round((correctCount / gradableTotal) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
          {/* Score hero card */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 mb-5 text-center border-l-4 border-l-teal-500">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-3xl font-black text-gray-900 mb-1">
              {correctCount}/{gradableTotal} câu đúng
            </h2>
            <p className="text-teal-600 font-semibold">
              Điểm ước tính: {estimatedScore} / 495
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Độ chính xác: {accuracy}%
            </p>
            {answerKeyMissingCount > 0 && (
              <p className="text-amber-600 text-xs mt-2">
                Có {answerKeyMissingCount} câu chưa có đáp án chính thức nên
                không tính vào điểm.
              </p>
            )}
          </div>

          <div className="space-y-3 mb-6">
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const hasOfficialAnswer = q.correctAnswer !== null;
              const isCorrect =
                hasOfficialAnswer && userAnswer === q.correctAnswer;
              return (
                <div
                  key={q.id}
                  className={`bg-white border border-gray-200 shadow-sm rounded-xl p-4 border-l-4 ${
                    !hasOfficialAnswer
                      ? "border-l-amber-400"
                      : isCorrect
                        ? "border-l-green-500"
                        : "border-l-red-500"
                  }`}
                >
                  <p className="text-sm text-teal-600 font-semibold mb-1">
                    Câu {idx + 1} - {q.partName}
                  </p>
                  <p className="text-gray-900 font-semibold mb-3">
                    {q.question}
                  </p>
                  {q.context && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-sm text-gray-600 whitespace-pre-line">
                      {q.context}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {q.options.map((opt) => {
                      const selected = userAnswer === opt.key;
                      const right =
                        hasOfficialAnswer && q.correctAnswer === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`px-3 py-2 rounded-lg text-sm border ${
                            right
                              ? "bg-green-50 border-green-300 text-green-800"
                              : selected && hasOfficialAnswer && !isCorrect
                                ? "bg-red-50 border-red-300 text-red-800"
                                : selected && !hasOfficialAnswer
                                  ? "bg-amber-50 border-amber-300 text-amber-800"
                                  : "bg-gray-50 border-gray-200 text-gray-600"
                          }`}
                        >
                          <span className="font-bold mr-2">{opt.key}.</span>
                          {opt.text}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs mb-2">
                    <span className="text-gray-500 mr-2">Bạn chọn:</span>
                    <span
                      className={
                        isCorrect
                          ? "text-green-600 font-bold"
                          : hasOfficialAnswer
                            ? "text-red-600 font-bold"
                            : "text-amber-600 font-bold"
                      }
                    >
                      {userAnswer ?? "Chưa trả lời"}
                    </span>
                    {hasOfficialAnswer && !isCorrect && (
                      <>
                        <span className="text-gray-300 mx-2">|</span>
                        <span className="text-gray-500 mr-2">Đáp án đúng:</span>
                        <span className="text-green-600 font-bold">
                          {q.correctAnswer}
                        </span>
                      </>
                    )}
                    {!hasOfficialAnswer && (
                      <>
                        <span className="text-gray-300 mx-2">|</span>
                        <span className="text-amber-600 font-semibold">
                          Chưa có đáp án chính thức
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <span className="font-bold">Giải thích:</span>{" "}
                    {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleGoToMap}
              className="py-3 px-5 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Map className="w-4 h-4" />
              Về map luyện tập
            </button>
            <button
              onClick={handleRetry}
              className="py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Thi lại
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isLastQuestion = currentIndex >= totalQuestions - 1;
  const hasAnswered = answers[currentIndex] !== undefined;

  const progressPercent = Math.round(
    ((currentIndex + 1) / Math.max(totalQuestions, 1)) * 100,
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Question counter */}
          <div className="text-gray-700 text-sm font-semibold whitespace-nowrap">
            Câu {currentIndex + 1}/{totalQuestions}
          </div>

          {/* Mascot running progress bar — flex-1 so it fills all remaining space */}
          <div
            className="flex-1 relative flex items-center"
            style={{ paddingTop: "22px", paddingBottom: "6px" }}
          >
            {/* Track */}
            <div className="w-full h-3 bg-gray-200 rounded-full relative overflow-visible">
              {/* Gradient fill */}
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background:
                    "linear-gradient(90deg, #2dd4bf 0%, #14b8a6 60%, #0d9488 100%)",
                  boxShadow: "0 0 8px rgba(20, 184, 166, 0.5)",
                }}
              />

              {/* Owl mascot riding the leading edge */}
              <div
                className="absolute transition-all duration-500 ease-out"
                style={{
                  left: `${Math.max(progressPercent, 2)}%`,
                  top: "50%",
                  transform: "translateX(-50%) translateY(-100%)",
                  zIndex: 10,
                }}
              >
                {/* Shadow dot */}
                <div
                  className="owl-running-shadow mx-auto mb-0.5 rounded-full bg-black/25"
                  style={{ width: "16px", height: "4px" }}
                />
                {/* SVG Owl mascot */}
                <svg
                  className="owl-running block select-none"
                  width="32"
                  height="36"
                  viewBox="0 0 32 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Chạy nào!</title>
                  {/* Body */}
                  <ellipse cx="16" cy="22" rx="9" ry="10" fill="#f97316" />
                  {/* Belly */}
                  <ellipse cx="16" cy="24" rx="5.5" ry="6.5" fill="#fed7aa" />
                  {/* Head */}
                  <circle cx="16" cy="11" r="9" fill="#f97316" />
                  {/* Left ear tuft */}
                  <polygon points="9,5 7,0 12,4" fill="#ea580c" />
                  {/* Right ear tuft */}
                  <polygon points="23,5 25,0 20,4" fill="#ea580c" />
                  {/* Left eye white */}
                  <circle cx="12" cy="11" r="3.5" fill="white" />
                  {/* Right eye white */}
                  <circle cx="20" cy="11" r="3.5" fill="white" />
                  {/* Left eye iris */}
                  <circle cx="12.5" cy="11.5" r="2" fill="#1e3a5f" />
                  {/* Right eye iris */}
                  <circle cx="20.5" cy="11.5" r="2" fill="#1e3a5f" />
                  {/* Left eye shine */}
                  <circle cx="13" cy="10.5" r="0.7" fill="white" />
                  {/* Right eye shine */}
                  <circle cx="21" cy="10.5" r="0.7" fill="white" />
                  {/* Beak */}
                  <polygon points="14.5,14.5 17.5,14.5 16,17" fill="#fb923c" />
                  {/* Left wing */}
                  <ellipse
                    cx="7"
                    cy="22"
                    rx="3.5"
                    ry="6"
                    fill="#ea580c"
                    transform="rotate(-15 7 22)"
                  />
                  {/* Right wing */}
                  <ellipse
                    cx="25"
                    cy="22"
                    rx="3.5"
                    ry="6"
                    fill="#ea580c"
                    transform="rotate(15 25 22)"
                  />
                  {/* Left leg */}
                  <rect
                    x="11"
                    y="30"
                    width="3"
                    height="5"
                    rx="1.5"
                    fill="#fb923c"
                  />
                  {/* Right leg */}
                  <rect
                    x="18"
                    y="30"
                    width="3"
                    height="5"
                    rx="1.5"
                    fill="#fb923c"
                  />
                  {/* Left foot */}
                  <ellipse cx="12.5" cy="35" rx="3" ry="1.5" fill="#fdba74" />
                  {/* Right foot */}
                  <ellipse cx="19.5" cy="35" rx="3" ry="1.5" fill="#fdba74" />
                </svg>
              </div>
            </div>

            {/* Finish flag anchored at far right */}
            <span
              className="absolute right-0 text-base leading-none select-none"
              style={{
                transform: "translateX(4px) translateY(-50%)",
                top: "50%",
              }}
              title="Đích"
            >
              🏁
            </span>
          </div>

          {/* Timer */}
          <div
            className={`font-mono text-sm font-bold inline-flex items-center gap-1 whitespace-nowrap ${
              timeLeft <= 60 ? "text-red-500" : "text-teal-600"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {currentQuestion && (
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 mb-5">
            <p className="text-teal-600 text-sm font-semibold mb-2">
              {currentQuestion.partName}
            </p>
            {currentQuestion.context && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm text-gray-600 whitespace-pre-line">
                {currentQuestion.context}
              </div>
            )}
            {/* Image for Part 1 (Photographs) */}
            {currentQuestion.part === 1 && currentQuestion.imageUrl && (
              <div className="mb-4 flex justify-center">
                <img
                  src={`http://localhost:3000${currentQuestion.imageUrl}`}
                  alt="Part 1 photograph"
                  className="max-h-64 rounded-lg border border-gray-200 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            {/* Audio player for Listening parts 1-4 */}
            {currentQuestion.part !== undefined &&
              currentQuestion.part <= 4 &&
              currentQuestion.audioUrl && (
                <div className="mb-4">
                  <audio
                    key={currentQuestion.id + "-audio"}
                    controls
                    className="w-full"
                    src={`http://localhost:3000${currentQuestion.audioUrl}`}
                  >
                    Trình duyệt của bạn không hỗ trợ audio.
                  </audio>
                </div>
              )}
            <p className="text-gray-900 text-lg font-semibold mb-4">
              {currentQuestion.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt) => {
                const selected = answers[currentIndex];
                const isSelected = selected === opt.key;
                const isDisabled = selected !== undefined;
                return (
                  <button
                    key={opt.key}
                    disabled={isDisabled}
                    onClick={() => handleSelectAnswer(opt.key)}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                      isSelected
                        ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                        : isDisabled
                          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white border-gray-300 text-gray-800 hover:border-teal-500 hover:bg-teal-50"
                    }`}
                  >
                    <span className="font-bold mr-2">{opt.key}.</span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {hasAnswered && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400" />
                Bạn đã chọn đáp án {answers[currentIndex]}. Không thể thay đổi
                đáp án.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium shadow-sm hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Câu trước
          </button>

          <div className="text-xs text-gray-400 font-medium">
            {answeredCount}/{totalQuestions} đã trả lời
          </div>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!hasAnswered}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold disabled:opacity-40 inline-flex items-center gap-2 shadow-sm transition-colors"
            >
              <Trophy className="w-4 h-4" />
              Nộp bài
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))
              }
              disabled={!hasAnswered}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold disabled:opacity-40 inline-flex items-center gap-2 shadow-sm transition-colors"
            >
              Câu tiếp theo
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {answeredCount === totalQuestions && !isLastQuestion && (
          <div className="mt-4 text-center">
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
            >
              <Trophy className="w-4 h-4" />
              Nộp bài sớm
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
