/**
 * Seed script: Program Effectiveness Dashboard
 *
 * Populates StudentTestResult, StudentLearningProgress,
 * ProgramEffectivenessMetric, and CohortPerformance with demo data.
 *
 * Usage: node prisma/seed-program-effectiveness.js
 *
 * Prerequisites:
 *   - Database has Student and CertificateEnrollment records
 *   - Tables created via `npx prisma db push`
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Program Effectiveness data...\n');

  // ─── 1. Find existing students & enrollments ────────────────────────────────
  const enrollments = await prisma.certificateEnrollment.findMany({
    where: { status: 'active' },
    include: { student: true },
    take: 50,
  });

  if (enrollments.length === 0) {
    console.log('⚠️  No active enrollments found. Creating standalone demo data...\n');
  }

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // ─── 2. Seed StudentTestResult ──────────────────────────────────────────────
  console.log('  → StudentTestResult...');

  const testResults = [];
  for (const enrollment of enrollments) {
    const isIelts = enrollment.cert_type === 'ielts';
    const certType = isIelts ? 'ielts' : 'toeic';

    // Entry test (baseline)
    // TOEIC only has Listening + Reading; IELTS has all 4 skills
    const entryListening = isIelts ? randomBand(40, 60) : randomScore(200, 350);
    const entryReading = isIelts ? randomBand(40, 55) : randomScore(200, 350);
    const entryWriting = isIelts ? randomBand(35, 55) : null;
    const entrySpeaking = isIelts ? randomBand(35, 55) : null;

    testResults.push({
      student_id: enrollment.student_id,
      enrollment_id: enrollment.id,
      cert_type: certType,
      test_type: 'diagnostic',
      test_phase: 'entry',
      listening_score: entryListening,
      reading_score: entryReading,
      writing_score: entryWriting,
      speaking_score: entrySpeaking,
      total_score: isIelts
        ? Math.round((entryListening + entryReading + entryWriting + entrySpeaking) / 4)
        : entryListening + entryReading,
      band_score: isIelts
        ? Math.round(((entryListening + entryReading + entryWriting + entrySpeaking) / 4) / 10 * 2) / 2
        : null,
      attempt_number: 1,
      is_baseline: true,
      completed_at: daysAgo(randomInt(60, 85)),
      created_at: daysAgo(randomInt(60, 85)),
    });

    // Exit/latest test (with improvement)
    const improve = isIelts ? randomInt(5, 20) : randomInt(30, 100);
    const exitListening = Math.min(isIelts ? 90 : 495, entryListening + improve);
    const exitReading = Math.min(isIelts ? 90 : 495, entryReading + improve);
    const exitWriting = isIelts ? Math.min(90, entryWriting + randomInt(3, 15)) : null;
    const exitSpeaking = isIelts ? Math.min(90, entrySpeaking + randomInt(3, 15)) : null;

    testResults.push({
      student_id: enrollment.student_id,
      enrollment_id: enrollment.id,
      cert_type: certType,
      test_type: 'mock',
      test_phase: 'exit',
      listening_score: exitListening,
      reading_score: exitReading,
      writing_score: exitWriting,
      speaking_score: exitSpeaking,
      total_score: isIelts
        ? Math.round((exitListening + exitReading + exitWriting + exitSpeaking) / 4)
        : exitListening + exitReading,
      band_score: isIelts
        ? Math.round(((exitListening + exitReading + exitWriting + exitSpeaking) / 4) / 10 * 2) / 2
        : null,
      attempt_number: 2,
      is_baseline: false,
      completed_at: daysAgo(randomInt(1, 10)),
      created_at: daysAgo(randomInt(1, 10)),
    });
  }

  if (testResults.length > 0) {
    // Clear old seed data first
    await prisma.studentTestResult.deleteMany({
      where: { enrollment_id: { in: enrollments.map((e) => e.id) } },
    });
    await prisma.studentTestResult.createMany({ data: testResults });
    console.log(`    ✓ Created ${testResults.length} test results`);
  }

  // ─── 3. Seed StudentLearningProgress ────────────────────────────────────────
  console.log('  → StudentLearningProgress...');

  let progressCount = 0;
  for (const enrollment of enrollments) {
    const isIelts = enrollment.cert_type === 'ielts';
    const entryTest = testResults.find(
      (t) => t.enrollment_id === enrollment.id && t.is_baseline,
    );
    const exitTest = testResults.find(
      (t) => t.enrollment_id === enrollment.id && !t.is_baseline,
    );
    if (!entryTest || !exitTest) continue;

    const baselineBand = isIelts
      ? entryTest.band_score
      : entryTest.total_score / 110; // rough TOEIC → band
    const lastBand = isIelts
      ? exitTest.band_score
      : exitTest.total_score / 110;

    const targetBand = isIelts ? 6.5 : 750 / 110;
    const improvementBand = lastBand - baselineBand;

    await prisma.studentLearningProgress.upsert({
      where: { enrollment_id: enrollment.id },
      update: {
        cert_type: enrollment.cert_type,
        baseline_band_score: baselineBand,
        baseline_total_score: entryTest.total_score,
        last_band_score: lastBand,
        last_total_score: exitTest.total_score,
        last_test_date: exitTest.completed_at,
        improvement_band: Math.round(improvementBand * 10) / 10,
        tests_completed: 2,
        target_band: targetBand,
        target_score: isIelts ? 65 : 750,
        at_risk: lastBand < targetBand * 0.7,
      },
      create: {
        student_id: enrollment.student_id,
        enrollment_id: enrollment.id,
        cert_type: enrollment.cert_type,
        baseline_band_score: baselineBand,
        baseline_total_score: entryTest.total_score,
        last_band_score: lastBand,
        last_total_score: exitTest.total_score,
        last_test_date: exitTest.completed_at,
        improvement_band: Math.round(improvementBand * 10) / 10,
        tests_completed: 2,
        target_band: targetBand,
        target_score: isIelts ? 65 : 750,
        at_risk: lastBand < targetBand * 0.7,
      },
    });
    progressCount++;
  }
  console.log(`    ✓ Upserted ${progressCount} learning progress records`);

  // ─── 4. Seed ProgramEffectivenessMetric ─────────────────────────────────────
  console.log('  → ProgramEffectivenessMetric...');

  const periodStart = daysAgo(90);
  const periodEnd = now;

  const modules = [
    // IELTS modules
    { cert: 'ielts', component: 'module_grammar', rank: 2, improve: 1.2, completion: 78, dropout: 8 },
    { cert: 'ielts', component: 'module_mock_test', rank: 1, improve: 1.8, completion: 85, dropout: 5 },
    { cert: 'ielts', component: 'module_writing', rank: 3, improve: 0.8, completion: 65, dropout: 18, attention: true, reason: 'high_dropout' },
    { cert: 'ielts', component: 'module_speaking', rank: 4, improve: 0.9, completion: 70, dropout: 12 },
    { cert: 'ielts', component: 'module_listening', rank: 5, improve: 1.0, completion: 80, dropout: 7 },
    // TOEIC modules
    { cert: 'toeic', component: 'module_grammar', rank: 1, improve: 1.5, completion: 82, dropout: 6 },
    { cert: 'toeic', component: 'module_mock_test', rank: 2, improve: 1.3, completion: 80, dropout: 8 },
    { cert: 'toeic', component: 'module_vocabulary', rank: 3, improve: 0.7, completion: 60, dropout: 22, attention: true, reason: 'high_dropout' },
    { cert: 'toeic', component: 'module_listening', rank: 4, improve: 1.1, completion: 75, dropout: 10 },
    { cert: 'toeic', component: 'module_reading', rank: 5, improve: 1.0, completion: 72, dropout: 11 },
  ];

  // Clear old metrics
  await prisma.$executeRaw`DELETE FROM "ProgramEffectivenessMetric"`;

  for (const m of modules) {
    const totalStudents = randomInt(30, 120);
    await prisma.$executeRaw`
      INSERT INTO "ProgramEffectivenessMetric" (
        cert_type, program_component, total_students, avg_improvement,
        completion_rate, dropout_rate, avg_duration_days,
        effectiveness_rank, needs_attention, attention_reason,
        period_start, period_end, created_at, updated_at
      ) VALUES (
        ${m.cert}, ${m.component}, ${totalStudents}, ${m.improve},
        ${m.completion}, ${m.dropout}, ${randomInt(20, 60)},
        ${m.rank}, ${m.attention || false}, ${m.reason || null},
        ${periodStart}, ${periodEnd}, NOW(), NOW()
      )
    `;
  }
  console.log(`    ✓ Created ${modules.length} module metrics`);

  // ─── 5. Seed CohortPerformance ─────────────────────────────────────────────
  console.log('  → CohortPerformance...');

  await prisma.$executeRaw`DELETE FROM "CohortPerformance"`;

  const cohorts = [
    { type: 'year', id: 'Y2022', name: 'Năm 3 - Khoa CNTT', cert: 'ielts', students: 85, improve: 1.5, success: 72 },
    { type: 'year', id: 'Y2023', name: 'Năm 2 - Khoa Kinh tế', cert: 'ielts', students: 62, improve: 1.2, success: 65 },
    { type: 'department', id: 'CNTT', name: 'Khoa CNTT (TOEIC)', cert: 'toeic', students: 120, improve: 1.0, success: 58 },
    { type: 'year', id: 'Y2021', name: 'Năm 4 - Khoa Ngoại ngữ', cert: 'ielts', students: 45, improve: 2.0, success: 88 },
    { type: 'department', id: 'KT', name: 'Khoa Kinh tế (TOEIC)', cert: 'toeic', students: 95, improve: 0.8, success: 52 },
  ];

  for (const c of cohorts) {
    await prisma.$executeRaw`
      INSERT INTO "CohortPerformance" (
        cohort_type, cohort_id, cohort_name, cert_type,
        period_type, period_start, period_end,
        total_students, active_students, tested_students,
        avg_baseline_band, avg_current_band, avg_improvement,
        target_band, students_reached_target, success_rate_percent,
        created_at, updated_at
      ) VALUES (
        ${c.type}, ${c.id}, ${c.name}, ${c.cert},
        'quarterly', ${daysAgo(90)}, ${now},
        ${c.students}, ${Math.round(c.students * 0.85)}, ${Math.round(c.students * 0.75)},
        ${4.5 + Math.random()}, ${5.5 + Math.random() * 1.5}, ${c.improve},
        ${c.cert === 'ielts' ? 6.5 : 6.8}, ${Math.round(c.students * c.success / 100)}, ${c.success},
        NOW(), NOW()
      )
    `;
  }
  console.log(`    ✓ Created ${cohorts.length} cohort records`);

  console.log('\n✅ Program Effectiveness seed completed!');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** IELTS: band × 10 (e.g., 50 = 5.0, 65 = 6.5) */
function randomBand(min, max) {
  return randomInt(min, max);
}

/** TOEIC: raw score range */
function randomScore(min, max) {
  return randomInt(min, max);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    prisma.$disconnect();
    process.exit(1);
  });
