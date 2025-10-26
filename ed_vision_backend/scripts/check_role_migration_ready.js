const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Checking account role migration readiness...')

  // Count accounts with legacy role string not null/empty
  const rawRoleCount = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM "Account" WHERE role IS NOT NULL AND trim(role) <> ''`
  const rawRoleCountVal = rawRoleCount && rawRoleCount[0] ? rawRoleCount[0].cnt : (rawRoleCount.cnt || 0)

  // Count accounts with no role_id
  const nullRoleIdCountRes = await prisma.$queryRaw`SELECT COUNT(*)::int as cnt FROM "Account" WHERE role_id IS NULL`
  const nullRoleIdCount = nullRoleIdCountRes && nullRoleIdCountRes[0] ? nullRoleIdCountRes[0].cnt : (nullRoleIdCountRes.cnt || 0)

  console.log(`Accounts with legacy role string (role IS NOT NULL/empty): ${rawRoleCountVal}`)
  console.log(`Accounts with NULL role_id: ${nullRoleIdCount}`)

  if (rawRoleCountVal > 0) {
    console.log('\nSample accounts with legacy role values:')
    const samples = await prisma.$queryRaw`SELECT account_id, email, role FROM "Account" WHERE role IS NOT NULL AND trim(role) <> '' ORDER BY account_id LIMIT 20`
    console.table(samples)
  }

  if (nullRoleIdCount > 0) {
    console.log('\nSample accounts with NULL role_id:')
    const samples2 = await prisma.$queryRaw`SELECT account_id, email, role, role_id FROM "Account" WHERE role_id IS NULL ORDER BY account_id LIMIT 20`
    console.table(samples2)
  }

  const ready = rawRoleCountVal === 0 && nullRoleIdCount === 0
  if (ready) {
    console.log('\nOK: No legacy role strings and no NULL role_id found. You can proceed to drop the legacy `role` column.')
    process.exit(0)
  } else {
    console.log('\nNOT READY: There are remaining legacy role values or accounts without role_id. Do not drop the column yet.')
    process.exit(2)
  }
}

main()
  .catch((e) => {
    console.error('Check failed', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
