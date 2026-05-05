const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$connect();
  console.log("Connected to DB successfully!");
  const users = await prisma.user.findMany({ take: 1 }).catch(() => null);
  console.log("Users:", users);
  await prisma.$disconnect();
}
main().catch(e => {
  console.error("Failed to connect", e);
  process.exit(1);
});
