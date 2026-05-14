import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { extname, basename, join, resolve } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IeltsOcrImportDto,
  IeltsOcrImportResponseDto,
  IeltsAnswerKeyImportDto,
  IeltsAnswerKeyImportResponseDto,
  IeltsListeningAudioUploadDto,
  IeltsListeningAudioUploadResponseDto,
  IeltsRepositoryListItemDto,
  IeltsRepositoryDeleteResponseDto,
  IeltsPracticeImportDto,
  IeltsPracticeImportResponseDto,
} from './dto/ielts-import.dto';
import { IrtRefinementService } from '../../ielts-repository/services/irt-refinement.service';
import { extractTextFromFile } from './ielts-extract-text';

// ─────────────────────────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedIeltsOption {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  rationale: string | null;
}

interface ParsedIeltsQuestion {
  questionNumber: number | null;
  section: number | null;
  stem: string;
  context: string | null;
  questionType: 'mcq' | 'fill-blank' | 'true-false' | 'matching' | 'short-answer';
  options: ParsedIeltsOption[];
  explanation: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Answer-key extraction
// ─────────────────────────────────────────────────────────────────────────────

type IeltsAnswerKey = string;

function extractAnswerKeyMap(rawText: string): Map<number, IeltsAnswerKey> {
  // Step 1: Clean OCR noise from answer sheet
  const cleaned = cleanOcrText(rawText);

  const map = new Map<number, IeltsAnswerKey>();
  const lines = cleaned
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  let inAnswerSection = false;

  for (const line of lines) {
    // Detect start of answer section if keywords exist
    if (/\b(answer\s*key|đáp\s*án|dap\s*an|keys|listening\s*answers|reading\s*answers)\b/i.test(line)) {
      inAnswerSection = true;
      continue;
    }

    // Robust pattern for pairs: "1. B", "1 B", "1 TRUE", "Q1 - A"
    const pairRe =
      /\b(\d{1,3})\s*[.):\-–]?\s*(TRUE|FALSE|NOT\s*GIVEN|NG|[A-E])\b/gi;

    const pairs = Array.from(line.matchAll(pairRe));
    if (pairs.length === 0) continue;

    for (const pair of pairs) {
      const num = parseInt(pair[1], 10);
      let ans = pair[2].toUpperCase().trim();
      if (ans === 'NG') ans = 'NOT GIVEN';

      // Basic validation (question numbers are usually 1-40 or 1-100)
      if (num >= 1 && num <= 200) {
        map.set(num, ans);
      }
    }
  }

  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// OCR noise cleaner
// Removes common OCR artifacts from scanned IELTS PDFs:
//  - Barcode / watermark garbage at top of page
//  - Page numbers standing alone
//  - "CONFIDENTIAL", "Test 1", exam metadata lines
// ─────────────────────────────────────────────────────────────────────────────

function cleanOcrText(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const cleaned: string[] = [];
  let consecutiveNoise = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines (but keep structure)
    if (trimmed.length === 0) {
      cleaned.push('');
      continue;
    }

    // ── Noise patterns ──────────────────────────────────────────────────────
    const isNoise =
      // Very short lines that are pure symbols/numbers (barcodes, page numbers)
      (trimmed.length <= 6 && /^[\d\s\W]+$/.test(trimmed)) ||
      // Barcode / exam header junk: random uppercase with no vowels or mostly consonants
      (/^[A-Z\s#\d.()]+$/.test(trimmed) &&
        trimmed.length < 40 &&
        !/\b(READING|LISTENING|PASSAGE|SECTION|QUESTION|TRUE|FALSE)\b/.test(trimmed) &&
        (trimmed.replace(/[^A-Z]/g, '').length > 0
          ? (trimmed.replace(/[AEIOU]/g, '').length / trimmed.replace(/[^A-Z]/g, '').length) > 0.75
          : false)) ||
      // Standalone page number
      /^\d{1,3}$/.test(trimmed) ||
      // Test metadata lines
      /^(Test\s+\d|Rittrint|ERSRIRINATE|Sik\s+w|Oss\s+\d|#\d{6,})/i.test(trimmed) ||
      // "Do not turn..." instruction noise
      /^(do not|please turn|time allowed|general training|academic)/i.test(trimmed);

    if (isNoise) {
      consecutiveNoise++;
      // Allow up to 3 consecutive noise lines before stopping (avoid eating real content)
      if (consecutiveNoise <= 3) continue;
    } else {
      consecutiveNoise = 0;
    }

    cleaned.push(trimmed);
  }

  return cleaned.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// IELTS Section detection helpers
// ─────────────────────────────────────────────────────────────────────────────

function detectIeltsSection(line: string): number | null {
  const sectionMatch = /^(?:SECTION|Section)\s*([1-4])\b/i.exec(line);
  if (sectionMatch) return parseInt(sectionMatch[1], 10);

  const passageMatch = /^(?:READING\s*PASSAGE|PASSAGE)\s*([1-3])\b/i.exec(line);
  if (passageMatch) return parseInt(passageMatch[1], 10);

  return null;
}

function detectQuestionType(
  stem: string,
  context: string = '',
): ParsedIeltsQuestion['questionType'] {
  const combined = `${stem} ${context}`.toLowerCase();
  if (/true|false|not\s*given/i.test(combined)) return 'true-false';
  if (/complete|fill\s*in|no\s*more\s*than|one\s*word|word(?:s)?\s*(?:and\/or\s*a?\s*number)?/i.test(combined)) return 'fill-blank';
  if (/match|which\s+paragraph|which\s+section|which\s+letter/i.test(combined)) return 'matching';
  if (/write\s+(?:a\s+)?(?:word|number|name)|short\s+answer/i.test(combined)) return 'short-answer';
  return 'mcq';
}

// ─────────────────────────────────────────────────────────────────────────────
// Core IELTS question parser  (v2 — improved for OCR scan output)
// ─────────────────────────────────────────────────────────────────────────────

function parseIeltsQuestionsFromText(
  rawText: string,
  skillArea: 'listening' | 'reading',
): ParsedIeltsQuestion[] {

  // Step 1: Clean OCR noise before any parsing
  const cleaned = cleanOcrText(rawText);

  const normalized = cleaned
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\f\v]+/g, ' ')
    .trim();

  if (!normalized) return [];

  const lines = normalized
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  const answerKeyMap = extractAnswerKeyMap(normalized);

  // ── Regex patterns ────────────────────────────────────────────────────────

  /** "Questions X–Y  Complete the notes …" */
  const RANGE_RE = /^Questions?\s+(\d{1,3})\s*[-–]\s*(\d{1,3})/i;

  /** "A. text" / "A) text" / "A text" — supports space-only separator and A-E options */
  const OPT_RE = /^([A-E])(?:[.):\-]\s*|\s+)(.{2,})$/i;

