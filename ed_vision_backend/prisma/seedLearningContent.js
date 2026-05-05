// seedLearningContent.js - Import learning content từ learning_content.json
// Đọc JSON → upsert vào LearningRepository + LearningRepositoryItem + LearningRepositoryOption
// Cấu trúc JSON: contentByBand.band10.skills.reading.lesson1.{flashcards, practice, miniTest}
//
// Chạy: node prisma/seedLearningContent.js
'use strict';
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Band code map: IELTS score × 100 (same scale as bandTest)
const bandMap = {
    band10: { min: 100, max: 140, label: 'Band 1.0' },
    band15: { min: 150, max: 190, label: 'Band 1.5' },
    band20: { min: 200, max: 240, label: 'Band 2.0' },
    band25: { min: 250, max: 290, label: 'Band 2.5' },
    band30: { min: 300, max: 340, label: 'Band 3.0' },
    band35: { min: 350, max: 390, label: 'Band 3.5' },
    band40: { min: 400, max: 440, label: 'Band 4.0' },
    band45: { min: 450, max: 490, label: 'Band 4.5' },
    band50: { min: 500, max: 540, label: 'Band 5.0' },
    band55: { min: 550, max: 590, label: 'Band 5.5' },
    band60: { min: 600, max: 640, label: 'Band 6.0' },
    band65: { min: 650, max: 690, label: 'Band 6.5' },
    band70: { min: 700, max: 740, label: 'Band 7.0' },
    band75: { min: 750, max: 790, label: 'Band 7.5' },
    band80: { min: 800, max: 840, label: 'Band 8.0' },
    band85: { min: 850, max: 890, label: 'Band 8.5' },
    band90: { min: 900, max: 1000, label: 'Band 9.0' },
};

async function upsertRepo(slug, data) {
    return prisma.learningRepository.upsert({
        where: { slug },
        update: {
            title: data.title,
            description: data.description,
            content_type: data.contentType,
            skill_area: data.skill,
            topic_group: data.topicGroup,
            difficulty_level: data.difficultyLevel || 'intermediate',
            target_score_min: data.scoreMin,
            target_score_max: data.scoreMax,
            estimated_minutes: data.estimatedMinutes,
            pass_score: data.passScore,
            tags: data.tags,
            metadata: data.metadata,
            is_published: true,
        },
        create: {
            cert_type: 'ielts',
            slug,
            title: data.title,
            description: data.description,
            content_type: data.contentType,
            skill_area: data.skill,
            topic_group: data.topicGroup,
            difficulty_level: data.difficultyLevel || 'intermediate',
            target_score_min: data.scoreMin,
            target_score_max: data.scoreMax,
            estimated_minutes: data.estimatedMinutes,
            pass_score: data.passScore,
            tags: data.tags,
            metadata: data.metadata,
            is_published: true,
        },
    });
}

async function upsertItem(repositoryId, itemOrder, data) {
    return prisma.learningRepositoryItem.upsert({
        where: {
            repository_id_item_order: {
                repository_id: repositoryId,
                item_order: itemOrder,
            },
        },
        update: {
            item_type: data.itemType,
            stem: data.stem,
            reading_passage: data.readingPassage || null,
            media_audio_url: data.mediaAudioUrl || null,
            hint: data.hint || null,
            explanation: data.explanation || null,
            difficulty_level: data.difficultyLevel || 'intermediate',
            score_weight: data.scoreWeight || 1,
            estimated_seconds: data.estimatedSeconds || 60,
            metadata: data.metadata || {},
        },
        create: {
            repository_id: repositoryId,
            item_order: itemOrder,
            item_type: data.itemType,
            stem: data.stem,
            reading_passage: data.readingPassage || null,
            media_audio_url: data.mediaAudioUrl || null,
            hint: data.hint || null,
            explanation: data.explanation || null,
            difficulty_level: data.difficultyLevel || 'intermediate',
            score_weight: data.scoreWeight || 1,
            estimated_seconds: data.estimatedSeconds || 60,
            metadata: data.metadata || {},
        },
    });
}

