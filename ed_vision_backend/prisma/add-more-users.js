const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function randomVietnameseName(idx) {
  const firstNames = ['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý','Đinh','Mai','Trương','Tô','Phan','Trịnh','Bạch','Tạ','Lâm','Tưởng','Hà','Hạnh','Minh','Quỳnh','Hồng'];
  const middle = ['Văn','Thị','Đức','Minh','Quang','Thu','Hữu','Thanh','Khánh','Ngọc','Thùy','Công','Anh'];
  const last = ['An','Bình','Cường','Dũng','Đạt','Giang','Hà','Hùng','Khoa','Linh','Long','Mai','Nam','Phương','Quân','Sơn','Tâm','Thảo','Tuấn','Vy','Anh','Bảo','Chi','Duy','Hải','Hương','Lan','Minh','Ngọc','Phúc'];
  const f = firstNames[idx % firstNames.length];
  const m = middle[(idx+3) % middle.length];
  const l = last[(idx+7) % last.length];
  return `${f} ${m} ${l}`;
}

async function ensureThirtyEach() {
  try {
    const hashed = await bcrypt.hash('password123', 10);

    const teacherRole = await prisma.role.findUnique({ where: { code: 'teacher' } });
    const studentRole = await prisma.role.findUnique({ where: { code: 'student' } });
    if (!teacherRole || !studentRole) {
      console.error('Missing roles teacher/student. Run permissions seed first.');
      return;
    }

    // Count existing instructors and students
    const existingInstructors = await prisma.instructor.findMany({ select: { instructor_id: true, account_id: true, employee_code: true } });
    const existingStudents = await prisma.student.findMany({ select: { student_id: true, account_id: true, student_code: true } });

    const needInstructors = Math.max(0, 30 - existingInstructors.length);
    const needStudents = Math.max(0, 30 - existingStudents.length);

    console.log(`Existing instructors: ${existingInstructors.length}, will add: ${needInstructors}`);
    console.log(`Existing students: ${existingStudents.length}, will add: ${needStudents}`);

    // Start index offsets to produce unique codes
    const instructorStartIdx = existingInstructors.length + 1;
    const studentStartIdx = existingStudents.length + 1;

    // Create instructors
    for (let i = 0; i < needInstructors; i++) {
      const idx = instructorStartIdx + i;
      const email = `teacher${idx}@dtu.edu.vn`;
      const empCode = `GV${String(1000 + idx).slice(-4)}`;
      const fullName = randomVietnameseName(idx);

      const account = await prisma.account.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password_hash: hashed,
          status: 'active',
          role_id: teacherRole.id,
        },
      });

      // upsert instructor if employee_code not already present
      const existingByCode = await prisma.instructor.findUnique({ where: { employee_code: empCode } });
      if (!existingByCode) {
        await prisma.instructor.upsert({
          where: { account_id: account.account_id },
          update: {},
          create: {
            account_id: account.account_id,
            employee_code: empCode,
            academic_title: 'ThS',
            position: 'Giảng viên',
            status: 'active',
          },
        });
      }

      await prisma.profile.upsert({
        where: { account_id: account.account_id },
        update: {},
        create: {
          account_id: account.account_id,
          full_name: fullName,
          gender: 'male',
          nationality: 'Vietnam',
        },
      });
    }

    // Create students
    for (let i = 0; i < needStudents; i++) {
      const idx = studentStartIdx + i;
      const email = `student${idx}@dtu.edu.vn`;
      const studentCode = `SV${String(2023000 + idx).slice(-7)}`;
      const fullName = randomVietnameseName(idx + 50);

      const account = await prisma.account.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password_hash: hashed,
          status: 'active',
          role_id: studentRole.id,
        },
      });

      const existingByCode = await prisma.student.findUnique({ where: { student_code: studentCode } });
      if (!existingByCode) {
        await prisma.student.upsert({
          where: { account_id: account.account_id },
          update: {},
          create: {
            account_id: account.account_id,
            student_code: studentCode,
            major: 'Công nghệ thông tin',
            cohort_year: 2023,
            status: 'active',
          },
        });
      }

      await prisma.profile.upsert({
        where: { account_id: account.account_id },
        update: {},
        create: {
          account_id: account.account_id,
          full_name: fullName,
          gender: 'male',
          nationality: 'Vietnam',
        },
      });
    }

    console.log('Done adding users.');
  } catch (err) {
    console.error('Error in add-more-users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

ensureThirtyEach();
