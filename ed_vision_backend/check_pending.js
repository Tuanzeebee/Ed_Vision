const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.toeicPracticeQuestion.count({
    where: { ai_explained_at: null, is_published: true, options: { some: { is_correct: true } } }
  });
  console.log('Pending questions:', count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
