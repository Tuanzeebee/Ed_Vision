import React, { useEffect, useState, useCallback } from 'react';
import {
    Sparkles, TrendingUp, TrendingDown, Minus,
    BookOpen, Headphones, PenLine, Mic2,
    AlertCircle, ChevronRight, Loader2, RefreshCw,
    Target, Zap, CheckCircle2
} from 'lucide-react';
import { ieltsAdaptiveApi } from '@/services/ielts-adaptive/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillProgress {
    skill_area: string;
    current_band: number;
    lessons_completed: number;
    total_practice: number;
    accuracy_rate: number;
    recent_sessions: { date: string; accuracy: number; questions: number }[];
    weak_topics: string[];
    last_practiced_at: string | null;
}

interface AiInsight {
    summary: string;
    weakest_skill: string;
    strengths: string[];
    improvements: string[];
    today_focus: string;
    encouragement: string;
}

// ─── Skill Meta ───────────────────────────────────────────────────────────────

const SKILL_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; bar: string }> = {
    reading: { label: 'Reading', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
    listening: { label: 'Listening', icon: <Headphones className="w-3.5 h-3.5" />, color: 'text-cyan-600', bg: 'bg-cyan-50', bar: 'bg-cyan-500' },
    writing: { label: 'Writing', icon: <PenLine className="w-3.5 h-3.5" />, color: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-500' },
    speaking: { label: 'Speaking', icon: <Mic2 className="w-3.5 h-3.5" />, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' },
};

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

const Sparkline: React.FC<{ sessions: { accuracy: number }[]; color: string }> = ({ sessions, color }) => {
    if (!sessions || !Array.isArray(sessions) || sessions.length < 2) return null;
    const vals = sessions
        .map(s => Number(s?.accuracy))
        .filter(v => typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v));
    if (vals.length < 2) return null;

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const W = 64, H = 24;
    const pts = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - ((v - min) / range) * H;
        return `${x},${y}`;
    }).join(' ');
    const trend = vals[vals.length - 1] - vals[0];

    return (
        <div className="flex items-center gap-1.5">
            <svg width={W} height={H} className="overflow-visible">
                <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
                {vals.map((v, i) => (
                    <circle key={i} cx={(i / (vals.length - 1)) * W} cy={H - ((v - min) / range) * H} r="2" fill={color} />
                ))}
            </svg>
            {trend > 2 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> :
                trend < -2 ? <TrendingDown className="w-3 h-3 text-red-400" /> :
                    <Minus className="w-3 h-3 text-slate-400" />}
        </div>
    );
};

// ─── Skill Row ────────────────────────────────────────────────────────────────

