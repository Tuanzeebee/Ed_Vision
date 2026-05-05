import React, { useState } from 'react';
import { CheckCircle2, XCircle, FlipHorizontal, Eye, ChevronRight } from 'lucide-react';
import type { LearningRepositoryItem } from '../../../types/ielts-adaptive.types';
import SpeakingItem from './SpeakingItem';
import WritingItem from './WritingItem';
import AudioPlayer from './AudioPlayer';

const WRITING_TYPES = new Set(['writing', 'writing_task', 'sentence_rewrite', 'planning_task', 'essay_task']);
const SPEAKING_TYPES = new Set(['speaking', 'speaking_prompt', 'speaking_task']);

interface QuestionRendererProps {
    item: LearningRepositoryItem;
    selectedAnswer?: string;
    onAnswer: (answer: string) => void;
    showResult?: boolean;
    readingPassage?: string | null;
    audioScript?: string | null;
    lessonId?: number;
    targetBand?: number;
    /** Skill area of the lesson/test — used to force correct UI regardless of item_type */
    skillArea?: string | null;
}

// ── Flashcard ─────────────────────────────────────────────────────────────────

const FlashcardItem: React.FC<{ item: LearningRepositoryItem; onNext: () => void }> = ({ item }) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="min-h-40 flex flex-col rounded-2xl border-2 border-indigo-200 overflow-hidden">
                <div className="bg-indigo-500 px-6 py-5 flex items-center justify-center text-center">
                    <p className="text-lg font-bold text-white">{item.stem}</p>
                </div>
                <div className="bg-indigo-50 px-6 py-5 flex items-center justify-center text-center flex-1">
                    <p className="text-base text-indigo-800 leading-relaxed">{item.hint ?? item.explanation ?? '(Không có nội dung)'}</p>
                </div>
            </div>
        </div>
    );
};
FlashcardItem.displayName = 'FlashcardItem';

// ── Single choice (MCQ) ───────────────────────────────────────────────────────

const SingleChoiceItem: React.FC<{
    item: LearningRepositoryItem;
    selected?: string;
    onAnswer: (a: string) => void;
    showResult?: boolean;
}> = ({ item, selected, onAnswer, showResult }) => {
    const options = item.options ?? [];
    return (
        <div className="flex flex-col gap-2.5">
            {options.map((opt) => {
                const isSelected = selected === opt.option_key;
                const isCorrect = opt.is_correct;
                let cls = 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700';
                if (isSelected && !showResult) cls = 'border-indigo-500 bg-indigo-50 text-indigo-800';
                if (showResult && isCorrect) cls = 'border-emerald-500 bg-emerald-50 text-emerald-800';
                if (showResult && isSelected && !isCorrect) cls = 'border-rose-400 bg-rose-50 text-rose-700';

                return (
                    <button
                        key={opt.id ?? opt.option_key}
                        onClick={() => !showResult && onAnswer(opt.option_key)}
                        disabled={showResult}
                        className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-sm transition-all flex items-center gap-3 ${cls}`}
                    >
                        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isSelected && !showResult ? 'bg-indigo-500 text-white' :
                            showResult && isCorrect ? 'bg-emerald-500 text-white' :
                                showResult && isSelected && !isCorrect ? 'bg-rose-400 text-white' :
                                    'bg-white border border-slate-300 text-slate-500'
                            }`}>
                            {showResult && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                                showResult && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> :
                                    opt.option_key}
                        </span>
                        <span>{opt.option_text}</span>
                    </button>
                );
            })}
        </div>
    );
};
SingleChoiceItem.displayName = 'SingleChoiceItem';

// ── True / False / Not Given ───────────────────────────────────────────────────
// DB stores option_key as 'True'/'False'/'NG' — keys here must match exactly.

