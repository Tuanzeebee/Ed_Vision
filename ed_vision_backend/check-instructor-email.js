const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get instructor with account email
    const instructors = await prisma.instructor.findMany({
      include: {
        account: { 
          select: { 
            email: true, 
            account_id: true 
          } 
        }
      }
    });
    
    console.log('\n=== Instructors with email ===');
    instructors.forEach(i => {
      console.log(`instructor_id: ${i.instructor_id}, account_id: ${i.account_id}, email: ${i.account.email}`);
    });

    // Test what the API should return for instructor_id: 1
    // instructor_id: 1 (Lý Văn Yên) should have classes K28 CMU-TPM7, K30 CMU-TPM10, K31 CMU-TPM4
    console.log('\n=== Assignments for instructor 1 (Lý Văn Yên) ===');
    const now = new Date();
    const assignments = await prisma.adviserAssignment.findMany({
      where: {
        instructor_id: 1,
        OR: [
          { ended_date: null },
          { ended_date: { gte: now } },
        ],
      },
      include: {
        classGroup: true
      }
    });
    
    assignments.forEach(a => {
      console.log(`- class: ${a.classGroup.class_code}, ended_date: ${a.ended_date}`);
    });
    console.log('Total active assignments for instructor 1:', assignments.length);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
