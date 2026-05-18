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
  getAvailablePlacementSkills,
  getPlacementResult,
  startPlacementTest,
  submitPlacementAnswer,
  type PlacementQuestionPayload,
  type PlacementResult,
} from "@/services/api/placementService";
import { ListeningPlayer } from "@/components/ListeningPlayer";
import { SpeakingRecorder } from "@/components/SpeakingRecorder";

type ViewType = "intro" | "test";
const IELTS_SURVEY_KEY = "ieltsSurveyCompleted";
const TOTAL_QUESTIONS = 20;

// ── Owl Mascot (giữ nguyên, chỉ đổi màu sang xanh lá) ────────
function OwlMascot({ size = 40, blinking = false, excited = false, thinking = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      style={{
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transform: excited
          ? "scale(1.1) translateY(-5px)"
          : thinking
          ? "translateY(-10px)"
          : "scale(1)",
  filter: "drop-shadow(0 8px 16px rgba(59,130,246,0.28))",
      }}
      className={thinking ? "animate-bounce" : ""}
    >
      <defs>
        <linearGradient id="owlBody2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="owlWing2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      {/* Body */}
      <ellipse cx="40" cy="48" rx="22" ry="26" fill="url(#owlBody2)" />
      {/* Chest */}
      <ellipse cx="40" cy="54" rx="14" ry="16" fill="white" fillOpacity="0.22" />
      {/* Wings */}
      <ellipse cx="20" cy="50" rx="9" ry="15" fill="url(#owlWing2)" transform="rotate(-15 20 50)" />
      <ellipse cx="60" cy="50" rx="9" ry="15" fill="url(#owlWing2)" transform="rotate(15 60 50)" />
      {/* Head */}
      <ellipse cx="40" cy="28" rx="18" ry="16" fill="url(#owlBody2)" />
      {/* Eyes */}
      <circle cx="32" cy="28" r="9" fill="white" />
      <circle cx="48" cy="28" r="9" fill="white" />
      {blinking ? (
        <>
          <rect x="27" y="27" width="10" height="2" rx="1" fill="#1E3A8A" />
          <rect x="43" y="27" width="10" height="2" rx="1" fill="#1E3A8A" />
        </>
      ) : (
        <>
          <circle cx="33" cy="28" r="5" fill="#1E3A8A" />
          <circle cx="49" cy="28" r="5" fill="#1E3A8A" />
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

// ── Owl Progress Bar (Duolingo style) ─────────────────────────
function OwlProgressBar({
  current,
  total,
  thinking = false,
}: {
  current: number;
  total: number;
  thinking?: boolean;
}) {
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

    if (current === 5) setMessage("Khởi đầu ấn tượng! 🚀");
    else if (current === 10) setMessage("Tuyệt vời, nửa đường rồi! 🔥");
    else if (current === 15) setMessage("Sắp về đích, cố lên! ✨");
    else if (thinking) setMessage("Đang suy nghĩ à? 💪");
    else setMessage(null);

    if (!thinking && message && message !== "Đang suy nghĩ à? 💪") {
      const t2 = setTimeout(() => setMessage(null), 4000);
      return () => {
        clearTimeout(t1);
        clearInterval(blink);
        clearTimeout(t2);
      };
    }
    return () => {
      clearTimeout(t1);
      clearInterval(blink);
    };
  }, [current, thinking]);

  return (
    <div className="w-full px-2 pt-12 pb-1">
  <div className="relative h-3 bg-[#DBEAFE] rounded-full overflow-visible" style={{ borderRadius: 99 }}>
        {/* Fill track */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #93C5FD 0%, #3B82F6 100%)",
            boxShadow: "0 2px 8px rgba(59,130,246,0.35)",
          }}
        />
        {/* Milestone dots */}
        {[5, 10, 15].map((m) => (
          <div
            key={m}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white transition-colors duration-500 z-10"
            style={{
              left: `${(m / total) * 100}%`,
              backgroundColor: current >= m ? "#3B82F6" : "#DBEAFE",
            }}
          />
        ))}
        {/* Owl on track */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20"
          style={{ left: `${Math.min(pct, 97)}%`, transform: "translate(-50%, -50%)" }}
        >
          <div className="relative">
            {message && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "70%",
                  transform: "translateX(-50%) rotate(4deg) translateZ(0)",
                  marginBottom: "10px",
                  animation: "bubblePop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    background: "#3B82F6",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: "800",
                    padding: "5px 10px",
                    borderRadius: "12px 12px 12px 2px",
                    whiteSpace: "nowrap",
                    boxShadow: "3px 3px 0px rgba(59,130,246,0.25)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  {message}
                </div>
              </div>
            )}
            <OwlMascot size={40} blinking={blinking} excited={excited} thinking={thinking} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-blue-300/20 rounded-full blur-xl animate-pulse -z-10" />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bubblePop {
          0% { opacity:0; transform:translateX(-50%) rotate(4deg) scale(0.5); }
          100% { opacity:1; transform:translateX(-50%) rotate(4deg) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── Circular Timer (Duolingo ring style) ──────────────────────
function Timer({
  seconds,
  onExpire,
  resetKey,
}: {
  seconds: number;
  onExpire?: () => void;
  resetKey: any;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef<any>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [seconds, resetKey]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [seconds, resetKey]);

  useEffect(() => {
    if (!expiredRef.current && remaining === 0) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [remaining, onExpire]);

  const urgent = remaining <= 15;
  const pct = remaining / seconds;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56">
          {/* Track */}
          <circle cx="28" cy="28" r={r} fill="none" stroke={urgent ? "#FEE2E2" : "#DBEAFE"} strokeWidth="5" />
          {/* Progress */}
          <circle
            cx="28"
            cy="28"
            r={r}
            fill="none"
            stroke={urgent ? "#EF4444" : "#3B82F6"}
            strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s linear, stroke 0.3s" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-black tabular-nums leading-none"
            style={{
              fontSize: "11px",
              color: urgent ? "#EF4444" : "#1D4ED8",
              letterSpacing: "-0.02em",
            }}
          >
            {mm}:{ss}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Skill Card (green theme) ───────────────────────────────────
function SkillCard({
  skill,
  band,
  isStrength,
  isWeakness,
}: {
  skill: string;
  band: number;
  isStrength: boolean;
  isWeakness: boolean;
}) {
  const labels: any = {
    reading: "Reading",
    listening: "Listening",
    writing: "Writing",
    speaking: "Speaking",
    vocabulary: "Vocabulary",
  };
  const icons: any = {
    reading: <BookOpen className="w-4 h-4" />,
    listening: <Zap className="w-4 h-4" />,
    writing: <RotateCcw className="w-4 h-4" />,
    speaking: <Trophy className="w-4 h-4" />,
    vocabulary: <Sparkles className="w-4 h-4" />,
  };

  const barColor = isStrength ? "#3B82F6" : isWeakness ? "#FF9600" : "#3B82F6";
  const iconBg = isStrength ? "#DBEAFE" : isWeakness ? "#FFF3CD" : "#DBEAFE";
  const iconColor = isStrength ? "#1D4ED8" : isWeakness ? "#CC7700" : "#1D4ED8";
  const scoreColor = isStrength ? "#1D4ED8" : isWeakness ? "#CC7700" : "#1D4ED8";

  return (
    <div className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icons[skill] || <HelpCircle className="w-4 h-4" />}
        </div>
        <span className="text-sm font-bold text-gray-700">{labels[skill] || skill}</span>
        <span className="ml-auto text-xl font-black" style={{ color: scoreColor }}>
          {band?.toFixed(1) || "0.0"}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${(band / 9) * 100}%`, background: barColor }}
        />
      </div>
      {isStrength && (
        <p className="mt-2 text-[11px] font-semibold text-green-600">✦ Điểm mạnh</p>
      )}
      {isWeakness && (
        <p className="mt-2 text-[11px] font-semibold text-orange-500">⚠ Cần cải thiện</p>
      )}
    </div>
  );
}

// ── Intro View ────────────────────────────────────────────────
const IELTSIntroView: React.FC<{
  onStart: () => void;
  isLoading: boolean;
  error?: string | null;
  onSkipToRoadmap: (currentBand: number, targetBand: number) => void;
}> = ({ onStart, isLoading, error, onSkipToRoadmap }) => {
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [currentBandInput, setCurrentBandInput] = useState('');
  const [targetBandInput, setTargetBandInput] = useState('');

  const handleSubmitScores = () => {
    const cur = parseFloat(currentBandInput);
    const tgt = parseFloat(targetBandInput);
    if (isNaN(cur) || isNaN(tgt) || cur < 0 || cur > 9 || tgt < 0 || tgt > 9) return;
    setShowScoreModal(false);
    onSkipToRoadmap(cur, tgt);
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
  style={{ background: "#EFF6FF", fontFamily: "'DM Sans', 'Nunito', sans-serif" }}
    >
      {/* Soft background blobs */}
      <div
        className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full pointer-events-none"
  style={{ background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
  style={{ background: "radial-gradient(circle, #EDE9FE 0%, transparent 70%)" }}
      />

      {/* Header */}
  <header className="relative z-50 w-full px-8 py-5 flex items-center justify-between border-b border-blue-100/60 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "#3B82F6", boxShadow: "0 4px 12px rgba(59,130,246,0.35)" }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-xl font-black tracking-tight"
            style={{ color: "#1E3A8A", letterSpacing: "-0.03em" }}
          >
            PREDICA
          </span>
        </div>
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: "#DBEAFE", color: "#1D4ED8" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Placement Test
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-5xl w-full grid lg:grid-cols-[1fr_420px] gap-12 items-center">
          {/* Left content */}
          <div className="space-y-7 text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border"
              style={{ background: "#DBEAFE", color: "#1D4ED8", borderColor: "#DBEAFE" }}>
              <Trophy className="w-4 h-4" />
              Kiểm tra trình độ IELTS
            </div>

            <h1
              className="text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight"
              style={{ color: "#1E3A8A" }}
            >
              Khám phá năng lực{" "}
              <span
                className="relative inline-block"
                style={{
                  color: "#3B82F6",
                  textShadow: "0 2px 0 rgba(59,130,246,0.15)",
                }}
              >
                IELTS
              </span>{" "}
              của bạn
            </h1>

            <p className="text-base text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
              Mỗi hành trình bắt đầu từ việc biết mình đang ở đâu. PREDICA đo đúng năng lực
              của bạn — để lộ trình phía trước không lãng phí một ngày nào.
            </p>

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onStart}
                disabled={isLoading}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-black text-base transition-all active:scale-95 disabled:opacity-70"
                style={{
                  background: isLoading
                    ? "#93C5FD"
                    : "linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)",
                  boxShadow: "0 6px 0 #1D4ED8, 0 8px 20px rgba(59,130,246,0.30)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {isLoading ? "Đang chuẩn bị..." : "Bắt đầu kiểm tra"}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setShowScoreModal(true)}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 border-2"
                style={{ borderColor: "#DBEAFE", color: "#1D4ED8", background: "white" }}
              >
                <Trophy className="w-4 h-4" />
                Nhập Điểm Mong Muốn
              </button>
            </div>

            {/* Score Modal */}
            {showScoreModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={() => setShowScoreModal(false)}
              >
                <div
                  className="bg-white rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
                      <Trophy className="w-5 h-5" style={{ color: "#1D4ED8" }} />
                    </div>
                    <h2 className="text-xl font-black" style={{ color: "#1E3A8A" }}>Nhập Điểm Mong Muốn</h2>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">Bỏ qua bài test và nhập điểm để xem lộ trình học phù hợp</p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Điểm hiện tại (0 – 9)</label>
                      <input
                        type="number" min="0" max="9" step="0.5"
                        value={currentBandInput}
                        onChange={(e) => setCurrentBandInput(e.target.value)}
                        placeholder="Ví dụ: 5.0"
                        className="w-full h-14 px-5 rounded-2xl text-lg font-black text-slate-800 outline-none transition-colors"
                        style={{ border: "2px solid #DBEAFE" }}
                        onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                        onBlur={(e) => (e.target.style.borderColor = "#DBEAFE")}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Điểm mục tiêu (0 – 9)</label>
                      <input
                        type="number" min="0" max="9" step="0.5"
                        value={targetBandInput}
                        onChange={(e) => setTargetBandInput(e.target.value)}
                        placeholder="Ví dụ: 7.0"
                        className="w-full h-14 px-5 rounded-2xl text-lg font-black text-slate-800 outline-none transition-colors"
                        style={{ border: "2px solid #DBEAFE" }}
                        onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                        onBlur={(e) => (e.target.style.borderColor = "#DBEAFE")}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowScoreModal(false)}
                      className="flex-1 py-3 rounded-2xl font-black text-sm transition-colors"
                      style={{ border: "2px solid #E5E7EB", color: "#9CA3AF" }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmitScores}
                      disabled={!currentBandInput || !targetBandInput}
                      className="py-3 rounded-2xl text-white font-black text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ flex: 2, background: "linear-gradient(135deg, #93C5FD, #3B82F6)", boxShadow: "0 4px 0 #1D4ED8" }}
                    >
                      Xem lộ trình →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto lg:mx-0 pt-2">
              {[
                { label: "Thời gian", val: "20 phút", icon: <Clock className="w-4 h-4" /> },
                { label: "Câu hỏi", val: "20 câu", icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Kỹ năng", val: "5 skills", icon: <CheckCircle2 className="w-4 h-4" /> },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white border border-blue-100 shadow-sm"
                >
                  <div style={{ color: "#3B82F6" }}>{s.icon}</div>
                  <span className="text-[11px] text-gray-400 font-medium">{s.label}</span>
                  <span className="text-xs font-black" style={{ color: "#1E3A8A" }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Owl */}
          <div className="order-1 lg:order-2 flex flex-col items-center gap-6">
            <div className="relative">
              {/* Glow ring */}
              <div
                className="absolute inset-0 rounded-full blur-3xl -z-10"
                style={{ background: "rgba(59,130,246,0.18)", transform: "scale(1.3)" }}
              />
              <div className="animate-float">
                <OwlMascot size={260} excited />
              </div>

              {/* Floating badge */}
              <div
                className="absolute top-4 -right-4 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-blue-100 animate-bounce-slow"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                    style={{ background: "#3B82F6" }}
                  >
                    8+
                  </div>
                  <span className="text-sm font-bold text-gray-700">Bạn làm được! ✨</span>
                </div>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {["AI-Powered", "Adaptive Test", "Instant Results"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes bounce-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 3.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// ── Test View ─────────────────────────────────────────────────
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(Date.now());
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [audioDone, setAudioDone] = useState(false);
  const [speakingResult, setSpeakingResult] = useState<{
    band: number | null;
    feedback: string;
    skipped?: boolean;
  } | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    console.log("[Speaking Debug]", {
      skill: currentQuestion.skill,
      questionType: currentQuestion.questionType,
      contextType: currentQuestion.contextType,
    });
  }, [currentQuestion.id]);

  const options = useMemo(() => {
    if (!Array.isArray(currentQuestion.options)) return [];
    return currentQuestion.options.map((item: any, idx: number) => {
      if (typeof item === "string") {
        const m = item.match(/^([A-D])\.\s*(.*)$/i);
        if (m) return { value: m[1].toUpperCase(), label: m[2], badge: m[1].toUpperCase() };
        return { value: item, label: item, badge: String.fromCharCode(65 + idx) };
      }
      if (typeof item === "object" && item !== null) {
        return {
          value: item.key ?? String(idx),
          label: item.text ?? String(idx),
          badge: item.key ?? String.fromCharCode(65 + idx),
        };
      }
      return { value: String(idx), label: String(idx), badge: String.fromCharCode(65 + idx) };
    });
  }, [currentQuestion.options]);

  useEffect(() => {
    setIsThinking(false);
    const nudgeTimer = setTimeout(() => setIsThinking(true), 30000);
    return () => clearTimeout(nudgeTimer);
  }, [currentQuestion.id]);

  const submitCurrentAnswer = async (answer: string) => {
    if (isSubmitting || submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    try {
      const elapsedSec = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
      const res = await submitPlacementAnswer({
        sessionId,
        questionId: currentQuestion.id,
        userAnswer: answer,
        timeTakenSec: elapsedSec,
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
      setAudioDone(false);
      setSpeakingResult(null);
      setResetKey((k) => k + 1);
      submittedRef.current = false;
    } catch (e) {
      setIsFinished(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Results Screen ──
  if (isFinished && result) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "#EFF6FF", fontFamily: "'DM Sans','Nunito',sans-serif" }}
      >
        {/* Top decoration */}
        <div
          className="absolute top-0 inset-x-0 h-72 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.10) 0%, transparent 100%)" }}
        />

        <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full" />
              <OwlMascot size={88} excited />
            </div>
            <h1 className="text-3xl font-black" style={{ color: "#1E3A8A" }}>
              Chúc mừng bạn đã hoàn thành! 🎉
            </h1>
            <p className="text-gray-500 text-sm">Bạn đã nỗ lực rất tuyệt vời. Đây là kết quả của bạn!</p>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
            {/* Score card */}
            <div
              className="bg-white rounded-3xl border border-blue-100 shadow-lg text-center p-8 relative overflow-hidden"
            >
              <div
                className="absolute inset-x-0 top-0 h-2 rounded-t-3xl"
                style={{ background: "linear-gradient(90deg,#93C5FD,#3B82F6)" }}
              />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Predicted Band
              </p>
              <div
                className="text-8xl font-black tabular-nums"
                style={{ color: "#3B82F6", lineHeight: 1 }}
              >
                {Number(result.finalBand).toFixed(1)}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-2 mb-5">
                IELTS Score
              </p>
              <span
                className="inline-block px-5 py-2 rounded-full text-white text-sm font-black"
                style={{ background: "#3B82F6", boxShadow: "0 3px 0 #1D4ED8" }}
              >
                {result.cefrLevel || "B2"}
              </span>

              {/* Band gauge */}
              <div className="mt-6 space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>0</span><span>9</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(Number(result.finalBand) / 9) * 100}%`,
                      background: "linear-gradient(90deg,#93C5FD,#3B82F6)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="space-y-5">
              {/* Skill grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(result.skillBands || {}).map(([skill, band]: [string, any]) =>
                  band === null || band === undefined ? (
                    <div key={skill} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700 capitalize">{skill}</span>
                            <span className="text-xs text-gray-400 italic">Chưa đánh giá</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full mt-2" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <SkillCard
                      key={skill}
                      skill={skill}
                      band={Number(band)}
                      isStrength={result.patterns?.strengths?.includes(skill) ?? false}
                      isWeakness={result.patterns?.weaknesses?.includes(skill) ?? false}
                    />
                  )
                )}
              </div>

              {/* CTA banner */}
              <div
                className="p-7 rounded-3xl text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 100%)" }}
              >
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full -mr-16 -mt-16 opacity-20"
                  style={{ background: "#3B82F6" }}
                />
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <h2 className="text-xl font-black">Lộ trình bứt phá dành riêng cho bạn!</h2>
                    <p className="text-green-200 text-sm leading-relaxed">
                      PREDICA đã chuẩn bị lộ trình tối ưu để giúp bạn cải thiện band điểm ngay hôm nay.
                    </p>
                    <button
                      onClick={() =>
                        navigate(
                          `${nextPath}${nextPath.includes("?") ? "&" : "?"}currentBand=${result.finalBand}`,
                          { state: { currentBand: result.finalBand } },
                        )
                      }
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: "#3B82F6",
                        color: "white",
                        boxShadow: "0 4px 0 #1D4ED8",
                      }}
                    >
                      Bắt đầu học lộ trình riêng →
                    </button>
                  </div>
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center border border-white/20 rotate-6 flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <Sparkles className="w-10 h-10 text-blue-300" />
                  </div>
                </div>
              </div>

              <button
                onClick={onRetake}
                className="w-full py-3 text-gray-400 font-semibold text-sm hover:text-blue-600 transition-colors"
              >
                Làm lại bài kiểm tra
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isGapFill = currentQuestion.questionType === "gap_fill";
  const skillLabel: any = {
    reading: "Reading",
    listening: "Listening",
    writing: "Writing",
    speaking: "Speaking",
    vocabulary: "Vocabulary",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
  style={{ background: "#EFF6FF", fontFamily: "'DM Sans','Nunito',sans-serif" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-[100] bg-white border-b"
        style={{ borderColor: "#DBEAFE" }}
      >
        <div className="max-w-[1300px] mx-auto px-5 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#3B82F6" }}
            >
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-base tracking-tight" style={{ color: "#1E3A8A" }}>
              PREDICA
            </span>
          </div>

          {/* Skill badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
            style={{ background: "#DBEAFE", color: "#1D4ED8" }}
          >
            {skillLabel[currentQuestion.skill] || currentQuestion.skill}
          </div>

          {/* Progress bar — takes most space */}
          <div className="flex-1 min-w-0">
            <OwlProgressBar
              current={currentQuestion.progress.current}
              total={TOTAL_QUESTIONS}
              thinking={isThinking}
            />
          </div>

          {/* Right: counter + timer */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className="text-sm font-black tabular-nums hidden sm:block"
              style={{ color: "#DBEAFE" }}
            >
              <span style={{ color: "#3B82F6" }}>{currentQuestion.progress.current}</span>/{TOTAL_QUESTIONS}
            </span>
            <Timer
              seconds={currentQuestion.timeLimitSec || 60}
              resetKey={resetKey}
              onExpire={() =>
                void submitCurrentAnswer(
                  isGapFill ? freeTextAnswer : selectedOption || ""
                )
              }
            />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto px-5 py-8 overflow-hidden flex flex-col">
        <div
          className={`grid ${
            currentQuestion.passage ? "lg:grid-cols-2" : "max-w-2xl mx-auto w-full"
          } gap-6 items-stretch flex-1 min-h-0`}
        >
          {/* Passage panel */}
          {currentQuestion.passage && (
            <div
              className="rounded-3xl border overflow-hidden flex flex-col h-full shadow-sm"
              style={{ borderColor: "#DBEAFE", background: "#F8FAFF" }}
            >
              {/* Panel header */}
              <div
                className="px-6 py-4 border-b flex items-center gap-3"
                style={{ borderColor: "#DBEAFE", background: "#EFF6FF" }}
              >
                <span
                  className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                  style={{ background: "white", color: "#1D4ED8", border: "1px solid #DBEAFE" }}
                >
                  {currentQuestion.contextType === "audio" ? "🎧 Listening" : "📖 Reading"}
                </span>
                <h3
                  className="text-base font-bold truncate"
                  style={{ color: "#1E3A8A" }}
                >
                  {currentQuestion.passage.title}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {currentQuestion.skill === "listening" && currentQuestion.passage?.audioUrl ? (
                  <ListeningPlayer
                    audioUrl={currentQuestion.passage.audioUrl}
                    onFinished={() => setAudioDone(true)}
                  />
                ) : currentQuestion.skill === "listening" ? (
                  null
                ) : currentQuestion.skill === "speaking" ||
                  currentQuestion.questionType === "speaking" ? null : (
                  <div className="text-sm leading-7 text-gray-600 font-serif whitespace-pre-wrap">
                    {currentQuestion.passage?.content}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question panel */}
          <div
            className="rounded-3xl border overflow-hidden flex flex-col h-full shadow-sm bg-white"
            style={{ borderColor: "#DBEAFE" }}
          >
            <div className="flex-1 overflow-y-auto p-7 custom-scrollbar space-y-6">
              {/* Question number chip */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white"
                  style={{ background: "#3B82F6" }}
                >
                  {currentQuestion.progress.current}
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Question {currentQuestion.progress.current} of {TOTAL_QUESTIONS}
                </span>
              </div>

              {currentQuestion.skill === "listening" && !!currentQuestion.passage?.audioUrl && !audioDone ? (
                <div
                  className="bg-white rounded-3xl border p-10 shadow-sm text-center mt-4"
                  style={{ borderColor: "#DBEAFE" }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "#EFF6FF", color: "#3B82F6" }}
                  >
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Đang phát audio...
                  </h3>
                  <p className="text-sm text-gray-500">
                    Hãy tập trung nghe. Câu hỏi sẽ tự động hiển thị sau khi đoạn audio kết thúc.
                  </p>
                </div>
              ) : (
                <>
                  {/* Question text */}
                  <div
                    className="bg-white rounded-3xl border p-7 shadow-sm relative"
                    style={{ borderColor: "#DBEAFE" }}
                  >
                    {/* Green left accent */}
                    <div
                      className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full"
                      style={{ background: "linear-gradient(180deg,#93C5FD,#3B82F6)" }}
                    />
                    <p className="text-lg font-bold text-gray-800 leading-snug pl-2">
                      {currentQuestion.questionText.replace(/^\[AUDIO\][^?]*?(?=\s+\w)/i, '').trim()}
                    </p>
                  </div>

                  {/* Answer area */}
                  <div className="space-y-3">
                    {isGapFill ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={freeTextAnswer}
                          onChange={(e) => setFreeTextAnswer(e.target.value)}
                          placeholder="Nhập câu trả lời của bạn..."
                          className="w-full h-16 px-6 rounded-2xl text-base font-bold text-gray-800 outline-none transition-all placeholder:text-gray-300"
                          style={{
                            border: "2px solid #DBEAFE",
                            background: "white",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "#3B82F6")}
                          onBlur={(e) => (e.target.style.borderColor = "#DBEAFE")}
                        />
                        <button
                          onClick={() => void submitCurrentAnswer(freeTextAnswer)}
                          disabled={isSubmitting || !freeTextAnswer.trim()}
                          className="w-full h-14 rounded-2xl text-white font-black text-base transition-all active:scale-95 disabled:opacity-50"
                          style={{
                            background: "linear-gradient(135deg,#93C5FD,#3B82F6)",
                            boxShadow: "0 4px 0 #1D4ED8",
                          }}
                        >
                          {isSubmitting ? "Đang xử lý..." : "Xác nhận →"}
                        </button>
                      </div>
                    ) : currentQuestion.skill === "speaking" ||
                      currentQuestion.questionType === "speaking" ? (
                      <div className="space-y-5">
                        <SpeakingRecorder
                          sessionId={sessionId}
                          questionId={currentQuestion.id}
                          speakingPrompt={currentQuestion.questionText}
                          onResult={async (res) => {
                            if (res.skipped) {
                              setSpeakingResult({ band: null, feedback: "Câu hỏi đã được bỏ qua.", skipped: true });
                              try {
                                const skipResult = await submitPlacementAnswer({
                                  sessionId,
                                  questionId: currentQuestion.id,
                                  userAnswer: "SPEAKING_SKIPPED",
                                  timeTakenSec: 5,
                                });
                                setTimeout(() => {
                                  if (!skipResult.nextQuestion) {
                                    getPlacementResult(sessionId).then((final) => {
                                      setResult(final);
                                      setIsFinished(true);
                                    });
                                  } else {
                                    setCurrentQuestion(skipResult.nextQuestion);
                                    setTimeLeft(skipResult.nextQuestion.timeLimitSec || 60);
                                    setQuestionStartedAt(Date.now());
                                    setAudioDone(false);
                                    setSpeakingResult(null);
                                    setResetKey((k) => k + 1);
                                    submittedRef.current = false;
                                  }
                                }, 3000);
                              } catch {
                                setIsFinished(true);
                              }
                              return;
                            }
                            setSpeakingResult({ band: res.band, feedback: res.feedback });
                            setTimeout(() => {
                              if (!res.nextQuestion) {
                                getPlacementResult(sessionId).then((final) => {
                                  setResult(final);
                                  setIsFinished(true);
                                });
                              } else {
                                setCurrentQuestion(res.nextQuestion);
                                setTimeLeft(res.nextQuestion.timeLimitSec || 60);
                                setQuestionStartedAt(Date.now());
                                setAudioDone(false);
                                setSpeakingResult(null);
                                setResetKey((k) => k + 1);
                                submittedRef.current = false;
                              }
                            }, 3000);
                          }}
                        />
                        {speakingResult && (
                          <div
                            className="p-5 rounded-2xl border"
                            style={{
                              background: speakingResult.skipped ? "#F9FAFB" : "#EFF6FF",
                              borderColor: speakingResult.skipped ? "#E5E7EB" : "#DBEAFE",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {speakingResult.skipped ? (
                                <>
                                  <AlertCircle className="w-4 h-4 text-gray-400" />
                                  <span className="font-bold text-gray-500 text-sm">Đã bỏ qua</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  <span className="font-bold text-green-800 text-sm">
                                    AI Band: {speakingResult.band}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-xs italic text-gray-500">"{speakingResult.feedback}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {options.map((opt: any) => {
                          const isSelected = selectedOption === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setSelectedOption(opt.value)}
                              className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-left"
                              style={{
                                background: isSelected ? "#3B82F6" : "white",
                                borderColor: isSelected ? "#1D4ED8" : "#DBEAFE",
                                boxShadow: isSelected ? "0 4px 0 #1D4ED8" : "none",
                                transform: isSelected ? "translateY(-1px)" : "none",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6";
                                  (e.currentTarget as HTMLElement).style.background = "#EFF6FF";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  (e.currentTarget as HTMLElement).style.borderColor = "#DBEAFE";
                                  (e.currentTarget as HTMLElement).style.background = "white";
                                }
                              }}
                            >
                              {/* Badge */}
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-colors"
                                style={{
                                  background: isSelected ? "rgba(255,255,255,0.25)" : "#DBEAFE",
                                  color: isSelected ? "white" : "#1D4ED8",
                                }}
                              >
                                {opt.badge}
                              </div>
                              <span
                                className="text-base font-semibold flex-1"
                                style={{ color: isSelected ? "white" : "#374151" }}
                              >
                                {opt.label}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => void submitCurrentAnswer(selectedOption || "")}
                          disabled={isSubmitting || !selectedOption}
                          className="w-full h-14 rounded-2xl text-white font-black text-base mt-3 transition-all active:scale-95 disabled:opacity-40"
                          style={{
                            background: selectedOption
                              ? "linear-gradient(135deg,#93C5FD,#3B82F6)"
                              : "#DBEAFE",
                            boxShadow: selectedOption ? "0 4px 0 #1D4ED8" : "none",
                          }}
                        >
                          {isSubmitting ? "Đang xử lý..." : "Xác nhận →"}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        .custom-scrollbar::-webkit-scrollbar { width:5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background:#DBEAFE; border-radius:99px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background:#93C5FD; }
        @keyframes bubblePop {
          0%{opacity:0;transform:translateX(-50%) rotate(4deg) scale(0.5);}
          100%{opacity:1;transform:translateX(-50%) rotate(4deg) scale(1);}
        }
      `}</style>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────
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
    if (!accountId) {
      setStartError("Invalid account.");
      return;
    }
    setIsLoading(true);
    try {
      const availableSkills = await getAvailablePlacementSkills();
      const skillsToTest = availableSkills.length > 0
        ? availableSkills
        : ["vocabulary", "reading", "listening", "writing", "speaking"];
      const started = await startPlacementTest({
        accountId,
        skillsToTest,
      });
      setSessionId(started.sessionId);
      setFirstQuestion(started.firstQuestion);
      setCurrentView("test");
    } catch (e) {
      setStartError("Failed to start test.");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === "intro")
    return (
      <IELTSIntroView
        onStart={handleStartTest}
        isLoading={isLoading}
        error={startError}
        onSkipToRoadmap={(currentBand, targetBand) =>
          navigate(
            `${nextPath}${nextPath.includes('?') ? '&' : '?'}currentBand=${currentBand}&targetBand=${targetBand}`,
            { state: { currentBand, targetBand } },
          )
        }
      />
    );

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