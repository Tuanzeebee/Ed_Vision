const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSampleData() {
  console.log('Creating sample data...');

  try {
    // Create roles
    const adminRole = await prisma.role.upsert({
      where: { code: 'admin' },
      update: {},
      create: { code: 'admin', name: 'Administrator' },
    });

    const studentRole = await prisma.role.upsert({
      where: { code: 'student' },
      update: {},
      create: { code: 'student', name: 'Sinh viên' },
    });

    const teacherRole = await prisma.role.upsert({
      where: { code: 'teacher' },
      update: {},
      create: { code: 'teacher', name: 'Giảng viên' },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create admin account
    const adminAccount = await prisma.account.upsert({
      where: { email: 'admin@edvision.com' },
      update: {},
      create: {
        email: 'admin@edvision.com',
        password_hash: hashedPassword,
        status: 'active',
        role_id: adminRole.id,
      },
    });

    // Create admin profile
    await prisma.profile.upsert({
      where: { account_id: adminAccount.account_id },
      update: {},
      create: {
        account_id: adminAccount.account_id,
        full_name: 'Administrator',
        phone_number: '0123456789',
      },
    });

    // Create teacher account
    const teacherAccount = await prisma.account.upsert({
      where: { email: 'teacher@edvision.com' },
      update: {},
      create: {
        email: 'teacher@edvision.com',
        password_hash: hashedPassword,
        status: 'active',
        role_id: teacherRole.id,
      },
    });

    // Create teacher profile and instructor
    const teacherProfile = await prisma.profile.upsert({
      where: { account_id: teacherAccount.account_id },
      update: {},
      create: {
        account_id: teacherAccount.account_id,
        full_name: 'Nguyễn Văn Giáo Viên',
        phone_number: '0987654321',
      },
    });

    await prisma.instructor.upsert({
      where: { account_id: teacherAccount.account_id },
      update: {},
      create: {
        account_id: teacherAccount.account_id,
        employee_code: 'GV001',
        academic_title: 'ThS',
        position: 'Giảng viên',
      },
    });

    // Create student account
    const studentAccount = await prisma.account.upsert({
      where: { email: 'student@edvision.com' },
      update: {},
      create: {
        email: 'student@edvision.com',
        password_hash: hashedPassword,
        status: 'active',
        role_id: studentRole.id,
      },
    });

    // Create student profile and student record
    const studentProfile = await prisma.profile.upsert({
      where: { account_id: studentAccount.account_id },
      update: {},
      create: {
        account_id: studentAccount.account_id,
        full_name: 'Trần Văn Sinh Viên',
        phone_number: '0111111111',
      },
    });

    await prisma.student.upsert({
      where: { account_id: studentAccount.account_id },
      update: {},
      create: {
        account_id: studentAccount.account_id,
        student_code: 'SV001',
        major: 'Công nghệ thông tin',
        cohort_year: 2024,
      },
    });

    console.log('✅ Sample data created successfully!');
    console.log('\n📋 Login credentials:');
    console.log('Admin: admin@edvision.com / password123');
    console.log('Teacher: teacher@edvision.com / password123');
    console.log('Student: student@edvision.com / password123');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();