const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying listening repositories...');
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

  console.log(`Found ${repos.length} listening repositories.`);
  for (const repo of repos) {
    console.log(`Repository ID: ${repo.id}, Slug: ${repo.slug}, Title: ${repo.title}`);
    console.log(`  Total Items: ${repo.items.length}`);
    
    // Group items by part
    const itemsByPart = {};
    for (const item of repo.items) {
      const meta = item.metadata || {};
      const part = meta.part || 1;
      if (!itemsByPart[part]) itemsByPart[part] = [];
      itemsByPart[part].push(item);
    }
    
    for (const part of Object.keys(itemsByPart).sort()) {
      const items = itemsByPart[part];
      console.log(`  Part ${part}: ${items.length} items`);
      const sampleItem = items[0];
      if (sampleItem) {
        console.log(`    Sample Item ID ${sampleItem.id}: Order ${sampleItem.item_order}, Stem: "${sampleItem.stem}"`);
        console.log(`    Options:`, sampleItem.options.map(o => `${o.option_key}: "${o.option_text}"`).join(', '));
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
