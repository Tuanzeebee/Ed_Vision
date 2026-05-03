const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.toeicPracticeQuestion.findMany({
    where: { source_slug: 'tp-1777712809955-cb3aa5b9' },
    select: {
      source_item_id: true,
      stem: true,
      reading_passage: true,
      options: {
        select: { option_key: true, option_text: true }
      }
    }
  });
  console.log(JSON.stringify(questions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
