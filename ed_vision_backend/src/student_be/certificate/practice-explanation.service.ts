import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Difficulty Heuristic Constants ───────────────────────────────────────────

/** TOEIC score bands for practice question filtering */
const SCORE_BANDS: Array<{ min: number; max: number; label: string }> = [
  { min: 10, max: 349, label: 'easy' }, // 10-349
  { min: 350, max: 549, label: 'easy' }, // 350-549
  { min: 550, max: 699, label: 'medium' }, // 550-699
  { min: 700, max: 849, label: 'hard' }, // 700-849
  { min: 850, max: 990, label: 'expert' }, // 850-990
];

/**
 * High-frequency (easy) English words — questions using ONLY these words
 * in options tend to be easier.  A question is penalised upward in difficulty
 * if its options contain rare / formal vocabulary.
 */
const HIGH_FREQ_WORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'can',
  'could',
  'should',
  'may',
  'might',
  'shall',
  'must',
  'not',
  'and',
  'or',
  'but',
  'if',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'up',
  'out',
  'as',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'he',
  'she',
  'they',
  'we',
  'i',
  'me',
  'him',
  'her',
  'them',
  'us',
  'my',
  'your',
  'his',
  'our',
  'their',
  'what',
  'which',
  'when',
  'where',
  'who',
  'how',
  'why',
  'time',
  'work',
  'day',
  'good',
  'new',
  'first',
  'last',
  'long',
  'great',
  'little',
  'own',
  'right',
  'old',
  'big',
  'high',
  'different',
  'small',
  'large',
  'next',
  'early',
  'young',
  'important',
  'public',
  'private',
  'real',
  'best',
  'free',
  'start',
  'place',
  'get',
  'make',
  'go',
  'know',
  'take',
  'see',
  'come',
  'think',
  'look',
  'want',
  'give',
  'use',
  'find',
  'tell',
  'ask',
  'seem',
  'feel',
  'try',
  'leave',
  'call',
  'keep',
  'let',
  'begin',
  'show',
  'hear',
  'play',
  'run',
  'move',
  'live',
  'believe',
  'hold',
  'bring',
  'happen',
  'write',
  'provide',
  'sit',
  'stand',
  'lose',
  'pay',
  'meet',
  'include',
  'continue',
  'set',
  'learn',
  'change',
  'lead',
  'follow',
  'stop',
  'create',
  'speak',
  'read',
  'spend',
  'grow',
  'open',
  'walk',
]);

/**
 * Academic / formal words that indicate harder questions.
 * Sourced from Academic Word List (AWL) and TOEIC advanced vocab patterns.
 */
const ADVANCED_WORDS = new Set([
  'accommodate',
  'acquisition',
  'analysis',
  'approach',
  'appropriate',
  'aspect',
  'assessment',
  'assume',
  'authority',
  'benefit',
  'category',
  'clause',
  'commission',
  'commitment',
  'communication',
  'compensation',
  'complex',
  'comprehensive',
  'concept',
  'conclude',
  'conduct',
  'consequence',
  'considerable',
  'constitute',
  'constraint',
  'contribution',
  'controversy',
  'convention',
  'corporate',
  'corresponding',
  'criteria',
  'cumulative',
  'demonstrate',
  'despite',
  'determine',
  'deviate',
  'dimension',
  'discrimination',
  'distribution',
  'domestic',
  'economic',
  'efficiency',
  'emerge',
  'emphasis',
  'entity',
  'environment',
  'establish',
  'evaluation',
  'evidence',
  'evolve',
  'exclude',
  'explicit',
  'facilitate',
  'factor',
  'framework',
  'function',
  'implement',
  'implication',
  'indicate',
  'interpret',
  'investment',
  'justify',
  'legislation',
  'maintenance',
  'mechanism',
  'methodology',
  'negligible',
  'objective',
  'obligation',
  'obtain',
  'paramount',
  'perceive',
  'perspective',
  'phenomenon',
  'policy',
  'preliminary',
  'principle',
  'priority',
  'procedure',
  'provision',
  'regulatory',
  'reinforce',
  'relevant',
  'revenue',
  'subsequent',
  'substantial',
  'sufficient',
  'sustainability',
  'systematically',
  'terminate',
  'therefore',
  'transaction',
  'transition',
  'utilize',
  'valid',
  'variable',
  'whereas',
  'amendment',
  'arbitration',
  'compliance',
  'confidential',
  'contractual',
  'disbursement',
  'escalation',
  'expenditure',
  'fluctuate',
  'incumbent',
  'jurisdiction',
  'liability',
  'mandate',
  'mediation',
  'negotiate',
  'protocol',
  'reimbursement',
  'remittance',
  'stipulation',
  'subcontract',
  'tariff',
]);

