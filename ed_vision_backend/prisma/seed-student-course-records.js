const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function toLetter(score) {
  if (score >= 9.0) return 'A+';
  if (score >= 8.5) return 'A';
  if (score >= 8.0) return 'B+';
  if (score >= 7.0) return 'B';
  if (score >= 6.5) return 'C+';
  if (score >= 5.5) return 'C';
  if (score >= 5.0) return 'D+';
  if (score >= 4.0) return 'D';
  return 'F';
}

async function main() {
  console.log('Seeding StudentCourseRecord data...');

  const students = await prisma.student.findMany();
  const courses = await prisma.course.findMany();
  const terms = await prisma.academicTerm.findMany();

  if (!students.length) {
    console.log('No students found, aborting.');
    return;
  }
  if (!courses.length) {
    console.log('No courses found, aborting.');
    return;
  }
  if (!terms.length) {
    console.log('No academic terms found, aborting.');
    return;
  }

  // For each student, assign between 4 and 6 courses (random, non-duplicated)
  let created = 0;
  for (const s of students) {
    // choose count
    const count = Math.floor(rand(4, 7));

    // shuffle courses and pick first `count`
    const shuffled = courses.slice().sort(() => Math.random() - 0.5);
    const pick = shuffled.slice(0, Math.min(count, courses.length));

    // choose a random term from terms (prefer latest)
    const term = terms[terms.length - 1];

    for (const c of pick) {
      // check if record exists
      const exists = await prisma.studentCourseRecord.findFirst({
        where: { student_id: s.student_id, course_id: c.course_id },
      });
      if (exists) continue;

      const raw = Number(rand(3.0, 9.5).toFixed(2));
      const converted_numeric = raw;
      const converted_score = toLetter(raw);

      await prisma.studentCourseRecord.create({
        data: {
          student_id: s.student_id,
          course_id: c.course_id,
          term_id: term.term_id,
          status: 'completed',
          raw_score: raw,
          converted_numeric_score: converted_numeric,
          converted_score: converted_score,
        },
      });
      created++;
    }
  }

  console.log(`Done. Created ${created} StudentCourseRecord rows.`);
}

main()
  .catch((e) => { console.error('Error seeding course records', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
