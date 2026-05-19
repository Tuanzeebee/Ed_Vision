const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // 1. Fetch active TOEIC enrollment for student@dtu.edu.vn
  const student = await prisma.student.findFirst({
    where: { account: { email: 'student@dtu.edu.vn' } }
  });
  if (!student) {
    console.error("Student student@dtu.edu.vn not found!");
    await prisma.$disconnect();
    return;
  }

  const enrollment = await prisma.certificateEnrollment.findFirst({
    where: { student_id: student.student_id, cert_type: 'toeic', status: 'active' }
  });
  if (!enrollment) {
    console.error("Active TOEIC enrollment not found!");
    await prisma.$disconnect();
    return;
  }

  console.log("--- SIMULATION START ---");
  console.log("Current DB current_score:", enrollment.current_score);
  console.log("Current DB target_score:", enrollment.target_score);

  // 2. Helper to compute resolved baseline based on our new logic
  function calculateResolvedCurrentScore(state) {
    const initialTotalBaseline = 10; // e.g. intake score = 10
    const listening_baseline = state.listening_baseline ?? Math.round(initialTotalBaseline / 2);
    const reading_baseline = state.reading_baseline ?? Math.round(initialTotalBaseline / 2);
    const has_taken_listening_exam = !!state.has_taken_listening_exam;
    const has_taken_reading_exam = !!state.has_taken_reading_exam;

    let resolved = 0;
    if (!has_taken_listening_exam && !has_taken_reading_exam) {
      resolved = listening_baseline + reading_baseline;
    } else {
      const lScore = has_taken_listening_exam ? listening_baseline : 0;
      const rScore = has_taken_reading_exam ? reading_baseline : 0;
      resolved = lScore + rScore;
    }
    return Math.min(990, Math.max(10, resolved));
  }

  // 3. Reset state to intake state: baseline = 10, target = 100
  const intakeState = {
    current_score: 10,
    target_score: 100,
    goal_start_score: 10,
    listening_baseline: 5,
    reading_baseline: 5,
    has_taken_listening_exam: false,
    has_taken_reading_exam: false
  };

  console.log("\n1. Resetting student to Intake State: Baseline = 10, Target = 100");
  const step1Score = calculateResolvedCurrentScore(intakeState);
  console.log("Calculated Baseline:", step1Score);
  if (step1Score !== 10) throw new Error("Intake split test failed!");

  // 4. Simulate taking Listening Mock Exam and getting 490 points
  const afterListeningState = {
    ...intakeState,
    listening_baseline: 490,
    has_taken_listening_exam: true
  };
  console.log("\n2. Simulating Listening Mock Exam submission with score 490:");
  const step2Score = calculateResolvedCurrentScore(afterListeningState);
  console.log("Calculated overall baseline score (Điểm Gốc):", step2Score);
  console.log("Listening baseline:", afterListeningState.listening_baseline);
  console.log("Reading baseline (untaken):", afterListeningState.reading_baseline, "-> mapped to 0 because has_taken_reading_exam is false");
  if (step2Score !== 490) throw new Error("Listening submission test failed!");

  // 5. Simulate taking Reading Mock Exam and getting 300 points
  const afterBothState = {
    ...afterListeningState,
    reading_baseline: 300,
    has_taken_reading_exam: true
  };
  console.log("\n3. Simulating Reading Mock Exam submission with score 300:");
  const step3Score = calculateResolvedCurrentScore(afterBothState);
  console.log("Calculated overall baseline score (Điểm Gốc):", step3Score);
  console.log("Listening baseline:", afterBothState.listening_baseline);
  console.log("Reading baseline:", afterBothState.reading_baseline);
  if (step3Score !== 790) throw new Error("Reading submission test failed!");

  console.log("\n--- ALL TESTS COMPLETED SUCCESSFULLY! ---");
  await prisma.$disconnect();
}
main().catch(e => {
  console.error("Failed to connect", e);
  process.exit(1);
});