async function seedOptions(itemId, options) {
    await prisma.learningRepositoryOption.deleteMany({ where: { item_id: itemId } });
    for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await prisma.learningRepositoryOption.create({
            data: {
                item_id: itemId,
                sort_order: i + 1,
                option_key: String(opt.key).slice(0, 10),
                option_text: opt.text,
                is_correct: opt.isCorrect,
                rationale: opt.isCorrect ? 'Correct answer.' : 'Incorrect.',
            },
        });
    }
}

// Convert matching pairs → options format (left=key, right=text, all is_correct=true)
function matchingPairsToOptions(pairs) {
    return (pairs || []).map((p) => ({
        key: String(p.left).slice(0, 10),
        text: p.right,
        isCorrect: true,
    }));
}

// Seed một lesson (flashcards + practice + mini-test repos)
async function seedLesson(bandCode, band, lessonData) {
    const lessonCode = lessonData.lessonCode; // e.g. "band10-reading-1"
    const skill = lessonData.skillArea;       // e.g. "reading"
    // reading có thể là string hoặc object { passage: "..." }
    const rawReading = lessonData.reading || null;
    const passage = rawReading
        ? (typeof rawReading === 'string' ? rawReading : rawReading.passage || null)
        : null;
    const audioUrl = lessonData.audioUrl || null;
    const difficulty = lessonData.difficulty || 'intermediate';
    let repoCount = 0;
    let itemCount = 0;

    // 1. Flashcards repo
    if (lessonData.flashcards && lessonData.flashcards.length > 0) {
        const slug = `${lessonCode}-flashcards`;
        const repo = await upsertRepo(slug, {
            title: lessonData.lessonTitle + ' – Flashcards',
            description: `Flashcards: ${lessonData.topic || skill} at ${band.label}`,
            contentType: 'flashcards',
            skill,
            topicGroup: lessonData.topic || skill,
            difficultyLevel: difficulty,
            scoreMin: band.min,
            scoreMax: band.max,
            estimatedMinutes: Math.ceil(lessonData.estimatedMinutes * 0.3) || 6,
            passScore: 60,
            tags: ['ielts', skill, 'flashcards', bandCode],
            metadata: { lessonCode, bandMin: band.min / 100, bandMax: band.max / 100, cefr: lessonData.cefr },
        });
        repoCount++;

        for (let i = 0; i < lessonData.flashcards.length; i++) {
            const fc = lessonData.flashcards[i];
            await upsertItem(repo.id, i + 1, {
                itemType: 'flashcard',
                stem: fc.term,
                hint: fc.definition,
                explanation: fc.hint || null,
                estimatedSeconds: fc.estimatedSeconds || 20,
                metadata: { id: fc.id, errorType: 'flashcard' },
            });
            itemCount++;
        }

        await prisma.learningRepository.update({
            where: { id: repo.id },
            data: { total_items: lessonData.flashcards.length },
        });
    }

    // 2. Practice repo
    if (lessonData.practice && lessonData.practice.length > 0) {
        const slug = `${lessonCode}-practice`;
        const repo = await upsertRepo(slug, {
            title: lessonData.lessonTitle + ' – Practice',
            description: `Practice: ${lessonData.topic || skill} at ${band.label}`,
            contentType: 'practice',
            skill,
            topicGroup: lessonData.topic || skill,
            difficultyLevel: difficulty,
            scoreMin: band.min,
            scoreMax: band.max,
            estimatedMinutes: Math.ceil(lessonData.estimatedMinutes * 0.4) || 8,
            passScore: 60,
            tags: ['ielts', skill, 'practice', bandCode],
            metadata: { lessonCode, bandMin: band.min / 100, bandMax: band.max / 100, cefr: lessonData.cefr },
        });
        repoCount++;

        for (let i = 0; i < lessonData.practice.length; i++) {
            const q = lessonData.practice[i];
            const item = await upsertItem(repo.id, i + 1, {
                itemType: q.type,
                stem: q.stem,
                readingPassage: passage,
                mediaAudioUrl: q.mediaAudioUrl || audioUrl,
                explanation: q.explanation || null,
                estimatedSeconds: q.estimatedSeconds || 45,
                metadata: { errorType: q.errorType || 'general', correctAnswer: q.correctAnswer || undefined },
            });
            // Handle matching type: convert pairs to options
            const practiceOpts = q.type === 'matching' && q.pairs
                ? matchingPairsToOptions(q.pairs)
                : (q.options || []);
            if (practiceOpts.length > 0) await seedOptions(item.id, practiceOpts);
            itemCount++;
        }

        await prisma.learningRepository.update({
            where: { id: repo.id },
            data: { total_items: lessonData.practice.length },
        });
    }

    // 3. Mini-test repo
    if (lessonData.miniTest && lessonData.miniTest.length > 0) {
        const slug = `${lessonCode}-mini-test`;
        const repo = await upsertRepo(slug, {
            title: lessonData.lessonTitle + ' – Mini-test',
            description: `Mini-test: ${lessonData.topic || skill} at ${band.label}`,
            contentType: 'mini-test',
            skill,
            topicGroup: lessonData.topic || skill,
            difficultyLevel: difficulty,
            scoreMin: band.min,
            scoreMax: band.max,
            estimatedMinutes: Math.ceil(lessonData.estimatedMinutes * 0.3) || 6,
            passScore: 70,
            tags: ['ielts', skill, 'mini-test', bandCode],
            metadata: { lessonCode, bandMin: band.min / 100, bandMax: band.max / 100, cefr: lessonData.cefr },
        });
        repoCount++;

        for (let i = 0; i < lessonData.miniTest.length; i++) {
            const q = lessonData.miniTest[i];
            const item = await upsertItem(repo.id, i + 1, {
                itemType: q.type,
                stem: q.stem,
                readingPassage: passage,
                mediaAudioUrl: q.mediaAudioUrl || audioUrl,
                explanation: q.explanation || null,
                estimatedSeconds: q.estimatedSeconds || 60,
                metadata: { errorType: q.errorType || 'general', correctAnswer: q.correctAnswer || undefined },
            });
            // Handle matching type: convert pairs to options
            const miniTestOpts = q.type === 'matching' && q.pairs
                ? matchingPairsToOptions(q.pairs)
                : (q.options || []);
            if (miniTestOpts.length > 0) await seedOptions(item.id, miniTestOpts);
            itemCount++;
        }

        await prisma.learningRepository.update({
            where: { id: repo.id },
            data: { total_items: lessonData.miniTest.length },
        });
    }

    return { repos: repoCount, items: itemCount };
}

