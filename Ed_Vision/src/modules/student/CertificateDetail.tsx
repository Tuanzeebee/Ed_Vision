import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/useToast";
import { getEnrollment } from "@/services/api/certificateService";
import type { EnrollmentResponse } from "@/services/api/certificateService";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import {
  ChevronLeft,
  BarChart2,
  ChevronRight,
  Star,
  Ear,
  BookOpen,
  MessageCircle,
  PlayCircle,
  Library,
  Clock,
  Monitor,
  Trophy,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  CERTIFICATES,
  getSkills,
  getRoadmap,
  getMosTasksBycert,
  getRadarData,
  getBandOption,
  BandSelector,
  RoadmapView,
  SkillRadar,
  MosTaskPanel,
} from "./certificateData";
import type { CertId, EnglishSkill, CertBand } from "./certificateData";
import MosWordSimulator from "./MosWordSimulator";
import type { TaskResult } from "./MosWordSimulator";
import ToeicRoadmapBoard from "./ToeicRoadmapBoard";
import StudentPersonalStatistics from "./components/StudentPersonalStatistics";
import ToeicFirstGuidePopup from "./ToeicFirstGuidePopup";
import {
  getToeicIntakeProfile,
  hydrateToeicProfileFromServer,
  saveToeicIntakeProfile,
} from "./toeicIntake";
import type { ToeicIntakeProfile } from "./toeicIntake";
import {
  getToeicPlanSync,
  saveToeicPlanSync,
  getToeicReservePoints,
} from "@/services/api/certificateService";
// Community discussions per cert type
const DISCUSSIONS: Record<
  string,
  { q: string; replies: number; time: string }[]
> = {
  ielts: [
    {
      q: "Tips viết intro Task 2 như thế nào?",
      replies: 12,
      time: "2 giờ trước",
    },
    { q: "Phân biệt False và Not Given?", replies: 8, time: "5 giờ trước" },
    {
      q: "Cách học từ vựng IELTS hiệu quả?",
      replies: 20,
      time: "1 ngày trước",
    },
  ],
  toeic: [
    { q: "Chiến lược làm Part 2 nhanh?", replies: 9, time: "3 giờ trước" },
    { q: "Cách tăng điểm Reading TOEIC?", replies: 14, time: "6 giờ trước" },
    {
      q: "Business vocabulary quan trọng nhất?",
      replies: 17,
      time: "2 ngày trước",
    },
  ],
  "mos-word": [
    { q: "Mail Merge có cần Excel không?", replies: 5, time: "4 giờ trước" },
    {
      q: "Cách tạo Table of Contents tự động?",
      replies: 11,
      time: "1 ngày trước",
    },
    { q: "Track Changes dùng khi nào?", replies: 7, time: "3 ngày trước" },
  ],
  "mos-excel": [
    {
      q: "VLOOKUP vs INDEX MATCH cái nào tốt hơn?",
      replies: 23,
      time: "1 giờ trước",
    },
    {
      q: "Cách làm Pivot Table từ nhiều sheet?",
      replies: 15,
      time: "8 giờ trước",
    },
    {
      q: "Conditional Formatting nâng cao?",
      replies: 10,
      time: "2 ngày trước",
    },
  ],
  "mos-powerpoint": [
    { q: "Animation có bị trừ điểm không?", replies: 6, time: "5 giờ trước" },
    {
      q: "Cách chèn video vào slide đúng cách?",
      replies: 8,
      time: "1 ngày trước",
    },
    {
      q: "SmartArt nào hay được hỏi trong thi?",
      replies: 12,
      time: "4 ngày trước",
    },
  ],
};

