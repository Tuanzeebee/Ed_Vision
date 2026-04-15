const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAccountCreatedDates() {
  console.log(' Updating account created_at dates based on student cohort_year...\n');

  // Lấy tất cả students với cohort_year
  const students = await prisma.student.findMany({
    where: {
      cohort_year: { not: null }
    },
    include: {
      account: true
    }
  });

  console.log(`Found ${students.length} students with cohort_year`);

  let updated = 0;
  let skipped = 0;

  for (const student of students) {
    if (!student.account) {
      skipped++;
      continue;
    }

    // Tạo ngày bắt đầu năm học: 1 tháng 9 của cohort_year
    const createdDate = new Date(`${student.cohort_year}-09-01T00:00:00Z`);
    const updatedDate = createdDate; // updated_at cũng dùng ngày đó

    try {
      await prisma.account.update({
        where: { account_id: student.account_id },
        data: {
          created_at: createdDate,
          updated_at: updatedDate
        }
      });
      updated++;
      
      if (updated % 100 === 0) {
        console.log(`   Updated ${updated}/${students.length} accounts...`);
      }
    } catch (err) {
      console.error(`   Error updating account ${student.account_id}:`, err.message);
    }
  }

  console.log(`\n Update complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);

  // Hiển thị một vài ví dụ
  console.log('\n Sample results:');
  const samples = await prisma.student.findMany({
    take: 5,
    where: { cohort_year: { not: null } },
    include: {
      account: {
        select: {
          email: true,
          created_at: true
        }
      }
    }
  });

  samples.forEach(s => {
    console.log(`   Cohort ${s.cohort_year} - ${s.account?.email} - Created: ${s.account?.created_at?.toISOString().split('T')[0]}`);
  });

  await prisma.$disconnect();
}

updateAccountCreatedDates().catch(err => {
  console.error(' Error:', err);
  prisma.$disconnect();
  process.exit(1);
});
