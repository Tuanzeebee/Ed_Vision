/**
 * Backfill TOEIC Part 3/4 group audio.
 *
 * Vấn đề: dữ liệu cũ chỉ gán `context_audio` cho câu đầu của mỗi nhóm 3
 * (vd Q32, bỏ Q33/Q34). Script này quét toàn bộ ToeicPracticeQuestion +
 * DiagnosticRepositoryItem ở Part 3/4, tìm anchor (câu có audio) và copy
 * audio sang 2 sibling kế tiếp cùng `source_slug`/`repository`.
 *
 * Run:
 *   node scripts/backfill-toeic-part34-audio.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfillPracticeQuestions() {
  console.log('[Practice] Loading Part 3/4 questions with audio...');
  const anchors = await prisma.toeicPracticeQuestion.findMany({
    where: {
      part: { in: [3, 4] },
      context_audio: { not: null },
      source_slug: { not: null },
      source_item_id: { not: null },
    },
    select: {
      id: true,
      part: true,
      source_slug: true,
      source_item_id: true,
      context_audio: true,
    },
  });
  console.log(`[Practice] Found ${anchors.length} anchor questions.`);

  let updated = 0;
  for (const anchor of anchors) {
    for (let offset = 1; offset <= 2; offset++) {
      const sibling = await prisma.toeicPracticeQuestion.findFirst({
        where: {
          part: anchor.part,
          source_slug: anchor.source_slug,
          source_item_id: anchor.source_item_id + offset,
          OR: [{ context_audio: null }, { context_audio: '' }],
        },
        select: { id: true, source_item_id: true },
      });
      if (!sibling) continue;
      await prisma.toeicPracticeQuestion.update({
        where: { id: sibling.id },
        data: { context_audio: anchor.context_audio },
      });
      updated++;
      console.log(
        `  ✔ ${anchor.source_slug} Q${anchor.source_item_id} → Q${sibling.source_item_id}`,
      );
    }
  }
  console.log(`[Practice] Updated ${updated} sibling questions.`);
}

async function backfillDiagnosticItems() {
  console.log('[Diagnostic] Loading Part 3/4 items with audio...');
  const items = await prisma.diagnosticRepositoryItem.findMany({
    where: {
      part: { in: [3, 4] },
      media_audio_url: { not: null },
    },
    select: {
      id: true,
      part: true,
      repository_id: true,
      metadata: true,
      media_audio_url: true,
    },
  });

  // Group by repository_id and build qNum → item map
  const byRepo = new Map();
  for (const item of items) {
    const arr = byRepo.get(item.repository_id) ?? [];
    arr.push(item);
    byRepo.set(item.repository_id, arr);
  }

  let updated = 0;
  for (const [repoId, anchors] of byRepo.entries()) {
    // Build full lookup of all items in this repo
    const allItems = await prisma.diagnosticRepositoryItem.findMany({
      where: { repository_id: repoId, part: { in: [3, 4] } },
      select: { id: true, part: true, metadata: true, media_audio_url: true },
    });
    const qNumToItem = new Map();
    for (const it of allItems) {
      const qNum = it.metadata?.question_number;
      if (typeof qNum === 'number') qNumToItem.set(qNum, it);
    }

    for (const anchor of anchors) {
      const anchorQNum = anchor.metadata?.question_number;
      if (typeof anchorQNum !== 'number') continue;
      for (let offset = 1; offset <= 2; offset++) {
        const sibling = qNumToItem.get(anchorQNum + offset);
        if (!sibling) continue;
        if (sibling.media_audio_url) continue;
        await prisma.diagnosticRepositoryItem.update({
          where: { id: sibling.id },
          data: { media_audio_url: anchor.media_audio_url },
        });
        updated++;
        console.log(
          `  ✔ repo=${repoId} Q${anchorQNum} → Q${anchorQNum + offset}`,
        );
      }
    }
  }
  console.log(`[Diagnostic] Updated ${updated} sibling items.`);
}

(async () => {
  try {
    await backfillPracticeQuestions();
    await backfillDiagnosticItems();
    console.log('\n✅ Backfill complete.');
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
