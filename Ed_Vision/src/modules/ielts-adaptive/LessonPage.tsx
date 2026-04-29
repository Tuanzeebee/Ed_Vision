import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, Headphones, PenLine, Mic2, BookMarked, Layers,
    Loader2, CheckCircle2, XCircle, Clock, Zap, ChevronRight, Trophy,
    RotateCcw, FlipHorizontal,
} from 'lucide-react';
import { ieltsAdaptiveApi } from '@/services/ielts-adaptive/api';
import type {
    Lesson,
    LearningRepositoryItem,
    PracticeSession,
} from '../../types/ielts-adaptive.types';
import { SessionType } from '../../types/ielts-adaptive.types';

const SKILL_META: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    reading: { icon: <BookOpen className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Reading' },
    listening: { icon: <Headphones className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Listening' },
    writing: { icon: <PenLine className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Writing' },
    speaking: { icon: <Mic2 className="w-4 h-4" />, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Speaking' },
    grammar: { icon: <BookMarked className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Grammar' },
    vocabulary: { icon: <Layers className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Vocabulary' },
};

const PHASE_LABEL: Record<string, string> = {
    flashcards: 'Flashcards',
    practice: 'Luyện tập',
    'mini-test': 'Mini Test',
    results: 'Kết quả',
};

type LessonPhase = 'flashcards' | 'practice' | 'mini-test' | 'results';

export const LessonPage: React.FC = () => {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [phase, setPhase] = useState<LessonPhase>('flashcards');
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [results, setResults] = useState<PracticeSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (lessonId) {
            loadLesson();
        }
    }, [lessonId]);

    const loadLesson = async () => {
        try {
            setLoading(true);
            const data = await ieltsAdaptiveApi.getLesson(parseInt(lessonId!));
            setLesson(data);

            // Determine starting phase
            if (data.flashcardRepo && data.flashcardRepo.items?.length > 0) {
                setPhase('flashcards');
            } else if (data.practiceRepo && data.practiceRepo.items?.length > 0) {
                setPhase('practice');
            } else if (data.miniTestRepo && data.miniTestRepo.items?.length > 0) {
                setPhase('mini-test');
            }
        } catch (err) {
            console.error('Failed to load lesson:', err);
            alert('Failed to load lesson');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentItems = (): LearningRepositoryItem[] => {
        if (!lesson) return [];

        switch (phase) {
            case 'flashcards':
                return lesson.flashcardRepo?.items || [];
            case 'practice':
                return lesson.practiceRepo?.items || [];
            case 'mini-test':
                return lesson.miniTestRepo?.items || [];
            default:
                return [];
        }
    };

    const getCurrentRepositoryId = (): number | undefined => {
        switch (phase) {
            case 'practice':
                return lesson?.practice_repo_id;
            case 'mini-test':
                return lesson?.mini_test_repo_id;
            default:
                return undefined;
        }
    };

    const handleAnswer = (itemId: number, answer: string) => {
        const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

        setAnswers((prev) => ({ ...prev, [itemId.toString()]: answer }));
        setTimePerQuestion((prev) => ({ ...prev, [itemId.toString()]: timeTaken }));
    };

    const handleNext = () => {
        const items = getCurrentItems();

        if (currentItemIndex < items.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
            setQuestionStartTime(Date.now());
        } else {
            // Phase completed
            handlePhaseComplete();
        }
    };

    const handlePhaseComplete = async () => {
        if (phase === 'flashcards') {
            // Move to practice
            if ((lesson?.practiceRepo?.items?.length ?? 0) > 0) {
                setPhase('practice');
                setCurrentItemIndex(0);
                setAnswers({});
                setTimePerQuestion({});
                setQuestionStartTime(Date.now());
            } else if ((lesson?.miniTestRepo?.items?.length ?? 0) > 0) {
                setPhase('mini-test');
                setCurrentItemIndex(0);
                setAnswers({});
                setTimePerQuestion({});
                setQuestionStartTime(Date.now());
            }
        } else if (phase === 'practice') {
            // Submit practice and move to mini test
            await submitPractice(SessionType.WARMUP);

            if ((lesson?.miniTestRepo?.items?.length ?? 0) > 0) {
                setPhase('mini-test');
                setCurrentItemIndex(0);
                setAnswers({});
                setTimePerQuestion({});
                setQuestionStartTime(Date.now());
            } else {
                // No mini test, complete lesson
                await completeLesson();
            }
        } else if (phase === 'mini-test') {
            // Submit mini test and show results
            await submitPractice(SessionType.MINI_TEST);
        }
    };

    const submitPractice = async (sessionType: SessionType) => {
        if (!lesson) return;

        const repositoryId = getCurrentRepositoryId();
        if (!repositoryId) return;

        try {
            setSubmitting(true);
            const result = await ieltsAdaptiveApi.submitPractice({
                lesson_id: lesson.id,
                session_type: sessionType,
                repository_id: repositoryId,
                answers,
                time_per_question: timePerQuestion,
            });

            setResults(result);

            if (sessionType === SessionType.MINI_TEST) {
                setPhase('results');
            }
        } catch (err) {
            console.error('Failed to submit practice:', err);
            alert('Failed to submit answers');
        } finally {
            setSubmitting(false);
        }
    };

    const completeLesson = async () => {
        if (!lesson) return;

        try {
            await ieltsAdaptiveApi.completeLesson(lesson.id);
            navigate(`/ielts-adaptive/roadmap/${lesson.roadmap_id}`);
        } catch (err) {
            console.error('Failed to complete lesson:', err);
        }
    };

    const handleBackToRoadmap = () => {
        navigate('/student/certificate-review/ielts');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 text-sm">Đang tải bài học…</p>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-slate-500">Không tìm thấy bài học.</p>
            </div>
        );
    }

    const items = getCurrentItems();
    const currentItem = items[currentItemIndex];
    const progress = items.length > 0 ? ((currentItemIndex + 1) / items.length) * 100 : 0;
    const skillMeta = SKILL_META[lesson.skill_area?.toLowerCase()] ?? SKILL_META['reading'];

    // ── Results phase ──────────────────────────────────────────────────────────
    if (phase === 'results' && results) {
        const accuracy = results.accuracy_percent ?? 0;
        const incorrect = results.total_questions - results.correct_count;
        return (
            <div className="min-h-screen bg-slate-50 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Score hero */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center mb-6">
                        <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-slate-800 mb-1">Hoàn thành bài học!</h1>
                        <p className="text-slate-500 text-sm mb-6">{lesson.lesson_title}</p>
                        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-indigo-50 border-4 border-indigo-200 mb-6">
                            <div>
                                <p className="text-3xl font-bold text-indigo-600">{accuracy.toFixed(0)}%</p>
                                <p className="text-xs text-indigo-400 font-medium">Chính xác</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-emerald-50 rounded-2xl p-4">
                                <p className="text-2xl font-bold text-emerald-600">{results.correct_count}</p>
                                <p className="text-xs text-emerald-500 font-medium mt-1">Đúng</p>
                            </div>
                            <div className="bg-rose-50 rounded-2xl p-4">
                                <p className="text-2xl font-bold text-rose-600">{incorrect}</p>
                                <p className="text-xs text-rose-500 font-medium mt-1">Sai</p>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-2xl font-bold text-slate-600">{results.avg_time_per_q?.toFixed(0) ?? '--'}s</p>
                                <p className="text-xs text-slate-500 font-medium mt-1">TB/câu</p>
                            </div>
                        </div>
                    </div>

                    {/* Question review */}
                    {results.detailed_results && results.detailed_results.length > 0 && (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
                            <h2 className="text-base font-bold text-slate-800 mb-4">Xem lại câu hỏi</h2>
                            <div className="flex flex-col gap-3">
                                {results.detailed_results.map((r, i) => (
                                    <div
                                        key={r.item_id}
                                        className={`rounded-2xl p-4 border ${r.is_correct ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            {r.is_correct
                                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                                            <span className={`text-xs font-semibold ${r.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                Câu {i + 1} — {r.is_correct ? 'Đúng' : 'Sai'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 mb-2">{r.question}</p>
                                        <p className="text-sm text-slate-600">
                                            <span className="font-medium">Bạn chọn:</span>{' '}
                                            <span className={r.is_correct ? 'text-emerald-700' : 'text-rose-700'}>
                                                {r.student_answer || '(không trả lời)'}
                                            </span>
                                        </p>
                                        {!r.is_correct && (
                                            <p className="text-sm text-slate-600 mt-1">
                                                <span className="font-medium">Đáp án:</span>{' '}
                                                <span className="text-emerald-700">{r.correct_answer}</span>
                                            </p>
                                        )}
                                        {r.explanation && (
                                            <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
                                                💡 {r.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleBackToRoadmap}
                        className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại lộ trình
                    </button>
                </div>
            </div>
        );
    }

    // ── Flashcard / Question phase ─────────────────────────────────────────────
    const phaseSteps = ['flashcards', 'practice', 'mini-test'] as const;
    const activeStep = phaseSteps.indexOf(phase as any);

    return (
        <div className="min-h-screen bg-slate-50 py-6 px-4">
            <div className="max-w-2xl mx-auto flex flex-col gap-4">
                {/* Header */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-5 py-4 flex items-center gap-4">
                    <button
                        onClick={handleBackToRoadmap}
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 font-medium mb-0.5 truncate">{lesson.lesson_title}</p>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${skillMeta.bg} ${skillMeta.color}`}>
                                {skillMeta.icon}{skillMeta.label}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                {PHASE_LABEL[phase] ?? phase}
                            </span>
                        </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-500">
                        {currentItemIndex + 1}<span className="text-slate-300">/{items.length}</span>
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2">
                    {phaseSteps.map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${i < activeStep ? 'bg-emerald-100 text-emerald-700' :
                                i === activeStep ? 'bg-indigo-500 text-white' :
                                    'bg-slate-100 text-slate-400'
                                }`}>
                                {i < activeStep ? <CheckCircle2 className="w-3 h-3" /> : null}
                                {PHASE_LABEL[s]}
                            </div>
                            {i < phaseSteps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Content */}
                {currentItem && (
                    <>
                        {phase === 'flashcards' ? (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FlipHorizontal className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Flashcard</span>
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-3">{currentItem.title}</h2>
                                <p className="text-slate-600 leading-relaxed mb-4">{currentItem.stem}</p>
                                {currentItem.explanation && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 leading-relaxed">
                                        💡 {currentItem.explanation}
                                    </div>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="mt-6 w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {currentItemIndex < items.length - 1 ? (
                                        <>Tiếp theo <ChevronRight className="w-4 h-4" /></>
                                    ) : (
                                        <>Bắt đầu luyện tập <Zap className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                                <p className="text-slate-800 font-medium text-base leading-relaxed mb-4">{currentItem.stem}</p>
                                {currentItem.hint && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-sm text-blue-600 mb-4">
                                        💡 {currentItem.hint}
                                    </div>
                                )}
                                <div className="flex flex-col gap-2.5 mb-6">
                                    {currentItem.options?.map((option) => {
                                        const selected = answers[currentItem.id.toString()] === option.option_key;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleAnswer(currentItem.id, option.option_key)}
                                                className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-sm transition-all flex items-center gap-3 ${selected
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                                                    : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700'
                                                    }`}
                                            >
                                                <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${selected ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-300 text-slate-500'
                                                    }`}>
                                                    {option.option_key}
                                                </span>
                                                <span>{option.option_text}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={handleNext}
                                    disabled={!answers[currentItem.id.toString()] || submitting}
                                    className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Đang nộp…</>
                                    ) : currentItemIndex < items.length - 1 ? (
                                        <>Tiếp theo <ChevronRight className="w-4 h-4" /></>
                                    ) : phase === 'practice' ? (
                                        <>Tiếp tục Mini Test <Zap className="w-4 h-4" /></>
                                    ) : (
                                        <>Nộp bài <CheckCircle2 className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LessonPage;

