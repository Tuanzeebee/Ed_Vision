import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    BookOpen, Headphones, PenLine, Mic2, BookMarked, Layers,
    Loader2, CheckCircle2, TrendingUp, TrendingDown, Minus,
    ChevronRight, Trophy, ArrowLeft, Zap, Target, AlertTriangle, Clock,
    RefreshCw, XCircle,
} from 'lucide-react';
import { ieltsAdaptiveApi } from '@/services/ielts-adaptive/api';
import type { BandTest, Roadmap, LearningAnalysis, QuestionResult } from '../../types/ielts-adaptive.types';
import { SkillArea, BandChange, Recommendation } from '../../types/ielts-adaptive.types';

const SKILL_META: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
    [SkillArea.READING]: { icon: <BookOpen className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Reading' },
    [SkillArea.LISTENING]: { icon: <Headphones className="w-5 h-5" />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Listening' },
    [SkillArea.WRITING]: { icon: <PenLine className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Writing' },
    [SkillArea.SPEAKING]: { icon: <Mic2 className="w-5 h-5" />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Speaking' },
    [SkillArea.GRAMMAR]: { icon: <BookMarked className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Grammar' },
    [SkillArea.VOCABULARY]: { icon: <Layers className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Vocabulary' },
};

export const BandTestPage: React.FC = () => {
    const { roadmapId } = useParams<{ roadmapId: string }>();
    const navigate = useNavigate();

    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [bandTest, setBandTest] = useState<BandTest | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [phase, setPhase] = useState<'setup' | 'testing' | 'results'>('setup');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [analysis, setAnalysis] = useState<LearningAnalysis | null>(null);
    const [fastWarning, setFastWarning] = useState<{ count: number; total: number } | null>(null);
    const [applying, setApplying] = useState(false);
    const [bandApplied, setBandApplied] = useState(false);
    const [applyResult, setApplyResult] = useState<{ new_band: number; roadmap_regenerated: boolean } | null>(null);
    const [showQuestionErrors, setShowQuestionErrors] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<SkillArea[]>([
        SkillArea.READING,
        SkillArea.LISTENING,
        SkillArea.GRAMMAR,
        SkillArea.VOCABULARY,
    ]);

    useEffect(() => {
        loadRoadmap();
    }, [roadmapId]);

    const loadRoadmap = async () => {
        if (!roadmapId) return;

        try {
            // Assuming we can get roadmap by ID or from enrollment
            // For now, we'll create the test directly
        } catch (err) {
            console.error('Failed to load roadmap:', err);
        }
    };

    const handleStartTest = async () => {
        if (!roadmapId) return;

        try {
            setLoading(true);
            const test = await ieltsAdaptiveApi.createBandTest({
                roadmap_id: parseInt(roadmapId),
                skills_to_test: selectedSkills,
                questions_per_skill: 5,
            });

            setBandTest(test);
            // In real implementation, fetch actual questions from backend
            // For now, simulate with test questions
            setQuestions(
                Array.from({ length: test.total_questions }, (_, i) => ({
                    id: test.question_ids[i] || `q-${i}`,
                    skill: selectedSkills[Math.floor(i / 5)],
                    questionText: `Question ${i + 1} about ${selectedSkills[Math.floor(i / 5)]}`,
                    options: {
                        A: `Option A for question ${i + 1}`,
                        B: `Option B for question ${i + 1}`,
                        C: `Option C for question ${i + 1}`,
                        D: `Option D for question ${i + 1}`,
                    },
                })),
            );

            setPhase('testing');
            setQuestionStartTime(Date.now());
        } catch (err) {
            console.error('Failed to create band test:', err);
            alert('Failed to create band test');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (questionId: string, answer: string) => {
        const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
        setTimePerQuestion((prev) => ({ ...prev, [questionId]: timeTaken }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setQuestionStartTime(Date.now());
        } else {
            handleSubmitTest();
        }
    };

    const handleSubmitTest = async () => {
        if (!bandTest) return;

        // ── Client-side suspicious fast check (non-blocking, informational only) ──
        const EXPECTED_SECONDS = 60;
        const FAST_THRESHOLD = EXPECTED_SECONDS * 0.3; // < 18s = quá nhanh
        const suspiciousCount = Object.values(timePerQuestion).filter(
            (t) => t < FAST_THRESHOLD,
        ).length;
        const totalAnswered = Object.keys(timePerQuestion).length;
        const suspiciousRatio = totalAnswered > 0 ? suspiciousCount / totalAnswered : 0;

        if (suspiciousRatio > 0.3) {
            // Show warning but DO NOT block submission
            setFastWarning({ count: suspiciousCount, total: totalAnswered });
        }

        try {
            setSubmitting(true);
            const result = await ieltsAdaptiveApi.submitBandTest({
                test_id: bandTest.id,
                answers,
                time_per_question: timePerQuestion,
            });

            setBandTest(result);
            setPhase('results');
            // Fetch weak points & recommendations after test submission
            try {
                const a = await ieltsAdaptiveApi.getLearningAnalysis();
                setAnalysis(a);
            } catch (_) { /* non-critical */ }
        } catch (err) {
            console.error('Failed to submit band test:', err);
            alert('Failed to submit test');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetTest = () => {
        setAnswers({});
        setTimePerQuestion({});
        setCurrentQuestionIndex(0);
        setQuestionStartTime(Date.now());
        setFastWarning(null);
    };

    const handleApplyBand = async () => {
        if (!bandTest) return;
        try {
            setApplying(true);
            const res = await ieltsAdaptiveApi.applyBandTest(bandTest.id);
            setApplyResult({ new_band: res.new_band, roadmap_regenerated: res.roadmap_regenerated });
            setBandApplied(true);
        } catch (err) {
            console.error('Failed to apply band:', err);
            alert('Áp dụng band thất bại. Vui lòng thử lại.');
        } finally {
            setApplying(false);
        }
    };

    const getBandChangeCfg = (change: BandChange) => {
        if (change === BandChange.UP) return { icon: <TrendingUp className="w-6 h-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300', label: 'Tăng band' };
        if (change === BandChange.DOWN) return { icon: <TrendingDown className="w-6 h-6" />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-300', label: 'Giảm band' };
        return { icon: <Minus className="w-6 h-6" />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-300', label: 'Giữ nguyên' };
    };

    const getRecommendationCfg = (r: Recommendation) => {
        if (r === Recommendation.ADVANCE) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', title: '🎉 Xuất sắc! Sẵn sàng lên band' };
        if (r === Recommendation.MAINTAIN) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', title: '📚 Tiếp tục luyện tập' };
        return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', title: '📖 Cần ôn luyện thêm' };
    };

    // ── Setup Phase ────────────────────────────────────────────────────────────
    if (phase === 'setup') {
        return (
            <div className="min-h-screen bg-slate-50 py-8 px-4">
                <div className="max-w-2xl mx-auto flex flex-col gap-6">
                    {/* Hero */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
                        <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Bài Kiểm Tra Band</h1>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                            Kiểm tra toàn diện để đánh giá band hiện tại và xác định bạn có sẵn sàng lên cấp độ cao hơn không.
                        </p>
                    </div>

                    {/* Skill selection */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-base font-bold text-slate-800 mb-4">Chọn kỹ năng kiểm tra</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.values(SkillArea).map((skill) => {
                                const meta = SKILL_META[skill];
                                const selected = selectedSkills.includes(skill);
                                if (!meta) return null;
                                return (
                                    <button
                                        key={skill}
                                        onClick={() => setSelectedSkills((prev) =>
                                            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
                                        )}
                                        className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${selected
                                            ? `${meta.bg} ${meta.border} ${meta.color}`
                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                    >
                                        <span className={selected ? meta.color : 'text-slate-400'}>{meta.icon}</span>
                                        <span>{meta.label}</span>
                                        {selected && (
                                            <CheckCircle2 className={`w-4 h-4 absolute top-2 right-2 ${meta.color}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-indigo-50 rounded-2xl border border-indigo-100 px-5 py-4 flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600">{selectedSkills.length * 5}</p>
                            <p className="text-xs text-indigo-400 font-medium">Câu hỏi</p>
                        </div>
                        <div className="w-px h-10 bg-indigo-200" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600">~{selectedSkills.length * 5}</p>
                            <p className="text-xs text-indigo-400 font-medium">Phút</p>
                        </div>
                        <div className="w-px h-10 bg-indigo-200" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600">{selectedSkills.length}</p>
                            <p className="text-xs text-indigo-400 font-medium">Kỹ năng</p>
                        </div>
                    </div>

                    <button
                        onClick={handleStartTest}
                        disabled={selectedSkills.length === 0 || loading}
                        className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Đang tạo bài thi…</>
                        ) : (
                            <><Zap className="w-5 h-5" /> Bắt đầu kiểm tra</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ── Testing Phase ──────────────────────────────────────────────────────────
    if (phase === 'testing' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        const skillMeta = SKILL_META[currentQuestion.skill?.toLowerCase()] ?? SKILL_META[SkillArea.READING];

        return (
            <div className="min-h-screen bg-slate-50 py-6 px-4">
                <div className="max-w-2xl mx-auto flex flex-col gap-4">

                    {/* ── Non-blocking fast-answer warning banner ── */}
                    {fastWarning && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-amber-800">Cảnh báo: bạn đang làm bài rất nhanh</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    <span className="font-semibold">{fastWarning.count}/{fastWarning.total}</span> câu trả lời trong dưới 18 giây — có thể ảnh hưởng đến độ tin cậy của kết quả.
                                    Hãy đọc kỹ từng câu trước khi trả lời.
                                </p>
                            </div>
                            <button onClick={() => setFastWarning(null)} className="shrink-0 text-amber-400 hover:text-amber-600">
                                <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-5 py-4 flex items-center gap-4">
                        <Target className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs text-slate-400 font-medium mb-0.5">Band Test</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${skillMeta.bg} ${skillMeta.color}`}>
                                {skillMeta.icon}{skillMeta.label}
                            </span>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-slate-500">
                            {currentQuestionIndex + 1}<span className="text-slate-300">/{questions.length}</span>
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Question card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <p className="text-slate-800 font-medium text-base leading-relaxed mb-5">
                            {currentQuestion.questionText}
                        </p>
                        <div className="flex flex-col gap-2.5 mb-6">
                            {Object.entries(currentQuestion.options).map(([key, text]) => {
                                const selected = answers[currentQuestion.id] === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleAnswer(currentQuestion.id, key)}
                                        className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-sm transition-all flex items-center gap-3 ${selected
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                                            : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700'
                                            }`}
                                    >
                                        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selected ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-300 text-slate-500'
                                            }`}>
                                            {key}
                                        </span>
                                        <span>{text as string}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={!answers[currentQuestion.id] || submitting}
                            className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Đang nộp…</>
                            ) : currentQuestionIndex < questions.length - 1 ? (
                                <>Câu tiếp theo <ChevronRight className="w-4 h-4" /></>
                            ) : (
                                <>Nộp bài <CheckCircle2 className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Results Phase ──────────────────────────────────────────────────────────
    if (phase === 'results' && bandTest) {
        const changeCfg = getBandChangeCfg(bandTest.band_change);
        const recCfg = getRecommendationCfg(bandTest.recommendation);

        return (
            <div className="min-h-screen bg-slate-50 py-8 px-4">
                <div className="max-w-2xl mx-auto flex flex-col gap-5">
                    {/* Band comparison hero */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
                        <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-slate-800 mb-5">Kết quả Band Test</h1>

                        <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full border-4 border-slate-200 bg-slate-50 flex flex-col items-center justify-center mx-auto mb-2">
                                    <p className="text-2xl font-bold text-slate-600">{bandTest.previous_band.toFixed(1)}</p>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Band cũ</p>
                            </div>
                            <div className={`flex flex-col items-center gap-1 ${changeCfg.color}`}>
                                {changeCfg.icon}
                                <span className="text-xs font-semibold">{changeCfg.label}</span>
                            </div>
                            <div className="text-center">
                                <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center mx-auto mb-2 ${changeCfg.bg} ${changeCfg.border}`}>
                                    <p className={`text-2xl font-bold ${changeCfg.color}`}>{bandTest.estimated_band.toFixed(1)}</p>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Band mới</p>
                            </div>
                        </div>

                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                            Độ tin cậy: {bandTest.confidence_level}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Chính xác', value: `${bandTest.accuracy_percent.toFixed(0)}%`, bg: 'bg-indigo-50', color: 'text-indigo-600' },
                            { label: 'Câu đúng', value: bandTest.correct_count, bg: 'bg-emerald-50', color: 'text-emerald-600' },
                            { label: 'Tốc độ', value: `${bandTest.response_time_factor.toFixed(2)}x`, bg: 'bg-amber-50', color: 'text-amber-600' },
                            ...(bandTest.consistency_score != null ? [{ label: 'Nhất quán', value: `${bandTest.consistency_score.toFixed(0)}%`, bg: 'bg-purple-50', color: 'text-purple-600' }] : []),
                        ].map((s) => (
                            <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className={`text-xs font-medium mt-1 ${s.color} opacity-70`}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Suspicious fast warning + backend warnings */}
                    {(() => {
                        const suspiciousRatio = bandTest.total_questions > 0
                            ? bandTest.suspicious_fast_answers / bandTest.total_questions
                            : 0;
                        const isSuspicious = suspiciousRatio > 0.3 || bandTest.response_time_factor < 0.7;
                        const hasWarnings = bandTest.warnings && bandTest.warnings.length > 0;
                        if (!isSuspicious && !hasWarnings) return null;
                        return (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-amber-800">Cảnh báo về hành vi làm bài</p>
                                    {isSuspicious && (
                                        <p className="text-xs text-amber-700 mt-1">
                                            {bandTest.suspicious_fast_answers} / {bandTest.total_questions} câu trả lời trong &lt;30% thời gian kỳ vọng.
                                            Hệ thống nghi ngờ đoán mò — kết quả band có thể chưa phản ánh đúng năng lực thực sự của bạn.
                                        </p>
                                    )}
                                    {hasWarnings && (
                                        <ul className="mt-1.5 flex flex-col gap-0.5">
                                            {bandTest.warnings!.map((w, i) => (
                                                <li key={i} className="text-xs text-amber-700">• {w}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        Hệ số tốc độ: {bandTest.response_time_factor.toFixed(2)}
                                        {bandTest.response_time_factor < 0.7 && ' — ảnh hưởng đến band ước lượng'}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Recommendation */}
                    <div className={`rounded-2xl border p-5 ${recCfg.bg} ${recCfg.border}`}>
                        <h2 className={`font-bold text-sm mb-1.5 ${recCfg.text}`}>{recCfg.title}</h2>
                        {bandTest.recommendation === Recommendation.MAINTAIN && bandTest.weak_skills?.length > 0 && (
                            <p className={`text-sm ${recCfg.text}`}>
                                Tập trung vào: {bandTest.weak_skills.join(', ')}.
                            </p>
                        )}
                    </div>

                    {/* Skill breakdown */}
                    {Object.keys(bandTest.skill_breakdown).length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-base font-bold text-slate-800 mb-4">Chi tiết kỹ năng</h2>
                            <div className="flex flex-col gap-3">
                                {Object.entries(bandTest.skill_breakdown).map(([skill, data]) => {
                                    const meta = SKILL_META[skill] ?? {};
                                    const acc = data.accuracy;
                                    return (
                                        <div key={skill}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-xs font-semibold ${(meta as any).color ?? 'text-slate-600'}`}>
                                                    {(meta as any).label ?? skill.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-500">{data.correct}/{data.total} đúng · {acc.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${acc >= 60 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                                                    style={{ width: `${acc}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Weak points */}
                    {analysis && analysis.weak_points.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6">
                            <h2 className="text-base font-bold text-slate-800 mb-1">⚠️ Điểm yếu cần cải thiện</h2>
                            <p className="text-xs text-slate-400 mb-4">Dựa trên kết quả luyện tập của bạn</p>
                            <div className="flex flex-col gap-3">
                                {analysis.weak_points.slice(0, 5).map((wp) => {
                                    const skillMeta = SKILL_META[wp.skill] ?? {};
                                    return (
                                        <div key={wp.id} className="flex gap-3 p-3 rounded-2xl bg-rose-50 border border-rose-100">
                                            <div className={`shrink-0 mt-0.5 ${(skillMeta as any).color ?? 'text-slate-500'}`}>{(skillMeta as any).icon}</div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-700">{wp.name}</p>
                                                {wp.improvement_suggestion && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{wp.improvement_suggestion}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-rose-500 font-medium">Mắc lỗi {wp.occurrences} lần</span>
                                                    {'·'}
                                                    <span className="text-xs text-slate-400">Severity {wp.severity}/5</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {analysis && analysis.recommendations.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 p-6">
                            <h2 className="text-base font-bold text-slate-800 mb-1">💡 Đề xuất cho bạn</h2>
                            <p className="text-xs text-slate-400 mb-4">Các bài tập được gợi ý dựa trên điểm yếu</p>
                            <div className="flex flex-col gap-2">
                                {analysis.recommendations.map((rec, idx) => (
                                    <div key={rec.id} className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                                        <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-indigo-800">{rec.title}</p>
                                            {rec.reason && <p className="text-xs text-indigo-600 mt-0.5">{rec.reason}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Per-question error detail */}
                    {bandTest.question_results && bandTest.question_results.filter(r => !r.isCorrect).length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                            <button
                                onClick={() => setShowQuestionErrors((v) => !v)}
                                className="w-full flex items-center justify-between text-base font-bold text-slate-800 mb-0"
                            >
                                <span>❌ Các câu trả lời sai ({bandTest.question_results.filter(r => !r.isCorrect).length} câu)</span>
                                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showQuestionErrors ? 'rotate-90' : ''}`} />
                            </button>
                            {showQuestionErrors && (
                                <div className="mt-4 flex flex-col gap-3">
                                    {bandTest.question_results.filter(r => !r.isCorrect).map((r: QuestionResult, idx: number) => {
                                        const skillMeta = SKILL_META[r.skill] ?? {};
                                        return (
                                            <div key={r.questionId} className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${(skillMeta as any).bg ?? 'bg-slate-100'} ${(skillMeta as any).color ?? 'text-slate-600'}`}>
                                                                {(skillMeta as any).label ?? r.skill}
                                                            </span>
                                                            <span className="text-xs text-slate-400">#{idx + 1}</span>
                                                        </div>
                                                        {r.questionText && (
                                                            <p className="text-sm text-slate-700 leading-snug mb-2">{r.questionText}</p>
                                                        )}
                                                        <div className="flex flex-wrap gap-3 text-xs">
                                                            <span className="text-rose-600 font-medium">Bạn chọn: <strong>{r.studentAnswer || '(bỏ trống)'}</strong></span>
                                                            <span className="text-emerald-600 font-medium">Đáp án đúng: <strong>{r.correctAnswer}</strong></span>
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            {r.timeTaken}s / {r.expectedTime}s kỳ vọng
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upgrade roadmap suggestion (band UP) */}
                    {bandTest.band_change === BandChange.UP && !bandApplied && (
                        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-emerald-800">🎉 Band của bạn đã tăng lên {bandTest.estimated_band.toFixed(1)}!</h3>
                                    <p className="text-xs text-emerald-700 mt-1">
                                        Hệ thống sẽ cập nhật band hiện tại và tự động điều chỉnh lộ trình học phù hợp với trình độ mới của bạn.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleApplyBand}
                                disabled={applying}
                                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {applying ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật lộ trình…</>
                                ) : (
                                    <><RefreshCw className="w-4 h-4" /> Nâng cấp lộ trình & cập nhật band</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {/* Apply band button for DOWN or STABLE changes */}
                        {bandTest.band_change !== BandChange.UP && bandTest.band_change !== BandChange.STABLE && (
                            bandApplied ? (
                                <div className="w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Đã cập nhật năng lực thành công — Band {bandTest.estimated_band.toFixed(1)}
                                </div>
                            ) : (
                                <button
                                    onClick={handleApplyBand}
                                    disabled={applying}
                                    className="w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {applying ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật…</>
                                    ) : (
                                        <><RefreshCw className="w-4 h-4" /> Cập nhật năng lực (Band {bandTest.estimated_band.toFixed(1)})</>
                                    )}
                                </button>
                            )
                        )}

                        {/* Applied success state for UP */}
                        {bandTest.band_change === BandChange.UP && bandApplied && (
                            <div className="w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                {applyResult?.roadmap_regenerated
                                    ? `Đã nâng cấp lộ trình thành công — Band ${(applyResult?.new_band ?? bandTest.estimated_band).toFixed(1)}`
                                    : `Đã cập nhật band thành công — Band ${bandTest.estimated_band.toFixed(1)}`
                                }
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/student/certificate-review/ielts')}
                                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Về lộ trình
                            </button>
                            {bandApplied && (
                                <button
                                    onClick={() => navigate('/student/certificate-review/ielts')}
                                    className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {applyResult?.roadmap_regenerated ? 'Xem lộ trình mới' : 'Về lộ trình'} <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
    );
};

export default BandTestPage;

