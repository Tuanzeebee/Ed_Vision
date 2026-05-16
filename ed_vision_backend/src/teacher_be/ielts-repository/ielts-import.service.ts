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

type IeltsQuestionType =
  | 'mcq'
  | 'fill-blank'
  | 'true-false'
  | 'matching'
  | 'short-answer';

type IeltsTfVariant = 'tf' | 'yn';

interface ParsedIeltsQuestion {
  questionNumber: number | null;
  section: number | null;
  stem: string;
  context: string | null;
  questionType: IeltsQuestionType;
  /** When questionType === 'true-false', whether the option labels are TRUE/FALSE/NOT GIVEN ('tf') or YES/NO/NOT GIVEN ('yn'). */
  tfVariant?: IeltsTfVariant;
  options: ParsedIeltsOption[];
  explanation: string | null;
}

type IeltsGroupVariant = 'tf' | 'yn' | 'fill' | 'matching' | 'mcq' | 'multi-mcq' | 'unknown';

interface IeltsQuestionGroup {
  from: number;
  to: number;
  variant: IeltsGroupVariant;
  /** Hint letters available for matching (e.g. 'A-J'). */
  matchingMaxLetter?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Answer-key extraction
// ─────────────────────────────────────────────────────────────────────────────

type IeltsAnswerKey = string;

function normaliseAnswerToken(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  if (t === 'NG') return 'NOT GIVEN';
  return t;
}

/**
 * Extract a mapping question_number -> answer from the raw OCR text of an
 * IELTS answer key.  Supports:
 *   • Letter answers A–J (matching, MCQ, multi-letter MCQ)
 *   • Boolean answers TRUE / FALSE / NOT GIVEN
 *   • Stance answers   YES / NO / NOT GIVEN
 *   • Free-text answers for gap-fill / short-answer (lower-case word(s))
 *
 * The parser is line-oriented and tolerant of multi-column layouts produced by
 * IELTS official answer sheets (e.g. "1 population   22 shops").
 */
/**
 * Pre-normalise an OCR'd answer-key line:
 *  • Collapse a digit followed immediately by a confusable letter (M/I/L)
 *    into a two-digit number, e.g. "3M" → "31", "1I" → "11".  These mis-OCRs
 *    are common for thin sans-serif "1" glyphs.
 *  • Strip a trailing lowercase suffix from an uppercase letter answer
 *    ("Cc" → "C", "Bb" → "B") — Tesseract sometimes duplicates bold letters.
 *  • Normalise "NOTGIVEN" → "NOT GIVEN".
 */
function preprocessAnswerLine(line: string): string {
  return line
    .replace(/(\d)([MIL])(?=\s|$)/g, (_, d) => `${d}1`)
    .replace(/\bNOTGIVEN\b/gi, 'NOT GIVEN')
    .replace(/\b([A-J])[a-j]{1,2}\b/g, (_, up) => up);
}

/** A single answer-sheet cell after column splitting. */
type CellShape =
  | { kind: 'pair'; a: number; b: number }
  | { kind: 'token'; num: number; ans: string }
  | { kind: 'word'; num: number; text: string }
  | { kind: 'lonely-letter'; letter: string }
  | { kind: 'header' }
  | { kind: 'unknown' };

const CELL_TOKEN_RE =
  /^(\d{1,3})\s*[.):\-–]?\s+(TRUE|FALSE|NOT\s*GIVEN|NG|YES|NO|[A-J])\s*$/i;
const CELL_WORD_RE =
  /^(\d{1,3})\s+([a-z][a-z\-']{1,30}(?:\s+[a-z][a-z\-']{1,30}){0,3})\s*$/;
const CELL_PAIR_RE =
  /^(\d{1,3})\s*[&8]\s*(\d{1,3})\s*(?:IN\s+EITHER\s+ORDER)?\s*$/i;
const CELL_LETTER_RE = /^([A-J])\s*$/;
const CELL_HEADER_RE =
  /^(questions?|reading\s+passage|section|test\s+\d|passage|in\s+either\s+order|answer\s+key)\b/i;