async function main() {
    console.log('\n🚀 Seeding Learning Content từ JSON...\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // __dirname là prisma/, file JSON nằm cùng cấp trong learning_content/
    const jsonPath = path.join(__dirname, 'learning_content', 'learning_content.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ Không tìm thấy file:', jsonPath);
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    const contentByBand = data.contentByBand;
    const bandCodes = Object.keys(contentByBand);
    console.log(`📄 Loaded: ${bandCodes.length} band levels\n`);

    let totalRepos = 0;
    let totalItems = 0;
    let skipped = 0;

    for (const bandCode of bandCodes) {
        if (!bandMap[bandCode]) {
            console.warn(`⚠️  Bỏ qua band không nhận dạng được: ${bandCode}`);
            skipped++;
            continue;
        }

        const band = bandMap[bandCode];
        const bandData = contentByBand[bandCode];
        const skills = bandData.skills || {};

        console.log(`\n📦 ${band.label} (${band.min}-${band.max}) [${bandData.cefr || ''}]`);

        let bandRepos = 0;
        let bandItems = 0;

        for (const [skillName, skillData] of Object.entries(skills)) {
            // Mỗi skill có lesson1, lesson2, ...
            for (const [lessonKey, lessonData] of Object.entries(skillData)) {
                if (!lessonData || typeof lessonData !== 'object') continue;
                if (!lessonData.lessonCode) continue;

                const result = await seedLesson(bandCode, band, lessonData);
                bandRepos += result.repos;
                bandItems += result.items;
            }
        }

        console.log(`   ✅ ${bandRepos} repositories, ${bandItems} items`);
        totalRepos += bandRepos;
        totalItems += bandItems;
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`\n✅ Seeding complete!`);
    console.log(`   📊 Total: ${totalRepos} repositories, ${totalItems} items`);
    if (skipped > 0) console.log(`   ⚠️  Skipped: ${skipped} unknown bands`);
    console.log(`\n💡 Next steps:`);
    console.log(`   - Run: node check-data.js`);
    console.log(`   - Run: node check-content-diversity.js\n`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
