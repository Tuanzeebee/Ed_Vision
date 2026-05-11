/**
 * seed-ielts-full.js
 * ------------------------------------------------------------
 * Orchestrator seed dữ liệu cho IELTS:
 *   1) Bảo đảm cột IRT (irt_a/b/c, is_placement) tồn tại trong ielts_questions
 *   2) Reset các bảng IELTS adaptive (giữ nguyên Account, Enrollment, …)
 *   3) Seed Band Test pool (ielts_questions, status='active') từ JSON
 *   4) Seed Placement pool (is_placement=true, status='approved'):
 *        - reading + passages          (seed-reading-professional.cjs)
 *        - vocabulary/listening/
 *          writing/speaking            (seed-other-skills-professional.cjs)
 *        - listening/writing/speaking  (seeds/ielts_placement_seed.sql)
 *        - writing grammar-in-context  (seed-writing-proxy.sql, chạy sau cùng
 *                                      cho writing để có 12 câu chuẩn)
 *   5) Seed Learning Content (LearningRepository) cho phần "ôn luyện"
 *
 * Chạy:
 *   cd ed_vision_backend
 *   node prisma/seed-ielts-full.js
 * ------------------------------------------------------------
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const PRISMA_DIR = __dirname;
const ROOT_DIR = path.join(__dirname, '..');

function banner(title) {
    const line = '═'.repeat(60);
    console.log(`\n${line}\n  ${title}\n${line}`);
}

function step(msg) {
    console.log(`\n▶ ${msg}`);
}

function runNode(relPath) {
    const abs = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(abs)) {
        throw new Error(`Không tìm thấy script: ${abs}`);
    }
    execSync(`node "${abs}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
}

async function runSqlFile(pg, absPath, label) {
    if (!fs.existsSync(absPath)) {
        throw new Error(`Không tìm thấy SQL file: ${absPath}`);
    }
    const sql = fs.readFileSync(absPath, 'utf-8');
    console.log(`   ↳ Executing ${label} (${path.basename(absPath)})…`);
    // pg.Client.query() supports multi-statement SQL khi không truyền parameter
    await pg.query(sql);
    console.log(`   ✅ ${label} done`);
}

// ──────────────────────────────────────────────────────────────
// 1. IRT migration (idempotent — ALTER TABLE IF NOT EXISTS)
// ──────────────────────────────────────────────────────────────
async function ensureIrtColumns(pg) {
    banner('1) Đảm bảo cột IRT tồn tại trên ielts_questions');
    await pg.query(`
        ALTER TABLE ielts_questions
            ADD COLUMN IF NOT EXISTS irt_a        NUMERIC(5,3) DEFAULT 1.0,
            ADD COLUMN IF NOT EXISTS irt_b        NUMERIC(5,3) DEFAULT 0.0,
            ADD COLUMN IF NOT EXISTS irt_c        NUMERIC(5,3) DEFAULT 0.25,
            ADD COLUMN IF NOT EXISTS is_placement BOOLEAN      NOT NULL DEFAULT false;
        CREATE INDEX IF NOT EXISTS idx_ielts_q_placement
            ON ielts_questions (is_placement, status)
            WHERE is_placement = true AND status = 'approved';
    `);
    console.log('   ✅ Cột IRT & index sẵn sàng');
}

// ──────────────────────────────────────────────────────────────
// 2. Reset các bảng IELTS (KHÔNG đụng Account / Enrollment)
// ──────────────────────────────────────────────────────────────
async function resetIeltsTables() {
    banner('2) Reset bảng IELTS adaptive');

    // Thứ tự: child → parent. Mỗi bước chỉ xoá nếu bảng tồn tại.
    const steps = [
        ['IeltsBandTest', () => prisma.ieltsBandTest.deleteMany({})],
        ['IeltsPracticeSession', () => prisma.ieltsPracticeSession.deleteMany({})],
        ['IeltsLesson', () => prisma.ieltsLesson.deleteMany({})],
        ['IeltsAdaptiveRoadmap', () => prisma.ieltsAdaptiveRoadmap.deleteMany({})],
        ['IeltsRecommendation', () => prisma.ieltsRecommendation.deleteMany({})],
        ['IeltsWeakPoint', () => prisma.ieltsWeakPoint.deleteMany({})],
        ['IeltsSkillProgress', () => prisma.ieltsSkillProgress.deleteMany({})],
        ['IeltsPlacementAnswer', () => prisma.ieltsPlacementAnswer.deleteMany({})],
        ['IeltsPlacementSession', () => prisma.ieltsPlacementSession.deleteMany({})],
        ['IeltsQuestion', () => prisma.ieltsQuestion.deleteMany({})],
    ];

    for (const [label, fn] of steps) {
        try {
            const r = await fn();
            console.log(`   ✅ ${label.padEnd(26)} → xoá ${r.count}`);
        } catch (err) {
            console.warn(`   ⚠️  ${label}: ${err.message}`);
        }
    }

    // Xoá passages (sau khi questions đã xoá)
    try {
        const r = await prisma.$executeRawUnsafe(`DELETE FROM ielts_passages`);
        console.log(`   ✅ ielts_passages           → xoá ${r}`);
    } catch (err) {
        console.warn(`   ⚠️  ielts_passages: ${err.message}`);
    }

    // Xoá learning repository (chỉ phần IELTS) cho phần ôn luyện
    try {
        const repos = await prisma.learningRepository.findMany({
            where: { cert_type: 'ielts' },
            select: { id: true },
        });
        const ids = repos.map((r) => r.id);
        if (ids.length > 0) {
            const itemIds = (
                await prisma.learningRepositoryItem.findMany({
                    where: { repository_id: { in: ids } },
                    select: { id: true },
                })
            ).map((i) => i.id);
            if (itemIds.length > 0) {
                await prisma.learningRepositoryOption.deleteMany({
                    where: { item_id: { in: itemIds } },
                });
            }
            await prisma.learningRepositoryItem.deleteMany({
                where: { repository_id: { in: ids } },
            });
            await prisma.learningRepository.deleteMany({
                where: { id: { in: ids } },
            });
        }
        console.log(`   ✅ LearningRepository(ielts) → xoá ${ids.length} repo`);
    } catch (err) {
        console.warn(`   ⚠️  LearningRepository: ${err.message}`);
    }
}

// ──────────────────────────────────────────────────────────────
// 3. Band Test pool (ielts_questions, status='active')
// ──────────────────────────────────────────────────────────────
function seedBandTest() {
    banner('3) Seed Band Test pool từ band_test_questions.json');
    runNode('prisma/seedBandTestQuestions.js');
}

// ──────────────────────────────────────────────────────────────
// 4. Placement pool (is_placement=true, status='approved')
// ──────────────────────────────────────────────────────────────
async function seedPlacementPool(pg) {
    banner('4) Seed Placement pool (is_placement=true, status=approved)');

    step('4.1 Reading professional (12 câu + 4 passages)');
    runNode('prisma/seed-reading-professional.cjs');

    step('4.2 Reading extra (20 câu, dải irt_b -3.2 → +1.8)');
    runNode('prisma/seed-reading-extra.cjs');

    step('4.3 Other skills (vocab/listening/writing/speaking, 10 câu/skill)');
    runNode('prisma/seed-other-skills-professional.cjs');

    step('4.4 SQL: ielts_placement_seed.sql (listening/writing/speaking, 18 câu)');
    await runSqlFile(
        pg,
        path.join(PRISMA_DIR, 'seeds', 'ielts_placement_seed.sql'),
        'ielts_placement_seed.sql',
    );

    step('4.5 SQL: seed-writing-proxy.sql (12 câu writing grammar-in-context)');
    await runSqlFile(
        pg,
        path.join(PRISMA_DIR, 'seed-writing-proxy.sql'),
        'seed-writing-proxy.sql',
    );
}

// ──────────────────────────────────────────────────────────────
// 5. Learning Content (ôn luyện)
// ──────────────────────────────────────────────────────────────
function seedLearningContent() {
    banner('5) Seed Learning Content (LearningRepository) cho ôn luyện');
    runNode('prisma/seedLearningContent.js');
}

// ──────────────────────────────────────────────────────────────
// 6. Verify
// ──────────────────────────────────────────────────────────────
async function verify() {
    banner('6) Verify pool placement & learning repository');

    const pool = await prisma.$queryRawUnsafe(`
        SELECT skill,
               COUNT(*)::int            AS total,
               MIN(irt_b)::float        AS irt_b_min,
               MAX(irt_b)::float        AS irt_b_max
          FROM ielts_questions
         WHERE is_placement = true AND status = 'approved'
         GROUP BY skill
         ORDER BY skill;
    `);
    console.log('\n📊 Placement pool theo skill:');
    console.table(pool);

    const bandPool = await prisma.$queryRawUnsafe(`
        SELECT skill, COUNT(*)::int AS total
          FROM ielts_questions
         WHERE status = 'active'
         GROUP BY skill
         ORDER BY skill;
    `);
    console.log('📊 Band-test pool (status=active) theo skill:');
    console.table(bandPool);

    const repos = await prisma.learningRepository.groupBy({
        by: ['skill_area', 'content_type'],
        where: { cert_type: 'ielts' },
        _count: { id: true },
    });
    console.log('📊 LearningRepository (cert_type=ielts):');
    console.table(
        repos.map((r) => ({
            skill: r.skill_area,
            content_type: r.content_type,
            count: r._count.id,
        })),
    );
}

// ──────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────
async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ Thiếu DATABASE_URL trong .env');
        process.exit(1);
    }

    const pg = new Client({ connectionString: dbUrl });
    await pg.connect();

    try {
        banner('🚀 SEED IELTS FULL — Placement + Practice');
        console.log(`DB: ${dbUrl.replace(/:[^:@/]+@/, ':****@')}`);

        await ensureIrtColumns(pg);
        await resetIeltsTables();
        seedBandTest();
        await seedPlacementPool(pg);
        seedLearningContent();
        await verify();

        banner('🎉 HOÀN TẤT');
        console.log(`
Tiếp theo:
  • Placement test (đầu vào): UI gọi POST /placement/start (xem
    src/placement/adaptive.service.ts → startPlacementTest)
  • Practice (ôn luyện)     : UI lấy lesson từ LearningRepository
    (cert_type='ielts', content_type='flashcards'|'practice'|'mini-test')
  • Band test               : POST /ielts-adaptive/band-test/start

💡 Có thể chạy lại bất cứ lúc nào — script idempotent, sẽ reset rồi seed lại.
`);
    } catch (err) {
        console.error('\n❌ Seed thất bại:', err.message);
        if (err.stack) console.error(err.stack);
        process.exitCode = 1;
    } finally {
        await pg.end();
        await prisma.$disconnect();
    }
}

main();
