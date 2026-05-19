import { PrismaClient } from '@prisma/client';
import { tryDecryptString } from '../src/common/crypto.util';

const prisma = new PrismaClient();

async function main() {
  console.log('Querying and decrypting listening repositories...');
  const repos = await prisma.examRepository.findMany({
    where: { cert_type: 'toeic', skill_area: 'listening' },
    include: {
      items: {
        include: {
          options: true
        }
      }
    }
  });

  for (const repo of repos) {
    console.log(`Repository ID: ${repo.id}, Slug: ${repo.slug}, Title: ${repo.title}`);
    
    // Group items by part
    const itemsByPart: Record<number, any[]> = {};
    for (const item of repo.items) {
      const meta = (item.metadata as any) || {};
      const part = meta.part || 1;
      if (!itemsByPart[part]) itemsByPart[part] = [];
      itemsByPart[part].push(item);
    }
    
    for (const part of Object.keys(itemsByPart).sort()) {
      const items = itemsByPart[Number(part)];
      console.log(`  Part ${part}: ${items.length} items`);
      const sampleItem = items[0];
      if (sampleItem) {
        console.log(`    Sample Item ID ${sampleItem.id}: Order ${sampleItem.item_order}`);
        console.log(`      Decrypted Stem: "${tryDecryptString(sampleItem.stem)}"`);
        console.log(`      Options:`);
        for (const opt of sampleItem.options) {
          console.log(`        ${opt.option_key}: "${tryDecryptString(opt.option_text)}" (is_correct: ${opt.is_correct})`);
        }
      }
    }
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
