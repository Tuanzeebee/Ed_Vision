const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const appPath = path.resolve(
    __dirname,
    '..',
    '..',
    'Ed_Vision',
    'src',
    'App.tsx',
  );
  if (!fs.existsSync(appPath)) {
    console.error('Cannot find App.tsx at', appPath);
    process.exit(1);
  }

  const content = fs.readFileSync(appPath, 'utf8');
  const re = /permission=\"([a-z0-9_:\.\-]+)\"/gi;
  const perms = new Set();
  let m;
  while ((m = re.exec(content)) !== null) {
    perms.add(m[1]);
  }

  console.log('Found permission keys:', Array.from(perms));

  const prisma = new PrismaClient();
  try {
    for (const key of perms) {
      await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, name: key },
      });
    }
    console.log('Upserted', perms.size, 'permissions');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
