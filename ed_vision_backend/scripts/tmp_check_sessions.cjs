const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.ieltsPlacementSession.findMany({
    where: { status: 'in_progress' },
    select: {
      id: true,
      accountId: true,
      status: true,
      skillsTested: true,
      startedAt: true,
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  const grouped = await prisma.ieltsPlacementSession.groupBy({
    by: ['accountId', 'status'],
    _count: { _all: true },
  });

  const questionCounts = await prisma.ieltsQuestion.groupBy({
    by: ['skill'],
    where: { status: 'approved' },
    _count: { _all: true },
  });

  const sampleAccount = await prisma.account.findFirst({
    select: { account_id: true, email: true },
    orderBy: { account_id: 'asc' },
  });

  let startCheck = null;
  if (sampleAccount) {
    try {
      const created = await prisma.ieltsPlacementSession.create({
        data: {
          accountId: sampleAccount.account_id,
          skillsTested: ['vocabulary', 'reading', 'listening', 'writing', 'speaking'],
          currentEstimatedBand: 5,
          status: 'in_progress',
        },
        select: { id: true, accountId: true, status: true },
      });

      await prisma.ieltsPlacementSession.update({
        where: { id: created.id },
        data: { status: 'abandoned', completedAt: new Date() },
      });

      startCheck = { ok: true, createdSessionId: created.id, accountId: created.accountId };
    } catch (e) {
      startCheck = { ok: false, error: e.message };
    }
  }

  console.log('IN_PROGRESS_ROWS=', JSON.stringify(rows, null, 2));
  console.log('GROUP_BY=', JSON.stringify(grouped, null, 2));
  console.log('QUESTION_COUNTS=', JSON.stringify(questionCounts, null, 2));
  console.log('SAMPLE_ACCOUNT=', JSON.stringify(sampleAccount, null, 2));
  console.log('START_CHECK=', JSON.stringify(startCheck, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
