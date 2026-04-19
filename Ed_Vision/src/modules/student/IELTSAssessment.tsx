import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";
import {
  BookOpen,
  ChevronRight,
  Clock,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  abandonPlacementSession,
  getPlacementResult,
  startPlacementTest,
  submitPlacementAnswer,
  type PlacementQuestionPayload,
  type PlacementResult,
} from "@/services/api/placementService";

type ViewType = "intro" | "test";
const IELTS_SURVEY_KEY = "ieltsSurveyCompleted";

type OptionChoice = {
  value: string;
  label: string;
  badge?: string;
};

const TOTAL_QUESTIONS = 10;

function OwlMascot() {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 animate-float">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-accent/20 rounded-full blur-3xl scale-150" />

      <svg
        viewBox="0 0 200 200"
        className="relative w-full h-full drop-shadow-2xl"
        aria-label="PREDICA Owl Mascot"
      >
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.55 0.22 285)" />
            <stop offset="100%" stopColor="oklch(0.45 0.25 285)" />
          </linearGradient>
          <linearGradient id="bellyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.95 0.02 285)" />
            <stop offset="100%" stopColor="oklch(0.9 0.03 285)" />
          </linearGradient>
          <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.92 0.16 85)" />
            <stop offset="100%" stopColor="oklch(0.85 0.18 85)" />
          </linearGradient>
        </defs>

        <path
          d="M55 55 L45 25 L70 50 Z"
          fill="url(#bodyGradient)"
          className="animate-wiggle origin-bottom"
          style={{ transformBox: "fill-box" }}
        />
        <path
          d="M145 55 L155 25 L130 50 Z"
          fill="url(#bodyGradient)"
          className="animate-wiggle origin-bottom"
          style={{ transformBox: "fill-box", animationDelay: "0.5s" }}
        />

        <ellipse cx="100" cy="115" rx="55" ry="65" fill="url(#bodyGradient)" />
        <ellipse cx="100" cy="130" rx="35" ry="40" fill="url(#bellyGradient)" />

        <g fill="oklch(0.85 0.04 285)" opacity="0.5">
          <path d="M85 110 Q100 115 115 110 Q100 120 85 110" />
          <path d="M80 125 Q100 130 120 125 Q100 135 80 125" />
          <path d="M82 140 Q100 145 118 140 Q100 150 82 140" />
          <path d="M85 155 Q100 160 115 155 Q100 165 85 155" />
        </g>

        <ellipse cx="72" cy="85" rx="22" ry="24" fill="url(#eyeGradient)" />
        <ellipse cx="128" cy="85" rx="22" ry="24" fill="url(#eyeGradient)" />

        <ellipse
          cx="72"
          cy="85"
          rx="22"
          ry="24"
          fill="none"
          stroke="oklch(0.45 0.25 285)"
          strokeWidth="3"
        />
        <ellipse
          cx="128"
          cy="85"
          rx="22"
          ry="24"
          fill="none"
          stroke="oklch(0.45 0.25 285)"
          strokeWidth="3"
        />

        <g className="animate-blink origin-center" style={{ transformBox: "fill-box" }}>
          <circle cx="75" cy="88" r="10" fill="oklch(0.2 0.02 285)" />
          <circle cx="131" cy="88" r="10" fill="oklch(0.2 0.02 285)" />
          <circle cx="78" cy="84" r="4" fill="white" opacity="0.9" />
          <circle cx="134" cy="84" r="4" fill="white" opacity="0.9" />
          <circle cx="72" cy="90" r="2" fill="white" opacity="0.5" />
          <circle cx="128" cy="90" r="2" fill="white" opacity="0.5" />
        </g>

        <path
          d="M100 98 L92 115 L100 120 L108 115 Z"
          fill="oklch(0.75 0.15 60)"
        />
        <path
          d="M100 98 L100 120 L108 115 Z"
          fill="oklch(0.65 0.12 60)"
        />

        <g className="origin-center" style={{ transformBox: "fill-box" }}>
          <polygon points="100,35 45,55 100,70 155,55" fill="oklch(0.2 0.02 285)" />
          <rect x="75" y="40" width="50" height="15" fill="oklch(0.25 0.02 285)" />
          <line
            x1="155"
            y1="55"
            x2="165"
            y2="70"
            stroke="oklch(0.85 0.18 85)"
            strokeWidth="2"
          />
          <rect x="162" y="70" width="8" height="15" rx="2" fill="oklch(0.85 0.18 85)" />
          <rect x="161" y="68" width="10" height="4" rx="1" fill="oklch(0.75 0.15 85)" />
        </g>

        <ellipse cx="48" cy="120" rx="12" ry="25" fill="oklch(0.5 0.2 285)" />
        <ellipse cx="152" cy="120" rx="12" ry="25" fill="oklch(0.5 0.2 285)" />

        <g fill="oklch(0.75 0.15 60)">
          <ellipse cx="80" cy="178" rx="12" ry="6" />
          <ellipse cx="120" cy="178" rx="12" ry="6" />
        </g>
      </svg>

      <Sparkles
        className="absolute -top-2 -right-2 w-6 h-6 text-accent animate-pulse"
        style={{ animationDelay: "0.2s" }}
      />
      <Sparkles
        className="absolute top-1/4 -left-4 w-5 h-5 text-primary/60 animate-pulse"
        style={{ animationDelay: "0.8s" }}
      />
      <Sparkles
        className="absolute bottom-1/4 -right-4 w-4 h-4 text-accent/80 animate-pulse"
        style={{ animationDelay: "1.2s" }}
      />
    </div>
  );
}

