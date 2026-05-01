import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { extname, join, resolve } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const IMG_MIN_WIDTH = 80;
const IMG_MIN_HEIGHT = 80;

function absoluteUploadsDir(...parts: string[]): string {
  return resolve(join(process.cwd(), 'uploads', ...parts));
}

function practiceImagesRelDir(slug: string): string {
  return join('TOEIC', 'toeic-listening-practice', slug, 'images');
}
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsIn,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class ToeicPracticeImportDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(990)
  score_band_min!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(990)
  score_band_max!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  toeic_part?: number;

  @IsOptional()
  @IsString()
  @IsIn(['single_part', 'full_reading', 'full_listening'])
  import_scope?: 'single_part' | 'full_reading' | 'full_listening';

  @IsOptional()
  @IsString()
  @IsIn(['listening', 'reading'])
  skill_area?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  replace_existing?: boolean;
}

export class ToeicPracticeImportResponseDto {
  imported_count!: number;
  skipped_count!: number;
  score_band_min!: number;
  score_band_max!: number;
  practice_set_id!: string;
  detected_parts!: number[];
  skipped_duplicates!: Array<{
    question_number: number;
    part: number;
    existing_question_id: number | null;
    reason: string;
  }>;
  manual_fill_suggestions!: Array<{
    part: number;
    missing_count: number;
    question_numbers: number[];
  }>;
}

export class ToeicPracticeManualOptionDto {
  @IsString()
  @IsIn(['A', 'B', 'C', 'D'])
  option_key!: string;

  @IsString()
  @IsNotEmpty()
  option_text!: string;
}

export class ToeicPracticeManualItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  toeic_part!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  question_number?: number;

  @IsString()
  @IsNotEmpty()
  stem!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => ToeicPracticeManualOptionDto)
  options!: ToeicPracticeManualOptionDto[];

  @IsString()
  @IsIn(['A', 'B', 'C', 'D'])
  correct_option_key!: string;
}

export class ToeicPracticeManualSupplementDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(990)
  score_band_min!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(990)
  score_band_max!: number;

  @IsOptional()
  @IsString()
  practice_set_id?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ToeicPracticeManualItemDto)
  items!: ToeicPracticeManualItemDto[];
}

export class ToeicPracticeManualSupplementResponseDto {
  inserted_count!: number;
  skipped_count!: number;
  practice_set_id!: string;
  skipped_duplicates!: Array<{
    question_number: number;
    part: number;
    existing_question_id: number | null;
    reason: string;
  }>;
}

export class ToeicPracticeListFiltersDto {
  part?: number;
  score_band_min?: number;
  score_band_max?: number;
  skill_area?: string;
  practice_set_id?: string;
}

export class ToeicPracticeListResponseDto {
  total!: number;
  items!: ToeicPracticeListItemDto[];
}

export class ToeicPracticeListItemDto {
  id!: number;
  part?: number | null;
  skill_area!: string;
  practice_set_id?: string | null;
  question_number?: number | null;
  has_answer_key!: boolean;
  stem!: string;
  score_band_min!: number;
  score_band_max!: number;
  difficulty_label!: string;
  difficulty_score!: number | null;
  is_published!: boolean;
  created_at!: Date;
  options!: Array<{
    id: number;
    option_key: string;
    option_text: string;
    is_correct: boolean;
    sort_order: number;
  }>;
}

export class ToeicPracticeDeleteDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids!: number[];
}

export class ToeicPracticeDeleteResponseDto {
  deleted_count!: number;
}

export class ToeicPracticeAnswerKeyImportDto {
  @IsString()
  @IsNotEmpty()
  practice_set_id!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  clear_existing?: boolean;
}

