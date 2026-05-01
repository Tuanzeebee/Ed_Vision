import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Difficulty Heuristic Constants ───────────────────────────────────────────

/** TOEIC score bands for practice question filtering */
const SCORE_BANDS: Array<{ min: number; max: number; label: string }> = [
  { min: 10,  max: 349, label: 'easy'   },  // 10-349
  { min: 350, max: 549, label: 'easy'   },  // 350-549
  { min: 550, max: 699, label: 'medium' },  // 550-699
  { min: 700, max: 849, label: 'hard'   },  // 700-849
  { min: 850, max: 990, label: 'expert' },  // 850-990
];

/**
 * High-frequency (easy) English words — questions using ONLY these words
 * in options tend to be easier.  A question is penalised upward in difficulty
 * if its options contain rare / formal vocabulary.
 */
const HIGH_FREQ_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','can','could',
  'should','may','might','shall','must','not','and','or','but','if',
  'in','on','at','to','for','of','with','by','from','up','out','as',
  'it','its','this','that','these','those','he','she','they','we','i',
  'me','him','her','them','us','my','your','his','our','their',
  'what','which','when','where','who','how','why',
  'time','work','day','good','new','first','last','long','great','little',
  'own','right','old','big','high','different','small','large','next',
  'early','young','important','public','private','real','best','free',
  'start','place','get','make','go','know','take','see','come','think',
  'look','want','give','use','find','tell','ask','seem','feel','try',
  'leave','call','keep','let','begin','show','hear','play','run','move',
  'live','believe','hold','bring','happen','write','provide','sit','stand',
  'lose','pay','meet','include','continue','set','learn','change','lead',
  'follow','stop','create','speak','read','spend','grow','open','walk',
]);

/**
 * Academic / formal words that indicate harder questions.
 * Sourced from Academic Word List (AWL) and TOEIC advanced vocab patterns.
 */
const ADVANCED_WORDS = new Set([
  'accommodate','acquisition','analysis','approach','appropriate','aspect',
  'assessment','assume','authority','benefit','category','clause','commission',
  'commitment','communication','compensation','complex','comprehensive','concept',
  'conclude','conduct','consequence','considerable','constitute','constraint',
  'contribution','controversy','convention','corporate','corresponding',
  'criteria','cumulative','demonstrate','despite','determine','deviate',
  'dimension','discrimination','distribution','domestic','economic','efficiency',
  'emerge','emphasis','entity','environment','establish','evaluation','evidence',
  'evolve','exclude','explicit','facilitate','factor','framework','function',
  'implement','implication','indicate','interpret','investment','justify',
  'legislation','maintenance','mechanism','methodology','negligible','objective',
  'obligation','obtain','paramount','perceive','perspective','phenomenon',
  'policy','preliminary','principle','priority','procedure','provision',
  'regulatory','reinforce','relevant','revenue','subsequent','substantial',
  'sufficient','sustainability','systematically','terminate','therefore',
  'transaction','transition','utilize','valid','variable','whereas',
  'amendment','arbitration','compliance','confidential','contractual',
  'disbursement','escalation','expenditure','fluctuate','incumbent',
  'jurisdiction','liability','mandate','mediation','negotiate','protocol',
  'reimbursement','remittance','stipulation','subcontract','tariff',
]);

