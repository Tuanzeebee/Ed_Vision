import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
} from 'lucide-react';
import { ieltsAdaptiveApi } from '@/services/ielts-adaptive/api';
import type { Roadmap, Lesson } from '../../types/ielts-adaptive.types';
import { LessonStatus } from '../../types/ielts-adaptive.types';

interface RoadmapPageProps {
    enrollmentId: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const SKILL_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    reading: { icon: <BookOpen className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    listening: { icon: <Headphones className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-50/50' },
    writing: { icon: <PenLine className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    speaking: { icon: <Mic2 className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    grammar: { icon: <BookMarked className="w-4 h-4" />, color: 'text-amber-700', bg: 'bg-amber-50' },
    vocabulary: { icon: <Layers className="w-4 h-4" />, color: 'text-blue-700', bg: 'bg-blue-50' },
};

const STATUS_CFG = {
    [LessonStatus.COMPLETED]: {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        badge: 'bg-emerald-100 text-emerald-700',
        border: 'border-emerald-200',
        btnLabel: 'Review',
        btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
    [LessonStatus.IN_PROGRESS]: {
        icon: <PlayCircle className="w-5 h-5 text-amber-500" />,
        badge: 'bg-amber-100 text-amber-700',
        border: 'border-amber-300',
        btnLabel: 'Continue',
        btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    [LessonStatus.UNLOCKED]: {
        icon: <PlayCircle className="w-5 h-5 text-blue-500" />,
        badge: 'bg-blue-50 text-blue-700',
        border: 'border-blue-100',
        btnLabel: 'Start',
        btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200',
    },
    [LessonStatus.LOCKED]: {
        icon: <Lock className="w-5 h-5 text-slate-400" />,
        badge: 'bg-slate-100 text-slate-500',
        border: 'border-slate-200',
        btnLabel: 'Locked',
        btnClass: 'bg-slate-200 text-slate-400 cursor-not-allowed',
    },
};

const normalizeBand = (v: string) => {
    const n = parseFloat(v);
    if (isNaN(n)) return null;
    return Math.min(9, Math.max(1, Math.round(n * 2) / 2)); // round to nearest 0.5
};

// ── component ─────────────────────────────────────────────────────────────────

export const RoadmapPage: React.FC<RoadmapPageProps> = ({ enrollmentId }) => {
    const navigate = useNavigate();

    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // target edit modal state
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [draftTargetBand, setDraftTargetBand] = useState('');
    const [draftCompletionDate, setDraftCompletionDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // ── load ────────────────────────────────────────────────────────────────────

    const loadRoadmap = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const myRoadmap = await ieltsAdaptiveApi.getMyRoadmap();
            if (myRoadmap?.roadmap) {
                setRoadmap({ ...myRoadmap.roadmap, lessons: myRoadmap.lessons || [] });
                return;
            }
            const data = await ieltsAdaptiveApi.getRoadmap(enrollmentId);
            setRoadmap(data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load roadmap');
        } finally {
            setLoading(false);
        }
    }, [enrollmentId]);

    useEffect(() => {
        loadRoadmap();
    }, [loadRoadmap]);

    // ── actions ─────────────────────────────────────────────────────────────────

    const handleStartLesson = (lesson: Lesson) => {
        if (lesson.status === LessonStatus.LOCKED) return;
        navigate(`/ielts-adaptive/lesson/${lesson.id}`);
    };

    const handleOpenTargetModal = () => {
        setDraftTargetBand(roadmap?.target_band?.toString() ?? '');
        // pre-fill existing completion date if available
        const existingDate = roadmap?.target_completion_date;
        setDraftCompletionDate(
            existingDate ? new Date(existingDate).toISOString().split('T')[0] : ''
        );
        setSaveError(null);
        setShowTargetModal(true);
    };

    const handleSaveTargets = async () => {
        const targetBand = normalizeBand(draftTargetBand);
        if (!targetBand) {
            setSaveError('Vui lòng nhập Band mục tiêu hợp lệ (1.0 – 9.0).');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const result = await ieltsAdaptiveApi.updateMyTargets({
                target_band: targetBand,
                ...(roadmap?.current_band ? { current_band: roadmap.current_band } : {}),
                ...(draftCompletionDate ? { target_completion_date: draftCompletionDate } : {}),
            });
            // always reload to get fresh roadmap after regeneration
            await loadRoadmap();
            setShowTargetModal(false);
        } catch (err: any) {
            setSaveError(err.response?.data?.message || 'Cập nhật thất bại. Thử lại sau.');
        } finally {
            setSaving(false);
        }
    };

    // ── derived ──────────────────────────────────────────────────────────────────

    const completedLessons = roadmap?.lessons?.filter((l) => l.status === LessonStatus.COMPLETED).length ?? 0;
    const totalLessons = roadmap?.lessons?.length ?? 0;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const dDayValue = (() => {
        if (!roadmap?.target_completion_date) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [y, m, d] = roadmap.target_completion_date.split('T')[0].split('-').map(Number);
        const target = new Date(y, m - 1, d);
        return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
    })();

    const examDateLabel = roadmap?.target_completion_date
        ? new Date(roadmap.target_completion_date).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        })
        : null;

    // ── render guards ────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-[#F0F4FF]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 text-sm font-black uppercase tracking-widest">Đang tải lộ trình học…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-sm">
                    <p className="text-red-600 font-semibold mb-1">Lỗi tải dữ liệu</p>
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                    <button
                        onClick={loadRoadmap}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!roadmap) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <p className="text-slate-500">Không tìm thấy lộ trình.</p>
            </div>
        );
    }

