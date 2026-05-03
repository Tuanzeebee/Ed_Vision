const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'teacher_be', 'toeic-repository', 'toeic-practice-import.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newMethod = `  private parseQuestionsFromText(rawText: string): ParsedPracticeQuestion[] {
    const normalized = rawText
      .replace(/\\r\\n/g, '\\n')
      .replace(/\\r/g, '\\n')
      .replace(/\\u00a0/g, ' ')
      .replace(/[\\t\\f\\v]+/g, ' ')
      .trim();

    if (!normalized) return [];

    const lines = normalized
      .split('\\n')
      .map((l) => l.replace(/\\s+/g, ' ').trim())
      .filter((l) => l.length > 0);

    const answerKeyMap = this.extractAnswerKeyMap(normalized);

    // ── PASS 1: Phân nhóm lines theo số câu ────────────────────────────────────
    // Mỗi "block" = { questionNumber, lines[] }
    // Một dòng là "question starter" nếu bắt đầu bằng số 1-200
    // và KHÔNG phải là answer key line thuần túy (e.g. "131. A")

    type LineBlock = {
      questionNumber: number;
      rawLines: string[];
      detectedPart: number | null;
    };

    const blocks: LineBlock[] = [];
    let currentPart: number | null = null;
    let currentBlock: LineBlock | null = null;

    // Passage tracking
    let currentPassageLines: string[] = [];
    let currentPassageQuestionRange: [number, number] | null = null;

    const isQuestionStarter = (line: string): { qNum: number; rest: string } | null => {
      // Khớp: "131.", "131)", "131-", "131:", "Question 131.", "Câu 131."
      // rest có thể rỗng (Định dạng B) hoặc có nội dung (Định dạng A)
      const m =
        line.match(/^(?:question\\s*|c[aâ]u\\s*)?(\\d{1,3})\\s*[).:\\-]\\s*(.*)$/i) ??
        line.match(/^(\\d{1,3})\\s{2,}(.*)$/); // 2+ spaces separator (tab-like)

      if (!m) return null;

      const qNum = Number(m[1]);
      if (qNum < 1 || qNum > 200) return null;

      const rest = (m[2] ?? '').trim();

      // Loại bỏ: "131. A" — answer key entry thuần túy
      // Nhưng CHO PHÉP: "131. A. advance" — có nội dung sau letter
      if (/^[A-D]\\s*\\.?\\s*$/.test(rest)) return null;

      // Loại bỏ: dòng chứa nhiều cặp "số-letter" → đây là answer key block
      if (this.isLikelyAnswerKeyLine(line)) return null;

      return { qNum, rest };
    };

    const pushBlock = () => {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = null;
    };

    for (const line of lines) {
      // ── PART header ─────────────────────────────────────────────────────────
      const detectedPart = this.detectToeicPartFromText(line);
      if (detectedPart) {
        pushBlock();
        currentPart = detectedPart;
        currentPassageLines = [];
        currentPassageQuestionRange = null;
        continue;
      }

      // ── Passage group: "Questions 153-155 refer to..." ───────────────────
      const passageGroupMatch = line.match(
        /questions?\\s+(\\d{1,3})[-–](\\d{1,3})\\s+refer/i,
      );
      if (passageGroupMatch) {
        pushBlock();
        currentPassageLines = [];
        currentPassageQuestionRange = [
          Number(passageGroupMatch[1]),
          Number(passageGroupMatch[2]),
        ];
        continue;
      }

      const singlePassageMatch = line.match(/questions?\\s+(\\d{1,3})\\s+refer/i);
      if (singlePassageMatch) {
        pushBlock();
        currentPassageLines = [];
        currentPassageQuestionRange = [
          Number(singlePassageMatch[1]),
          Number(singlePassageMatch[1]),
        ];
        continue;
      }

      // ── Question starter? ────────────────────────────────────────────────
      const starterResult = isQuestionStarter(line);
      if (starterResult) {
        pushBlock();
        currentBlock = {
          questionNumber: starterResult.qNum,
          rawLines: starterResult.rest ? [starterResult.rest] : [],
          detectedPart: currentPart,
        };
        continue;
      }

      // ── Thuộc về block hiện tại ──────────────────────────────────────────
      if (currentBlock) {
        currentBlock.rawLines.push(line);
      } else if (
        currentPassageQuestionRange !== null &&
        !this.isLikelyAnswerKeyLine(line)
      ) {
        // Tích lũy passage lines
        currentPassageLines.push(line);
      }
    }

    pushBlock();

    if (blocks.length === 0) return [];

    // ── PASS 2: Trong mỗi block, tách stem + options ────────────────────────────
    //
    // Logic nhận diện option LINE (bất kỳ định dạng):
    //   "A. text"  "A) text"  "(A) text"  "A - text"  "A text" (nếu đứng đầu dòng)
    //
    // QUAN TRỌNG: Một dòng như "A. advance" (Định dạng A, Đề 1) PHẢI được coi
    // là option, không phải stem continuation.

    const isOptionLine = (
      line: string,
    ): { key: ToeicOptionKey; text: string } | null => {
      // Pattern đầy đủ: (A), A), A., A-, A:, A  text
      const m = line.match(
        /^(?:\\()?([A-D])(?:\\))?\\s*[.):\\-]?\\s+(.+)$/i,
      );
      if (!m) return null;
      const key = this.normalizeOptionKey(m[1]);
      if (!key) return null;
      return { key, text: m[2].trim() };
    };

    const questions: ParsedPracticeQuestion[] = [];

    for (const block of blocks) {
      const { questionNumber, rawLines, detectedPart } = block;

      const optionsMap = new Map<string, string>();
      const stemLines: string[] = [];
      let lastOptionKey: string | null = null;

      // Trạng thái: đã gặp option nào chưa?
      let optionPhaseStarted = false;

      for (const line of rawLines) {
        const optResult = isOptionLine(line);

        if (optResult) {
          // Dòng này là option
          optionsMap.set(optResult.key, optResult.text);
          lastOptionKey = optResult.key;
          optionPhaseStarted = true;
          continue;
        }

        // Không phải option line
        if (!optionPhaseStarted) {
          // Chưa gặp option nào → đây là stem
          stemLines.push(line);
        } else if (lastOptionKey && this.isLikelyOptionContinuationLine(line)) {
          // Continuation của option cuối
          const prev = optionsMap.get(lastOptionKey) ?? '';
          optionsMap.set(lastOptionKey, \`\${prev} \${line}\`.replace(/\\s+/g, ' ').trim());
        }
        // Nếu đã vào option phase nhưng dòng không phải option/continuation → bỏ qua
      }

      // ── Inline options trong stem line (Định dạng A: "131. A. advance B. advanced...") ──
      // Trường hợp tất cả options nằm trong 1 dòng stem duy nhất
      if (optionsMap.size === 0 && stemLines.length === 1) {
        const inline = this.extractInlineOptionsFromLine(stemLines[0]);
        if (inline.options.length >= 2) {
          stemLines[0] = inline.stem;
          for (const opt of inline.options) {
            const key = this.normalizeOptionKey(opt.optionKey);
            if (key) optionsMap.set(key, opt.optionText.trim());
          }
        }
      }

      // ── Kiểm tra đủ options ───────────────────────────────────────────────
      const optionKeys = ['A', 'B', 'C', 'D'];
      const options: ParsedOption[] = optionKeys
        .filter((k) => optionsMap.has(k))
        .map((k) => ({
          optionKey: k as ToeicOptionKey,
          optionText: optionsMap.get(k)!.trim(),
          isCorrect: false,
        }))
        .filter((o) => o.optionText.length > 0);

      if (options.length < 2) continue;

      // ── Stem: fallback cho Part 6 (chỗ trống = stem rỗng) ────────────────
      let stem = stemLines.join(' ').replace(/\\s+/g, ' ').trim();
      if (!stem) {
        stem = \`[Điền vào chỗ trống — câu \${questionNumber}]\`;
      }

      // ── Correct answer ────────────────────────────────────────────────────
      const correctKey = answerKeyMap.get(questionNumber) ?? null;
      if (correctKey) {
        const found = options.find((o) => o.optionKey === correctKey);
        if (found) found.isCorrect = true;
      }

      // ── Reading passage ───────────────────────────────────────────────────
      let assignedPassage: string | null = null;
      if (currentPassageLines.length > 0) {
        if (
          currentPassageQuestionRange === null ||
          (questionNumber >= currentPassageQuestionRange[0] &&
            questionNumber <= currentPassageQuestionRange[1])
        ) {
          assignedPassage = currentPassageLines.join(' ').replace(/\\s+/g, ' ').trim();
        }
      }

      questions.push({
        questionNumber,
        stem,
        options,
        detectedPart,
        readingPassage: assignedPassage,
      });
    }

    return questions;
  }`;

const startIdx = content.indexOf('  private parseQuestionsFromText(rawText: string): ParsedPracticeQuestion[] {');
if (startIdx === -1) throw new Error("Could not find start");

const endStr = '  // ── Public API ───────────────────────────────────────────────────────────────';
const endIdx = content.indexOf(endStr, startIdx);
if (endIdx === -1) throw new Error("Could not find end");

const before = content.slice(0, startIdx);
const after = content.slice(endIdx);

fs.writeFileSync(filePath, before + newMethod + '\n\n' + after);
console.log('Replaced successfully');
