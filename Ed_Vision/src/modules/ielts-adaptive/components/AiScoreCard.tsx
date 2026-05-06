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
}

interface Props {
    result: AiGradingResult;
}

function bandColor(score: number) {
    if (score >= 7) return 'bg-emerald-500';
    if (score >= 5.5) return 'bg-amber-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-rose-500';
}

function bandTextColor(score: number) {
    if (score >= 7) return 'text-emerald-700';
    if (score >= 5.5) return 'text-amber-700';
    if (score >= 4) return 'text-orange-700';
    return 'text-rose-700';
}

function bandBg(score: number) {
    if (score >= 7) return 'bg-emerald-50 border-emerald-200';
    if (score >= 5.5) return 'bg-amber-50 border-amber-200';
    if (score >= 4) return 'bg-orange-50 border-orange-200';
    return 'bg-rose-50 border-rose-200';
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
        <div className={`rounded-2xl border p-4 flex flex-col gap-4 ${bandBg(bandScore)}`}>
            {/* Header — band badge */}
            <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ${bandColor(bandScore)}`}>
                    {bandScore.toFixed(1)}
                </div>
                <div className="flex-1">
                    <p className={`text-base font-bold ${bandTextColor(bandScore)}`}>Band {bandScore.toFixed(1)}</p>
                    {estimatedCefrLevel && (
                        <p className="text-xs text-slate-500 mt-0.5">CEFR: {estimatedCefrLevel}</p>
                    )}
                    {overallFeedback && (
                        <p className="text-sm text-slate-700 mt-1 leading-relaxed">{overallFeedback}</p>
                    )}
                </div>
            </div>

            {/* Criteria bars */}
            {criteria.length > 0 && (
                <div className="flex flex-col gap-2">
                    {criteria.map((c) => (
                        <div key={c.name}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-600 truncate">{c.name}</span>
                                <span className={`text-xs font-bold ml-2 shrink-0 ${bandTextColor(c.score)}`}>{c.score.toFixed(1)}</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${bandColor(c.score)}`}
                                    style={{ width: `${(c.score / 9) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Expandable details */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors self-start"
            >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
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
                            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1.5">💡 Gợi ý cải thiện</p>
                            <ul className="flex flex-col gap-1">
                                {suggestions.map((s, i) => (
                                    <li key={i} className="text-xs text-slate-700 flex gap-2 leading-relaxed">
                                        <span className="text-indigo-400 shrink-0">{i + 1}.</span>{s}
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