const TrueFalseNGItem: React.FC<{
    item: LearningRepositoryItem;
    selected?: string;
    onAnswer: (a: string) => void;
    showResult?: boolean;
}> = ({ item, selected, onAnswer, showResult }) => {
    const correctOpt = item.options?.find((o) => o.is_correct);
    const correctKey = correctOpt?.option_key ?? '';

    // Build choices from actual options if present, else use defaults
    const choices = item.options && item.options.length > 0
        ? item.options.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((o) => ({ key: o.option_key, label: o.option_text }))
        : [
            { key: 'True', label: 'True' },
            { key: 'False', label: 'False' },
            { key: 'NG', label: 'Not Given' },
        ];

    return (
        <div className="flex flex-col gap-2.5">
            {choices.map(({ key, label }) => {
                const isSelected = selected === key;
                const isCorrect = key === correctKey;
                let cls = 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700';
                if (isSelected && !showResult) cls = 'border-indigo-500 bg-indigo-50 text-indigo-800';
                if (showResult && isCorrect) cls = 'border-emerald-500 bg-emerald-50 text-emerald-800';
                if (showResult && isSelected && !isCorrect) cls = 'border-rose-400 bg-rose-50 text-rose-700';

                return (
                    <button
                        key={key}
                        onClick={() => !showResult && onAnswer(key)}
                        disabled={showResult}
                        className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all flex items-center gap-3 ${cls}`}
                    >
                        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isSelected && !showResult ? 'bg-indigo-500 text-white' :
                            showResult && isCorrect ? 'bg-emerald-500 text-white' :
                                showResult && isSelected && !isCorrect ? 'bg-rose-400 text-white' :
                                    'bg-white border border-slate-300 text-slate-500'
                            }`}>
                            {showResult && isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                showResult && isSelected && !isCorrect ? <XCircle className="w-3.5 h-3.5" /> :
                                    key === 'True' ? '✓' : key === 'False' ? '✗' : '?'}
                        </span>
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
};
TrueFalseNGItem.displayName = 'TrueFalseNGItem';

// ── Gap fill / Short answer ────────────────────────────────────────────────────

const GapFillItem: React.FC<{
    item: LearningRepositoryItem;
    value?: string;
    onChange: (v: string) => void;
    showResult?: boolean;
}> = ({ item, value = '', onChange, showResult }) => {
    // Correct answer: prefer options[0].option_key / option_text, fallback to metadata
    const correctOpt = item.options?.find((o) => o.is_correct) ?? item.options?.[0];
    const correctAnswer = correctOpt?.option_text ?? correctOpt?.option_key ?? (item.metadata as any)?.correctAnswer ?? '';
    const isCorrect = showResult && value.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    return (
        <div className="flex flex-col gap-3">
            <input
                type="text"
                value={value}
                onChange={(e) => !showResult && onChange(e.target.value)}
                disabled={showResult}
                placeholder="Nhập câu trả lời…"
                className={`w-full px-4 py-3 rounded-2xl border-2 text-sm outline-none transition-colors bg-white text-slate-800 placeholder:text-slate-400 ${showResult
                    ? isCorrect
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                        : 'border-rose-400 bg-rose-50 text-rose-700'
                    : 'border-slate-300 focus:border-indigo-400'
                    }`}
            />
            {showResult && !isCorrect && correctAnswer && (
                <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    ✓ Đáp án đúng: <strong>{correctAnswer}</strong>
                </p>
            )}
        </div>
    );
};
GapFillItem.displayName = 'GapFillItem';

// ── Matching ──────────────────────────────────────────────────────────────────
// option_key = left term (e.g. "Skimming"), option_text = right meaning, all is_correct = true
// Answer stored as JSON: { "Skimming": "finding the general idea", ... }

const MatchingItem: React.FC<{
    item: LearningRepositoryItem;
    selected?: string;
    onAnswer: (a: string) => void;
    showResult?: boolean;
}> = ({ item, selected, onAnswer, showResult }) => {
    const [activeLeft, setActiveLeft] = useState<string | null>(null);

    // Parse current answers: { [leftTerm]: rightTerm }
    let currentAnswers: Record<string, string> = {};
    try { if (selected) currentAnswers = JSON.parse(selected); } catch { }

    const pairs = (item.options ?? []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    // Shuffle right options once (stable via sort by text so it's deterministic per item)
    const rightOptions = [...pairs].sort((a, b) => a.option_text.localeCompare(b.option_text));

    // Fallback: no pairs seeded yet
    if (pairs.length === 0) {
        return (
            <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-400 italic">Câu hỏi ghép nối — nhập đáp án của bạn:</p>
                <input
                    type="text"
                    value={selected ?? ''}
                    onChange={(e) => !showResult && onAnswer(e.target.value)}
                    disabled={showResult}
                    placeholder="Nhập đáp án…"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-indigo-400 text-sm outline-none bg-white text-slate-800 placeholder:text-slate-400"
                />
            </div>
        );
    }

    const handleLeftClick = (left: string) => {
        if (showResult) return;
        setActiveLeft((prev) => (prev === left ? null : left));
    };

    const handleRightClick = (right: string) => {
        if (showResult || !activeLeft) return;
        const updated = { ...currentAnswers, [activeLeft]: right };
        onAnswer(JSON.stringify(updated));
        setActiveLeft(null);
    };

    // Which right values are already used (to show as taken)
    const usedRights = new Set(Object.values(currentAnswers));

    return (
        <div className="flex flex-col gap-3">
            {/* Instruction */}
            <p className="text-xs text-slate-400 italic">
                {showResult
                    ? 'Kết quả ghép nối:'
                    : activeLeft
                        ? `Chọn nghĩa cho: "${activeLeft}"`
                        : 'Bấm vào thuật ngữ bên trái, sau đó chọn nghĩa bên phải.'}
            </p>

            <div className="grid grid-cols-[1fr_1fr] gap-3">
                {/* Left column — terms */}
                <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">Thuật ngữ</p>
                    {pairs.map((pair) => {
                        const left = pair.option_key;
                        const matchedRight = currentAnswers[left];
                        const isActive = activeLeft === left;
                        const isCorrectPair = showResult && matchedRight === pair.option_text;
                        const isWrongPair = showResult && !!matchedRight && matchedRight !== pair.option_text;
                        const isEmptyOnResult = showResult && !matchedRight;

                        let cls = 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50';
                        if (isActive) cls = 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-200';
                        else if (matchedRight && !showResult) cls = 'border-indigo-300 bg-indigo-50 text-indigo-700';
                        if (isCorrectPair) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                        if (isWrongPair) cls = 'border-rose-400 bg-rose-50 text-rose-700';
                        if (isEmptyOnResult) cls = 'border-amber-300 bg-amber-50 text-amber-700';

                        return (
                            <button
                                key={left}
                                onClick={() => handleLeftClick(left)}
                                disabled={showResult}
                                className={`w-full text-left px-3 py-2.5 rounded-2xl border-2 text-sm font-semibold transition-all flex items-center justify-between gap-1 ${cls}`}
                            >
                                <span className="truncate">{left}</span>
                                {isCorrectPair && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                {isWrongPair && <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                {/* Right column — meanings */}
                <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">Nghĩa</p>
                    {rightOptions.map((pair) => {
                        const right = pair.option_text;
                        const isTaken = usedRights.has(right) && !showResult;
                        // Find which left this right is assigned to (for result highlighting)
                        const assignedLeft = Object.entries(currentAnswers).find(([, v]) => v === right)?.[0];
                        const correctLeft = pairs.find((p) => p.option_text === right)?.option_key;
                        const isCorrectResult = showResult && assignedLeft === correctLeft;
                        const isWrongResult = showResult && assignedLeft && assignedLeft !== correctLeft;

                        let cls = 'border-slate-200 bg-white text-slate-600';
                        if (!showResult && activeLeft) cls = 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer';
                        if (isTaken) cls = 'border-indigo-200 bg-indigo-50 text-indigo-500 opacity-70';
                        if (isCorrectResult) cls = 'border-emerald-400 bg-emerald-50 text-emerald-700';
                        if (isWrongResult) cls = 'border-rose-400 bg-rose-50 text-rose-600';

                        return (
                            <button
                                key={right}
                                onClick={() => handleRightClick(right)}
                                disabled={showResult || !activeLeft}
                                className={`w-full text-left px-3 py-2.5 rounded-2xl border-2 text-sm transition-all ${cls}`}
                            >
                                <span className="line-clamp-2">{right}</span>
                                {showResult && isWrongResult && correctLeft && (
                                    <span className="block text-[10px] text-emerald-600 mt-0.5">→ đúng cho: {correctLeft}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Connected pairs summary (while answering) */}
            {!showResult && Object.keys(currentAnswers).length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                    {Object.entries(currentAnswers).map(([l, r]) => (
                        <div key={l} className="flex items-center gap-2 text-xs text-slate-500 px-1">
                            <span className="font-semibold text-indigo-600">{l}</span>
                            <ChevronRight className="w-3 h-3 shrink-0" />
                            <span>{r}</span>
                            <button
                                onClick={() => {
                                    const updated = { ...currentAnswers };
                                    delete updated[l];
                                    onAnswer(JSON.stringify(updated));
                                }}
                                className="ml-auto text-slate-300 hover:text-rose-400 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
MatchingItem.displayName = 'MatchingItem';

// ── Reading passage display ───────────────────────────────────────────────────

const ReadingPassage: React.FC<{ passage: string }> = ({ passage }) => {
    const [expanded, setExpanded] = useState(true);
    return (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden mb-4">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-blue-700"
                onClick={() => setExpanded(!expanded)}
            >
                <span>📖 Đoạn văn</span>
                <Eye className="w-4 h-4" />
            </button>
            {expanded && (
                <div className="px-4 pb-4 text-sm text-slate-700 leading-relaxed border-t border-blue-100 pt-3 whitespace-pre-line">
                    {passage}
                </div>
            )}
        </div>
    );
};
ReadingPassage.displayName = 'ReadingPassage';

// ── Audio script display ──────────────────────────────────────────────────────

const AudioScript: React.FC<{ script: string }> = ({ script }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl overflow-hidden mb-4">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-purple-700"
                onClick={() => setExpanded(!expanded)}
            >
                <span>🎧 Audio script (kịch bản)</span>
                <Eye className="w-4 h-4" />
            </button>
            {expanded && (
                <div className="px-4 pb-4 text-sm text-slate-700 leading-relaxed border-t border-purple-100 pt-3 whitespace-pre-line">
                    {script}
                </div>
            )}
        </div>
    );
};
AudioScript.displayName = 'AudioScript';

// ── Main QuestionRenderer ────────────────────────────────────────────────────

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
    item,
    selectedAnswer,
    onAnswer,
    showResult = false,
    readingPassage,
    audioScript,
    lessonId,
    targetBand,
    skillArea,
}) => {
    const rawType = item.item_type ?? 'single_choice';
    const skill = skillArea?.toLowerCase() ?? '';

    // Derive effective type: skill_area overrides item_type for writing/speaking,
    // so a lesson tagged 'writing' will always render WritingItem even if item_type is generic.
    const typeFromSkill =
        skill === 'writing' ? 'writing'
            : skill === 'speaking' ? 'speaking'
                : null;
    const type = typeFromSkill ?? (WRITING_TYPES.has(rawType) ? 'writing' : SPEAKING_TYPES.has(rawType) ? 'speaking' : rawType);

    const itemReadingPassage = item.reading_passage ?? readingPassage;
    const audioUrl = item.media_audio_url;

    // Show audio player for listening skill OR when audio content is present (except speaking)
    const isListening = skill === 'listening' || !!audioUrl || !!audioScript;

    return (
        <div className="flex flex-col gap-3">
            {/* Reading passage */}
            {itemReadingPassage && <ReadingPassage passage={itemReadingPassage} />}

            {/* Audio player — always shown for listening lessons; also shown when audioUrl/audioScript present */}
            {isListening && type !== 'speaking' && (
                <AudioPlayer url={audioUrl} autoPlay />
            )}

            {/* Audio script transcript — collapsible panel shown when available */}
            {audioScript && <AudioScript script={audioScript} />}

            {/* Question stem (not shown for speaking/writing — they render their own prompt) */}
            {type !== 'speaking' && type !== 'writing' && (
                <p className="text-slate-800 font-medium text-base leading-relaxed">{item.stem}</p>
            )}

            {/* Hint */}
            {item.hint && !showResult && type !== 'speaking' && type !== 'writing' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                    💡 {item.hint}
                </div>
            )}

            {/* Answer input */}
            {type === 'speaking' ? (
                <SpeakingItem item={item} lessonId={lessonId ?? 0} targetBand={targetBand ?? 5.0}
                    selectedAnswer={selectedAnswer} onAnswer={onAnswer} showResult={showResult} />
            ) : type === 'writing' ? (
                <WritingItem item={item} lessonId={lessonId ?? 0} targetBand={targetBand ?? 5.0}
                    selectedAnswer={selectedAnswer} onAnswer={onAnswer} showResult={showResult} />
            ) : type === 'flashcard' ? (
                <FlashcardItem item={item} onNext={() => { }} />
            ) : type === 'true_false_ng' ? (
                <TrueFalseNGItem item={item} selected={selectedAnswer} onAnswer={onAnswer} showResult={showResult} />
            ) : type === 'gap_fill' || type === 'short_answer' || type === 'sentence_completion' ? (
                <GapFillItem item={item} value={selectedAnswer ?? ''} onChange={onAnswer} showResult={showResult} />
            ) : type === 'matching' ? (
                <MatchingItem item={item} selected={selectedAnswer} onAnswer={onAnswer} showResult={showResult} />
            ) : (
                <SingleChoiceItem item={item} selected={selectedAnswer} onAnswer={onAnswer} showResult={showResult} />
            )}

            {/* Explanation after result (not for AI-graded types) */}
            {showResult && item.explanation && type !== 'speaking' && type !== 'writing' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 leading-relaxed">
                    📝 {item.explanation}
                </div>
            )}
        </div>
    );
};

export { FlashcardItem };
export default QuestionRenderer;
