// ============================================================
// MAIN SEED SCRIPT: IELTS Placement Test
// Import Listening, Speaking, Writing questions
// Run: node prisma/seed-placement-test.cjs
// ============================================================

const { PrismaClient } = require('@prisma/client');
const { listeningPassages, listeningQuestions } = require('./seed-listening-placement.cjs');
const { speakingQuestions } = require('./seed-speaking-placement.cjs');
const { writingQuestions } = require('./seed-writing-placement.cjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting IELTS Placement Test seed...\n');

  // ─────────────────────────────────────────────────────────
  // 1. LISTENING PASSAGES
  // ─────────────────────────────────────────────────────────
  console.log('📝 Seeding Listening Passages...');
  const passageMap = new Map();

  for (const p of listeningPassages) {
    const existing = await prisma.ieltsPassage.findFirst({
      where: { title: p.title, skill: p.skill },
    });

    if (existing) {
      console.log(`   ⏭️  Passage already exists: "${p.title}"`);
      passageMap.set(p.title, existing.id);
      continue;
    }

    const created = await prisma.ieltsPassage.create({
      data: {
        skill: p.skill,
        title: p.title,
        content: p.content,
        bandMin: p.bandMin,
        bandMax: p.bandMax,
        topicTags: p.topicTags,
        sectionType: p.sectionType,
        audioUrl: p.audioUrl,
        audioDurationSec: p.audioDurationSec,
        accentType: p.accentType,
        ttsGenerated: p.ttsGenerated,
        isAiGenerated: p.isAiGenerated,
        status: p.status,
      },
    });

    passageMap.set(p.title, created.id);
    console.log(`   ✅ Created passage: "${p.title}" (${created.id})`);
  }

  console.log(`\n✅ Listening Passages: ${passageMap.size} total\n`);

  // ─────────────────────────────────────────────────────────
  // 2. LISTENING QUESTIONS
  // ─────────────────────────────────────────────────────────
  console.log('📝 Seeding Listening Questions...');
  let listeningCount = 0;

  for (const q of listeningQuestions) {
    const passageId = passageMap.get(q.passageTitle);
    if (!passageId) {
      console.log(`   ⚠️  Passage not found for: "${q.passageTitle}" — skipping question`);
      continue;
    }

    const existing = await prisma.ieltsQuestion.findFirst({
      where: {
        questionText: q.questionText,
        skill: q.skill,
        passage_id: passageId,
      },
    });

    if (existing) {
      console.log(`   ⏭️  Question already exists: "${q.questionText.substring(0, 50)}..."`);
      continue;
    }

    await prisma.ieltsQuestion.create({
      data: {
        skill: q.skill,
        subSkillCode: q.subSkillCode,
        questionType: q.questionType,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        passage: {
          connect: { id: passageId },
        },
        contextType: q.contextType,
        bandMin: q.bandMin,
        bandMax: q.bandMax,
        difficultyWeight: q.difficultyWeight,
        expectedTimeSec: q.expectedTimeSec,
        errorTag: q.errorTag,
        topicTags: q.topicTags,
        status: q.status,
        irtA: q.irtA,
        irtB: q.irtB,
        irtC: q.irtC,
        isPlacement: q.isPlacement,
      },
    });

    listeningCount++;
    console.log(`   ✅ Created listening Q${q.questionOrder}: "${q.passageTitle}"`);
  }

  console.log(`\n✅ Listening Questions: ${listeningCount} created\n`);

  // ─────────────────────────────────────────────────────────
  // 3. SPEAKING QUESTIONS
  // ─────────────────────────────────────────────────────────
  console.log('📝 Seeding Speaking Questions...');
  let speakingCount = 0;

  for (const q of speakingQuestions) {
    const existing = await prisma.ieltsQuestion.findFirst({
      where: {
        questionText: q.questionText,
        skill: q.skill,
      },
    });

    if (existing) {
      console.log(`   ⏭️  Question already exists: "${q.questionText.substring(0, 50)}..."`);
      continue;
    }

    await prisma.ieltsQuestion.create({
      data: {
        skill: q.skill,
        subSkillCode: q.subSkillCode,
        questionType: q.questionType,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        contextType: 'standalone',
        bandMin: q.bandMin,
        bandMax: q.bandMax,
        difficultyWeight: q.difficultyWeight,
        expectedTimeSec: q.expectedTimeSec,
        errorTag: q.errorTag,
        topicTags: q.topicTags,
        status: q.status,
        irtA: q.irtA,
        irtB: q.irtB,
        irtC: q.irtC,
        isPlacement: q.isPlacement,
      },
    });

    speakingCount++;
    console.log(`   ✅ Created speaking: "${q.subSkillCode}"`);
  }

  console.log(`\n✅ Speaking Questions: ${speakingCount} created\n`);

  // ─────────────────────────────────────────────────────────
  // 4. WRITING QUESTIONS
  // ─────────────────────────────────────────────────────────
  console.log('📝 Seeding Writing Questions...');
  let writingCount = 0;

  for (const q of writingQuestions) {
    const existing = await prisma.ieltsQuestion.findFirst({
      where: {
        questionText: q.questionText,
        skill: q.skill,
      },
    });

    if (existing) {
      console.log(`   ⏭️  Question already exists: "${q.questionText.substring(0, 50)}..."`);
      continue;
    }

    await prisma.ieltsQuestion.create({
      data: {
        skill: q.skill,
        subSkillCode: q.subSkillCode,
        questionType: q.questionType,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        contextType: 'standalone',
        bandMin: q.bandMin,
        bandMax: q.bandMax,
        difficultyWeight: q.difficultyWeight,
        expectedTimeSec: q.expectedTimeSec,
        errorTag: q.errorTag,
        topicTags: q.topicTags,
        status: q.status,
        irtA: q.irtA,
        irtB: q.irtB,
        irtC: q.irtC,
        isPlacement: q.isPlacement,
      },
    });

    writingCount++;
    console.log(`   ✅ Created writing: "${q.subSkillCode}"`);
  }

  console.log(`\n✅ Writing Questions: ${writingCount} created\n`);

  // ─────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 IELTS Placement Test Seed Complete!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📊 Listening Passages: ${passageMap.size}`);
  console.log(`📊 Listening Questions: ${listeningCount}`);
  console.log(`📊 Speaking Questions: ${speakingCount}`);
  console.log(`📊 Writing Questions: ${writingCount}`);
  console.log(`📊 Total Questions: ${listeningCount + speakingCount + writingCount}`);
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
