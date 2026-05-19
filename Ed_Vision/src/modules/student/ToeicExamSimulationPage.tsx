import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Clock,
  Headphones,
  Lock,
  Map as MapIcon,
  PlayCircle,
  RotateCcw,
  Trophy,
  Volume2,
} from "lucide-react";
import Header from "../../components/layout/Header";
import { buildAssetUrl } from "@/services/api/config";
import Footer from "../../components/layout/Footer";
import NoSeekAudioPlayer from "./components/NoSeekAudioPlayer";
import { useToeicScrollReset } from "../../hooks/useToeicScrollReset";
import { useAuth } from "@/hooks/useAuth";
import {
  getToeicExamRepositoryDetail,
  startExamSession,
  getExamSession,
  upsertExamAnswer,
  updateExamCursor,
  submitExamSession,
  getToeicReservePoints,
  getToeicPlanSync,
  type ExamSessionState,
  type ToeicRepositoryDetailResponse,
} from "@/services/api/certificateService";
import { getToeicIntakeProfile } from "./toeicIntake";

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

const MAP_STORAGE_KEY_PREFIX = "edvision.toeic.learningmap.v2";
const RESULTS_STORAGE_KEY_PREFIX = "edvision.toeic.exam.results.v1";

/** Storage key scoped theo user — tránh acc mới đọc data acc cũ */
function getMapStorageKey(userId: string | number | undefined): string {
  return userId ? `${MAP_STORAGE_KEY_PREFIX}.${userId}` : MAP_STORAGE_KEY_PREFIX;
}
function getResultsStorageKey(userId: string | number | undefined): string {
  return userId ? `${RESULTS_STORAGE_KEY_PREFIX}.${userId}` : RESULTS_STORAGE_KEY_PREFIX;
}

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

/** Returns true if option_text is a bare placeholder like "(A)" or "A" */
function isPlaceholderOptionText(text: string, key: string): boolean {
  const t = text.trim().toLowerCase();
  const k = key.toLowerCase();
  return (
    t === "" ||
    t === k ||
    t === `(${k})` ||
    t.startsWith(`(${k}) -`) ||
    t.includes("vui lòng nhập đáp án")
  );
}

/** Returns clean question stem — replaces bracketed placeholder with a short instruction.
 *  Preserves the question number so users know which question they are on. */
