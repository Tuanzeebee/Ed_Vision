const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mapping of department short codes to readable names and default program codes
const DEPARTMENTS = [
  { code: 'NNXH', name: 'Trường Ngôn ngữ và Xã hội' },
  { code: 'DTQT', name: 'Trường Đào Tạo Quốc Tế' },
  { code: 'KHCN', name: 'Trường Khoa Học Máy Tính' },
  { code: 'KTKD', name: 'Trường Kinh tế và Kinh doanh' },
  { code: 'DL',   name: 'Trường Du lịch' },
  { code: 'YD',   name: 'Trường Y - Dược' },
  { code: 'CONG', name: 'Trường Công nghệ' },
];

// Cohort mapping for class prefix -> cohort_year
const COHORT_PREFIX_TO_YEAR = {
  K28: 2022,
  K29: 2023,
  K30: 2024,
  K31: 2025,
};

function pickDeptIndex(i) {
  return i % DEPARTMENTS.length;
}

function makeClassCode(prefix, deptCode, idx) {
  // e.g., K29-DTQT-1
  return `${prefix}-${deptCode}-${idx}`;
}

function inferCohortFromStudentCode(student_code) {
  if (!student_code) return null;
  const m = student_code.match(/(20\d{2})/);
  if (m) return parseInt(m[1], 10);
  return null;
}

async function run() {
  try {
    console.log('1) Ensure Departments and Programs exist');
    const createdDepartments = [];
    for (const d of DEPARTMENTS) {
      const dept = await prisma.department.upsert({
        where: { code: d.code },
        update: { name: d.name },
        create: { code: d.code, name: d.name, status: 'active' },
      });
      createdDepartments.push(dept);
    }

    console.log('2) Ensure one Program per Department');
    const programs = [];
    for (const [i, dept] of createdDepartments.entries()) {
      const programCode = `PRG_${dept.code}`;
      const pr = await prisma.program.upsert({
        where: { program_code: programCode },
        update: { program_name: `${dept.name} - Chương trình chung` },
        create: {
          program_code: programCode,
          program_name: `${dept.name} - Chương trình chung`,
          duration_years: 4,
          department_id: dept.department_id,
        },
      });
      programs.push(pr);
    }

    console.log('3) Ensure ClassGroups for K28..K31 for each department (one per dept per cohort)');
    const classGroups = [];
    for (const prefix of Object.keys(COHORT_PREFIX_TO_YEAR)) {
      for (const [i, pr] of programs.entries()) {
        const deptCode = DEPARTMENTS[i].code;
        const classCode = makeClassCode(prefix, deptCode, 1);
        const cg = await prisma.classGroup.upsert({
          where: { class_code: classCode },
          update: { cohort_year: COHORT_PREFIX_TO_YEAR[prefix], status: 'active' },
          create: {
            class_code: classCode,
            program_id: pr.program_id,
            cohort_year: COHORT_PREFIX_TO_YEAR[prefix],
            status: 'active',
          },
        });
        classGroups.push(cg);
      }
    }

    console.log('4) Update Student records: set cohort_year, major (if missing), and assign class_id based on student_code cohort');
    const students = await prisma.student.findMany({ include: { account: true, classGroup: true } });

    // Build map: cohort_year -> list of classGroups with that cohort
    const classMap = {};
    for (const cg of classGroups) {
      classMap[cg.cohort_year] = classMap[cg.cohort_year] || [];
      classMap[cg.cohort_year].push(cg);
    }

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      let cohortYear = s.cohort_year;
      if (!cohortYear) {
        // attempt infer from student_code
        const acc = await prisma.account.findUnique({ where: { account_id: s.account_id } });
        const scode = s.student_code || (acc && acc.email) || null;
        const inferred = inferCohortFromStudentCode(scode);
        cohortYear = inferred || 2023; // default
      }

      // ensure major
      let major = s.major || 'Công Nghệ Phần Mềm';

      // pick a class group for this cohort
      const candidates = classMap[cohortYear] || [];
      let class_id = s.class_id;
      if (candidates.length > 0) {
        // choose deterministically by student_id
        const pick = candidates[ i % candidates.length ];
        class_id = pick.class_id;
      } else {
        class_id = s.class_id || null;
      }

      await prisma.student.update({
        where: { student_id: s.student_id },
        data: {
          cohort_year: cohortYear,
          major,
          class_id: class_id,
          status: s.status || 'active',
        },
      });
    }

    console.log('5) Update Instructor records: assign department_id evenly');
    const instructors = await prisma.instructor.findMany();
    for (let i = 0; i < instructors.length; i++) {
      const ins = instructors[i];
      const deptIdx = pickDeptIndex(i);
      const dept = createdDepartments[deptIdx];
      await prisma.instructor.update({
        where: { instructor_id: ins.instructor_id },
        data: { department_id: dept.department_id },
      });
    }

    console.log('6) Done. Summary:');
    const instrCount = await prisma.instructor.count();
    const studCount = await prisma.student.count();
    const classCount = await prisma.classGroup.count();
    console.log({ instrCount, studCount, classCount });

  } catch (err) {
    console.error('Error during update:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
