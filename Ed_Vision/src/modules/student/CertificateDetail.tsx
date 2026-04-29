import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/useToast";
import { getEnrollment, getToeicPlanSync, saveToeicPlanSync } from "@/services/api/certificateService";
import type { EnrollmentResponse } from "@/services/api/certificateService";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { ChevronLeft, BarChart2, FileCheck, Star, MessageCircle, PlayCircle, Library, Clock, Monitor, Trophy, CheckCircle2, Zap } from "lucide-react";
import { CERTIFICATES, getSkills, getRoadmap, getMosTasksBycert, getBandOption, getPracticeTests, BandSelector, RoadmapView, PracticeTestList, SkillRadar, SkillTopicCard, MosTaskPanel } from "./certificateData";
import type { CertId, EnglishSkill, CertBand } from "./certificateData";
import MosWordSimulator from "./MosWordSimulator";
import type { TaskResult } from "./MosWordSimulator";
import ToeicRoadmapBoard from "./ToeicRoadmapBoard";
import ToeicFirstGuidePopup from "./ToeicFirstGuidePopup";
import { getToeicIntakeProfile, hydrateToeicProfileFromServer, saveToeicIntakeProfile } from "./toeicIntake";
import type { ToeicIntakeProfile } from "./toeicIntake";
import IeltsCertificateSection from "./IeltsCertificateSection";
import { ieltsAdaptiveApi } from "@/services/ielts-adaptive/api";

const IELTS_GOAL_BAND_STORAGE_KEY = "ieltsGoalBand";
const IELTS_EXAM_DATE_STORAGE_KEY = "ieltsExamDate";
const IELTS_CURRENT_BAND_STORAGE_KEY = "ieltsCurrentBand";

const DISCUSSIONS: Record<string, { q: string; replies: number; time: string }[]> = {
  ielts: [{ q: "Tips viết intro Task 2 như thế nào?", replies: 12, time: "2 giờ trước" }],
  toeic: [{ q: "Cách tăng điểm Reading TOEIC?", replies: 14, time: "6 giờ trước" }],
  "mos-word": [{ q: "Track Changes dùng khi nào?", replies: 7, time: "3 ngày trước" }],
  "mos-excel": [{ q: "Pivot Table từ nhiều sheet?", replies: 15, time: "8 giờ trước" }],
  "mos-powerpoint": [{ q: "Animation có bị trừ điểm không?", replies: 6, time: "5 giờ trước" }],
};

const normalizeBand = (rawValue?: string | null): string | null => {
  if (!rawValue) return null;
  const numericBand = Number.parseFloat(rawValue);
  if (Number.isNaN(numericBand)) return null;
  const clamped = Math.min(9, Math.max(0, numericBand));
  return clamped.toFixed(1);
};

const mapCalibrationBandToCertBand = (targetBand?: string | null): CertBand | null => {
  if (!targetBand) return null;
  const numericBand = parseFloat(targetBand);
  if (Number.isNaN(numericBand)) return null;
  if (numericBand >= 7.5) return "7.5+";
  if (numericBand >= 7.0) return "7.0";
  if (numericBand >= 6.5) return "6.5";
  if (numericBand >= 6.0) return "6.0";
  if (numericBand >= 5.0) return "5.0";
  return "4.0";
};