function classifyCell(cell: string): CellShape {
  const c = cell.trim();
  if (!c) return { kind: 'unknown' };
  if (CELL_HEADER_RE.test(c)) return { kind: 'header' };

  const p = CELL_PAIR_RE.exec(c);
  if (p) return { kind: 'pair', a: parseInt(p[1], 10), b: parseInt(p[2], 10) };

  const t = CELL_TOKEN_RE.exec(c);
  if (t) return { kind: 'token', num: parseInt(t[1], 10), ans: normaliseAnswerToken(t[2]) };

  const w = CELL_WORD_RE.exec(c);
  if (w) return { kind: 'word', num: parseInt(w[1], 10), text: w[2].trim() };

  const l = CELL_LETTER_RE.exec(c);
  if (l) return { kind: 'lonely-letter', letter: l[1].toUpperCase() };

  return { kind: 'unknown' };
}

function isStopword(text: string): boolean {
  return /^(the|and|or|of|to|in|on|at|by|for|is|are|was|were|be|a|an)\b/i.test(text);
}

function isLetterAnswer(s: string): boolean {
  return /^[A-J]$/.test(s);
}

function isBooleanAnswer(s: string): boolean {
  return /^(TRUE|FALSE|YES|NO|NOT GIVEN)$/i.test(s);
}

function extractAnswerKeyMap(rawText: string): Map<number, IeltsAnswerKey> {
  const map = new Map<number, IeltsAnswerKey>();
  // Numbers awaiting a letter answer (from "X&Y IN EITHER ORDER" headers).
  const pendingPairNumbers: number[] = [];
  let leftLast = 0;
  let rightLast = 0;

  /**
   * Apply an entry to the map, preferring longer / more informative answers
   * over shorter ones for the same question, and never letting a single-letter
   * or boolean token clobber a previously-recorded free-text answer.
   */
  function applyEntry(num: number, ans: string): void {
    if (num < 1 || num > 200) return;
    const existing = map.get(num);
    if (existing == null) { map.set(num, ans); return; }
    if (isLetterAnswer(existing) || isBooleanAnswer(existing)) {
      // Replace only with a longer / more specific same-class value.
      if (isLetterAnswer(ans) || isBooleanAnswer(ans)) {
        if (ans.length > existing.length) map.set(num, ans);
      }
      return;
    }
    // Existing is free-text.
    if (!isLetterAnswer(ans) && !isBooleanAnswer(ans)) {
      // Prefer the longer / cleaner free-text answer.
      if (ans.length > existing.length) map.set(num, ans);
    }
    // Never overwrite free-text with a single letter / boolean — those are
    // almost always OCR fragment misattributions.
  }

  // Pre-process line by line, preserving inter-cell whitespace so we can
  // split into cells.
  const rawLines = rawText.replace(/\r\n?/g, '\n').split('\n');

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) continue;
    if (/[.…]{4,}/.test(rawLine)) continue;

    const processed = preprocessAnswerLine(rawLine.replace(/\s+$/, ''));

    // Split into cells by 2+ consecutive spaces — the canonical answer-key
    // column separator after Tesseract preserves inter-word spacing.
    const cells = processed.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);

    cells.forEach((cell, ci) => {
      const shape = classifyCell(cell);

      // Determine left vs right column.
      //   * Multi-cell line: first cell = L, others = R.
      //   * Single-cell line: use the cell's parsed number, falling back to
      //     range (≤ ~21 likely left; ≥ ~22 likely right for a 40Q test).
      let col: 'L' | 'R';
      if (cells.length >= 2) {
        col = ci === 0 ? 'L' : 'R';
      } else {
        const parsedNum =
          shape.kind === 'token' ? shape.num :
            shape.kind === 'word' ? shape.num :
              shape.kind === 'pair' ? shape.a :
                0;
        if (parsedNum === 0) {
          col = 'L';
        } else if (parsedNum <= leftLast + 2 && parsedNum <= 25) {
          col = 'L';
        } else if (parsedNum > Math.max(leftLast, 21)) {
          col = 'R';
        } else {
          col = 'L';
        }
      }
      const colLast = () => (col === 'L' ? leftLast : rightLast);
      const setColLast = (n: number) => {
        if (col === 'L') leftLast = Math.max(leftLast, n);
        else rightLast = Math.max(rightLast, n);
      };

      switch (shape.kind) {
        case 'header':
        case 'unknown':
          return;

        case 'pair': {
          // Register a pair like 23&24 / 25&26.
          const { a, b } = shape;
          if (b === a + 1 && a >= 1 && a <= 200) {
            if (!map.has(a) && !pendingPairNumbers.includes(a)) pendingPairNumbers.push(a);
            if (!map.has(b) && !pendingPairNumbers.includes(b)) pendingPairNumbers.push(b);
            setColLast(b);
          }
          return;
        }

        case 'token': {
          let num = shape.num;
          // Snap 1-digit OCR fragments to the expected next number for the
          // active column when a clear backward jump from a 2-digit context
          // is detected (e.g. "3 C" appearing between "36 B" and "38 A" →
          // really "37 C").
          if (num < 10 && colLast() >= 10) {
            const expected = colLast() + 1;
            if (expected <= 200 && !map.has(expected) && expected - num <= 40) {
              num = expected;
            }
          }
          applyEntry(num, shape.ans);
          setColLast(num);
          return;
        }

        case 'word': {
          const { num, text } = shape;
          if (text.length < 2 || isStopword(text)) return;
          applyEntry(num, text);
          setColLast(num);
          return;
        }

        case 'lonely-letter': {
          // Assign to the next pending pair number, if any.
          if (pendingPairNumbers.length === 0) return;
          const num = pendingPairNumbers.shift()!;
          applyEntry(num, shape.letter);
          setColLast(num);
          return;
        }
      }
    });
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
        !/\b(READING|LISTENING|PASSAGE|SECTION|QUESTION|TRUE|FALSE|YES|NO|NOT\s*GIVEN|NG)\b/.test(trimmed) &&
        (() => {
          const letters = trimmed.replace(/[^A-Z]/g, '');
          if (letters.length === 0) return false;
          const consonants = letters.replace(/[AEIOU]/g, '').length;
          return consonants / letters.length > 0.75;
        })()) ||
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
): IeltsQuestionType {
  const combined = `${stem} ${context}`.toLowerCase();
  if (/\b(yes|no|not\s*given)\b/.test(combined) && /\bagrees?\s+with\s+the\s+claims?/.test(combined)) {
    return 'true-false';
  }
  if (/true|false|not\s*given/.test(combined)) return 'true-false';
  if (/complete|fill\s*in|no\s*more\s*than|one\s*word|word(?:s)?\s*(?:and\/or\s*a?\s*number)?/.test(combined)) return 'fill-blank';
  if (/match|which\s+paragraph|which\s+section|which\s+letter/.test(combined)) return 'matching';
  if (/write\s+(?:a\s+)?(?:word|number|name)|short\s+answer/.test(combined)) return 'short-answer';
  return 'mcq';
}