// Intro View Component
const IELTSIntroView: React.FC<{
  onStart: () => void;
  isLoading: boolean;
  error?: string | null;
}> = ({ onStart, isLoading, error }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F3FF] via-[#EEF2FF] to-[#E0F2FE] flex flex-col overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[820px] h-[820px] bg-gradient-to-br from-[#A78BFA]/25 via-[#C7D2FE]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-[640px] h-[640px] bg-gradient-to-tr from-[#E0E7FF]/40 via-[#BAE6FD]/25 to-transparent rounded-full blur-3xl" />
      </div>

      <header className="relative w-full px-6 py-5 animate-fade-in">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-lg shadow-[#4F46E5]/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#0F172A] tracking-tight">PREDICA</span>
          </div>
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="flex-shrink-0 animate-scale-in" style={{ animationDelay: "100ms" }}>
              <OwlMascot />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#EEF2FF] text-[#4338CA] rounded-full mb-6 animate-slide-up"
                style={{ animationDelay: "200ms" }}
              >
                <Sparkles className="w-4 h-4 text-[#6366F1]" />
                <span className="text-sm font-semibold">IELTS Placement Test</span>
              </div>

              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F172A] tracking-tight text-balance leading-[1.1] animate-slide-up"
                style={{ animationDelay: "300ms" }}
              >
                Khám phá năng lực <span className="text-[#7C3AED]">IELTS</span> của bạn
              </h1>

              <p
                className="mt-6 text-lg md:text-xl text-[#475569] leading-relaxed text-pretty max-w-xl mx-auto lg:mx-0 animate-slide-up"
                style={{ animationDelay: "400ms" }}
              >
                Mỗi hành trình đều bắt đầu từ việc biết mình đang đứng ở đâu. Hãy để
                PREDICA đo đúng năng lực của bạn — để lộ trình phía trước không lãng phí
                một ngày nào.
              </p>

              <div
                className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 animate-slide-up"
                style={{ animationDelay: "500ms" }}
              >
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/90 border border-white/60 rounded-full shadow-sm">
                  <HelpCircle className="w-4 h-4 text-[#7C3AED]" />
                  <span role="img" aria-label="quiz" className="text-lg">
                    🧠
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/90 border border-white/60 rounded-full shadow-sm">
                  <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
                  <span role="img" aria-label="levels" className="text-lg">
                    🚀
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/90 border border-white/60 rounded-full shadow-sm">
                  <Clock className="w-4 h-4 text-[#7C3AED]" />
                  <span role="img" aria-label="timer" className="text-lg">
                    ⏱️
                  </span>
                </div>
              </div>

              <div
                className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up"
                style={{ animationDelay: "600ms" }}
              >
                <Button
                  size="lg"
                  onClick={onStart}
                  disabled={isLoading}
                  className="group px-8 py-6 text-base font-semibold rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xl shadow-[#7C3AED]/30 transition-all duration-300 hover:shadow-2xl hover:shadow-[#7C3AED]/40 hover:scale-105 animate-pulse-glow"
                >
                  {isLoading ? "Đang tải..." : "Bắt đầu kiểm tra"}
                  <span className="ml-2 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Button>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer className="mt-12" />
    </div>
  );
};

