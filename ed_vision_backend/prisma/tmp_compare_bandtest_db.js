const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jsonPath = path.join(process.cwd(), 'prisma', 'questions', 'band_test_questions.json');
const strip = (s) => s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
(async () => {
  const parsed = JSON.parse(strip(fs.readFileSync(jsonPath, 'utf8')));
  const expected = new Set(parsed.questions.map((q) => `${q.skill}|||${q.stem}`));
  const rows = await prisma.ieltsQuestion.findMany({
    select: { id: true, skill: true, questionText: true, status: true, questionType: true }
  });
  const extras = rows.filter((row) => !expected.has(`${row.skill}|||${row.questionText}`));
  const duplicatesMap = new Map();
  for (const row of rows) {
    const key = `${row.skill}|||${row.questionText}`;
    duplicatesMap.set(key, (duplicatesMap.get(key) || 0) + 1);
  }
  const duplicateKeys = [...duplicatesMap.entries()].filter(([, n]) => n > 1).length;
  console.log(JSON.stringify({
    totalDb: rows.length,
    totalJson: parsed.questions.length,
    extraCount: extras.length,
    duplicateKeys,
    extras: extras.slice(0, 20)
  }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
