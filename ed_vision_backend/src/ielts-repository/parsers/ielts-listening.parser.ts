/**
 * Listening Parser
 * Extracts sections + questions from IELTS Listening DOCX/text content.
 *
 * Structure:
 * SECTION 1  (section_number 1–4)
 * [Context description — used as passage body]
 * Questions 1–10
 * [Question type header]
 * Questions...
 * ANSWER KEY: 1-B 2-... etc.
 *
 * Audio URL is provided separately (not embedded in the doc).
 */

export interface ParsedListeningQuestion {
  questionNumber: number;
  questionText: string;
  questionType: string;
  options?: string[];
  answerKey?: string;
}

export interface ParsedListeningSection {
  sectionNumber: number; // 1–4
  context: string; // Description shown to student (maps to passage body)
  questions: ParsedListeningQuestion[];
}

export interface ListeningParseResult {
  sections: ParsedListeningSection[];
  rawAnswerKey: Record<number, string>;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const LISTENING_TYPE_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /multiple\s+choice/i, type: 'multiple_choice' },
  { pattern: /note\s+completion/i, type: 'note_completion' },
  { pattern: /table\s+completion/i, type: 'table_completion' },
  { pattern: /flow.?chart/i, type: 'flow_chart' },
  { pattern: /sentence\s+completion/i, type: 'sentence_completion' },
  { pattern: /summary\s+completion/i, type: 'summary_completion' },
  { pattern: /diagram\s+label/i, type: 'diagram_labelling' },
  { pattern: /matching/i, type: 'matching_features' },
  { pattern: /short.?answer/i, type: 'short_answer' },
];

function detectType(text: string): string {
  for (const { pattern, type } of LISTENING_TYPE_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return 'note_completion'; // listening default
}

function parseAnswerKeyLine(line: string): Record<number, string> {
  const result: Record<number, string> = {};
  const tokens = line.replace(/ANSWER\s+KEY\s*:?/i, '').trim().split(/\s+/);
  for (const token of tokens) {
    const m = token.match(/^(\d+)[-.](.+)$/);
    if (m) result[parseInt(m[1])] = m[2].toUpperCase();
  }
  return result;
}

// ── main parser ───────────────────────────────────────────────────────────────

export function parseListeningContent(rawText: string): ListeningParseResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const sections: ParsedListeningSection[] = [];
  const rawAnswerKey: Record<number, string> = {};

  let currentSection: ParsedListeningSection | null = null;
  let currentType = 'note_completion';
  let contextLines: string[] = [];
  let inContext = false;
  let inQuestions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Answer key
    if (/ANSWER\s+KEY/i.test(line)) {
      Object.assign(rawAnswerKey, parseAnswerKeyLine(line));
      if (i + 1 < lines.length && /^\d/.test(lines[i + 1])) {
        Object.assign(rawAnswerKey, parseAnswerKeyLine(lines[++i]));
      }
      continue;
    }

    // ── Section heading
    const secMatch = line.match(/^SECTION\s+(\d+)/i);
    if (secMatch) {
      if (currentSection) {
        currentSection.context = contextLines.join(' ').trim();
        sections.push(currentSection);
      }
      currentSection = {
        sectionNumber: parseInt(secMatch[1]),
        context: '',
        questions: [],
      };
      contextLines = [];
      inContext = true;
      inQuestions = false;
      continue;
    }

    if (!currentSection) continue;

    // ── Questions block start
    if (/^Questions?\s+\d+/i.test(line)) {
      if (inContext) {
        currentSection.context = contextLines.join(' ').trim();
        contextLines = [];
      }
      inContext = false;
      inQuestions = true;
      currentType = detectType(lines[i + 1] ?? '');
      continue;
    }

    // ── Question type header inside block
    if (
      inQuestions &&
      LISTENING_TYPE_PATTERNS.some((p) => p.pattern.test(line))
    ) {
      currentType = detectType(line);
      continue;
    }

    // ── Context lines
    if (inContext) {
      contextLines.push(line);
      continue;
    }

    // ── Question line
    if (inQuestions) {
      const qm = line.match(/^(\d+)\s*[.)]\s*(.+)/);
      if (qm) {
        const qNum = parseInt(qm[1]);
        const options: string[] = [];
        while (
          i + 1 < lines.length &&
          /^[A-D][.)]\s+/.test(lines[i + 1])
        ) {
          options.push(lines[++i].replace(/^[A-D][.)]\s+/, '').trim());
        }
        currentSection.questions.push({
          questionNumber: qNum,
          questionText: qm[2],
          questionType: currentType,
          options: options.length ? options : undefined,
          answerKey: rawAnswerKey[qNum],
        });
      }
    }
  }

  // Flush last section
  if (currentSection) {
    if (inContext) currentSection.context = contextLines.join(' ').trim();
    sections.push(currentSection);
  }

  // Attach late answer keys
  for (const sec of sections) {
    for (const q of sec.questions) {
      if (!q.answerKey && rawAnswerKey[q.questionNumber]) {
        q.answerKey = rawAnswerKey[q.questionNumber];
      }
    }
  }

  return { sections, rawAnswerKey };
}