    // ── main render ───────────────────────────────────────────────────────────────

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 bg-[#F0F4FF] min-h-screen">

            {/* ── Hero header ──────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-[40px] bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-10 text-white shadow-2xl">
                {/* decorative circle */}
                <div className="absolute -top-10 -right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-3">Adaptive Learning Roadmap</p>
                    <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                        Lộ trình cá nhân hoá <span className="text-amber-400">.</span>
                    </h1>
                    <p className="text-white/70 text-base mt-2 font-medium max-w-lg">
                        Hệ thống tự động điều chỉnh bài học theo năng lực thực tế để tối ưu thời gian học của bạn.
                    </p>

                    {/* Stat cards */}
                    <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Current band */}
                        <div className="bg-white/10 border border-white/10 rounded-[24px] px-6 py-4 backdrop-blur-md">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                                <TrendingUp className="w-3.5 h-3.5" /> Current
                            </p>
                            <p className="text-3xl font-black mt-1">{roadmap.current_band.toFixed(1)}</p>
                        </div>

                        {/* Target band */}
                        <div className="bg-amber-400/20 border border-amber-300/20 rounded-[24px] px-6 py-4 backdrop-blur-md shadow-xl shadow-amber-900/10">
                            <p className="text-amber-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                                <Target className="w-3.5 h-3.5" /> Target
                            </p>
                            <p className="text-3xl font-black mt-1 text-amber-300">{roadmap.target_band.toFixed(1)}</p>
                        </div>

                        {/* D-Day */}
                        <div className="bg-white/10 border border-white/10 rounded-[24px] px-6 py-4 backdrop-blur-md">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                                <Calendar className="w-3.5 h-3.5" /> D-Day
                            </p>
                            <p className="text-3xl font-black mt-1">
                                {dDayValue != null ? dDayValue : '—'}
                            </p>
                        </div>

