// seedBandTestQuestions.js
// Đọc band_test_questions.json → upsert vào bảng IeltsQuestion (dùng cho Band Test)
// Cơ chế trộn câu: startBandTest() trong service sẽ dùng logic trộn ngẫu nhiên theo band.
//
// Chạy: node prisma/seedBandTestQuestions.js
'use strict';

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Strip JS comments từ JSON (vì JSON không hỗ trợ // comments)
function stripComments(str) {
    return str.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

async function main() {
    // Xoá dữ liệu band test cũ - XOÁ TOÀN BỘ
    // console.log('🗑️  Xoá TOÀN BỘ dữ liệu band test cũ...');
    // const deletedCount = await prisma.ieltsQuestion.deleteMany({});
    // console.log(`✅ Đã xoá ${deletedCount.count} câu hỏi cũ (tất cả)`);

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
    console.log(`📦 Đọc ${questions.length} câu hỏi từ JSON...`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const q of questions) {
        if (!q.id || !q.skill || !q.type || !q.stem) {
            console.warn(`⚠️  Bỏ qua câu thiếu field bắt buộc: ${JSON.stringify(q).slice(0, 80)}`);
            skipped++;
            continue;
        }

        // Map type → itemType enum (IeltsQuestion dùng question_type)
        const typeMap = {
            single_choice: 'single_choice',
            true_false_ng: 'true_false_ng',
            gap_fill: 'gap_fill',
        };
        const questionType = typeMap[q.type] ?? 'single_choice';

        // Chuẩn bị options JSON
        const optionsJson = q.options
            ? q.options.map((o) => ({
                key: o.key,
                text: o.text,
                isCorrect: o.isCorrect,
            }))
            : null;

        // estimatedSeconds theo difficulty nếu không khai báo
        const defaultSeconds = {
            easy: { reading: 50, listening: 35, grammar: 30, vocabulary: 25, writing: 600, speaking: 60 },
            medium: { reading: 70, listening: 50, grammar: 45, vocabulary: 40, writing: 900, speaking: 120 },
            hard: { reading: 90, listening: 65, grammar: 60, vocabulary: 55, writing: 1200, speaking: 120 },
        };
        const estimatedSeconds =
            q.estimatedSeconds ??
            (defaultSeconds[q.difficulty ?? 'medium']?.[q.skill] ?? 60);

        try {
            const existing = await prisma.ieltsQuestion.findFirst({
                where: {
                    questionText: q.stem,
                    skill: q.skill,
                },
            });

            // difficultyWeight: easy=0.8, medium=1.0, hard=1.3
            const difficultyWeightMap = { easy: 0.8, medium: 1.0, hard: 1.3 };
            const diffWeight = difficultyWeightMap[q.difficulty ?? 'medium'] ?? 1.0;

            const correctAnswer =
                q.correctAnswer ??
                (optionsJson?.find((o) => o.isCorrect)?.key ?? 'WRITING_TASK');

            const data = {
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
            };

            if (existing) {
                await prisma.ieltsQuestion.update({
                    where: { id: existing.id },
                    data,
                });
                updated++;
            } else {
                await prisma.ieltsQuestion.create({ data });
                created++;
            }
        } catch (err) {
            console.error(`❌ Lỗi câu ${q.id}:`, err.message);
            skipped++;
        }
    }

    console.log(`\n✅ Hoàn tất seed Band Test Questions:`);
    console.log(`   ➕ Tạo mới : ${created}`);
    console.log(`   🔄 Cập nhật: ${updated}`);
    console.log(`   ⚠️  Bỏ qua  : ${skipped}`);
    console.log(`\n💡 Chạy lại bất cứ lúc nào để thêm câu hỏi mới từ JSON.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