/**
 * Classify an IELTS question-group header.  Examples:
 *   "Complete the notes below."           → fill
 *   "Choose the correct letter, A, B, C or D." → mcq
 *   "Which section contains the following…"   → matching
 *   "TRUE if the statement…"             → tf
 *   "YES if the statement agrees with…"  → yn
 *   "Choose TWO letters, A-E."          → multi-mcq
 */
function classifyGroupVariant(header: string): {
  variant: IeltsGroupVariant;
  matchingMaxLetter?: string;
} {
  const h = header.toLowerCase();
  if (/\byes\b[^\n]*\bno\b[^\n]*\bnot\s*given\b/.test(h)) return { variant: 'yn' };
  if (/\btrue\b[^\n]*\bfalse\b[^\n]*\bnot\s*given\b/.test(h)) return { variant: 'tf' };
  if (/\b(yes|no)\s+if\s+the\s+statement\b/.test(h)) return { variant: 'yn' };
  if (/\b(true|false)\s+if\s+the\s+statement\b/.test(h)) return { variant: 'tf' };
  if (/\bchoose\s+two\s+letters\b/.test(h)) return { variant: 'multi-mcq' };
  if (/\bcomplete\s+the\s+(?:notes|summary|table|sentences|flow-?chart|diagram|labels?)\b/.test(h)) {
    return { variant: 'fill' };
  }
  if (/\bfill\s+in\s+the\s+blanks?\b/.test(h)) return { variant: 'fill' };
  if (/\bwhich\s+(section|paragraph)\s+contains\b/.test(h)) return { variant: 'matching' };
  const letterRange = /\bcorrect\s+letter,?\s*([a-j])\s*[-–]\s*([a-j])\b/.exec(h);
  if (letterRange) {
    return {
      variant: 'matching',
      matchingMaxLetter: letterRange[2].toUpperCase(),
    };
  }
  if (/\bcorrect\s+letter,?\s*[abcd](?:\s*,\s*[abcd]){1,3}\s*(?:or\s*[abcd])?\b/.test(h)) {
    return { variant: 'mcq' };
  }
  if (/\bcomplete\s+the\s+summary\s+using\s+the\s+list\s+of\s+phrases\b/.test(h)) {
    return { variant: 'matching', matchingMaxLetter: 'J' };
  }
  return { variant: 'unknown' };
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

  /** "Questions 23 and 24" — IELTS multi-letter MCQ. */
  const PAIR_RE = /^Questions?\s+(\d{1,3})\s+and\s+(\d{1,3})\b/i;

  /** "A. text" / "A) text" / "A text" — A-J for matching question lists. */
  const OPT_RE = /^([A-J])(?:[.):\-]\s*|\s+)(.{2,})$/i;

  /** Inline options on one line: "A. foo B. bar C. baz D. qux" (A-J). */
  const INLINE_MARKER_RE = /(?:^|(?<=[\s(]))([A-J])[).:\-]\s*/g;

  // ── State ─────────────────────────────────────────────────────────────────

  const questions: ParsedIeltsQuestion[] = [];
  const groups: IeltsQuestionGroup[] = [];
  let currentSection = 1;
  let contextBuffer: string[] = [];
  let passageRange: [number, number] | null = null;
  let passageLines: string[] = [];
  /**
   * The currently-open question group (e.g. Questions 7-13 = TF/NG).
   * Used to label TF questions as YES/NO vs TRUE/FALSE, and to synthesize
   * placeholder questions for unparsed numbers in the range.
   */
  let currentGroup: IeltsQuestionGroup | null = null;
  let pendingHeaderLines: string[] = [];

  // Track the highest question number seen so far to avoid duplicates
  // from false-positive matches
  let lastQNum = 0;

  interface WorkingQ {
    questionNumber: number | null;
    section: number;
    stemLines: string[];
    optionsMap: Map<string, string>;
    questionType: IeltsQuestionType;
    tfVariant?: IeltsTfVariant;
    inlineAnswer: string | null;
    lastOptKey: string | null;
  }

  let wq: WorkingQ | null = null;

  function registerGroup(from: number, to: number): void {
    const headerText = pendingHeaderLines.join(' ');
    const cls = classifyGroupVariant(headerText);
    const group: IeltsQuestionGroup = {
      from,
      to,
      variant: cls.variant,
      matchingMaxLetter: cls.matchingMaxLetter,
    };
    currentGroup = group;
    groups.push(group);
    pendingHeaderLines = [];
  }

  function tfVariantForNumber(n: number): IeltsTfVariant {
    const g = groups.find((gr) => n >= gr.from && n <= gr.to);
    if (g?.variant === 'yn') return 'yn';
    return 'tf';
  }

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
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
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

    // Resolve TF variant (TRUE/FALSE vs YES/NO) from the active group.
    if (wq.questionType === 'true-false' && !wq.tfVariant && wq.questionNumber !== null) {
      wq.tfVariant = tfVariantForNumber(wq.questionNumber);
    }

    // Synthesise True/False/Not Given (or Yes/No/Not Given) options.
    if (wq.questionType === 'true-false' && options.length === 0) {
      const variant = wq.tfVariant ?? 'tf';
      const keys = variant === 'yn'
        ? ['YES', 'NO', 'NOT GIVEN']
        : ['TRUE', 'FALSE', 'NOT GIVEN'];
      options = keys.map((k) => ({
        optionKey: k,
        optionText: k,
        isCorrect: k === correctKey,
        rationale: null,
      }));
    }

    // Fallback T/F or Y/N from context
    if (options.length === 0 && wq.questionNumber !== null) {
      const ctx = contextBuffer.slice(-10).join(' ');
      if (/yes\b[^\n]*\bno\b[^\n]*\bnot\s*given/i.test(ctx)) {
        wq.questionType = 'true-false';
        wq.tfVariant = 'yn';
        options = ['YES', 'NO', 'NOT GIVEN'].map((k) => ({
          optionKey: k,
          optionText: k,
          isCorrect: k === correctKey,
          rationale: null,
        }));
      } else if (/true|false|not\s*given/i.test(ctx)) {
        wq.questionType = 'true-false';
        wq.tfVariant = 'tf';
        options = ['TRUE', 'FALSE', 'NOT GIVEN'].map((k) => ({
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
      tfVariant: wq.tfVariant,
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
        flushQuestion();
        contextBuffer.push(line);
        passageRange = r;
        if (lastQNum === 0 || r[0] > lastQNum) {
          lastQNum = Math.max(0, r[0] - 1);
        }
        pendingHeaderLines = [line];
        registerGroup(r[0], r[1]);
      }
      continue;
    }

    // ── Pair header: "Questions 23 and 24" ──────────────────────────────
    const pairMatch = PAIR_RE.exec(line);
    if (pairMatch) {
      const a = parseInt(pairMatch[1], 10);
      const b = parseInt(pairMatch[2], 10);
      flushQuestion();
      contextBuffer.push(line);
      passageRange = [a, b];
      if (lastQNum === 0 || a > lastQNum) {
        lastQNum = Math.max(0, a - 1);
      }
      pendingHeaderLines = [line];
      registerGroup(a, b);
      continue;
    }

    // Capture instruction lines that follow a range header so we can
    // classify the active group correctly.
    {
      const cg = currentGroup as IeltsQuestionGroup | null;
      if (cg && /^(complete|choose|do the following|which section|which paragraph|write the correct|in boxes|true|false|yes|no|not given)\b/i.test(line)) {
        pendingHeaderLines.push(line);
        // Re-classify whenever a new instruction line is seen.
        const cls = classifyGroupVariant(pendingHeaderLines.join(' '));
        if (cls.variant !== 'unknown') {
          cg.variant = cls.variant;
          if (cls.matchingMaxLetter) cg.matchingMaxLetter = cls.matchingMaxLetter;
        }
      }
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

      const ansMatch = /^(?:answer|correct|đáp\s*án)\s*[:\-]\s*([A-J]|TRUE|FALSE|YES|NO|NOT\s*GIVEN|NG)/i.exec(line);
      if (ansMatch) {
        wq.inlineAnswer = normaliseAnswerToken(ansMatch[1]);
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

  // ── Placeholder synthesis ───────────────────────────────────────────────
  // For each tracked question group, fill in any missing question numbers in
  // the range with a typed placeholder.  This is essential for IELTS
  // gap-fill / matching blocks where the question numbers are embedded
  // inline (e.g. "The 1 ........ of London ...") and almost never survive
  // OCR cleanly.
  const seenNumbers = new Set<number>(
    questions
      .map((q) => q.questionNumber)
      .filter((n): n is number => typeof n === 'number'),
  );

  for (const group of groups) {
    if (group.variant === 'unknown') continue;
    if (group.from < 1 || group.to < group.from) continue;
    if (group.to - group.from > 30) continue; // sanity guard

    for (let n = group.from; n <= group.to; n++) {
      if (seenNumbers.has(n)) continue;

      const correctKey = answerKeyMap.get(n) ?? null;
      let qType: IeltsQuestionType;
      let tfVariant: IeltsTfVariant | undefined;
      let options: ParsedIeltsOption[] = [];
      let stem: string;

      switch (group.variant) {
        case 'tf':
          qType = 'true-false';
          tfVariant = 'tf';
          options = ['TRUE', 'FALSE', 'NOT GIVEN'].map((k) => ({
            optionKey: k,
            optionText: k,
            isCorrect: k === correctKey,
            rationale: null,
          }));
          stem = `[Câu ${n}] (TRUE / FALSE / NOT GIVEN)`;
          break;
        case 'yn':
          qType = 'true-false';
          tfVariant = 'yn';
          options = ['YES', 'NO', 'NOT GIVEN'].map((k) => ({
            optionKey: k,
            optionText: k,
            isCorrect: k === correctKey,
            rationale: null,
          }));
          stem = `[Câu ${n}] (YES / NO / NOT GIVEN)`;
          break;
        case 'matching': {
          qType = 'matching';
          const max = group.matchingMaxLetter ?? 'G';
          const maxIdx = max.charCodeAt(0) - 'A'.charCodeAt(0);
          const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].slice(0, maxIdx + 1);
          options = letters.map((k) => ({
            optionKey: k,
            optionText: k,
            isCorrect: k === correctKey,
            rationale: null,
          }));
          stem = `[Câu ${n}] (Matching A–${max})`;
          break;
        }
        case 'mcq':
          qType = 'mcq';
          options = ['A', 'B', 'C', 'D'].map((k) => ({
            optionKey: k,
            optionText: k,
            isCorrect: k === correctKey,
            rationale: null,
          }));
          stem = `[Câu ${n}]`;
          break;
        case 'multi-mcq':
          qType = 'mcq';
          options = ['A', 'B', 'C', 'D', 'E'].map((k) => ({
            optionKey: k,
            optionText: k,
            isCorrect: k === correctKey,
            rationale: null,
          }));
          stem = `[Câu ${n}] (Choose TWO letters)`;
          break;
        case 'fill':
        default:
          qType = 'fill-blank';
          options = [
            {
              optionKey: 'A',
              optionText: typeof correctKey === 'string' ? correctKey : '(blank)',
              isCorrect: !!correctKey,
              rationale: null,
            },
          ];
          stem = `[Câu ${n}] (gap-fill)`;
          break;
      }

      questions.push({
        questionNumber: n,
        section: null,
        stem,
        context: null,
        questionType: qType,
        tfVariant,
        options,
        explanation: null,
      });
      seenNumbers.add(n);
    }
  }

  // Sort by question number for stable downstream processing.
  questions.sort((a, b) => {
    const an = a.questionNumber ?? 1e9;
    const bn = b.questionNumber ?? 1e9;
    return an - bn;
  });

  return questions;
}

/** Heuristic: is this line a pure answer-key block? */
function isAnswerKeyLine(line: string): boolean {
  if (/[.…]{3,}/.test(line)) return false;

  const re = /\b\d{1,3}\s*[).:\-]?\s*(?:[A-J]|TRUE|FALSE|YES|NO|NOT\s*GIVEN|NG)\b/gi;
  const matches = line.match(re) ?? [];
  if (matches.length === 0) return false;
  const residue = line.replace(re, ' ').replace(/[\s,.;:()\-_/&]+/g, '').trim();
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

    const itemsFull = await this.prisma.examRepositoryItem.findMany({
      where: { repository_id: repository.id },
      select: {
        id: true,
        item_type: true,
        metadata: true,
        options: { select: { id: true, option_key: true, option_text: true } },
      },
    });

    // If requested, clear all existing is_correct flags before re-applying.
    if (dto.clear_existing) {
      await this.prisma.examRepositoryOption.updateMany({
        where: { item: { repository_id: repository.id } },
        data: { is_correct: false },
      });
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const unknownNumbers: number[] = [];

    for (const item of itemsFull) {
      const meta = item.metadata as Record<string, unknown> | null;
      const qNum =
        typeof meta?.question_number === 'number' ? (meta.question_number as number) : null;

      if (qNum === null) { skippedCount++; continue; }

      const correctKey = answerKeyMap.get(qNum);
      if (!correctKey) { skippedCount++; unknownNumbers.push(qNum); continue; }

      // Reset existing flags for this item before re-applying.
      await this.prisma.examRepositoryOption.updateMany({
        where: { item_id: item.id },
        data: { is_correct: false },
      });

      const upper = correctKey.toUpperCase();
      const isLetterAnswer = /^[A-J]$/.test(upper);
      const isBooleanAnswer = /^(TRUE|FALSE|YES|NO|NOT GIVEN)$/.test(upper);

      // 1) Try direct option_key match (letters, TRUE/FALSE/NG, YES/NO/NG).
      let matchingOpt =
        item.options.find((o) => o.option_key.toUpperCase() === upper) ?? null;

      // 2) For boolean answers, also accept option_text equality.
      if (!matchingOpt && isBooleanAnswer) {
        matchingOpt =
          item.options.find((o) => (o.option_text ?? '').toUpperCase() === upper) ?? null;
      }

      // 3) Free-text answers (gap-fill / short-answer).  Update the placeholder
      //    option's text and mark it correct.
      if (
        !matchingOpt &&
        !isLetterAnswer &&
        !isBooleanAnswer &&
        (item.item_type === 'fill_blank' || item.item_type === 'short_answer') &&
        item.options.length > 0
      ) {
        const placeholder = item.options[0];
        await this.prisma.examRepositoryOption.update({
          where: { id: placeholder.id },
          data: {
            option_text: correctKey,
            is_correct: true,
          },
        });
        updatedCount++;
        continue;
      }

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
      answer_key_complete: totalConfigured >= itemsFull.length && itemsFull.length > 0,
      // Aliases consumed by the frontend (IeltsAnswerKeyImportResponse).
      skill_area:
        ((await this.prisma.examRepository.findUnique({
          where: { id: repository.id },
          select: { skill_area: true },
        }))?.skill_area) ?? 'unknown',
      source_filename: basename(file.originalname || file.path),
      total_answers_detected: answerKeyMap.size,
      applied_items: updatedCount,
      unanswered_items: Math.max(0, itemsFull.length - updatedCount),
      unknown_question_numbers: unknownNumbers,
    } as IeltsAnswerKeyImportResponseDto;
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

export { cleanOcrText, parseIeltsQuestionsFromText, extractAnswerKeyMap };