// Test View Component
const IELTSTestView: React.FC<{
  nextPath: string;
  sessionId: string;
  firstQuestion: PlacementQuestionPayload;
  onRetake: () => void;
}> = ({ nextPath, sessionId, firstQuestion, onRetake }) => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<PlacementQuestionPayload>(firstQuestion);
  const [timeLeft, setTimeLeft] = useState(firstQuestion.timeLimitSec || 60);
  const [isFinished, setIsFinished] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [freeTextAnswer, setFreeTextAnswer] = useState("");

  const progressPercentage = (currentQuestion.progress.current / TOTAL_QUESTIONS) * 100;
  const timerLabel = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(
    timeLeft % 60,
  ).padStart(2, "0")}`;
  const completionPercent = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
  const ringAngle = Math.max(12, Math.round((answeredCount / TOTAL_QUESTIONS) * 360));

  const predictedBand = result ? Number(result.finalBand).toFixed(1) : "--";

  const levelText =
    completionPercent >= 80
      ? "Upper Intermediate"
      : completionPercent >= 60
        ? "Intermediate"
        : completionPercent >= 40
          ? "Pre-Intermediate"
          : "Elementary";

  const levelDescription =
    completionPercent >= 80
      ? "Bạn có nền tảng tốt, có thể tăng tốc để chinh phục band mục tiêu."
      : completionPercent >= 60
        ? "Bạn có nền tảng ổn định, cần luyện sâu thêm theo từng kỹ năng."
        : completionPercent >= 40
          ? "Bạn đang ở mức trung bình, nên tập trung củng cố nền tảng trước."
          : "Bạn có kiến thức cơ bản, cần phát triển thêm.";

  // Timer logic
  useEffect(() => {
    if (isFinished || isSubmitting) return;
    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          void submitCurrentAnswer("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isSubmitting, currentQuestion.id]);

  const options = useMemo<OptionChoice[]>(() => {
    if (!Array.isArray(currentQuestion.options)) return [];

    return (currentQuestion.options as unknown[]).reduce<OptionChoice[]>((acc, item, idx) => {
        if (typeof item === "string") {
          const m = item.match(/^([A-D])\.\s*(.*)$/i);
          if (m) {
            acc.push({ value: m[1].toUpperCase(), label: m[2], badge: m[1].toUpperCase() });
            return acc;
          }
          acc.push({ value: item, label: item, badge: String(idx + 1) });
          return acc;
        }

        if (item && typeof item === "object") {
          const obj = item as { id?: string; text?: string };
          if (obj.id && obj.text) {
            acc.push({ value: obj.id, label: obj.text, badge: obj.id });
          }
        }

        return acc;
      }, []);
  }, [currentQuestion.options]);

  const isGapFill = currentQuestion.questionType === "gap_fill";

  const submitCurrentAnswer = async (answer: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const elapsedSec = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
      const res = await submitPlacementAnswer({
        sessionId,
        questionId: currentQuestion.id,
        userAnswer: answer,
        timeTakenSec: elapsedSec,
      });

      setAnsweredCount(res.progress.current);

      if (!res.nextQuestion) {
        try {
          window.localStorage.setItem(IELTS_SURVEY_KEY, "true");
        } catch {
          // ignore storage errors
        }
        const finalResult = await getPlacementResult(sessionId);
        setResult(finalResult);
        setIsFinished(true);
        return;
      }

      setCurrentQuestion(res.nextQuestion);
      setTimeLeft(res.nextQuestion.timeLimitSec || 60);
      setQuestionStartedAt(Date.now());
      setFreeTextAnswer("");
    } catch {
      // keep UI stable if submit fails
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = async () => {
    try {
      if (!isFinished) {
        await abandonPlacementSession(sessionId);
      }
    } catch {
      // ignore abandon failures
    }
    onRetake();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDE9FE] via-[#EEF2FF] to-[#ECFEFF] flex flex-col">
      {!isFinished && (
        <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444] text-white text-sm font-semibold shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                Còn lại {timerLabel}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="relative flex-1 h-2 rounded-full bg-slate-200 overflow-visible">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-base transition-all duration-500"
                  style={{ left: `clamp(0px, calc(${progressPercentage}% - 10px), calc(100% - 20px))` }}
                >
                  <span role="img" aria-label="owl">🦉</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-500 whitespace-nowrap">
                {currentQuestion.progress.current}/{TOTAL_QUESTIONS} câu
              </p>
            </div>
          </div>
        </header>
      )}

      <main className={`${isFinished ? "pt-6" : "pt-24"} pb-6 px-4 flex-1`}>
        <div className={`${isFinished ? "max-w-4xl" : "max-w-2xl"} mx-auto`}>
          {isFinished ? (
            <section className="px-1 sm:px-0 max-w-xl mx-auto">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-3">
                  <Trophy className="w-8 h-8 text-violet-600" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">Kết quả của bạn</h2>
                <p className="mt-1 text-base text-slate-500">Bài kiểm tra đã hoàn thành</p>
              </div>

              <div className="bg-white/95 rounded-3xl border border-violet-100 p-5 sm:p-6 shadow-lg text-center">
                <div className="mx-auto mb-4 w-36 h-36 relative flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#7C3AED ${ringAngle}deg, #E5E7EB ${ringAngle}deg)`,
                    }}
                  />
                  <div className="absolute inset-[10px] rounded-full bg-white" />
                  <div className="relative z-10 text-center">
                    <div className="text-4xl font-bold text-slate-900 leading-none">{answeredCount}</div>
                    <div className="text-xl text-slate-500 mt-1">/ {TOTAL_QUESTIONS}</div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 font-semibold text-base mb-3">
                  <span>◎</span>
                  Band dự đoán: {predictedBand}
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-1.5">{levelText}</h3>
                <p className="text-sm text-slate-500">{levelDescription}</p>
              </div>

              <div className="mt-4 space-y-2.5">
                <button
                  onClick={() => {
                    const separator = nextPath.includes("?") ? "&" : "?";
                    navigate(`${nextPath}${separator}currentBand=${encodeURIComponent(predictedBand)}`);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-lg font-semibold hover:from-violet-700 hover:to-purple-700 transition shadow-lg"
                >
                  <BookOpen className="w-4.5 h-4.5" />
                  Xem lộ trình học tập
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>

                <button
                  onClick={handleRetake}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-lg font-semibold hover:bg-slate-50 transition"
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                  Làm lại bài kiểm tra
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 mt-4">Kết quả chỉ mang tính chất tham khảo</p>
            </section>
          ) : (
            <>
              <div className="bg-white/95 rounded-2xl border border-violet-100 p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentQuestion.questionText}
                </h2>
              </div>

              {isGapFill ? (
                <div className="mt-4 space-y-3">
                  <input
                    value={freeTextAnswer}
                    onChange={(e) => setFreeTextAnswer(e.target.value)}
                    placeholder="Nhập câu trả lời..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white"
                    disabled={isSubmitting}
                  />
                  <Button
                    onClick={() => void submitCurrentAnswer(freeTextAnswer)}
                    disabled={isSubmitting || !freeTextAnswer.trim()}
                    className="w-full rounded-xl bg-violet-600 hover:bg-violet-700"
                  >
                    {isSubmitting ? "Đang gửi..." : "Gửi câu trả lời"}
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {options.map((option) => (
                    <button
                      key={`${currentQuestion.id}-${option.value}`}
                      onClick={() => void submitCurrentAnswer(option.value)}
                      disabled={isSubmitting}
                      className="w-full flex items-center gap-3 rounded-xl border border-white/60 bg-white/90 p-4 text-left transition shadow-sm hover:shadow-md disabled:opacity-60"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 text-base font-semibold flex items-center justify-center">
                        {option.badge ?? "•"}
                      </div>
                      <span className="text-base text-gray-700">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer className="mt-6" />
    </div>
  );
};

// Main Component
const IELTSAssessment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>("intro");
  const [isLoading, setIsLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [firstQuestion, setFirstQuestion] = useState<PlacementQuestionPayload | null>(null);

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("next") || "/student/certificate-review/ielts";
  }, [location.search]);

  const accountId = useMemo(() => {
    const raw = user?.account_id ?? user?.accountId ?? user?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [user]);

  const handleStartTest = async () => {
    if (!accountId) {
      setStartError("Không xác định được tài khoản để bắt đầu bài test.");
      return;
    }

    setStartError(null);
    setIsLoading(true);
    try {
      const started = await startPlacementTest({
        accountId,
        skillsToTest: ["vocabulary", "reading", "listening", "writing", "speaking"],
      });

      setSessionId(started.sessionId);
      setFirstQuestion(started.firstQuestion);
      setIsLoading(false);
      setCurrentView("test");
    } catch (e) {
      setIsLoading(false);
      const err = e as {
        message?: string;
        response?: { data?: { error?: string; message?: string } };
      };

      const serverMessage = err.response?.data?.error || err.response?.data?.message;
      const networkMessage = err.message?.toLowerCase().includes("network")
        ? "Không kết nối được backend placement test. Hãy kiểm tra API server đang chạy và VITE_API_BASE_URL."
        : null;

      setStartError(
        serverMessage ||
          networkMessage ||
          "Không thể bắt đầu bài test. Vui lòng thử lại sau.",
      );
    }
  };

  if (currentView === "intro") {
    return <IELTSIntroView onStart={() => void handleStartTest()} isLoading={isLoading} error={startError} />;
  }

  if (!sessionId || !firstQuestion) {
    navigate(nextPath);
    return null;
  }

  return (
    <IELTSTestView
      nextPath={nextPath}
      sessionId={sessionId}
      firstQuestion={firstQuestion}
      onRetake={() => {
        setSessionId(null);
        setFirstQuestion(null);
        setCurrentView("intro");
      }}
    />
  );
};

export default IELTSAssessment;