// ─── Ollama types ──────────────────────────────────────────────────────────────

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: false;
  think?: boolean; // Qwen3: false = disable thinking mode (no <think> overhead)
  options?: {
    num_predict?: number;
    temperature?: number;
    num_ctx?: number;
    top_k?: number;
    top_p?: number;
  };
}

interface OllamaGenerateResponse {
  response: string;
}

type ExplanationOption = {
  option_key: string;
  option_text: string;
  is_correct: boolean;
};

// ─── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class PracticeExplanationService implements OnModuleInit {
  private readonly logger = new Logger(PracticeExplanationService.name);

  /** How many questions to explain per background cron run */
  private readonly BATCH_SIZE = 5;

  /** Prevent overlapping cron executions */
  private isProcessing = false;

  /** Ollama model (same as the rest of the AI pipeline) */
  private readonly MODEL = process.env.OLLAMA_MODEL ?? 'qwen3';

  /** Ollama base URL */
  private readonly OLLAMA_URL = (
    process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  ).replace(/\/$/, '');

  constructor(private readonly prisma: PrismaService) {}

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    // Migrate any explanations still sitting in the file-based JSON cache
    // into the ExamRepositoryItem.ai_explanation column, then remove the files.
    void this.migrateFileCacheToDb().catch((err) =>
      this.logger.warn(`File-cache migration skipped: ${String(err)}`),
    );

    // Keep historical TOEIC practice explanations in one stable display format.
    void this.normalizeExistingPracticeExplanations().catch((err) =>
      this.logger.warn(
        `Practice explanation normalization skipped: ${String(err)}`,
      ),
    );

    // Trigger one immediate pass on startup (after 30s delay) without waiting for cron
    setTimeout(() => {
      void this.explainPendingToeicPracticeQuestions().catch((err) =>
        this.logger.warn(`Startup explanation pass failed: ${String(err)}`),
      );
    }, 30_000);
  }

  // ─── Background cron: explain un-explained practice questions ───────────────

  /**
   * Runs every 5 minutes. Fetches a batch of ToeicPracticeQuestions
   * that have no ai_explanation yet and asks Ollama to generate one.
   * The result is stored directly in the DB column — no file I/O.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async explainPendingToeicPracticeQuestions(): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug(
        'Previous explanation job still running. Skipping this cycle.',
      );
      return;
    }

    let available: boolean;
    try {
      available = await this.isOllamaAvailable();
    } catch {
      return; // Ollama not running — skip silently
    }
    if (!available) return;

    this.isProcessing = true;
    try {
      const pending = await this.prisma.toeicPracticeQuestion.findMany({
        where: {
          ai_explained_at: null,
          is_published: true,
          options: { some: { is_correct: true } }, // only explain if there IS a correct answer
        },
        take: this.BATCH_SIZE,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          skill_area: true,
          part: true,
          stem: true,
          reading_passage: true,
          explanation: true,
          options: {
            select: { option_key: true, option_text: true, is_correct: true },
            orderBy: { sort_order: 'asc' },
          },
        },
      });

      if (pending.length === 0) return;

      this.logger.log(
        `Background AI: explaining ${pending.length} TOEIC practice question(s)...`,
      );

      const groups = this.groupByPassage(pending);

      for (const group of groups) {
        try {
          await this.explainGroup(group);
        } catch (err) {
          this.logger.warn(`Failed to explain group: ${String(err)}`);
        }

        // Nghỉ 1s giữa mỗi group để Ollama giải phóng GPU/RAM
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private groupByPassage(questions: any[]) {
    const groups = new Map<
      string,
      { passage: string | null; questions: any[] }
    >();
    for (const q of questions) {
      if (!q.reading_passage || (q.part !== 6 && q.part !== 7)) {
        groups.set(`solo_${q.id}`, { passage: null, questions: [q] });
        continue;
      }
      const key = q.reading_passage.slice(0, 50);
      if (!groups.has(key)) {
        groups.set(key, { passage: q.reading_passage, questions: [] });
      }
      groups.get(key)!.questions.push(q);
    }
    return Array.from(groups.values());
  }

  private parseGroupResponse(response: string, count: number): string[] {
    const results: string[] = [];
    for (let i = 1; i <= count; i++) {
      const regex = new RegExp(`Q${i}:\\s*([\\s\\S]*?)(?=Q${i + 1}:|$)`);
      const match = response.match(regex);
      results.push(match?.[1]?.trim() ?? '');
    }
    return results;
  }

  private async explainGroup(group: {
    passage: string | null;
    questions: any[];
  }): Promise<void> {
    if (!group.passage || group.questions.length === 1) {
      // Fallback cho Part 5 hoặc passage bị tách lẻ 1 câu
      for (const q of group.questions) {
        const explanation = await this.generateToeicExplanation(q);
        const normalized = this.toNormalizedExplanationTemplate(
          explanation,
          q.options,
        );
        await this.prisma.toeicPracticeQuestion.update({
          where: { id: q.id },
          data: {
            ai_explanation: normalized,
            ai_explained_at: new Date(),
            ai_model: this.MODEL,
          },
        });
      }
      return;
    }

    const smartTruncate = (text: string, maxChars: number): string => {
      if (!text || text.length <= maxChars) return text;
      const truncated = text.slice(0, maxChars);
      const lastPeriod = Math.max(
        truncated.lastIndexOf('. '),
        truncated.lastIndexOf('.\\n'),
      );
      return lastPeriod > maxChars * 0.6
        ? truncated.slice(0, lastPeriod + 1) + ' [...]'
        : truncated + ' [...]';
    };

    const maxChars = 800;
    const passageSnippet = `\\n\\nReading Passage:\\n${smartTruncate(group.passage, maxChars)}`;

    const questionBlock = group.questions
      .map((q, i) => {
        const optionList = q.options
          .map(
            (o: any) =>
              `  ${o.option_key}. ${o.option_text}${o.is_correct ? ' ✓' : ''}`,
          )
          .join('\\n');
        const baseHint = q.explanation?.trim()
          ? `\\nHint: ${q.explanation}`
          : '';
        return `Q${i + 1} (Part ${q.part ?? '?'} - #${q.id}):\\nStem: ${q.stem}\\nOptions:\\n${optionList}${baseHint}`;
      })
      .join('\\n\\n');

    const formatStr = group.questions
      .map((_, i) => `Q${i + 1}: [explanation]`)
      .join('\\n');

    const prompt =
      `Bạn là gia sư TOEIC. Trả lời ngắn gọn. Giải thích bằng tiếng Việt.\n` +
      `Với mỗi câu hỏi dưới đây, giải thích ngắn gọn TẠI SAO đáp án đúng là đúng và TẠI SAO các đáp án khác sai.\n` +
      `${passageSnippet}\n\n` +
      `Questions:\n${questionBlock}\n\n` +
      `Respond in this EXACT format:\n${formatStr}`;

    const body: OllamaGenerateRequest = {
      model: this.MODEL,
      prompt,
      stream: false,
      think: false, // Disable Qwen3 thinking mode — answer fits in token budget
      options: {
        num_predict: Math.max(600, group.questions.length * 300),
        temperature: 0.1,
        num_ctx: 4096,
        top_k: 40,
        top_p: 0.9,
      },
    };

    const res = await fetch(`${this.OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(600_000), // Increased from 300s to 600s
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const data = (await res.json()) as OllamaGenerateResponse & {
      error?: string;
    };
    if (data.error) throw new Error(`Ollama Error: ${data.error}`);
    this.logger.debug(`Ollama raw data: ${JSON.stringify(data).substring(0, 500)}`);
    let raw = (data.response ?? '').trim();
    // Strip <think>...</think> tags if this is a reasoning model
    raw = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (!raw) {
       this.logger.error(`Ollama raw string was empty. Data: ${JSON.stringify(data)}`);
       throw new Error('Empty Ollama response in grouped mode');
    }

    const explanations = this.parseGroupResponse(raw, group.questions.length);

    for (let i = 0; i < group.questions.length; i++) {
      const q = group.questions[i];
      let exp = explanations[i];
      if (!exp || exp.trim() === '') {
        // Fallback: nếu parse xịt hoặc model lười biếng, chạy lại 1 câu
        exp = await this.generateToeicExplanation(q);
      }

      const normalized = this.toNormalizedExplanationTemplate(exp, q.options);
      await this.prisma.toeicPracticeQuestion.update({
        where: { id: q.id },
        data: {
          ai_explanation: normalized,
          ai_explained_at: new Date(),
          ai_model: this.MODEL,
        },
      });
    }
  }

  // ─── Public: get explanation for an exam item (DB-first, Ollama fallback) ──

  /**
   * Return an explanation for a ExamRepositoryItem.
   *
   * Priority:
   *  1. `ai_explanation` already stored in DB  → return immediately (no AI call)
   *  2. `explanation` (human-authored) in DB   → return immediately
   *  3. Call Ollama, persist result in `ai_explanation`, return it
   *
   * This replaces the old file-based `buildExplanationCachePath` approach.
   */
  async getOrGenerateExamItemExplanation(itemId: number): Promise<string> {
    return 'Không có giải thích cho đề thi.';
  }

  // ─── Public: compute difficulty score for a question at import time ─────────

  /**
   * Heuristic difficulty scorer (0.0 = trivial, 1.0 = very hard).
   *
   * Inputs considered:
   *  - TOEIC part number  (Part 7 > Part 6 > Part 5 in reading difficulty)
   *  - Vocabulary rarity  (advanced/academic words → harder)
   *  - Option similarity  (very similar answer choices → harder)
   *  - Passage length     (longer context → harder)
   */
  scoreDifficulty(params: {
    part?: number | null;
    stem: string;
    readingPassage?: string | null;
    options: Array<{ option_text: string }>;
  }): {
    score: number;
    label: string;
    scoreBandMin: number;
    scoreBandMax: number;
  } {
    let score = 0.3; // baseline

    // 1. Part-based base difficulty
    const partBase: Record<number, number> = {
      1: 0.15, // Photo description — very accessible
      2: 0.2, // Q&R — short exchanges
      3: 0.4, // Conversations — moderate
      4: 0.45, // Talks — moderate-hard
      5: 0.35, // Incomplete sentences — grammar focus
      6: 0.5, // Text completion — context + grammar
      7: 0.65, // Reading comprehension — hardest
    };
    if (params.part && partBase[params.part] !== undefined) {
      score = partBase[params.part];
    }

    // 2. Vocabulary rarity bonus
    const allText = [
      params.stem,
      params.readingPassage ?? '',
      ...params.options.map((o) => o.option_text),
    ]
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ');

    const words = allText.split(/\s+/).filter((w) => w.length > 2);
    if (words.length > 0) {
      const advancedCount = words.filter((w) => ADVANCED_WORDS.has(w)).length;
      const highFreqCount = words.filter((w) => HIGH_FREQ_WORDS.has(w)).length;
      const advancedRatio = advancedCount / words.length;
      const highFreqRatio = highFreqCount / words.length;

      score += advancedRatio * 0.25; // advanced vocab → harder
      score -= highFreqRatio * 0.1; // basic vocab → easier
    }

    // 3. Option similarity (Levenshtein-like quick heuristic)
    if (params.options.length >= 2) {
      const texts = params.options.map((o) =>
        o.option_text
          .toLowerCase()
          .replace(/[^a-z\s]/g, '')
          .trim(),
      );
      let totalSimilarity = 0;
      let pairs = 0;
      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          totalSimilarity += this.coarseTextSimilarity(texts[i], texts[j]);
          pairs++;
        }
      }
      if (pairs > 0) {
        const avgSim = totalSimilarity / pairs;
        // Very similar options (avg sim > 0.6) → harder (+0.15 max)
        score += Math.max(0, avgSim - 0.3) * 0.3;
      }
    }

    // 4. Passage length penalty (long passages → harder)
    if (params.readingPassage) {
      const wordCount = params.readingPassage.split(/\s+/).length;
      if (wordCount > 200) score += 0.1;
      else if (wordCount > 100) score += 0.05;
    }

    // Clamp
    score = Math.max(0.05, Math.min(0.98, score));

    // Map to label + score band
    const { label, min, max } = this.scoreToband(score);
    return { score, label, scoreBandMin: min, scoreBandMax: max };
  }

  // ─── Public: migrate existing exam items from file cache to DB ──────────────

  /**
   * One-time migration: reads every JSON file in uploads/certificate/ai-cache/
   * and writes its content into ExamRepositoryItem.ai_explanation (matched
   * by item_id embedded in the filename hash).
   *
   * After a successful run the file cache becomes irrelevant — new explanations
   * are written directly to the DB column.
   */
  async migrateFileCacheToDb(): Promise<{ migrated: number; skipped: number }> {
    return { migrated: 0, skipped: 0 };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async isOllamaAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.OLLAMA_URL}/api/tags`, {
        signal: AbortSignal.timeout(3_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async generateToeicExplanation(q: {
    id: number;
    skill_area: string;
    part?: number | null;
    stem: string;
    reading_passage?: string | null;
    explanation?: string | null;
    options: Array<{
      option_key: string;
      option_text: string;
      is_correct: boolean;
    }>;
  }): Promise<string> {
    const correctOpt = q.options.find((o) => o.is_correct);
    if (!correctOpt) throw new Error('No correct option — skip');

    const optionList = q.options
      .map(
        (o) => `  ${o.option_key}. ${o.option_text}${o.is_correct ? ' ✓' : ''}`,
      )
      .join('\n');

    const baseHint = q.explanation?.trim()
      ? `\n\nGợi ý từ giáo viên: ${q.explanation}`
      : '';

    const smartTruncate = (text: string, maxChars: number): string => {
      if (!text || text.length <= maxChars) return text;
      const truncated = text.slice(0, maxChars);
      const lastPeriod = Math.max(
        truncated.lastIndexOf('. '),
        truncated.lastIndexOf('.\n'),
      );
      return lastPeriod > maxChars * 0.6
        ? truncated.slice(0, lastPeriod + 1) + ' [...]'
        : truncated + ' [...]';
    };

    const maxChars = { 5: 0, 6: 400, 7: 500 }[q.part ?? 0] ?? 300;
    const passageSnippet = q.reading_passage
      ? `\n\nĐoạn văn:\n${smartTruncate(q.reading_passage, maxChars)}`
      : '';

    const prompt =
      `Bạn là gia sư TOEIC. Trả lời ngắn gọn, tối đa 150 từ. ` +
      `Giải thích TẠI SAO đáp án đúng là đúng, và TẠI SAO từng đáp án sai là sai. ` +
      `Giải thích cụ thể về quy tắc ngữ pháp, từ vựng hoặc logic. ` +
      `Viết bằng tiếng Việt.` +
      `${passageSnippet}` +
      `\n\nCâu hỏi (Part ${q.part ?? '?'} – ${q.skill_area}):\n${q.stem}` +
      `\n\nCác đáp án:\n${optionList}` +
      `${baseHint}` +
      `\n\nĐáp án đúng là: ${correctOpt.option_key}. ${correctOpt.option_text}` +
      `\n\nGiải thích:`;

    const NUM_CTX_BY_PART: Record<number, number> = {
      1: 2048,
      2: 2048,
      3: 2048,
      4: 2048,
      5: 2048,
      6: 4096,
      7: 4096,
    };
    const numCtx =
      q.part && NUM_CTX_BY_PART[q.part] ? NUM_CTX_BY_PART[q.part] : 2048;

    const body: OllamaGenerateRequest = {
      model: this.MODEL,
      prompt,
      stream: false,
      think: false, // Disable Qwen3 thinking mode — answer fits in token budget
      options: {
        num_predict: 600,
        temperature: 0.2,
        num_ctx: numCtx,
        top_k: 40,
        top_p: 0.9,
      },
    };

    const res = await fetch(`${this.OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(600_000), // Increased from 300s to 600s
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const data = (await res.json()) as OllamaGenerateResponse & {
      error?: string;
    };
    if (data.error) throw new Error(`Ollama Error: ${data.error}`);
    this.logger.debug(`Ollama raw data (single): ${JSON.stringify(data).substring(0, 500)}`);
    let raw = (data.response ?? '').trim();
    // Strip <think>...</think> tags
    raw = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (!raw) {
        this.logger.error(`Ollama raw string was empty (single). Data: ${JSON.stringify(data)}`);
        throw new Error('Empty Ollama response');
    }
    return this.normalizeExplanationWhitespace(raw);
  }

  private normalizeExplanationWhitespace(input: string): string {
    return String(input)
      .replace(/\r\n?/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/\t+/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private toNormalizedExplanationTemplate(
    raw: string,
    _options: ExplanationOption[],
  ): string {
    // Simply clean whitespace — do NOT parse/reformat the AI output.
    // Previous structured reformat was stripping all reasoning text.
    return this.normalizeExplanationWhitespace(raw);
  }

  private async normalizeExistingPracticeExplanations(): Promise<void> {
    // Disabled: this was overwriting existing AI explanations with a broken
    // structured format that stripped all reasoning. Now a no-op.
    return;
  }

  /**
   * Coarse text similarity based on shared word overlap (Jaccard coefficient).
   * Returns 0.0 (totally different) to 1.0 (identical).
   */
  private coarseTextSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 1));
    const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 1));
    if (wordsA.size === 0 && wordsB.size === 0) return 1.0;
    if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

    let intersection = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) intersection++;
    }
    const union = wordsA.size + wordsB.size - intersection;
    return intersection / union;
  }

  /**
   * Map a difficulty score (0.0–1.0) to a TOEIC score band and label.
   *
   * The bands below align with the SCORE_BANDS constant.
   */
  private scoreToband(score: number): {
    label: string;
    min: number;
    max: number;
  } {
    if (score < 0.25) return { label: 'easy', min: 10, max: 449 };
    if (score < 0.45) return { label: 'easy', min: 350, max: 599 };
    if (score < 0.6) return { label: 'medium', min: 500, max: 749 };
    if (score < 0.78) return { label: 'hard', min: 650, max: 899 };
    return { label: 'expert', min: 800, max: 990 };
  }
}
