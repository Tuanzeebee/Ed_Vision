/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOEIC_SKILLS = ['listening', 'reading', 'grammar', 'vocabulary'];
const TOEIC_MILESTONES = [350, 500, 600, 700, 800];

function expectedToeicSlugs() {
  const slugs = [];
  for (const milestone of TOEIC_MILESTONES) {
    for (const skill of TOEIC_SKILLS) {
      slugs.push(`toeic-${skill}-m${milestone}`);
    }
  }
  return new Set(slugs);
}

async function main() {
  const applyMode = process.argv.includes('--apply');
  const expectedSlugs = expectedToeicSlugs();
  const validListeningAudio = new Set([
    '/sounds/pomodoro/start.mp3',
    '/sounds/pomodoro/pause.mp3',
    '/sounds/pomodoro/stop.mp3',
  ]);

  const toeicRepos = await prisma.learningRepository.findMany({
    where: { cert_type: 'toeic' },
    select: {
      id: true,
      slug: true,
      skill_area: true,
      title: true,
      is_published: true,
      total_items: true,
      updated_at: true,
      items: {
        select: {
          id: true,
          media_audio_url: true,
          reading_passage: true,
        },
      },
    },
    orderBy: [{ is_published: 'desc' }, { id: 'asc' }],
  });

  const staleRepos = toeicRepos
    .map((repo) => {
      const reasons = [];

      if (!repo.is_published) {
        reasons.push('unpublished');
      }

      if (!expectedSlugs.has(repo.slug)) {
        reasons.push('non-seeded-slug');
      }

      if (repo.skill_area === 'listening') {
        const hasOutdatedListeningItems =
          repo.items.length === 0 ||
          repo.items.some((item) => {
            const validAudio =
              typeof item.media_audio_url === 'string' &&
              validListeningAudio.has(item.media_audio_url);
            const hasImageLikePassage =
              typeof item.reading_passage === 'string' &&
              item.reading_passage.startsWith('http');

            return !validAudio || !hasImageLikePassage;
          });

        if (hasOutdatedListeningItems) {
          reasons.push('outdated-listening-content');
        }
      }

      if (reasons.length === 0) {
        return null;
      }

      return { repo, reasons };
    })
    .filter((entry) => entry !== null);

  console.log('=== TOEIC Repository Cleanup ===');
  console.log(`Total TOEIC repositories: ${toeicRepos.length}`);
  console.log(`Expected seeded slugs: ${expectedSlugs.size}`);
  console.log(`Legacy/unwanted rows found: ${staleRepos.length}`);

  if (staleRepos.length === 0) {
    console.log('No legacy TOEIC repository rows detected.');
    return;
  }

  for (const entry of staleRepos) {
    const { repo, reasons } = entry;
    console.log(
      [
        `- #${repo.id}`,
        repo.slug,
        repo.is_published ? 'published' : 'unpublished',
        `reasons=${reasons.join(',')}`,
        `items=${repo.total_items}`,
        `updated_at=${repo.updated_at.toISOString()}`,
      ].join(' | '),
    );
  }

  if (!applyMode) {
    console.log('\nDry-run only. Use --apply to delete listed rows.');
    return;
  }

  const staleRepoIds = staleRepos.map((entry) => entry.repo.id);

  const deleted = await prisma.learningRepository.deleteMany({
    where: { id: { in: staleRepoIds } },
  });

  console.log(`\nDeleted repositories: ${deleted.count}`);
}

main()
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