export default function CertificateDetail() {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const cert =
    CERTIFICATES.find((c) => c.id === (certId as CertId)) ?? CERTIFICATES[0];
  const isEnglish = cert.type === "english";
  const isToeic = cert.id === "toeic";
  const mosTasks = getMosTasksBycert(cert.id);
  const radarDataRaw = getRadarData(cert.id);
  const discussions = DISCUSSIONS[cert.id] ?? [];
  const [showFirstGuidePopup, setShowFirstGuidePopup] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [toeicGuideCompleted, setToeicGuideCompleted] = useState<boolean>(true);
  const [isSavingGuide, setIsSavingGuide] = useState(false);
  const guideDismissedInSessionRef = useRef(false);
  const { error: showErrorToast } = useToast();

  const [activeSkill, setActiveSkill] = useState<EnglishSkill>("grammar");

  // ── Dữ liệu enrollment thật từ API ──────────────────────────────────────────
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [completedToeicParts, setCompletedToeicParts] = useState<number[]>([]);
  useEffect(() => {
    getEnrollment(cert.id)
      .then(setEnrollment)
      .catch(() => { });
  }, [cert.id]);

  useEffect(() => {
    if (cert.id !== "toeic") {
      setCompletedToeicParts([]);
      return;
    }
    getToeicReservePoints()
      .then((data) => {
        if (Array.isArray(data.completed_parts) && data.completed_parts.length > 0) {
          setCompletedToeicParts(data.completed_parts);
          return;
        }
        // Fallback: derive from part_sessions for older backends.
        const parts = new Set<number>();
        for (const s of data.part_sessions ?? []) {
          if (s.toeic_part >= 1 && s.toeic_part <= 7) parts.add(s.toeic_part);
        }
        setCompletedToeicParts(Array.from(parts).sort((a, b) => a - b));
      })
      .catch(() => setCompletedToeicParts([]));
  }, [cert.id]);

  // ── MOS Word Simulator ────────────────────────────────────────────────
  const [showSimulator, setShowSimulator] = useState(false);
  const handleSimulatorComplete = useCallback((_result: TaskResult) => {
    // có thể lưu kết quả vào API sau
  }, []);

  const [toeicProfile, setToeicProfile] = useState<ToeicIntakeProfile | null>(
    () => (cert.id === "toeic" ? getToeicIntakeProfile() : null),
  );

  useEffect(() => {
    if (cert.id === "toeic") {
      guideDismissedInSessionRef.current = false;
      const localProfile = getToeicIntakeProfile();
      setToeicProfile(localProfile);
      hydrateToeicProfileFromServer(localProfile).then((hydrated) => {
        if (!hydrated) return;
        setToeicProfile(hydrated);
        saveToeicIntakeProfile(hydrated);
      });
      getToeicPlanSync()
        .then((synced) => {
          if (guideDismissedInSessionRef.current) return;
          setToeicGuideCompleted(Boolean(synced?.first_guide_shown));
        })
        .catch(() => { });
      return;
    }

    setToeicProfile(null);
    setToeicGuideCompleted(true);
    guideDismissedInSessionRef.current = false;
  }, [cert.id]);

  // Tiến độ và trạng thái thật — ưu tiên dữ liệu API
  // Tiến độ = current_score / target_score (điểm gốc so với mục tiêu)
  const realProgress = (() => {
    if (enrollment && isToeic) {
      const currentScore = enrollment.current_score ?? toeicProfile?.milestoneState.currentScore ?? 0;
      const targetScore = enrollment.target_score ?? toeicProfile?.milestoneState.targetScore ?? 0;
      if (targetScore > 0) {
        return Math.max(0, Math.min(100, Math.round((currentScore / targetScore) * 100)));
      }
    }
    return enrollment
      ? Math.max(0, Math.min(100, Number(enrollment.progress_percent ?? 0)))
      : cert.progress;
  })();
  const realStatus: "active" | "not-started" | "in-progress" | "completed" =
    enrollment
      ? enrollment.learning_status === "completed"
        ? "completed"
        : enrollment.learning_status === "in_progress"
          ? "in-progress"
          : "not-started"
      : cert.status;

  // ── Band selection — local preview mode (no DB persistence) ─────────────────
  const urlBand = (searchParams.get("band") ?? null) as CertBand | null;
  const [selectedBand, setSelectedBand] = useState<CertBand | null>(() => {
    if (urlBand) return urlBand;
    if (cert.id === "toeic") return toeicProfile?.recommendedBand ?? null;
    return null;
  });

  useEffect(() => {
    if (urlBand) {
      setSelectedBand(urlBand);
      return;
    }

    if (cert.id === "toeic") {
      setSelectedBand(toeicProfile?.recommendedBand ?? null);
      return;
    }

    setSelectedBand(null);
  }, [cert.id, toeicProfile, urlBand]);

  const handleSelectBand = useCallback(
    (band: CertBand) => {
      setSelectedBand(band);
      if (cert.id === "toeic") {
        setToeicProfile(getToeicIntakeProfile());
      }
      const params = new URLSearchParams(searchParams);
      params.set("band", band);
      setSearchParams(params, { replace: true });
    },
    [cert.id, searchParams, setSearchParams],
  );

  // "Đổi mục tiêu"— reset về BandSelector, không lưu gì
  const handleChangeBand = useCallback(() => {
    setSelectedBand(null);
    const params = new URLSearchParams(searchParams);
    params.delete("band");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleOpenToeicTopic = useCallback(
    (topicKey: string) => {
      if (cert.id === "toeic") {
        // Sync plan activity if profile exists
        if (toeicProfile) {
          void saveToeicPlanSync({
            current_score: toeicProfile.milestoneState.currentScore,
            target_score: toeicProfile.milestoneState.targetScore,
            total_boost: Math.round(toeicProfile.milestoneState.totalBoost),
            listening_sessions: toeicProfile.milestoneState.listeningSessions,
            reading_sessions: toeicProfile.milestoneState.readingSessions,
            foundation_completed:
              toeicProfile.milestoneState.foundationCompleted,
            foundation_skipped: toeicProfile.milestoneState.foundationSkipped,
            has_activity: true,
          }).catch(() => { });
        }
        // Route to correct new page based on topic prefix
        if (topicKey.startsWith("listening."))
          return navigate("/student/certificate-review/toeic/skill/listening");
        if (topicKey.startsWith("reading."))
          return navigate("/student/certificate-review/toeic/skill/reading");
        if (topicKey.startsWith("grammar."))
          return navigate(
            "/student/certificate-review/toeic/foundation/grammar",
          );
        if (topicKey.startsWith("vocab."))
          return navigate("/student/certificate-review/toeic/foundation/vocab");
        // Fallback: TOEIC detail page
        return navigate("/student/certificate-review/toeic");
      }
      // Non-TOEIC fallback route after lesson page removal.
      navigate(
        `/student/certificate-review/${cert.id}${selectedBand ? `?band=${selectedBand}` : ""}`,
      );
    },
    [cert.id, navigate, selectedBand, toeicProfile],
  );

  // ── Derived data (depends on selectedBand + completed_topics thật) ──────────────
  const completedPartSet = new Set(completedToeicParts);
  // Extract part number from a TOEIC topic key like "listening.part3_short" → 3.
  const extractToeicPartFromTopicKey = (topicKey?: string): number | null => {
    if (!topicKey) return null;
    const match = topicKey.match(/^(?:listening|reading)\.part(\d)/i);
    if (!match) return null;
    const part = Number(match[1]);
    return Number.isFinite(part) && part >= 1 && part <= 7 ? part : null;
  };

  const skills = getSkills(cert.id, selectedBand ?? undefined)
    .filter((section) => {
      if (!isToeic) return true;
      return section.id === "listening" || section.id === "reading";
    })
    .map((section) => ({
      ...section,
      topics: section.topics.map((t) => {
        const fromEnrollment = t.topicKey
          ? (enrollment?.completed_topics ?? []).includes(t.topicKey)
          : false;
        // For TOEIC, also mark a topic done if the student has completed
        // any practice session for the matching part (part number parsed from topicKey).
        let fromPractice = false;
        if (isToeic) {
          const part = extractToeicPartFromTopicKey(t.topicKey);
          if (part && completedPartSet.has(part)) fromPractice = true;
        }
        return {
          ...t,
          done: fromEnrollment || fromPractice || (!t.topicKey && t.done),
        };
      }),
    }));
  const radarData = isToeic
    ? [radarDataRaw[2] ?? 68, radarDataRaw[3] ?? 64]
    : radarDataRaw;
  const radarLabels = skills.map((s) => s.label);
  const roadmapSteps = getRoadmap(cert.id, selectedBand ?? undefined);
  const activeSkillData = skills.find((s) => s.id === activeSkill);

  useEffect(() => {
    if (skills.length > 0 && !skills.some((s) => s.id === activeSkill)) {
      setActiveSkill(skills[0].id);
    }
  }, [activeSkill, skills]);

  // Compute strongest / weakest from radar data
  const maxVal = radarData.length > 0 ? Math.max(...radarData) : 0;
  const minVal = radarData.length > 0 ? Math.min(...radarData) : 0;
  const strongest = skills[radarData.indexOf(maxVal)]?.label ?? "Đọc";
  const weakest = skills[radarData.indexOf(minVal)]?.label ?? "Nghe";
  const bandOption = selectedBand
    ? getBandOption(cert.id, selectedBand)
    : undefined;

  useEffect(() => {
    if (!isToeic || !selectedBand || !toeicProfile) return;
    if (guideDismissedInSessionRef.current) {
      setShowFirstGuidePopup(false);
      return;
    }
    if (toeicGuideCompleted) {
      setShowFirstGuidePopup(false);
      return;
    }
    if (!showFirstGuidePopup) {
      setShowFirstGuidePopup(true);
      setGuideStep(0);
    }
  }, [
    isToeic,
    selectedBand,
    showFirstGuidePopup,
    toeicGuideCompleted,
    toeicProfile,
  ]);

  const handleNextGuide = useCallback(() => {
    setGuideStep((prev) => Math.min(prev + 1, 1));
  }, []);

  const handlePreviousGuide = useCallback(() => {
    setGuideStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleCloseGuide = useCallback(async () => {
    if (!toeicProfile) return;
    if (isSavingGuide) return;

    setIsSavingGuide(true);

    try {
      await saveToeicPlanSync({
        current_score: toeicProfile.milestoneState.currentScore,
        target_score: toeicProfile.milestoneState.targetScore,
        total_boost: Math.round(toeicProfile.milestoneState.totalBoost),
        listening_sessions: toeicProfile.milestoneState.listeningSessions,
        reading_sessions: toeicProfile.milestoneState.readingSessions,
        foundation_completed: toeicProfile.milestoneState.foundationCompleted,
        foundation_skipped: toeicProfile.milestoneState.foundationSkipped,
        first_guide_shown: true,
      });

      guideDismissedInSessionRef.current = true;
      setShowFirstGuidePopup(false);
      setToeicGuideCompleted(true);
    } catch {
      showErrorToast(
        "Không thể lưu trạng thái hướng dẫn vào hệ thống. Vui lòng thử lại.",
      );
    } finally {
      setIsSavingGuide(false);
    }
  }, [isSavingGuide, showErrorToast, toeicProfile]);

  void user;

  // ── Show band selector when no band chosen ────────────────────────────────
  if (!selectedBand) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <BandSelector
            cert={cert}
            onSelect={handleSelectBand}
            onBack={() => navigate("/student/certificate-review")}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* ── Breadcrumb / Back ── */}
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => navigate("/student/certificate-review")}
            className="flex items-center gap-1 font-medium hover:text-purple-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Ôn Luyện Chứng Chỉ
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">{cert.label}</span>
        </nav>

        {/* ── Cert Hero ── */}
        {isToeic ? (
          /* ── TOEIC: warm brown + silver shimmer hero ── */
          <section
            className="rounded-2xl overflow-hidden relative"
            style={{
              background:
                "linear-gradient(135deg, #6b4f3a 0%, #8b6f5e 40%, #a08070 60%, #7a5c4a 100%)",
            }}
          >
            {/* Silver shimmer overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)",
              }}
            />
            {/* Top-right gloss spot */}
            <div
              className="absolute top-0 right-0 w-64 h-32 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at top right, rgba(255,255,255,0.22) 0%, transparent 70%)",
              }}
            />
            <div className="relative p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                {/* Left: logo + info */}
                <div className="flex items-center gap-5">
                  <div
                    className="rounded-2xl flex items-center justify-center shrink-0 px-5 h-16"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                  >
                    <span className="text-3xl font-black text-white tracking-widest leading-none drop-shadow">
                      {cert.icon}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight drop-shadow">
                      {cert.label}
                    </h1>
                    <p className="text-white/70 text-sm mt-0.5">
                      {cert.sublabel}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          color: "#ffffff",
                          border: "1px solid rgba(255,255,255,0.25)",
                        }}
                      >
                        Tiến độ: {realProgress}%
                      </span>
                      {(realStatus === "active" ||
                        realStatus === "in-progress") &&
                        !!(
                          (enrollment?.current_score && enrollment.current_score > 0) ||
                          (toeicProfile?.milestoneState.currentScore && toeicProfile.milestoneState.currentScore > 0)
                        ) && (
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              background: "rgba(16,185,129,0.2)",
                              color: "#6ee7b7",
                              border: "1px solid rgba(16,185,129,0.3)",
                            }}
                          >
                            Đang học
                          </span>
                        )}
                      {toeicProfile && (
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                          style={{
                            background: "rgba(255,255,255,0.15)",
                            color: "#fde68a",
                            border: "1px solid rgba(255,220,100,0.3)",
                          }}
                        >
                          Mục tiêu: {toeicProfile.milestoneState.targetScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: progress + action */}
                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="hidden sm:block w-44">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/60">Hoàn thành</span>
                      <span className="text-white font-bold">
                        {realProgress}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${realProgress}%`,
                          background: "linear-gradient(90deg, #fde68a, #ffffff)",
                          boxShadow: "0 0 6px rgba(255,255,255,0.5)",
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleChangeBand}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.22)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(255,255,255,0.45)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(255,255,255,0.12)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(255,255,255,0.25)";
                    }}
                  >
                    Đổi mục tiêu
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* ── Non-TOEIC: original gradient hero ── */
          <section
            className={`bg-gradient-to-r ${cert.bgFrom} ${cert.bgTo} rounded-2xl p-4 sm:p-6 text-white`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-2xl w-16 h-16 flex items-center justify-center shrink-0">
                  <span className="font-black text-2xl">{cert.icon}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{cert.label}</h1>
                  <p className="text-white/70 text-sm mt-0.5">
                    {cert.sublabel}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold">
                      Tiến độ: {realProgress}%
                    </span>
                    {(realStatus === "active" ||
                      realStatus === "in-progress") &&
                      !!(enrollment?.current_score && enrollment.current_score > 0) && (
                        <span className="bg-white/20 px-2.5 py-1 rounded-lg text-sm">
                          Đang học
                        </span>
                      )}
                    {bandOption && (
                      <span className="bg-white/25 px-2.5 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                        {bandOption.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="hidden sm:block min-w-[140px]">
                  <div className="w-full bg-white/20 rounded-full h-2 mb-1.5">
                    <div
                      className="bg-white rounded-full h-2 transition-all"
                      style={{ width: `${realProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/60 text-right">
                    {realProgress}% hoàn thành
                  </p>
                </div>
                <button
                  onClick={handleChangeBand}
                  className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Đổi mục tiêu
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ENGLISH CERTS (IELTS / TOEIC)
        ══════════════════════════════════════════════════════════════════════ */}
        {isEnglish && (
          <>
            <StudentPersonalStatistics enrollmentId={enrollment?.id ?? null} />

            {cert.id === "toeic" && toeicProfile && (
              <ToeicRoadmapBoard
                profile={toeicProfile}
                onProfileUpdated={setToeicProfile}
                onOpenTopic={handleOpenToeicTopic}
              />
            )}

            {/* ── Learning Hub: Skill Tabs ── */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`h-7 w-1 rounded-full bg-gradient-to-b ${cert.bgFrom} ${cert.bgTo}`}
                />
                <h2 className="text-xl font-bold text-slate-800">
                  {cert.label} – Trung tâm Học tập
                </h2>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-100">
                  {skills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => setActiveSkill(skill.id)}
                      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0 border-b-2 cursor-pointer ${activeSkill === skill.id
                          ? "border-purple-500 text-purple-700 bg-purple-50"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <span
                        className={
                          activeSkill === skill.id
                            ? skill.color
                            : "text-slate-400"
                        }
                      >
                        {skill.icon}
                      </span>
                      {skill.label}
                    </button>))}
                </div>

                {/* Active skill content */}
                {activeSkillData && (
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeSkillData.bg}`}
                      >
                        <span className={activeSkillData.color}>
                          {activeSkillData.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {activeSkillData.label}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {activeSkillData.topics.filter((t) => t.done).length}/
                          {activeSkillData.topics.length} chủ đề đã hoàn thành
                        </p>
                      </div>
                    </div>

                    {/* Topic grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeSkillData.topics.map((topic, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            if (!topic.topicKey) return;
                            if (cert.id === "toeic") {
                              const tk = topic.topicKey;
                              if (tk.startsWith("listening."))
                                return navigate(
                                  "/student/certificate-review/toeic/skill/listening",
                                );
                              if (tk.startsWith("reading."))
                                return navigate(
                                  "/student/certificate-review/toeic/skill/reading",
                                );
                              if (tk.startsWith("grammar."))
                                return navigate(
                                  "/student/certificate-review/toeic/foundation/grammar",
                                );
                              if (tk.startsWith("vocab."))
                                return navigate(
                                  "/student/certificate-review/toeic/foundation/vocab",
                                );
                              return navigate(
                                "/student/certificate-review/toeic",
                              );
                            }
                            navigate(
                              `/student/certificate-review/${cert.id}${selectedBand ? `?band=${selectedBand}` : ""}`,
                            );
                          }}
                          className={`flex items-start gap-2.5 p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-sm group ${topic.done
                              ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300"
                              : "bg-white border-slate-100 hover:border-purple-200 hover:bg-purple-50/30"
                            }`}
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${topic.done ? "bg-emerald-500" : "bg-slate-100"
                              }`}
                          >
                            {topic.done ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <span className="text-xs font-bold text-slate-400">
                                {i + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-semibold ${topic.done
                                  ? "text-emerald-700"
                                  : "text-slate-700"
                                }`}
                            >
                              {topic.title}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {topic.desc}
                            </div>
                            {topic.topicKey && (
                              <div className="mt-1.5 text-xs text-purple-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <span>
                                  {cert.id === "toeic"
                                    ? topic.topicKey.startsWith("listening.") ||
                                      topic.topicKey.startsWith("reading.")
                                      ? "Vào luyện tập"
                                      : topic.topicKey.startsWith("grammar.") ||
                                        topic.topicKey.startsWith("vocab.")
                                        ? "Học nền tảng"
                                        : "Xem chi tiết"
                                    : "Xem bài học chi tiết"}
                                </span>
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>))}
                    </div>

                    {/* Tips */}
                    <div
                      className={`mt-4 p-4 rounded-xl ${activeSkillData.bg}`}
                    >
                      <div
                        className={`text-sm font-bold ${activeSkillData.color} mb-2 flex items-center gap-1.5`}
                      >
                        <Zap className="w-4 h-4" />
                        Mẹo học tập
                      </div>
                      <ul className="space-y-1.5">
                        {activeSkillData.tips.map((tip, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-600 flex items-start gap-2"
                          >
                            <span className="mt-0.5 text-slate-400">•</span>{" "}
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2.5 flex-wrap">
                      {isToeic &&
                        (activeSkill === "grammar" ||
                          activeSkill === "vocabulary") ? (
                        /* Foundation topics → navigate to study page */
                        <button
                          onClick={() =>
                            navigate(
                              `/student/certificate-review/toeic/foundation/${activeSkill === "grammar" ? "grammar" : "vocab"}`,
                            )
                          }
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-violet-600 hover:to-blue-600 transition-colors cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Học nền tảng
                        </button>
                      ) : isToeic &&
                        (activeSkill === "listening" ||
                          activeSkill === "reading") ? (
                        /* Listening / Reading → go to learning map first */
                        <>
                          <button
                            onClick={() =>
                              navigate(
                                `/student/certificate-review/toeic/skill/${activeSkill}`,
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-colors cursor-pointer shadow-md shadow-teal-100"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Luyện tập
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/student/certificate-review/toeic/exam/${activeSkill}`,
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
                          >
                            🏆 Bắt đầu thi
                          </button>
                        </>
                      ) : (
                        /* Non-TOEIC certs → original behaviour */
                        <button
                          onClick={() => {
                            const firstTopic =
                              activeSkillData?.topics.find(
                                (t) => t.topicKey && !t.done,
                              ) ??
                              activeSkillData?.topics.find((t) => t.topicKey);
                            if (!firstTopic?.topicKey) return;
                            navigate(
                              `/student/certificate-review/${cert.id}${selectedBand ? `?band=${selectedBand}` : ""}`,
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Bắt đầu học
                        </button>
                      )}

                      {!isToeic && (
                        <button
                          onClick={() => {
                            const firstTopic = activeSkillData?.topics.find(
                              (t) => t.topicKey,
                            );
                            if (!firstTopic?.topicKey) return;
                            navigate(
                              `/student/certificate-review/${cert.id}${selectedBand ? `?band=${selectedBand}` : ""}`,
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Library className="w-4 h-4" />
                          Flashcard
                        </button>
                      )}
                    </div>

                    {isToeic &&
                      (activeSkill === "listening" ||
                        activeSkill === "reading") && (
                        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                          <span>🔒</span>
                          Bài thi mở khóa sau khi hoàn thành tất cả node luyện
                          tập{" "}
                          {activeSkill === "listening"
                            ? "Listening (5 node)"
                            : "Reading (4 node)"}
                          .
                        </p>
                      )}
                  </div>
                )}
              </div>
            </section>

            {/* ── Roadmap + Skill Analysis + Community ── */}
            <section>
              {/* Roadmap — full width */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 mb-6">
                <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-500" />
                  Lộ trình học
                </h3>
                <RoadmapView steps={roadmapSteps} />
              </div>

              {/* Skill Analysis + Community Discussions — 2 columns */}
              {/* Skill Analysis + Community Discussions — 2 columns */}
              {!isToeic && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Skill Analysis */}
                  {radarData.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-purple-500" />
                        Phân tích kỹ năng
                      </h3>
                      <div className="h-56 relative">
                        <SkillRadar data={radarData} labels={radarLabels} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                          <p className="text-xs text-slate-400">
                            Mạnh nhất
                          </p>
                          <p className="font-bold text-emerald-600 text-sm">
                            {strongest}
                          </p>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                          <p className="text-xs text-slate-400">Yếu nhất</p>
                          <p className="font-bold text-orange-500 text-sm">
                            {weakest}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Community Discussions */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-500" />
                      Thảo luận gần đây
                    </h3>
                    <div className="space-y-3">
                      {discussions.map((item, i) => (
                        <div
                          key={i}
                          className="pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                          <p className="text-sm font-medium text-slate-700 hover:text-purple-600 cursor-pointer">
                            {item.q}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />{" "}
                              {item.replies}
                            </span>
                            <span>• {item.time}</span>
                          </div>
                        </div>))}
                    </div>
                    <button className="w-full mt-4 text-sm text-purple-600 font-medium hover:bg-purple-50 py-2 rounded-xl transition-colors cursor-pointer">Xem cộng đồng
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>)}

        {/* ══════════════════════════════════════════════════════════════════════
            MOS CERTS
        ══════════════════════════════════════════════════════════════════════ */}
        {!isEnglish && (
          <>
            {/* ── MOS Simulator / Task Panel ── */}
            {showSimulator ? (
              <section className="-mx-4 sm:-mx-6 lg:-mx-8">
                <div style={{ height: "calc(100vh - 140px)" }}>
                  <MosWordSimulator
                    onComplete={handleSimulatorComplete}
                    onBack={() => setShowSimulator(false)}
                  />
                </div>
              </section>
            ) : (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`h-7 w-1 rounded-full bg-gradient-to-b ${cert.bgFrom} ${cert.bgTo}`}
                  />
                  <h2 className="text-xl font-bold text-slate-800">
                    {cert.label} – Luyện tập theo Task
                  </h2>
                </div>

                {/* Progress banner + Launch button */}
                <div
                  className={`bg-gradient-to-r ${cert.bgFrom} ${cert.bgTo} rounded-2xl p-5 text-white mb-5`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-lg font-bold mb-1">
                        Mô phỏng Word trực tiếp trên web
                      </p>
                      <p className="text-sm text-white/80">
                        Luyện tập các task MOS Word ngay trên trình duyệt. Hệ
                        thống tự động chấm điểm theo tiêu chuẩn thi MOS.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full">
                          {" "}
                          {mosTasks.length} tasks thực hành
                        </span>
                        <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full">
                          Tự động chấm điểm
                        </span>
                        <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full">
                          Lý thuyết + Thực hành
                        </span>
                        <span className="bg-white/20 text-xs px-2.5 py-1 rounded-full">
                          Không cần cài Office
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-bold">
                        {mosTasks.filter((t) => t.done).length}/
                        {mosTasks.length}
                      </p>
                      <p className="text-xs text-white/70">task hoàn thành</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 bg-white/20 rounded-full h-2">
                      <div
                        className="bg-white rounded-full h-2 transition-all"
                        style={{
                          width: `${mosTasks.length > 0
                              ? (mosTasks.filter((t) => t.done).length /
                                mosTasks.length) *
                              100
                              : 0
                            }%`,
                        }}
                      />
                    </div>
                    {cert.id === "mos-word" && (
                      <button
                        onClick={() => setShowSimulator(true)}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-[#2b579a] text-sm font-bold rounded-xl hover:bg-white/90 transition-colors cursor-pointer shadow-sm"
                      >
                        <Monitor className="w-4 h-4" />
                        Mở Word Simulator
                      </button>
                    )}
                  </div>
                </div>

                {/* Roadmap */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-5">
                  <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-500" />
                    Lộ trình học
                  </h3>
                  <RoadmapView steps={roadmapSteps} />
                </div>

                {/* MosTaskPanel chỉ dùng cho Excel/PowerPoint; mos-word dùng MosWordSimulator */}
                {cert.id !== "mos-word" && (
                  <MosTaskPanel tasks={mosTasks} certId={cert.id} />
                )}
              </section>
            )}

            {/* ── MOS Info Cards ── */}
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Clock className="w-5 h-5 text-blue-600" />,
                    title: "Thời gian thi",
                    body: "50 phút cho toàn bộ project. Quản lý thời gian cho từng task.",
                    accent: "bg-blue-50",
                  },
                  {
                    icon: <Monitor className="w-5 h-5 text-purple-600" />,
                    title: "Môi trường thi",
                    body: "Thi trực tiếp trên máy tính với Office thực. Không dùng Internet.",
                    accent: "bg-purple-50",
                  },
                  {
                    icon: <Trophy className="w-5 h-5 text-amber-600" />,
                    title: "Tiêu chí đạt",
                    body: "Đạt 700/1000 điểm. Mỗi task có trọng số điểm khác nhau.",
                    accent: "bg-amber-50",
                  },
                ].map((info, i) => (
                  <div
                    key={i}
                    className={`${info.accent} rounded-2xl p-5 border border-white`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        {info.icon}
                      </div>
                      <h4 className="font-bold text-slate-700 text-sm">
                        {info.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">{info.body}</p>
                  </div>))}
              </div>
            </section>

            {/* ── Community Discussions (MOS) ── */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`h-7 w-1 rounded-full bg-gradient-to-b ${cert.bgFrom} ${cert.bgTo}`}
                />
                <h2 className="text-xl font-bold text-slate-800">
                  Thảo luận cộng đồng
                </h2>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="space-y-3">
                  {discussions.map((item, i) => (
                    <div
                      key={i}
                      className="pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-slate-700 hover:text-purple-600 cursor-pointer">
                        {item.q}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> {item.replies}
                        </span>
                        <span>• {item.time}</span>
                      </div>
                    </div>))}
                </div>
                <button className="w-full mt-4 text-sm text-purple-600 font-medium hover:bg-purple-50 py-2 rounded-xl transition-colors cursor-pointer">Xem cộng đồng
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      {isToeic && selectedBand && toeicProfile && (
        <ToeicFirstGuidePopup
          open={showFirstGuidePopup}
          step={guideStep}
          isSaving={isSavingGuide}
          onPrevious={handlePreviousGuide}
          onNext={handleNextGuide}
          onClose={handleCloseGuide}
        />
      )}
    </div>
  );
}