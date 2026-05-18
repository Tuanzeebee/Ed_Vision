import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../../common/gemini/gemini.service';
import { GroqGradingService, GroqGenerateOptions } from '../../common/groq/groq-grading.service';
import { OpenRouterService } from '../../common/services/openrouter.service';
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
import fetch from 'node-fetch';

// ─── Fallback chain config ───────────────────────────────────────────────────
// Priority: Gemini → Groq → OpenRouter → Qwen remote → Ollama local
// ─────────────────────────────────────────────────────────────────────────────

const GRADING_OPTIONS = {
  temperature: 0.1,
  maxTokens: 8192,
  timeoutMs: 60_000,
};

const SYSTEM_MESSAGE =
  'You are an expert IELTS examiner. Always respond with valid JSON only, no markdown, no extra text.';

@Injectable()
export class IeltsAiGradingService {
  private readonly logger = new Logger(IeltsAiGradingService.name);

  // Qwen remote (OpenAI-compatible endpoint)
  private readonly qwenBaseUrl = (process.env.QWEN_BASE_URL ?? '').replace(/\/+$/, '');
  private readonly qwenModel = process.env.QWEN_MODEL || 'qwen2.5:14b';

  // Ollama local
  private readonly ollamaBaseUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/+$/, '');
  private readonly ollamaModel = process.env.OLLAMA_MODEL ?? 'qwen3';

  // ── Circuit breaker: skip providers that recently failed ────────────────
  // Key = provider name, Value = timestamp when cooldown expires
  private readonly cooldownUntil = new Map<string, number>();
  private static readonly COOLDOWN_429_MS = 5 * 60 * 1000;   // 5 min for rate limit
  private static readonly COOLDOWN_ERROR_MS = 2 * 60 * 1000;  // 2 min for other errors

  constructor(
    private readonly gemini: GeminiService,
    private readonly groq: GroqGradingService,
    private readonly openRouter: OpenRouterService,
  ) {}

  /** Check if provider is in cooldown (skip it) */
  private isOnCooldown(provider: string): boolean {
    const until = this.cooldownUntil.get(provider);
    if (!until) return false;
    if (Date.now() >= until) {
      this.cooldownUntil.delete(provider);
      return false;
    }
    return true;
  }

  /** Mark provider as failed — apply cooldown */
  private markFailed(provider: string, errorMsg: string): void {
    const is429 = errorMsg.includes('429') || errorMsg.includes('rate_limit') || errorMsg.includes('quota');
    const cooldownMs = is429
      ? IeltsAiGradingService.COOLDOWN_429_MS
      : IeltsAiGradingService.COOLDOWN_ERROR_MS;
    const until = Date.now() + cooldownMs;
    this.cooldownUntil.set(provider, until);
    const secs = Math.round(cooldownMs / 1000);
    this.logger.warn(`[Grading] 🔒 ${provider} on cooldown for ${secs}s`);
  }

  /** Clear cooldown on success */
  private markSuccess(provider: string): void {
    this.cooldownUntil.delete(provider);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Public grading methods
  // ═══════════════════════════════════════════════════════════════════════════

  async gradeSpeaking(input: SpeakingGradingInput): Promise<IeltsGradingResult> {
    const prompt = buildSpeakingGradingPrompt(input);
    try {
      const raw = await this.generateJsonWithFallback<any>(prompt);
      return this.normalizeSpeakingResult(raw);
    } catch (err) {
      this.logger.warn(`Speaking grading failed (all providers): ${(err as Error).message}. Using static fallback.`);
      return this.fallbackSpeakingResult(input.targetBand);
    }
  }

  async gradeSpeakingHighFidelity(input: HighFidelitySpeakingGradingInput): Promise<any> {
    const prompt = buildHighFidelitySpeakingGradingPrompt(input);
    try {
      return await this.generateJsonWithFallback<any>(prompt);
    } catch (err) {
      this.logger.warn(`High-fidelity speaking grading failed (all providers): ${(err as Error).message}.`);
      throw err;
    }
  }

  async gradeWriting(input: WritingGradingInput): Promise<IeltsGradingResult> {
    const prompt = buildWritingGradingPrompt(input);
    try {
      const raw = await this.generateJsonWithFallback<any>(prompt);
      return this.normalizeWritingResult(raw);
    } catch (err) {
      this.logger.warn(`Writing grading failed (all providers): ${(err as Error).message}. Using static fallback.`);
      return this.fallbackWritingResult(input.targetBand);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Fallback chain: Gemini → Groq → OpenRouter → Qwen remote → Ollama local
  // With circuit breaker — skip providers on cooldown
  // ═══════════════════════════════════════════════════════════════════════════

  private async generateJsonWithFallback<T>(prompt: string): Promise<T> {
    const errors: string[] = [];

    // ── 1. Gemini (primary) ────────────────────────────────────────────────
    if (this.isOnCooldown('Gemini')) {
      errors.push('Gemini: skipped (on cooldown)');
      this.logger.debug('[Grading] ⏭ Gemini skipped (on cooldown)');
    } else {
      try {
        this.logger.debug('[Grading] Trying Gemini...');
        const result = await this.gemini.generateJson<T>(prompt, {
          temperature: GRADING_OPTIONS.temperature,
          maxOutputTokens: GRADING_OPTIONS.maxTokens,
          timeoutMs: GRADING_OPTIONS.timeoutMs,
        });
        this.logger.log('[Grading] ✅ Gemini succeeded');
        this.markSuccess('Gemini');
        return result;
      } catch (err) {
        const msg = (err as Error).message;
        errors.push(`Gemini: ${msg}`);
        this.logger.warn(`[Grading] ❌ Gemini failed: ${msg}`);
        this.markFailed('Gemini', msg);
      }
    }

    // ── 2. Groq (1st fallback) ────────────────────────────────────────────
    if (this.isOnCooldown('Groq')) {
      errors.push('Groq: skipped (on cooldown)');
      this.logger.debug('[Grading] ⏭ Groq skipped (on cooldown)');
    } else {
      try {
        this.logger.debug('[Grading] Trying Groq...');
        const result = await this.groq.generateJson<T>(prompt, GRADING_OPTIONS);
        this.logger.log('[Grading] ✅ Groq succeeded');
        this.markSuccess('Groq');
        return result;
      } catch (err) {
        const msg = (err as Error).message;
        errors.push(`Groq: ${msg}`);
        this.logger.warn(`[Grading] ❌ Groq failed: ${msg}`);
        this.markFailed('Groq', msg);
      }
    }

    // ── 3. OpenRouter (2nd fallback) ──────────────────────────────────────
    if (this.isOnCooldown('OpenRouter')) {
      errors.push('OpenRouter: skipped (on cooldown)');
      this.logger.debug('[Grading] ⏭ OpenRouter skipped (on cooldown)');
    } else if (!this.openRouter.isAvailable()) {
      errors.push('OpenRouter: not configured (no API key)');
      this.logger.debug('[Grading] ⏭ OpenRouter skipped (no API key)');
    } else {
      try {
        this.logger.debug('[Grading] Trying OpenRouter...');
        const result = await this.openRouter.generateJson<T>(prompt, {
          temperature: GRADING_OPTIONS.temperature,
          max_tokens: GRADING_OPTIONS.maxTokens,
        });
        this.logger.log('[Grading] ✅ OpenRouter succeeded');
        this.markSuccess('OpenRouter');
        return result;
      } catch (err) {
        const msg = (err as Error).message;
        errors.push(`OpenRouter: ${msg}`);
        this.logger.warn(`[Grading] ❌ OpenRouter failed: ${msg}`);
        this.markFailed('OpenRouter', msg);
      }
    }

    // ── 4. Qwen remote (3rd fallback) ─────────────────────────────────────
    if (this.isOnCooldown('Qwen')) {
      errors.push('Qwen: skipped (on cooldown)');
      this.logger.debug('[Grading] ⏭ Qwen skipped (on cooldown)');
    } else if (!this.qwenBaseUrl) {
      errors.push('Qwen: not configured (no QWEN_BASE_URL)');
      this.logger.debug('[Grading] ⏭ Qwen remote skipped (no QWEN_BASE_URL)');
    } else {
      try {
        this.logger.debug(`[Grading] Trying Qwen remote (${this.qwenModel})...`);
        const result = await this.callOpenAiCompatible<T>(
          this.qwenBaseUrl,
          this.qwenModel,
          prompt,
          'Qwen',
        );
        this.logger.log(`[Grading] ✅ Qwen remote succeeded (${this.qwenModel})`);
        this.markSuccess('Qwen');
        return result;
      } catch (err) {
        const msg = (err as Error).message;
        errors.push(`Qwen: ${msg}`);
        this.logger.warn(`[Grading] ❌ Qwen remote failed: ${msg}`);
        this.markFailed('Qwen', msg);
      }
    }

    // ── 5. Ollama local (final fallback) ──────────────────────────────────
    if (this.isOnCooldown('Ollama')) {
      errors.push('Ollama: skipped (on cooldown)');
      this.logger.debug('[Grading] ⏭ Ollama skipped (on cooldown)');
    } else {
      try {
        this.logger.debug(`[Grading] Trying Ollama local (${this.ollamaModel})...`);
        const result = await this.callOpenAiCompatible<T>(
          `${this.ollamaBaseUrl}/v1`,
          this.ollamaModel,
          prompt,
          'Ollama',
        );
        this.logger.log(`[Grading] ✅ Ollama local succeeded (${this.ollamaModel})`);
        this.markSuccess('Ollama');
        return result;
      } catch (err) {
        const msg = (err as Error).message;
        errors.push(`Ollama: ${msg}`);
        this.logger.warn(`[Grading] ❌ Ollama local failed: ${msg}`);
        this.markFailed('Ollama', msg);
      }
    }

    // ── All failed ────────────────────────────────────────────────────────
    throw new Error(`All grading providers failed:\n  ${errors.join('\n  ')}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OpenAI-compatible API caller (for Qwen remote + Ollama local)
  // ═══════════════════════════════════════════════════════════════════════════

  private async callOpenAiCompatible<T>(
    baseUrl: string,
    model: string,
    prompt: string,
    providerLabel: string,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GRADING_OPTIONS.timeoutMs);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_MESSAGE },
            { role: 'user', content: prompt },
          ],
          temperature: GRADING_OPTIONS.temperature,
          max_tokens: GRADING_OPTIONS.maxTokens,
          stream: false,
        }),
        signal: controller.signal as any,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${providerLabel} HTTP ${res.status}: ${errText.slice(0, 300)}`);
      }

      const data = (await res.json()) as any;
      let raw: string = data.choices?.[0]?.message?.content ?? '';

      // Strip <think>...</think> blocks (Qwen3 thinking mode)
      raw = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      return this.parseJsonResponse<T>(raw, providerLabel);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`${providerLabel} request timed out after ${GRADING_OPTIONS.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parse JSON from raw LLM response text with multiple fallback strategies.
   */
  private parseJsonResponse<T>(raw: string, providerLabel: string): T {
    // Try direct parse first
    try {
      return JSON.parse(raw) as T;
    } catch {}

    // Strip markdown fences
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1].trim()) as T; } catch {}
    }

    // Extract first {...} block
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]) as T; } catch {}
      try { return JSON.parse(objMatch[0].replace(/[\n\r\t]+/g, ' ')) as T; } catch {}
    }

    this.logger.warn(`[${providerLabel}] Could not extract JSON. Raw: ${raw.slice(0, 300)}`);
    throw new Error(`${providerLabel} response did not contain valid JSON`);
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