function cleanListeningQuestionStem(stem: string, part: number, questionNumber: number): string {
  const s = stem.trim();
  const isPlaceholder =
    s.startsWith("[") ||
    s.toLowerCase().includes("nhìn vào hình ảnh") ||
    s.toLowerCase().includes("chọn mô tả đúng nhất") ||
    s.toLowerCase().includes("nghe câu hỏi và chọn") ||
    s.toLowerCase().includes("nghe đoạn hội thoại") ||
    s.toLowerCase().includes("nghe bài nói ngắn") ||
    s === "";
  if (!isPlaceholder) return s; // real question text — return as-is
  const n = questionNumber;
  if (part === 1) return `Câu ${n}: Nhìn vào hình ảnh và chọn mô tả đúng nhất.`;
  if (part === 2) return `Câu ${n}: Nghe câu hỏi và chọn đáp án phù hợp nhất.`;
  if (part === 3) return `Câu ${n}: Nghe đoạn hội thoại và chọn đáp án đúng.`;
  if (part === 4) return `Câu ${n}: Nghe bài nói ngắn và chọn đáp án đúng.`;
  return `Câu ${n}: Chọn đáp án đúng theo nội dung audio.`;
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
        const rawText = String(opt.option_text ?? "").trim();
        // Strip placeholder option texts ("(A)", "A", etc.) — only show real descriptions
        const text = isPlaceholderOptionText(rawText, safeKey) ? "" : rawText;
        return {
          key: safeKey,
          text,
          isCorrect: Boolean(opt.is_correct),
        };
      })
      // For listening we keep options even when text is empty (still selectable A/B/C/D)
      // For reading, options without text are useless — filter them out
      .filter((opt) => examType === "listening" || opt.text.length > 0);

    if (options.length < 2) return acc;

    const correct = options.find((opt) => opt.isCorrect)?.key ?? null;
    const part = inferPart(item, examType, idx);

    const rawStem = String(item.stem ?? "").trim();
    const question =
      examType === "listening"
        ? cleanListeningQuestionStem(rawStem, part, item.item_order)
        : rawStem;

    acc.push({
      id: String(item.id),
      part,
      partName: getPartName(part),
      context: item.reading_passage ?? undefined,
      question,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.account_id || user?.id;

  useToeicScrollReset();

  const resolvedExamType =
    examType === "listening" || examType === "reading" ? examType : null;
  const isListening = resolvedExamType === "listening";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [repositorySlug, setRepositorySlug] = useState("");
  const [repositoryTitle, setRepositoryTitle] = useState("");
  const [fullAudioUrl, setFullAudioUrl] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [audioConfirmed, setAudioConfirmed] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  // ── Server-driven session state ──
  // sessionId = null → chưa start. Khi có giá trị, countdown được tính từ
  // `serverStartedAt + serverDurationSec - now` (không trừ dần ở client) để F5
  // không reset thời gian + chống user chỉnh đồng hồ máy.
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [serverStartedAt, setServerStartedAt] = useState<number | null>(null);
  const [serverDurationSec, setServerDurationSec] = useState<number>(0);
  const [tickNow, setTickNow] = useState<number>(() => Date.now());
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerKey>>({});

  const totalQuestions = questions.length;
  const examDurationSeconds = useMemo(() => {
    if (serverDurationSec > 0) return serverDurationSec;
    // Chuẩn TOEIC: Listening = 45 phút (2700s) cho 100 câu (27s/câu).
    // Reading = 75 phút (4500s) cho 100 câu (45s/câu).
    const perQuestionSeconds = isListening ? 27 : 45;
    const defaultTotal = 100;
    const count = totalQuestions > 0 ? totalQuestions : defaultTotal;
    return count * perQuestionSeconds;
  }, [isListening, totalQuestions, serverDurationSec]);

  // Hydrate session state khi phát hiện ?session=xxx trên URL (vd: F5).
  // Lưu ý: phải chạy SAU khi questions load xong để map answers theo index.
  const sessionParam = searchParams.get("session");
  const hydratedRef = useRef<number | null>(null);

  const applySessionState = useCallback(
    (state: ExamSessionState, qs: ExamQuestion[]) => {
      setSessionId(state.session_id);
      setServerStartedAt(new Date(state.started_at).getTime());
      setServerDurationSec(state.duration_sec);
      setCurrentIndex(Math.min(state.current_index, Math.max(0, qs.length - 1)));

      // Map server answers (theo question_id) về client state (theo index).
      const idToIndex = new Map<number, number>();
      qs.forEach((q, idx) => {
        const numId = Number(q.id);
        if (Number.isFinite(numId)) idToIndex.set(numId, idx);
      });
      const mapped: Record<number, AnswerKey> = {};
      for (const ans of state.answers) {
        const idx = idToIndex.get(ans.question_id);
        if (idx === undefined) continue;
        if (
          ans.selected_key === "A" ||
          ans.selected_key === "B" ||
          ans.selected_key === "C" ||
          ans.selected_key === "D"
        ) {
          mapped[idx] = ans.selected_key;
        }
      }
      setAnswers(mapped);

      if (state.submitted_at) {
        setPhase("summary");
      } else {
        setPhase("exam");
      }
    },
    [],
  );

  useEffect(() => {
    // Reset state khi đổi examType (listening ↔ reading) để dữ liệu cũ không
    // bleed sang.
    setQuestions([]);
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers({});
    setSessionId(null);
    setServerStartedAt(null);
    setServerDurationSec(0);
    setLoadError(null);
    hydratedRef.current = null;

    if (!resolvedExamType) {
      setLoading(false);
      setLoadError("examType không hợp lệ. Chỉ hỗ trợ listening hoặc reading.");
      return;
    }

    let active = true;
    setLoading(true);

    getToeicExamRepositoryDetail(resolvedExamType)
      .then(async (detail) => {
        if (!active) return;
        const mapped = toExamQuestions(detail, resolvedExamType);
        setRepositorySlug(detail.slug);
        setRepositoryTitle(detail.title);
        setFullAudioUrl(detail.full_audio_url ?? null);
        setHasActiveSession(!!detail.active_session_id);
        setQuestions(mapped);
        if (mapped.length === 0) {
          setLoadError("Hiện tại chưa có bộ đề thi thử mới đúng.");
          return;
        }

        // Resume session nếu URL có ?session=xxx
        const sid = Number(sessionParam);
        if (Number.isFinite(sid) && sid > 0 && hydratedRef.current !== sid) {
          try {
            const state = await getExamSession(sid);
            if (!active) return;
            // Chỉ apply nếu session khớp đúng repository đang load.
            if (state.repository_slug === detail.slug) {
              hydratedRef.current = sid;
              applySessionState(state, mapped);
            } else {
              // Slug không khớp → xoá query param để tránh confusion.
              setSearchParams({}, { replace: true });
            }
          } catch {
            // Session không tồn tại / không thuộc user → bỏ qua, ở lại intro.
            setSearchParams({}, { replace: true });
          }
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
    // sessionParam intentionally tracked: nếu user paste link có ?session=xxx
    // thì phải hydrate ngay.
  }, [resolvedExamType, sessionParam, applySessionState, setSearchParams]);

  const [toeicScoreState, setToeicScoreState] = useState<{
    currentScore: number;
    targetScore: number;
    isUnlocked: boolean;
    loading: boolean;
    unmetReasons: string[];
  }>({
    currentScore: 300,
    targetScore: 650,
    isUnlocked: false,
    loading: true,
    unmetReasons: [],
  });

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    Promise.all([
      getToeicReservePoints().catch(() => null),
      getToeicPlanSync().catch(() => null),
    ]).then(([reserveData, planData]) => {
      if (cancelled) return;

      const profile = getToeicIntakeProfile();
      // baseScore = skill_baseline ONLY if the student has already taken that skill's exam.
      // Before first exam: baseScore = 0 (practice score grows purely from earned points).
      // After exam at X: baseScore = X (so practice score continues from the exam result).
      let baseScore: number;
      if (planData) {
        if (isListening) {
          const examTaken = planData.has_taken_listening_exam ?? false;
          baseScore = examTaken ? Math.round(planData.listening_baseline ?? 0) : 0;
        } else {
          const examTaken = planData.has_taken_reading_exam ?? false;
          baseScore = examTaken ? Math.round(planData.reading_baseline ?? 0) : 0;
        }
      } else {
        baseScore = 0;
      }
      // Per-skill target = full target_score. Each skill independently needs to reach it.
      const totalTarget = planData?.target_score ?? (profile?.milestoneState.targetScore ?? 650);
      const targetScore = totalTarget;

      const LISTENING_PARTS = [1, 2, 3, 4];
      const READING_PARTS = [5, 6, 7];
      const skillParts = isListening ? LISTENING_PARTS : READING_PARTS;
      const lastSkillPart = skillParts[skillParts.length - 1]; // 4 or 7

      let finalScore = baseScore;
      let lastPartCompleted = false;

      if (reserveData) {
        const completedParts = new Set(
          Array.isArray(reserveData.completed_parts)
            ? reserveData.completed_parts
            : [],
        );

        // Flat +5/question: sum earned_points across all sessions for this skill
        const sessions: { toeic_part: number; earned_points: number }[] =
          reserveData.part_sessions ?? [];
        const earnedByPart: Record<number, number> = {};
        for (const s of sessions) {
          if (skillParts.includes(s.toeic_part)) {
            earnedByPart[s.toeic_part] = Math.max(
              earnedByPart[s.toeic_part] ?? 0,
              s.earned_points ?? 0,
            );
          }
        }
        const totalEarned = Object.values(earnedByPart).reduce((a, b) => a + b, 0);
        finalScore = baseScore + totalEarned;

        // Last part must be completed (has a session entry)
        lastPartCompleted = completedParts.has(lastSkillPart);
      }

      // All 3 criteria: score >= target AND last practice part is unlocked AND completed
      const allPartsBeforeLastCompleted = isListening
        ? [1, 2, 3].every((p) =>
          (reserveData?.completed_parts ?? []).includes(p),
        )
        : [5, 6].every((p) =>
          (reserveData?.completed_parts ?? []).includes(p),
        );

      const reasons: string[] = [];
      if (finalScore < targetScore) {
        reasons.push(`Điểm ôn tập hiện tại của bạn (${finalScore}) chưa đạt mục tiêu (${targetScore} điểm).`);
      }
      if (!allPartsBeforeLastCompleted) {
        reasons.push(
          isListening
            ? "Bạn chưa hoàn thành các phần luyện tập trước đó (Part 1, Part 2, Part 3)."
            : "Bạn chưa hoàn thành các phần luyện tập trước đó (Part 5, Part 6)."
        );
      }
      if (!lastPartCompleted) {
        reasons.push(`Bạn chưa hoàn thành lượt luyện tập của phần cuối cùng (Part ${lastSkillPart}).`);
      }

      setToeicScoreState({
        currentScore: finalScore,
        targetScore,
        isUnlocked: reasons.length === 0,
        loading: false,
        unmetReasons: reasons,
      });
    }).catch(() => {
      if (cancelled) return;
      setToeicScoreState({
        currentScore: 300,
        targetScore: 650,
        isUnlocked: false,
        loading: false,
        unmetReasons: ["Không thể kết nối hoặc tải thông tin tiến độ từ hệ thống."],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Tick mỗi giây để render countdown. Giá trị `timeLeft` luôn được tính lại
  // từ `serverStartedAt + serverDurationSec - now` để bền với F5.
  useEffect(() => {
    if (phase !== "exam" || !serverStartedAt) return;
    const id = setInterval(() => setTickNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase, serverStartedAt]);

  const timeLeft = useMemo(() => {
    if (!serverStartedAt || serverDurationSec <= 0) return examDurationSeconds;
    const elapsed = Math.floor((tickNow - serverStartedAt) / 1000);
    return Math.max(0, serverDurationSec - elapsed);
  }, [serverStartedAt, serverDurationSec, tickNow, examDurationSeconds]);

  const partsInfo = useMemo(() => getPartsInfo(questions), [questions]);
  const answerKeyMissingCount = useMemo(
    () => questions.filter((q) => q.correctAnswer === null).length,
    [questions],
  );
  const gradableTotal = useMemo(
    () => questions.filter((q) => q.correctAnswer !== null).length,
    [questions],
  );

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const correctCount = useMemo(() => {
    return questions.filter((q, idx) => {
      if (q.correctAnswer === null) return false;
      return answers[idx] === q.correctAnswer;
    }).length;
  }, [questions, answers]);

  const handleStartExam = useCallback(async () => {
    if (!repositorySlug) return;
    try {
      const state = await startExamSession(repositorySlug, examDurationSeconds);
      setSessionId(state.session_id);
      setServerStartedAt(new Date(state.started_at).getTime());
      setServerDurationSec(state.duration_sec);
      setCurrentIndex(state.current_index ?? 0);

      // Hydrate answer đã có (nếu resume từ phiên cũ).
      const idToIndex = new Map<number, number>();
      questions.forEach((q, idx) => {
        const numId = Number(q.id);
        if (Number.isFinite(numId)) idToIndex.set(numId, idx);
      });
      const mapped: Record<number, AnswerKey> = {};
      for (const ans of state.answers) {
        const idx = idToIndex.get(ans.question_id);
        if (idx === undefined) continue;
        if (
          ans.selected_key === "A" ||
          ans.selected_key === "B" ||
          ans.selected_key === "C" ||
          ans.selected_key === "D"
        ) {
          mapped[idx] = ans.selected_key;
        }
      }
      setAnswers(mapped);

      // Đẩy session_id vào URL để F5 vẫn resume được.
      setSearchParams(
        { session: String(state.session_id) },
        { replace: true },
      );
      setPhase(state.submitted_at ? "summary" : "exam");
    } catch (err) {
      const typedErr = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const message =
        typedErr?.response?.data?.message ||
        typedErr?.message ||
        "Không thể bắt đầu phiên thi.";
      setLoadError(Array.isArray(message) ? message.join(" ") : String(message));
    }
  }, [repositorySlug, examDurationSeconds, questions, setSearchParams]);

  const handleSelectAnswer = useCallback(
    (key: AnswerKey) => {
      setAnswers((prev) => ({ ...prev, [currentIndex]: key }));

      // Persist lên server. Fire-and-forget; nếu lỗi mạng UI vẫn giữ lựa chọn,
      // user có thể nộp bài và server sẽ chấm theo bản DB hiện tại.
      const q = questions[currentIndex];
      const numId = q ? Number(q.id) : NaN;
      if (sessionId && Number.isFinite(numId)) {
        upsertExamAnswer(sessionId, {
          question_id: numId,
          selected_key: key,
        }).catch(() => {
          /* swallow — UX không nên chặn vì lỗi network thoáng qua */
        });
      }
    },
    [answers, currentIndex, questions, sessionId],
  );

  const handleSubmit = useCallback(async () => {
    if (!resolvedExamType) return;
    let serverScore: number | null = null;
    let serverCorrect: number | null = null;
    let serverTotal: number | null = null;

    if (sessionId) {
      try {
        const result = await submitExamSession(sessionId, "manual");
        serverScore = result.total_score;
        serverCorrect = result.correct_count;
        serverTotal = result.total_count;
      } catch {
        /* nếu API lỗi vẫn fallback sang chấm phía client */
      }
    }

    const finalCorrect = serverCorrect ?? correctCount;
    const finalTotal = serverTotal ?? gradableTotal;
    const finalScore = serverScore ?? calcScore(correctCount, gradableTotal);

    const result: ExamResult = {
      examType: resolvedExamType,
      score: finalScore,
      correctCount: finalCorrect,
      totalCount: finalTotal,
      completedAt: new Date().toISOString(),
      repositorySlug: repositorySlug || "unknown",
    };

    try {
      const resultsKey = getResultsStorageKey(userId);
      const existing: ExamResult[] = JSON.parse(
        localStorage.getItem(resultsKey) ?? "[]",
      );
      existing.push(result);
      localStorage.setItem(resultsKey, JSON.stringify(existing));
    } catch {
      localStorage.setItem(getResultsStorageKey(userId), JSON.stringify([result]));
    }

    setPhase("summary");
  }, [
    correctCount,
    gradableTotal,
    repositorySlug,
    resolvedExamType,
    sessionId,
  ]);

  // Auto-submit khi server-driven timer hết.
  useEffect(() => {
    if (phase !== "exam") return;
    if (!serverStartedAt) return;
    if (timeLeft > 0) return;
    void handleSubmit();
  }, [phase, serverStartedAt, timeLeft, handleSubmit]);

  const handleRetry = useCallback(() => {
    // "Thi lại" = reset về intro, xoá session khỏi URL. User bấm Bắt đầu thi
    // sẽ tạo session mới ở backend.
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers({});
    setSessionId(null);
    setServerStartedAt(null);
    setServerDurationSec(0);
    setAudioConfirmed(false);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

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

  if (toeicScoreState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">
              Đang xác thực điều kiện tham gia thi...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!toeicScoreState.isUnlocked) {
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
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm text-left space-y-2">
              <p className="font-bold text-center mb-1 text-red-800">Các điều kiện cần hoàn thành:</p>
              {toeicScoreState.unmetReasons.map((reason, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="text-red-500 font-bold shrink-0">•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Điểm hiện tại: <strong className="text-slate-800">{toeicScoreState.currentScore}</strong> / {toeicScoreState.targetScore} điểm.
            </p>
            <button
              onClick={handleGoToMap}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <MapIcon className="w-4 h-4" />
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
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
              TOEIC {isListening ? "Listening" : "Reading"} Exam
            </h1>

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
              {hasActiveSession ? "Tiếp tục bài thi" : "Bắt đầu thi"}
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
                  className={`bg-white border border-gray-200 shadow-sm rounded-xl p-4 border-l-4 ${!hasOfficialAnswer
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
                          className={`px-3 py-2 rounded-lg text-sm border ${right
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
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={handleGoToMap}
              className="w-full sm:w-1/2 py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MapIcon className="w-4 h-4" />
              Về map luyện tập
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
            className={`font-mono text-sm font-bold inline-flex items-center gap-1 whitespace-nowrap ${timeLeft <= 60 ? "text-red-500" : "text-teal-600"
              }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Continuous audio player for Listening exam */}
        {isListening && fullAudioUrl && (
          <div className="max-w-5xl mx-auto px-4 py-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-xs font-semibold text-teal-700 shrink-0">LISTENING</span>
              <div className="flex-1">
                <NoSeekAudioPlayer
                  src={buildAssetUrl(fullAudioUrl)}
                  autoPlay={audioConfirmed}
                  noPause={audioConfirmed}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio confirmation overlay for Listening */}
      {isListening && fullAudioUrl && !audioConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Sẵn sàng bắt đầu phần Listening?
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Audio sẽ phát <span className="font-semibold text-gray-800">liên tục và không thể dừng lại</span>, giống như bài thi TOEIC thật.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Hãy đảm bảo bạn đã đeo tai nghe và sẵn sàng trước khi bấm nút bên dưới.
            </p>
            <button
              onClick={() => setAudioConfirmed(true)}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Bắt đầu phát audio
            </button>
          </div>
        </div>
      )}

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
                  src={buildAssetUrl(currentQuestion.imageUrl)}
                  alt="Part 1 photograph"
                  className="max-h-64 rounded-lg border border-gray-200 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            {/* Per-question audio player (only when NO full audio is available) */}
            {!fullAudioUrl &&
              currentQuestion.part !== undefined &&
              currentQuestion.part <= 4 &&
              currentQuestion.audioUrl && (
                <div className="mb-4">
                  <NoSeekAudioPlayer
                    key={currentQuestion.id + "-audio"}
                    src={buildAssetUrl(currentQuestion.audioUrl)}
                  />
                </div>
              )}
            <p className="text-gray-900 text-lg font-semibold mb-4">
              {currentQuestion.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((opt) => {
                const selected = answers[currentIndex];
                const isSelected = selected === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectAnswer(opt.key)}
                    className={`text-left px-4 py-3 rounded-xl border transition-colors ${isSelected
                        ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                        : "bg-white border-gray-300 text-gray-800 hover:border-teal-500 hover:bg-teal-50"
                      }`}
                  >
                    <span className="font-bold mr-2">{opt.key}.</span>
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {/* Part 1/2 notice: options are audio-only, no text needed */}
            {currentQuestion.part <= 2 && examType === "listening" && (
              <p className="text-xs text-gray-400 mt-2 italic">
                Chọn đáp án phù hợp với nội dung âm thanh bạn nghe được.
              </p>
            )}
            {hasAnswered && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400" />
                Bạn đã chọn đáp án {answers[currentIndex]}. Bạn có thể đổi đáp án
                trước khi nộp bài.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              const next = Math.max(0, currentIndex - 1);
              setCurrentIndex(next);
              if (sessionId) {
                updateExamCursor(sessionId, next).catch(() => undefined);
              }
            }}
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
              onClick={() => {
                const next = Math.min(totalQuestions - 1, currentIndex + 1);
                setCurrentIndex(next);
                if (sessionId) {
                  updateExamCursor(sessionId, next).catch(() => undefined);
                }
              }}
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
