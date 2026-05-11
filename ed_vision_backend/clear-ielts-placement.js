const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting IeltsPlacementAnswer...");
  await prisma.ieltsPlacementAnswer.deleteMany({});
  
  console.log("Deleting IeltsPlacementSession...");
  await prisma.ieltsPlacementSession.deleteMany({});
  
  console.log("Deleting IeltsQuestion (isPlacement=true)...");
  await prisma.ieltsQuestion.deleteMany({
    where: { isPlacement: true }
  });
  
  console.log("Deleting IeltsPassage (where no questions attached or associated with placement)...");
  await prisma.ieltsPassage.deleteMany({
    where: { questions: { none: {} } }
  });

  console.log("Data cleared successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
