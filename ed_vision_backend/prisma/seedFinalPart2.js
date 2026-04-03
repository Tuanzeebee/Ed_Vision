const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Grade conversion functions
function convertRawScoreToLetterGrade(rawScore) {
  if (rawScore >= 9.5) return 'A+';
  if (rawScore >= 8.5) return 'A';
  if (rawScore >= 8.0) return 'A-';
  if (rawScore >= 7.5) return 'B+';
  if (rawScore >= 7.0) return 'B';
  if (rawScore >= 6.5) return 'B-';
  if (rawScore >= 6.0) return 'C+';
  if (rawScore >= 5.5) return 'C';
  if (rawScore >= 4.5) return 'C-';
  if (rawScore >= 4.0) return 'D';
  return 'F';
}

function convertRawScoreToNumericScore(rawScore) {
  if (rawScore >= 9.5) return 4.0;
  if (rawScore >= 8.5) return 4.0;
  if (rawScore >= 8.0) return 3.65;
  if (rawScore >= 7.5) return 3.33;
  if (rawScore >= 7.0) return 3.0;
  if (rawScore >= 6.5) return 2.65;
  if (rawScore >= 6.0) return 2.33;
  if (rawScore >= 5.5) return 2.0;
  if (rawScore >= 4.5) return 1.65;
  if (rawScore >= 4.0) return 1.0;
  return 0;
}

// Generate random score based on student performance level with variance
// Mức hiệu suất map theo GPA: excellent, very_good, good, average, poor.
function generateScoreByLevel(level) {
  let baseMin, baseMax;
  
  switch (level) {
    case 'excellent': // GPA >= 3.65 (mostly A range, occasionally B+)
      baseMin = 7.5;
      baseMax = 10.0;
      break;
    case 'very_good': // GPA >= 3.26 (mostly B+/A-, occasionally B or A)
      baseMin = 6.5;
      baseMax = 9.0;
      break;
    case 'good': // GPA >= 2.5 (mostly B/C range, occasionally B+ or C+)
      baseMin = 5.5;
      baseMax = 8.0;
      break;
    case 'average': // GPA >= 2.0 (mostly C range, occasionally D or B-)
      baseMin = 4.0;
      baseMax = 7.0;
      break;
    case 'poor': // GPA < 2.0 (mostly D/F, occasionally C)
      baseMin = 0;
      baseMax = 6.0;
      break;
    default:
      baseMin = 5.0;
      baseMax = 8.0;
  }
  
  // Add randomness: 80% within base range, 20% outliers (±1.5 points)
  let score;
  if (Math.random() < 0.8) {
    // Normal case: within base range
    score = baseMin + Math.random() * (baseMax - baseMin);
  } else {
    // Outlier case: student performs better or worse than usual
    const isPositiveOutlier = Math.random() < 0.5;
    if (isPositiveOutlier) {
      // Better than usual
      score = baseMax + Math.random() * 1.5;
      score = Math.min(score, 10.0); // Cap at 10
    } else {
      // Worse than usual
      score = baseMin - Math.random() * 1.5;
      score = Math.max(score, 0); // Floor at 0
    }
  }
  
  return Math.round(score * 10) / 10; // Round to 1 decimal
}

// Assign performance level to students based on GPA categories
function assignPerformanceLevel(studentIndex, totalStudents) {
  const percentage = (studentIndex / totalStudents) * 100;
  
  if (percentage < 15) return 'excellent'; // Top 15% → GPA >= 3.65
  if (percentage < 35) return 'very_good'; // Next 20% → GPA >= 3.26
  if (percentage < 65) return 'good'; // Middle 30% → GPA >= 2.5
  if (percentage < 85) return 'average'; // Next 20% → GPA >= 2.0
  return 'poor'; // Bottom 15% → GPA < 2.0
}

