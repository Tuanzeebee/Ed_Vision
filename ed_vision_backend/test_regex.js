const text = `
PART 6: TEXT COMPLETION
Directions: Read the texts and select the best answer for each blank.
Questions 141-143 refer to the following memo.
Please be aware that the employee parking lot will be repaved next week. Work is
scheduled to (141) ______ on Monday, May 12, and continue until Friday, May 16.
141. (A) begin (B) begins (C) began (D) beginning
142. (A) Which (B) What (C) Who (D) Whom
143. (A) cooperate (B) cooperation (C) cooperates (D) cooperative

PART VI. INCOMPLETE TEXTS
131. A. advance B. advanced C. advancing D. to advance
............. electrical dispatch systems, digital communications, and uplinks
132. A. include B. includes C. including D. included
`;

const lines = text.split('\n');
for (const line of lines) {
  const normalized = line.toLowerCase();
  const partMatch = normalized.match(/\bpart\s*([ivx]+|[1-7])\b/i);
  if (partMatch) {
    console.log('PART MATCH:', partMatch[0], '->', partMatch[1]);
  }
  
  const qStartMatch = line.match(/^(?:question\s*|c[aâ]u\s*)?(\d{1,3})\s*[).:\-]\s*(.+)$/i) ?? line.match(/^(\d{1,3})\s+(.+)$/);
  if (qStartMatch) {
    console.log('QMatch:', qStartMatch[1], qStartMatch[2]);
  }
}