                        {/* Progress */}
                        <div className="bg-white/10 border border-white/10 rounded-[24px] px-6 py-4 backdrop-blur-md">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                                <BookOpen className="w-3.5 h-3.5" /> Progress
                            </p>
                            <p className="text-3xl font-black mt-1">{progressPercent}%</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-8">
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="h-full bg-linear-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-8 flex flex-wrap gap-4">
                        <button
                            onClick={handleOpenTargetModal}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-[20px] bg-white text-blue-700 text-[13px] font-black hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/10 active:scale-95"
                        >
                            <Target className="w-4 h-4" /> Cập nhật mục tiêu
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Lessons grid ─────────────────────────────────────────────────────── */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Layers className="w-6 h-6 text-blue-600" />
                    Danh sách bài học
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roadmap.lessons?.map((lesson, index) => {
                        const cfg = STATUS_CFG[lesson.status] ?? STATUS_CFG[LessonStatus.LOCKED];
                        const skill = SKILL_META[lesson.skill_area] ?? SKILL_META.reading;
                        const isLocked = lesson.status === LessonStatus.LOCKED;

                        return (
                            <div
                                key={lesson.id}
                                onClick={() => handleStartLesson(lesson)}
                                className={`bg-white rounded-[32px] border-2 ${cfg.border} p-6 flex flex-col gap-4 transition-all duration-300 shadow-xl shadow-blue-900/5 ${isLocked ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:border-blue-200 hover:shadow-blue-900/10'
                                    }`}
                            >
                                {/* card top */}
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-1.5 ${skill.bg} ${skill.color} text-[10px] font-black px-3 py-1.5 rounded-full border border-current/10 uppercase tracking-widest`}>
                                        {skill.icon}
                                        {lesson.skill_area}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full ${cfg.badge} uppercase tracking-widest`}>
                                        {cfg.icon}
                                        {lesson.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* title */}
                                <div className="flex-1 py-2">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1.5">
                                        Bài {index + 1}
                                        {lesson.lesson_code && (
                                            <span className="ml-3 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px]">{lesson.lesson_code}</span>
                                        )}
                                    </p>
                                    <h3 className="text-[15px] font-black text-slate-800 leading-tight tracking-tight">{lesson.lesson_title}</h3>
                                </div>

                                {/* meta */}
                                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{lesson.estimated_minutes}m</span>
                                    <span className="flex items-center gap-1.5 text-blue-600"><Target className="w-3.5 h-3.5" />Band {lesson.band_level.toFixed(1)}</span>
                                </div>

                                {/* scheduled date */}
                                {lesson.scheduled_date && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-500 font-black bg-indigo-50 px-3 py-1.5 rounded-xl w-fit">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(lesson.scheduled_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                )}

                                {/* button */}
                                <button
                                    disabled={isLocked}
                                    className={`w-full py-3.5 rounded-[20px] text-[13px] font-black transition-all flex items-center justify-center gap-2 active:scale-95 ${cfg.btnClass}`}
                                >
                                    {cfg.btnLabel} {!isLocked && <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Band test CTA ─────────────────────────────────────────────────────── */}
            <div className="pt-10">
            {progressPercent < 100 ? (
                <div className="rounded-[40px] bg-linear-to-r from-blue-600 to-indigo-700 p-10 text-white text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    <Trophy className="w-16 h-16 mx-auto mb-6 text-amber-300" />
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Luyện tập</div>
                    <h2 className="text-3xl font-black mb-3 tracking-tight">Kiểm tra năng lực thực tế</h2>
                    <p className="text-white/70 text-sm mb-8 max-w-md mx-auto font-medium">
                        Hoàn thành {completedLessons}/{totalLessons} bài ({progressPercent}%). Hãy thử sức với bài Band Test để xem trình độ hiện tại!
                    </p>
                    <button
                        onClick={() => navigate(`/ielts-adaptive/band-test/${roadmap.id}`)}
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-[24px] bg-white text-blue-700 font-black text-sm hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/10 active:scale-95"
                    >
                        <Trophy className="w-5 h-5" /> Bắt đầu Band Test
                    </button>
                </div>
            ) : (
                <div className="rounded-[40px] bg-linear-to-r from-amber-500 to-orange-600 p-10 text-white text-center shadow-2xl relative overflow-hidden">
                    <Trophy className="w-16 h-16 mx-auto mb-6 text-white" />
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Mục tiêu đã đạt</div>
                    <h2 className="text-3xl font-black mb-3 tracking-tight">Sẵn sàng vượt ngưỡng?</h2>
                    <p className="text-white/80 text-sm mb-8 max-w-md mx-auto font-medium">
                        Bạn đã xuất sắc hoàn thành toàn bộ lộ trình! Làm bài Band Test cuối cùng để cập nhật Band điểm mới.
                    </p>
                    <button
                        onClick={() => navigate(`/ielts-adaptive/band-test/${roadmap.id}`)}
                        className="inline-flex items-center gap-3 px-10 py-4 rounded-[24px] bg-white text-orange-600 font-black text-sm hover:bg-blue-50 transition-all shadow-xl shadow-orange-900/10 active:scale-95"
                    >
                        <Trophy className="w-5 h-5" /> Bắt đầu Band Test
                    </button>
                </div>
            )}
            </div>

            {/* ── Update targets modal ──────────────────────────────────────────────── */}
            {showTargetModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowTargetModal(false); }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
                        {/* modal header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-black text-slate-800">Cập nhật mục tiêu</h2>
                                <p className="text-slate-500 text-xs mt-0.5">Hệ thống sẽ tạo lại lộ trình phù hợp</p>
                            </div>
                            <button
                                onClick={() => setShowTargetModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* current info */}
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

                        {/* fields */}
                        <div className="space-y-4">
                            {/* target band */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Band mục tiêu mới <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        min={1}
                                        max={9}
                                        step={0.5}
                                        value={draftTargetBand}
                                        onChange={(e) => setDraftTargetBand(e.target.value)}
                                        placeholder="Ví dụ: 6.5"
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-sm"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Giá trị từ 1.0 đến 9.0, bước 0.5</p>
                            </div>

                            {/* completion date */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    Ngày thi mục tiêu <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
                                </label>
                                <input
                                    type="date"
                                    value={draftCompletionDate}
                                    onChange={(e) => setDraftCompletionDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-sm"
                                />
                            </div>
                        </div>

                        {/* save error */}
                        {saveError && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-600">
                                {saveError}
                            </div>
                        )}

                        {/* info note */}
                        <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs text-indigo-600 leading-relaxed">
                            Khi lưu, hệ thống sẽ <strong>tạo lại toàn bộ lộ trình</strong> theo band mục tiêu mới.
                            Tiến trình bài học hiện tại sẽ được reset.
                        </div>

                        {/* actions */}
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => setShowTargetModal(false)}
                                className="flex-1 py-3.5 rounded-[20px] border-2 border-slate-100 text-slate-500 text-[13px] font-black hover:bg-slate-50 transition-all"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSaveTargets}
                                disabled={saving || !draftTargetBand}
                                className="flex-1 py-3.5 rounded-[24px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-[13px] font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu…</>
                                ) : (
                                    <><Target className="w-4 h-4" /> Lưu & Tạo lại lộ trình</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoadmapPage;

