// resetAndSeedBandTest.js
// Reset toàn bộ dữ liệu IELTS adaptive (band test, roadmap, progress...) rồi seed lại bộ đề band test.
//
// Thứ tự xoá (child → parent, theo foreign key):
//   1. IeltsBandTest           (→ IeltsAdaptiveRoadmap)
//   2. IeltsPracticeSession    (→ IeltsLesson)
//   3. IeltsLesson             (→ IeltsAdaptiveRoadmap)
//   4. IeltsAdaptiveRoadmap    (→ CertificateEnrollment)
//   5. IeltsRecommendation     (→ CertificateEnrollment, IeltsErrorTag)
//   6. IeltsWeakPoint          (→ CertificateEnrollment, IeltsErrorTag)
//   7. IeltsSkillProgress      (→ CertificateEnrollment)
//   8. IeltsPlacementAnswer    (→ IeltsPlacementSession, IeltsQuestion)
//   9. IeltsPlacementSession
//  10. IeltsQuestion           ← sau đó seed lại từ JSON
//
// Chạy: node prisma/resetAndSeedBandTest.js
'use strict';

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

function stripComments(str) {
    return str.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

async function resetIeltsTables() {
    console.log('\n🗑️  Bắt đầu reset dữ liệu IELTS adaptive...\n');

    const steps = [
        { label: 'IeltsBandTest', fn: () => prisma.ieltsBandTest.deleteMany({}) },
        { label: 'IeltsPracticeSession', fn: () => prisma.ieltsPracticeSession.deleteMany({}) },
        { label: 'IeltsLesson', fn: () => prisma.ieltsLesson.deleteMany({}) },
        { label: 'IeltsAdaptiveRoadmap', fn: () => prisma.ieltsAdaptiveRoadmap.deleteMany({}) },
        { label: 'IeltsRecommendation', fn: () => prisma.ieltsRecommendation.deleteMany({}) },
        { label: 'IeltsWeakPoint', fn: () => prisma.ieltsWeakPoint.deleteMany({}) },
        { label: 'IeltsSkillProgress', fn: () => prisma.ieltsSkillProgress.deleteMany({}) },
        { label: 'IeltsPlacementAnswer', fn: () => prisma.ieltsPlacementAnswer.deleteMany({}) },
        { label: 'IeltsPlacementSession', fn: () => prisma.ieltsPlacementSession.deleteMany({}) },
        { label: 'IeltsQuestion', fn: () => prisma.ieltsQuestion.deleteMany({}) },
    ];

    for (const step of steps) {
        const result = await step.fn();
        console.log(`   ✅ ${step.label.padEnd(26)} → xoá ${result.count} bản ghi`);
    }

    console.log('\n✅ Reset hoàn tất.\n');
}

async function seedBandTestQuestions() {
    const jsonPath = path.join(__dirname, 'questions', 'band_test_questions.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ Không tìm thấy file:', jsonPath);
        process.exit(1);
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    let parsed;
    try {
        parsed = JSON.parse(stripComments(raw));
    } catch (e) {
        console.error('❌ JSON parse error:', e.message);
        process.exit(1);
    }

    const questions = parsed.questions;
    console.log(`📦 Đọc ${questions.length} câu hỏi từ band_test_questions.json...\n`);

    const typeMap = {
        single_choice: 'single_choice',
        true_false_ng: 'true_false_ng',
        gap_fill: 'gap_fill',
    };

    const defaultSeconds = {
        easy: { reading: 50, listening: 35, grammar: 30, vocabulary: 25, writing: 600, speaking: 60 },
        medium: { reading: 70, listening: 50, grammar: 45, vocabulary: 40, writing: 900, speaking: 120 },
        hard: { reading: 90, listening: 65, grammar: 60, vocabulary: 55, writing: 1200, speaking: 120 },
    };

    const difficultyWeightMap = { easy: 0.8, medium: 1.0, hard: 1.3 };

    let created = 0;
    let skipped = 0;

    for (const q of questions) {
        if (!q.id || !q.skill || !q.type || !q.stem) {
            console.warn(`⚠️  Bỏ qua câu thiếu field bắt buộc: ${JSON.stringify(q).slice(0, 80)}`);
            skipped++;
            continue;
        }

        const questionType = typeMap[q.type] ?? 'single_choice';

        const optionsJson = q.options
            ? q.options.map((o) => ({ key: o.key, text: o.text, isCorrect: o.isCorrect }))
            : null;

        const estimatedSeconds =
            q.estimatedSeconds ??
            (defaultSeconds[q.difficulty ?? 'medium']?.[q.skill] ?? 60);

        const diffWeight = difficultyWeightMap[q.difficulty ?? 'medium'] ?? 1.0;

        const correctAnswer =
            q.correctAnswer ??
            (optionsJson?.find((o) => o.isCorrect)?.key ?? 'WRITING_TASK');

        try {
            await prisma.ieltsQuestion.create({
                data: {
                    questionType,
                    skill: q.skill,
                    questionText: q.stem,
                    options: optionsJson ?? undefined,
                    correctAnswer,
                    explanation: q.explanation ?? null,
                    difficultyWeight: diffWeight,
                    bandMin: q.bandMin ?? 4.0,
                    bandMax: q.bandMax ?? 7.5,
                    expectedTimeSec: estimatedSeconds,
                    errorTag: q.errorType ?? null,
                    status: 'active',
                },
            });
            created++;
        } catch (err) {
            console.error(`❌ Lỗi câu ${q.id}:`, err.message);
            skipped++;
        }
    }

    console.log(`✅ Seed Band Test Questions hoàn tất:`);
    console.log(`   ➕ Tạo mới : ${created}`);
    console.log(`   ⚠️  Bỏ qua  : ${skipped}`);
}

async function main() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║       Reset & Seed Band Test Questions               ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    await resetIeltsTables();
    await seedBandTestQuestions();

    console.log('\n💡 Các bước tiếp theo:');
    console.log('   - Seed learning content : node prisma/seedLearningContent.js');
    console.log('   - Seed test users       : node prisma/seedIeltsAdaptive.js');
    console.log('   - Kiểm tra dữ liệu      : node check-data.js\n');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
