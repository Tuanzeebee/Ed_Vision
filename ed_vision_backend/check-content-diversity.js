// check-content-diversity.js - Kiểm tra tính đa dạng nội dung giữa các band
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n🔍 Kiểm tra tính đa dạng nội dung giữa các band...\n');

    // Lấy tất cả repositories
    const repos = await prisma.learningRepository.findMany({
        where: { cert_type: 'ielts' },
        include: {
            items: {
                select: {
                    id: true,
                    stem: true,
                    reading_passage: true,
                },
            },
        },
        orderBy: [
            { target_score_min: 'asc' },
            { content_type: 'asc' },
        ],
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 PHÂN TÍCH DUPLICATE CONTENT');
    console.log('═══════════════════════════════════════════════════════\n');

    // Group by content_type + skill
    const groups = {};
    for (const repo of repos) {
        const key = `${repo.content_type}-${repo.skill_area}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(repo);
    }

    let totalDuplicates = 0;

    for (const [key, repoList] of Object.entries(groups)) {
        if (repoList.length < 2) continue;

        console.log(`\n📚 ${key} (${repoList.length} repositories)`);
        console.log('─'.repeat(60));

        // So sánh reading_passage giữa các repos
        const passages = {};
        for (const repo of repoList) {
            const passage = repo.metadata?.passage || repo.items[0]?.reading_passage;
            if (passage) {
                const trimmed = passage.substring(0, 100); // Lấy 100 ký tự đầu
                if (!passages[trimmed]) {
                    passages[trimmed] = [];
                }
                passages[trimmed].push({
                    band: `${repo.target_score_min / 100}-${repo.target_score_max / 100}`,
                    title: repo.title,
                });
            }
        }

        // Tìm duplicate passages
        for (const [passage, repos] of Object.entries(passages)) {
            if (repos.length > 1) {
                console.log(`\n⚠️  DUPLICATE PASSAGE found:`);
                console.log(`   "${passage.substring(0, 60)}..."`);
                console.log(`   Xuất hiện ở:`);
                repos.forEach(r => {
                    console.log(`     - Band ${r.band}: ${r.title}`);
                });
                totalDuplicates++;
            }
        }

        // So sánh stems (câu hỏi)
        const stems = {};
        for (const repo of repoList) {
            for (const item of repo.items) {
                const stem = item.stem;
                if (stem) {
                    if (!stems[stem]) {
                        stems[stem] = [];
                    }
                    stems[stem].push({
                        band: `${repo.target_score_min / 100}-${repo.target_score_max / 100}`,
                        repoId: repo.id,
                    });
                }
            }
        }

        // Tìm duplicate stems
        let duplicateStems = 0;
        for (const [stem, repos] of Object.entries(stems)) {
            if (repos.length > 1) {
                duplicateStems++;
            }
        }

        if (duplicateStems > 0) {
            console.log(`\n⚠️  ${duplicateStems} câu hỏi bị trùng lặp giữa các band levels`);
            totalDuplicates += duplicateStems;
        } else {
            console.log(`\n✅ Không có câu hỏi trùng lặp`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 KẾT QUẢ');
    console.log('═══════════════════════════════════════════════════════');

    if (totalDuplicates > 0) {
        console.log(`\n❌ Tìm thấy ${totalDuplicates} nội dung bị trùng lặp!`);
        console.log(`\n💡 Khuyến nghị:`);
        console.log(`   1. Xóa data từ seedIeltsAdaptive.js (hardcoded content)`);
        console.log(`   2. Chỉ dùng learning_content.json với nội dung đa dạng`);
        console.log(`   3. Mỗi band phải có passage/audio KHÁC NHAU`);
    } else {
        console.log(`\n✅ Tất cả nội dung đều độc nhất cho mỗi band level!`);
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
}

main()
    .catch(e => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
