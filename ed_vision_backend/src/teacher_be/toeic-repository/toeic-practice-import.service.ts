import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { extname, join, resolve } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  OpenRouterService,
  ImageAssetForMapping,
  QuestionContext,
} from '../../common/services/openrouter.service';

const execFileAsync = promisify(execFile);
const IMG_MIN_WIDTH = 80;
const IMG_MIN_HEIGHT = 80;

function absoluteUploadsDir(...parts: string[]): string {
  return resolve(join(process.cwd(), 'uploads', ...parts));
}

function practiceImagesRelDir(slug: string): string {
  return join('certificate', 'TOEIC', 'toeic-listening-practice', slug, 'images');
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
  extracted_image_count!: number;
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
  readingPassage: string | null;
}

type ToeicPracticeImportScope = 'single_part' | 'full_reading' | 'full_listening';

type ToeicOptionKey = 'A' | 'B' | 'C' | 'D';

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ToeicPracticeImportService {
  private readonly logger = new Logger(ToeicPracticeImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openRouterService: OpenRouterService,
  ) { }

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

  // ── File-level analysis ──────────────────────────────────────────────────────

  private analyzeFileCharacteristics(
    rawText: string,
    parsed: ParsedPracticeQuestion[],
  ): {
    hasListeningTest: boolean;
    hasReadingTest: boolean;
    hasListeningPartHeaders: boolean;
    hasReadingPartHeaders: boolean;
    hasPart5Header: boolean;
    hasPart6Header: boolean;
    hasPart7Header: boolean;
    minQuestionNumber: number;
    maxQuestionNumber: number;
    likelyFullTest: boolean;
    likelyPureReading: boolean;
    questionNumbersStartAbove100: boolean;
  } {
    const normalized = rawText.toLowerCase();

    const hasListeningTest = /listening\s*test/i.test(normalized);
    const hasReadingTest = /reading\s*test/i.test(normalized);

    // Detect PART headers rigorously — avoid false positives like "Part 11" or "Part IV score"
    const hasPart1 = /\bpart\s*(1|i)\b(?!\s*[ivx\d])/i.test(normalized);
    const hasPart2 = /\bpart\s*(2|ii)\b(?!\s*[ivx\d])/i.test(normalized);
    const hasPart3 = /\bpart\s*(3|iii)\b(?!\s*[ivx\d])/i.test(normalized);
    const hasPart4 = /\bpart\s*(4|iv)\b(?!\s*[ivx\d])/i.test(normalized);
    const hasPart5 = /\bpart\s*(5|v)\b(?!\s*[ivxi\d])/i.test(normalized);
    const hasPart6 = /\bpart\s*(6|vi)\b(?!\s*[ivxi\d])/i.test(normalized);
    const hasPart7 = /\bpart\s*(7|vii)\b(?!\s*[ivxi\d])/i.test(normalized);

    const hasListeningPartHeaders = hasPart1 || hasPart2 || hasPart3 || hasPart4;
    const hasReadingPartHeaders = hasPart5 || hasPart6 || hasPart7;

    const questionNumbers = parsed
      .map((q) => q.questionNumber)
      .filter((n): n is number => typeof n === 'number' && n > 0);

    const minQuestionNumber = questionNumbers.length > 0 ? Math.min(...questionNumbers) : 0;
    const maxQuestionNumber = questionNumbers.length > 0 ? Math.max(...questionNumbers) : 0;
    const questionNumbersStartAbove100 = minQuestionNumber >= 101;

    // Heuristic: is this a full test?
    const likelyFullTest =
      (hasListeningTest && hasReadingTest) ||
      (hasListeningPartHeaders && hasReadingPartHeaders) ||
      maxQuestionNumber >= 150;

    const likelyPureReading =
      !likelyFullTest &&
      (hasReadingPartHeaders ||
        questionNumbersStartAbove100 ||
        (!hasListeningPartHeaders && !hasListeningTest));

    this.logger.debug(
      `[FileAnalysis] fullTest=${likelyFullTest} pureReading=${likelyPureReading} ` +
      `qRange=[${minQuestionNumber}–${maxQuestionNumber}] ` +
      `headers: P1=${hasPart1} P2=${hasPart2} P3=${hasPart3} P4=${hasPart4} ` +
      `P5=${hasPart5} P6=${hasPart6} P7=${hasPart7}`,
    );

    return {
      hasListeningTest,
      hasReadingTest,
      hasListeningPartHeaders,
      hasReadingPartHeaders,
      hasPart5Header: hasPart5,
      hasPart6Header: hasPart6,
      hasPart7Header: hasPart7,
      minQuestionNumber,
      maxQuestionNumber,
      likelyFullTest,
      likelyPureReading,
      questionNumbersStartAbove100,
    };
  }

  // ── Smarter part resolver (V2) ───────────────────────────────────────────────

  private resolvePartForQuestionV2(
    parsed: ParsedPracticeQuestion,
    index: number,
    dto: ToeicPracticeImportDto,
    scope: ToeicPracticeImportScope,
    fileInfo: ReturnType<typeof this.analyzeFileCharacteristics>,
    totalReadingQuestions: number,
  ): number | null {
    // ── single_part: trust detectedPart header mismatch but otherwise force dto.toeic_part
    if (scope === 'single_part') {
      if (!dto.toeic_part || dto.toeic_part < 1 || dto.toeic_part > 7) return null;
      const targetPart = dto.toeic_part;

      if (fileInfo.likelyFullTest) {
        // Chỉ lấy câu mà parser đã gán đúng part từ PART header
        if (parsed.detectedPart === targetPart) return targetPart;
        
        // Nếu không có PART header nhưng có số thứ tự câu hỏi (vd: 1-100 là Listening)
        if (parsed.detectedPart === null && typeof parsed.questionNumber === 'number') {
          const n = parsed.questionNumber;
          let inferred: number | null = null;
          if (n >= 1 && n <= 6) inferred = 1;
          else if (n >= 7 && n <= 31) inferred = 2;
          else if (n >= 32 && n <= 70) inferred = 3;
          else if (n >= 71 && n <= 100) inferred = 4;
          
          if (inferred === targetPart) return targetPart;
        }

        // Tất cả trường hợp khác → skip
        return null;
      }

      if (parsed.detectedPart !== null && parsed.detectedPart !== targetPart) {
        return null;
      }
      return targetPart;
    }

    // ── full_listening ──────────────────────────────────────────────────────────
    if (scope === 'full_listening') {
      if (parsed.detectedPart && parsed.detectedPart >= 1 && parsed.detectedPart <= 4) {
        return parsed.detectedPart;
      }
      if (typeof parsed.questionNumber === 'number') {
        const inf = this.inferPartByQuestionNumber(parsed.questionNumber);
        if (inf && inf >= 1 && inf <= 4) return inf;
      }
      return this.inferPartByIndexInScope(index, 'full_listening');
    }

    // ── full_reading ────────────────────────────────────────────────────────────

    // Case 1: Full test file — filter out Listening questions
    if (fileInfo.likelyFullTest) {
      // Bỏ câu có PART header Listening (1-4)
      if (parsed.detectedPart !== null && parsed.detectedPart >= 1 && parsed.detectedPart <= 4) {
        return null;
      }
      // Bỏ câu số 1-100 khi file có cả Listening + Reading test header
      if (
        fileInfo.hasListeningTest &&
        fileInfo.hasReadingTest &&
        typeof parsed.questionNumber === 'number' &&
        parsed.questionNumber >= 1 &&
        parsed.questionNumber <= 100
      ) {
        return null;
      }
      // Câu có PART header Reading rõ ràng → dùng luôn
      if (parsed.detectedPart !== null && parsed.detectedPart >= 5 && parsed.detectedPart <= 7) {
        return parsed.detectedPart;
      }
      // Câu số 101-200 → infer by number
      if (typeof parsed.questionNumber === 'number' && parsed.questionNumber >= 101) {
        return this.inferPartByQuestionNumber(parsed.questionNumber);
      }
      return null;
    }

    // Case 2: File thuần Reading, câu bắt đầu từ 101+
    if (fileInfo.questionNumbersStartAbove100) {
      if (parsed.detectedPart !== null && parsed.detectedPart >= 5 && parsed.detectedPart <= 7) {
        return parsed.detectedPart;
      }
      if (typeof parsed.questionNumber === 'number') {
        const inf = this.inferPartByQuestionNumber(parsed.questionNumber);
        if (inf && inf >= 5 && inf <= 7) return inf;
      }
      return this.inferPartByIndexInScope(index, 'full_reading');
    }

    // Case 3: File thuần Reading, câu từ 1, có PART header rõ ràng
    if (fileInfo.likelyPureReading && parsed.detectedPart !== null) {
      if (parsed.detectedPart >= 5 && parsed.detectedPart <= 7) return parsed.detectedPart;
      // detectedPart là 1-4 nhưng file là pure reading → ignore, fallthrough
    }

    // Case 4: File thuần Reading, câu từ 1, KHÔNG có Part 5 header
    //   Infer dựa vào tỉ lệ phân bổ chuẩn: Part 5=40%, Part 6=12%, Part 7=48%
    if (fileInfo.likelyPureReading) {
      // Câu đã được gắn Part 6 hoặc 7 từ header → dùng luôn
      if (parsed.detectedPart === 6 || parsed.detectedPart === 7) {
        return parsed.detectedPart;
      }

      const total = totalReadingQuestions > 0 ? totalReadingQuestions : 100;
      const part5End = Math.round(total * 0.40); // 40 câu Part 5
      const part6End = Math.round(total * 0.52); // 12 câu Part 6 (40% + 12%)

      if (index < part5End) return 5;
      if (index < part6End) return 6;
      return 7;
    }

    // Fallback: index-based
    return this.inferPartByIndexInScope(index, 'full_reading');
  }

  // Legacy method kept for backward compat — delegates to V2 with a no-op fileInfo
  private resolvePartForQuestion(
    parsed: ParsedPracticeQuestion,
    index: number,
    dto: ToeicPracticeImportDto,
    scope: ToeicPracticeImportScope,
  ): number | null {
    if (parsed.detectedPart && this.partAllowedInScope(parsed.detectedPart, scope)) {
      return parsed.detectedPart;
    }
    if (typeof parsed.questionNumber === 'number') {
      const inferredByNumber = this.inferPartByQuestionNumber(parsed.questionNumber);
      if (inferredByNumber && this.partAllowedInScope(inferredByNumber, scope)) {
        return inferredByNumber;
      }
    }
    return this.inferPartByIndexInScope(index, scope as Extract<ToeicPracticeImportScope, 'full_reading' | 'full_listening'>);
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
    // Lookbehind to allow missing spaces before option letters (e.g. remindB.)
    // Only allow lowercase letters, numbers, or basic punctuation before the option letter to avoid false positives.
    const markerRegex = /(?<=^|[\s(a-z0-9.,?!])([A-D])[).:-]\s*/g;
    const markers = Array.from(line.matchAll(markerRegex));

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

      const pairRegex = /\b(\d{1,3})\s*[).:-]?\s*\(?\s*([A-D])\s*\)?\b/gi;
      const pairs = Array.from(line.matchAll(pairRegex));
      if (pairs.length === 0) continue;

      const residue = line
        .replace(pairRegex, ' ')
        .replace(/[\s,.;:()\-_/]+/g, '')
        .trim();

      const isSingleCleanPair = pairs.length === 1 && residue.length === 0;
      const shouldParse =
        inAnswerSection ||
        this.isLikelyAnswerKeyLine(line) ||
        isSingleCleanPair;
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
  /**
   * Public alias để các service khác (vd: DiagnosticImportService) tái sử dụng
   * cùng pipeline parser câu hỏi (ổn định cho Part 5/6/7 reading 100 câu).
   */
  public parsePracticeQuestionsFromText(rawText: string): ParsedPracticeQuestion[] {
    return this.parseQuestionsFromText(rawText);
  }

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

    // ── Passage tracking ─────────────────────────────────────────────────────
    // Accumulate passage lines after "Questions X-Y refer to the following..."
    // Assign to each question whose questionNumber falls within the range.
    let currentPassageLines: string[] = [];
    let currentPassageQuestionRange: [number, number] | null = null;
    // State-machine: remember "Questions X-Y" seen on one line,
    // in case "refer to the following..." is on the NEXT line.
    let pendingPassageRange: [number, number] | null = null;

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

      // Part 6: stem may be empty (fill-in-the-blank) — use fallback instead of rejecting
      let stem = wq.stemLines.join(' ').replace(/\s+/g, ' ').trim();
      if (!stem) {
        stem = `[Điền vào chỗ trống — câu ${wq.questionNumber ?? '?'}]`;
      }

      // Chỉ gán reading_passage cho Part 6 và 7 (Part 5 không có bài đọc)
      const effectivePart = wq.detectedPart ?? currentPart;
      let assignedPassage: string | null = null;
      if (currentPassageLines.length > 0 && effectivePart !== null && effectivePart >= 6) {
        const inRange =
          currentPassageQuestionRange === null ||
          (typeof wq.questionNumber === 'number' &&
            wq.questionNumber >= currentPassageQuestionRange[0] &&
            wq.questionNumber <= currentPassageQuestionRange[1]);
        if (inRange) {
          assignedPassage = currentPassageLines.join('\n').trim();
        }
      }

      questions.push({
        questionNumber: wq.questionNumber,
        stem,
        options,
        detectedPart: wq.detectedPart ?? currentPart,
        readingPassage: assignedPassage,
      });

      wq = null;
    };

    for (const line of lines) {
      // ── Activate pending passage range if next line contains "refer"/"follow" ─
      if (pendingPassageRange !== null) {
        if (/refer|follow|based on|liên quan|sau đây/i.test(line)) {
          flushQuestion();
          currentPassageLines = [];
          currentPassageQuestionRange = pendingPassageRange;
          pendingPassageRange = null;
          continue;
        }
        // Not a passage continuation — discard the pending range and process normally
        pendingPassageRange = null;
      }

      // ── PART header ───────────────────────────────────────────────────────
      const detectedPart = this.detectToeicPartFromText(line);
      if (detectedPart) {
        flushQuestion();
        currentPart = detectedPart;
        // Reset passage when entering new part
        currentPassageLines = [];
        currentPassageQuestionRange = null;
        pendingPassageRange = null;
        continue;
      }

      // ── Passage group header: "Questions 153-155 refer to the following..." ─
      // Supports range on same line as "refer" OR split across two lines.
      const rangeOnlyMatch = line.match(/questions?\s+(\d{1,3})\s*[-\u2013\u2014]\s*(\d{1,3})/i);
      if (rangeOnlyMatch) {
        const range: [number, number] = [Number(rangeOnlyMatch[1]), Number(rangeOnlyMatch[2])];
        if (/refer|follow|based on|liên quan|sau đây/i.test(line)) {
          // Full header on one line
          flushQuestion();
          currentPassageLines = [];
          currentPassageQuestionRange = range;
          pendingPassageRange = null;
        } else if (!/answer|mark|choose|select|indicate|instruction|direction/i.test(line)) {
          // Range only — wait for next line to confirm
          pendingPassageRange = range;
        }
        continue;
      }

      // ── Single question passage: "Question 131 refers to the following..." ──
      const singlePassageMatch = line.match(/questions?\s+(\d{1,3})\s+refer/i);
      if (singlePassageMatch) {
        flushQuestion();
        currentPassageLines = [];
        currentPassageQuestionRange = [
          Number(singlePassageMatch[1]),
          Number(singlePassageMatch[1]),
        ];
        continue;
      }

      // ── Question start ────────────────────────────────────────────────────
      // Allow empty rest when in a passage context (Part 6 fill-in-the-blank)
      // OR when currentPart === 6 (even if passage header not detected yet)
      const inPassageContext = currentPassageQuestionRange !== null || currentPart === 6;
      const qStartMatch =
        line.match(/^(?:question\s*|c[aâ]u\s*)?(\d{1,3})\s*[).:\-]\s*(.+)$/i) ??
        line.match(/^(\d{1,3})\s{2,}(.+)$/) ??
        (inPassageContext
          ? line.match(/^(?:question\s*|c[aâ]u\s*)?(\d{1,3})\s*[).:\-]\s*()$/i)
          : null);

      if (qStartMatch) {
        const rest = (qStartMatch[2] ?? '').trim();

        // Guard: rest looks like a standalone answer key entry — skip
        if (/^[ABCD]\s*\.?\s*$/.test(rest)) {
          flushQuestion();
          wq = null;
          continue;
        }

        // Guard: whole line is an answer key block
        if (this.isLikelyAnswerKeyLine(line)) continue;

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
        // ── Ưu tiên xử lý inline options (nhiều options trên cùng 1 dòng) trước ──
        // Tránh lỗi regex optMatch bên dưới nuốt nhầm toàn bộ dòng thành option A
        const inline = this.extractInlineOptionsFromLine(line);
        if (inline.options.length > 1) {
          if (inline.stem && wq.optionsMap.size === 0) {
            wq.stemLines.push(inline.stem);
          }
          for (const option of inline.options) {
            const key = this.normalizeOptionKey(option.optionKey);
            if (!key) continue;
            // Loại bỏ passage header bị dính vào option text (nếu có)
            const cleanText = option.optionText
              .replace(/\s*Questions?\s+\d+\s*[-–]\s*\d+\s*refer.*$/i, '')
              .trim();
            wq.optionsMap.set(key, cleanText);
            wq.lastOptionKey = key;
          }
          continue;
        }

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

        // Nếu có 1 option trên dòng nhưng không match dạng chuẩn đầu dòng
        if (inline.options.length === 1) {
          if (inline.stem && wq.optionsMap.size === 0) {
            wq.stemLines.push(inline.stem);
          }

          for (const option of inline.options) {
            const key = this.normalizeOptionKey(option.optionKey);
            if (!key) continue;
            const cleanText = option.optionText
              .replace(/\s*Questions?\s+\d+\s*[-–]\s*\d+\s*refer.*$/i, '')
              .trim();
            wq.optionsMap.set(key, cleanText);
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
      } else if (currentPassageQuestionRange !== null && !this.isLikelyAnswerKeyLine(line)) {
        // ── Accumulate passage text between header and first question ────────
        currentPassageLines.push(line);
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

    // Always extract images from PDF for listening (Part 1 photos, Part 3/4 charts)
    const isListening = skillArea === 'listening' ||
      importScope === 'full_listening' ||
      ['1', '2', '3', '4'].includes(String(dto.toeic_part));

    if (isListening && isPdf) {
      this.logger.log(`[Practice] Extracting images from listening PDF...`);
      imageAssets = await this.extractImagesFromPdf(file.path, practiceSetId);
      this.logger.log(`[Practice] Extracted ${imageAssets.length} image(s) from PDF.`);
    }

    if (parsed.length === 0 && isListening && isPdf) {
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
          readingPassage: null,
        });
      }
    } else if (parsed.length === 0) {
      throw new BadRequestException('Không phân tích được câu hỏi nào từ file. Vui lòng đảm bảo cấu trúc: Mỗi câu phải bắt đầu bằng số thứ tự (vd: 101.) và có đủ đáp án A, B, C, D in hoa.');
    }

    const difficultyLabel = this.deriveDifficultyLabel(dto.score_band_max);

    const targetParts =
      importScope === 'single_part'
        ? [dto.toeic_part ?? 0]
        : importScope === 'full_reading'
          ? [5, 6, 7]
          : [1, 2, 3, 4];

    const seenInCurrentBatch = new Set<string>();

    // Dedup chỉ trong cùng 1 batch — không check DB cũ để tránh block câu khác bộ đề.

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

    // Separate Part 1 photos from Part 3/4 graphics using estimated_part from Python extractor
    const part1Images = imageAssets
      .filter(img => img.estimated_part === 1)
      .sort((a, b) => {
        if (a.page !== b.page) return (a.page || 0) - (b.page || 0);
        return (a.filename || '').localeCompare(b.filename || '');
      });

    const part34Images = imageAssets
      .filter(img => img.estimated_part !== 1)
      .sort((a, b) => {
        if (a.page !== b.page) return (a.page || 0) - (b.page || 0);
        return (a.filename || '').localeCompare(b.filename || '');
      });

    // Backward-compat: if estimated_part is missing (old extractor), use size heuristic
    const bestImages = part1Images.length > 0
      ? part1Images.slice(0, 6)
      : [...imageAssets]
          .filter(img => (img.size_bytes || 0) > 10000)
          .sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0))
          .slice(0, 6)
          .sort((a, b) => {
            if (a.page !== b.page) return (a.page || 0) - (b.page || 0);
            return (a.filename || '').localeCompare(b.filename || '');
          });

    // ── Phase 1: Analyze file characteristics ──────────────────────────────────
    const fileInfo = this.analyzeFileCharacteristics(rawText, parsed);
    this.logger.log(`[Import] File analysis: ${JSON.stringify(fileInfo)}`);

    if (importScope === 'single_part' && fileInfo.likelyFullTest) {
      this.logger.warn(
        `[Import] File có vẻ là full test nhưng scope=single_part(Part ${dto.toeic_part}). ` +
        `Sẽ lọc theo detectedPart để đảm bảo độ chính xác.`
      );
    }

    // ── Phase 2: Filter placeholder Listening lines ─────────────────────────────
    const LISTENING_PLACEHOLDER = /mark your answer on your answer sheet/i;
    parsed = parsed.filter((q) => !LISTENING_PLACEHOLDER.test(q.stem));

    // ── Phase 3: Pre-filter irrelevant section (Listening/Reading) for Full Test files
    // This ensures `sourceList` only contains the relevant half of the test,
    // making skipped counts much more intuitive to the user.
    let sourceList = parsed;
    if (fileInfo.likelyFullTest) {
      const isTargetReading = skillArea === 'reading';
      sourceList = parsed.filter((q) => {
        const num = typeof q.questionNumber === 'number' ? q.questionNumber : 0;
        
        if (isTargetReading) {
          // Reject explicitly marked Listening parts or questions 1-100
          if (q.detectedPart !== null && q.detectedPart >= 1 && q.detectedPart <= 4) return false;
          if (fileInfo.hasListeningTest && fileInfo.hasReadingTest && num >= 1 && num <= 100) return false;
        } else {
          // isTargetListening: Reject explicitly marked Reading parts or questions 101-200
          if (q.detectedPart !== null && q.detectedPart >= 5 && q.detectedPart <= 7) return false;
          if (fileInfo.hasListeningTest && fileInfo.hasReadingTest && num >= 101 && num <= 200) return false;
        }
        
        return true;
      });
    }

    const totalReadingQuestions =
      skillArea === 'reading' ? sourceList.length : parsed.length;

    this.logger.log(
      `[Import] scope=${importScope} sourceList=${sourceList.length} totalReading=${totalReadingQuestions}`,
    );

    for (let index = 0; index < sourceList.length; index += 1) {
      const pq = sourceList[index];
      const part = this.resolvePartForQuestionV2(pq, index, dto, importScope, fileInfo, totalReadingQuestions);
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
        if (skillArea === 'listening' || (part >= 1 && part <= 4)) {
          // Auto-inject missing options for Listening tests (Parts 1 & 2 often have no text options printed)
          const isPart2 = part === 2;
          const optKeys = isPart2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
          pq.options = optKeys.map(k => ({
            optionKey: k,
            optionText: `(${k})`,
            isCorrect: false
          }));
          if (!pq.stem || pq.stem.length < 3) {
            pq.stem = `[Part ${part} - Câu ${questionNumber}]`;
          }
        } else {
          this.logger.debug(
            `Skipping question #${String(pq.questionNumber ?? index + 1)} [P${part}]: < 2 options`,
          );
          skippedCount++;
          continue;
        }
      }

      const fingerprint = this.buildQuestionFingerprint(part, pq.stem, pq.options);
      if (seenInCurrentBatch.has(fingerprint)) {
        skippedCount += 1;
        skippedDuplicates.push({
          question_number: questionNumber,
          part,
          existing_question_id: null,
          reason: 'duplicate_in_uploaded_file',
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
            reading_passage: part >= 6 ? (pq.readingPassage ?? null) : null,
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
      `[Import] Complete — set=${practiceSetId} imported=${importedCount} skipped=${skippedCount} ` +
      `parts=${[...detectedParts].sort((a, b) => a - b).join(',')}`,
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
      extracted_image_count: imageAssets.length,
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
        url_path: `certificate/TOEIC/toeic-listening-practice/${slug}/images/${img.filename}`,
        page: img.page,
        width: img.width,
        height: img.height,
        size_bytes: img.size_bytes,
        estimated_part: img.estimated_part ?? null,
        part_hint: img.part_hint,
        question_number: img.question_number,
      }));
    } catch { return []; }
  }

  // ── Import Images from Separate PDF for Existing Practice Set ────────────────
  async importPracticeImagesFromPdf(
    practiceSetId: string,
    file: Express.Multer.File,
  ): Promise<{
    practice_set_id: string;
    extracted_count: number;
    part1_mapped: number;
  }> {
    const slug = practiceSetId.trim();
    if (!slug) {
      throw new BadRequestException('Vui lòng cung cấp practice_set_id.');
    }

    const ext = extname(file.originalname || file.path).toLowerCase();
    if (ext !== '.pdf') {
      throw new BadRequestException('Chỉ hỗ trợ file PDF cho trích xuất hình ảnh.');
    }

    // Extract images
    const imageAssets = await this.extractImagesFromPdf(file.path, slug);
    this.logger.log(`[ImportImages] Extracted ${imageAssets.length} image(s) for slug "${slug}".`);

    if (imageAssets.length === 0) {
      return { practice_set_id: slug, extracted_count: 0, part1_mapped: 0 };
    }

    // Load existing questions
    const questions = await this.prisma.toeicPracticeQuestion.findMany({
      where: { source_slug: slug },
      select: { id: true, source_item_id: true, part: true, context_image: true },
    });

    // Part 1 images: assign to Part 1 questions that don't have images yet
    const part1Images = imageAssets
      .filter(img => img.estimated_part === 1)
      .sort((a: any, b: any) => {
        if (a.page !== b.page) return (a.page || 0) - (b.page || 0);
        return (a.filename || '').localeCompare(b.filename || '');
      });

    const part1Questions = questions
      .filter(q => q.part === 1 && !q.context_image)
      .sort((a, b) => (a.source_item_id ?? 0) - (b.source_item_id ?? 0));

    let part1Mapped = 0;
    for (let i = 0; i < Math.min(part1Images.length, part1Questions.length); i++) {
      const img = part1Images[i];
      const q = part1Questions[i];
      const imageUrl = `/uploads/${(img.url_path || img.url || '').replace(/\\/g, '/')}`;
      await this.prisma.toeicPracticeQuestion.update({
        where: { id: q.id },
        data: { context_image: imageUrl },
      });
      part1Mapped++;
    }

    this.logger.log(`[ImportImages] Part 1 mapped: ${part1Mapped} image(s). Total extracted: ${imageAssets.length}.`);

    return {
      practice_set_id: slug,
      extracted_count: imageAssets.length,
      part1_mapped: part1Mapped,
    };
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
    certService?: { parseToeicAnswerKeyFromFile: (file: Express.Multer.File, skillArea: string | null) => Promise<Map<number, ToeicOptionKey>> },
  ): Promise<ToeicPracticeAnswerKeyImportResponseDto> {
    void accountId;

    if (!file) {
      throw new BadRequestException('Vui lòng chọn file đáp án.');
    }

    const practiceSetId = dto.practice_set_id.trim();
    if (!practiceSetId) {
      throw new BadRequestException('practice_set_id là bắt buộc.');
    }

    // Use the robust parser from CertificateEnrollmentService if available (same as diagnostic import)
    let answerMap: Map<number, ToeicOptionKey>;
    if (certService) {
      this.logger.log(`[AnswerKey] Using CertificateEnrollmentService parser (robust OCR + multi-format).`);
      answerMap = await certService.parseToeicAnswerKeyFromFile(file, null);
      this.logger.log(`[AnswerKey] Parsed ${answerMap.size} answer pairs via certService. Sample: ${JSON.stringify([...answerMap.entries()].slice(0, 10))}`);
    } else {
      // Fallback to built-in parser
      let rawText = await this.extractText(file);
      this.logger.log(`[AnswerKey] Extracted text length: ${rawText.length}, first 500 chars:\n${rawText.substring(0, 500)}`);

      const ext = extname(file.originalname || file.path).toLowerCase();
      if ((!rawText.trim() || rawText.trim().length < 10) && ext === '.pdf') {
        this.logger.log(`[AnswerKey] PDF text empty/short, attempting OCR fallback...`);
        try {
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng');
          try {
            const result = await worker.recognize(file.path);
            const ocrText = String(result?.data?.text ?? '');
            if (ocrText.trim().length > rawText.trim().length) {
              rawText = ocrText;
              this.logger.log(`[AnswerKey] OCR fallback yielded ${ocrText.length} chars.`);
            }
          } finally {
            await worker.terminate();
          }
        } catch (err) {
          this.logger.warn(`[AnswerKey] OCR fallback failed: ${String(err)}`);
        }
      }

      if (!rawText.trim()) {
        throw new BadRequestException('File đáp án không chứa nội dung.');
      }

      answerMap = this.extractAnswerKeyMap(rawText);
      this.logger.log(`[AnswerKey] Parsed ${answerMap.size} answer pairs. Sample: ${JSON.stringify([...answerMap.entries()].slice(0, 10))}`);
    }

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
    image_mapped_count: number;
  }> {
    const { practice_set_id } = dto;

    if (!practice_set_id?.trim()) {
      throw new BadRequestException('Vui lòng cung cấp practice_set_id.');
    }

    const slug = practice_set_id.trim();
    const audioAbsDir = absoluteUploadsDir(
      'certificate',
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
      transcript_hint: c.transcript_hint ?? '',
    }));

    // Auto-map: update context_audio on ToeicPracticeQuestion rows
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

    // ── LLM Image Mapping: map Part 3/4 images to questions ─────────────────
    let imageMappedCount = 0;
    try {
      imageMappedCount = await this.mapPart34ImagesToQuestions(slug, chunks);
    } catch (err) {
      this.logger.warn(
        `[chunkPracticeAudio] LLM image mapping failed (non-blocking): ${String(err)}`,
      );
    }

    return {
      practice_set_id: slug,
      total_chunks: chunks.length,
      auto_mapped_count: autoMappedCount,
      image_mapped_count: imageMappedCount,
    };
  }

  // ── LLM Image-to-Question Mapping for Part 3/4 ─────────────────────────────

  /**
   * After audio chunking, use OpenRouter vision LLM to map Part 3/4 images
   * (charts, maps, schedules, etc.) to the correct question groups.
   *
   * Flow:
   *   1. Read existing images from the practice set's images/ folder
   *   2. Build question context from DB (with transcript hints from chunks)
   *   3. Call OpenRouter to analyze each Part 3/4 image
   *   4. Update context_image on the matched ToeicPracticeQuestion rows
   */
  private async mapPart34ImagesToQuestions(
    slug: string,
    chunks: Array<{
      filename: string;
      url: string;
      part: number;
      question_number: number;
      transcript_hint: string;
    }>,
  ): Promise<number> {
    if (!this.openRouterService.isAvailable()) {
      this.logger.debug('OpenRouter not configured — skipping Part 3/4 image mapping.');
      return 0;
    }

    // 1. Find Part 3/4 images on disk
    const imagesDir = absoluteUploadsDir(
      'certificate', 'TOEIC', 'toeic-listening-practice', slug, 'images',
    );

    if (!existsSync(imagesDir)) {
      this.logger.debug(`No images directory found for slug "${slug}".`);
      return 0;
    }

    const allFiles: string[] = readdirSync(imagesDir)
      .filter((f: string) => /\.(webp|png|jpg|jpeg)$/i.test(f))
      .sort();

    if (allFiles.length === 0) return 0;

    // 2. Load questions from DB to know which have images already and which are Part 3/4
    const questions = await this.prisma.toeicPracticeQuestion.findMany({
      where: { source_slug: slug },
      select: { id: true, source_item_id: true, part: true, stem: true, context_image: true },
    });

    const qNumToId = new Map<number, number>();
    for (const q of questions) {
      if (typeof q.source_item_id === 'number') {
        qNumToId.set(q.source_item_id, q.id);
      }
    }

    // Build transcript hint map from chunks
    const transcriptByQNum = new Map<number, string>();
    for (const chunk of chunks) {
      if (chunk.transcript_hint) {
        transcriptByQNum.set(chunk.question_number, chunk.transcript_hint);
      }
    }

    // Build question context for LLM
    const questionContexts: QuestionContext[] = questions
      .filter(q => q.part === 3 || q.part === 4)
      .map(q => ({
        question_number: q.source_item_id ?? 0,
        part: q.part ?? 3,
        stem: q.stem,
        transcript_hint: transcriptByQNum.get(q.source_item_id ?? 0) ?? '',
      }))
      .filter(q => q.question_number > 0);

    if (questionContexts.length === 0) {
      this.logger.debug('No Part 3/4 questions found — skipping image mapping.');
      return 0;
    }

    // 3. Identify images that are NOT already mapped (Part 1 images are already assigned)
    // Read a simple metadata file or infer from filename pattern
    const unmappedImages: ImageAssetForMapping[] = [];
    const imagesRelDir = `certificate/TOEIC/toeic-listening-practice/${slug}/images`;

    // Questions that already have context_image set (Part 1)
    const alreadyMappedFiles = new Set<string>();
    for (const q of questions) {
      if (q.context_image) {
        const parts = q.context_image.replace(/\\/g, '/').split('/');
        alreadyMappedFiles.add(parts[parts.length - 1]);
      }
    }

    for (const filename of allFiles) {
      if (alreadyMappedFiles.has(filename)) continue; // already assigned to Part 1

      const absPath = join(imagesDir, filename);
      let sizeBytes = 0;
      try {
        const stat = statSync(absPath);
        sizeBytes = stat.size;
      } catch { /* ignore */ }

      // Extract page number from filename pattern: {slug}_p{NNN}_img{NN}.webp
      const pageMatch = filename.match(/_p(\d+)_/);
      const page = pageMatch ? parseInt(pageMatch[1], 10) : 0;

      unmappedImages.push({
        filename,
        abs_path: absPath,
        url_path: `${imagesRelDir}/${filename}`,
        page,
        width: 0,
        height: 0,
        size_bytes: sizeBytes,
        estimated_part: 3,
      });
    }

    if (unmappedImages.length === 0) {
      this.logger.debug('No unmapped Part 3/4 images found.');
      return 0;
    }

    this.logger.log(
      `[ImageMapping] Found ${unmappedImages.length} unmapped image(s) for slug "${slug}". ` +
      `Calling OpenRouter to map to ${questionContexts.length} Part 3/4 questions...`,
    );

    // 4. Call OpenRouter LLM
    const result = await this.openRouterService.mapImagesToQuestions(
      unmappedImages,
      questionContexts,
    );

    if (result.error) {
      this.logger.warn(`[ImageMapping] OpenRouter error: ${result.error}`);
    }

    // 5. Apply mappings to DB
    let mappedCount = 0;
    for (const mapping of result.mappings) {
      if (mapping.question_numbers.length === 0 || mapping.confidence < 0.3) continue;

      const imageUrl = `/uploads/certificate/TOEIC/toeic-listening-practice/${slug}/images/${mapping.image_filename}`;

      for (const qNum of mapping.question_numbers) {
        const questionId = qNumToId.get(qNum);
        if (!questionId) continue;

        await this.prisma.toeicPracticeQuestion.update({
          where: { id: questionId },
          data: { context_image: imageUrl },
        });
        mappedCount++;
      }

      this.logger.log(
        `  ${mapping.image_filename} → Q${mapping.question_numbers.join(',')} ` +
        `(${mapping.description}, confidence=${mapping.confidence})`,
      );
    }

    this.logger.log(
      `[ImageMapping] Mapped ${mappedCount} question(s) with Part 3/4 images via ${result.model_used}.`,
    );

    return mappedCount;
  }
}
