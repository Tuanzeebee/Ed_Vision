const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Kiểm tra AdviserAssignment
    const advisers = await prisma.adviserAssignment.findMany({
      include: {
        instructor: {
          include: {
            account: {
              include: { profile: true }
            }
          }
        },
        classGroup: true
      }
    });
    
    console.log('\n=== AdviserAssignments ===');
    console.log('Total count:', advisers.length);
    advisers.forEach(a => {
      const name = a.instructor?.account?.profile?.full_name || 'Unknown';
      console.log(`- instructor_id: ${a.instructor_id}, name: ${name}, class: ${a.classGroup?.class_code}, ended_date: ${a.ended_date}`);
    });

    // 2. Kiểm tra Instructors
    const instructors = await prisma.instructor.findMany({
      include: {
        account: {
          include: { profile: true }
        }
      }
    });
    
    console.log('\n=== Instructors ===');
    console.log('Total count:', instructors.length);
    instructors.slice(0, 5).forEach(i => {
      const name = i.account?.profile?.full_name || 'Unknown';
      console.log(`- instructor_id: ${i.instructor_id}, account_id: ${i.account_id}, name: ${name}`);
    });

    // 3. Kiểm tra ClassGroups có status active
    const classGroups = await prisma.classGroup.findMany({
      where: { status: 'active' },
      include: {
        adviserAssignments: true,
        _count: { select: { students: true } }
      }
    });
    
    console.log('\n=== Active ClassGroups ===');
    console.log('Total count:', classGroups.length);
    classGroups.slice(0, 5).forEach(c => {
      console.log(`- class_id: ${c.class_id}, class_code: ${c.class_code}, students: ${c._count.students}, advisers: ${c.adviserAssignments.length}`);
    });

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