  /** Inline options on one line: "A. foo B. bar C. baz D. qux" */
  const INLINE_MARKER_RE = /(?:^|(?<=[\s(]))([A-D])[).:\-]\s*/g;

  // ── State ─────────────────────────────────────────────────────────────────

  const questions: ParsedIeltsQuestion[] = [];
  let currentSection = 1;
  let contextBuffer: string[] = [];
  let passageRange: [number, number] | null = null;
  let passageLines: string[] = [];

  // Track the highest question number seen so far to avoid duplicates
  // from false-positive matches
  let lastQNum = 0;

  interface WorkingQ {
    questionNumber: number | null;
    section: number;
    stemLines: string[];
    optionsMap: Map<string, string>;
    questionType: ParsedIeltsQuestion['questionType'];
    inlineAnswer: string | null;
    lastOptKey: string | null;
  }

  let wq: WorkingQ | null = null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function extractInlineOptions(line: string): { stem: string; options: Array<{ key: string; text: string }> } {
    const markers = Array.from(line.matchAll(INLINE_MARKER_RE));
    if (markers.length < 2) return { stem: line.trim(), options: [] };

    const stem = line.slice(0, markers[0].index ?? 0).trim();
    const options: Array<{ key: string; text: string }> = [];

    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const next = markers[i + 1];
      const start = (marker.index ?? 0) + marker[0].length;
      const end = next?.index ?? line.length;
      const text = line.slice(start, end).replace(/\s+/g, ' ').trim();
      if (text) options.push({ key: marker[1].toUpperCase(), text });
    }

