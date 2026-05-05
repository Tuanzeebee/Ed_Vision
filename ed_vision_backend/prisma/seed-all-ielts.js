// seed-all-ielts.js - Unified seed script: chỉ seed từ JSON files, KHÔNG hardcode
// Chạy: node prisma/seed-all-ielts.js
'use strict';

const { execSync } = require('child_process');

const scripts = [
    {
        name: 'Band Test Questions',
        path: 'prisma/seedBandTestQuestions.js',
        description: 'Seed câu hỏi Band Test từ band_test_questions.json',
    },
    {
        name: 'Learning Content',
        path: 'prisma/seedLearningContent.js',
        description: 'Seed flashcards, practice, mini-test từ learning_content.json',
    },
    // ❌ KHÔNG dùng seedIeltsAdaptive.js nữa - nó tạo hardcoded content giống nhau
    // {
    //     name: 'IELTS Adaptive (Hardcoded)',
    //     path: 'prisma/seedIeltsAdaptive.js',
    //     description: 'DEPRECATED - Tạo hardcoded content',
    // },
];

console.log('\n🚀 Bắt đầu seed toàn bộ dữ liệu IELTS từ JSON files...\n');
console.log('═══════════════════════════════════════════════════════\n');

let success = 0;
let failed = 0;

for (const script of scripts) {
    console.log(`📦 [${script.name}]`);
    console.log(`   ${script.description}`);

    try {
        execSync(`node ${script.path}`, {
            encoding: 'utf-8',
            stdio: 'inherit',
        });

        console.log(`✅ ${script.name}: Thành công\n`);
        success++;
    } catch (error) {
        console.error(`❌ ${script.name}: Thất bại`);
        console.error(`   Lỗi: ${error.message}\n`);
        failed++;
    }
}

console.log('═══════════════════════════════════════════════════════');
console.log(`\n📊 Kết quả:`);
console.log(`   ✅ Thành công: ${success}/${scripts.length}`);
console.log(`   ❌ Thất bại: ${failed}/${scripts.length}`);

if (failed === 0) {
    console.log(`\n🎉 Hoàn tất seed toàn bộ dữ liệu!`);
    console.log(`\n📝 Tips:`);
    console.log(`   - Chạy 'node check-data.js' để xem dữ liệu đã seed`);
    console.log(`   - Chạy 'node check-content-diversity.js' để kiểm tra tính đa dạng`);
    console.log(`   - Mỗi band level giờ có nội dung KHÁC NHAU từ JSON\n`);
} else {
    console.log(`\n⚠️  Một số script thất bại. Kiểm tra lỗi ở trên.\n`);
    process.exit(1);
}