export class ToeicPracticeAnswerKeyImportResponseDto {
  practice_set_id!: string;
  total_answers_detected!: number;
  matched_questions!: number;
  updated_questions!: number;
  unanswered_questions!: number;
  unmatched_question_numbers!: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal parser types
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedOption {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

interface ParsedPracticeQuestion {
  questionNumber: number | null;
  stem: string;
  options: ParsedOption[];
  detectedPart: number | null;
}

type ToeicPracticeImportScope = 'single_part' | 'full_reading' | 'full_listening';

type ToeicOptionKey = 'A' | 'B' | 'C' | 'D';

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ToeicPracticeImportService {
  private readonly logger = new Logger(ToeicPracticeImportService.name);

  constructor(private readonly prisma: PrismaService) { }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private mapPartTokenToNumber(token: string): number | null {
    const normalized = String(token)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim();
    if (!normalized) return null;

    if (/^[1-7]$/.test(normalized)) {
      return Number(normalized);
    }

    const romanMap: Record<string, number> = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
    };

    return romanMap[normalized] ?? null;
  }

  private detectToeicPartFromText(
    ...sources: Array<string | null | undefined>
  ): number | null {
    for (const source of sources) {
      if (!source || source.trim().length === 0) continue;
      const normalized = source.toLowerCase();

      const partMatch = normalized.match(/\bpart\s*([ivx]+|[1-7])\b/i);
      if (partMatch?.[1]) {
        const parsed = this.mapPartTokenToNumber(partMatch[1]);
        if (parsed) return parsed;
      }

      const compactPartMatch = normalized.match(/\bpart([ivx]+|[1-7])\b/i);
      if (compactPartMatch?.[1]) {
        const parsed = this.mapPartTokenToNumber(compactPartMatch[1]);
        if (parsed) return parsed;
      }

      const shortMatch = normalized.match(/\bp\s*([1-7])\b/i);
      if (shortMatch?.[1]) return Number(shortMatch[1]);
    }

    return null;
  }

  private normalizeOptionKey(raw: string): ToeicOptionKey | null {
    const normalized = String(raw).toUpperCase().trim();
    if (!normalized) return null;

    const direct = normalized.match(/^[[(]?\s*([A-D])\s*[\]).:-]?$/);
    if (direct?.[1]) {
      return direct[1] as ToeicOptionKey;
    }

    const token = normalized.match(/\b([A-D])\b/);
    if (token?.[1]) {
      return token[1] as ToeicOptionKey;
    }

    return null;
  }

  private parseQuestionNumber(raw: string): number | null {
    const match = String(raw).match(/\d{1,3}/);
    if (!match?.[0]) return null;
    const parsed = Number(match[0]);
    if (!Number.isFinite(parsed)) return null;
    return parsed >= 1 && parsed <= 200 ? parsed : null;
  }

  private resolveImportScope(dto: ToeicPracticeImportDto): ToeicPracticeImportScope {
    if (dto.import_scope) return dto.import_scope;
    if (dto.toeic_part) return 'single_part';
    return 'full_reading';
  }

  private inferPartByQuestionNumber(questionNumber: number): number | null {
    if (questionNumber >= 1 && questionNumber <= 6) return 1;
    if (questionNumber >= 7 && questionNumber <= 31) return 2;
    if (questionNumber >= 32 && questionNumber <= 70) return 3;
    if (questionNumber >= 71 && questionNumber <= 100) return 4;
    if (questionNumber >= 101 && questionNumber <= 130) return 5;
    if (questionNumber >= 131 && questionNumber <= 146) return 6;
    if (questionNumber >= 147 && questionNumber <= 200) return 7;
    return null;
  }

  private inferPartByIndexInScope(
    index: number,
    scope: Extract<ToeicPracticeImportScope, 'full_reading' | 'full_listening'>,
  ): number {
    if (scope === 'full_listening') {
      if (index < 6) return 1;
      if (index < 31) return 2;
      if (index < 70) return 3;
      return 4;
    }

    if (index < 30) return 5;
    if (index < 46) return 6;
    return 7;
  }

  private partAllowedInScope(part: number, scope: ToeicPracticeImportScope): boolean {
    if (scope === 'single_part') return part >= 1 && part <= 7;
    if (scope === 'full_reading') return part >= 5 && part <= 7;
    return part >= 1 && part <= 4;
  }

  private resolvePartForQuestion(
    parsed: ParsedPracticeQuestion,
    index: number,
    dto: ToeicPracticeImportDto,
    scope: ToeicPracticeImportScope,
  ): number | null {
    if (scope === 'single_part') {
      if (!dto.toeic_part || dto.toeic_part < 1 || dto.toeic_part > 7) {
        return null;
      }
      return dto.toeic_part;
    }

    if (parsed.detectedPart && this.partAllowedInScope(parsed.detectedPart, scope)) {
      return parsed.detectedPart;
    }

    if (typeof parsed.questionNumber === 'number') {
      const inferredByNumber = this.inferPartByQuestionNumber(parsed.questionNumber);
      if (inferredByNumber && this.partAllowedInScope(inferredByNumber, scope)) {
        return inferredByNumber;
      }
    }

    return this.inferPartByIndexInScope(index, scope);
  }

  private isLikelyOptionContinuationLine(line: string): boolean {
    return (
      /^[a-z(]/.test(line) ||
      /^(and|or|to|for|of|with|in|on|at|from|that|which|who|where|when)\b/i.test(
        line,
      )
    );
  }

  private extractInlineOptionsFromLine(line: string): {
    stem: string;
    options: ParsedOption[];
  } {
    const markerRegex = /([A-D])[).:-]\s*/g;
    const markers = Array.from(line.matchAll(markerRegex)).filter((match) => {
      const idx = match.index ?? -1;
      return idx === 0 || /\s/.test(line[idx - 1] ?? '');
    });

    if (markers.length === 0) {
      return { stem: line.trim(), options: [] };
    }

    const stem = line.slice(0, markers[0].index ?? 0).trim();
    const options: ParsedOption[] = [];

    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      const nextMarker = markers[i + 1];
      const start = (marker.index ?? 0) + marker[0].length;
      const end = nextMarker?.index ?? line.length;
      const optionText = line.slice(start, end).replace(/\s+/g, ' ').trim();

      if (!optionText) continue;

      options.push({
        optionKey: marker[1].toUpperCase(),
        optionText,
        isCorrect: false,
      });
    }

    return { stem, options };
  }

  private isLikelyAnswerKeyLine(line: string): boolean {
    const normalized = line.replace(/\s+/g, ' ').trim();
    if (!normalized) return false;

    const pairRegex = /\b\d{1,3}\s*[).:-]?\s*[A-D]\b/gi;
    const pairMatches = normalized.match(pairRegex) ?? [];
    if (pairMatches.length === 0) return false;

    const residue = normalized
      .replace(pairRegex, ' ')
      .replace(/[\s,.;:()\-_/]+/g, '')
      .trim();

