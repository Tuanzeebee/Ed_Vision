// check-data.js - Kiểm tra tổng quan dữ liệu IELTS trong database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n📊 TỔNG QUAN DỮ LIỆU IELTS ADAPTIVE\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Band Test Questions
    const questionCount = await prisma.ieltsQuestion.count();
    const questionsBySkill = await prisma.ieltsQuestion.groupBy({
        by: ['skill'],
        _count: { skill: true },
    });

    console.log('📝 BAND TEST QUESTIONS (IeltsQuestion table)');
    console.log(`   Tổng số: ${questionCount} questions`);
    for (const group of questionsBySkill) {
        console.log(`   - ${group.skill}: ${group._count.skill} questions`);
    }
    console.log('');

    // 2. Learning Repositories
    const repoCount = await prisma.learningRepository.count();
    const reposByContentType = await prisma.learningRepository.groupBy({
        by: ['content_type'],
        _count: { content_type: true },
    });

    console.log('📚 LEARNING REPOSITORIES (LearningRepository table)');
    console.log(`   Tổng số: ${repoCount} repositories`);
    for (const group of reposByContentType) {
        console.log(`   - ${group.content_type}: ${group._count.content_type} repos`);
    }
    console.log('');

    // 3. Band level breakdown
    const reposByBand = await prisma.learningRepository.groupBy({
        by: ['target_score_min', 'target_score_max'],
        _count: { id: true },
    });

    const bandLabels = {
        '400-440': 'Band 4.0',
        '450-490': 'Band 4.5',
        '500-540': 'Band 5.0',
        '550-590': 'Band 5.5',
        '600-1000': 'Band 6.0+',
    };

    console.log('🎯 REPOSITORIES BY BAND LEVEL');
    for (const group of reposByBand) {
        const key = `${group.target_score_min}-${group.target_score_max}`;
        const label = bandLabels[key] || `${group.target_score_min}-${group.target_score_max}`;
        console.log(`   ${label}: ${group._count.id} repos`);
    }
    console.log('');

    // 4. Repository items
    const itemCount = await prisma.learningRepositoryItem.count();
    const itemsByType = await prisma.learningRepositoryItem.groupBy({
        by: ['item_type'],
        _count: { item_type: true },
    });

    console.log('📄 REPOSITORY ITEMS (Questions/Flashcards)');
    console.log(`   Tổng số: ${itemCount} items`);
    for (const group of itemsByType) {
        console.log(`   - ${group.item_type}: ${group._count.item_type} items`);
    }
    console.log('');

    // 5. Sample repositories (first 10)
    const sampleRepos = await prisma.learningRepository.findMany({
        take: 10,
        select: {
            slug: true,
            skill_area: true,
            content_type: true,
            target_score_min: true,
            target_score_max: true,
            _count: {
                select: {
                    items: true,
                },
            },
        },
        orderBy: [
            { target_score_min: 'asc' },
            { skill_area: 'asc' },
            { content_type: 'asc' },
        ],
    });

    console.log('📋 MẪU REPOSITORIES (10 đầu tiên):');
    for (const repo of sampleRepos) {
        const bandLabel = Object.entries(bandLabels).find(
            ([range]) => range === `${repo.target_score_min}-${repo.target_score_max}`
        )?.[1] || `Score ${repo.target_score_min}-${repo.target_score_max}`;

        console.log(`   ${repo.slug}`);
        console.log(`      ${bandLabel} | ${repo.skill_area} | ${repo.content_type} | ${repo._count.items} items`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('\n✅ Data overview complete!\n');
    console.log('💡 Tips:');
    console.log('   - Mỗi band level nên có ~12 repos (4 skills × 3 content types)');
    console.log('   - Chạy "node check-content-diversity.js" để kiểm tra duplicate');
    console.log('   - Chạy "node prisma/seed-all-ielts.js" để seed lại từ JSON\n');
}

main()
    .catch(e => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
