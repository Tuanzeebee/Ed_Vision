const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const instructors = await prisma.instructor.count();
    const students = await prisma.student.count();
    const profiles = await prisma.profile.count();
    const accounts = await prisma.account.count();
    console.log('counts:', { instructors, students, profiles, accounts });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
