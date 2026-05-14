/**
 * Reading Parser
 * Extracts passages + questions from IELTS Reading DOCX/text content.
 *
 * Expected document structure:
 * PASSAGE 1
 * [Title]
 * [Body text...]
 * Questions 1–13
 * Question type header (e.g., "TRUE / FALSE / NOT GIVEN")
 * Question lines...
 * ANSWER KEY: 1-A 2-TRUE ...
 */

export interface ParsedReadingQuestion {
  questionNumber: number;
  questionText: string;
  questionType: string;
  options?: string[]; // for MCQ
  answerKey?: string;
}

export interface ParsedReadingPassage {
  passageNumber: number; // 1, 2, 3
  title: string;
  body: string;
  questions: ParsedReadingQuestion[];
}

export interface ReadingParseResult {
  passages: ParsedReadingPassage[];
  rawAnswerKey: Record<number, string>; // { 1: 'TRUE', 2: 'B', ... }
}

// ── helpers ──────────────────────────────────────────────────────────────────

const QUESTION_TYPE_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  {
    pattern: /true\s*\/\s*false\s*\/\s*not\s*given/i,
    type: 'true_false_not_given',
  },
  { pattern: /yes\s*\/\s*no\s*\/\s*not\s*given/i, type: 'yes_no_not_given' },
  { pattern: /matching\s+headings/i, type: 'matching_headings' },
  { pattern: /matching\s+information/i, type: 'matching_information' },
  { pattern: /matching\s+features/i, type: 'matching_features' },
  { pattern: /sentence\s+completion/i, type: 'sentence_completion' },
  { pattern: /summary\s+completion/i, type: 'summary_completion' },
  { pattern: /note\s+completion/i, type: 'note_completion' },
  { pattern: /table\s+completion/i, type: 'table_completion' },
  { pattern: /flow.?chart/i, type: 'flow_chart' },
  { pattern: /diagram\s+label/i, type: 'diagram_labelling' },
  { pattern: /multiple\s+choice/i, type: 'multiple_choice' },
  { pattern: /short.?answer/i, type: 'short_answer' },
];

function detectQuestionType(header: string): string {
  for (const { pattern, type } of QUESTION_TYPE_PATTERNS) {
    if (pattern.test(header)) return type;
  }
  return 'short_answer';
}

function parseAnswerKeyLine(line: string): Record<number, string> {
  const result: Record<number, string> = {};
  // Format: "1-A 2-TRUE 3-C" or "1. A  2. FALSE"
  const tokens = line.replace(/ANSWER\s+KEY\s*:?/i, '').trim().split(/\s+/);
  for (const token of tokens) {
    const match = token.match(/^(\d+)[-.](.+)$/);
    if (match) result[parseInt(match[1])] = match[2].toUpperCase();
  }
  return result;
}

// ── main parser ───────────────────────────────────────────────────────────────

export function parseReadingContent(rawText: string): ReadingParseResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const passages: ParsedReadingPassage[] = [];
  const rawAnswerKey: Record<number, string> = {};

  let currentPassage: ParsedReadingPassage | null = null;
  let currentQuestionType = 'short_answer';
  let inBodySection = false;
  let inQuestionsSection = false;
  let bodyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Answer key (can appear anywhere at end of doc)
    if (/ANSWER\s+KEY/i.test(line)) {
      const keyData = parseAnswerKeyLine(line);
      Object.assign(rawAnswerKey, keyData);
      // Try next line too (sometimes split across two lines)
      if (i + 1 < lines.length && /^\d/.test(lines[i + 1])) {
        Object.assign(rawAnswerKey, parseAnswerKeyLine(lines[++i]));
      }
      continue;
    }

    // ── New passage heading
    const passageMatch = line.match(/^PASSAGE\s+(\d+)/i);
    if (passageMatch) {
      if (currentPassage) {
        currentPassage.body = bodyLines.join(' ').trim();
        passages.push(currentPassage);
      }
      currentPassage = {
        passageNumber: parseInt(passageMatch[1]),
        title: lines[i + 1] ?? '',
        body: '',
        questions: [],
      };
      bodyLines = [];
      inBodySection = true;
      inQuestionsSection = false;
      i++; // skip title line
      continue;
    }

    if (!currentPassage) continue;

    // ── Questions section start
    if (/^Questions?\s+\d+/i.test(line)) {
      if (inBodySection) {
        currentPassage.body = bodyLines.join(' ').trim();
        bodyLines = [];
      }
      inBodySection = false;
      inQuestionsSection = true;
      // Detect type from surrounding context
      currentQuestionType = detectQuestionType(lines[i + 1] ?? '');
      continue;
    }

    // ── Question type header inside questions block
    if (
      inQuestionsSection &&
      QUESTION_TYPE_PATTERNS.some((p) => p.pattern.test(line))
    ) {
      currentQuestionType = detectQuestionType(line);
      continue;
    }

    // ── Body text
    if (inBodySection) {
      bodyLines.push(line);
      continue;
    }

    // ── Individual question line: starts with number
    if (inQuestionsSection) {
      const qMatch = line.match(/^(\d+)\s*[.)]\s*(.+)/);
      if (qMatch) {
        const qNum = parseInt(qMatch[1]);
        const qText = qMatch[2];
        const options: string[] = [];

        // Collect MCQ options (A. / B. / C. / D.)
        while (
          i + 1 < lines.length &&
          /^[A-D][.)]\s+/.test(lines[i + 1])
        ) {
          options.push(lines[++i].replace(/^[A-D][.)]\s+/, '').trim());
        }

        currentPassage.questions.push({
          questionNumber: qNum,
          questionText: qText,
          questionType: currentQuestionType,
          options: options.length ? options : undefined,
          answerKey: rawAnswerKey[qNum],
        });
      }
    }
  }

  // Flush last passage
  if (currentPassage) {
    if (inBodySection) currentPassage.body = bodyLines.join(' ').trim();
    passages.push(currentPassage);
  }

  // Attach answer keys to questions (in case key appeared after questions)
  for (const passage of passages) {
    for (const q of passage.questions) {
      if (!q.answerKey && rawAnswerKey[q.questionNumber]) {
        q.answerKey = rawAnswerKey[q.questionNumber];
      }
    }
  }

  return { passages, rawAnswerKey };
}
