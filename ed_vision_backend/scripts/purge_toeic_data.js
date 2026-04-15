/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const { rm } = require('node:fs/promises');
const { join } = require('node:path');

const prisma = new PrismaClient();

async function gatherStats() {
  const [repoCount, itemCount, optionCount, enrollmentCount, topicProgressCount] =
    await Promise.all([
      prisma.learningRepository.count({ where: { cert_type: 'toeic' } }),
      prisma.learningRepositoryItem.count({
        where: { repository: { cert_type: 'toeic' } },
      }),
      prisma.learningRepositoryOption.count({
        where: { item: { repository: { cert_type: 'toeic' } } },
      }),
      prisma.certificateEnrollment.count({ where: { cert_type: 'toeic' } }),
      prisma.certificateTopicProgress.count({
        where: { enrollment: { cert_type: 'toeic' } },
      }),
    ]);

  return {
    repoCount,
    itemCount,
    optionCount,
    enrollmentCount,
    topicProgressCount,
  };
}

async function main() {
  const applyMode = process.argv.includes('--apply');
  const clearAiCache = process.argv.includes('--clear-ai-cache');

  const before = await gatherStats();

  console.log('=== TOEIC Data Purge ===');
  console.log(`learning_repository (toeic): ${before.repoCount}`);
  console.log(`learning_repository_item (toeic): ${before.itemCount}`);
  console.log(`learning_repository_option (toeic): ${before.optionCount}`);
  console.log(`certificate_enrollment (toeic): ${before.enrollmentCount}`);
  console.log(`certificate_topic_progress (toeic): ${before.topicProgressCount}`);

  if (!applyMode) {
    console.log('\nDry-run only. Re-run with --apply to delete rows.');
    console.log('Optional: add --clear-ai-cache to remove uploads/certificate/ai-cache.');
    return;
  }

  const [repoDelete, enrollmentDelete] = await prisma.$transaction([
    prisma.learningRepository.deleteMany({ where: { cert_type: 'toeic' } }),
    prisma.certificateEnrollment.deleteMany({ where: { cert_type: 'toeic' } }),
  ]);

  if (clearAiCache) {
    const aiCachePath = join(process.cwd(), 'uploads', 'certificate', 'ai-cache');
    try {
      await rm(aiCachePath, { recursive: true, force: true });
      console.log(`Removed AI cache directory: ${aiCachePath}`);
    } catch (error) {
      console.warn('Failed to remove AI cache directory:', error);
    }
  }

  const after = await gatherStats();

  console.log('\nDeleted rows:');
  console.log(`learning_repository (toeic): ${repoDelete.count}`);
  console.log(`certificate_enrollment (toeic): ${enrollmentDelete.count}`);

  console.log('\nRemaining TOEIC rows after purge:');
  console.log(`learning_repository (toeic): ${after.repoCount}`);
  console.log(`learning_repository_item (toeic): ${after.itemCount}`);
  console.log(`learning_repository_option (toeic): ${after.optionCount}`);
  console.log(`certificate_enrollment (toeic): ${after.enrollmentCount}`);
  console.log(`certificate_topic_progress (toeic): ${after.topicProgressCount}`);
}

main()
  .catch((error) => {
    console.error('Purge failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
