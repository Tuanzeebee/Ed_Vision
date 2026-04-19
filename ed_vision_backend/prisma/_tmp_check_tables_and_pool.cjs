const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('ielts_questions', 'ielts_placement_sessions', 'ielts_placement_answers')
    ORDER BY table_name;
  `)

  const approvedBySkill = await prisma.$queryRawUnsafe(`
    SELECT skill, COUNT(*)::int AS approved_count
    FROM ielts_questions
    WHERE status = 'approved'
    GROUP BY skill
    ORDER BY skill;
  `)

  console.log('TABLES_FOUND')
  console.log(JSON.stringify(tables, null, 2))
  console.log('APPROVED_BY_SKILL_BEFORE')
  console.log(JSON.stringify(approvedBySkill, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
