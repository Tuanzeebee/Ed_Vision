"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const toeic_practice_import_service_1 = require("./src/teacher_be/toeic-repository/toeic-practice-import.service");
const text = `PART 6: TEXT COMPLETION
Questions 141-143 refer to the following email.
To: All Employees
From: Human Resources
Subject: Annual Leave Policy Update

Dear Staff,
Effective next month, there will be a change to the company's annual leave
policy. Employees will now be (141) ______ to carry over up to five unused
vacation days to the following year.

141.
A. allow
B. allowing
C. allowed
D. allowance

142.
A. by
B. at
C. on
D. for

143.
A. wait
B. hesitate
C. stop
D. delay
`;
const parser = new toeic_practice_import_service_1.ToeicPracticeImportService(null);
parser.isQuestionStarter = (line) => {
    const m = line.match(/^(?:question\s*|c[aâ]u\s*)?(\d{1,3})\s*[).:\-~]\s*(.*)$/i) ??
        line.match(/^(\d{1,3})\s{2,}(.*)$/);
    if (!m)
        return null;
    const qNum = Number(m[1]);
    if (qNum < 1 || qNum > 200)
        return null;
    const rest = (m[2] ?? '').trim();
    if (/^[A-D]\s*\.?\s*$/.test(rest))
        return null;
    if (parser.isLikelyAnswerKeyLine(line))
        return null;
    return { qNum, rest };
};
const lines = text.split('\n');
let currentBlock = null;
const questions = [];
const blocks = [];
for (const line of lines) {
    const starter = parser.isQuestionStarter(line);
    if (starter) {
        if (currentBlock)
            blocks.push(currentBlock);
        currentBlock = { qNum: starter.qNum, rawLines: starter.rest ? [starter.rest] : [] };
        continue;
    }
    if (currentBlock) {
        currentBlock.rawLines.push(line);
    }
}
if (currentBlock)
    blocks.push(currentBlock);
for (const block of blocks) {
    const optionsMap = new Map();
    for (const rLine of block.rawLines) {
        const m = rLine.match(/^(?:\()?([A-D])(?:\))?\s*[.):\-]?\s+(.+)$/i);
        if (m) {
            optionsMap.set(parser.normalizeOptionKey(m[1]), m[2]);
        }
    }
    console.log(`Block ${block.qNum}: Found options:`, Array.from(optionsMap.keys()));
}
//# sourceMappingURL=test-parser5.js.map