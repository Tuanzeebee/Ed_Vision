import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface AiCriterion {
    name: string;
    score: number;
    feedback: string;
}

export interface CorrectedExample {
    original: string;
    suggestion: string;
    explanation: string;
}

export interface AiGradingResult {
    bandScore: number;
    criteria: AiCriterion[];
    overallFeedback?: string;
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
    correctedExamples?: CorrectedExample[];
    estimatedCefrLevel?: string;
    confidence?: 'low' | 'medium' | 'high';
    skill?: 'speaking' | 'writing';
    sentenceFeedback?: any[];
    taskAnalysis?: any;
    grammarAnalysis?: any;
    coherenceAnalysis?: any;
    lexicalAnalysis?: any;
}

interface Props {
    result: AiGradingResult;
}

function bandColor(score: number) {
    if (score >= 7) return 'bg-blue-600';
    if (score >= 5.5) return 'bg-emerald-500';
    if (score >= 4) return 'bg-amber-500';
    return 'bg-rose-500';
}

function bandTextColor(score: number) {
    if (score >= 7) return 'text-blue-700';
    if (score >= 5.5) return 'text-emerald-700';
    if (score >= 4) return 'text-amber-700';
    return 'text-rose-700';
}

function bandBg(score: number) {
    if (score >= 7) return 'bg-blue-50 border-blue-100';
    if (score >= 5.5) return 'bg-emerald-50 border-emerald-100';
    if (score >= 4) return 'bg-amber-50 border-amber-100';
    return 'bg-rose-50 border-rose-100';
}

const AiScoreCard: React.FC<Props> = ({ result }) => {
    const [expanded, setExpanded] = useState(false);

    const {
        bandScore,
        criteria = [],
        overallFeedback,
        strengths = [],
        weaknesses = [],
        suggestions = [],
        correctedExamples = [],
        estimatedCefrLevel,
    } = result;

    return (
        <div className={`rounded-[32px] border-2 p-6 sm:p-8 flex flex-col gap-6 shadow-xl shadow-blue-900/5 ${bandBg(bandScore)}`}>
            {/* Header — band badge */}
            <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg ${bandColor(bandScore)}`}>
                    {bandScore.toFixed(1)}
                </div>
                <div className="flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 mb-1`}>AI Assessment Result</p>
                    <p className={`text-2xl font-black ${bandTextColor(bandScore)} tracking-tight`}>Band {bandScore.toFixed(1)}</p>
                    {estimatedCefrLevel && (
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">CEFR: {estimatedCefrLevel}</p>
                    )}
                </div>
            </div>

            {overallFeedback && (
                <div className="bg-white/50 rounded-[20px] p-5 border border-current/5">
                    <p className="text-[15px] text-slate-700 font-medium leading-relaxed">{overallFeedback}</p>
                </div>
            )}

            {/* Criteria bars */}
            {criteria.length > 0 && (
                <div className="flex flex-col gap-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Detailed Breakdown</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {criteria.map((c) => (
                            <div key={c.name}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest truncate">{c.name}</span>
                                    <span className={`text-[11px] font-black ml-2 shrink-0 ${bandTextColor(c.score)}`}>{c.score.toFixed(1)}</span>
                                </div>
                                <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-current/5 shadow-inner">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${bandColor(c.score)}`}
                                        style={{ width: `${(c.score / 9) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expandable details */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all self-center py-2 px-6 rounded-full bg-white/30 border border-current/5 active:scale-95 shadow-sm"
            >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expanded ? 'Ẩn chi tiết phân tích' : 'Xem chi tiết phân tích'}
            </button>

            {expanded && (
                <div className="flex flex-col gap-4">
                    {/* Criteria feedback */}
                    {criteria.some((c) => c.feedback) && (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phân tích tiêu chí</p>
                            {criteria.map((c) => c.feedback ? (
                                <div key={c.name} className="bg-white rounded-xl px-3 py-2 border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-700 mb-0.5">{c.name}</p>
                                    <p className="text-xs text-slate-600 leading-relaxed">{c.feedback}</p>
                                </div>
                            ) : null)}
                        </div>
                    )}

                    {/* Strengths */}
                    {strengths.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">✅ Điểm mạnh</p>
                            <ul className="flex flex-col gap-1">
                                {strengths.map((s, i) => (
                                    <li key={i} className="text-xs text-slate-700 flex gap-2 leading-relaxed">
                                        <span className="text-emerald-500 shrink-0">•</span>{s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Weaknesses */}
                    {weaknesses.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1.5">⚠️ Điểm cần cải thiện</p>
                            <ul className="flex flex-col gap-1">
                                {weaknesses.map((w, i) => (
                                    <li key={i} className="text-xs text-slate-700 flex gap-2 leading-relaxed">
                                        <span className="text-rose-400 shrink-0">•</span>{w}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] mb-3 px-1">💡 Gợi ý cải thiện</p>
                            <ul className="flex flex-col gap-2">
                                {suggestions.map((s, i) => (
                                    <li key={i} className="text-[13px] text-slate-700 bg-white/40 p-4 rounded-[16px] flex gap-3 border border-blue-100/30">
                                        <span className="text-blue-500 font-black shrink-0">{i + 1}.</span>
                                        <span className="font-medium leading-relaxed">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Corrected examples (writing only) */}
                    {correctedExamples.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">✏️ Ví dụ sửa lỗi</p>
                            <div className="flex flex-col gap-2">
                                {correctedExamples.map((ex, i) => (
                                    <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 text-xs">
                                        <p className="text-rose-600 line-through mb-1">{ex.original}</p>
                                        <p className="text-emerald-700 font-medium mb-1">→ {ex.suggestion}</p>
                                        {ex.explanation && (
                                            <p className="text-slate-500 italic">{ex.explanation}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AiScoreCard;