    return { stem, options };
  }

  function buildOptions(map: Map<string, string>): ParsedIeltsOption[] {
    return ['A', 'B', 'C', 'D']
      .filter((k) => map.has(k))
      .map((k) => ({
        optionKey: k,
        optionText: map.get(k)!.trim(),
        isCorrect: false,
        rationale: null,
      }))
      .filter((o) => o.optionText.length > 0);
  }

  function resolvePassage(): string | null {
    if (passageLines.length > 0) {
      return passageLines.join('\n').trim() || null;
    }
    return contextBuffer.slice(-30).join('\n').trim() || null;
  }

  function flushQuestion(): void {
    if (!wq) return;

    const stem = wq.stemLines.join(' ').replace(/\s+/g, ' ').trim()
      || `[Câu ${wq.questionNumber ?? '?'}]`;

    let options = buildOptions(wq.optionsMap);

    const correctKey =
      wq.inlineAnswer ??
      (typeof wq.questionNumber === 'number'
        ? answerKeyMap.get(wq.questionNumber) ?? null
        : null);

    if (correctKey) {
      const found = options.find((o) => o.optionKey === correctKey);
      if (found) found.isCorrect = true;
    }

    // Synthesise True/False/Not Given options
    if (wq.questionType === 'true-false' && options.length === 0) {
      const tfKeys = ['TRUE', 'FALSE', 'NOT GIVEN'];
      options = tfKeys.map((k) => ({
        optionKey: k,
        optionText: k,
        isCorrect: k === correctKey,
        rationale: null,
      }));
    }

    // Fallback T/F from context
    if (options.length === 0 && wq.questionNumber !== null) {
      const ctx = contextBuffer.slice(-10).join(' ');
      if (/true|false|not\s*given/i.test(ctx)) {
        wq.questionType = 'true-false';
        const tfKeys = ['TRUE', 'FALSE', 'NOT GIVEN'];
        options = tfKeys.map((k) => ({
          optionKey: k,
          optionText: k,
          isCorrect: k === correctKey,
          rationale: null,
        }));
      }
    }

    // Placeholder for fill-blank / short-answer
    if (
      (wq.questionType === 'fill-blank' || wq.questionType === 'short-answer') &&
      options.length === 0
    ) {
      options = [
        {
          optionKey: 'A',
          optionText: correctKey ?? '(blank)',
          isCorrect: !!correctKey,
          rationale: null,
        },
      ];
    }

    if (options.length === 0) {
      wq = null;
      return;
    }

    questions.push({
      questionNumber: wq.questionNumber,
      section: wq.section,
      stem,
      context: resolvePassage(),
      questionType: wq.questionType,
      options,
      explanation: null,
    });

    wq = null;
  }

  /**
   * Try to match a question start from a line.
   * Returns { qNum, rest } or null.
   *
   * FIX: Handles single-space separator from OCR output.
   * Guards:
   *  - Number > 200 → skip
   *  - Year-like (1800–2099) → skip unless in a passage context
   *  - Sequence check: qNum must be > lastQNum - 5 (allow slight reorder from OCR)
   *    AND qNum <= lastQNum + 15 (avoid large jumps from prose numbers)
   *    UNLESS lastQNum === 0 (first question)
   */
  function tryMatchQuestion(line: string): { qNum: number; rest: string } | null {
    // FIX: Simplified permissive regex that handles single-space and various delimiters
    const Q_START_RE = /^(?:Q(?:uestion)?\.?\s*)?(\d{1,3})(?:[.):\-–]\s*|\s+)(.*)$/i;

    const m = Q_START_RE.exec(line);
    if (m) {
      const qNum = parseInt(m[1], 10);
      const rest = (m[2] ?? '').trim();
      if (!isValidQuestionNum(qNum, rest)) return null;
      return { qNum, rest };
    }

    return null;
  }

  function isValidQuestionNum(qNum: number, rest: string): boolean {
    if (qNum < 1 || qNum > 200) return false;
    // Skip if looks like an answer key entry: rest is just "A", "B", "C", "D"
    if (/^[ABCD]\s*\.?\s*$/.test(rest)) return false;
    // Skip year-like numbers unless very small
    if (qNum >= 1800 && qNum <= 2099) return false;
    // Sequence guard: allow first question freely, then enforce monotonic-ish order
    if (lastQNum > 0) {
      if (qNum < lastQNum - 2) return false;   // Going backwards more than 2 = false positive
      if (qNum > lastQNum + 15) return false;  // Jumping forward more than 15 = likely prose number
    }
    return true;
  }

  // ── Line-by-line parse ────────────────────────────────────────────────────

  for (const line of lines) {

    // ── Section / Passage header ─────────────────────────────────────────
    const sectionNum = detectIeltsSection(line);
    if (sectionNum !== null) {
      flushQuestion();
      currentSection = sectionNum;
      passageLines = [];
      passageRange = null;
      contextBuffer = [];
      continue;
    }

    // ── Question range header: "Questions 14–17 Complete the summary …" ──
    const rangeMatch = RANGE_RE.exec(line);
    if (rangeMatch) {
      const r: [number, number] = [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)];
      if (/refer|follow|based on|passage|text/i.test(line)) {
        flushQuestion();
        passageLines = [];
        passageRange = r;
      } else {
        contextBuffer.push(line);
        passageRange = r;
        // If this is a new question group, update lastQNum sentinel
        if (lastQNum === 0 || r[0] > lastQNum) {
          lastQNum = Math.max(0, r[0] - 1);
        }
      }
      continue;
    }

    // ── Answer-key line (skip) ────────────────────────────────────────────
    if (isAnswerKeyLine(line)) continue;

    // ── Question start ────────────────────────────────────────────────────
    const qMatch = tryMatchQuestion(line);

    if (qMatch) {
      const { qNum, rest } = qMatch;

      const inline = extractInlineOptions(rest);
      flushQuestion();

      lastQNum = qNum;

      wq = {
        questionNumber: qNum,
        section: currentSection,
        stemLines: inline.stem ? [inline.stem] : [],
        optionsMap: new Map(),
        questionType: detectQuestionType(
          rest || '',
          contextBuffer.slice(-10).join(' '),
        ),
        inlineAnswer: null,
        lastOptKey: null,
      };

      for (const { key, text } of inline.options) {
        wq.optionsMap.set(key, text);
        wq.lastOptKey = key;
      }

      continue;
    }

    // ── Lines within a working question ──────────────────────────────────
    if (wq) {
      const inline = extractInlineOptions(line);
      if (inline.options.length >= 2) {
        if (inline.stem && wq.optionsMap.size === 0) wq.stemLines.push(inline.stem);
        for (const { key, text } of inline.options) {
          wq.optionsMap.set(key, text);
          wq.lastOptKey = key;
        }
        continue;
      }

      const optMatch = OPT_RE.exec(line);
      if (optMatch) {
        const key = optMatch[1].toUpperCase();
        const text = optMatch[2].trim();
        if (text) {
          wq.optionsMap.set(key, text);
          wq.lastOptKey = key;
        }
        continue;
      }

      const ansMatch = /^(?:answer|correct|đáp\s*án)\s*[:\-]\s*([A-D]|TRUE|FALSE|NOT\s*GIVEN)/i.exec(line);
      if (ansMatch) {
        wq.inlineAnswer = ansMatch[1].toUpperCase();
        flushQuestion();
        continue;
      }

      if (/^(?:explanation|giải\s*thích)\s*[:\-]/i.test(line)) {
        flushQuestion();
        continue;
      }

      if (wq.lastOptKey && wq.optionsMap.size > 0 && isLikelyContinuation(line)) {
        const prev = wq.optionsMap.get(wq.lastOptKey) ?? '';
        wq.optionsMap.set(wq.lastOptKey, `${prev} ${line}`.replace(/\s+/g, ' ').trim());
        continue;
      }

      if (wq.optionsMap.size === 0) {
        wq.stemLines.push(line);
      }
    } else {
      if (passageRange !== null && !isAnswerKeyLine(line)) {
        passageLines.push(line);
      } else if (
        line.length > 10 &&
        !/^(directions?|instructions?|note:|example|do not|please turn)/i.test(line)
      ) {
        contextBuffer.push(line);
        if (contextBuffer.length > 30) contextBuffer.shift();
      }
    }
  }

  flushQuestion();
  return questions;
}

