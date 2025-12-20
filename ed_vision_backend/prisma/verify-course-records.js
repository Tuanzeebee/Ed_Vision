const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const total = await prisma.studentCourseRecord.count();
    console.log('Total StudentCourseRecord rows =', total);
    const sample = await prisma.studentCourseRecord.findMany({ take: 10, include: { student: true, course: true, academicTerm: true } });
    console.log('Sample rows:');
    for (const r of sample) {
      console.log({ record_id: r.record_id, student_id: r.student_id, student_code: r.student ? r.student.student_code : null, course_id: r.course_id, course_code: r.course ? r.course.course_code : null, raw_score: r.raw_score, converted_score: r.converted_score, term_id: r.term_id });
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
