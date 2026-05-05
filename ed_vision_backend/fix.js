const fs = require('fs');
let c = fs.readFileSync('src/teacher_be/toeic-repository/toeic-practice-import.service.ts', 'utf8');
c = c.replace(/detectedPart:\s*number\s*\|\s*null;\\n\s*readingPassage\?:\s*string\s*\|\s*null;/, 'detectedPart: number | null;\n  readingPassage?: string | null;');
c = c.replace(/detectedPart:\s*number\s*\|\s*null;/, 'detectedPart: number | null;\n  readingPassage?: string | null;');
fs.writeFileSync('src/teacher_be/toeic-repository/toeic-practice-import.service.ts', c);