    if (residue.length > 0) return false;
    if (pairMatches.length >= 3) return true;
    if (pairMatches.length >= 2 && normalized.length <= 90) return true;
    return pairMatches.length === 1 && normalized.length <= 16;
  }

  private extractAnswerKeyMap(rawText: string): Map<number, ToeicOptionKey> {
    const answerMap = new Map<number, ToeicOptionKey>();
    const lines = rawText
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0);

    let inAnswerSection = false;

    for (const line of lines) {
      if (/\b(answer\s*key|đáp\s*án|dap\s*an)\b/i.test(line)) {
        inAnswerSection = true;
        continue;
      }

      const pairRegex = /\b(\d{1,3})\s*[).:-]?\s*([A-D])\b/gi;
      const pairs = Array.from(line.matchAll(pairRegex));
      if (pairs.length === 0) continue;

      const shouldParse = inAnswerSection || this.isLikelyAnswerKeyLine(line);
      if (!shouldParse) continue;

      for (const pair of pairs) {
        const questionNumber = Number(pair[1]);
        const key = this.normalizeOptionKey(pair[2]);
        if (!Number.isFinite(questionNumber) || questionNumber < 1) continue;
        if (!key) continue;
        answerMap.set(questionNumber, key);
      }
    }

    return answerMap;
  }

  private deriveSkillArea(part: number): string {
    return part <= 4 ? 'listening' : 'reading';
  }

  private deriveDifficultyLabel(scoreBandMax: number): string {
    if (scoreBandMax <= 400) return 'easy';
    if (scoreBandMax <= 600) return 'medium';
    if (scoreBandMax <= 800) return 'hard';
    return 'expert';
  }

  private normalizeForFingerprint(input: string): string {
    return String(input)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9 ]/g, '')
      .trim();
  }

  private buildQuestionFingerprint(
    part: number,
    stem: string,
    options: Array<{ optionKey: string; optionText: string }>,
  ): string {
    const normalizedStem = this.normalizeForFingerprint(stem);
    const optionSignature = options
      .map((option) => ({
        key: this.normalizeOptionKey(option.optionKey) ?? option.optionKey,
        text: this.normalizeForFingerprint(option.optionText),
      }))
      .filter((option) => option.key && option.text)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((option) => `${option.key}:${option.text}`)
      .join('|');

    return `${part}::${normalizedStem}::${optionSignature}`;
  }

  private async loadExistingFingerprintMap(parts: number[]): Promise<Map<string, number>> {
    if (parts.length === 0) {
      return new Map<string, number>();
    }

    const existingQuestions = await this.prisma.toeicPracticeQuestion.findMany({
      where: {
        part: { in: parts },
      },
      select: {
        id: true,
        part: true,
        stem: true,
        options: {
          select: {
            option_key: true,
            option_text: true,
          },
        },
      },
    });

    const map = new Map<string, number>();
    for (const question of existingQuestions) {
      const fingerprint = this.buildQuestionFingerprint(
        question.part ?? 0,
        question.stem,
        question.options.map((option) => ({
          optionKey: option.option_key,
          optionText: option.option_text,
        })),
      );

      if (!map.has(fingerprint)) {
        map.set(fingerprint, question.id);
      }
    }

    return map;
  }

  // ── File text extraction ─────────────────────────────────────────────────────

  private async extractText(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname || file.filename || '').toLowerCase();

    if (ext === '.pdf') {
      try {
        const pdfParseModule = await import('pdf-parse');
        const buf = await readFile(file.path);
        const parserCtor = (pdfParseModule as { PDFParse?: any }).PDFParse;

        if (typeof parserCtor === 'function') {
          const parser = new parserCtor({ data: buf });
          try {
            const parsed = await parser.getText();
            return String(parsed?.text ?? '');
          } finally {
            if (typeof parser.destroy === 'function') {
              await parser.destroy().catch(() => undefined);
            }
          }
        }

        const legacyDefault = (pdfParseModule as { default?: any }).default;
        if (typeof legacyDefault === 'function') {
          const parsed = await legacyDefault(buf);
          return String(parsed?.text ?? '');
        }
      } catch (err) {
        this.logger.warn(`Cannot parse PDF with pdf-parse: ${String(err)}`);
      }
    }

    if (ext === '.docx') {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ path: file.path });
        return String(result?.value ?? '');
      } catch (err) {
        this.logger.warn(`Cannot parse DOCX with mammoth: ${String(err)}`);
      }
    }

    if (ext === '.doc') {
      try {
        const mod = await import('word-extractor');
        const WordExtractorCtor = (mod as any).default ?? (mod as any);
        const extractor = new WordExtractorCtor();
        const doc = await extractor.extract(file.path);
        const body = doc?.getBody?.() ?? '';
        return String(body);
      } catch (err) {
        this.logger.warn(`Cannot parse DOC with word-extractor: ${String(err)}`);
      }
    }

    const imageExts = new Set([
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.bmp',
      '.tif',
      '.tiff',
    ]);

    if (imageExts.has(ext)) {
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        try {
          const result = await worker.recognize(file.path);
          return String(result?.data?.text ?? '');
        } finally {
          await worker.terminate();
        }
      } catch (err) {
        this.logger.warn(`Cannot parse image with tesseract OCR: ${String(err)}`);
      }
    }

    // .txt and fallback
    const buf = await readFile(file.path);
    return buf.toString('utf8');
  }

  // ── MCQ Parser ───────────────────────────────────────────────────────────────

  /**
    * Parse TOEIC MCQ text from loose OCR/doc text.
   *
    * Accepts non-rigid layouts:
    * - question + options across multiple lines
    * - inline options on one line
    * - optional inline answer or separate answer-key block
    * - optional part headers (PART 5 / Phan 6 / ...)
   */
  private parseQuestionsFromText(rawText: string): ParsedPracticeQuestion[] {
    const normalized = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[\t\f\v]+/g, ' ')
      .trim();

    if (!normalized) return [];

    const lines = normalized
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter((l) => l.length > 0);

    const answerKeyMap = this.extractAnswerKeyMap(normalized);

    // ── Step 2: Stateful line-by-line parse ──────────────────────────────────
    const questions: ParsedPracticeQuestion[] = [];
    let currentPart: number | null = null;

    type WorkingQ = {
      questionNumber: number | null;
      stemLines: string[];
      optionsMap: Map<string, string>;
      inlineAnswer: string | null;
      detectedPart: number | null;
      lastOptionKey: string | null;
    };

    let wq: WorkingQ | null = null;

    const flushQuestion = () => {
      if (!wq) return;

      const optionKeys = ['A', 'B', 'C', 'D'];
      const options: ParsedOption[] = optionKeys
        .filter((k) => wq!.optionsMap.has(k))
        .map((k) => ({
          optionKey: k,
          optionText: wq!.optionsMap.get(k)!.trim(),
          isCorrect: false,
        }))
        .filter((o) => o.optionText.length > 0);

      if (options.length < 2) {
        wq = null;
        return;
      }

      const correctKey =
        wq.inlineAnswer ??
        (typeof wq.questionNumber === 'number'
          ? answerKeyMap.get(wq.questionNumber)
          : null) ??
        null;

      if (correctKey) {
        const found = options.find((o) => o.optionKey === correctKey);
        if (found) found.isCorrect = true;
      }

      const stem = wq.stemLines.join(' ').replace(/\s+/g, ' ').trim();
      if (!stem) {
        wq = null;
        return;
      }

      questions.push({
        questionNumber: wq.questionNumber,
        stem,
        options,
        detectedPart: wq.detectedPart ?? currentPart,
      });

      wq = null;
    };

    for (const line of lines) {
      // ── PART header ───────────────────────────────────────────────────────
      const detectedPart = this.detectToeicPartFromText(line);
      if (detectedPart) {
        flushQuestion();
        currentPart = detectedPart;
        continue;
      }

      // ── Question start: "1. stem text" or "1) stem text" or
      //    "Question 1. stem text" ────────────────────────────────────────────
      const qStartMatch =
        line.match(/^(?:question\s*|c[aâ]u\s*)?(\d{1,3})\s*[).:\-]\s*(.+)$/i) ??
        line.match(/^(\d{1,3})\s+(.+)$/);

      if (qStartMatch) {
        const rest = qStartMatch[2].trim();

        // Guard: rest looks like a standalone answer key entry — skip
        if (/^[ABCD]\s*\.?\s*$/.test(rest)) {
          // e.g. "1. A" — already captured in answerKeyMap; not a stem
          flushQuestion();
          wq = null;
          continue;
        }

        const questionNumber = this.parseQuestionNumber(qStartMatch[1]);
        if (!questionNumber) continue;

        const inline = this.extractInlineOptionsFromLine(rest);

        flushQuestion();
        wq = {
          questionNumber,
          stemLines: inline.stem ? [inline.stem] : [],
          optionsMap: new Map(),
          inlineAnswer: null,
          detectedPart: currentPart,
          lastOptionKey: null,
        };

        for (const option of inline.options) {
          const key = this.normalizeOptionKey(option.optionKey);
          if (!key) continue;
          wq.optionsMap.set(key, option.optionText.trim());
          wq.lastOptionKey = key;
        }

        continue;
      }

      if (wq) {
        // ── Option line: "A. text", "A) text", "(A) text", "A - text" ───────
        const optMatch = line.match(
          /^(?:\()?([ABCD])(?:\))?\s*[.):\-]\s*(.+)$/i,
        );
        if (optMatch) {
          const key = this.normalizeOptionKey(optMatch[1]);
          if (!key) continue;

          const text = optMatch[2].trim();
          const cleanText = text
            .replace(/\s*Questions?\s+\d+\s*[-–]\s*\d+\s*refer.*$/i, '')
            .trim();

          if (cleanText.length > 0) {
            wq.optionsMap.set(key, cleanText);
            wq.lastOptionKey = key;
          }
          continue;
        }

        const inline = this.extractInlineOptionsFromLine(line);
        if (inline.options.length > 0) {
          if (inline.stem && wq.optionsMap.size === 0) {
            wq.stemLines.push(inline.stem);
          }

          for (const option of inline.options) {
            const key = this.normalizeOptionKey(option.optionKey);
            if (!key) continue;
            wq.optionsMap.set(key, option.optionText.trim());
            wq.lastOptionKey = key;
          }

          continue;
        }

        // ── Inline answer marker: "Answer: A", "Correct: B" ─────────────────
        const ansMatch = line.match(
          /^(?:answer|correct|đáp\s*án)\s*[:\-]\s*([ABCD])/i,
        );
        if (ansMatch) {
          const normalizedKey = this.normalizeOptionKey(ansMatch[1]);
          wq.inlineAnswer = normalizedKey;
          flushQuestion();
          continue;
        }

        // ── Explanation line → flush current question ─────────────────────
        if (/^(?:explanation|giải\s*thích|解説)\s*[:\-]/i.test(line)) {
          flushQuestion();
          continue;
        }

        if (
          wq.lastOptionKey &&
          wq.optionsMap.size > 0 &&
          this.isLikelyOptionContinuationLine(line)
        ) {
          const previous = wq.optionsMap.get(wq.lastOptionKey) ?? '';
          wq.optionsMap.set(
            wq.lastOptionKey,
            `${previous} ${line}`.replace(/\s+/g, ' ').trim(),
          );
          continue;
        }

        // ── Continuation of stem (before any options appear) ──────────────
        if (wq.optionsMap.size === 0) {
          wq.stemLines.push(line);
        }
        // Lines after options started are ignored (e.g. passage fragments)
      }
    }

    flushQuestion();

    return questions;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async importPracticeQuestionsFromFile(
    accountId: number,
    dto: ToeicPracticeImportDto,
    file: Express.Multer.File,
  ): Promise<ToeicPracticeImportResponseDto> {
    void accountId;

    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload.');
    }

    const rawText = await this.extractText(file);
    const isPdf = extname(file.originalname || file.path).toLowerCase() === '.pdf';
    let parsed = this.parseQuestionsFromText(rawText);

    let imageAssets: any[] = [];
    const importScope = this.resolveImportScope(dto);
    const skillArea = dto.skill_area || (importScope === 'full_listening' ? 'listening' : 'reading');

    const practiceSetId = `tp-${Date.now()}-${randomUUID().slice(0, 8)}`;

    if (parsed.length === 0 && skillArea === 'listening' && isPdf) {
      this.logger.log(`Tạo placeholder cho đề Listening Practice (Image-based PDF)...`);
      for (let i = 1; i <= 100; i++) {
        const isPart1 = i <= 6;
        const isPart2 = i > 6 && i <= 31;
        const isPart3 = i > 31 && i <= 70;
        const isPart4 = i > 70;
        parsed.push({
          questionNumber: i,
          detectedPart: isPart1 ? 1 : isPart2 ? 2 : isPart3 ? 3 : 4,
          stem: isPart1 ? `[Part 1 - Câu ${i}: Nhìn vào hình ảnh và chọn mô tả đúng nhất]` : isPart2 ? `[Part 2 - Câu ${i}: Nghe câu hỏi và chọn đáp án phù hợp nhất]` : isPart3 ? `[Part 3 - Câu ${i}: Nghe đoạn hội thoại và chọn đáp án đúng]` : `[Part 4 - Câu ${i}: Nghe bài nói ngắn và chọn đáp án đúng]`,
          options: isPart2
            ? ['A', 'B', 'C'].map(k => ({ optionKey: k, optionText: `(${k})`, isCorrect: false }))
            : ['A', 'B', 'C', 'D'].map(k => ({ optionKey: k, optionText: `(${k})`, isCorrect: false })),
        });
      }
      imageAssets = await this.extractImagesFromPdf(file.path, practiceSetId);
    } else if (parsed.length === 0) {
      throw new BadRequestException('Không phân tích được câu hỏi nào từ file. Vui lòng kiểm tra định dạng.');
    }

    const difficultyLabel = this.deriveDifficultyLabel(dto.score_band_max);

    const targetParts =
      importScope === 'single_part'
        ? [dto.toeic_part ?? 0]
        : importScope === 'full_reading'
          ? [5, 6, 7]
          : [1, 2, 3, 4];

    const seenInCurrentBatch = new Set<string>();

    // ── replace_existing: delete all existing questions in same score band ──
    if (dto.replace_existing === true) {
      const deleteWhere: Record<string, any> = {
        score_band_min: dto.score_band_min,
        score_band_max: dto.score_band_max,
      };

      if (importScope === 'single_part' && dto.toeic_part !== undefined) {
        deleteWhere.part = dto.toeic_part;
      } else if (importScope === 'full_reading') {
        deleteWhere.skill_area = 'reading';
      } else if (importScope === 'full_listening') {
        deleteWhere.skill_area = 'listening';
      } else if (dto.skill_area) {
        deleteWhere.skill_area = dto.skill_area;
      }

      await this.prisma.toeicPracticeQuestion.deleteMany({
        where: deleteWhere,
      });
      this.logger.log(
        `replace_existing=true: deleted existing questions for scope=${importScope} band ${dto.score_band_min}-${dto.score_band_max}`,
      );
    }

    const existingFingerprints = await this.loadExistingFingerprintMap(
      targetParts.filter((part) => part >= 1 && part <= 7),
    );

    let importedCount = 0;
    let skippedCount = 0;
    let part1Count = 0;
    const detectedParts = new Set<number>();
    const skippedDuplicates: Array<{
      question_number: number;
      part: number;
      existing_question_id: number | null;
      reason: string;
    }> = [];

    // Heuristic: Lọc ra các ảnh phù hợp nhất cho Part 1 (bỏ qua logo/watermark).
    const bestImages = [...imageAssets]
      .filter(img => (img.size_bytes || 0) > 10000)
      .sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0))
      .slice(0, 6) // Part 1 luôn có tối đa 6 câu
      .sort((a, b) => {
        if (a.page !== b.page) return (a.page || 0) - (b.page || 0);
        return (a.filename || '').localeCompare(b.filename || '');
      });

    for (let index = 0; index < parsed.length; index += 1) {
      const pq = parsed[index];
      const part = this.resolvePartForQuestion(pq, index, dto, importScope);
      if (!part) {
        skippedCount += 1;
        continue;
      }

      if (!this.partAllowedInScope(part, importScope)) {
        skippedCount += 1;
        continue;
      }

      const skillArea = dto.skill_area ?? this.deriveSkillArea(part);
      const questionNumber =
        typeof pq.questionNumber === 'number' && pq.questionNumber > 0
          ? pq.questionNumber
          : index + 1;

      if (pq.options.length < 2) {
        this.logger.debug(
          `Skipping question #${String(pq.questionNumber ?? index + 1)}: < 2 options`,
        );
        skippedCount++;
        continue;
      }

      const fingerprint = this.buildQuestionFingerprint(part, pq.stem, pq.options);
      if (existingFingerprints.has(fingerprint) || seenInCurrentBatch.has(fingerprint)) {
        skippedCount += 1;
        skippedDuplicates.push({
          question_number: questionNumber,
          part,
          existing_question_id: existingFingerprints.get(fingerprint) ?? null,
          reason: existingFingerprints.has(fingerprint)
            ? 'duplicate_in_database'
            : 'duplicate_in_uploaded_file',
        });
        continue;
      }

      try {
        // Gán context_image nếu là Part 1 và có ảnh tương ứng
        let contextImageUrl: string | null = null;
        if (part === 1 && bestImages.length > 0) {
          const matchedImg = bestImages[part1Count];
          if (matchedImg) {
            contextImageUrl = `/uploads/${(matchedImg.url_path || matchedImg.url || '').replace(/\\/g, '/')}`;
          }
          part1Count++;
        }

        const question = await this.prisma.toeicPracticeQuestion.create({
          data: {
            skill_area: skillArea,
            part,
            stem: pq.stem,
            context_image: contextImageUrl,
            score_band_min: dto.score_band_min,
            score_band_max: dto.score_band_max,
            difficulty_label: difficultyLabel,
            difficulty_score: 0.3,
            source_slug: practiceSetId,
            source_item_id: questionNumber,
            is_published: true,
          },
        });

        await this.prisma.toeicPracticeOption.createMany({
          data: pq.options.map((o, idx) => ({
            question_id: question.id,
            option_key: o.optionKey,
            option_text: o.optionText,
            is_correct: o.isCorrect,
            sort_order: idx,
          })),
        });

        detectedParts.add(part);
        importedCount++;
        seenInCurrentBatch.add(fingerprint);
      } catch (err) {
        this.logger.warn(
          `Failed to persist Q#${String(pq.questionNumber ?? index + 1)}: ${String(err)}`,
        );
        skippedCount++;
      }
    }

    this.logger.log(
      `Practice import complete — set=${practiceSetId}, imported=${importedCount}, skipped=${skippedCount}`,
    );

    const duplicateByPart = new Map<number, number[]>();
    for (const duplicate of skippedDuplicates) {
      const list = duplicateByPart.get(duplicate.part) ?? [];
      list.push(duplicate.question_number);
      duplicateByPart.set(duplicate.part, list);
    }

    const manualFillSuggestions = [...duplicateByPart.entries()]
      .map(([part, questionNumbers]) => ({
        part,
        missing_count: questionNumbers.length,
        question_numbers: [...new Set(questionNumbers)].sort((a, b) => a - b),
      }))
      .sort((a, b) => a.part - b.part);

    return {
      imported_count: importedCount,
      skipped_count: skippedCount,
      score_band_min: dto.score_band_min,
      score_band_max: dto.score_band_max,
      practice_set_id: practiceSetId,
      detected_parts: [...detectedParts].sort((a, b) => a - b),
      skipped_duplicates: skippedDuplicates,
      manual_fill_suggestions: manualFillSuggestions,
    };
  }

  // ── Extract Images (Python) ──────────────────────────────────────────────────
  private async extractImagesFromPdf(pdfPath: string, slug: string): Promise<any[]> {
    const imagesRelDir = practiceImagesRelDir(slug);
    const outputDir = absoluteUploadsDir(...imagesRelDir.split(/[\\/]/));
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = resolve(join(process.cwd(), '..', 'ml_service', 'pdf_image_extractor.py'));

    if (!existsSync(scriptPath)) return [];

    let stdout = '';
    try {
      const result = await execFileAsync(pythonExe, [
        scriptPath, pdfPath, outputDir, slug, '--min-width', String(IMG_MIN_WIDTH),
        '--min-height', String(IMG_MIN_HEIGHT), '--skill-area', 'listening'
      ], { timeout: 120_000 });
      stdout = result.stdout;
    } catch { return []; }

    try {
      const parsed = JSON.parse(stdout.trim());
      return (parsed.images ?? []).map((img: any) => ({
        filename: img.filename,
        url: `TOEIC/toeic-listening-practice/${slug}/images/${img.filename}`,
        part_hint: img.part_hint,
        question_number: img.question_number,
      }));
    } catch { return []; }
  }

  async importPracticeManualSupplement(
    accountId: number,
    dto: ToeicPracticeManualSupplementDto,
  ): Promise<ToeicPracticeManualSupplementResponseDto> {
    void accountId;

    if (dto.score_band_min > dto.score_band_max) {
      throw new BadRequestException('score_band_min phải nhỏ hơn hoặc bằng score_band_max.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('items không được để trống.');
    }

    const practiceSetId =
      dto.practice_set_id?.trim() ||
      `tp-manual-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const difficultyLabel = this.deriveDifficultyLabel(dto.score_band_max);
    const parts = [...new Set(dto.items.map((item) => item.toeic_part))].filter(
      (part) => part >= 1 && part <= 7,
    );

    const existingFingerprints = await this.loadExistingFingerprintMap(parts);
    const seenInRequest = new Set<string>();

    let insertedCount = 0;
    let skippedCount = 0;
    const skippedDuplicates: Array<{
      question_number: number;
      part: number;
      existing_question_id: number | null;
      reason: string;
    }> = [];

    for (let index = 0; index < dto.items.length; index += 1) {
      const item = dto.items[index];
      const part = item.toeic_part;
      const questionNumber = item.question_number ?? index + 1;

      const normalizedOptions = item.options
        .map((option) => ({
          optionKey: (this.normalizeOptionKey(option.option_key) ?? '').toUpperCase(),
          optionText: option.option_text.trim(),
        }))
        .filter((option) => option.optionKey && option.optionText.length > 0)
        .filter(
          (option, optionIndex, arr) =>
            arr.findIndex((candidate) => candidate.optionKey === option.optionKey) ===
            optionIndex,
        );

      const correctOption = this.normalizeOptionKey(item.correct_option_key);
      if (!correctOption || !normalizedOptions.some((option) => option.optionKey === correctOption)) {
        skippedCount += 1;
        continue;
      }

      if (normalizedOptions.length < 2) {
        skippedCount += 1;
        continue;
      }

      const fingerprint = this.buildQuestionFingerprint(part, item.stem, normalizedOptions);
      if (existingFingerprints.has(fingerprint) || seenInRequest.has(fingerprint)) {
        skippedCount += 1;
        skippedDuplicates.push({
          question_number: questionNumber,
          part,
          existing_question_id: existingFingerprints.get(fingerprint) ?? null,
          reason: existingFingerprints.has(fingerprint)
            ? 'duplicate_in_database'
            : 'duplicate_in_manual_payload',
        });
        continue;
      }

      const createdQuestion = await this.prisma.toeicPracticeQuestion.create({
        data: {
          skill_area: this.deriveSkillArea(part),
          part,
          stem: item.stem.trim(),
          score_band_min: dto.score_band_min,
          score_band_max: dto.score_band_max,
          difficulty_label: difficultyLabel,
          difficulty_score: 0.3,
          source_slug: practiceSetId,
          source_item_id: questionNumber,
          is_published: true,
        },
      });

      await this.prisma.toeicPracticeOption.createMany({
        data: normalizedOptions.map((option, optionIndex) => ({
          question_id: createdQuestion.id,
          option_key: option.optionKey,
          option_text: option.optionText,
          is_correct: option.optionKey === correctOption,
          sort_order: optionIndex,
        })),
      });

      insertedCount += 1;
      seenInRequest.add(fingerprint);
      existingFingerprints.set(fingerprint, createdQuestion.id);
    }

    return {
      inserted_count: insertedCount,
      skipped_count: skippedCount,
      practice_set_id: practiceSetId,
      skipped_duplicates: skippedDuplicates,
    };
  }

  async importPracticeAnswerKey(
    accountId: number,
    dto: ToeicPracticeAnswerKeyImportDto,
    file: Express.Multer.File,
  ): Promise<ToeicPracticeAnswerKeyImportResponseDto> {
    void accountId;

    if (!file) {
      throw new BadRequestException('Vui lòng chọn file đáp án.');
    }

    const practiceSetId = dto.practice_set_id.trim();
    if (!practiceSetId) {
      throw new BadRequestException('practice_set_id là bắt buộc.');
    }

    const rawText = await this.extractText(file);
    if (!rawText.trim()) {
      throw new BadRequestException('File đáp án không chứa nội dung.');
    }

    const answerMap = this.extractAnswerKeyMap(rawText);
    if (answerMap.size === 0) {
      throw new BadRequestException(
        'Không tìm thấy cặp question + đáp án (A/B/C/D) hợp lệ trong file.',
      );
    }

    const questions = await this.prisma.toeicPracticeQuestion.findMany({
      where: { source_slug: practiceSetId },
      orderBy: { id: 'asc' },
      include: {
        options: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (questions.length === 0) {
      throw new BadRequestException(
        `Không tìm thấy bộ câu hỏi với practice_set_id: ${practiceSetId}`,
      );
    }

    const clearExisting = dto.clear_existing !== false;
    const operations: any[] = [];

    if (clearExisting) {
      operations.push(
        this.prisma.toeicPracticeOption.updateMany({
          where: {
            question: {
              source_slug: practiceSetId,
            },
          },
          data: { is_correct: false },
        }),
      );
    }

    const questionByNumber = new Map<number, (typeof questions)[number]>();
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      const qNo =
        typeof q.source_item_id === 'number' && q.source_item_id > 0
          ? q.source_item_id
          : i + 1;
      if (!questionByNumber.has(qNo)) {
        questionByNumber.set(qNo, q);
      }
    }

    let matchedQuestions = 0;
    let updatedQuestions = 0;
    const unmatchedQuestionNumbers: number[] = [];

    for (const [questionNumber, answerKey] of answerMap.entries()) {
      const question = questionByNumber.get(questionNumber);
      if (!question) {
        unmatchedQuestionNumbers.push(questionNumber);
        continue;
      }

      matchedQuestions += 1;
      const matchedOption = question.options.find(
        (option) => this.normalizeOptionKey(option.option_key) === answerKey,
      );

      if (!matchedOption) continue;

      operations.push(
        this.prisma.toeicPracticeOption.updateMany({
          where: { question_id: question.id },
          data: { is_correct: false },
        }),
        this.prisma.toeicPracticeOption.update({
          where: { id: matchedOption.id },
          data: { is_correct: true },
        }),
      );

      updatedQuestions += 1;
    }

    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }

    const unansweredQuestions = await this.prisma.toeicPracticeQuestion.count({
      where: {
        source_slug: practiceSetId,
        options: {
          none: { is_correct: true },
        },
      },
    });

    return {
      practice_set_id: practiceSetId,
      total_answers_detected: answerMap.size,
      matched_questions: matchedQuestions,
      updated_questions: updatedQuestions,
      unanswered_questions: unansweredQuestions,
      unmatched_question_numbers: unmatchedQuestionNumbers.sort((a, b) => a - b),
    };
  }

  async listPracticeQuestions(
    filters: ToeicPracticeListFiltersDto,
  ): Promise<ToeicPracticeListResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (filters.part !== undefined && filters.part !== null) {
      where['part'] = Number(filters.part);
    }
    if (filters.skill_area) {
      where['skill_area'] = filters.skill_area;
    }
    if (filters.practice_set_id) {
      where['source_slug'] = filters.practice_set_id;
    }
    if (filters.score_band_min !== undefined) {
      where['score_band_min'] = { gte: Number(filters.score_band_min) };
    }
    if (filters.score_band_max !== undefined) {
      where['score_band_max'] = { lte: Number(filters.score_band_max) };
    }

    const [total, rawItems] = await this.prisma.$transaction([
      this.prisma.toeicPracticeQuestion.count({ where }),
      this.prisma.toeicPracticeQuestion.findMany({
        where,
        take: 50,
        orderBy: { created_at: 'desc' },
        include: {
          options: {
            orderBy: { sort_order: 'asc' },
          },
        },
      }),
    ]);

    const items: ToeicPracticeListItemDto[] = rawItems.map((q) => ({
      id: q.id,
      part: q.part,
      skill_area: q.skill_area,
      practice_set_id: q.source_slug ?? null,
      question_number: q.source_item_id ?? null,
      has_answer_key: q.options.some((o) => o.is_correct),
      stem: q.stem,
      score_band_min: q.score_band_min,
      score_band_max: q.score_band_max,
      difficulty_label: q.difficulty_label,
      difficulty_score: q.difficulty_score,
      is_published: q.is_published,
      created_at: q.created_at,
      options: q.options.map((o) => ({
        id: o.id,
        option_key: o.option_key,
        option_text: o.option_text,
        is_correct: o.is_correct,
        sort_order: o.sort_order,
      })),
    }));

    return { total, items };
  }

  async deletePracticeQuestions(
    ids: number[],
  ): Promise<ToeicPracticeDeleteResponseDto> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('Vui lòng cung cấp danh sách id cần xóa.');
    }

    const result = await this.prisma.toeicPracticeQuestion.deleteMany({
      where: { id: { in: ids } },
    });

    return { deleted_count: result.count };
  }

  // ── Audio Chunking for Practice Listening ────────────────────────────────────

  async chunkPracticeAudio(
    _accountId: number,
    dto: { practice_set_id: string },
    file: Express.Multer.File,
  ): Promise<{
    practice_set_id: string;
    total_chunks: number;
    auto_mapped_count: number;
  }> {
    const { practice_set_id } = dto;

    if (!practice_set_id?.trim()) {
      throw new BadRequestException('Vui lòng cung cấp practice_set_id.');
    }

    const slug = practice_set_id.trim();
    const audioAbsDir = absoluteUploadsDir(
      'TOEIC',
      'toeic-listening-practice',
      slug,
      'audio',
    );
    if (!existsSync(audioAbsDir)) mkdirSync(audioAbsDir, { recursive: true });

    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = resolve(
      join(process.cwd(), '..', 'ml_service', 'audio_chunker.py'),
    );

    if (!existsSync(scriptPath)) {
      throw new BadRequestException('audio_chunker.py not found in ml_service/');
    }

    const args = [
      scriptPath,
      file.path,
      audioAbsDir,
      slug,
      '--method',
      'both',
      '--skill-area',
      'listening-practice',
    ];

    let stdout = '';
    try {
      const result = await execFileAsync(pythonExe, args, {
        timeout: 900_000,
        maxBuffer: 50 * 1024 * 1024,
      });
      stdout = result.stdout;
    } catch (err: any) {
      throw new BadRequestException(
        `Audio chunking failed: ${err?.stderr ?? err?.message ?? String(err)}`,
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(stdout.trim());
    } catch {
      throw new BadRequestException(
        `Chunker returned invalid JSON: ${stdout.substring(0, 200)}`,
      );
    }

    if (parsed.status === 'error') {
      throw new BadRequestException(parsed.message ?? 'Chunking error');
    }

    const chunks = (parsed.chunks ?? []).map((c: any) => ({
      filename: c.filename,
      url: `/uploads/${c.url_path}`,
      part: c.part,
      question_number: c.question_number,
    }));

    // Auto-map: update media_audio_url on ToeicPracticeQuestion rows
    let autoMappedCount = 0;
    if (chunks.length > 0) {
      const questions = await this.prisma.toeicPracticeQuestion.findMany({
        where: { source_slug: slug },
        select: { id: true, source_item_id: true },
      });

      const qNumToId = new Map<number, number>();
      for (const q of questions) {
        if (typeof q.source_item_id === 'number') {
          qNumToId.set(q.source_item_id, q.id);
        }
      }

      for (const chunk of chunks) {
        const itemId = qNumToId.get(chunk.question_number);
        if (!itemId) continue;
        await this.prisma.toeicPracticeQuestion.update({
          where: { id: itemId },
          data: { context_audio: chunk.url },
        });
        autoMappedCount++;
      }
    }

    return {
      practice_set_id: slug,
      total_chunks: chunks.length,
      auto_mapped_count: autoMappedCount,
    };
  }
}
