import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, Headphones, PenLine, Mic2, BookMarked, Layers,
    Loader2, CheckCircle2, XCircle, Zap, ChevronRight, Trophy,
    FlipHorizontal, Settings, Clock, Play, FileText, ClipboardList,
    GraduationCap, Lightbulb, ChevronLeft, Check,
} from 'lucide-react';
import { ieltsAdaptiveApi } from '@/services/ielts-adaptive/api';
import Header from "../../components/layout/Header";
import Footer from '../../components/layout/Footer';
import type {
    Lesson,
    LearningRepositoryItem,
    PracticeSession,
} from '../../types/ielts-adaptive.types';
import { SessionType } from '../../types/ielts-adaptive.types';
import { QuestionRenderer, FlashcardItem } from './components/QuestionRenderer';
import {
    chatIeltsGroqTutor,
    type IeltsChatMessage,
} from "@/services/api/certificateService";
import IeltsChatPanel from './components/IeltsChatPanel';
import IeltsVocabPanel, { type VocabWord } from './components/IeltsVocabPanel';
import FloatingVocabCard from './components/FloatingVocabCard';
import { syncToMasterVocab } from './components/MasterVocabModal';
import AudioPlayer from './components/AudioPlayer';

const QUICK_ACTIONS_CONFIG = {
    writing: [
        { label: "Kiểm tra ngữ pháp", prompt: "Kiểm tra ngữ pháp bài viết này và chỉ ra các lỗi cụ thể" },
        { label: "Gợi ý từ học thuật", prompt: "Gợi ý các từ/cụm từ học thuật (academic vocabulary) phù hợp để thay thế" },
        { label: "Nhận xét cấu trúc", prompt: "Nhận xét cấu trúc bài essay: intro, body, conclusion" }
    ],
    listening: [
        { label: "Giải thích script", prompt: "Giải thích nội dung đoạn audio/script này" },
        { label: "Từ vựng trong audio", prompt: "Liệt kê và giải thích từ vựng quan trọng trong đoạn này" },
        { label: "Tip nghe hiệu quả", prompt: "Cho tôi tips để nghe hiệu quả hơn cho dạng câu hỏi này" }
    ],
    reading: [
        { label: "Giải nghĩa từ khó", prompt: "Giải nghĩa các từ khó trong đoạn văn này" },
        { label: "Tip skimming & scanning", prompt: "Hướng dẫn kỹ thuật skimming và scanning cho đoạn này" },
        { label: "Phân tích câu hỏi", prompt: "Phân tích cách tiếp cận câu hỏi này" }
    ],
    speaking: [
        { label: "Gợi ý ý tưởng", prompt: "Gợi ý ý tưởng và outline để trả lời câu hỏi này" },
        { label: "Cụm từ hay dùng", prompt: "Gợi ý các cụm từ hay (useful phrases) cho chủ đề này" },
        { label: "Cách phát âm", prompt: "Hướng dẫn phát âm các từ quan trọng trong chủ đề này" }
    ],
    vocabulary: [],
    grammar: []
};

// ─── Meta ────────────────────────────────────────────────────────────────────

