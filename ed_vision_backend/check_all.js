const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.toeicPracticeQuestion.findMany({
    take: 5,
    select: { source_item_id: true, stem: true }
  });
  console.log(JSON.stringify(questions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