// ─── Ollama types ──────────────────────────────────────────────────────────────

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: false;
  options?: {
    num_predict?: number;
    temperature?: number;
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

  /** Ollama model (same as the rest of the AI pipeline) */
  private readonly MODEL = process.env.OLLAMA_MODEL ?? 'qwen3';

  /** Ollama base URL */
  private readonly OLLAMA_URL =
    (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/$/, '');

  constructor(private readonly prisma: PrismaService) {}

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    // Migrate any explanations still sitting in the file-based JSON cache
    // into the LearningRepositoryItem.ai_explanation column, then remove the files.
    void this.migrateFileCacheToDb().catch((err) =>
      this.logger.warn(`File-cache migration skipped: ${String(err)}`),
    );

    // Keep historical TOEIC practice explanations in one stable display format.
    void this.normalizeExistingPracticeExplanations().catch((err) =>
      this.logger.warn(`Practice explanation normalization skipped: ${String(err)}`),
    );
  }

  // ─── Background cron: explain un-explained practice questions ───────────────

  /**
   * Runs every 2 minutes.  Fetches a small batch of ToeicPracticeQuestions
   * that have no ai_explanation yet and asks Ollama to generate one.
   * The result is stored directly in the DB column — no file I/O.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async explainPendingToeicPracticeQuestions(): Promise<void> {
    let available: boolean;
    try {
      available = await this.isOllamaAvailable();
    } catch {
      return; // Ollama not running — skip silently
    }
    if (!available) return;

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

    for (const q of pending) {
      try {
        const explanation = await this.generateToeicExplanation(q);
        const normalizedExplanation = this.toNormalizedExplanationTemplate(
          explanation,
          q.options,
        );
        await this.prisma.toeicPracticeQuestion.update({
          where: { id: q.id },
          data: {
            ai_explanation: normalizedExplanation,
            ai_explained_at: new Date(),
            ai_model: this.MODEL,
          },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to explain ToeicPracticeQuestion #${q.id}: ${String(err)}`,
        );
      }
    }
  }

  // ─── Public: get explanation for an exam item (DB-first, Ollama fallback) ──

  /**
   * Return an explanation for a LearningRepositoryItem.
   *
   * Priority:
   *  1. `ai_explanation` already stored in DB  → return immediately (no AI call)
   *  2. `explanation` (human-authored) in DB   → return immediately
   *  3. Call Ollama, persist result in `ai_explanation`, return it
   *
   * This replaces the old file-based `buildExplanationCachePath` approach.
   */
  async getOrGenerateExamItemExplanation(itemId: number): Promise<string> {
    const item = await this.prisma.learningRepositoryItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        stem: true,
        reading_passage: true,
        explanation: true,
        ai_explanation: true,
        options: {
          select: { option_key: true, option_text: true, is_correct: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!item) return 'Không tìm thấy câu hỏi.';

    // Fast path — already explained
    if (item.ai_explanation?.trim()) return item.ai_explanation;
    if (item.explanation?.trim()) return item.explanation;

    // Generate via Ollama
    try {
      const generated = await this.generateToeicExplanation({
        id: item.id,
        skill_area: 'reading',
        part: null,
        stem: item.stem,
        reading_passage: item.reading_passage ?? null,
        explanation: item.explanation ?? null,
        options: item.options,
      });

      const normalizedGenerated = this.toNormalizedExplanationTemplate(
        generated,
        item.options,
      );

      // Persist so next call is instant
      await this.prisma.learningRepositoryItem.update({
        where: { id: itemId },
        data: { ai_explanation: normalizedGenerated },
      });

      return normalizedGenerated;
    } catch {
      return item.explanation ?? 'Chưa có giải thích cho câu này.';
    }
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
  }): { score: number; label: string; scoreBandMin: number; scoreBandMax: number } {
    let score = 0.3; // baseline

    // 1. Part-based base difficulty
    const partBase: Record<number, number> = {
      1: 0.15, // Photo description — very accessible
      2: 0.20, // Q&R — short exchanges
      3: 0.40, // Conversations — moderate
      4: 0.45, // Talks — moderate-hard
      5: 0.35, // Incomplete sentences — grammar focus
      6: 0.50, // Text completion — context + grammar
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

      score += advancedRatio * 0.25;  // advanced vocab → harder
      score -= highFreqRatio * 0.10;  // basic vocab → easier
    }

    // 3. Option similarity (Levenshtein-like quick heuristic)
    if (params.options.length >= 2) {
      const texts = params.options.map((o) =>
        o.option_text.toLowerCase().replace(/[^a-z\s]/g, '').trim(),
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
      if (wordCount > 200) score += 0.10;
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
   * and writes its content into LearningRepositoryItem.ai_explanation (matched
   * by item_id embedded in the filename hash).
   *
   * After a successful run the file cache becomes irrelevant — new explanations
   * are written directly to the DB column.
   */
  async migrateFileCacheToDb(): Promise<{ migrated: number; skipped: number }> {
    const cacheDir = resolve(
      join(process.cwd(), 'uploads', 'certificate', 'ai-cache'),
    );
    if (!existsSync(cacheDir)) return { migrated: 0, skipped: 0 };

    const { readdir } = await import('fs/promises');
    let files: string[];
    try {
      files = await readdir(cacheDir, { recursive: true } as any) as string[];
    } catch {
      return { migrated: 0, skipped: 0 };
    }

    const jsonFiles = files.filter(
      (f) => typeof f === 'string' && f.endsWith('.json'),
    );
    if (jsonFiles.length === 0) return { migrated: 0, skipped: 0 };

    let migrated = 0;
    let skipped = 0;

    for (const rel of jsonFiles) {
      const fullPath = join(cacheDir, rel);
      try {
        const raw = await readFile(fullPath, 'utf8');
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          !('explanation' in parsed)
        ) {
          skipped++;
          continue;
        }

        const record = parsed as {
          explanation?: string;
          item_id?: number;
          created_at?: string;
          model?: string;
        };

        if (!record.explanation?.trim() || !record.item_id) {
          skipped++;
          continue;
        }

        // Only update if the DB column is still empty
        const existing = await this.prisma.learningRepositoryItem.findUnique({
          where: { id: record.item_id },
          select: { id: true, ai_explanation: true },
        });

        if (!existing) { skipped++; continue; }
        if (existing.ai_explanation?.trim()) { skipped++; continue; }

        await this.prisma.learningRepositoryItem.update({
          where: { id: record.item_id },
          data: {
            ai_explanation: record.explanation,
          },
        });
        migrated++;
      } catch {
        skipped++;
      }
    }

    if (migrated > 0) {
      this.logger.log(
        `File-cache → DB migration complete: ${migrated} migrated, ${skipped} skipped.`,
      );
    }

    return { migrated, skipped };
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
    options: Array<{ option_key: string; option_text: string; is_correct: boolean }>;
  }): Promise<string> {
    const correctOpt = q.options.find((o) => o.is_correct);
    if (!correctOpt) throw new Error('No correct option — skip');

    const optionList = q.options
      .map((o) => `  ${o.option_key}. ${o.option_text}${o.is_correct ? ' ✓' : ''}`)
      .join('\n');

    const baseHint = q.explanation?.trim()
      ? `\n\nBase hint (from human author): ${q.explanation}`
      : '';

    const passageSnippet = q.reading_passage
      ? `\n\nReading passage:\n${q.reading_passage.slice(0, 600)}`
      : '';

    const prompt =
      `You are a concise TOEIC English tutor. ` +
      `Explain in 2-3 sentences why the correct answer is correct ` +
      `and briefly why each wrong option is incorrect. ` +
      `Be specific about the grammar rule, vocabulary, or reasoning used. ` +
      `Write in English, keep it under 120 words.` +
      `${passageSnippet}` +
      `\n\nQuestion (Part ${q.part ?? '?'} – ${q.skill_area}):\n${q.stem}` +
      `\n\nOptions:\n${optionList}` +
      `${baseHint}` +
      `\n\nExplanation:`;

    const body: OllamaGenerateRequest = {
      model: this.MODEL,
      prompt,
      stream: false,
      options: { num_predict: 180, temperature: 0.3 },
    };

    const res = await fetch(`${this.OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const data = (await res.json()) as OllamaGenerateResponse;
    const raw = (data.response ?? '').trim();
    if (!raw) throw new Error('Empty Ollama response');
    return raw;
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

  private extractOptionReasons(text: string): Map<string, string> {
    const result = new Map<string, string>();
    const lines = text.split('\n');

    for (const line of lines) {
      const match = line.match(
        /^(?:[-*]\s*)?(?:option\s*)?([A-D])\s*[).:-]\s*(.+)$/i,
      );
      if (!match?.[1] || !match[2]) continue;

      const key = match[1].toUpperCase();
      const reason = match[2].trim();
      if (!reason) continue;

      const existing = result.get(key);
      result.set(key, existing ? `${existing} ${reason}`.trim() : reason);
    }

    return result;
  }

  private toNormalizedExplanationTemplate(
    raw: string,
    options: ExplanationOption[],
  ): string {
    const cleaned = this.normalizeExplanationWhitespace(raw);
    if (!cleaned) return cleaned;

    const correctOption = options.find((opt) => opt.is_correct);
    if (!correctOption) return cleaned;

    const reasonsByOption = this.extractOptionReasons(cleaned);

    const summary = cleaned
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !/^correct\s*answer\s*[:\-]/i.test(line))
      .filter((line) => !/^option\s*breakdown\s*[:\-]/i.test(line))
      .filter((line) => !/^(?:[-*]\s*)?(?:option\s*)?[A-D]\s*[).:-]/i.test(line))
      .map((line) => line.replace(/^summary\s*:\s*/i, '').trim())
      .join(' ')
      .replace(/[ ]{2,}/g, ' ')
      .trim();

    const sortedOptions = [...options].sort((a, b) =>
      a.option_key.localeCompare(b.option_key),
    );

    const lines: string[] = [
      `Correct answer: ${correctOption.option_key}. ${correctOption.option_text}`,
    ];

    if (summary) {
      lines.push(`Summary: ${summary}`);
    }

    lines.push('Option breakdown:');

    for (const option of sortedOptions) {
      const key = option.option_key.toUpperCase();
      const verdict = option.is_correct ? 'Correct' : 'Incorrect';
      const reason = reasonsByOption.get(key);
      lines.push(reason ? `${key}: ${verdict}. ${reason}` : `${key}: ${verdict}.`);
    }

    return this.normalizeExplanationWhitespace(lines.join('\n'));
  }

  private async normalizeExistingPracticeExplanations(): Promise<void> {
    const existing = await this.prisma.toeicPracticeQuestion.findMany({
      where: {
        ai_explanation: { not: null },
        options: { some: { is_correct: true } },
      },
      select: {
        id: true,
        ai_explanation: true,
        options: {
          select: {
            option_key: true,
            option_text: true,
            is_correct: true,
          },
        },
      },
      take: 1000,
    });

    let updated = 0;

    for (const row of existing) {
      const current = (row.ai_explanation ?? '').trim();
      if (!current) continue;

      const normalized = this.toNormalizedExplanationTemplate(
        current,
        row.options,
      );

      if (!normalized || normalized === current) continue;

      await this.prisma.toeicPracticeQuestion.update({
        where: { id: row.id },
        data: { ai_explanation: normalized },
      });
      updated += 1;
    }

    if (updated > 0) {
      this.logger.log(
        `Normalized ${updated} existing TOEIC practice explanation(s) into a stable template.`,
      );
    }
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
    if (score < 0.25) return { label: 'easy',   min: 10,  max: 449 };
    if (score < 0.45) return { label: 'easy',   min: 350, max: 599 };
    if (score < 0.60) return { label: 'medium', min: 500, max: 749 };
    if (score < 0.78) return { label: 'hard',   min: 650, max: 899 };
    return               { label: 'expert', min: 800, max: 990 };
  }
}
