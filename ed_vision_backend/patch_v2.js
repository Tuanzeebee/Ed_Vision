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

    type LineBlock = {
      questionNumber: number;
      rawLines: string[];
      detectedPart: number | null;
      assignedPassage: string | null;
    };

    const blocks: LineBlock[] = [];
    let currentPart: number | null = null;
    let currentBlock: LineBlock | null = null;

    let currentPassageLines: string[] = [];
    let currentPassageQuestionRange: [number, number] | null = null;

    const isQuestionStarter = (line: string): { qNum: number; rest: string } | null => {
      const m =
        line.match(/^(?:question\\s*|c[aâ]u\\s*)?(\\d{1,3})\\s*[).:\\-~]\\s*(.*)$/i) ??
        line.match(/^(\\d{1,3})\\s{2,}(.*)$/); 

      if (!m) return null;

      const qNum = Number(m[1]);
      if (qNum < 1 || qNum > 200) return null;

      const rest = (m[2] ?? '').trim();

      if (/^[A-D]\\s*\\.?\\s*$/.test(rest)) return null;
      if (this.isLikelyAnswerKeyLine(line)) return null;

      return { qNum, rest };
    };

    const pushBlock = () => {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = null;
    };

    for (const line of lines) {
      const detectedPart = this.detectToeicPartFromText(line);
      if (detectedPart) {
        pushBlock();
        currentPart = detectedPart;
        currentPassageLines = [];
        currentPassageQuestionRange = null;
        continue;
      }

      const passageGroupMatch = line.match(
        /questions?\\s+(\\d{1,3})\\s*[-–—~_to\\s]+\\s*(\\d{1,3})\\s+(?:refer|relate|based|reler|reref)/i,
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

      const singlePassageMatch = line.match(/questions?\\s+(\\d{1,3})\\s+(?:refer|relate|based|reler|reref)/i);
      if (singlePassageMatch) {
        pushBlock();
        currentPassageLines = [];
        currentPassageQuestionRange = [
          Number(singlePassageMatch[1]),
          Number(singlePassageMatch[1]),
        ];
        continue;
      }

      const starterResult = isQuestionStarter(line);
      if (starterResult) {
        pushBlock();

        let assignedPassage: string | null = null;
        if (currentPassageLines.length > 0) {
          if (
            currentPassageQuestionRange === null ||
            (starterResult.qNum >= currentPassageQuestionRange[0] &&
              starterResult.qNum <= currentPassageQuestionRange[1])
          ) {
            assignedPassage = currentPassageLines.join(' ').replace(/\\s+/g, ' ').trim();
          }
        }

        currentBlock = {
          questionNumber: starterResult.qNum,
          rawLines: starterResult.rest ? [starterResult.rest] : [],
          detectedPart: currentPart,
          assignedPassage,
        };
        continue;
      }

      if (currentBlock) {
        currentBlock.rawLines.push(line);
      } else if (
        currentPassageQuestionRange !== null &&
        !this.isLikelyAnswerKeyLine(line)
      ) {
        currentPassageLines.push(line);
      }
    }

    pushBlock();

    if (blocks.length === 0) return [];

    const isOptionLine = (
      line: string,
    ): { key: ToeicOptionKey; text: string } | null => {
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
      const { questionNumber, rawLines, detectedPart, assignedPassage } = block;

      const optionsMap = new Map<string, string>();
      const stemLines: string[] = [];
      let lastOptionKey: string | null = null;
      let optionPhaseStarted = false;

      for (const line of rawLines) {
        const optResult = isOptionLine(line);

        if (optResult) {
          optionsMap.set(optResult.key, optResult.text);
          lastOptionKey = optResult.key;
          optionPhaseStarted = true;
          continue;
        }

        if (!optionPhaseStarted) {
          stemLines.push(line);
        } else if (lastOptionKey && this.isLikelyOptionContinuationLine(line)) {
          const prev = optionsMap.get(lastOptionKey) ?? '';
          optionsMap.set(lastOptionKey, \`\${prev} \${line}\`.replace(/\\s+/g, ' ').trim());
        }
      }

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

      let stem = stemLines.join(' ').replace(/\\s+/g, ' ').trim();
      if (!stem) {
        stem = \`[Điền vào chỗ trống — câu \${questionNumber}]\`;
      }

      const correctKey = answerKeyMap.get(questionNumber) ?? null;
      if (correctKey) {
        const found = options.find((o) => o.optionKey === correctKey);
        if (found) found.isCorrect = true;
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
