import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ChevronRight,
    Clock,
    Target,
    Calendar,
    Trophy,
    CheckCircle2,
    PlayCircle,
    Lock,
    Zap,
    TrendingUp,
    Loader2,
    RotateCcw,
    X,
    BookOpen,
    Headphones,
    PenLine,
    Mic2,
    BookMarked,
    Layers,
    BarChart2,
    Star,
    Sparkles,
    LayoutDashboard,
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { ieltsAdaptiveApi } from "@/services/ielts-adaptive/api";
import { LessonStatus, type Lesson, type Roadmap } from "../../types/ielts-adaptive.types";
import StudentLeaderboard from "./components/StudentLeaderboard";
import { MasterVocabModal } from "../ielts-adaptive/components/MasterVocabModal";
import AiInsightSection from "../ielts-adaptive/components/AiInsightSection";

const SKILL_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
    reading: { icon: <BookOpen className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Reading" },
    listening: { icon: <Headphones className="w-4 h-4" />, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-100", label: "Listening" },
    writing: { icon: <PenLine className="w-4 h-4" />, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", label: "Writing" },
    speaking: { icon: <Mic2 className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Speaking" },
    grammar: { icon: <BookMarked className="w-4 h-4" />, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Grammar" },
    vocabulary: { icon: <Layers className="w-4 h-4" />, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", label: "Vocabulary" },
};

const STATUS_CFG = {
    [LessonStatus.COMPLETED]: {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        badge: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500",
        btnLabel: "Review", btnClass: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700",
        label: "Hoàn thành",
    },
    [LessonStatus.IN_PROGRESS]: {
        icon: <PlayCircle className="w-4 h-4 text-amber-500" />,
        badge: "bg-amber-50 text-amber-700", bar: "bg-amber-500",
        btnLabel: "Tiếp tục", btnClass: "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200",
        label: "Đang học",
    },
    [LessonStatus.UNLOCKED]: {
        icon: <PlayCircle className="w-4 h-4 text-blue-500" />,
        badge: "bg-blue-50 text-blue-700", bar: "bg-blue-400",
        btnLabel: "Bắt đầu", btnClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200",
        label: "Sẵn sàng",
    },
    [LessonStatus.LOCKED]: {
        icon: <Lock className="w-4 h-4 text-slate-400" />,
        badge: "bg-slate-100 text-slate-500", bar: "bg-slate-200",
        btnLabel: "Khoá", btnClass: "bg-slate-100 text-slate-400 cursor-not-allowed",
        label: "Khoá",
    },
};

const normalizeBand = (val: string | number) => {
    const num = parseFloat(String(val));
    return isNaN(num) ? null : Math.max(1, Math.min(9, Math.round(num * 2) / 2));
};

// ── main ──────────────────────────────────────────────────────────────────────

export const IeltsRoadmapPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSkill, setActiveSkill] = useState<string | null>(null);
    const [showPlacementSuccess, setShowPlacementSuccess] = useState(false);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [draftTargetBand, setDraftTargetBand] = useState("");
    const [draftCompletionDate, setDraftCompletionDate] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);

    const readIncomingBand = (stateValue: unknown, queryValue: string | null) => {
        if (stateValue !== undefined && stateValue !== null) {
            return normalizeBand(stateValue as string | number);
        }
        if (queryValue != null) {
            return normalizeBand(queryValue);
        }
        return null;
    };

    // ── load ─────────────────────────────────────────────────────────────────
    const loadRoadmap = useCallback(async () => {
        try {
            setLoading(true); setError(null);
            const params = new URLSearchParams(location.search);
            const incomingCurrentBand = readIncomingBand(location.state?.currentBand, params.get("currentBand"));
            const incomingTargetBand = readIncomingBand(location.state?.targetBand, params.get("targetBand"));
            const hasIncomingBands = incomingCurrentBand != null || incomingTargetBand != null;

            if (hasIncomingBands) {
                try {
                    const existing = await ieltsAdaptiveApi.getMyRoadmap();
                    if (existing?.roadmap) {
                        const updatePayload: { current_band?: number; target_band?: number } = {};
                        if (incomingCurrentBand != null) updatePayload.current_band = incomingCurrentBand;
                        if (incomingTargetBand != null) updatePayload.target_band = incomingTargetBand;
                        if (Object.keys(updatePayload).length === 0) {
                            updatePayload.current_band = existing.roadmap.current_band;
                            updatePayload.target_band = existing.roadmap.target_band || (existing.roadmap.current_band + 1);
                        }
                        await ieltsAdaptiveApi.updateMyTargets(updatePayload);
                    } else {
                        const baseCurrent = incomingCurrentBand ?? 4.0;
                        const baseTarget = incomingTargetBand ?? (baseCurrent + 1);
                        await ieltsAdaptiveApi.generateMyRoadmap({ current_band: baseCurrent, target_band: baseTarget });
                    }
                    setShowPlacementSuccess(true);
                    setTimeout(() => setShowPlacementSuccess(false), 5000);
                    if (location.search) {
                        window.history.replaceState({}, document.title, location.pathname);
                    } else {
                        window.history.replaceState({}, document.title);
                    }
                } catch (e) { console.error(e); }
            }
            const my = await ieltsAdaptiveApi.getMyRoadmap();
            if (my?.roadmap) {
                setRoadmap({ ...my.roadmap, lessons: my.lessons || [] });
            } else {
                setRoadmap(await ieltsAdaptiveApi.getRoadmap(0));
            }
        } catch (err: any) {
            setError(err.message || "Failed to load roadmap.");
        } finally {
            setLoading(false);
        }
    }, [location.state, location.search, location.pathname]);

    useEffect(() => { loadRoadmap(); }, [loadRoadmap]);

    // ── actions ───────────────────────────────────────────────────────────────
    const handleStartLesson = (lesson: Lesson) => {
        if (lesson.status === LessonStatus.LOCKED) return;
        navigate(`/ielts-adaptive/lesson/${lesson.id}`);
    };
    const handleOpenAiModule = () => {
        const fallbackLesson = roadmap?.lessons?.find(l => l.status !== LessonStatus.LOCKED)
            || roadmap?.lessons?.[0];
        if (!fallbackLesson) return;
        navigate(`/ielts-adaptive/lesson/${fallbackLesson.id}`);
    };
    const handleOpenTargetModal = () => {
        if (!roadmap) return;
        setDraftTargetBand(String(roadmap.target_band));
        setDraftCompletionDate(roadmap.target_completion_date?.split("T")[0] || "");
        setShowTargetModal(true);
    };
    const handleSaveTargets = async () => {
        const targetBand = normalizeBand(draftTargetBand);
        if (!targetBand) { setSaveError("Vui lòng nhập Band mục tiêu hợp lệ (1.0 – 9.0)."); return; }
        setSaving(true); setSaveError(null);
        try {
            await ieltsAdaptiveApi.updateMyTargets({ target_band: targetBand, target_completion_date: draftCompletionDate || undefined });
            await loadRoadmap();
            setShowTargetModal(false);
        } catch (err: any) {
            setSaveError(err.response?.data?.message || "Cập nhật thất bại. Thử lại sau.");
        } finally { setSaving(false); }
    };

    // ── derived ───────────────────────────────────────────────────────────────
    const completedLessons = roadmap?.lessons?.filter(l => l.status === LessonStatus.COMPLETED).length ?? 0;
    const currentLesson = roadmap?.lessons?.find(l => l.status === LessonStatus.IN_PROGRESS)
        || roadmap?.lessons?.find(l => l.status === LessonStatus.UNLOCKED);
    const totalLessons = roadmap?.lessons?.length ?? 0;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const parseDateParts = (iso: string): [number, number, number] | null => {
        const parts = iso.split(/[T ]/)[0].split("-").map(Number);
        return parts.length === 3 && !parts.some(isNaN) ? [parts[0], parts[1], parts[2]] : null;
    };
    const dDayValue = (() => {
        if (!roadmap?.target_completion_date) return null;
        const p = parseDateParts(roadmap.target_completion_date); if (!p) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return Math.max(0, Math.ceil((new Date(p[0], p[1] - 1, p[2]).getTime() - today.getTime()) / 86400000));
    })();
    const examDateLabel = (() => {
        if (!roadmap?.target_completion_date) return null;
        const p = parseDateParts(roadmap.target_completion_date); if (!p) return null;
        return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    })();

    const skillKeys = ["reading", "listening", "writing", "speaking", "grammar", "vocabulary"];
    const skillStats = skillKeys.map(sk => {
        const lessons = roadmap?.lessons?.filter(l => l.skill_area === sk) ?? [];
        let doneScore = 0;
        lessons.forEach(l => {
            if (l.status === LessonStatus.COMPLETED) {
                doneScore += 1;
            } else if (l.status === LessonStatus.IN_PROGRESS) {
                doneScore += 0.5;
            }
        });
        const pct = lessons.length > 0 ? Math.min(100, Math.round((doneScore / lessons.length) * 100)) : 0;
        return { key: sk, total: lessons.length, done: doneScore, pct };
    });
    const filteredLessons = activeSkill ? (roadmap?.lessons?.filter(l => l.skill_area === activeSkill) ?? []) : [];

    useEffect(() => {
        if (!currentLesson || typeof window === "undefined") return;
        window.localStorage.setItem("ieltsCurrentLessonTitle", currentLesson.lesson_title || "");
        window.localStorage.setItem("ieltsCurrentLessonSkill", currentLesson.skill_area || "");
    }, [currentLesson]);

    // ── guards ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 text-sm font-medium">Đang chuẩn bị lộ trình của bạn...</p>
            </div>
            <Footer />
        </div>
    );

    if (error || !roadmap) return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-sm shadow-sm">
                    <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-800 font-bold mb-2">Không thể tải dữ liệu</p>
                    <p className="text-slate-500 text-sm mb-6">{error || "Vui lòng thử lại sau."}</p>
                    <button onClick={loadRoadmap} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Thử lại
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#EBF4FF] flex flex-col font-sans">
            <Header />

            <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 py-8 space-y-6">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                    <button onClick={() => navigate("/student/certificate-review")} className="hover:text-indigo-600 transition-colors">Ôn luyện</button>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-900">IELTS Roadmap</span>
                </nav>

                {/* ── Hero ── */}
                <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1A4A7A] via-[#1D5A96] to-[#1E3F6E] border border-white/10 p-8 shadow-[0_20px_60px_rgba(26,74,122,0.35)]">
                    <div className="absolute top-0 right-0 w-[360px] h-[360px] bg-[radial-gradient(circle,rgba(106,174,224,0.18),transparent_70%)] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-[30%] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(43,125,196,0.25),transparent_70%)] translate-y-1/2 pointer-events-none" />
                    <div className="absolute inset-0 rounded-[24px] opacity-70 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(195,220,247,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(195,220,247,0.06) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

                    <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
                        <div className="flex-1 space-y-6">
                            <div>
                                <p className="text-[10px] font-bold text-[#6AAEE0] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#6AAEE0] animate-pulse" /> IELTS Adaptive Roadmap
                                </p>
                                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                                    Chinh phục <span className="text-[#6AAEE0]">Band {roadmap.target_band.toFixed(1)}</span> với lộ trình cá nhân hoá.
                                </h1>
                                <p className="mt-3 text-[#C3DCF7]/80 text-sm">
                                    {examDateLabel
                                        ? `Còn ${dDayValue} ngày trước kỳ thi ${examDateLabel} · Hôm nay hãy khoá thêm 1 kỹ năng nhé!`
                                        : "Hãy đặt mục tiêu ngày thi để hệ thống tối ưu lộ trình cho bạn."}
                                </p>
                            </div>

                            {/* KPI Pills */}
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: "Current", val: roadmap.current_band.toFixed(1), icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-white" },
                                    { label: "Target", val: roadmap.target_band.toFixed(1), icon: <Target className="w-3.5 h-3.5" />, color: "text-amber-300" },
                                    { label: "D-Day", val: dDayValue ?? "—", icon: <Calendar className="w-3.5 h-3.5" />, color: "text-emerald-300" },
                                    { label: "Progress", val: `${progressPercent}%`, icon: <Star className="w-3.5 h-3.5" />, color: "text-[#6AAEE0]" },
                                ].map((kpi, i) => (
                                    <div key={i} className="px-4 py-3 rounded-2xl border bg-white/10 border-white/15 flex flex-col gap-0.5 min-w-[100px] backdrop-blur-md">
                                        <span className="text-[9px] font-bold text-[#6AAEE0] uppercase tracking-widest flex items-center gap-1">{kpi.icon} {kpi.label}</span>
                                        <span className={`text-xl font-black ${kpi.color}`}>{kpi.val}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2 max-w-md">
                                <div className="flex justify-between text-[11px] font-bold text-[#C3DCF7]/70">
                                    <span>{completedLessons} bài hoàn thành · {totalLessons - completedLessons} bài còn lại</span>
                                    <span className="text-[#6AAEE0]">{progressPercent}%</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#2B7DC4] to-[#6AAEE0] rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {currentLesson && (
                                    <button onClick={() => handleStartLesson(currentLesson)} className="px-6 py-3 rounded-xl bg-[#2B7DC4] text-white font-bold text-sm hover:bg-[#3589cf] transition-all shadow-md flex items-center gap-2">
                                        <Zap className="w-4 h-4 fill-white" /> Bắt đầu bài tiếp theo
                                    </button>
                                )}
                                <button onClick={handleOpenTargetModal} className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 font-bold text-sm hover:bg-white/20 transition-all">
                                    ✎ Cập nhật mục tiêu
                                </button>
                            </div>
                        </div>

                        {/* Current Lesson Card */}
                        <div className="w-full lg:w-[280px] shrink-0">
                            <div className="bg-white/10 border border-white/20 rounded-[20px] p-5 shadow-sm relative overflow-hidden backdrop-blur-md">
                                <p className="text-[10px] font-bold text-[#6AAEE0] uppercase tracking-widest mb-4">📌 Bài học hiện tại</p>
                                {currentLesson ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${SKILL_META[currentLesson.skill_area]?.color.replace("text-", "bg-")}`} />
                                            <span className={`text-[11px] font-bold uppercase ${SKILL_META[currentLesson.skill_area]?.color}`}>{SKILL_META[currentLesson.skill_area]?.label}</span>
                                        </div>
                                        <h3 className="text-sm font-bold text-white leading-snug">{currentLesson.lesson_title}</h3>
                                        <div className="flex items-center gap-3 text-[11px] text-[#C3DCF7]/70 font-medium">
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {currentLesson.estimated_minutes} phút</span>
                                            <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Band {currentLesson.band_level.toFixed(1)}</span>
                                        </div>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {currentLesson.flashcard_repo_id && <span className="px-2 py-0.5 rounded-md bg-indigo-400/15 text-indigo-200 text-[9px] font-bold uppercase">Flashcard</span>}
                                            {currentLesson.practice_repo_id && <span className="px-2 py-0.5 rounded-md bg-emerald-400/15 text-emerald-200 text-[9px] font-bold uppercase">Practice</span>}
                                            {currentLesson.mini_test_repo_id && <span className="px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-200 text-[9px] font-bold uppercase">Mock Test</span>}
                                        </div>
                                        <button onClick={() => handleStartLesson(currentLesson)} className="w-full py-2.5 rounded-xl bg-[#2B7DC4] text-white font-bold text-[12px] hover:bg-[#3589cf] transition-all flex items-center justify-center gap-1">
                                            Bắt đầu →
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                                        <p className="text-white font-bold text-sm">Hoàn thành!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Streak Bar ── */}
                <section className="bg-white/80 border border-slate-100/80 rounded-2xl p-4 flex items-center gap-5 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">🔥</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">Streak <span className="text-orange-500">{completedLessons}</span> ngày liên tiếp</span>
                            <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">On Fire</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Duy trì mỗi ngày để nhận phần thưởng tuần!</p>
                    </div>
                    <div className="flex gap-1.5">
                        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => {
                            const isDone = i < completedLessons % 7;
                            const isToday = i === (new Date().getDay() + 6) % 7;
                            return (
                                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${isDone ? "bg-orange-50 border-orange-200 text-orange-500" :
                                    isToday ? "bg-indigo-50/70 border-indigo-300 text-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.2)]" :
                                        "bg-white/70 border-slate-100 text-slate-300"
                                    }`}>{d}</div>
                            );
                        })}
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════════
                    MAIN 2-COLUMN GRID
                    Left  (flex-1): Skill cards + content sections
                    Right (340px) : Leaderboard
                ══════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

                    {/* ── LEFT COLUMN ── */}
                    <div className="space-y-6 min-w-0">

                        {/* Skill Progress */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-800">Tiến độ theo kỹ năng</h2>
                                {activeSkill && (
                                    <span className="ml-auto text-[10px] text-slate-400 font-semibold">
                                        Click vào kỹ năng để xem bài học →
                                    </span>
                                )}
                            </div>
                            {/* 4-column skill grid — always 4 cols on md+ */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {skillStats.slice(0, 4).map(sk => {
                                    const meta = SKILL_META[sk.key] || SKILL_META.reading;
                                    const isActive = activeSkill === sk.key;
                                    return (
                                        <div
                                            key={sk.key}
                                            onClick={() => setActiveSkill(isActive ? null : sk.key)}
                                            className={`group relative bg-white/85 border rounded-2xl p-4 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${isActive ? "border-indigo-300 ring-1 ring-indigo-100 shadow-md -translate-y-1" : "border-slate-100/80"
                                                }`}
                                        >
                                            {isActive && (
                                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <span className="text-white text-[8px] font-black">✓</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg}`}>{meta.icon}</div>
                                                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 ${meta.color}`}>
                                                    {roadmap.current_band.toFixed(1)}→{roadmap.target_band.toFixed(1)}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800 mb-0.5">{meta.label}</h3>
                                            <p className="text-[11px] text-slate-500 mb-3">
                                                {sk.done % 1 !== 0 
                                                    ? `Bài ${Math.floor(sk.done) + 1} (Part 1/2) · Đang ôn`
                                                    : `${sk.done}/${sk.total} bài · ${sk.pct === 100 ? "Đã xong" : sk.pct > 0 ? "Đang ôn" : "Mới bắt đầu"}`
                                                }
                                            </p>
                                            <div className="h-1 bg-slate-100/70 rounded-full overflow-hidden">
                                                <div className={`h-full ${meta.color.replace("text-", "bg-")} transition-all duration-1000`} style={{ width: `${sk.pct}%` }} />
                                            </div>
                                            <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400">
                                                <span>0%</span><span className={meta.color}>{sk.pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Recommended */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-base font-bold text-slate-800">Đề xuất cho bạn</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { icon: "📖", type: "Từ vựng", title: "Kho từ vựng của tôi", 
                                      desc: "Từ đã lưu từ tất cả bài học", color: "indigo",
                                      onClick: () => setIsVocabModalOpen(true) },
                                    { icon: "🧠", type: "Trợ lý AI", title: "Chat với AI Tutor",
                                      desc: currentLesson ? `Đang học: ${currentLesson.lesson_title}` : "Hỏi đáp, sửa lỗi ngữ pháp",
                                      color: "emerald", onClick: handleOpenAiModule },
                                ].map((rec, i) => (
                                    <div
                                        key={i}
                                        onClick={rec.onClick}
                                        className={`bg-white/85 border border-slate-100/80 rounded-xl p-4 flex items-start gap-4 transition-colors ${typeof rec.onClick === "function" ? "cursor-pointer hover:bg-white group shadow-xs" : "cursor-default"}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl bg-${rec.color}-50 flex items-center justify-center text-xl shrink-0`}>{rec.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rec.type}</p>
                                            <h4 className="text-[13px] font-bold text-slate-800">{rec.title}</h4>
                                            <p className="text-[11px] text-slate-400">{rec.desc}</p>
                                        </div>
                                        <span className={`text-xs font-bold text-indigo-600 transition-opacity shrink-0 ${typeof rec.onClick === "function" ? "opacity-0 group-hover:opacity-100" : "opacity-0"}`}>→</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* AI Insight */}
                        <AiInsightSection onNavigateToLesson={handleOpenAiModule} />

                        {/* Band Test CTA */}
                        <section className="bg-gradient-to-br from-[#1A4A7A] via-[#1D5A96] to-[#1E3F6E] rounded-[22px] p-6 text-white relative overflow-hidden shadow-[0_18px_40px_rgba(26,74,122,0.28)]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(106,174,224,0.2),transparent_60%)] pointer-events-none" />
                            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                        <Trophy className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black">Luyện tập với Band Test</h3>
                                        <p className="text-indigo-200/75 text-[12px] mt-1 leading-relaxed">
                                            Hoàn thành {completedLessons}/{totalLessons} bài học. Làm bài kiểm tra toàn diện để dự đoán kết quả chính xác nhất.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!roadmap?.id) { alert("Không tìm thấy ID lộ trình."); return; }
                                        navigate(`/ielts-adaptive/band-test/${roadmap.id}`);
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-white/15 text-white font-bold text-[12px] hover:bg-white/25 transition-all border border-white/25 whitespace-nowrap shrink-0"
                                >
                                    🎓 Làm thử Band Test
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* ── RIGHT COLUMN (340px, sticky) ── */}
                    <div className="space-y-4 lg:sticky lg:top-6">
                        <StudentLeaderboard />
                    </div>
                </div>

                {/* ── Lesson Panel (Full-width when a skill is active) ── */}
                {activeSkill && (
                    <section className="bg-white/90 border border-slate-100/80 rounded-[22px] shadow-sm overflow-hidden">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-bold text-slate-800">
                                    Bài học · <span className={SKILL_META[activeSkill]?.color}>{SKILL_META[activeSkill]?.label}</span>
                                </h2>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                    {filteredLessons.length}
                                </span>
                            </div>
                            <button
                                onClick={() => setActiveSkill(null)}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                        </div>

                        {/* Scrollable Lesson List */}
                        <div className="overflow-y-auto max-h-[520px] lg:max-h-[640px] p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
                            {filteredLessons.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm">Không có bài học nào.</div>
                            ) : filteredLessons.map((lesson) => {
                                const cfg = STATUS_CFG[lesson.status] || STATUS_CFG[LessonStatus.LOCKED];
                                const skill = SKILL_META[lesson.skill_area] || SKILL_META.reading;
                                const isLocked = lesson.status === LessonStatus.LOCKED;
                                const isCurrent = currentLesson?.id === lesson.id;
                                return (
                                    <div
                                        key={lesson.id}
                                        onClick={() => handleStartLesson(lesson)}
                                        className={`rounded-xl p-4 border flex flex-col gap-3 transition-all ${isLocked
                                            ? "opacity-55 cursor-not-allowed border-slate-100 bg-white/60"
                                            : `cursor-pointer bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm ${isCurrent ? "ring-1 ring-indigo-200 border-indigo-200" : ""}`
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${skill.color.replace("text-", "bg-")}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${skill.color}`}>{skill.label}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cfg.badge}`}>{cfg.label}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-[13px] font-bold text-slate-800 leading-snug mb-1">{lesson.lesson_title}</h3>
                                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.estimated_minutes}m</span>
                                                <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Band {lesson.band_level.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1">
                                                {lesson.flashcard_repo_id && <span className="text-[10px]" title="Flashcard">📇</span>}
                                                {lesson.practice_repo_id && <span className="text-[10px]" title="Practice">✍️</span>}
                                                {lesson.mini_test_repo_id && <span className="text-[10px]" title="Mock Test">🎯</span>}
                                            </div>
                                            <button className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${cfg.btnClass}`}>
                                                {cfg.btnLabel} →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>

            <Footer />

            {/* ── Targets Modal ── */}
            {showTargetModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
                    onClick={e => { if (e.target === e.currentTarget) setShowTargetModal(false); }}
                >
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Cập nhật mục tiêu</h2>
                                <p className="text-slate-400 text-xs mt-1">Lộ trình sẽ được tối ưu lại theo mục tiêu mới.</p>
                            </div>
                            <button onClick={() => setShowTargetModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-2xl grid grid-cols-2 gap-4 text-center border border-slate-100">
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hiện tại</p>
                                    <p className="text-2xl font-black text-slate-800">{roadmap.current_band.toFixed(1)}</p>
                                </div>
                                <div className="border-l border-slate-200">
                                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Mục tiêu</p>
                                    <p className="text-2xl font-black text-indigo-500">{roadmap.target_band.toFixed(1)}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Band mục tiêu mới</label>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input type="number" min={1} max={9} step={0.5} value={draftTargetBand} onChange={e => setDraftTargetBand(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:outline-none font-bold text-slate-800 transition-all text-sm" placeholder="Ví dụ: 7.5" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ngày thi dự kiến</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input type="date" value={draftCompletionDate} onChange={e => setDraftCompletionDate(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:outline-none font-bold text-slate-800 transition-all text-sm" />
                                    </div>
                                </div>
                            </div>
                            {saveError && <p className="text-[11px] text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">{saveError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowTargetModal(false)} className="flex-1 py-3.5 rounded-2xl border border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm">Huỷ</button>
                                <button onClick={handleSaveTargets} disabled={saving} className="flex-1 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm shadow-md shadow-indigo-500/20">
                                    {saving ? "Đang lưu..." : "Lưu mục tiêu"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <MasterVocabModal
                isOpen={isVocabModalOpen}
                onClose={() => setIsVocabModalOpen(false)}
            />
        </div>
    );
};
