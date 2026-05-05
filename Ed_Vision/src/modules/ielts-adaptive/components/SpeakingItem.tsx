import React, { useRef, useState, useEffect } from 'react';
import type { LearningRepositoryItem } from '../../../types/ielts-adaptive.types';
import { API_BASE_URL } from '@/services/api/config';
import AiScoreCard from './AiScoreCard';
import type { AiGradingResult } from './AiScoreCard';

interface SpeakingItemProps {
    item: LearningRepositoryItem;
    lessonId: number;
    targetBand: number;
    selectedAnswer?: string;
    onAnswer: (answer: string) => void;
    showResult?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'submitting' | 'graded' | 'error';

const MAX_SECONDS = 60;

const SpeakingItem: React.FC<SpeakingItemProps> = ({
    item,
    lessonId,
    targetBand,
    selectedAnswer,
    onAnswer,
    showResult,
}) => {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const recordingStateRef = useRef<RecordingState>('idle');
    const [transcript, setTranscript] = useState('');
    const [gradingResult, setGradingResult] = useState<AiGradingResult | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const updateRecordingState = (state: RecordingState) => {
        recordingStateRef.current = state;
        setRecordingState(state);
    };

    // Restore graded state when in showResult mode
    useEffect(() => {
        if (showResult && selectedAnswer) {
            try {
                const parsed = JSON.parse(selectedAnswer);
                if (parsed?.bandScore != null) {
                    setGradingResult(parsed as AiGradingResult);
                    updateRecordingState('graded');
                    if (parsed.transcript) setTranscript(parsed.transcript);
                }
            } catch {
                // not a grading result
            }
        }
    }, [showResult, selectedAnswer]);

    const startRecording = async () => {
        setErrorMsg('');
        chunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.start(100);
            startTimeRef.current = Date.now();
            updateRecordingState('recording');
            setSecondsLeft(MAX_SECONDS);

            timerRef.current = window.setInterval(() => {
                setSecondsLeft((prev) => {
                    if (prev <= 1) {
                        stopAndSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch {
            setErrorMsg('Không thể truy cập microphone. Hãy cho phép quyền microphone.');
            updateRecordingState('error');
        }
    };

    const stopAndSubmit = () => {
        if (recordingStateRef.current !== 'recording') return;
        if (timerRef.current) clearInterval(timerRef.current);

        const recorder = mediaRecorderRef.current;
        if (!recorder) return;

        recorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

            recorder.stream.getTracks().forEach((t) => t.stop());
            updateRecordingState('submitting');

            try {
                const formData = new FormData();
                formData.append('audio', blob, 'speaking.webm');
                formData.append('item_prompt', item.stem);
                formData.append('target_band', String(targetBand));
                formData.append('part_type', (item.metadata as any)?.partType ?? 'part1');
                formData.append('lesson_id', String(lessonId || 0));
                formData.append('timeTakenSec', String(timeTaken));

                const res = await fetch(`${API_BASE_URL}/ielts-adaptive/grade/speaking/audio`, {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) throw new Error(`Chấm điểm lỗi: ${res.status}`);

                const data = await res.json();
                const transcriptText: string = data.transcript ?? '';
                const gradingData: AiGradingResult = {
                    bandScore: data.bandScore ?? data.band,
                    criteria: data.criteria ?? [],
                    overallFeedback: data.overallFeedback ?? data.feedback ?? '',
                    strengths: data.strengths,
                    weaknesses: data.weaknesses,
                    suggestions: data.suggestions,
                    correctedExamples: data.correctedExamples,
                    estimatedCefrLevel: data.estimatedCefrLevel,
                    confidence: data.confidence,
                    skill: 'speaking',
                };

                setTranscript(transcriptText);
                setGradingResult(gradingData);
                updateRecordingState('graded');
                onAnswer(JSON.stringify({ ...gradingData, transcript: transcriptText }));
            } catch (err: any) {
                setErrorMsg(err?.message ?? 'Lỗi khi nộp bài. Vui lòng thử lại.');
                updateRecordingState('error');
            }
        };

        recorder.stop();
    };

    const reset = () => {
        updateRecordingState('idle');
        setTranscript('');
        setGradingResult(null);
        setErrorMsg('');
        setSecondsLeft(MAX_SECONDS);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center p-8 bg-slate-50 rounded-2xl border-2 border-slate-100 shadow-sm transition-all">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Speaking Assessment</h3>
            <p className="text-slate-600 text-center mb-8 max-w-lg italic">"{item.stem}"</p>
            {item.hint && <p className="text-sm text-gray-500 mb-4 italic">{item.hint}</p>}

            {errorMsg && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex items-center gap-2">
                    <span>⚠️</span> {errorMsg}
                    <button onClick={reset} className="ml-2 underline font-medium">Thử lại</button>
                </div>
            )}

            {recordingState === 'idle' || recordingState === 'error' ? (
                <button
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200 transition-all active:scale-90 group relative"
                >
                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 group-hover:hidden"></div>
                    <span className="text-2xl">🎤</span>
                </button>
            ) : recordingState === 'recording' ? (
                <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                            <circle
                                cx="64" cy="64" r="58"
                                stroke="currentColor" strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 * (1 - secondsLeft / MAX_SECONDS)}
                                className="text-red-500 transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-black text-slate-800">{secondsLeft}s</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-red-500 font-bold tracking-widest uppercase text-xs">Recording</span>
                    </div>

                    <button
                        onClick={stopAndSubmit}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-full font-medium transition-all flex items-center gap-2"
                    >
                        <div className="w-3 h-3 bg-white rounded-sm"></div> Dừng và Nộp
                    </button>
                </div>
            ) : recordingState === 'submitting' ? (
                <div className="flex flex-col items-center py-4">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-indigo-600 font-bold animate-pulse">AI is scoring your speech...</p>
                    <p className="text-slate-400 text-sm mt-1">Generating band and feedback</p>
                </div>
            ) : recordingState === 'graded' ? (
                <div className="w-full flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl">✓</div>

                    {transcript && (
                        <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Bài nói của bạn</p>
                            <p className="text-gray-700 text-sm leading-relaxed">{transcript}</p>
                        </div>
                    )}

                    {gradingResult && (
                        <>
                            <AiScoreCard result={gradingResult} />
                            {!showResult && (
                                <button onClick={reset} className="text-sm text-blue-600 hover:underline">
                                    Ghi âm lại
                                </button>
                            )}
                        </>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default SpeakingItem;
