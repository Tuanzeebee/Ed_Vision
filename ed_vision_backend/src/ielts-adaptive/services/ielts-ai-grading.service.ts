import { Injectable, Logger } from '@nestjs/common';
import { GroqGradingService } from '../../common/groq/groq-grading.service';
import {
  buildSpeakingGradingPrompt,
  buildWritingGradingPrompt,
  buildHighFidelitySpeakingGradingPrompt,
  computeIeltsBand,
  computeIeltsBandFromCriteria,
  IeltsGradingResult,
  SpeakingGradingInput,
  HighFidelitySpeakingGradingInput,
  WritingGradingInput,
} from '../../common/gemini/ielts-grading-prompts';

const GRADING_OPTIONS = {
  temperature: 0.1,
  maxTokens: 8192,
  timeoutMs: 60_000,
};

@Injectable()
export class IeltsAiGradingService {
  private readonly logger = new Logger(IeltsAiGradingService.name);

  constructor(private readonly groq: GroqGradingService) {}

  async gradeSpeaking(input: SpeakingGradingInput): Promise<IeltsGradingResult> {
    const prompt = buildSpeakingGradingPrompt(input);
    try {
      const raw = await this.groq.generateJson<any>(prompt, GRADING_OPTIONS);
      return this.normalizeSpeakingResult(raw);
    } catch (err) {
      this.logger.warn(`Speaking grading failed: ${(err as Error).message}. Using fallback.`);
      return this.fallbackSpeakingResult(input.targetBand);
    }
  }

  async gradeSpeakingHighFidelity(input: HighFidelitySpeakingGradingInput): Promise<any> {
    const prompt = buildHighFidelitySpeakingGradingPrompt(input);
    try {
      return await this.groq.generateJson<any>(prompt, GRADING_OPTIONS);
    } catch (err) {
      this.logger.warn(`High-fidelity speaking grading failed: ${(err as Error).message}.`);
      throw err;
    }
  }

  async gradeWriting(input: WritingGradingInput): Promise<IeltsGradingResult> {
    const prompt = buildWritingGradingPrompt(input);
    try {
      const raw = await this.groq.generateJson<any>(prompt, GRADING_OPTIONS);
      return this.normalizeWritingResult(raw);
    } catch (err) {
      this.logger.warn(`Writing grading failed: ${(err as Error).message}. Using fallback.`);
      return this.fallbackWritingResult(input.targetBand);
    }
  }

  // ── Normalizers (giữ nguyên 100%) ─────────────────────────────────────────

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

    const sentenceFeedback = Array.isArray(raw?.sentenceFeedback)
      ? raw.sentenceFeedback
          .filter((s: any) => s?.original && s?.suggestion)
          .map((s: any) => ({
            original: String(s.original),
            issues: Array.isArray(s.issues) ? s.issues.map(String) : [],
            suggestion: String(s.suggestion),
            explanation: String(s.explanation ?? ''),
            severity: s.severity === 'major' ? 'major' : 'minor',
            criterionTag: ['lexical', 'grammar', 'task', 'coherence'].includes(s.criterionTag)
              ? s.criterionTag : 'grammar',
          }))
          .slice(0, 20)
      : undefined;

    const grammarAnalysis = raw?.grammarAnalysis ? {
      diversityLevel: String(raw.grammarAnalysis.diversityLevel ?? ''),
      diversityLabel: String(raw.grammarAnalysis.diversityLabel ?? ''),
      diversitySummary: String(raw.grammarAnalysis.diversitySummary ?? ''),
      diversityTips: this.toStringArray(raw.grammarAnalysis.diversityTips),
      accuracyLevel: String(raw.grammarAnalysis.accuracyLevel ?? ''),
      accuracyLabel: String(raw.grammarAnalysis.accuracyLabel ?? ''),
      accuracySummary: String(raw.grammarAnalysis.accuracySummary ?? ''),
      accuracyTips: this.toStringArray(raw.grammarAnalysis.accuracyTips),
      commonErrors: Array.isArray(raw.grammarAnalysis.commonErrors)
        ? raw.grammarAnalysis.commonErrors.slice(0, 5).map((e: any) => ({
            pattern: String(e.pattern ?? ''),
            example: String(e.example ?? ''),
            fix: String(e.fix ?? ''),
            rule: String(e.rule ?? ''),
          }))
        : [],
    } : undefined;

