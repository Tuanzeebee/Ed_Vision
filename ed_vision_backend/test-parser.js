"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const toeic_practice_import_service_1 = require("./src/teacher_be/toeic-repository/toeic-practice-import.service");
const parser = new toeic_practice_import_service_1.ToeicPracticeImportService(null);
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
const parsed = parser.parseQuestionsFromText(text);
console.log(JSON.stringify(parsed, null, 2));
//# sourceMappingURL=test-parser.js.map