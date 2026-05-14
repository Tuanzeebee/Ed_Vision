import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../common/gemini/gemini.service';
import {
  buildSpeakingGradingPrompt,
  buildWritingGradingPrompt,
  computeIeltsBand,
  computeIeltsBandFromCriteria,
  IeltsGradingResult,
  SpeakingGradingInput,
  WritingGradingInput,
} from '../../common/gemini/ielts-grading-prompts';

const GRADING_OPTIONS = {
  temperature: 0.1,
  maxOutputTokens: 2048,
  timeoutMs: 60_000,
};

@Injectable()
export class IeltsAiGradingService {
  private readonly logger = new Logger(IeltsAiGradingService.name);

  constructor(private readonly gemini: GeminiService) {}

  async gradeSpeaking(
    input: SpeakingGradingInput,
  ): Promise<IeltsGradingResult> {
    const prompt = buildSpeakingGradingPrompt(input);

    try {
      const raw = await this.gemini.generateJson<any>(prompt, GRADING_OPTIONS);
      return this.normalizeSpeakingResult(raw);
    } catch (err) {
      this.logger.warn(
        `Speaking grading failed: ${(err as Error).message}. Using fallback.`,
      );
      return this.fallbackSpeakingResult(input.targetBand);
    }
  }

  async gradeWriting(input: WritingGradingInput): Promise<IeltsGradingResult> {
    const prompt = buildWritingGradingPrompt(input);

    try {
      const raw = await this.gemini.generateJson<any>(prompt, GRADING_OPTIONS);
      return this.normalizeWritingResult(raw);
    } catch (err) {
      this.logger.warn(
        `Writing grading failed: ${(err as Error).message}. Using fallback.`,
      );
      return this.fallbackWritingResult(input.targetBand);
    }
  }

  // ── Normalizers ──────────────────────────────────────────────────────────

  private normalizeSpeakingResult(raw: any): IeltsGradingResult {
    const criteria = Array.isArray(raw?.criteria)
      ? raw.criteria.map((c: any) => ({
          name: String(c.name ?? 'Unknown'),
          score: computeIeltsBand(Number(c.score ?? 0)),
          feedback: String(c.feedback ?? ''),
        }))
      : this.defaultSpeakingCriteria();

    const bandScore =
      raw?.bandScore != null
        ? computeIeltsBand(Number(raw.bandScore))
        : computeIeltsBandFromCriteria(criteria);

    return {
      skill: 'speaking',
      bandScore,
      criteria,
      overallFeedback: String(raw?.overallFeedback ?? 'Grading complete.'),
      strengths: this.toStringArray(raw?.strengths),
      weaknesses: this.toStringArray(raw?.weaknesses),
      suggestions: this.toStringArray(raw?.suggestions),
      estimatedCefrLevel: String(raw?.estimatedCefrLevel ?? 'B1'),
      confidence: this.parseConfidence(raw?.confidence),
    };
  }

  private normalizeWritingResult(raw: any): IeltsGradingResult {
    const criteria = Array.isArray(raw?.criteria)
      ? raw.criteria.map((c: any) => ({
          name: String(c.name ?? 'Unknown'),
          score: computeIeltsBand(Number(c.score ?? 0)),
          feedback: String(c.feedback ?? ''),
        }))
      : this.defaultWritingCriteria(raw?.taskType);

    const bandScore =
      raw?.bandScore != null
        ? computeIeltsBand(Number(raw.bandScore))
        : computeIeltsBandFromCriteria(criteria);

    const correctedExamples = Array.isArray(raw?.correctedExamples)
      ? raw.correctedExamples
          .filter((e: any) => e?.original && e?.suggestion)
          .map((e: any) => ({
            original: String(e.original),
            suggestion: String(e.suggestion),
            explanation: String(e.explanation ?? ''),
          }))
          .slice(0, 5)
      : undefined;

    return {
      skill: 'writing',
      bandScore,
      criteria,
      overallFeedback: String(raw?.overallFeedback ?? 'Grading complete.'),
      strengths: this.toStringArray(raw?.strengths),
      weaknesses: this.toStringArray(raw?.weaknesses),
      suggestions: this.toStringArray(raw?.suggestions),
      correctedExamples,
      estimatedCefrLevel: String(raw?.estimatedCefrLevel ?? 'B1'),
      confidence: this.parseConfidence(raw?.confidence),
    };
  }

  // ── Fallbacks ─────────────────────────────────────────────────────────────

  private fallbackSpeakingResult(targetBand: number): IeltsGradingResult {
    const band = computeIeltsBand(targetBand * 0.75);
    return {
      skill: 'speaking',
      bandScore: band,
      criteria: this.defaultSpeakingCriteria(band),
      overallFeedback:
        'AI grading is temporarily unavailable. Your response has been recorded.',
      strengths: [],
      weaknesses: [],
      suggestions: ['Practice speaking for at least 10 minutes daily.'],
      estimatedCefrLevel: 'B1',
      confidence: 'low',
    };
  }

  private fallbackWritingResult(targetBand: number): IeltsGradingResult {
    const band = computeIeltsBand(targetBand * 0.75);
    return {
      skill: 'writing',
      bandScore: band,
      criteria: this.defaultWritingCriteria('task2', band),
      overallFeedback:
        'AI grading is temporarily unavailable. Your response has been recorded.',
      strengths: [],
      weaknesses: [],
      suggestions: ['Read model essays and practise writing task outlines.'],
      estimatedCefrLevel: 'B1',
      confidence: 'low',
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private defaultSpeakingCriteria(band = 0) {
    return [
      { name: 'Fluency and Coherence', score: band, feedback: '' },
      { name: 'Lexical Resource', score: band, feedback: '' },
      { name: 'Grammatical Range and Accuracy', score: band, feedback: '' },
      { name: 'Pronunciation', score: band, feedback: '' },
    ];
  }

  private defaultWritingCriteria(
    taskType: 'task1' | 'task2' | string = 'task2',
    band = 0,
  ) {
    const firstCriterion =
      taskType === 'task1' ? 'Task Achievement' : 'Task Response';
    return [
      { name: firstCriterion, score: band, feedback: '' },
      { name: 'Coherence and Cohesion', score: band, feedback: '' },
      { name: 'Lexical Resource', score: band, feedback: '' },
      { name: 'Grammatical Range and Accuracy', score: band, feedback: '' },
    ];
  }

  private toStringArray(val: any): string[] {
    if (!Array.isArray(val)) return [];
    return val.filter((s) => typeof s === 'string' && s.trim()).slice(0, 5);
  }

  private parseConfidence(val: any): 'low' | 'medium' | 'high' {
    if (val === 'low' || val === 'medium' || val === 'high') return val;
    return 'medium';
  }
}
