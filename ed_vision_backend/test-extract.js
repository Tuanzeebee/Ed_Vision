const { ToeicPracticeImportService } = require('./dist/teacher_be/toeic-repository/toeic-practice-import.service');

// We need to bypass the DI. Let's just copy the logic to a test script.

const rawText = `PART 5
Directions: A word or phrase is missing in each of the sentences below. Four answer choices are given below each sentence. Select the best answer to complete the sentence. Then mark the letter (A), (B), (C), or (D) on your answer sheet.

101. Power Secure Company CEO Inez Anslata
spoke about ------ recent experiences.
(A) has
(B) to have
(C) having
(D) had

102. Passengers who will be taking a ------
domestic flight should go to Terminal A.
(A) connecting
(B) connects
(C) connect
(D) connection
`;

// Copying just the function
function normalizeOptionKey(key) {
    if (!key) return null;
    const k = key.toUpperCase();
    return ['A', 'B', 'C', 'D'].includes(k) ? k : null;
}

function detectToeicPartFromText(text) {
    const m = text.match(/^(?:part|ph[aâ]n)\s*([1-7])/i);
    return m ? Number(m[1]) : null;
}

function isLikelyAnswerKeyLine(line) {
    return false;
}

function extractInlineOptionsFromLine(line) {
    return { stem: line, options: [] };
}

function isLikelyOptionContinuationLine(line) {
    return false;
}

function parseQuestionsFromText(rawText) {
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

    const blocks = [];
    let currentPart = null;
    let currentBlock = null;

    let currentPassageLines = [];
    let currentPassageQuestionRange = null;

    const isQuestionStarter = (line) => {
      const m =
        line.match(/^(?:question\s*|c[aâ]u\s*)?(\d{1,3})\s*[).:\-]\s*(.*)$/i) ??
        line.match(/^(\d{1,3})\s{2,}(.*)$/); 

      if (!m) return null;

      const qNum = Number(m[1]);
      if (qNum < 1 || qNum > 200) return null;

      const rest = (m[2] ?? '').trim();
      if (/^[A-D]\s*\.?\s*$/.test(rest)) return null;

      return { qNum, rest };
    };

    const pushBlock = () => {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = null;
    };

    for (const line of lines) {
      const detectedPart = detectToeicPartFromText(line);
      if (detectedPart) {
        pushBlock();
        currentPart = detectedPart;
        currentPassageLines = [];
        currentPassageQuestionRange = null;
        continue;
      }

      const passageGroupMatch = line.match(
        /questions?\s+(\d{1,3})\s*[-–to]+\s*(\d{1,3})\s+refer/i,
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

      const singlePassageMatch = line.match(/questions?\s+(\d{1,3})\s+refer/i);
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

        let assignedPassage = null;
        if (currentPassageLines.length > 0) {
          if (
            currentPassageQuestionRange === null ||
            (starterResult.qNum >= currentPassageQuestionRange[0] &&
              starterResult.qNum <= currentPassageQuestionRange[1])
          ) {
            assignedPassage = currentPassageLines.join(' ').replace(/\s+/g, ' ').trim();
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
        currentPassageQuestionRange !== null 
      ) {
        currentPassageLines.push(line);
      }
    }

    pushBlock();

    if (blocks.length === 0) return [];

    const isOptionLine = (
      line
    ) => {
      const m = line.match(
        /^(?:\()?([A-D])(?:\))?\s*[.):\-]?\s+(.+)$/i,
      );
      if (!m) return null;
      const key = normalizeOptionKey(m[1]);
      if (!key) return null;
      return { key, text: m[2].trim() };
    };

    const questions = [];

    for (const block of blocks) {
      const { questionNumber, rawLines, detectedPart, assignedPassage } = block;

      const optionsMap = new Map();
      const stemLines = [];
      let lastOptionKey = null;

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
        } else if (lastOptionKey && isLikelyOptionContinuationLine(line)) {
          const prev = optionsMap.get(lastOptionKey) ?? '';
          optionsMap.set(lastOptionKey, `${prev} ${line}`.replace(/\s+/g, ' ').trim());
        }
      }

      if (optionsMap.size === 0 && stemLines.length === 1) {
        const inline = extractInlineOptionsFromLine(stemLines[0]);
        if (inline.options.length >= 2) {
          stemLines[0] = inline.stem;
          for (const opt of inline.options) {
            const key = normalizeOptionKey(opt.optionKey);
            if (key) optionsMap.set(key, opt.optionText.trim());
          }
        }
      }

      const optionKeys = ['A', 'B', 'C', 'D'];
      const options = optionKeys
        .filter((k) => optionsMap.has(k))
        .map((k) => ({
          optionKey: k,
          optionText: optionsMap.get(k).trim(),
          isCorrect: false,
        }))
        .filter((o) => o.optionText.length > 0);

      if (options.length < 2) continue;

      let stem = stemLines.join(' ').replace(/\s+/g, ' ').trim();
      if (!stem) {
        stem = `[Điền vào chỗ trống — câu ${questionNumber}]`;
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
  }

console.log(JSON.stringify(parseQuestionsFromText(rawText), null, 2));