/** Heuristic: is this line a pure answer-key block? */
function isAnswerKeyLine(line: string): boolean {
  if (/[.…]{3,}/.test(line)) return false;

  const re = /\b\d{1,3}\s*[).:\-]?\s*(?:[ABCD]|TRUE|FALSE|NOT\s*GIVEN)\b/gi;
  const matches = line.match(re) ?? [];
  if (matches.length === 0) return false;
  const residue = line.replace(re, ' ').replace(/[\s,.;:()\-_/]+/g, '').trim();
  if (residue.length > 0) return false;
  return matches.length >= 2 || (matches.length === 1 && line.length <= 20);
}

/** Heuristic: is this line a continuation of an option text? */
function isLikelyContinuation(line: string): boolean {
  return (
    /^[a-z(]/.test(line) ||
    /^(and|or|to|for|of|with|in|on|at|from|that|which|who|where|when)\b/i.test(line)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class IeltsImportService {
  private readonly logger = new Logger(IeltsImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly irtRefinement: IrtRefinementService,
  ) { }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapPlacementType(type: ParsedIeltsQuestion['questionType']): string {
    switch (type) {
      case 'mcq': return 'mcq';
      case 'fill-blank': return 'gap_fill';
      case 'true-false': return 'true_false_ng';
      case 'matching': return 'matching_features';
      case 'short-answer': return 'short_answer';
      default: return 'mcq';
    }
  }

  async importPractice(
    accountId: number,
    dto: IeltsPracticeImportDto,
    file: Express.Multer.File,
  ): Promise<IeltsPracticeImportResponseDto> {
    if (!file) throw new BadRequestException('File là bắt buộc.');

    const skillArea = this.resolveSkillArea(dto.skill_area, file.originalname);
    const rawText = await extractTextFromFile(file);

    if (!rawText || rawText.trim().length < 20) {
      throw new BadRequestException(
        'Không trích xuất được văn bản từ file.',
      );
    }

    const parsedQuestions = parseIeltsQuestionsFromText(rawText, skillArea);

    this.logger.log(`[DEBUG] OCR/Text length: ${rawText.length}`);
    this.logger.log(`[DEBUG] Raw preview: ${rawText.substring(0, 300)}`);
    this.logger.log(`[DEBUG] Parsed questions count: ${parsedQuestions.length}`);

    if (parsedQuestions.length === 0) {
      const cleanedPreview = cleanOcrText(rawText).substring(0, 400);
      this.logger.warn(`[DEBUG] Cleaned text preview: ${cleanedPreview}`);

      throw new BadRequestException(
        'Không phân tích được câu hỏi từ file. ' +
        `Preview: ${rawText.substring(0, 100)}...`,
      );
    }

    const slug = `ielts-practice-${skillArea}-${dto.band_min ?? 0}-${dto.band_max ?? 9}-${Date.now()}`;
    const title = `IELTS ${this.capitalise(skillArea)} Practice (Band ${dto.band_min ?? 0}–${dto.band_max ?? 9})`;

    const repository = await this.prisma.examRepository.create({
      data: {
        cert_type: 'ielts',
        title,
        slug,
        content_type: 'practice_question',
        skill_area: skillArea,
        is_published: false,
        total_items: 0,
        metadata: {
          source: 'practice_import',
          source_file: basename(file.originalname || file.path),
          created_by: accountId,
          band_min: dto.band_min,
          band_max: dto.band_max,
        },
      },
      select: { id: true, slug: true },
    });

    const { importedCount, skippedCount } = await this.saveQuestionsToRepositoryAndPlacement(
      repository.id,
      skillArea,
      parsedQuestions,
      {
        source: 'practice_import',
        filename: file.originalname || file.path,
        accountId,
        bandMin: dto.band_min ?? 4.0,
        bandMax: dto.band_max ?? 9.0,
      },
    );

    await this.prisma.examRepository.update({
      where: { id: repository.id },
      data: { total_items: importedCount },
    });

    return {
      slug: repository.slug,
      imported_count: importedCount,
      skipped_count: skippedCount,
      total_detected: parsedQuestions.length,
      skill_area: skillArea,
      band_min: dto.band_min,
      band_max: dto.band_max,
      source_filename: basename(file.originalname || file.path),
    };
  }

  async importFromOcrFile(
    accountId: number,
    dto: IeltsOcrImportDto,
    file: Express.Multer.File,
  ): Promise<IeltsOcrImportResponseDto> {
    if (!file) throw new BadRequestException('File PDF là bắt buộc.');

    const skillArea = this.resolveSkillArea(dto.skill_area, file.originalname);
    const rawText = await extractTextFromFile(file);

    if (!rawText || rawText.trim().length < 20) {
      throw new BadRequestException(
        'Không trích xuất được đủ văn bản từ file.',
      );
    }

    const parsedQuestions = parseIeltsQuestionsFromText(rawText, skillArea);

    this.logger.log(`[DEBUG] OCR/Text length: ${rawText.length}`);
    this.logger.log(`[DEBUG] Raw preview: ${rawText.substring(0, 300)}`);
    this.logger.log(`[DEBUG] Parsed questions count: ${parsedQuestions.length}`);

    if (parsedQuestions.length === 0) {
      const cleanedPreview = cleanOcrText(rawText).substring(0, 400);
      this.logger.warn(`[DEBUG] Cleaned text preview: ${cleanedPreview}`);

      throw new BadRequestException(
        'Không phân tích được câu hỏi từ file. ' +
        `Preview: ${rawText.substring(0, 100)}...`,
      );
    }

    const repository = await this.prisma.examRepository.upsert({
      where: { slug: dto.repository_slug.trim() },
      create: {
        cert_type: 'ielts',
        title: dto.repository_title?.trim() || dto.repository_slug.trim(),
        slug: dto.repository_slug.trim(),
        description: dto.repository_description ?? null,
        content_type: 'exam_simulation',
        skill_area: skillArea,
        is_published: false,
        total_items: 0,
        metadata: {
          source: 'ocr_import',
          source_file: basename(file.originalname || file.path),
          created_by: accountId,
          band_range: dto.band_range ?? null,
          exam_year: dto.exam_year ?? null,
        },
      },
      update: {
        title: dto.repository_title?.trim() || dto.repository_slug.trim(),
        description: dto.repository_description ?? null,
        skill_area: skillArea,
        metadata: {
          source: 'ocr_import',
          source_file: basename(file.originalname || file.path),
          created_by: accountId,
          band_range: dto.band_range ?? null,
          exam_year: dto.exam_year ?? null,
        },
      },
      select: { id: true, slug: true },
    });

    if (dto.replace_existing !== false) {
      await this.prisma.examRepositoryItem.deleteMany({
        where: { repository_id: repository.id },
      });
    }

    const { importedCount, skippedCount } = await this.saveQuestionsToRepositoryAndPlacement(
      repository.id,
      skillArea,
      parsedQuestions,
      {
        source: 'ocr_import',
        filename: file.originalname || file.path,
        accountId,
        bandMin: dto.band_range ? parseFloat(dto.band_range.split('-')[0]) : 4.0,
        bandMax: dto.band_range ? parseFloat(dto.band_range.split('-')[1]) : 9.0,
      },
    );

    const totalItems = await this.prisma.examRepositoryItem.count({
      where: { repository_id: repository.id },
    });

    await this.prisma.examRepository.update({
      where: { id: repository.id },
      data: {
        total_items: totalItems,
        estimated_minutes: Math.max(1, Math.ceil(totalItems * 1.5)),
        pass_score: Math.max(1, Math.ceil(totalItems * 0.65)),
      },
    });

    return {
      repository_id: repository.id,
      slug: repository.slug,
      skill_area: skillArea,
      imported_count: importedCount,
      skipped_count: skippedCount,
      total_detected: parsedQuestions.length,
      source_filename: basename(file.originalname || file.path),
    };
  }

  async importAnswerKey(
    dto: IeltsAnswerKeyImportDto,
    file: Express.Multer.File,
  ): Promise<IeltsAnswerKeyImportResponseDto> {
    if (!file) throw new BadRequestException('File đáp án là bắt buộc.');

    const repository = await this.prisma.examRepository.findUnique({
      where: { slug: dto.repository_slug.trim() },
      select: { id: true, slug: true },
    });

    if (!repository) {
      throw new BadRequestException(`Không tìm thấy repository: ${dto.repository_slug}`);
    }

    const rawText = await extractTextFromFile(file);
    const answerKeyMap = extractAnswerKeyMap(rawText);

    const items = await this.prisma.examRepositoryItem.findMany({
      where: { repository_id: repository.id },
      select: {
        id: true,
        metadata: true,
        options: { select: { id: true, option_key: true } },
      },
    });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      const meta = item.metadata as Record<string, unknown> | null;
      const qNum =
        typeof meta?.question_number === 'number' ? (meta.question_number as number) : null;

      if (qNum === null) { skippedCount++; continue; }

      const correctKey = answerKeyMap.get(qNum);
      if (!correctKey) { skippedCount++; continue; }

      await this.prisma.examRepositoryOption.updateMany({
        where: { item_id: item.id },
        data: { is_correct: false },
      });

      const matchingOpt = item.options.find(
        (o) => o.option_key.toUpperCase() === correctKey.toUpperCase(),
      );

      if (matchingOpt) {
        await this.prisma.examRepositoryOption.update({
          where: { id: matchingOpt.id },
          data: { is_correct: true },
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    const totalConfigured = await this.prisma.examRepositoryOption.count({
      where: { item: { repository_id: repository.id }, is_correct: true },
    });

    return {
      repository_id: repository.id,
      slug: repository.slug,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      answer_key_complete: totalConfigured >= items.length && items.length > 0,
    };
  }

  async uploadListeningAudio(
    dto: IeltsListeningAudioUploadDto,
    file: Express.Multer.File,
  ): Promise<IeltsListeningAudioUploadResponseDto> {
    const { writeFile, mkdir } = await import('fs/promises');
    const slug = dto.repository_slug.trim();

    const repository = await this.prisma.examRepository.findFirst({
      where: { slug, cert_type: 'ielts' },
      select: { id: true, slug: true },
    });

    if (!repository) {
      throw new BadRequestException(`Không tìm thấy IELTS repository: ${slug}`);
    }

    const section =
      dto.section ?? this.inferSectionFromFilename(file.originalname);
    const trackNumber = dto.track_number ?? 1;

    const audioRelDir = join('IELTS', 'ielts-listening', slug, 'audio');
    const audioAbsDir = resolve(join(process.cwd(), 'uploads', ...audioRelDir.split(/[\\/]/)));
    if (!existsSync(audioAbsDir)) await mkdir(audioAbsDir, { recursive: true });

    const ext = extname(file.originalname).toLowerCase() || '.mp3';
    const filename = `${slug}_sec${section}_${String(trackNumber).padStart(3, '0')}${ext}`;
    const destPath = join(audioAbsDir, filename);
    const srcBuffer = await readFile(file.path);
    await writeFile(destPath, srcBuffer);

    const audioUrl = `/uploads/IELTS/ielts-listening/${slug}/audio/${filename}`;
    const mappedItemIds = await this.mapAudioToItems(repository.id, section, audioUrl);

    return {
      repository_id: repository.id,
      slug: repository.slug,
      audio_url: audioUrl,
      filename,
      section,
      track_number: trackNumber,
      mapped_item_ids: mappedItemIds,
    };
  }

  async listRepositories(skillArea?: string): Promise<IeltsRepositoryListItemDto[]> {
    const where: Record<string, unknown> = { cert_type: 'ielts' };
    if (skillArea) where.skill_area = skillArea;

    const repos = await this.prisma.examRepository.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true, slug: true, title: true, skill_area: true,
        total_items: true, is_published: true, created_at: true,
      },
    });

    return repos.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title ?? r.slug,
      skill_area: r.skill_area ?? 'unknown',
      total_items: r.total_items ?? 0,
      is_published: r.is_published ?? false,
      created_at: r.created_at,
    }));
  }

  async publishRepository(
    slug: string,
    publish: boolean,
  ): Promise<{ slug: string; is_published: boolean }> {
    const repo = await this.prisma.examRepository.findFirst({
      where: { slug, cert_type: 'ielts' },
      select: { id: true },
    });
    if (!repo) throw new BadRequestException(`Không tìm thấy IELTS repository: ${slug}`);

    await this.prisma.examRepository.update({
      where: { id: repo.id },
      data: { is_published: publish },
    });

    return { slug, is_published: publish };
  }

  // ─── Delete repository ────────────────────────────────────────────────────

  async deleteRepository(slug: string): Promise<IeltsRepositoryDeleteResponseDto> {
    const repo = await this.prisma.examRepository.findFirst({
      where: { slug, cert_type: 'ielts' },
      select: { id: true },
    });
    if (!repo) throw new BadRequestException(`Không tìm thấy IELTS repository: ${slug}`);

    const itemCount = await this.prisma.examRepositoryItem.count({
      where: { repository_id: repo.id },
    });

    await this.prisma.examRepositoryOption.deleteMany({
      where: { item: { repository_id: repo.id } },
    });
    await this.prisma.examRepositoryItem.deleteMany({ where: { repository_id: repo.id } });
    await this.prisma.examRepository.delete({ where: { id: repo.id } });

    return { slug, deleted: true, items_deleted: itemCount };
  }

  private resolveSkillArea(
    dtoSkill: string | undefined,
    filename: string,
  ): 'listening' | 'reading' {
    const s = (dtoSkill ?? '').toLowerCase();
    if (s === 'listening') return 'listening';
    if (s === 'reading') return 'reading';
    const fn = filename.toLowerCase();
    if (fn.includes('listen')) return 'listening';
    return 'reading';
  }

  private mapItemType(questionType: ParsedIeltsQuestion['questionType']): string {
    switch (questionType) {
      case 'fill-blank': return 'fill_blank';
      case 'short-answer': return 'short_answer';
      case 'true-false': return 'single_choice';
      case 'matching': return 'single_choice';
      default: return 'single_choice';
    }
  }

  private estimateSeconds(
    skillArea: 'listening' | 'reading',
    questionType: ParsedIeltsQuestion['questionType'],
  ): number {
    if (skillArea === 'listening') return 30;
    if (questionType === 'true-false') return 60;
    if (questionType === 'fill-blank') return 45;
    return 90;
  }

  private capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private inferSectionFromFilename(filename: string): number {
    const m = /sec(?:tion)?[-_\s]*([1-4])/i.exec(filename);
    return m ? parseInt(m[1], 10) : 1;
  }

  private async mapAudioToItems(
    repositoryId: number,
    section: number,
    audioUrl: string,
  ): Promise<number[]> {
    const items = await this.prisma.examRepositoryItem.findMany({
      where: { repository_id: repositoryId },
      orderBy: { item_order: 'asc' },
      select: { id: true, metadata: true },
    });

    const sectionItems = items.filter((item) => {
      const meta = item.metadata as Record<string, unknown> | null;
      return meta?.section === section;
    });

    if (sectionItems.length === 0) return [];

    const ids = sectionItems.map((i) => i.id);
    await this.prisma.examRepositoryItem.updateMany({
      where: { id: { in: ids } },
      data: { media_audio_url: audioUrl },
    });

    this.logger.log(`Mapped audio "${audioUrl}" to ${ids.length} items in section ${section}`);
    return ids;
  }

  private async saveQuestionsToRepositoryAndPlacement(
    repositoryId: number,
    skillArea: 'listening' | 'reading',
    parsedQuestions: ParsedIeltsQuestion[],
    config: {
      source: string;
      filename: string;
      accountId: number;
      bandMin: number;
      bandMax: number;
    },
  ): Promise<{ importedCount: number; skippedCount: number }> {
    let importedCount = 0;
    let skippedCount = 0;
    let nextOrder = 1;

    const passageCache = new Map<string, string>();

    for (const parsed of parsedQuestions) {
      if (!parsed.stem || (parsed.options.length === 0 && parsed.questionType === 'mcq')) {
        skippedCount++;
        continue;
      }

      this.logger.log(`[AI] Refining IRT for Q${parsed.questionNumber || nextOrder}...`);

      const irt = await this.irtRefinement.refineIrtB({
        questionText: parsed.stem,
        questionType: parsed.questionType,
        passageContext: parsed.context ?? undefined,
        options: parsed.options.map(o => o.optionText),
        answerKey: parsed.options.find(o => o.isCorrect)?.optionKey,
        targetBand: (config.bandMin + config.bandMax) / 2,
      });

      this.logger.log(`[AI] Refined irt_b: ${irt.irt_b} (${irt.confidence})`);

      const repositoryItem = await this.prisma.examRepositoryItem.create({
        data: {
          repository_id: repositoryId,
          item_order: nextOrder,
          item_type: this.mapItemType(parsed.questionType),
          stem: parsed.stem,
          reading_passage: parsed.context ?? null,
          score_weight: 1,
          estimated_seconds: this.estimateSeconds(skillArea, parsed.questionType),
          metadata: {
            source: config.source,
            source_file: basename(config.filename),
            section: parsed.section,
            question_number: parsed.questionNumber ?? null,
            question_type: parsed.questionType,
            irt_b: irt.irt_b,
            irt_confidence: irt.confidence,
          },
        },
        select: { id: true },
      });

      if (parsed.options.length > 0) {
        await this.prisma.examRepositoryOption.createMany({
          data: parsed.options.map((opt, idx) => ({
            item_id: repositoryItem.id,
            option_key: opt.optionKey,
            option_text: opt.optionText,
            is_correct: opt.isCorrect,
            rationale: opt.rationale ?? null,
            sort_order: idx + 1,
          })),
        });
      }

      let passageId: string | null = null;
      if (parsed.context && parsed.context.trim().length > 50) {
        const contextKey = parsed.context.trim();
        if (passageCache.has(contextKey)) {
          passageId = passageCache.get(contextKey)!;
        } else {
          const passage = await this.prisma.ieltsPassage.create({
            data: {
              skill: skillArea,
              title: `Passage from ${basename(config.filename)}`,
              content: parsed.context,
              band_min: config.bandMin,
              band_max: config.bandMax,
            },
            select: { id: true },
          });
          passageId = passage.id;
          passageCache.set(contextKey, passageId);
        }
      }

      await this.prisma.ieltsQuestion.create({
        data: {
          skill: skillArea,
          questionType: this.mapPlacementType(parsed.questionType),
          questionText: parsed.stem,
          options: parsed.options.map(o => ({ key: o.optionKey, text: o.optionText })) as any,
          correctAnswer: parsed.options.find(o => o.isCorrect)?.optionKey || 'A',
          explanation: parsed.explanation,
          bandMin: config.bandMin,
          bandMax: config.bandMax,
          irtA: 1.0,
          irtB: irt.irt_b,
          irtC: 0.25,
          isPlacement: true,
          status: 'approved',
          passage_id: passageId,
          contextType: skillArea === 'listening' ? 'audio' : (passageId ? 'passage' : 'standalone'),
        },
      });

      importedCount++;
      nextOrder++;

      this.logger.log(`[WAIT] Sleeping 2000ms to avoid rate limits...`);
      await this.sleep(2000);
    }

    return { importedCount, skippedCount };
  }
}

export { cleanOcrText };
