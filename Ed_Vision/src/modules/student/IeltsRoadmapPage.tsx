import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ChevronLeft,
    Target,
    TrendingUp,
    Calendar,
    BookOpen,
    Headphones,
    PenLine,
    Mic2,
    BookMarked,
    Layers,
    Clock,
    CheckCircle2,
    Lock,
    PlayCircle,
    RotateCcw,
    Trophy,
    X,
    ChevronRight,
    Loader2,
    Flame,
    Zap,
    BarChart2,
    Star,
    GraduationCap,
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { ieltsAdaptiveApi } from "@/services/ielts-adaptive/api";
import type { Roadmap, Lesson } from "../../types/ielts-adaptive.types";
import { LessonStatus } from "../../types/ielts-adaptive.types";

// ── helpers ──────────────────────────────────────────────────────────────────

const SKILL_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
    reading: { icon: <BookOpen className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Reading" },
    listening: { icon: <Headphones className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", label: "Listening" },
    writing: { icon: <PenLine className="w-4 h-4" />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Writing" },
    speaking: { icon: <Mic2 className="w-4 h-4" />, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Speaking" },
    grammar: { icon: <BookMarked className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Grammar" },
    vocabulary: { icon: <Layers className="w-4 h-4" />, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", label: "Vocabulary" },
};

const STATUS_CFG = {
    [LessonStatus.COMPLETED]: {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        badge: "bg-emerald-100 text-emerald-700",
        border: "border-emerald-200",
        bar: "bg-emerald-500",
        btnLabel: "Review",
        btnClass: "bg-emerald-500 hover:bg-emerald-600 text-white",
        label: "Hoàn thành",
    },
    [LessonStatus.IN_PROGRESS]: {
        icon: <PlayCircle className="w-4 h-4 text-amber-500" />,
        badge: "bg-amber-100 text-amber-700",
        border: "border-amber-300",
        bar: "bg-amber-500",
        btnLabel: "Tiếp tục",
        btnClass: "bg-amber-500 hover:bg-amber-600 text-white",
        label: "Đang học",
    },
    [LessonStatus.UNLOCKED]: {
        icon: <PlayCircle className="w-4 h-4 text-indigo-500" />,
        badge: "bg-indigo-100 text-indigo-700",
        border: "border-indigo-200",
        bar: "bg-indigo-400",
        btnLabel: "Bắt đầu",
        btnClass: "bg-indigo-500 hover:bg-indigo-600 text-white",
        label: "Sẵn sàng",
    },
    [LessonStatus.LOCKED]: {
        icon: <Lock className="w-4 h-4 text-slate-400" />,
        badge: "bg-slate-100 text-slate-500",
        border: "border-slate-200",
        bar: "bg-slate-200",
        btnLabel: "Khoá",
        btnClass: "bg-slate-200 text-slate-400 cursor-not-allowed",
        label: "Khoá",
    },
};

const normalizeBand = (v: string) => {
    const n = parseFloat(v);
    if (isNaN(n)) return null;
    return Math.min(9, Math.max(1, Math.round(n * 2) / 2));
};

// ── component ─────────────────────────────────────────────────────────────────

export default function IeltsRoadmapPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSkill, setActiveSkill] = useState<string | null>(null);
    const [showPlacementSuccess, setShowPlacementSuccess] = useState(false);

    // target modal
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [draftTargetBand, setDraftTargetBand] = useState("");
    const [draftCompletionDate, setDraftCompletionDate] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // ── load ─────────────────────────────────────────────────────────────────

    const loadRoadmap = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Kiểm tra xem có dữ liệu currentBand từ placement test không
            const placementBand = location.state?.currentBand;
            
            // Nếu có currentBand từ placement test, tạo roadmap mới hoặc cập nhật
            if (placementBand && typeof placementBand === 'number') {
                try {
                    // Thử lấy roadmap hiện tại trước
                    const existingRoadmap = await ieltsAdaptiveApi.getMyRoadmap();
                    
                    if (existingRoadmap?.roadmap) {
                        // Nếu đã có roadmap, cập nhật current_band
                        await ieltsAdaptiveApi.updateMyTargets({
                            current_band: placementBand,
                            target_band: existingRoadmap.roadmap.target_band || placementBand + 1,
                        });
                    } else {
                        // Nếu chưa có roadmap, tạo mới
                        await ieltsAdaptiveApi.generateMyRoadmap({
                            current_band: placementBand,
                            target_band: placementBand + 1, // Mặc định target cao hơn 1 band
                        });
                    }
                    
                    // Hiển thị thông báo thành công
                    setShowPlacementSuccess(true);
                    setTimeout(() => setShowPlacementSuccess(false), 5000);
                    
                    // Xóa state để tránh tạo lại roadmap khi reload
                    window.history.replaceState({}, document.title);
                } catch (err) {
                    console.error('Error creating/updating roadmap with placement result:', err);
                }
            }

            // Tải roadmap (mới hoặc đã cập nhật)
            const myRoadmap = await ieltsAdaptiveApi.getMyRoadmap();
            if (myRoadmap?.roadmap) {
                setRoadmap({ ...myRoadmap.roadmap, lessons: myRoadmap.lessons || [] });
                return;
            }
            
            // Fallback: nếu không có roadmap, tạo mới với band mặc định
            const data = await ieltsAdaptiveApi.getRoadmap(0);
            setRoadmap(data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không thể tải lộ trình.");
        } finally {
            setLoading(false);
        }
    }, [location.state]);

    useEffect(() => { loadRoadmap(); }, [loadRoadmap]);

    // ── actions ──────────────────────────────────────────────────────────────

    const handleStartLesson = (lesson: Lesson) => {
        if (lesson.status === LessonStatus.LOCKED) return;
        navigate(`/ielts-adaptive/lesson/${lesson.id}`);
    };

    const handleOpenTargetModal = () => {
        setDraftTargetBand(roadmap?.target_band?.toString() ?? "");
        const existingDate = roadmap?.target_completion_date;
        setDraftCompletionDate(existingDate ? new Date(existingDate).toISOString().split("T")[0] : "");
        setSaveError(null);
        setShowTargetModal(true);
    };

    const handleSaveTargets = async () => {
        const targetBand = normalizeBand(draftTargetBand);
        if (!targetBand) { setSaveError("Vui lòng nhập Band mục tiêu hợp lệ (1.0 – 9.0)."); return; }
        setSaving(true);
        setSaveError(null);
        try {
            await ieltsAdaptiveApi.updateMyTargets({
                target_band: targetBand,
                ...(roadmap?.current_band ? { current_band: roadmap.current_band } : {}),
                ...(draftCompletionDate ? { target_completion_date: draftCompletionDate } : {}),
            });
            await loadRoadmap();
            setShowTargetModal(false);
        } catch (err: any) {
            setSaveError(err.response?.data?.message || "Cập nhật thất bại. Thử lại sau.");
        } finally {
            setSaving(false);
        }
    };

    // ── derived ──────────────────────────────────────────────────────────────

    const completedLessons = roadmap?.lessons?.filter((l) => l.status === LessonStatus.COMPLETED).length ?? 0;
    const inProgressLesson = roadmap?.lessons?.find((l) => l.status === LessonStatus.IN_PROGRESS);
    const nextUnlocked = roadmap?.lessons?.find((l) => l.status === LessonStatus.UNLOCKED);
    const currentLesson = inProgressLesson ?? nextUnlocked ?? null;
    const totalLessons = roadmap?.lessons?.length ?? 0;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const parseDateParts = (iso: string): [number, number, number] | null => {
        const datePart = iso.split(/[T ]/)[0];
        const parts = datePart.split("-").map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        return [parts[0], parts[1], parts[2]];
    };

    const dDayValue = (() => {
        if (!roadmap?.target_completion_date) return null;
        const parts = parseDateParts(roadmap.target_completion_date);
        if (!parts) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const target = new Date(parts[0], parts[1] - 1, parts[2]);
        return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
    })();

    const examDateLabel = (() => {
        if (!roadmap?.target_completion_date) return null;
        const parts = parseDateParts(roadmap.target_completion_date);
        if (!parts) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    })();

    // skill breakdown
    const skillKeys = ["reading", "listening", "writing", "speaking", "grammar", "vocabulary"];
    const skillStats = skillKeys.map((sk) => {
        const lessons = roadmap?.lessons?.filter((l) => l.skill_area === sk) ?? [];
        const done = lessons.filter((l) => l.status === LessonStatus.COMPLETED).length;
        return { key: sk, total: lessons.length, done, pct: lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0 };
    }).filter((s) => s.total > 0);

    const filteredLessons = activeSkill
        ? roadmap?.lessons?.filter((l) => l.skill_area === activeSkill) ?? []
        : roadmap?.lessons ?? [];

    // ── guards ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-slate-500 text-sm">Đang tải lộ trình IELTS của bạn…</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-sm">
                        <p className="text-red-600 font-semibold mb-1">Lỗi tải dữ liệu</p>
                        <p className="text-red-500 text-sm mb-4">{error}</p>
                        <button onClick={loadRoadmap} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors">
                            <RotateCcw className="w-4 h-4" /> Thử lại
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!roadmap) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-500">Không tìm thấy lộ trình.</p>
                </div>
                <Footer />
            </div>
        );
    }

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-slate-500">
                    <button onClick={() => navigate("/student/certificate-review")} className="flex items-center gap-1 font-medium hover:text-purple-600 transition-colors cursor-pointer">
                        <ChevronLeft className="w-4 h-4" /> Ôn Luyện Chứng Chỉ
                    </button>
                    <span className="text-slate-300">/</span>
                    <span className="font-semibold text-slate-700">IELTS</span>
                </nav>

                {/* Success notification from placement test */}
                {showPlacementSuccess && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-emerald-900 font-bold text-base mb-1">
                                🎉 Lộ trình đã được tạo dựa trên kết quả placement test!
                            </h3>
                            <p className="text-emerald-700 text-sm leading-relaxed">
                                Chúng tôi đã phân tích kết quả kiểm tra đầu vào của bạn và tạo lộ trình học tập cá nhân hóa. 
                                Band hiện tại của bạn là <span className="font-bold">{roadmap.current_band.toFixed(1)}</span>, 
                                và mục tiêu là <span className="font-bold">{roadmap.target_band.toFixed(1)}</span>. 
                                Hãy bắt đầu hành trình chinh phục IELTS ngay hôm nay! 💪
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowPlacementSuccess(false)}
                            className="flex-shrink-0 text-emerald-600 hover:text-emerald-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* ── Hero banner ─────────────────────────────────────────────── */}
                <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#1b1230] via-[#281d52] to-[#472669] p-8 text-white">
                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at top right, rgba(255,255,255,0.35), transparent 50%)" }} />
                    <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row gap-8">
                        {/* Left: title + stats */}
                        <div className="flex-1">
                            <p className="text-xs uppercase tracking-[0.4em] text-white/60">IELTS Adaptive Roadmap</p>
                            <h1 className="mt-3 text-3xl sm:text-4xl font-black leading-tight">
                                Chinh phục Band {roadmap.target_band.toFixed(1)} với lộ trình cá nhân hoá.
                            </h1>
                            <p className="mt-3 text-white/75 text-sm sm:text-base">
                                {examDateLabel
                                    ? `Còn ${dDayValue ?? 0} ngày trước kỳ thi ${examDateLabel}. Hôm nay hãy khoá thêm 1 kỹ năng nhé!`
                                    : "Đặt ngày thi để hệ thống tạo kế hoạch đếm ngược chi tiết cho bạn."}
                            </p>

                            {/* KPI cards */}
                            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { icon: <TrendingUp className="w-3 h-3" />, label: "Current Band", value: roadmap.current_band.toFixed(1), sub: null },
                                    { icon: <Target className="w-3 h-3" />, label: "Target Band", value: roadmap.target_band.toFixed(1), sub: null, amber: true },
                                    { icon: <Calendar className="w-3 h-3" />, label: "D-Day", value: dDayValue != null ? `${dDayValue}` : "—", sub: examDateLabel },
                                    { icon: <BookOpen className="w-3 h-3" />, label: "Tiến độ", value: `${progressPercent}%`, sub: `${completedLessons}/${totalLessons} bài` },
                                ].map((c, i) => (
                                    <div key={i} className={`rounded-2xl px-4 py-3 backdrop-blur border ${c.amber ? "bg-amber-400/20 border-amber-300/30" : "bg-white/10 border-white/15"}`}>
                                        <p className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1 ${c.amber ? "text-amber-200" : "text-white/60"}`}>
                                            {c.icon} {c.label}
                                        </p>
                                        <p className={`text-3xl font-black mt-1 ${c.amber ? "text-amber-200" : "text-white"}`}>{c.value}</p>
                                        {c.sub && <p className="text-white/50 text-xs mt-0.5">{c.sub}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Progress bar */}
                            <div className="mt-5">
                                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-linear-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                                </div>
                                <p className="text-white/50 text-xs mt-1">{completedLessons} bài hoàn thành · {totalLessons - completedLessons} bài còn lại</p>
                            </div>

                            {/* Actions */}
                            <div className="mt-5 flex flex-wrap gap-3">
                                {currentLesson && (
                                    <button onClick={() => handleStartLesson(currentLesson)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-[#1b1230] text-sm font-bold hover:bg-white/90 transition-colors">
                                        <Zap className="w-4 h-4 text-amber-500" />
                                        {currentLesson.status === LessonStatus.IN_PROGRESS ? "Tiếp tục bài học" : "Bắt đầu bài tiếp theo"}
                                    </button>
                                )}
                                <button onClick={handleOpenTargetModal} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                                    <Target className="w-4 h-4" /> Cập nhật mục tiêu
                                </button>
                            </div>
                        </div>

                        {/* Right: current lesson spotlight */}
                        <div className="w-full lg:w-72 bg-white/10 border border-white/15 rounded-3xl p-5 backdrop-blur shrink-0">
                            <p className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
                                <Star className="w-4 h-4 text-amber-300 fill-amber-300" /> Bài học hiện tại
                            </p>
                            {currentLesson ? (
                                <div className="space-y-3">
                                    <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${(SKILL_META[currentLesson.skill_area] ?? SKILL_META.reading).bg} ${(SKILL_META[currentLesson.skill_area] ?? SKILL_META.reading).color}`}>
                                        {(SKILL_META[currentLesson.skill_area] ?? SKILL_META.reading).icon}
                                        {(SKILL_META[currentLesson.skill_area] ?? SKILL_META.reading).label}
                                    </div>
                                    <h3 className="text-base font-bold text-white leading-snug">{currentLesson.lesson_title}</h3>
                                    <div className="flex flex-wrap gap-2 text-xs text-white/60">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {currentLesson.estimated_minutes} phút</span>
                                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Band {currentLesson.band_level.toFixed(1)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {currentLesson.flashcard_repo_id && <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">Flashcard</span>}
                                        {currentLesson.practice_repo_id && <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">Practice</span>}
                                        {currentLesson.mini_test_repo_id && <span className="bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">Mini Test</span>}
                                    </div>
                                    <button onClick={() => handleStartLesson(currentLesson)} className="mt-2 w-full py-2.5 rounded-2xl bg-white text-[#1b1230] text-sm font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-1">
                                        {currentLesson.status === LessonStatus.IN_PROGRESS ? "Tiếp tục" : "Bắt đầu"} <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <Trophy className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                                    <p className="text-white/80 text-sm font-semibold">Tuyệt vời!</p>
                                    <p className="text-white/50 text-xs mt-1">Bạn đã hoàn thành toàn bộ lộ trình.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Streak + band gap bar ─────────────────────────────────── */}
                <section className="flex flex-col sm:flex-row gap-3">
                    <div className="sm:w-44 w-full bg-linear-to-br from-orange-400 via-amber-500 to-yellow-400 rounded-xl border-2 border-orange-400 px-5 py-4 shadow-lg flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-orange-300 blur-md rounded-full" />
                            <div className="relative w-12 h-12 bg-linear-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                                <Flame className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/90 uppercase tracking-wide">Streak</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-white">{completedLessons}</span>
                                <span className="text-sm font-bold text-white/90">bài</span>
                            </div>
                            <p className="text-white/70 text-xs">đã hoàn thành</p>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center gap-4 bg-linear-to-r from-violet-50 via-purple-50 to-indigo-50 rounded-xl border border-violet-200 px-5 py-4">
                        <div className="shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-violet-200">
                            <Target className="w-5 h-5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1.5">
                                <p className="text-xs text-violet-600 font-medium">Band {roadmap.current_band.toFixed(1)} → {roadmap.target_band.toFixed(1)}</p>
                                <p className="text-xs font-bold text-violet-500">{progressPercent}% lộ trình</p>
                            </div>
                            <div className="h-3 bg-violet-200 rounded-full overflow-hidden">
                                <div className="h-full bg-linear-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <p className="text-xs text-violet-500 mt-1">Còn {totalLessons - completedLessons} bài để chinh phục mục tiêu 💪</p>
                        </div>
                    </div>
                </section>

                {/* ── Skill breakdown ───────────────────────────────────────── */}
                {skillStats.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-7 w-1 rounded-full bg-linear-to-b from-blue-400 to-violet-400" />
                            <h2 className="text-xl font-bold text-slate-800">Tiến độ theo kỹ năng</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {skillStats.map((sk) => {
                                const meta = SKILL_META[sk.key] ?? SKILL_META.reading;
                                const isActive = activeSkill === sk.key;
                                return (
                                    <button
                                        key={sk.key}
                                        onClick={() => setActiveSkill(isActive ? null : sk.key)}
                                        className={`bg-white rounded-2xl border-2 p-4 flex flex-col gap-2 text-left transition-all hover:shadow-md ${isActive ? `${meta.border} shadow-md` : "border-slate-100 hover:border-slate-200"}`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                                            {meta.icon}
                                        </div>
                                        <div>
                                            <p className={`text-xs font-bold ${isActive ? meta.color : "text-slate-700"}`}>{meta.label}</p>
                                            <p className="text-xs text-slate-400">{sk.done}/{sk.total} bài</p>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${meta.bg.replace("bg-", "bg-").replace("-50", "-400")}`} style={{ width: `${sk.pct}%` }} />
                                        </div>
                                        <p className={`text-xs font-bold ${meta.color}`}>{sk.pct}%</p>
                                    </button>
                                );
                            })}
                        </div>
                        {activeSkill && (
                            <p className="mt-3 text-xs text-slate-500">
                                Đang hiển thị bài học kỹ năng <span className="font-semibold text-slate-700">{SKILL_META[activeSkill]?.label}</span>.{" "}
                                <button onClick={() => setActiveSkill(null)} className="text-purple-600 hover:underline">Xem tất cả</button>
                            </p>
                        )}
                    </section>
                )}

                {/* ── Lesson list ───────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-7 w-1 rounded-full bg-linear-to-b from-indigo-400 to-purple-400" />
                            <h2 className="text-xl font-bold text-slate-800">
                                {activeSkill ? `Bài học · ${SKILL_META[activeSkill]?.label}` : "Tất cả bài học"}
                            </h2>
                        </div>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                            {completedLessons}/{totalLessons} hoàn thành
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredLessons.map((lesson, index) => {
                            const cfg = STATUS_CFG[lesson.status] ?? STATUS_CFG[LessonStatus.LOCKED];
                            const skill = SKILL_META[lesson.skill_area] ?? SKILL_META.reading;
                            const isLocked = lesson.status === LessonStatus.LOCKED;
                            const isCurrent = currentLesson?.id === lesson.id;

                            return (
                                <div
                                    key={lesson.id}
                                    onClick={() => handleStartLesson(lesson)}
                                    className={`bg-white rounded-2xl border-2 ${cfg.border} p-5 flex flex-col gap-3 transition-all duration-200 relative
                                        ${isCurrent ? "ring-2 ring-indigo-400 ring-offset-2" : ""}
                                        ${isLocked ? "opacity-55 cursor-not-allowed" : "cursor-pointer hover:-translate-y-1 hover:shadow-lg"}`}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-2.5 left-4 bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                            <Zap className="w-2.5 h-2.5" /> Đang học
                                        </div>
                                    )}

                                    {/* Top row */}
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-flex items-center gap-1 ${skill.bg} ${skill.color} text-xs font-semibold px-2.5 py-1 rounded-full`}>
                                            {skill.icon} {skill.label}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                            {cfg.icon} {cfg.label}
                                        </span>
                                    </div>

                                    {/* Lesson number + title */}
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 font-medium mb-0.5 flex items-center gap-2">
                                            <GraduationCap className="w-3 h-3" />
                                            Bài {activeSkill
                                                ? (filteredLessons.filter((_, i2) => i2 <= index).length)
                                                : (index + 1)}
                                            {lesson.lesson_code && (
                                                <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{lesson.lesson_code}</span>
                                            )}
                                        </p>
                                        <h3 className="text-sm font-bold text-slate-800 leading-snug">{lesson.lesson_title}</h3>
                                    </div>

                                    {/* Progress indicator for current lesson */}
                                    {lesson.status === LessonStatus.IN_PROGRESS && (
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full w-1/2 animate-pulse" />
                                        </div>
                                    )}
                                    {lesson.status === LessonStatus.COMPLETED && (
                                        <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full w-full" />
                                        </div>
                                    )}

                                    {/* Meta */}
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.estimated_minutes} phút</span>
                                        <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />Band {lesson.band_level.toFixed(1)}</span>
                                    </div>

                                    {/* Scheduled date */}
                                    {lesson.scheduled_date && (
                                        <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(lesson.scheduled_date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                        </div>
                                    )}

                                    {/* Component chips */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {lesson.flashcard_repo_id && <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">Flashcard</span>}
                                        {lesson.practice_repo_id && <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">Practice</span>}
                                        {lesson.mini_test_repo_id && <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">Mini Test</span>}
                                    </div>

                                    {/* CTA button */}
                                    <button
                                        disabled={isLocked}
                                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${cfg.btnClass}`}
                                    >
                                        {cfg.btnLabel} {!isLocked && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Band test CTA ─────────────────────────────────────────── */}
                {progressPercent < 100 ? (
                    <section className="rounded-3xl bg-linear-to-r from-indigo-500 via-violet-500 to-purple-600 p-8 text-white text-center shadow-xl">
                        <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-200" />
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold mb-3">Làm thử</div>
                        <h2 className="text-2xl font-black mb-2">Luyện tập với Band Test</h2>
                        <p className="text-white/80 text-sm mb-5 max-w-md mx-auto">
                            Bạn đã hoàn thành {completedLessons}/{totalLessons} bài học ({progressPercent}%). Làm thử để biết trình độ hiện tại — kết quả sẽ được áp dụng khi bạn hoàn thành 100% chương trình.
                        </p>
                        <button
                            onClick={() => navigate(`/ielts-adaptive/band-test/${roadmap.id}`)}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-white text-indigo-600 font-bold text-sm hover:bg-white/90 transition-colors"
                        >
                            <Trophy className="w-4 h-4" /> Làm thử Band Test
                        </button>
                    </section>
                ) : (
                    <section className="rounded-3xl bg-linear-to-r from-rose-500 via-pink-500 to-fuchsia-500 p-8 text-white text-center shadow-xl">
                        <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-200" />
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold mb-3">Thi thật</div>
                        <h2 className="text-2xl font-black mb-2">Sẵn sàng kiểm tra Band?</h2>
                        <p className="text-white/80 text-sm mb-5 max-w-md mx-auto">
                            Bạn đã hoàn thành toàn bộ {totalLessons} bài học! Làm bài kiểm tra để xác nhận trình độ và cập nhật lộ trình của bạn.
                        </p>
                        <button
                            onClick={() => navigate(`/ielts-adaptive/band-test/${roadmap.id}`)}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-white text-rose-600 font-bold text-sm hover:bg-white/90 transition-colors"
                        >
                            <Trophy className="w-4 h-4" /> Bắt đầu Band Test
                        </button>
                    </section>
                )}

            </main>
            <Footer />

            {/* ── Update targets modal ──────────────────────────────────────── */}
            {showTargetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) setShowTargetModal(false); }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Cập nhật mục tiêu</h2>
                                <p className="text-slate-500 text-xs mt-0.5">Hệ thống sẽ tạo lại lộ trình phù hợp</p>
                            </div>
                            <button onClick={() => setShowTargetModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-5 flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 font-medium">Current Band</p>
                                <p className="text-2xl font-black text-slate-700">{roadmap.current_band.toFixed(1)}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                            <div className="text-center">
                                <p className="text-xs text-slate-500 font-medium">Target hiện tại</p>
                                <p className="text-2xl font-black text-indigo-600">{roadmap.target_band.toFixed(1)}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Band mục tiêu mới <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="number" min={1} max={9} step={0.5} value={draftTargetBand} onChange={(e) => setDraftTargetBand(e.target.value)} placeholder="Ví dụ: 6.5" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-sm" />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Giá trị từ 1.0 đến 9.0, bước 0.5</p>
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                                    <Calendar className="w-4 h-4 text-slate-400" /> Ngày thi mục tiêu <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
                                </label>
                                <input type="date" value={draftCompletionDate} onChange={(e) => setDraftCompletionDate(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-sm" />
                            </div>
                        </div>
                        {saveError && <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600">{saveError}</div>}
                        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs text-indigo-600 leading-relaxed">
                            Khi lưu, hệ thống sẽ <strong>tạo lại toàn bộ lộ trình</strong> theo band mục tiêu mới. Tiến trình bài học hiện tại sẽ được reset.
                        </div>
                        <div className="mt-5 flex gap-3">
                            <button onClick={() => setShowTargetModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Huỷ</button>
                            <button onClick={handleSaveTargets} disabled={saving || !draftTargetBand} className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu…</> : <><Target className="w-4 h-4" /> Lưu & Tạo lại lộ trình</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
