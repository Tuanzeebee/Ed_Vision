const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const constraints = await prisma.$queryRawUnsafe(
    "SELECT conname FROM pg_constraint c JOIN pg_class t ON c.conrelid=t.oid WHERE t.relname='ielts_placement_sessions' AND c.contype='c'",
  );
  const target = constraints.find((row) => String(row.conname).includes('max_10_questions'));
  if (target) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ielts_placement_sessions DROP CONSTRAINT IF EXISTS ${target.conname}`,
    );
  }
  await prisma.$executeRawUnsafe(
    "ALTER TABLE ielts_placement_sessions ADD CONSTRAINT max_20_questions CHECK (total_questions_asked >= 0 AND total_questions_asked <= 20)",
  );
  console.log('Constraint updated: total_questions_asked 0..20');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
