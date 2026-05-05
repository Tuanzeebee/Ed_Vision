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
    listening: { icon: <Headphones className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    writing: { icon: <PenLine className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    speaking: { icon: <Mic2 className="w-4 h-4" />, color: 'text-rose-600', bg: 'bg-rose-50' },
    grammar: { icon: <BookMarked className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    vocabulary: { icon: <Layers className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
        icon: <PlayCircle className="w-5 h-5 text-indigo-500" />,
        badge: 'bg-indigo-100 text-indigo-700',
        border: 'border-indigo-200',
        btnLabel: 'Start',
        btnClass: 'bg-indigo-500 hover:bg-indigo-600 text-white',
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 text-sm">Đang tải lộ trình học của bạn…</p>
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
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

            {/* ── Hero header ──────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl">
                {/* decorative circle */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 mb-2">IELTS Adaptive Roadmap</p>
                    <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                        Lộ trình cá nhân hoá của bạn
                    </h1>
                    <p className="text-white/75 text-sm mt-1">
                        Hệ thống tự động điều chỉnh bài học theo năng lực thực tế.
                    </p>

                    {/* Stat cards */}
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Current band */}
                        <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 backdrop-blur">
                            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Current
                            </p>
                            <p className="text-3xl font-black mt-1">{roadmap.current_band.toFixed(1)}</p>
                        </div>

                        {/* Target band */}
                        <div className="bg-amber-400/20 border border-amber-300/30 rounded-2xl px-4 py-3 backdrop-blur">
                            <p className="text-amber-200 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                                <Target className="w-3 h-3" /> Target
                            </p>
                            <p className="text-3xl font-black mt-1 text-amber-200">{roadmap.target_band.toFixed(1)}</p>
                        </div>

                        {/* D-Day */}
                        <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 backdrop-blur">
                            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> D-Day
                            </p>
                            <p className="text-3xl font-black mt-1">
                                {dDayValue != null ? dDayValue : '—'}
                            </p>
                            {examDateLabel && (
                                <p className="text-white/50 text-xs mt-0.5">{examDateLabel}</p>
                            )}
                        </div>

                        {/* Progress */}
                        <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 backdrop-blur">
                            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Progress
                            </p>
                            <p className="text-3xl font-black mt-1">{progressPercent}%</p>
                            <p className="text-white/50 text-xs mt-0.5">{completedLessons}/{totalLessons} bài</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-5">
                        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-700"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            onClick={handleOpenTargetModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-indigo-700 text-sm font-bold hover:bg-white/90 transition-colors"
                        >
                            <Target className="w-4 h-4" /> Cập nhật mục tiêu
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Lessons grid ─────────────────────────────────────────────────────── */}
            <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Danh sách bài học</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roadmap.lessons?.map((lesson, index) => {
                        const cfg = STATUS_CFG[lesson.status] ?? STATUS_CFG[LessonStatus.LOCKED];
                        const skill = SKILL_META[lesson.skill_area] ?? SKILL_META.reading;
                        const isLocked = lesson.status === LessonStatus.LOCKED;

                        return (
                            <div
                                key={lesson.id}
                                onClick={() => handleStartLesson(lesson)}
                                className={`bg-white rounded-2xl border-2 ${cfg.border} p-4 flex flex-col gap-3 transition-all duration-200 ${isLocked ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'
                                    }`}
                            >
                                {/* card top */}
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-1 ${skill.bg} ${skill.color} text-xs font-semibold px-2.5 py-1 rounded-full`}>
                                        {skill.icon}
                                        {lesson.skill_area.toUpperCase()}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                                        {cfg.icon}
                                        {lesson.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* title */}
                                <div className="flex-1">
                                    <p className="text-xs text-slate-400 font-medium mb-0.5">
                                        Bài {index + 1}
                                        {lesson.lesson_code && (
                                            <span className="ml-2 font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{lesson.lesson_code}</span>
                                        )}
                                    </p>
                                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{lesson.lesson_title}</h3>
                                </div>

                                {/* meta */}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.estimated_minutes} phút</span>
                                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />Band {lesson.band_level.toFixed(1)}</span>
                                </div>

                                {/* scheduled date */}
                                {lesson.scheduled_date && (
                                    <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(lesson.scheduled_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </div>
                                )}

                                {/* components */}
                                <div className="flex flex-wrap gap-1.5">
                                    {lesson.flashcard_repo_id && (
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">Flashcard</span>
                                    )}
                                    {lesson.practice_repo_id && (
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">Practice</span>
                                    )}
                                    {lesson.mini_test_repo_id && (
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">Mini Test</span>
                                    )}
                                </div>

                                {/* button */}
                                <button
                                    disabled={isLocked}
                                    className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${cfg.btnClass}`}
                                >
                                    {cfg.btnLabel} {!isLocked && <ChevronRight className="w-4 h-4" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Band test CTA ─────────────────────────────────────────────────────── */}
            {progressPercent < 100 ? (
                <div className="rounded-3xl bg-linear-to-r from-indigo-500 via-violet-500 to-purple-600 p-6 text-white text-center shadow-xl">
                    <Trophy className="w-10 h-10 mx-auto mb-3 text-yellow-200" />
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold mb-2">Làm thử</div>
                    <h2 className="text-xl font-black mb-1">Luyện tập với Band Test</h2>
                    <p className="text-white/80 text-sm mb-4">
                        {completedLessons}/{totalLessons} bài hoàn thành ({progressPercent}%). Kết quả chỉ hiển thị, chưa áp dụng vào lộ trình.
                    </p>
                    <button
                        onClick={() => navigate(`/ielts-adaptive/band-test/${roadmap.id}`)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-600 font-bold text-sm hover:bg-white/90 transition-colors"
                    >
                        <Trophy className="w-4 h-4" /> Làm thử Band Test
                    </button>
                </div>
            ) : (
                <div className="rounded-3xl bg-linear-to-r from-rose-500 via-pink-500 to-fuchsia-500 p-6 text-white text-center shadow-xl">
                    <Trophy className="w-10 h-10 mx-auto mb-3 text-yellow-200" />
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-xs font-bold mb-2">Thi thật</div>
                    <h2 className="text-xl font-black mb-1">Sẵn sàng kiểm tra Band?</h2>
                    <p className="text-white/80 text-sm mb-4">
                        Bạn đã hoàn thành toàn bộ {totalLessons} bài! Kết quả sẽ được áp dụng vào lộ trình.
                    </p>
                    <button
                        onClick={() => navigate(`/ielts-adaptive/band-test/${roadmap.id}`)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-rose-600 font-bold text-sm hover:bg-white/90 transition-colors"
                    >
                        <Trophy className="w-4 h-4" /> Bắt đầu Band Test
                    </button>
                </div>
            )}

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
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => setShowTargetModal(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSaveTargets}
                                disabled={saving || !draftTargetBand}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
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