const SkillRow: React.FC<{ skill: SkillProgress; isWeakest: boolean }> = ({ skill, isWeakest }) => {
    const meta = SKILL_META[skill?.skill_area] ?? SKILL_META.reading;
    const acc = typeof skill?.accuracy_rate === 'number' ? skill.accuracy_rate : 0;
    const hasData = (skill?.total_practice ?? 0) > 0 || (skill?.lessons_completed ?? 0) > 0;

    return (
        <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all
            ${isWeakest ? 'border-red-100 bg-red-50/40' : 'border-slate-100 bg-white/60'}`}>

            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                {meta.icon}
            </div>

            {/* Label + weak topics */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[12px] font-black ${meta.color}`}>{meta.label}</span>
                    {isWeakest && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 uppercase tracking-wider">
                            Cần ôn
                        </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium ml-auto">
                        Band {(skill?.current_band ?? 0).toFixed(1)}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${hasData ? meta.bar : 'bg-slate-200'}`}
                        style={{ width: hasData ? `${Math.min(acc, 100)}%` : '0%' }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                        {hasData 
                            ? `${acc.toFixed(0)}% độ chính xác · ${skill.total_practice > 0 ? `${skill.total_practice} câu` : `${skill.lessons_completed} bài`}` 
                            : 'Chưa có dữ liệu'}
                    </span>
                    {skill?.recent_sessions && Array.isArray(skill.recent_sessions) && skill.recent_sessions.length >= 2 && (
                        <Sparkline
                            sessions={skill.recent_sessions}
                            color={isWeakest ? '#f87171' : meta.bar.replace('bg-', '#').replace('-500', '')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface AiInsightSectionProps {
    onNavigateToLesson: () => void;
    forceEmpty?: boolean;
}

const AiInsightSection: React.FC<AiInsightSectionProps> = ({ onNavigateToLesson, forceEmpty = false }) => {
    const [skills, setSkills] = useState<SkillProgress[]>([]);
    const [insight, setInsight] = useState<AiInsight | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingAI, setLoadingAI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // ── Load skill progress ───────────────────────────────────────────────────
    const loadSkills = useCallback(async () => {
        setLoadingData(true);
        setError(null);
        try {
            const data = await ieltsAdaptiveApi.getMyProgress();
            // getMyProgress returns array of SkillProgress
            const arr: SkillProgress[] = Array.isArray(data) ? data : (data as any)?.skills ?? [];
            setSkills(arr);
            return arr;
        } catch (e) {
            // fallback: try getMyRoadmap
            try {
                const rm = await ieltsAdaptiveApi.getMyRoadmap();
                const arr: SkillProgress[] = (rm as any)?.skills ?? [];
                setSkills(arr);
                return arr;
            } catch {
                setError('Không thể tải dữ liệu kỹ năng.');
                return [];
            }
        } finally {
            setLoadingData(false);
        }
    }, []);

    // ── Generate AI insight via Backend API ─────────────────────────────────
    const generateInsight = useCallback(async (skillData: SkillProgress[]) => {
        if (forceEmpty) return;
        if (!skillData || skillData.length === 0) return;
        const hasAnyActivity = skillData.some(s => (s.total_practice ?? 0) > 0 || (s.lessons_completed ?? 0) > 0);
        if (!hasAnyActivity) return;

        setLoadingAI(true);
        try {
            const data = await ieltsAdaptiveApi.getAiInsight();
            if (data) {
                setInsight(data);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error('AI insight error:', e);
        } finally {
            setLoadingAI(false);
        }
    }, []);

    const handleRefresh = useCallback(async () => {
        const skillData = await loadSkills();
        await generateInsight(skillData);
    }, [loadSkills, generateInsight]);

    useEffect(() => {
        if (forceEmpty) {
            setSkills([]);
            setInsight(null);
            setError(null);
            setLoadingData(false);
            setLoadingAI(false);
            return;
        }
        loadSkills().then(generateInsight);
    }, [forceEmpty, loadSkills, generateInsight]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const activeSkills = skills.filter(s => (s.total_practice ?? 0) > 0 || (s.lessons_completed ?? 0) > 0);
    const weakest = insight?.weakest_skill
        ?? (activeSkills.sort((a, b) => (a.accuracy_rate ?? 0) - (b.accuracy_rate ?? 0))[0]?.skill_area);
    const hasEnoughData = !forceEmpty && activeSkills.length > 0;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <section className="bg-white/95 border border-indigo-100/60 rounded-[22px] overflow-hidden shadow-sm">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[13px] font-black text-slate-800">Phân tích học tập</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                            {lastUpdated
                                ? `Cập nhật ${lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                                : 'Powered by AI'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loadingData || loadingAI}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${loadingAI ? 'animate-spin' : ''}`} />
                    Phân tích lại
                </button>
            </div>

            <div className="p-5 space-y-5">

                {/* ── No data state ── */}
                {!hasEnoughData && !loadingData && (
                    <div className="text-center py-6 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                            <Target className="w-7 h-7 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-slate-600">Chưa đủ dữ liệu để phân tích</p>
                            <p className="text-[11px] text-slate-400 mt-1">Hoàn thành ít nhất 1 bài học để AI phân tích kỹ năng của bạn</p>
                        </div>
                        <button
                            onClick={onNavigateToLesson}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-[12px] font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                        >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            Bắt đầu bài học đầu tiên
                        </button>
                    </div>
                )}

                {/* ── Loading ── */}
                {loadingData && (
                    <div className="flex items-center justify-center py-8 gap-3">
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        <p className="text-[12px] text-slate-400 font-medium">Đang tải dữ liệu kỹ năng...</p>
                    </div>
                )}

                {/* ── Skill rows ── */}
                {!loadingData && hasEnoughData && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Tiến độ theo kỹ năng
                        </p>
                        {['reading', 'listening', 'writing', 'speaking'].map(sk => {
                            const skill = skills.find(s => s.skill_area === sk);
                            if (!skill) return null;
                            return (
                                <SkillRow
                                    key={sk}
                                    skill={skill}
                                    isWeakest={sk === weakest}
                                />
                            );
                        })}
                    </div>
                )}

                {/* ── AI Insight ── */}
                {loadingAI && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                        <p className="text-[12px] text-indigo-600 font-medium">AI đang phân tích dữ liệu học tập của bạn...</p>
                    </div>
                )}

                {insight && !loadingAI && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Nhận xét từ AI
                        </p>

                        {/* Summary */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
                            <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                                {insight.summary}
                            </p>
                        </div>

                        {/* Strengths + Improvements */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Điểm mạnh
                                </p>
                                <ul className="space-y-1.5">
                                    {insight.strengths.map((s, i) => (
                                        <li key={i} className="text-[11px] text-slate-600 font-medium flex items-start gap-1.5">
                                            <span className="text-emerald-400 mt-0.5 shrink-0">·</span>{s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Cần cải thiện
                                </p>
                                <ul className="space-y-1.5">
                                    {insight.improvements.map((s, i) => (
                                        <li key={i} className="text-[11px] text-slate-600 font-medium flex items-start gap-1.5">
                                            <span className="text-amber-400 mt-0.5 shrink-0">·</span>{s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Today focus */}
                        <div
                            onClick={onNavigateToLesson}
                            className="group flex items-center gap-3 p-3.5 rounded-xl bg-indigo-600 cursor-pointer hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                        >
                            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                                <Zap className="w-4 h-4 text-white fill-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Nhiệm vụ hôm nay</p>
                                <p className="text-[12px] font-bold text-white leading-snug">{insight.today_focus}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>

                        {/* Encouragement */}
                        <p className="text-[11px] text-slate-500 italic text-center px-2">
                            ✨ {insight.encouragement}
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-[12px] text-red-600 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AiInsightSection;
