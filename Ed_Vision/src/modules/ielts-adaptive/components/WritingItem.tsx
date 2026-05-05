import React, { useState, useEffect, useRef } from 'react';
import type { LearningRepositoryItem } from '../../../types/ielts-adaptive.types';
import { API_BASE_URL } from '@/services/api/config';
import AiScoreCard from './AiScoreCard';
import type { AiGradingResult } from './AiScoreCard';

interface WritingItemProps {
    item: LearningRepositoryItem;
    lessonId: number;
    targetBand: number;
    selectedAnswer?: string;
    onAnswer: (answer: string) => void;
    showResult?: boolean;
}

type WritingState = 'writing' | 'submitting' | 'graded' | 'error';

const WritingItem: React.FC<WritingItemProps> = ({
    item,
    lessonId,
    targetBand,
    selectedAnswer,
    onAnswer,
    showResult,
}) => {
    const [essay, setEssay] = useState('');
    const [writingState, setWritingState] = useState<WritingState>('writing');
    const [gradingResult, setGradingResult] = useState<AiGradingResult | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;

    // If already graded (showResult mode), parse existing answer
    useEffect(() => {
        if (showResult && selectedAnswer) {
            try {
                const parsed = JSON.parse(selectedAnswer);
                if (parsed?.bandScore != null) {
                    setGradingResult(parsed as AiGradingResult);
                    setWritingState('graded');
                    if (parsed._essay) setEssay(parsed._essay);
                }
            } catch {
                // not a grading result
            }
        }
    }, [showResult, selectedAnswer]);

    // Start timer on mount if not in showResult mode
    useEffect(() => {
        if (!showResult) {
            timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [showResult]);

    const handleSubmit = async () => {
        if (essay.trim().length < 10) {
            setErrorMsg('Bài viết quá ngắn. Vui lòng viết ít nhất vài câu.');
            return;
        }
        if (timerRef.current) clearInterval(timerRef.current);
        setWritingState('submitting');
        setErrorMsg('');
        try {
            const taskType: 'task1' | 'task2' =
                (item.metadata as any)?.taskType === 'task1' ? 'task1' : 'task2';

            const res = await fetch(`${API_BASE_URL}/ielts-adaptive/grade/writing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    essay,
                    task_prompt: item.stem,
                    task_type: taskType,
                    target_band: targetBand,
                    word_count: wordCount,
                    lesson_id: lessonId || undefined,
                }),
            });
            if (!res.ok) throw new Error(`Chấm điểm lỗi: ${res.status}`);
            const result: AiGradingResult = await res.json();
            setGradingResult(result);
            setWritingState('graded');
            onAnswer(JSON.stringify({ ...result, _essay: essay }));
        } catch (err: any) {
            setErrorMsg(err?.message ?? 'Có lỗi xảy ra. Vui lòng thử lại.');
            setWritingState('error');
        }
    };

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const minWords = (item.metadata as any)?.minWords ?? 150;

    return (
        <div className="space-y-4">
            {/* Task prompt */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800 mb-1">Writing Task</p>
                <p className="text-gray-800 whitespace-pre-wrap">{item.stem}</p>
                {item.hint && <p className="text-sm text-gray-500 mt-2 italic">{item.hint}</p>}
            </div>

            {/* Writing area */}
            {writingState !== 'graded' && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>
                            <span className={wordCount < minWords ? 'text-orange-500 font-medium' : 'text-green-600 font-medium'}>
                                {wordCount} từ
                            </span>
                            {wordCount < minWords && ` / tối thiểu ${minWords} từ`}
                        </span>
                        <span>⏱ {formatTime(elapsedSeconds)}</span>
                    </div>
                    <textarea
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                        placeholder="Viết bài của bạn tại đây..."
                        rows={14}
                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                        disabled={writingState === 'submitting'}
                    />
                    {errorMsg && (
                        <p className="text-sm text-red-600">{errorMsg}</p>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={writingState === 'submitting' || essay.trim().length < 10}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        {writingState === 'submitting' ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang chấm điểm...
                            </>
                        ) : (
                            'Nộp bài & Chấm điểm AI'
                        )}
                    </button>
                </div>
            )}

            {/* Essay preview when graded */}
            {writingState === 'graded' && essay && (
                <details className="bg-gray-50 border border-gray-200 rounded-lg">
                    <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-600">
                        Bài viết của bạn ({wordCount} từ)
                    </summary>
                    <p className="px-4 pb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{essay}</p>
                </details>
            )}

            {/* Grading result */}
            {gradingResult && (
                <div>
                    <AiScoreCard result={gradingResult} />
                    {!showResult && (
                        <button
                            onClick={() => {
                                setWritingState('writing');
                                setGradingResult(null);
                                setElapsedSeconds(0);
                                timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
                            }}
                            className="mt-3 text-sm text-blue-600 hover:underline"
                        >
                            Viết lại
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default WritingItem;
