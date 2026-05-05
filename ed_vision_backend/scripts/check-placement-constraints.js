const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const sql = "SELECT conname, pg_get_constraintdef(c.oid) AS def FROM pg_constraint c JOIN pg_class t ON c.conrelid=t.oid WHERE t.relname='ielts_placement_answers' AND c.contype='c'";
  const result = await prisma.$queryRawUnsafe(sql);
  console.log(result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