const SKILL_META: Record<string, { icon: React.ReactNode; color: string; bg: string; dot: string; label: string }> = {
    reading: { icon: <BookOpen className="w-3 h-3" />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', label: 'Reading' },
    listening: { icon: <Headphones className="w-3 h-3" />, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-400', label: 'Listening' },
    writing: { icon: <PenLine className="w-3 h-3" />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500', label: 'Writing' },
    speaking: { icon: <Mic2 className="w-3 h-3" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Speaking' },
    grammar: { icon: <BookMarked className="w-3 h-3" />, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Grammar' },
    vocabulary: { icon: <Layers className="w-3 h-3" />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-600', label: 'Vocabulary' },
};

const WRITING_TYPES = new Set(['writing', 'writing_task', 'sentence_rewrite', 'planning_task', 'essay_task']);
const SPEAKING_TYPES = new Set(['speaking', 'speaking_prompt', 'speaking_task']);
const isAiGradedType = (t?: string) => WRITING_TYPES.has(t ?? '') || SPEAKING_TYPES.has(t ?? '');

type LessonPhase = 'flashcards' | 'practice' | 'mini-test' | 'results';

// ─── Main Component ──────────────────────────────────────────────────────────

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
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [assistantTab, setAssistantTab] = useState<'ai' | 'vocab'>('ai');

    // --- AI Chat State ---
    const [chatHistory, setChatHistory] = useState<IeltsChatMessage[]>([]);
    const [chatMessage, setChatMessage] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
    const [isExtractingVocab, setIsExtractingVocab] = useState(false);

    const [floatingWord, setFloatingWord] = useState<{ word: string, x: number, y: number } | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => { if (lessonId) loadLesson(); }, [lessonId]);
    useEffect(() => { setIsFlipped(false); }, [currentItemIndex, phase]);

    // Keep chat history throughout the lesson session
    // Removed reset on currentItemIndex or phase change

    // --- Vocab Management ---
    useEffect(() => {
        const saved = localStorage.getItem(`ielts_vocab_${lessonId}`);
        if (saved) {
            try { setVocabWords(JSON.parse(saved)); } catch (e) { console.error(e); }
        }
    }, [lessonId]);

    useEffect(() => {
        if (lessonId) {
            localStorage.setItem(`ielts_vocab_${lessonId}`, JSON.stringify(vocabWords));
        }
    }, [vocabWords, lessonId]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddVocab = (w: Omit<VocabWord, 'id' | 'created_at'>) => {
        const word: VocabWord = {
            ...w,
            id: Date.now(),
            created_at: new Date().toISOString()
        };
        setVocabWords(prev => [word, ...prev]);
        showToast(`Đã thêm "${w.en}" vào Note`);

        // Sync to Master
        if (lesson) {
            syncToMasterVocab(word, lesson.id, lesson.lesson_title, (lesson.skill_area as any) || 'reading');
        }
    };

    const handleDeleteVocab = (id: string | number) => {
        setVocabWords(prev => prev.filter(w => w.id !== id));
    };

    const handleToggleStarVocab = (id: string | number) => {
        setVocabWords(prev => {
            const updated = prev.map(w => w.id === id ? { ...w, starred: !w.starred } : w);
            const word = updated.find(w => w.id === id);
            if (word && lesson) {
                syncToMasterVocab(word, lesson.id, lesson.lesson_title, (lesson.skill_area as any) || 'reading');
            }
            return updated;
        });
    };

    const handleUpdateVocabNote = (id: string | number, note: string) => {
        setVocabWords(prev => prev.map(w => w.id === id ? { ...w, note } : w));
    };

    const handleExtractVocabAI = async () => {
        if (!lesson || isExtractingVocab) return;
        setIsExtractingVocab(true);
        try {
            const items = getCurrentItems();
            const currentPassage =
                (lesson?.practiceRepo?.metadata as any)?.content?.passage ??
                (lesson?.miniTestRepo?.metadata as any)?.content?.passage ??
                items[currentItemIndex]?.reading_passage ??
                items.find(i => i.reading_passage)?.reading_passage ??
                '';

            console.log("📖 Passage found:", currentPassage.slice(0, 100));

            if (!currentPassage.trim()) {
                const fallbackText = items.map(i => i.stem).join(' ');
                if (!fallbackText.trim()) return;
            }

            const prompt = `You are a JSON API. Return ONLY a raw JSON array, no explanation, no markdown, no Vietnamese conversational text.
            Extract 5 advanced or important vocabulary words from this passage.
            IMPORTANT: Keep the EXACT word form as it appears in the passage (do NOT lemmatize).
            For example, if "contrasting" appears, use "contrasting", not "contrast".
            Format: [{"en": "exact_word_in_passage", "vn": "nghĩa tiếng Việt", "type": "noun/verb/adjective/adverb"}]
            
            Passage: "${currentPassage.slice(0, 2000)}"`;

            const res = await chatIeltsGroqTutor({
                skill: 'vocabulary',
                context_text: 'Học sinh đang yêu cầu trích xuất từ vựng từ bài đọc.',
                user_message: prompt,
                band_target: lesson?.band_level ? (lesson.band_level + 0.5) : undefined,
            });

            const rawResponse = res.answer.trim();
            const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("No JSON array found in AI response");

            const extracted = JSON.parse(jsonMatch[0]);

            const newWords = extracted.map((item: any) => {
                if (!vocabWords.find(w => w.en.toLowerCase() === item.en.toLowerCase())) {
                    return {
                        ...item,
                        id: Date.now() + Math.random(),
                        source: 'ai',
                        starred: false,
                        note: '',
                        created_at: new Date().toISOString()
                    };
                }
                return null;
            }).filter(Boolean);

            if (newWords.length > 0) {
                setVocabWords(prev => [...newWords, ...prev]);
            }
        } catch (err) {
            console.error("Vocab extraction error:", err);
        } finally {
            setIsExtractingVocab(false);
        }
    };

    const fetchWordInfoAI = async (word: string, context?: string) => {
        const prompt = `Return ONLY a JSON object, no markdown, no explanation, no Vietnamese preamble.
        For the English word "${word}" used in this context: "${context?.slice(0, 500) ?? ''}"
        Return exactly this format: {"en": "${word}", "phonetic": "IPA here", "type": "noun/verb/adj/adv", "vn": "nghĩa tiếng Việt", "example": "short example sentence using the word in similar context"}`;

        try {
            const res = await chatIeltsGroqTutor({
                skill: 'vocabulary',
                context_text: context || 'Tra cứu từ vựng lẻ.',
                user_message: prompt,
            });
            const jsonMatch = res.answer.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            return JSON.parse(jsonMatch[0]);
        } catch (err) {
            console.error("Fetch word info error:", err);
            throw err;
        }
    };

    const sendChatMessage = async (overrideMsg?: string) => {
        const msgToSend = overrideMsg || chatMessage;
        if (!msgToSend.trim() || isChatLoading) return;

        const userMsg: IeltsChatMessage = { role: "user", content: msgToSend.trim() };
        if (!overrideMsg || overrideMsg === chatMessage.trim()) setChatMessage("");
        setChatHistory(prev => [...prev, userMsg]);
        setIsChatLoading(true);
        setIsChatExpanded(true);

        try {
            const skillKey = (lesson?.skill_area?.toLowerCase() || 'reading') as any;
            const currentItems = getCurrentItems();
            const currentItem = currentItems[currentItemIndex];

            const contextText = currentItem
                ? `Câu hỏi: ${currentItem.stem}\nĐoạn văn/Ngữ cảnh: ${currentItem.reading_passage || 'Không có'}`
                : 'Học sinh đang luyện tập IELTS.';

            const res = await chatIeltsGroqTutor({
                skill: skillKey,
                context_text: contextText,
                user_message: msgToSend.trim(),
                chat_history: chatHistory,
                band_target: lesson?.band_level ? (lesson.band_level + 0.5) : undefined,
            });

            setChatHistory(prev => [...prev, { role: "assistant", content: res.answer }]);
        } catch (err) {
            console.error("Chat error:", err);
            setChatHistory(prev => [
                ...prev,
                { role: "assistant", content: "Xin lỗi, trợ lý AI đang bận một chút. Bạn thử lại sau nhé!" }
            ]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleTextSelection = (e: React.MouseEvent) => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
            setFloatingWord({
                word: selectedText,
                x: e.clientX,
                y: e.clientY
            });
        }
    };

    const handleWordClick = (word: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanWord = word.replace(/[.,!?;:'"()—–-]/g, "").trim();
        console.log("🖱️ Word clicked:", cleanWord, "at", e.clientX, e.clientY);
        if (cleanWord) {
            setFloatingWord({
                word: cleanWord,
                x: e.clientX,
                y: e.clientY
            });
        }
    };

    const renderPassageWithHighlights = (text: string) => {
        if (!text) return null;

        // Build map: stem/inflection -> base word for reliable highlighting
        const vocabMap = new Map<string, string>();
        vocabWords.forEach(w => {
            const base = w.en.toLowerCase();
            vocabMap.set(base, base);
            // Handle common inflections
            vocabMap.set(base + 's', base);
            vocabMap.set(base + 'ing', base);
            vocabMap.set(base + 'ed', base);
            vocabMap.set(base + 'ly', base);
            if (base.endsWith('e')) {
                vocabMap.set(base.slice(0, -1) + 'ing', base);
            }
        });

        // Tách passage thành words, giữ nguyên spaces/punctuation
        const parts = text.split(/(\s+|[.,!?;:'"()—–-])/);

        return parts.map((part, i) => {
            const clean = part.replace(/[.,!?;:'"()—–-]/g, '').toLowerCase();
            const matchedBase = vocabMap.get(clean);

            if (!clean) return <React.Fragment key={i}>{part}</React.Fragment>;

            return (
                <span
                    key={i}
                    onClick={(e) => {
                        e.stopPropagation();
                        setFloatingWord({
                            word: matchedBase || clean,
                            x: e.clientX,
                            y: e.clientY
                        });
                    }}
                    className={`cursor-pointer transition-all duration-150 rounded-md px-0.5 ${matchedBase
                            ? 'font-bold text-blue-700 underline decoration-dotted decoration-blue-400 underline-offset-4 bg-blue-50/50 hover:bg-blue-100'
                            : 'hover:bg-slate-200/50 hover:text-blue-600'
                        }`}
                >
                    {part}
                </span>
            );
        });
    };

    const handleQuickAction = (p: string) => sendChatMessage(p);

    const toggleChat = () => setIsChatExpanded(!isChatExpanded);

    const loadLesson = async () => {
        try {
            setLoading(true);
            const data = await ieltsAdaptiveApi.getLesson(parseInt(lessonId!));
            const skillKey = data?.skill_area?.toLowerCase?.() ?? '';
            const hasWritingItem = (repo: any) =>
                Array.isArray(repo?.items) && repo.items.some((item: any) =>
                    WRITING_TYPES.has(String(item?.item_type ?? '')),
                );
            const hasSpeakingItem = (repo: any) =>
                Array.isArray(repo?.items) && repo.items.some((item: any) =>
                    SPEAKING_TYPES.has(String(item?.item_type ?? '')),
                );

            // 1. Prioritize explicit skill_area
            if (skillKey === 'writing') {
                navigate(`/ielts-adaptive/writing/${data.id}`);
                return;
            }
            if (skillKey === 'speaking') {
                navigate(`/ielts-adaptive/speaking/${data.id}`);
                return;
            }

            // 2. Fallback to item types only if skillKey is not explicitly set to a specific skill
            if (
                hasWritingItem(data?.practiceRepo) ||
                hasWritingItem(data?.miniTestRepo) ||
                hasWritingItem(data?.flashcardRepo)
            ) {
                navigate(`/ielts-adaptive/writing/${data.id}`);
                return;
            }

            if (
                hasSpeakingItem(data?.practiceRepo) ||
                hasSpeakingItem(data?.miniTestRepo) ||
                hasSpeakingItem(data?.flashcardRepo)
            ) {
                navigate(`/ielts-adaptive/speaking/${data.id}`);
                return;
            }
            setLesson(data);
            if (data.flashcardRepo?.items?.length) setPhase('flashcards');
            else if (data.practiceRepo?.items?.length) setPhase('practice');
            else if (data.miniTestRepo?.items?.length) setPhase('mini-test');
        } catch (err) {
            console.error('Failed to load lesson:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentItems = (): LearningRepositoryItem[] => {
        if (!lesson) return [];
        switch (phase) {
            case 'flashcards': return lesson.flashcardRepo?.items || [];
            case 'practice': return lesson.practiceRepo?.items || [];
            case 'mini-test': return lesson.miniTestRepo?.items || [];
            default: return [];
        }
    };

    const getCurrentRepositoryId = () => {
        switch (phase) {
            case 'practice': return lesson?.practice_repo_id;
            case 'mini-test': return lesson?.mini_test_repo_id;
            default: return undefined;
        }
    };

    const getLessonProgress = (): number => {
        if (!lesson) return 0;
        const phases: LessonPhase[] = ['flashcards', 'practice', 'mini-test'];
        const phaseWeight = 100 / phases.length;
        const phaseIndex = phases.indexOf(phase as any);
        if (phase === 'results') return 100;
        const items = getCurrentItems();
        const withinPhase = items.length > 0 ? (currentItemIndex / items.length) : 0;
        return Math.round(phaseIndex * phaseWeight + withinPhase * phaseWeight);
    };

    const handleAnswer = (itemId: number, answer: string) => {
        const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
        setAnswers(prev => ({ ...prev, [itemId.toString()]: answer }));
        setTimePerQuestion(prev => ({ ...prev, [itemId.toString()]: timeTaken }));
    };

    const handleCheck = () => {
        const item = getCurrentItems()[currentItemIndex];
        if (!item) return;
        setCheckedItems(prev => ({ ...prev, [item.id.toString()]: true }));
    };

    const handleNext = () => {
        const items = getCurrentItems();
        if (currentItemIndex < items.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
            setQuestionStartTime(Date.now());
        } else {
            handlePhaseComplete();
        }
    };

    const handlePhaseComplete = async () => {
        setCheckedItems({});
        if (phase === 'flashcards') {
            if ((lesson?.practiceRepo?.items?.length ?? 0) > 0) {
                setPhase('practice'); resetItems();
            } else if ((lesson?.miniTestRepo?.items?.length ?? 0) > 0) {
                setPhase('mini-test'); resetItems();
            }
        } else if (phase === 'practice') {
            await submitPractice(SessionType.WARMUP);
            if ((lesson?.miniTestRepo?.items?.length ?? 0) > 0) {
                setPhase('mini-test'); resetItems();
            } else {
                await completeLesson();
            }
        } else if (phase === 'mini-test') {
            await submitPractice(SessionType.MINI_TEST);
        }
    };

    const resetItems = () => {
        setCurrentItemIndex(0);
        setAnswers({});
        setTimePerQuestion({});
        setQuestionStartTime(Date.now());
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
            if (sessionType === SessionType.MINI_TEST) setPhase('results');
        } catch (err) {
            console.error('Failed to submit practice:', err);
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

    const handleBackToRoadmap = () => navigate('/student/certificate-review/ielts');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F0F4FF]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Đang tải bài học…</p>
                </div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F0F4FF]">
                <p className="text-slate-400">Không tìm thấy bài học.</p>
            </div>
        );
    }

    const items = getCurrentItems();
    const currentItem = items[currentItemIndex];
    const progress = getLessonProgress();
    const skillKey = lesson.skill_area?.toLowerCase() ?? 'reading';
    const skillMeta = SKILL_META[skillKey] ?? SKILL_META['reading'];
    const baseBandValue = lesson.band_level ? lesson.band_level : null;
    const bandSummary = baseBandValue != null
        ? `${baseBandValue.toFixed(1)}→${(baseBandValue + 0.5).toFixed(1)}`
        : '--';

    const availablePhases: LessonPhase[] = [];
    if (lesson.flashcardRepo?.items?.length) availablePhases.push('flashcards');
    if (lesson.practiceRepo?.items?.length) availablePhases.push('practice');
    if (lesson.miniTestRepo?.items?.length) availablePhases.push('mini-test');
    if (phase === 'results') availablePhases.push('results');

    const itemKey = currentItem?.id.toString() ?? '';
    const selectedAnswer = answers[itemKey];
    const isChecked = !!checkedItems[itemKey];
    const isAiGraded = isAiGradedType(currentItem?.item_type);

    const hasAnswer = isAiGraded
        ? (selectedAnswer && (() => { try { const r = JSON.parse(selectedAnswer); return r?.bandScore != null; } catch { return false; } })())
        : !!selectedAnswer;

    const showCheck = phase === 'practice' && !isChecked && !isAiGraded;
    const showNext = phase !== 'practice' || isChecked || isAiGraded;

    const currentPassage = (lesson?.practiceRepo?.metadata as any)?.content?.passage ??
        (lesson?.miniTestRepo?.metadata as any)?.content?.passage ??
        currentItem?.reading_passage;

    return (
        <div className="min-h-screen flex flex-col bg-[#F0F4FF]">
            <header className="h-[56px] sticky top-0 bg-white border-b border-blue-100 flex items-center justify-between px-6 z-50 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToRoadmap}
                        className="text-slate-600 hover:text-blue-600 transition-colors text-[13px] font-bold flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Roadmap
                    </button>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1 text-[13px]">
                        <span className="text-slate-400">IELTS Adaptive</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-blue-900 font-bold">{skillMeta.label} — Band {bandSummary}</span>
                    </div>
                </div>

                <div className="flex items-center bg-slate-100/50 p-1.5 rounded-full border border-slate-200">
                    {['flashcards', 'practice', 'mini-test'].map((p, idx, arr) => {
                        const available = availablePhases.includes(p as any);
                        if (!available) return null;
                        const isActive = phase === p;
                        const isDone = availablePhases.indexOf(phase as any) > availablePhases.indexOf(p as any);
                        const label = p === 'flashcards' ? 'Flashcards' : p === 'practice' ? 'Luyện tập' : 'Mini Test';

                        return (
                            <React.Fragment key={p}>
                                <div
                                    className={`px-4 py-1.5 rounded-full text-[13px] font-black transition-all flex items-center gap-2 ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                                        : isDone
                                            ? 'text-emerald-600 bg-emerald-50'
                                            : 'text-slate-400 hover:text-blue-500'
                                        }`}
                                >
                                    {isDone ? (
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>
                                    ) : isActive ? (
                                        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                                    ) : null}
                                    {label}
                                </div>
                                {idx < arr.length - 1 && (
                                    <div className="px-1 text-slate-300">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LESSON PROGRESS</span>
                        <div className="w-[100px] h-2.5 bg-blue-50 rounded-full overflow-hidden border border-blue-100">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[13px] font-black text-blue-600">{progress}%</span>
                    </div>
                    <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="h-[calc(100vh-56px)] flex overflow-hidden min-h-0">
                {phase !== 'results' && (
                    <aside className="w-[300px] border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-0 h-full">
                        <div className="px-6 py-5 shrink-0">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">TRỢ LÝ AI</p>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 flex items-center gap-6 border-b border-slate-100 shrink-0">
                            <button
                                onClick={() => setAssistantTab('ai')}
                                className={`pb-3 text-[13px] font-black transition-all relative ${assistantTab === 'ai' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Trợ lý AI
                                {assistantTab === 'ai' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
                            </button>
                            <button
                                onClick={() => setAssistantTab('vocab')}
                                className={`pb-3 text-[13px] font-black transition-all relative ${assistantTab === 'vocab' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Note từ vựng
                                {assistantTab === 'vocab' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                            {assistantTab === 'ai' ? (
                                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                                    <IeltsChatPanel
                                        skill={(lesson?.skill_area?.toLowerCase() || 'reading') as any}
                                        chatHistory={chatHistory}
                                        chatMessage={chatMessage}
                                        isChatLoading={isChatLoading}
                                        onSendMessage={sendChatMessage}
                                        onMessageChange={setChatMessage}
                                        quickActions={QUICK_ACTIONS_CONFIG[(lesson?.skill_area?.toLowerCase() || 'reading') as keyof typeof QUICK_ACTIONS_CONFIG] || []}
                                    />
                                </div>
                            ) : (
                                <IeltsVocabPanel
                                    words={vocabWords}
                                    onAddWord={handleAddVocab}
                                    onDeleteWord={handleDeleteVocab}
                                    onToggleStar={handleToggleStarVocab}
                                    onUpdateNote={handleUpdateVocabNote}
                                    onExtractAI={handleExtractVocabAI}
                                    isExtracting={isExtractingVocab}
                                />
                            )}
                        </div>
                    </aside>
                )}

                {/* Cột phải — Content Area */}
                <main
                    onMouseUp={handleTextSelection}
                    className={`flex-1 bg-[#F0F4FF] ${phase === 'results' ? 'overflow-y-auto' : 'p-8 flex flex-col gap-6 overflow-hidden'}`}
                >
                    {phase === 'results' ? (
                        <div className="min-h-full w-full py-12 px-8">
                            <ResultsView results={results} lesson={lesson} skillMeta={skillMeta} onBack={handleBackToRoadmap} />
                        </div>
                    ) : phase === 'flashcards' ? (
                        /* FLASHCARD LAYOUT — Centered & Beautiful */
                        <div className="flex-1 flex flex-col items-center justify-center gap-10">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-slate-800">Kiểm tra kiến thức</h2>
                                <p className="text-slate-500">Lật thẻ để xem định nghĩa và ví dụ</p>
                            </div>

                            <div
                                className="group perspective-1000 w-[600px] h-[380px] cursor-pointer"
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                    {/* Mặt trước */}
                                    <div className="absolute inset-0 backface-hidden bg-white rounded-[40px] shadow-[0_30px_60px_rgba(37,99,235,0.1)] border border-blue-100 flex flex-col items-center justify-center p-12 text-center">
                                        <div className="absolute top-8 left-8 w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Lightbulb className="w-7 h-7" />
                                        </div>
                                        <span className="text-[13px] font-black text-blue-600 uppercase tracking-widest mb-6">Question / Term</span>
                                        <h3 className="text-3xl font-bold text-slate-800 leading-tight">
                                            {currentItem?.stem}
                                        </h3>
                                        <div className="mt-12 flex items-center gap-2 text-slate-400 text-sm font-medium">
                                            <Zap className="w-4 h-4" />
                                            Click to Flip
                                        </div>
                                    </div>

                                    {/* Mặt sau */}
                                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-blue-900 rounded-[40px] shadow-[0_30px_60px_rgba(30,58,138,0.3)] flex flex-col items-center justify-center p-12 text-center text-white">
                                        <div className="w-full max-w-md">
                                            <span className="text-[11px] font-black text-blue-300 uppercase tracking-[0.2em] mb-8 block">Nghĩa & Giải thích ngữ cảnh</span>

                                            <div className="space-y-6">
                                                <div className="pb-6 border-b border-white/10">
                                                    <p className="text-3xl font-bold leading-tight text-white">
                                                        {currentItem?.options?.find(o => o.is_correct)?.option_text || currentItem?.explanation || currentItem?.hint || 'Đang cập nhật...'}
                                                    </p>
                                                </div>

                                                {currentItem?.explanation && (
                                                    <div className="text-left">
                                                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                                                            <Lightbulb className="w-3 h-3" /> Giải thích ngữ cảnh
                                                        </p>
                                                        <p className="text-lg text-slate-300 leading-relaxed italic">
                                                            "{currentItem.explanation}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 text-[13px] font-medium">
                                <Layers className="w-4 h-4" />
                                Card {currentItemIndex + 1} of {items.length}
                            </div>
                        </div>
                    ) : (
                        /* PRACTICE / MINI TEST LAYOUT */
                        <>
                            <div className="flex-1 flex gap-8 overflow-hidden min-h-0">
                                {/* Passage Card */}
                                <div className="flex-1 bg-white rounded-[32px] border border-blue-100 flex flex-col overflow-hidden shadow-xl shadow-blue-900/5">
                                    <div className="px-6 py-4 border-b border-blue-50 bg-blue-50/30 flex items-center justify-between shrink-0">
                                        <span className="text-[11px] font-black text-blue-600 flex items-center gap-1.5 uppercase tracking-wider">
                                            <BookOpen className="w-4 h-4" />
                                            📖 ĐOẠN VĂN
                                        </span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200">
                                        <div className="prose prose-slate max-w-none">
                                            <div className="text-[16px] text-slate-700 leading-[2.2] font-medium">
                                                {currentPassage
                                                    ? renderPassageWithHighlights(currentPassage)
                                                    : 'Nội dung đoạn văn đang được cập nhật...'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Câu hỏi & Đáp án */}
                                <div className="w-[420px] flex flex-col shrink-0">
                                    {/* Listening Audio Player — only when skill is listening and audio URL exists */}
                                    {skillKey === 'listening' && currentItem?.media_audio_url && (
                                        <div className="mb-4">
                                            <AudioPlayer
                                                key={currentItem.id}
                                                url={currentItem.media_audio_url}
                                                autoPlay={true}
                                                label="Nghe và trả lời câu hỏi"
                                            />
                                        </div>
                                    )}

                                    <div className="bg-white rounded-[32px] border border-blue-100 p-8 shadow-xl shadow-blue-900/5 flex flex-col h-full overflow-hidden">
                                        <div className="flex items-center justify-between mb-6 shrink-0">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CÂU HỎI & ĐÁP ÁN</p>
                                            <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                                {currentItemIndex + 1} / {items.length}
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar">
                                            {/* Question Stem in Right Column */}
                                            <div className="space-y-4">
                                                <h3 className="text-[18px] font-black text-slate-800 leading-relaxed">
                                                    {currentItem?.stem}
                                                </h3>
                                                {currentItem?.hint && !isChecked && (
                                                    <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[13px] italic font-bold">
                                                        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                                                        {currentItem.hint}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-slate-50">
                                                {currentItem && (
                                                    <QuestionRenderer
                                                        key={currentItem.id}
                                                        item={currentItem}
                                                        selectedAnswer={selectedAnswer}
                                                        showResult={isChecked}
                                                        onAnswer={(ans) => !isChecked && handleAnswer(currentItem.id, ans)}
                                                        layout="stack"
                                                        hidePassage={true}
                                                        hideAudio={true}
                                                        hideQuestion={true} // We render stem manually above for better control
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* Tầng 3 — Bottom bar (64px) */}
            <footer className="h-[72px] sticky bottom-0 bg-white border-t border-blue-100 flex items-center justify-between px-8 z-50 shrink-0 shadow-[0_-10px_30px_rgba(37,99,235,0.05)]">
                <button
                    onClick={() => currentItemIndex > 0 && setCurrentItemIndex(i => i - 1)}
                    disabled={currentItemIndex === 0}
                    className={`text-[13px] font-black transition-colors ${currentItemIndex === 0 ? 'text-slate-300' : 'text-slate-600 hover:text-blue-600'
                        }`}
                >
                    ‹ Previous Section
                </button>

                <div className="flex-1" />

                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 text-[13px] font-black text-slate-600 border-2 border-blue-50 rounded-2xl hover:bg-blue-50 transition-all">
                        Save Progress
                    </button>
                    <button
                        onClick={showCheck ? handleCheck : showNext ? handleNext : undefined}
                        disabled={!hasAnswer && phase !== 'flashcards'}
                        className={`min-w-[160px] px-8 py-3 rounded-2xl text-[13px] font-black shadow-lg transition-all flex items-center justify-center gap-2 ${hasAnswer || phase === 'flashcards'
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30'
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                            }`}
                    >
                        {submitting ? 'Đang nộp...' : showCheck ? 'Kiểm tra ✓' : (currentItemIndex === items.length - 1 ? 'Nộp bài' : 'Tiếp tục →')}
                    </button>
                </div>
            </footer>

            {toast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/90 backdrop-blur-md text-white text-[13px] font-bold rounded-2xl shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-4 z-[1001] flex items-center gap-2 border border-white/10">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                    {toast}
                </div>
            )}

            {floatingWord && (
                <>
                    {/* Click outside to close */}
                    <div
                        className="fixed inset-0 z-[999]"
                        onClick={() => setFloatingWord(null)}
                    />
                    <FloatingVocabCard
                        word={floatingWord.word}
                        position={{ x: floatingWord.x, y: floatingWord.y }}
                        onClose={() => setFloatingWord(null)}
                        isAdded={vocabWords.some(w => w.en.toLowerCase() === floatingWord.word.toLowerCase())}
                        onAdd={(data) => {
                            handleAddVocab({
                                en: floatingWord.word,
                                vn: data.vn,
                                type: data.type,
                                phonetic: data.phonetic,
                                example: data.example,
                                source: 'user',
                                note: '',
                                starred: false
                            });
                            setFloatingWord(null);
                        }}
                        context={currentPassage}
                        aiService={fetchWordInfoAI}
                    />
                </>
            )}
        </div>
    );
};

const ResultsView: React.FC<{ results: any, lesson: any, skillMeta: any, onBack: () => void }> = ({ results, lesson, skillMeta, onBack }) => {
    if (!results) return null;
    const accuracy = results.accuracy_percent ?? 0;
    const incorrect = results.total_questions - results.correct_count;

    return (
        <div className="max-w-4xl mx-auto w-full py-4 overflow-y-auto">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-amber-50 border-2 border-amber-200 mb-6 shadow-lg shadow-amber-200/20">
                    <Trophy className="w-12 h-12 text-amber-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">Hoàn thành bài học!</h1>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{lesson.lesson_title}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-[32px] border border-blue-100 p-8 flex flex-col items-center justify-center shadow-xl shadow-blue-900/5">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#F0F4FF" strokeWidth="12" />
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#2563EB" strokeWidth="12" strokeDasharray={440} strokeDashoffset={440 - (440 * accuracy) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-slate-800">{accuracy.toFixed(0)}%</span>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Accuracy</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatCard value={results.correct_count} label="Đúng" color="text-emerald-600" bg="bg-emerald-50" />
                    <StatCard value={incorrect} label="Sai" color="text-rose-600" bg="bg-rose-50" />
                    <StatCard value={`${results.avg_time_per_q?.toFixed(0) ?? '--'}s`} label="TB/câu" color="text-blue-600" bg="bg-blue-50" />
                    <StatCard value={results.total_questions} label="Tổng câu" color="text-blue-900" bg="bg-blue-50" />
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-blue-100 p-8 shadow-xl shadow-blue-900/5">
                <h2 className="text-lg font-black text-slate-800 mb-6">Chi tiết câu hỏi</h2>
                <div className="space-y-4">
                    {(results.detailed_results ?? []).map((r: any, i: number) => (
                        <div key={i} className={`p-4 rounded-xl border ${r.is_correct ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    CÂU {i + 1}
                                </span>
                                <span className={`text-[13px] font-semibold ${r.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    {r.is_correct ? 'Chính xác' : 'Chưa đúng'}
                                </span>
                            </div>
                            <p className="text-[14px] text-slate-700 font-medium mb-2">{r.question}</p>
                            <div className="text-[13px] space-y-1">
                                <p><span className="text-slate-400">Bạn chọn:</span> <span className={r.is_correct ? 'text-emerald-600' : 'text-rose-600'}>{r.student_answer || '(Trống)'}</span></p>
                                {!r.is_correct && <p><span className="text-slate-400">Đáp án đúng:</span> <span className="text-emerald-600 font-medium">{r.correct_answer}</span></p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-10 flex justify-center">
                <button onClick={onBack} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30">
                    Quay lại lộ trình
                </button>
            </div>


        </div>
    );
};

const StatCard: React.FC<{ value: any, label: string, color: string, bg: string }> = ({ value, label, color, bg }) => (
    <div className={`p-5 rounded-[24px] ${bg} border border-white/50 flex flex-col items-center justify-center shadow-lg shadow-blue-900/5`}>
        <span className={`text-2xl font-black ${color}`}>{value}</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</span>
    </div>
);

export default LessonPage;