require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { BigQuery } = require('@google-cloud/bigquery');
const prisma = new PrismaClient();
const bigquery = new BigQuery();

async function fullResetAndSync() {
  console.log('🔄 FULL RESET AND SYNC BigQuery from Postgres\n');
  console.log('⚠️  This will DELETE ALL data and rebuild from scratch!\n');

  const dataset = process.env.BIGQUERY_DATASET || 'edvision_dw';
  const project = process.env.BIGQUERY_PROJECT_ID;

  // ========== STEP 1: Clear all tables ==========
  console.log('🗑️  Step 1: Clearing all BigQuery tables (using TRUNCATE)...');
  
  await bigquery.query({ 
    query: `TRUNCATE TABLE \`${project}.${dataset}.fact_student_course_performance\`` 
  });
  console.log('   ✅ Truncated fact_student_course_performance');

  await bigquery.query({ 
    query: `TRUNCATE TABLE \`${project}.${dataset}.dim_student\`` 
  });
  console.log('   ✅ Truncated dim_student');

  await bigquery.query({ 
    query: `TRUNCATE TABLE \`${project}.${dataset}.dim_instructor\`` 
  });
  console.log('   ✅ Truncated dim_instructor');

  await bigquery.query({ 
    query: `TRUNCATE TABLE \`${project}.${dataset}.dim_account\`` 
  });
  console.log('   ✅ Truncated dim_account');

  // ========== STEP 2: Insert dim_account ==========
  // Schema: account_sk, email, role_code, status, created_at, updated_at
  console.log('\n👤 Step 2: Inserting dim_account...');
  const accounts = await prisma.account.findMany({
    include: { roleRel: true }
  });
  console.log(`   Found ${accounts.length} accounts`);

  const accountInserts = accounts.map(a => {
    // Sử dụng ngày tạo thực tế từ DB, nếu không có thì dùng 1/1/2024 (realistic hơn)
    const defaultDate = new Date('2024-01-01T00:00:00Z');
    const createdAt = a.created_at || defaultDate;
    const updatedAt = a.updated_at || defaultDate;
    
    return `(
    ${a.account_id},
    '${(a.email || '').replace(/'/g, "''")}',
    '${a.roleRel?.code || 'unknown'}',
    '${a.status || 'active'}',
    TIMESTAMP '${createdAt.toISOString()}',
    TIMESTAMP '${updatedAt.toISOString()}'
  )`;
  }).join(',\n');

  const accountSql = `
    INSERT INTO \`${project}.${dataset}.dim_account\`
    (account_sk, email, role_code, status, created_at, updated_at)
    VALUES ${accountInserts}
  `;

  await bigquery.query({ query: accountSql });
  console.log(`   ✅ Inserted ${accounts.length} accounts`);

  // ========== STEP 3: Insert dim_student ==========
  // Schema: student_sk, account_id, student_code, full_name, major, department_name, cohort_year, class_code, status, created_at
  console.log('\n👥 Step 3: Inserting dim_student...');
  const students = await prisma.student.findMany({
    include: { 
      account: { include: { profile: true } },
      classGroup: { include: { program: { include: { department: true } } } }
    }
  });
  console.log(`   Found ${students.length} students`);

  const studentInserts = students.map(s => {
    const fullName = s.account?.profile?.full_name || s.account?.username || 'Unknown';
    const className = s.classGroup?.class_code || 'N/A';
    const deptName = s.classGroup?.program?.department?.name || 'Unknown';
    const createdAt = s.account?.created_at || new Date('2024-01-01');
    
    return `(
      ${s.student_id},
      ${s.account_id},
      '${(s.student_code || '').replace(/'/g, "''")}',
      '${fullName.replace(/'/g, "''")}',
      '${(s.major || '').replace(/'/g, "''")}',
      '${deptName.replace(/'/g, "''")}',
      ${s.cohort_year || 'NULL'},
      '${className.replace(/'/g, "''")}',
      '${s.status || 'active'}',
      TIMESTAMP '${createdAt.toISOString()}'
    )`;
  }).join(',\n');

  const studentSql = `
    INSERT INTO \`${project}.${dataset}.dim_student\`
    (student_sk, account_id, student_code, full_name, major, department_name, cohort_year, class_code, status, created_at)
    VALUES ${studentInserts}
  `;

  await bigquery.query({ query: studentSql });
  console.log(`   ✅ Inserted ${students.length} students`);

  // ========== STEP 4: Insert dim_instructor ==========
  // Schema: instructor_sk, account_id, employee_code, full_name, department_name, position, status, created_at
  console.log('\n👨‍🏫 Step 4: Inserting dim_instructor...');
  const instructors = await prisma.instructor.findMany({
    include: { account: { include: { profile: true } } }
  });
  console.log(`   Found ${instructors.length} instructors`);

  if (instructors.length > 0) {
    const instructorInserts = instructors.map(i => {
      const fullName = i.account?.profile?.full_name || i.account?.username || 'Unknown';
      const createdAt = i.account?.created_at || new Date('2024-01-01');
      
      return `(
        ${i.instructor_id},
        ${i.account_id},
        '${(i.employee_code || '').replace(/'/g, "''")}',
        '${fullName.replace(/'/g, "''")}',
        '${(i.department_name || '').replace(/'/g, "''")}',
        '${(i.position || '').replace(/'/g, "''")}',
        '${i.status || 'active'}',
        TIMESTAMP '${createdAt.toISOString()}'
      )`;
    }).join(',\n');

    const instructorSql = `
      INSERT INTO \`${project}.${dataset}.dim_instructor\`
      (instructor_sk, account_id, employee_code, full_name, department_name, position, status, created_at)
      VALUES ${instructorInserts}
    `;

    await bigquery.query({ query: instructorSql });
    console.log(`   ✅ Inserted ${instructors.length} instructors`);
  }

  // ========== STEP 5: Insert fact_student_course_performance ==========
  console.log('\n📊 Step 5: Inserting fact_student_course_performance...');
  
  const courseData = await prisma.$queryRaw`
    SELECT 
      MAX(scr.record_id) as record_id,
      scr.student_id as student_sk,
      at.academic_year,
      at.semester_number,
      SUM(c.credits_unit) as total_credits,
      ROUND(CAST(SUM(scr.converted_numeric_score * c.credits_unit) / NULLIF(SUM(c.credits_unit), 0) AS NUMERIC), 2) as gpa
    FROM "StudentCourseRecord" scr
    INNER JOIN "AcademicTerm" at ON scr.term_id = at.term_id
    INNER JOIN "Course" c ON scr.course_id = c.course_id
    WHERE scr.status = 'completed' 
      AND scr.converted_numeric_score IS NOT NULL
    GROUP BY scr.student_id, at.academic_year, at.semester_number
    ORDER BY scr.student_id, at.academic_year, at.semester_number
  `;

  console.log(`   Found ${courseData.length} student-semester combinations`);

  const factInserts = courseData.map(row => {
    const gpa = Number(row.gpa);
    let gpaCategory;
    if (gpa >= 3.65) gpaCategory = 'excellent';
    else if (gpa >= 3.26) gpaCategory = 'very good';
    else if (gpa >= 2.5) gpaCategory = 'good';
    else if (gpa >= 2.0) gpaCategory = 'average';
    else gpaCategory = 'poor';

    return `(
      ${Number(row.record_id)},
      ${Number(row.student_sk)},
      '${String(row.academic_year)}',
      ${Number(row.semester_number)},
      ${Number(row.total_credits)},
      ${gpa},
      '${gpaCategory}',
      CURRENT_TIMESTAMP()
    )`;
  }).join(',\n');

  const factSql = `
    INSERT INTO \`${project}.${dataset}.fact_student_course_performance\`
    (record_sk, student_sk, academic_year, semester_number, total_credits, gpa, gpa_category, updated_at)
    VALUES ${factInserts}
  `;

  await bigquery.query({ query: factSql });
  console.log(`   ✅ Inserted ${courseData.length} fact rows`);

  // ========== STEP 6: Verify ==========
  console.log('\n🔍 Step 6: Verifying...');
  
  const [bqAccounts] = await bigquery.query({ 
    query: `SELECT COUNT(*) as count FROM \`${project}.${dataset}.dim_account\`` 
  });
  const [bqStudents] = await bigquery.query({ 
    query: `SELECT COUNT(*) as count FROM \`${project}.${dataset}.dim_student\`` 
  });
  const [bqInstructors] = await bigquery.query({ 
    query: `SELECT COUNT(*) as count FROM \`${project}.${dataset}.dim_instructor\`` 
  });
  const [bqFacts] = await bigquery.query({ 
    query: `SELECT COUNT(*) as count FROM \`${project}.${dataset}.fact_student_course_performance\`` 
  });

  console.log('\n✅ SYNC COMPLETE!');
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│              FINAL RESULTS                  │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│ Accounts:    ${accounts.length.toString().padStart(6)} → ${String(bqAccounts[0].count).padStart(6)} ✅        │`);
  console.log(`│ Students:    ${students.length.toString().padStart(6)} → ${String(bqStudents[0].count).padStart(6)} ✅        │`);
  console.log(`│ Instructors: ${instructors.length.toString().padStart(6)} → ${String(bqInstructors[0].count).padStart(6)} ✅        │`);
  console.log(`│ Fact rows:   ${courseData.length.toString().padStart(6)} → ${String(bqFacts[0].count).padStart(6)} ✅        │`);
  console.log('└─────────────────────────────────────────────┘');

  if (Number(bqAccounts[0].count) === accounts.length &&
      Number(bqStudents[0].count) === students.length &&
      Number(bqInstructors[0].count) === instructors.length &&
      Number(bqFacts[0].count) === courseData.length) {
    console.log('\n🎉 Perfect sync! All data matched!');
  } else {
    console.log('\n⚠️  Some counts mismatch - please review');
  }

  await prisma.$disconnect();
}

fullResetAndSync().catch(err => {
  console.error('❌ Error:', err);
  prisma.$disconnect();
  process.exit(1);
});
