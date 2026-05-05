// clean-hardcoded-content.js - Xóa nội dung hardcoded từ seedIeltsAdaptive.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n🧹 Xóa nội dung hardcoded từ seedIeltsAdaptive.js...\n');

    // Xác định content_type từ seedIeltsAdaptive.js
    // (không có 's' ở cuối: flashcard, mini_test, practice_set)
    const hardcodedContentTypes = ['flashcard', 'mini_test', 'practice_set'];

    // Xóa repositories với content_type hardcoded
    // Cascade sẽ tự động xóa items và options
    const result = await prisma.learningRepository.deleteMany({
        where: {
            cert_type: 'ielts',
            content_type: {
                in: hardcodedContentTypes,
            },
        },
    });

    console.log(`✅ Đã xóa ${result.count} repositories hardcoded từ seedIeltsAdaptive.js\n`);
    console.log('💡 Các bảng liên quan (items, options) đã được xóa tự động (cascade).\n');
    console.log('🔄 Bây giờ chạy: node check-data.js để xem dữ liệu còn lại');
    console.log('📝 Chỉ còn data từ learning_content.json (flashcards, practice, mini-test)');
}

main()
    .catch(e => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
