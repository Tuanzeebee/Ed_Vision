import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";
import {
  BookOpen,
  ChevronRight,
  Clock,
  RotateCcw,
  Sparkles,
  Trophy,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Zap,
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
const TOTAL_QUESTIONS = 20;

// ── Premium Owl Mascot ─────────────────────────────────────────
function OwlMascot({ size = 40, blinking = false, excited = false, thinking = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      style={{
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: excited ? 'scale(1.1) translateY(-5px)' : thinking ? 'translateY(-10px)' : 'scale(1)',
        filter: 'drop-shadow(0 8px 12px rgba(79, 70, 229, 0.25))',
      }}
      className={thinking ? 'animate-bounce' : ''}
    >
      <defs>
        <linearGradient id="owlBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="owlWing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>
      </defs>
      {/* Body */}
      <ellipse cx="40" cy="48" rx="22" ry="26" fill="url(#owlBody)" />
      {/* Chest */}
      <ellipse cx="40" cy="54" rx="14" ry="16" fill="white" fillOpacity="0.15" />
      {/* Wings */}
      <ellipse cx="20" cy="50" rx="9" ry="15" fill="url(#owlWing)" transform="rotate(-15 20 50)" />
      <ellipse cx="60" cy="50" rx="9" ry="15" fill="url(#owlWing)" transform="rotate(15 60 50)" />
      {/* Head */}
      <ellipse cx="40" cy="28" rx="18" ry="16" fill="url(#owlBody)" />
      {/* Eyes */}
      <circle cx="32" cy="28" r="9" fill="white" />
      <circle cx="48" cy="28" r="9" fill="white" />
      {blinking ? (
        <>
          <rect x="27" y="27" width="10" height="2" rx="1" fill="#1E1B4B" />
          <rect x="43" y="27" width="10" height="2" rx="1" fill="#1E1B4B" />
        </>
      ) : (
        <>
          <circle cx="33" cy="28" r="5" fill="#1E1B4B" />
          <circle cx="49" cy="28" r="5" fill="#1E1B4B" />
          <circle cx="35" cy="26" r="2.5" fill="white" opacity="0.9" />
          <circle cx="51" cy="26" r="2.5" fill="white" opacity="0.9" />
        </>
      )}
      {/* Beak */}
      <path d="M40 38 L36 32 L44 32 Z" fill="#F59E0B" />
      {/* Feet */}
      <rect x="32" y="70" width="4" height="6" rx="2" fill="#F59E0B" />
      <rect x="44" y="70" width="4" height="6" rx="2" fill="#F59E0B" />
    </svg>
  );
}

// ── Glow Progress Bar ─────────────────────────────────────────
function OwlProgressBar({ current, total, thinking = false }: { current: number; total: number; thinking?: boolean }) {
  const pct = (current / total) * 100;
  const [blinking, setBlinking] = useState(false);
  const [excited, setExcited] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setExcited(true);
    const t1 = setTimeout(() => setExcited(false), 500);
    const blink = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 4000);

    // Milestone logic
    if (current === 5) setMessage("Khởi đầu ấn tượng! 🚀");
    else if (current === 10) setMessage("Tuyệt vời, đã đi được nửa đường! 🔥");
    else if (current === 15) setMessage("Sắp về đích rồi, cố lên! ✨");
    else if (thinking) setMessage("Đang suy nghĩ à? Cố lên nào! 💪");
    else setMessage(null);

    // Hide message after 4s unless it's the thinking message
    if (!thinking && message && message !== "Đang suy nghĩ à? Cố lên nào! 💪") {
      const t2 = setTimeout(() => setMessage(null), 4000);
      return () => { clearTimeout(t1); clearInterval(blink); clearTimeout(t2); };
    }

    return () => { clearTimeout(t1); clearInterval(blink); };
  }, [current, thinking]);

  return (
    <div className="w-full px-4 pt-14 pb-2">
      <div className="relative h-2 bg-indigo-100 rounded-full overflow-visible">
        {/* Glow track */}
        <div
          className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)] transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        {/* Milestone dots */}
        {[5, 10, 15].map(m => (
          <div key={m}
            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white transition-colors duration-500 z-10`}
            style={{
              left: `${(m / total) * 100}%`,
              backgroundColor: current >= m ? '#4F46E5' : '#C7D2FE'
            }}
          />
        ))}
        {/* Moving Owl */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20"
          style={{ left: `${Math.min(pct, 97)}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="relative">
            {/* Speech Bubble */}
            {message && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '70%',
                transform: 'translateX(-50%) rotate(8deg) translateZ(0)',
                marginBottom: '10px',
                animation: 'bubblePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                zIndex: 50,
                WebkitFontSmoothing: 'antialiased',
                backfaceVisibility: 'hidden'
              }}>
                <div style={{
                  background: '#4F46E5',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '900',
                  padding: '5px 10px',
                  borderRadius: '12px 12px 12px 2px',
                  whiteSpace: 'nowrap',
                  boxShadow: '4px 4px 0px rgba(79, 70, 229, 0.2)',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.4)',
                  lineHeight: '1.2'
                }}>
                  {message}
                </div>
              </div>
            )}

            <OwlMascot size={42} blinking={blinking} excited={excited} thinking={thinking} />
            {/* Pulsing light behind owl */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-400/20 rounded-full blur-xl animate-pulse -z-10" />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bubblePop {
          0% { opacity: 0; transform: translateX(-50%) rotate(8deg) scale(0.5); }
          100% { opacity: 1; transform: translateX(-50%) rotate(8deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Glass Timer Component ─────────────────────────────────────
function Timer({ seconds, onExpire, resetKey }: { seconds: number; onExpire?: () => void; resetKey: any }) {
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef<any>(null);

  useEffect(() => { setRemaining(seconds); }, [seconds, resetKey]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          if (onExpire) onExpire();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [seconds, resetKey]);

  const urgent = remaining <= 15;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${urgent
      ? 'bg-red-50/80 border-red-200 text-red-600 shadow-lg shadow-red-500/10'
      : 'bg-indigo-50/80 border-indigo-100 text-indigo-700 shadow-lg shadow-indigo-500/10'
      }`}>
      <div className="relative w-5 h-5">
        <Clock className={`w-5 h-5 ${urgent ? 'animate-pulse' : ''}`} />
      </div>
      <span className="font-mono text-base font-bold tabular-nums tracking-wider">
        {mm}:{ss}
      </span>
    </div>
  );
}

// ── Premium Skill Card ────────────────────────────────────────
function SkillCard({ skill, band, isStrength, isWeakness }: { skill: string; band: number; isStrength: boolean; isWeakness: boolean }) {
  const labels: any = { reading: 'Reading', listening: 'Listening', writing: 'Writing', speaking: 'Speaking', vocabulary: 'Vocabulary' };
  const icons: any = {
    reading: <BookOpen className="w-5 h-5" />,
    listening: <Zap className="w-5 h-5" />,
    writing: <RotateCcw className="w-5 h-5" />,
    speaking: <Trophy className="w-5 h-5" />,
    vocabulary: <Sparkles className="w-5 h-5" />
  };

  const statusColor = isStrength ? 'bg-emerald-500' : isWeakness ? 'bg-orange-500' : 'bg-indigo-500';
  const bgColor = isStrength ? 'bg-emerald-50' : isWeakness ? 'bg-orange-50' : 'bg-indigo-50';
  const textColor = isStrength ? 'text-emerald-700' : isWeakness ? 'text-orange-700' : 'text-indigo-700';

  return (
    <div className="group relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Abstract background shape */}
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500 ${statusColor}`} />

      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bgColor} ${textColor}`}>
          {icons[skill] || <HelpCircle className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-900">{labels[skill] || skill}</span>
            <span className={`text-lg font-black ${textColor}`}>{band?.toFixed(1) || '0.0'}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${statusColor}`}
              style={{ width: `${(band / 9) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Intro View ────────────────────────────────────────────────
const IELTSIntroView: React.FC<{ onStart: () => void; isLoading: boolean; error?: string | null }> = ({ onStart, isLoading, error }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-200/30 rounded-full blur-[120px]" />

      <header className="relative z-50 w-full px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-3 group hover:rotate-0 transition-transform duration-300">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black text-indigo-950 tracking-tighter">PREDICA</span>
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 space-y-8 text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-black text-slate-950 leading-[1.15] tracking-tight text-balance">
              Khám phá năng&nbsp;lực <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">IELTS</span> của bạn
            </h1>

            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Mỗi hành trình đều bắt đầu từ việc biết mình đang đứng ở đâu. Hãy để
              PREDICA đo đúng năng lực của bạn — để lộ trình phía trước không lãng phí
              một ngày nào.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={onStart}
                disabled={isLoading}
                className="group h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-bold shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
              >
                {isLoading ? "Đang chuẩn bị..." : "Bắt đầu kiểm tra"}
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="pt-8 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              {[
                { label: 'Time', val: '20m', icon: <Clock className="w-4 h-4 text-cyan-500" /> },
                { label: 'Items', val: '20 Qs', icon: <TrendingUp className="w-4 h-4 text-indigo-500" /> },
                { label: 'Skills', val: 'All-in', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> }
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-2xl bg-white/50 border border-white/50 shadow-sm">
                  <div className="flex justify-center mb-1">{stat.icon}</div>
                  <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                  <div className="text-sm font-black text-slate-900">{stat.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center relative">
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-[80px] -z-10 animate-pulse" />
              <OwlMascot size={320} excited />
            </div>
            {/* Floating cards */}
            <div className="absolute top-10 right-0 bg-white p-4 rounded-2xl shadow-xl border border-indigo-50 animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">8</div>
                <span className="text-sm font-bold">Bạn làm được mà! ✨</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// ── Test View Component ───────────────────────────────────────
const IELTSTestView: React.FC<{
  nextPath: string; sessionId: string; firstQuestion: PlacementQuestionPayload; onRetake: () => void;
}> = ({ nextPath, sessionId, firstQuestion, onRetake }) => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState<PlacementQuestionPayload>(firstQuestion);
  const [timeLeft, setTimeLeft] = useState(firstQuestion.timeLimitSec || 60);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  const options = useMemo(() => {
    if (!Array.isArray(currentQuestion.options)) return [];
    return currentQuestion.options.map((item: any, idx: number) => {
      if (typeof item === "string") {
        const m = item.match(/^([A-D])\.\s*(.*)$/i);
        if (m) return { value: m[1].toUpperCase(), label: m[2], badge: m[1].toUpperCase() };
        return { value: item, label: item, badge: String.fromCharCode(65 + idx) };
      }
      return { value: String(idx), label: String(item), badge: String.fromCharCode(65 + idx) };
    });
  }, [currentQuestion.options]);

  // Thinking Nudge Logic (30s)
  useEffect(() => {
    setIsThinking(false);
    const nudgeTimer = setTimeout(() => {
      setIsThinking(true);
    }, 30000);
    return () => clearTimeout(nudgeTimer);
  }, [currentQuestion.id]);

  const submitCurrentAnswer = async (answer: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const elapsedSec = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
      const res = await submitPlacementAnswer({
        sessionId, questionId: currentQuestion.id, userAnswer: answer, timeTakenSec: elapsedSec,
      });

      if (!res.nextQuestion) {
        const finalResult = await getPlacementResult(sessionId);
        setResult(finalResult);
        setIsFinished(true);
        return;
      }

      setCurrentQuestion(res.nextQuestion);
      setTimeLeft(res.nextQuestion.timeLimitSec || 60);
      setQuestionStartedAt(Date.now());
      setFreeTextAnswer("");
      setSelectedOption(null);
      setResetKey(k => k + 1);
    } catch (e) {
      setIsFinished(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFinished && result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden font-sans">
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-100/50 to-transparent -z-10" />

        <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
              <OwlMascot size={100} excited />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Chúc mừng bạn đã hoàn thành bài kiểm tra ! 🎉</h1>
            <p className="text-slate-500 font-medium italic">Bạn đã nỗ lực rất tuyệt vời. Hãy xem kết quả phân tích bên dưới nhé!</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              {/* Overall Score Card */}
              <div className="bg-white p-8 rounded-[32px] border border-indigo-100 shadow-2xl shadow-indigo-500/10 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Predicted Band</span>
                <div className="relative pt-6 pb-2">
                  <div className="text-8xl font-black text-indigo-600 tracking-tighter tabular-nums group-hover:scale-105 transition-transform duration-500">
                    {Number(result.finalBand).toFixed(1)}
                  </div>
                  <div className="mt-2 text-indigo-400 font-black tracking-[0.3em] text-[10px] uppercase">IELTS ASSESSMENT</div>
                </div>
                <div className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold inline-block shadow-lg shadow-indigo-500/30">
                  Level: {result.cefrLevel || 'B2'}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(result.skillBands || {}).map(([skill, band]: [string, any]) => (
                  <SkillCard
                    key={skill}
                    skill={skill}
                    band={Number(band)}
                    isStrength={result.patterns?.strengths?.includes(skill) ?? false}
                    isWeakness={result.patterns?.weaknesses?.includes(skill) ?? false}
                  />
                ))}
              </div>

              <div className="p-8 rounded-[32px] bg-gradient-to-br from-indigo-900 to-indigo-950 text-white shadow-2xl relative overflow-hidden group">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] -mr-32 -mt-32 rounded-full" />

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <h2 className="text-2xl font-black leading-tight">Lộ trình bứt phá dành riêng cho bạn!</h2>
                    <p className="text-indigo-200 text-sm">Mọi mục tiêu lớn đều bắt đầu từ bước đi nhỏ. PREDICA đã chuẩn bị sẵn lộ trình tối ưu để giúp bạn bứt phá band điểm ngay hôm nay!</p>
                    <Button
                      onClick={() => navigate(`${nextPath}${nextPath.includes("?") ? "&" : "?"}currentBand=${result.finalBand}`)}
                      className="h-14 px-10 bg-white text-indigo-950 hover:bg-indigo-50 rounded-2xl font-black text-base shadow-xl group-hover:scale-105 transition-all"
                    >
                      Bắt đầu học lộ trình riêng →
                    </Button>
                  </div>
                  <div className="w-40 h-40 bg-white/10 rounded-[40px] flex items-center justify-center border border-white/20 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                    <Sparkles className="w-16 h-16 text-indigo-300" />
                  </div>
                </div>
              </div>

              <button onClick={onRetake} className="w-full py-4 text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors">
                Thực hiện lại bài kiểm tra nếu bạn chưa hài lòng
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isGapFill = currentQuestion.questionType === "gap_fill";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-indigo-50 shadow-sm px-6 py-8">
        <div className="max-w-[1400px] mx-auto flex items-center gap-6 md:gap-12">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-black text-indigo-950 tracking-tighter">PREDICA</span>
          </div>

          <div className="flex-1">
            <OwlProgressBar current={currentQuestion.progress.current} total={TOTAL_QUESTIONS} thinking={isThinking} />
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm font-black text-slate-400 whitespace-nowrap">
              <span className="text-indigo-600">{currentQuestion.progress.current}</span> / {TOTAL_QUESTIONS}
            </div>
            <Timer seconds={currentQuestion.timeLimitSec || 60} resetKey={resetKey} onExpire={() => void submitCurrentAnswer(isGapFill ? freeTextAnswer : (selectedOption || ""))} />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-10">
        <div className={`grid ${currentQuestion.passage ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-10 items-start`}>
          {currentQuestion.passage && (
            <div className="bg-white rounded-[32px] border border-indigo-100 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-180px)]">
              <div className="p-8 border-b border-indigo-50 bg-indigo-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="px-4 py-1.5 rounded-full bg-white text-indigo-600 text-xs font-black uppercase tracking-widest shadow-sm border border-indigo-100">
                    {currentQuestion.contextType === 'audio' ? '🎧 Listening' : '📖 Reading'}
                  </div>
                  <h3 className="text-xl font-bold text-indigo-950 tracking-tight leading-none">{currentQuestion.passage.title}</h3>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {currentQuestion.passage.audioUrl && (
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <audio controls src={currentQuestion.passage.audioUrl} className="w-full" />
                  </div>
                )}
                <div className="text-lg leading-relaxed text-slate-700 font-serif whitespace-pre-wrap">
                  {currentQuestion.passage.content}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[32px] border border-indigo-100 shadow-xl relative group">
              {/* Decorative blue bar */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-indigo-600 rounded-r-full group-hover:h-24 transition-all duration-500" />
              <p className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                {currentQuestion.questionText}
              </p>
            </div>

            <div className="space-y-4">
              {isGapFill ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <input
                      type="text"
                      value={freeTextAnswer}
                      onChange={e => setFreeTextAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full h-20 px-8 bg-white border-2 border-indigo-50 rounded-3xl text-lg font-bold text-indigo-950 outline-none focus:border-indigo-500 focus:shadow-[0_0_0_6px_rgba(99,102,241,0.1)] transition-all placeholder:text-slate-300"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap className="w-6 h-6 text-indigo-300" />
                    </div>
                  </div>
                  <Button
                    onClick={() => void submitCurrentAnswer(freeTextAnswer)}
                    disabled={isSubmitting || !freeTextAnswer.trim()}
                    className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-lg font-black shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    {isSubmitting ? 'Processing...' : 'Xác nhận →'}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {options.map((opt: any) => {
                    const isSelected = selectedOption === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedOption(opt.value)}
                        className={`group flex items-center gap-6 p-6 rounded-3xl border-2 transition-all duration-300 ${isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/30 -translate-y-1'
                          : 'bg-white border-indigo-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
                          }`}>
                          {opt.badge}
                        </div>
                        <span className={`text-lg font-bold text-left flex-1 ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                          {opt.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-6 h-6 animate-in zoom-in duration-300" />}
                      </button>
                    );
                  })}
                  <Button
                    onClick={() => void submitCurrentAnswer(selectedOption || "")}
                    disabled={isSubmitting || !selectedOption}
                    className="mt-6 w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl text-lg font-black shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                    {isSubmitting ? 'Processing...' : 'Xác nhận →'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E0E7FF; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C7D2FE; }
        @keyframes bubblePop {
          0% { opacity: 0; transform: translateX(-50%) rotate(8deg) scale(0.5); }
          100% { opacity: 1; transform: translateX(-50%) rotate(8deg) scale(1); }
        }
      `}</style>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
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

  const handleStartTest = async () => {
    const accountId = Number(user?.account_id ?? user?.accountId ?? user?.id);
    if (!accountId) { setStartError("Invalid account."); return; }

    setIsLoading(true);
    try {
      const started = await startPlacementTest({ accountId, skillsToTest: ["vocabulary", "reading", "listening", "writing", "speaking"] });
      setSessionId(started.sessionId);
      setFirstQuestion(started.firstQuestion);
      setCurrentView("test");
    } catch (e) {
      setStartError("Failed to start test.");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === "intro") return <IELTSIntroView onStart={handleStartTest} isLoading={isLoading} error={startError} />;

  if (!sessionId || !firstQuestion) { navigate(nextPath); return null; }

  return (
    <IELTSTestView
      nextPath={nextPath} sessionId={sessionId} firstQuestion={firstQuestion}
      onRetake={() => { setSessionId(null); setFirstQuestion(null); setCurrentView("intro"); }}
    />
  );
};

export default IELTSAssessment;