    const coherenceAnalysis = raw?.coherenceAnalysis ? {
      flowLevel: String(raw.coherenceAnalysis.flowLevel ?? ''),
      flowLabel: String(raw.coherenceAnalysis.flowLabel ?? ''),
      flowSummary: String(raw.coherenceAnalysis.flowSummary ?? ''),
      flowTips: this.toStringArray(raw.coherenceAnalysis.flowTips),
      paragraphLevel: String(raw.coherenceAnalysis.paragraphLevel ?? ''),
      paragraphLabel: String(raw.coherenceAnalysis.paragraphLabel ?? ''),
      paragraphSummary: String(raw.coherenceAnalysis.paragraphSummary ?? ''),
      paragraphTips: this.toStringArray(raw.coherenceAnalysis.paragraphTips),
      referencingLevel: String(raw.coherenceAnalysis.referencingLevel ?? ''),
      referencingLabel: String(raw.coherenceAnalysis.referencingLabel ?? ''),
      referencingSummary: String(raw.coherenceAnalysis.referencingSummary ?? ''),
      referencingTips: this.toStringArray(raw.coherenceAnalysis.referencingTips),
      linkingWordsUsed: this.toStringArray(raw.coherenceAnalysis.linkingWordsUsed),
      missingLinks: this.toStringArray(raw.coherenceAnalysis.missingLinks),
    } : undefined;

    const lexicalAnalysis = raw?.lexicalAnalysis ? {
      diversityLevel: String(raw.lexicalAnalysis.diversityLevel ?? ''),
      diversityLabel: String(raw.lexicalAnalysis.diversityLabel ?? ''),
      diversitySummary: String(raw.lexicalAnalysis.diversitySummary ?? ''),
      diversityTips: this.toStringArray(raw.lexicalAnalysis.diversityTips),
      overusedWords: this.toStringArray(raw.lexicalAnalysis.overusedWords),
      suggestedUpgrades: Array.isArray(raw.lexicalAnalysis.suggestedUpgrades)
        ? raw.lexicalAnalysis.suggestedUpgrades.slice(0, 8).map((u: any) => ({
            original: String(u.original ?? ''),
            upgrade: String(u.upgrade ?? ''),
            example: String(u.example ?? ''),
          }))
        : [],
    } : undefined;

    const taskAnalysis = raw?.taskAnalysis ? {
      responseLevel: String(raw.taskAnalysis.responseLevel ?? ''),
      responseLabel: String(raw.taskAnalysis.responseLabel ?? ''),
      responseSummary: String(raw.taskAnalysis.responseSummary ?? ''),
      responseTips: this.toStringArray(raw.taskAnalysis.responseTips),
      ideaDevelopmentLevel: String(raw.taskAnalysis.ideaDevelopmentLevel ?? ''),
      ideaDevelopmentLabel: String(raw.taskAnalysis.ideaDevelopmentLabel ?? ''),
      ideaDevelopmentSummary: String(raw.taskAnalysis.ideaDevelopmentSummary ?? ''),
      ideaDevelopmentTips: this.toStringArray(raw.taskAnalysis.ideaDevelopmentTips),
    } : undefined;

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
      sentenceFeedback,
      taskAnalysis,
      grammarAnalysis,
      coherenceAnalysis,
      lexicalAnalysis,
    };
  }

  // ── Fallbacks ──────────────────────────────────────────────────────────────

  private fallbackSpeakingResult(targetBand: number): IeltsGradingResult {
    const band = computeIeltsBand(targetBand * 0.75);
    return {
      skill: 'speaking',
      bandScore: band,
      criteria: this.defaultSpeakingCriteria(band),
      overallFeedback: 'AI grading is temporarily unavailable. Your response has been recorded.',
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
      overallFeedback: 'AI grading is temporarily unavailable. Your response has been recorded.',
      strengths: [],
      weaknesses: [],
      suggestions: ['Read model essays and practise writing task outlines.'],
      estimatedCefrLevel: 'B1',
      confidence: 'low',
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private defaultSpeakingCriteria(band = 0) {
    return [
      { name: 'Fluency and Coherence', score: band, feedback: '' },
      { name: 'Lexical Resource', score: band, feedback: '' },
      { name: 'Grammatical Range and Accuracy', score: band, feedback: '' },
      { name: 'Pronunciation', score: band, feedback: '' },
    ];
  }

  private defaultWritingCriteria(taskType: 'task1' | 'task2' | string = 'task2', band = 0) {
    const firstCriterion = taskType === 'task1' ? 'Task Achievement' : 'Task Response';
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
