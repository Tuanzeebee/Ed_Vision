const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    // get distinct role strings from Account
    const rows = await prisma.$queryRaw`SELECT DISTINCT role FROM "Account" WHERE role IS NOT NULL`
    const roles = rows.map(r => r.role)
    console.log('Found account role strings:', roles)

    for (const code of roles) {
      if (!code) continue
      await prisma.role.upsert({ where: { code }, update: {}, create: { code, name: code } })
    }

    // now update Account.role_id by joining Role.code
    // use raw SQL because prisma update many with join is awkward
    await prisma.$executeRawUnsafe(`
      UPDATE "Account" a
      SET role_id = r.id
      FROM "Role" r
      WHERE a.role = r.code
    `)

    console.log('Migration finished')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