export default function CertificateDetail() {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { error: showErrorToast } = useToast();

  const cert = CERTIFICATES.find((c) => c.id === (certId as CertId)) ?? CERTIFICATES[0];
  const isEnglish = cert.type === "english";
  const isIelts = cert.id === "ielts";
  const isToeic = cert.id === "toeic";

  const discussions = DISCUSSIONS[cert.id] ?? [];
  const practiceTests = getPracticeTests(cert.id);
  const mosTasks = getMosTasksBycert(cert.id);

  const [activeSkill, setActiveSkill] = useState<EnglishSkill>(isIelts ? "listening" : "grammar");
  const [selectedBand, setSelectedBand] = useState<CertBand | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  const [manualGoalBand, setManualGoalBand] = useState<string | null>(null);
  const [manualExamDate, setManualExamDate] = useState<string | null>(null);
  const [realCurrentBand, setRealCurrentBand] = useState<string | null>(null);
  const [isIeltsSetupOpen, setIsIeltsSetupOpen] = useState(false);
  const [draftGoalBand, setDraftGoalBand] = useState("");
  const [draftExamDate, setDraftExamDate] = useState("");

  const [showFirstGuidePopup, setShowFirstGuidePopup] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [toeicGuideCompleted, setToeicGuideCompleted] = useState<boolean>(true);
  const [isSavingGuide, setIsSavingGuide] = useState(false);
  const guideDismissedInSessionRef = useRef(false);
  const [toeicProfile, setToeicProfile] = useState<ToeicIntakeProfile | null>(() =>
    cert.id === "toeic" ? getToeicIntakeProfile() : null,
  );

  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);

  useEffect(() => {
    getEnrollment(cert.id).then(setEnrollment).catch(() => { });
  }, [cert.id]);

  const enrollmentTargetBand = useMemo(() => {
    if (enrollment?.target_score == null) return null;
    return normalizeBand(String(enrollment.target_score));
  }, [enrollment?.target_score]);

  const urlBand = searchParams.get("band") as CertBand | null;
  useEffect(() => {
    if (isIelts) return;
    if (urlBand) return setSelectedBand(urlBand);
    if (isToeic) return setSelectedBand(toeicProfile?.recommendedBand ?? null);
    setSelectedBand(null);
  }, [isIelts, isToeic, toeicProfile, urlBand]);

  useEffect(() => {
    if (!isIelts) return;
    try {
      setManualGoalBand(normalizeBand(window.localStorage.getItem(IELTS_GOAL_BAND_STORAGE_KEY)));
      setManualExamDate(window.localStorage.getItem(IELTS_EXAM_DATE_STORAGE_KEY) || null);
      setRealCurrentBand(normalizeBand(window.localStorage.getItem(IELTS_CURRENT_BAND_STORAGE_KEY)));
    } catch {
      // ignore
    }
  }, [isIelts]);

  useEffect(() => {
    if (!isIelts) return;
    const params = new URLSearchParams(location.search);
    const incomingGoalBand = normalizeBand(params.get("goalBand"));
    const incomingCurrentBand = normalizeBand(params.get("currentBand"));
    const incomingExamDate = params.get("examDate");

    if (incomingGoalBand) {
      setManualGoalBand(incomingGoalBand);
      try { window.localStorage.setItem(IELTS_GOAL_BAND_STORAGE_KEY, incomingGoalBand); } catch { }
    }
    if (incomingCurrentBand) {
      setRealCurrentBand(incomingCurrentBand);
      try { window.localStorage.setItem(IELTS_CURRENT_BAND_STORAGE_KEY, incomingCurrentBand); } catch { }
    }
    if (incomingExamDate) {
      setManualExamDate(incomingExamDate);
      try { window.localStorage.setItem(IELTS_EXAM_DATE_STORAGE_KEY, incomingExamDate); } catch { }
    }
  }, [isIelts, location.search]);

  useEffect(() => {
    if (!isToeic) {
      setToeicProfile(null);
      setToeicGuideCompleted(true);
      guideDismissedInSessionRef.current = false;
      return;
    }

    guideDismissedInSessionRef.current = false;
    const localProfile = getToeicIntakeProfile();
    setToeicProfile(localProfile);

    hydrateToeicProfileFromServer(localProfile).then((hydrated) => {
      if (!hydrated) return;
      setToeicProfile(hydrated);
      saveToeicIntakeProfile(hydrated);
    });

    getToeicPlanSync().then((synced) => {
      if (guideDismissedInSessionRef.current) return;
      setToeicGuideCompleted(Boolean(synced?.first_guide_shown));
    }).catch(() => { });
  }, [isToeic]);

  const derivedIeltsBand = useMemo(() => {
    if (!isIelts) return null;
    return mapCalibrationBandToCertBand(manualGoalBand ?? enrollmentTargetBand ?? null);
  }, [isIelts, manualGoalBand, enrollmentTargetBand]);

  const effectiveSelectedBand = isIelts ? derivedIeltsBand : selectedBand;

  const skills = useMemo(
    () => getSkills(cert.id, effectiveSelectedBand ?? undefined),
    [cert.id, effectiveSelectedBand],
  );

  const activeSkillData = skills.find((s) => s.id === activeSkill);
  const roadmapSteps = getRoadmap(cert.id, effectiveSelectedBand ?? undefined);
  const radarData = skills.map((section) => {
    const total = section.topics.length;
    if (!total) return 0;
    const completed = section.topics.filter((topic) => topic.done).length;
    return Math.round((completed / total) * 100);
  });
  const radarLabels = skills.map((s) => s.label);

  const nextTopic = useMemo(() => {
    for (const section of skills) {
      const pending = section.topics.find((t) => t.topicKey && !t.done);
      if (pending) return pending;
    }
    return skills[0]?.topics.find((t) => t.topicKey) ?? null;
  }, [skills]);

  const handleSelectBand = useCallback((band: CertBand) => {
    setSelectedBand(band);
    if (isToeic) setToeicProfile(getToeicIntakeProfile());
    if (!isIelts) {
      const params = new URLSearchParams(searchParams);
      params.set("band", band);
      setSearchParams(params, { replace: true });
    }
  }, [isToeic, isIelts, searchParams, setSearchParams]);

  const handleChangeBand = useCallback(() => {
    if (isIelts) return;
    setSelectedBand(null);
    const params = new URLSearchParams(searchParams);
    params.delete("band");
    setSearchParams(params, { replace: true });
  }, [isIelts, searchParams, setSearchParams]);

  const buildLessonUrl = useCallback((topicKey: string, mode?: string) => {
    const params: string[] = [];
    if (effectiveSelectedBand) params.push(`band=${effectiveSelectedBand}`);
    if (mode) params.push(`mode=${mode}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return `/student/certificate-review/${cert.id}/lesson/${topicKey}${query}`;
  }, [cert.id, effectiveSelectedBand]);

  const handleStartPlan = useCallback(() => {
    if (!nextTopic?.topicKey) return;
    navigate(buildLessonUrl(nextTopic.topicKey));
  }, [nextTopic, navigate, buildLessonUrl]);

  const handleOpenIeltsSetup = useCallback(() => {
    setDraftGoalBand(manualGoalBand ?? enrollmentTargetBand ?? "");
    setDraftExamDate(manualExamDate ?? "");
    setIsIeltsSetupOpen(true);
  }, [manualGoalBand, enrollmentTargetBand, manualExamDate]);

  const handleSaveIeltsSetup = useCallback(async () => {
    const normalizedGoalBand = normalizeBand(draftGoalBand);
    setManualGoalBand(normalizedGoalBand);
    setManualExamDate(draftExamDate || null);
    setIsIeltsSetupOpen(false);

    // Persist to localStorage immediately
    try {
      if (normalizedGoalBand) window.localStorage.setItem(IELTS_GOAL_BAND_STORAGE_KEY, normalizedGoalBand);
      if (draftExamDate) window.localStorage.setItem(IELTS_EXAM_DATE_STORAGE_KEY, draftExamDate);
    } catch { }

    // Sync to backend and regenerate roadmap if there's a valid target band
    if (normalizedGoalBand) {
      try {
        const currentBandStr = realCurrentBand ?? enrollmentTargetBand;
        await ieltsAdaptiveApi.updateMyTargets({
          target_band: Number(normalizedGoalBand),
          ...(currentBandStr ? { current_band: Number(currentBandStr) } : {}),
          ...(draftExamDate ? { target_completion_date: draftExamDate } : {}),
        });
        // Refresh enrollment data after update
        getEnrollment(cert.id).then(setEnrollment).catch(() => { });
      } catch {
        // Silently fail – local state is already updated
      }
    }
  }, [draftGoalBand, draftExamDate, realCurrentBand, enrollmentTargetBand, cert.id]);

  const goalBandDisplay = isIelts ? (manualGoalBand ?? enrollmentTargetBand ?? "--") : (enrollmentTargetBand ?? "--");
  const currentBandDisplay = realCurrentBand ?? "--";

  const dDayValue = useMemo(() => {
    if (!manualExamDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(manualExamDate);
    examDate.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  }, [manualExamDate]);

  const examDateLabel = manualExamDate
    ? new Date(manualExamDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  const skillRoadmapTopicKey = useMemo(() => ({
    reading: skills.find((section) => section.id === "reading")?.topics.find((t) => t.topicKey)?.topicKey,
    listening: skills.find((section) => section.id === "listening")?.topics.find((t) => t.topicKey)?.topicKey,
    writing: skills.find((section) => section.id === "writing")?.topics.find((t) => t.topicKey)?.topicKey,
    speaking: skills.find((section) => section.id === "speaking")?.topics.find((t) => t.topicKey)?.topicKey,
  }), [skills]);

  const handleOpenSkillRoadmap = useCallback((skill: "reading" | "listening" | "writing" | "speaking") => {
    const topicKey = skillRoadmapTopicKey[skill];
    if (!topicKey) return;
    navigate(buildLessonUrl(topicKey));
  }, [skillRoadmapTopicKey, navigate, buildLessonUrl]);

  const highlightTopics = (activeSkillData?.topics ?? []).slice(0, 3);
  const streakDays = Math.min(21, Math.max(1, Math.round((enrollment?.progress_percent ?? 0) / 5) || 1));

  useEffect(() => {
    if (!isToeic || !effectiveSelectedBand || !toeicProfile || toeicGuideCompleted) return;
    if (!showFirstGuidePopup) {
      setShowFirstGuidePopup(true);
      setGuideStep(0);
    }
  }, [isToeic, effectiveSelectedBand, toeicProfile, toeicGuideCompleted, showFirstGuidePopup]);

  const handleCloseGuide = useCallback(async () => {
    if (!toeicProfile || isSavingGuide) return;
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
      setShowFirstGuidePopup(false);
      setToeicGuideCompleted(true);
    } catch {
      showErrorToast("Không thể lưu trạng thái hướng dẫn.");
    } finally {
      setIsSavingGuide(false);
    }
  }, [toeicProfile, isSavingGuide, showErrorToast]);

  const handleSimulatorComplete = useCallback((_result: TaskResult) => { }, []);

  void user;

  if (!isIelts && !effectiveSelectedBand) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <BandSelector cert={cert} onSelect={handleSelectBand} onBack={() => navigate("/student/certificate-review")} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => navigate("/student/certificate-review")} className="flex items-center gap-1 font-medium hover:text-purple-600 transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Ôn Luyện Chứng Chỉ
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">{cert.label}</span>
        </nav>

        {isIelts ? (
          <IeltsCertificateSection
            goalBandDisplay={goalBandDisplay}
            currentBandDisplay={currentBandDisplay}
            examDateLabel={examDateLabel}
            dDayValue={dDayValue}
            isIeltsSetupOpen={isIeltsSetupOpen}
            setIsIeltsSetupOpen={setIsIeltsSetupOpen}
            draftGoalBand={draftGoalBand}
            setDraftGoalBand={setDraftGoalBand}
            draftExamDate={draftExamDate}
            setDraftExamDate={setDraftExamDate}
            handleSaveIeltsSetup={handleSaveIeltsSetup}
            handleOpenIeltsSetup={handleOpenIeltsSetup}
            handleStartPlan={handleStartPlan}
            nextTopicKey={nextTopic?.topicKey}
            highlightTopics={highlightTopics}
            streakDays={streakDays}
            effectiveSelectedBand={effectiveSelectedBand}
            handleOpenSkillRoadmap={handleOpenSkillRoadmap}
            skillRoadmapTopicKey={skillRoadmapTopicKey}
          />
        ) : (
          <section className={`bg-gradient-to-r ${cert.bgFrom} ${cert.bgTo} rounded-2xl p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{cert.label}</h1>
                <p className="text-sm text-white/70">{cert.sublabel}</p>
              </div>
              <button onClick={handleChangeBand} className="px-3 py-1 rounded-lg bg-white/15 text-xs">Đổi mục tiêu</button>
            </div>
          </section>
        )}

        {isEnglish && !isIelts && (
          <>
            {isToeic && toeicProfile && <ToeicRoadmapBoard profile={toeicProfile} onProfileUpdated={setToeicProfile} onOpenTopic={() => { }} />}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileCheck className="w-4 h-4 text-purple-500" /> Kho đề thi thử</h3>
              <PracticeTestList tests={practiceTests} />
            </section>
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-purple-500" /> Lộ trình học</h3>
              <RoadmapView steps={roadmapSteps} />
            </section>
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-purple-500" /> Phân tích kỹ năng</h3>
              <div className="h-56"><SkillRadar data={radarData} labels={radarLabels} /></div>
            </section>
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (<SkillTopicCard key={skill.id} section={skill} />))}
              </div>
            </section>
          </>
        )}

        {!isEnglish && (
          <>
            {showSimulator ? (
              <section className="-mx-4 sm:-mx-6 lg:-mx-8">
                <div style={{ height: "calc(100vh - 140px)" }}>
                  <MosWordSimulator onComplete={handleSimulatorComplete} onBack={() => setShowSimulator(false)} />
                </div>
              </section>
            ) : (
              <section>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Lộ trình MOS</h3>
                  <RoadmapView steps={roadmapSteps} />
                </div>
                {cert.id !== "mos-word" && <MosTaskPanel tasks={mosTasks} certId={cert.id} />}
              </section>
            )}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-2xl p-5"><Clock className="w-5 h-5 text-blue-600" /><p className="mt-2 text-xs">50 phút cho bài thi</p></div>
              <div className="bg-slate-50 rounded-2xl p-5"><Monitor className="w-5 h-5 text-purple-600" /><p className="mt-2 text-xs">Thi trên máy tính</p></div>
              <div className="bg-slate-50 rounded-2xl p-5"><Trophy className="w-5 h-5 text-amber-600" /><p className="mt-2 text-xs">Đạt 700/1000</p></div>
            </section>
          </>
        )}

        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-purple-500" /> Thảo luận gần đây</h3>
          <div className="space-y-2">
            {discussions.map((item, i) => (<p key={i} className="text-sm text-slate-600">{item.q}</p>))}
          </div>
        </section>
      </main>
      <Footer />

      {isToeic && effectiveSelectedBand && toeicProfile && (
        <ToeicFirstGuidePopup
          open={showFirstGuidePopup}
          step={guideStep}
          isSaving={isSavingGuide}
          onPrevious={() => setGuideStep((prev) => Math.max(prev - 1, 0))}
          onNext={() => setGuideStep((prev) => Math.min(prev + 1, 1))}
          onClose={handleCloseGuide}
        />
      )}
    </div>
  );
}
