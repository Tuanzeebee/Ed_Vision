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
import { bootstrapIrt } from '../../ielts-repository/utils/irt-bootstrap.util';
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
    .replace(/\bINEITHER\b/gi, 'IN EITHER')
    // Collapse "NOT  GIVEN" (multiple spaces) into single-space to prevent
    // the column splitter from breaking it into two cells.
    .replace(/\bNOT\s{2,}GIVEN\b/gi, 'NOT GIVEN')
    .replace(/\b([A-J])[a-j]{1,2}\b/g, (_, up) => up);
}

/** A single answer-sheet cell after column splitting. */
type CellShape =
  | { kind: 'pair'; a: number; b: number }
  | { kind: 'pair-with-answers'; a: number; b: number; ansA: string; ansB: string }
  | { kind: 'token'; num: number; ans: string }
  | { kind: 'word'; num: number; text: string }
  | { kind: 'lonely-letter'; letter: string }
  | { kind: 'header' }
  | { kind: 'unknown' };

const CELL_TOKEN_RE =
  /^(\d{1,3})\s*[.):\-–]?\s+(TRUE|FALSE|NOT\s*GIVEN|NG|YES|NO|[A-J])\s*$/i;
/** Free-text answers: allow uppercase/lowercase start, digits, parens, slashes. */
const CELL_WORD_RE =
  /^(\d{1,3})\s+([\(]?[a-zA-Z][a-zA-Z0-9\-'()\/ ]{0,50})\s*$/;
const CELL_PAIR_RE =
  /^(\d{1,3})\s*(?:[&8]|and)\s*(\d{1,3})(?:\s|$)/i;
/** Pair with trailing answer letters: "23&24 IN EITHER ORDER B D" or "23 and 24 B D". */
const CELL_PAIR_WITH_ANSWERS_RE =
  /^(\d{1,3})\s*(?:[&8]|and)\s*(\d{1,3})\s*(?:IN\s+EITHER\s+ORDER)?\s+([A-J])\s*[,/&\s]\s*([A-J])\s*$/i;
const CELL_LETTER_RE = /^([A-J])\s*$/;
const CELL_HEADER_RE =
  /^(questions?|reading\s+passage|section|test\s+\d|passage|answer\s+key)\b/i;

function classifyCell(cell: string): CellShape {
  const c = cell.trim();
  if (!c) return { kind: 'unknown' };
  if (CELL_HEADER_RE.test(c)) return { kind: 'header' };

  // Pair with inline answers first (more specific): "23&24 IN EITHER ORDER B D"
  const pwa = CELL_PAIR_WITH_ANSWERS_RE.exec(c);
  if (pwa) {
    return {
      kind: 'pair-with-answers',
      a: parseInt(pwa[1], 10),
      b: parseInt(pwa[2], 10),
      ansA: pwa[3].toUpperCase(),
      ansB: pwa[4].toUpperCase(),
    };
  }

  const p = CELL_PAIR_RE.exec(c);
  if (p) return { kind: 'pair', a: parseInt(p[1], 10), b: parseInt(p[2], 10) };

  const t = CELL_TOKEN_RE.exec(c);
  if (t) return { kind: 'token', num: parseInt(t[1], 10), ans: normaliseAnswerToken(t[2]) };

  const w = CELL_WORD_RE.exec(c);
  if (w) {
    const text = w[2].trim();
    // Guard: reject if extracted text is just a number or looks like noise
    if (text.length >= 1 && !/^\d+$/.test(text)) {
      return { kind: 'word', num: parseInt(w[1], 10), text };
    }
  }

  const l = CELL_LETTER_RE.exec(c);
  if (l) return { kind: 'lonely-letter', letter: l[1].toUpperCase() };

  // Fallback: "<number> <anything>" — catches answers with special characters,
  // digits, or mixed formatting that stricter regexes missed.
  const fallback = /^(\d{1,3})\s*[.):\-–]?\s+(.{2,40})$/.exec(c);
  if (fallback) {
    const num = parseInt(fallback[1], 10);
    const text = fallback[2].trim();
    if (num >= 1 && num <= 40 && !/^\d+$/.test(text)) {
      return { kind: 'word', num, text };
    }
  }

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

  // ── Sequential numbering state ──────────────────────────────────────────
  // When a "Questions X-Y" header is detected, we track the expected next
  // question number.  Unnumbered answer lines are assigned sequentially.
  let seqNext: number | null = null;
  let seqEnd: number | null = null;

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

    // Detect "Questions X-Y" header → start sequential numbering.
    const qHeaderMatch = /Questions?\s+(\d{1,3})\s*[-–]\s*(\d{1,3})/i.exec(processed);
    if (qHeaderMatch) {
      seqNext = parseInt(qHeaderMatch[1], 10);
      seqEnd = parseInt(qHeaderMatch[2], 10);
      continue;
    }

    // Skip known noise headers ("Reading Passage X," etc.).
    if (/^Reading\s+Passage/i.test(processed.trim())) continue;

    // ── Try sequential assignment for unnumbered answer lines ────────────
    // If we have a seqNext counter active and the line is a bare answer
    // (no leading number), assign it to the next sequential question.
    if (seqNext !== null && seqEnd !== null && seqNext <= seqEnd) {
      const trimmed = processed.trim();
      const isBareAnswer =
        /^(TRUE|FALSE|NOT\s*GIVEN|YES|NO|[A-J])\s*$/i.test(trimmed) ||
        /^[a-z][a-z\-']{1,25}$/i.test(trimmed);
      const startsWithNumber = /^\d{1,3}\s/.test(trimmed);
      // Garbled chars from PDF font extraction (single special chars)
      const isGarbage = trimmed.length <= 3 && /[^a-zA-Z0-9]/.test(trimmed);

      if (isBareAnswer && !startsWithNumber && !isGarbage) {
        const ans = normaliseAnswerToken(trimmed);
        if (!map.has(seqNext)) {
          applyEntry(seqNext, ans);
        }
        seqNext++;
        continue;
      }
    }

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

        case 'pair-with-answers': {
          // Pair with inline answers: "23&24 IN EITHER ORDER B D"
          if (shape.b === shape.a + 1 && shape.a >= 1 && shape.a <= 200) {
            applyEntry(shape.a, shape.ansA);
            applyEntry(shape.b, shape.ansB);
            setColLast(shape.b);
          }
          return;
        }

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
          // Sync sequential counter when a numbered entry is found.
          if (seqEnd !== null && num >= 1 && num <= seqEnd) {
            seqNext = num + 1;
          }
          return;
        }

        case 'word': {
          const { num, text } = shape;
          if (text.length < 2) return;
          // Only reject single-word stopwords (e.g. stray "the", "in").
          // Multi-word answers like "in advance" are valid IELTS gap-fill answers.
          if (!text.includes(' ') && isStopword(text)) return;
          applyEntry(num, text);
          setColLast(num);
          // Sync sequential counter when a numbered entry is found.
          if (seqEnd !== null && num >= 1 && num <= seqEnd) {
            seqNext = num + 1;
          }
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

  // ── Secondary sweep ──────────────────────────────────────────────────────────
  // Scan every line for <number> <answer> patterns to catch entries the
  // cell-based parser missed (garbled column splits, unusual formatting).
  // Only fills in question numbers that are still missing from the map.
  const TOKEN_SWEEP_RE =
    /\b(\d{1,2})\s*[.):\-–]?\s+(TRUE|FALSE|NOT\s*GIVEN|NG|YES|NO|[A-J])\b/gi;
  const WORD_SWEEP_RE =
    /\b(\d{1,2})\s+([a-zA-Z][a-zA-Z\-']{1,25})\b/g;
  const PAIR_SWEEP_RE =
    /\b(\d{1,2})\s*(?:[&]|and)\s*(\d{1,2})(?:\s+IN\s+EITHER\s+ORDER)?\s+([A-J])\s*[,/&\s]\s*([A-J])\b/gi;
  /** Pair header without inline answers: "9 and 10" or "23&24 IN EITHER ORDER" */
  const PAIR_HEADER_SWEEP_RE =
    /\b(\d{1,2})\s*(?:[&8]|and)\s*(\d{1,2})\b/i;
  /**
   * OCR-fused pair: "23824" where "&" was read as "8".
   * Detects patterns like 2-digit + "8" + 2-digit where second = first + 1.
   */
  const FUSED_PAIR_RE = /(\d{1,2})8(\d{1,2})/g;

  // Track pending pair numbers from the secondary sweep for multi-line pairs
  const sweepPendingPairs: number[] = [];

  for (let li = 0; li < rawLines.length; li++) {
    const line = rawLines[li].trim();
    if (!line) continue;

    // Pair sweep: "9&10 B C" or "23 and 24 IN EITHER ORDER B D"
    let pm;
    while ((pm = PAIR_SWEEP_RE.exec(line)) !== null) {
      const a = parseInt(pm[1], 10);
      const b = parseInt(pm[2], 10);
      if (a >= 1 && a <= 40 && b === a + 1) {
        if (!map.has(a)) applyEntry(a, pm[3].toUpperCase());
        if (!map.has(b)) applyEntry(b, pm[4].toUpperCase());
      }
    }

    // Pair header sweep (no inline answers): "9 and 10" or "23&24 IN EITHER ORDER"
    // Collect the pair numbers and look for standalone letters on following lines.
    const ph = PAIR_HEADER_SWEEP_RE.exec(line);
    if (ph) {
      const a = parseInt(ph[1], 10);
      const b = parseInt(ph[2], 10);
      if (a >= 1 && a <= 40 && b === a + 1 && !map.has(a) && !map.has(b)) {
        sweepPendingPairs.push(a, b);
      }
    }

    // Fused pair sweep: OCR merges "23&24" → "23824".
    let fp;
    while ((fp = FUSED_PAIR_RE.exec(line)) !== null) {
      const a = parseInt(fp[1], 10);
      const b = parseInt(fp[2], 10);
      if (a >= 1 && a <= 40 && b === a + 1 && !map.has(a) && !map.has(b)) {
        sweepPendingPairs.push(a, b);
      }
    }

    // Assign standalone letters to pending pair numbers
    if (sweepPendingPairs.length > 0 && /^[A-J]$/i.test(line)) {
      const num = sweepPendingPairs.shift()!;
      if (!map.has(num)) applyEntry(num, line.toUpperCase());
      continue;
    }

    // Token sweep: "19 C" or "37 TRUE"
    let tm;
    while ((tm = TOKEN_SWEEP_RE.exec(line)) !== null) {
      const num = parseInt(tm[1], 10);
      if (num >= 1 && num <= 40 && !map.has(num)) {
        applyEntry(num, normaliseAnswerToken(tm[2]));
      }
    }

    // Word sweep: "19 population" or "37 habitat"
    let wm;
    while ((wm = WORD_SWEEP_RE.exec(line)) !== null) {
      const num = parseInt(wm[1], 10);
      const text = wm[2].trim();
      if (num >= 1 && num <= 40 && !map.has(num) && text.length >= 2 && !isStopword(text)) {
        applyEntry(num, text);
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

  // ── Hard cap at 40 questions ──────────────────────────────────────────────
  // IELTS Reading and Listening both have exactly 40 questions.
  // Remove any false-positive questions with number > 40 (OCR artifacts,
  // page footers, passage text lines starting with numbers).
  const MAX_IELTS_QUESTIONS = 40;
  const capped = questions.filter(
    (q) => q.questionNumber === null || q.questionNumber <= MAX_IELTS_QUESTIONS,
  );

  // Deduplicate by question number — keep the first (most likely real) entry.
  const deduped: ParsedIeltsQuestion[] = [];
  const usedNumbers = new Set<number>();
  for (const q of capped) {
    if (q.questionNumber !== null) {
      if (usedNumbers.has(q.questionNumber)) continue;
      usedNumbers.add(q.questionNumber);
    }
    deduped.push(q);
  }

  return deduped;
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

    // ── Diagnostic logging ──
    this.logger.log(`[AK] Raw text length: ${rawText.length} chars`);
    this.logger.log(`[AK] Raw text preview (first 600 chars):\n${rawText.substring(0, 600)}`);

    const answerKeyMap = extractAnswerKeyMap(rawText);

    this.logger.log(`[AK] Answer key map size: ${answerKeyMap.size}`);
    const sortedEntries = [...answerKeyMap.entries()].sort((a, b) => a[0] - b[0]);
    this.logger.log(`[AK] Answer key entries: ${sortedEntries.map(([k, v]) => `${k}=${v}`).join(', ')}`);
    const missingFromAk: number[] = [];
    for (let i = 1; i <= 40; i++) {
      if (!answerKeyMap.has(i)) missingFromAk.push(i);
    }
    if (missingFromAk.length > 0) {
      this.logger.warn(`[AK] Missing from answer key map: ${missingFromAk.join(', ')}`);
    }

    // ── Find IeltsQuestion records by topicTag "repo:SLUG" ──
    const repoTag = `repo:${repository.slug}`;
    const ieltsQuestions = await this.prisma.ieltsQuestion.findMany({
      where: { topicTags: { has: repoTag } },
    });

    this.logger.log(`[AK] Found ${ieltsQuestions.length} IeltsQuestion records with tag "${repoTag}"`);

    let updatedCount = 0;
    let skippedCount = 0;
    const unknownNumbers: number[] = [];

    for (const question of ieltsQuestions) {
      // Extract question number from topicTags: "qnum:7" → 7
      const qnumTag = question.topicTags.find(t => t.startsWith('qnum:'));
      const qNum = qnumTag ? parseInt(qnumTag.split(':')[1], 10) : null;

      if (qNum === null) {
        skippedCount++;
        continue;
      }

      const correctKey = answerKeyMap.get(qNum);
      if (!correctKey) {
        this.logger.warn(`[AK] Q${qNum}: no answer in answer key map — skipping`);
        skippedCount++;
        unknownNumbers.push(qNum);
        continue;
      }

      // Determine the correct answer and update options accordingly.
      const upper = correctKey.toUpperCase();
      const isBooleanAns = /^(TRUE|FALSE|YES|NO|NOT GIVEN)$/i.test(upper);
      const isLetterAns = /^[A-J]$/.test(upper);
      const currentOptions = (question.options as { key: string; text: string }[] | null) ?? [];

      let newOptions = currentOptions;
      let newCorrectAnswer = correctKey;

      if (question.questionType === 'true_false_ng') {
        // T/F/NG: correctAnswer is the value (TRUE, FALSE, NOT GIVEN)
        newCorrectAnswer = upper;
        // Ensure options exist
        if (newOptions.length === 0) {
          const keys = /^(YES|NO)$/i.test(upper)
            ? ['YES', 'NO', 'NOT GIVEN']
            : ['TRUE', 'FALSE', 'NOT GIVEN'];
          newOptions = keys.map(k => ({ key: k, text: k }));
        }
      } else if (question.questionType === 'gap_fill') {
        // Gap-fill: correctAnswer is the free-text word
        newCorrectAnswer = correctKey;
        newOptions = []; // No selectable options
      } else {
        // MCQ / matching: correctAnswer is the letter (A-G)
        newCorrectAnswer = upper;
        // If no options exist yet for matching, build A-J placeholder
        if (newOptions.length === 0 && isLetterAns) {
          const maxLetter = upper.charCodeAt(0) - 64; // A=1, B=2, ...
          const count = Math.max(maxLetter + 2, 7); // At least up to the answer + 2
          newOptions = Array.from({ length: Math.min(count, 10) }, (_, i) => ({
            key: String.fromCharCode(65 + i),
            text: String.fromCharCode(65 + i),
          }));
        }
      }

      await this.prisma.ieltsQuestion.update({
        where: { id: question.id },
        data: {
          correctAnswer: newCorrectAnswer,
          options: newOptions as any,
          status: 'active',
        },
      });

      updatedCount++;
    }

    this.logger.log(`[AK] SUMMARY: total_questions=${ieltsQuestions.length}, applied=${updatedCount}, skipped=${skippedCount}, ak_map_size=${answerKeyMap.size}`);
    if (unknownNumbers.length > 0) {
      this.logger.warn(`[AK] Question numbers not in answer key: [${unknownNumbers.join(', ')}]`);
    }

    return {
      repository_id: repository.id,
      slug: repository.slug,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      answer_key_complete: updatedCount >= ieltsQuestions.length && ieltsQuestions.length > 0,
      skill_area:
        ((await this.prisma.examRepository.findUnique({
          where: { id: repository.id },
          select: { skill_area: true },
        }))?.skill_area) ?? 'unknown',
      source_filename: basename(file.originalname || file.path),
      total_answers_detected: answerKeyMap.size,
      applied_items: updatedCount,
      unanswered_items: Math.max(0, ieltsQuestions.length - updatedCount),
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

    // Get the repository slug for tagging IeltsQuestion records.
    const repo = await this.prisma.examRepository.findUnique({
      where: { id: repositoryId },
      select: { slug: true },
    });
    const repoSlug = repo?.slug ?? `repo-${repositoryId}`;

    const passageCache = new Map<string, string>();

    for (const parsed of parsedQuestions) {
      // Skip questions without any identifiable content.
      if (!parsed.questionNumber && !parsed.stem) {
        skippedCount++;
        continue;
      }

      // Use fast heuristic IRT bootstrap.
      const targetBand = (config.bandMin + config.bandMax) / 2;
      const heuristicIrt = bootstrapIrt(targetBand, this.mapPlacementType(parsed.questionType));
      const irt = { irt_b: heuristicIrt.irt_b, confidence: 'low' as const };

      // ── Create IeltsPassage for passage content ──
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

      // ── Build options for IeltsQuestion based on question type ──
      const isGapFill = parsed.questionType === 'fill-blank' || parsed.questionType === 'short-answer';
      const isTrueFalse = parsed.questionType === 'true-false';

      let ieltsOptions: { key: string; text: string }[];
      let ieltsCorrectAnswer: string;

      if (isGapFill) {
        // Gap-fill: no selectable options — frontend renders text input.
        ieltsOptions = [];
        ieltsCorrectAnswer = parsed.options.find(o => o.isCorrect)?.optionText || '';
      } else if (isTrueFalse) {
        // T/F/NG or Y/N/NG: use the value as key.
        const variant = parsed.tfVariant ?? 'tf';
        const keys = variant === 'yn'
          ? ['YES', 'NO', 'NOT GIVEN']
          : ['TRUE', 'FALSE', 'NOT GIVEN'];
        ieltsOptions = keys.map(k => ({ key: k, text: k }));
        ieltsCorrectAnswer = parsed.options.find(o => o.isCorrect)?.optionKey || '';
      } else {
        // MCQ / matching: keep letter keys with option text.
        ieltsOptions = parsed.options.map(o => ({ key: o.optionKey, text: o.optionText }));
        ieltsCorrectAnswer = parsed.options.find(o => o.isCorrect)?.optionKey || '';
      }

      // ── Build meaningful questionText ──
      // Use the OCR stem if available; otherwise describe the question.
      const qNum = parsed.questionNumber ?? importedCount + 1;
      let questionText = parsed.stem;
      if (!questionText || questionText === `[Câu ${qNum}]`) {
        // No real stem — use a descriptive fallback based on type.
        if (isGapFill) {
          questionText = `Question ${qNum}: Complete the sentence with a suitable word.`;
        } else if (isTrueFalse) {
          questionText = `Question ${qNum}: Decide if the following statement is TRUE, FALSE or NOT GIVEN.`;
        } else {
          questionText = `Question ${qNum}`;
        }
      }

      // ── Create IeltsQuestion directly (no ExamRepositoryItem) ──
      // topicTags encode the repo slug and question number for answer key matching.
      await this.prisma.ieltsQuestion.create({
        data: {
          skill: skillArea,
          questionType: this.mapPlacementType(parsed.questionType),
          questionText,
          options: ieltsOptions as any,
          correctAnswer: ieltsCorrectAnswer,
          explanation: parsed.explanation,
          bandMin: config.bandMin,
          bandMax: config.bandMax,
          expectedTimeSec: this.estimateSeconds(skillArea, parsed.questionType),
          irtA: 1.0,
          irtB: irt.irt_b,
          irtC: 0.25,
          isPlacement: true,
          status: ieltsCorrectAnswer ? 'active' : 'draft',
          passage_id: passageId,
          contextType: skillArea === 'listening' ? 'audio' : (passageId ? 'passage' : 'standalone'),
          topicTags: [`repo:${repoSlug}`, `qnum:${qNum}`],
        },
      });

      importedCount++;
    }

    return { importedCount, skippedCount };
  }
}

export { cleanOcrText, parseIeltsQuestionsFromText, extractAnswerKeyMap };