async function main() {
  console.log(' Starting seedFinalPart2.js - Seeding StudentCourseRecord...\n');

  // 1. Get CNPMC program
  const cnpmcProgram = await prisma.program.findUnique({
    where: { program_code: 'CNPMC' },
  });

  if (!cnpmcProgram) {
    console.error(' CNPMC program not found');
    return;
  }

  console.log(` Found CNPMC program (id: ${cnpmcProgram.program_id})`);

  // 2. Get all curriculum courses for CNPMC
  const curriculumCourses = await prisma.curriculumCourse.findMany({
    where: { program_id: cnpmcProgram.program_id },
    include: { course: true },
    orderBy: [
      { year_number: 'asc' },
      { term_number: 'asc' },
    ],
  });

  console.log(` Found ${curriculumCourses.length} curriculum courses for CNPMC\n`);

  // 3. Get all students
  const allStudents = await prisma.student.findMany({
    include: {
      classGroup: true,
    },
    orderBy: { student_id: 'asc' },
  });

  console.log(` Found ${allStudents.length} students\n`);

  // 4. Get all academic terms
  const academicTerms = await prisma.academicTerm.findMany({
    orderBy: { term_id: 'asc' },
  });

  console.log(` Found ${academicTerms.length} academic terms\n`);

  // Create a mapping of year + semester to term_id
  const termMap = {};
  for (const term of academicTerms) {
    const key = `${term.academic_year}-${term.semester_number}`;
    termMap[key] = term.term_id;
  }

  console.log(' Term Map:', termMap);

  // 5. Shuffle students and assign performance levels
  const studentsWithLevels = allStudents.map((student, index) => ({
    ...student,
    performanceLevel: assignPerformanceLevel(index, allStudents.length),
  }));

  console.log('\n Performance Distribution:');
  const distribution = studentsWithLevels.reduce((acc, s) => {
    acc[s.performanceLevel] = (acc[s.performanceLevel] || 0) + 1;
    return acc;
  }, {});
  console.log(distribution);

  // 6. Generate StudentCourseRecords
  console.log('\n Generating StudentCourseRecords...\n');

  let recordCount = 0;
  let skippedCount = 0;

  for (const student of studentsWithLevels) {
    const cohortYear = student.classGroup?.cohort_year;
    
    if (!cohortYear) {
      console.warn(` Student ${student.student_code} has no cohort year, skipping...`);
      skippedCount++;
      continue;
    }

    // Calculate which year the student is currently in (relative to Dec 2025)
    const currentDate = new Date(2025, 11, 20); // December 20, 2025
    const yearsElapsed = currentDate.getFullYear() - cohortYear;
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    // Determine which academic year and semester they're currently in
    let currentAcademicYear;
    let currentSemester;

    if (currentMonth >= 8) {
      // Fall semester (Aug-Dec)
      currentAcademicYear = `${currentDate.getFullYear()}-${currentDate.getFullYear() + 1}`;
      currentSemester = 1;
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      // Spring semester (Jan-May)
      currentAcademicYear = `${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`;
      currentSemester = 2;
    } else {
      // Summer semester (Jun-Jul)
      currentAcademicYear = `${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`;
      currentSemester = 3;
    }

    // For each curriculum course, add records based on student's progress
    for (const currCourse of curriculumCourses) {
      const courseYear = currCourse.year_number;
      const courseTerm = currCourse.term_number;

      // Determine if this course should be completed, in-progress, or planned
      let shouldAddRecord = false;
      let recordStatus = 'planned';

      // Calculate the academic year this course would be taken
      const courseAcademicYear = cohortYear + courseYear - 1;
      const courseAcademicYearStr = `${courseAcademicYear}-${courseAcademicYear + 1}`;

      // Check if the course has been taken yet
      if (courseAcademicYear < currentDate.getFullYear()) {
        // Course was in a previous academic year - completed
        shouldAddRecord = true;
        recordStatus = 'completed';
      } else if (courseAcademicYear === currentDate.getFullYear()) {
        // Course is in current academic year - check semester
        if (courseTerm < currentSemester) {
          shouldAddRecord = true;
          recordStatus = 'completed';
        } else if (courseTerm === currentSemester) {
          shouldAddRecord = true;
          recordStatus = 'in-progress';
        }
      }

      // Only add records for completed or in-progress courses (not future planned ones)
      if (shouldAddRecord) {
        const termKey = `${courseAcademicYearStr}-${courseTerm}`;
        const termId = termMap[termKey];

        if (!termId) {
          console.warn(` No term found for ${termKey}, skipping...`);
          continue;
        }

        // Generate score only for completed courses
        let rawScore = null;
        let convertedScore = null;
        let convertedNumericScore = null;

        if (recordStatus === 'completed') {
          rawScore = generateScoreByLevel(student.performanceLevel);
          convertedScore = convertRawScoreToLetterGrade(rawScore);
          convertedNumericScore = convertRawScoreToNumericScore(rawScore);
        }

        try {
          await prisma.studentCourseRecord.upsert({
            where: {
              student_id_course_id: {
                student_id: student.student_id,
                course_id: currCourse.course_id,
              },
            },
            update: {
              term_id: termId,
              status: recordStatus,
              raw_score: rawScore,
              converted_score: convertedScore,
              converted_numeric_score: convertedNumericScore,
            },
            create: {
              student_id: student.student_id,
              course_id: currCourse.course_id,
              term_id: termId,
              status: recordStatus,
              raw_score: rawScore,
              converted_score: convertedScore,
              converted_numeric_score: convertedNumericScore,
            },
          });

          recordCount++;

          if (recordCount % 1000 === 0) {
            console.log(` Created ${recordCount} course records...`);
          }
        } catch (e) {
          console.warn(` Error creating record for student ${student.student_code}, course ${currCourse.course?.course_code}: ${e.message}`);
          skippedCount++;
        }
      }
    }
  }

  console.log(`\n Seeded ${recordCount} StudentCourseRecords!`);
  console.log(` Skipped ${skippedCount} records due to errors or missing data`);

  // Print some statistics
  console.log('\n Statistics:');
  
  const completedRecords = await prisma.studentCourseRecord.count({
    where: { status: 'completed' },
  });
  
  const inProgressRecords = await prisma.studentCourseRecord.count({
    where: { status: 'in-progress' },
  });

  console.log(`   Completed: ${completedRecords}`);
  console.log(`   In-progress: ${inProgressRecords}`);
  console.log(`   Total: ${recordCount}`);

  // Sample grade distribution
  const gradeDistribution = await prisma.studentCourseRecord.groupBy({
    by: ['converted_score'],
    where: { 
      status: 'completed',
      converted_score: { not: null }
    },
    _count: true,
  });

  console.log('\n Grade Distribution (Completed courses):');
  gradeDistribution
    .sort((a, b) => {
      const order = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
      return order.indexOf(a.converted_score) - order.indexOf(b.converted_score);
    })
    .forEach(g => {
      console.log(`   ${g.converted_score}: ${g._count} records`);
    });

  console.log('\n seedFinalPart2.js completed!');
}

main()
  .catch((e) => {
    console.error(' Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
