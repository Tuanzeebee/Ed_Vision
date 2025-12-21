const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedCompleteDatabase() {
  console.log('🌱 Starting complete database seeding...\n');

  try {
    // ========== 1. ROLES & PERMISSIONS ==========
    console.log('📋 Step 1: Seeding Roles...');
    const roles = [
      { code: 'admin', name: 'Administrator' },
      { code: 'student', name: 'Sinh viên' },
      { code: 'teacher', name: 'Giảng viên' },
      { code: 'leader', name: 'Lãnh đạo' },
      { code: 'parent', name: 'Phụ huynh' },
    ];

    for (const r of roles) {
      await prisma.role.upsert({
        where: { code: r.code },
        update: {},
        create: r,
      });
    }
    console.log('✅ Roles created\n');

    console.log('📋 Step 2: Seeding Permissions...');
    const permissionDefs = [
      // Admin permissions
      { key: 'admin_overview', name: 'Admin Overview', category: 'admin' },
      { key: 'admin_permissions', name: 'Manage Permission Definitions', category: 'admin' },
      { key: 'admin_role_permissions', name: 'Manage Role Permissions', category: 'admin', sensitive: true },
      { key: 'admin_users', name: 'Manage Users', category: 'admin' },
      { key: 'admin_students', name: 'Student Management', category: 'admin' },
      { key: 'admin_student_detail', name: 'Student Detail', category: 'admin' },
      { key: 'admin_teachers', name: 'Teacher Management', category: 'admin' },
      { key: 'admin_teacher_detail', name: 'Teacher Detail', category: 'admin' },
      { key: 'admin_teacher_subjects', name: 'Teacher Subjects', category: 'admin' },
      { key: 'admin_teacher_ratings', name: 'Teacher Ratings', category: 'admin' },
      { key: 'admin_teacher_performance', name: 'Teacher Performance', category: 'admin' },
      { key: 'admin_teacher_schedule', name: 'Teacher Schedule', category: 'admin' },
      { key: 'admin_teacher_support_history', name: 'Teacher Support History', category: 'admin' },
      { key: 'admin_classes', name: 'Manage Classes', category: 'admin' },
      { key: 'admin_questions', name: 'Question Management', category: 'admin' },
      { key: 'admin_questions_add', name: 'Add Question', category: 'admin' },
      { key: 'admin_notifications', name: 'Manage Notifications', category: 'admin' },
      { key: 'admin_content_approval', name: 'Content Approval', category: 'admin' },
      { key: 'admin_reports', name: 'View Reports & Analytics', category: 'admin' },
      { key: 'admin_ai_insights', name: 'AI Insights', category: 'admin' },

      // Teacher permissions
      { key: 'teacher_dashboard', name: 'Teacher Dashboard', category: 'teacher' },
      { key: 'teacher_class_management', name: 'Manage Classes', category: 'teacher' },
      { key: 'teacher_grade_management', name: 'Manage Grades', category: 'teacher' },
      { key: 'teacher_prediction_view', name: 'Prediction View', category: 'teacher' },
      { key: 'teacher_progress_tracking', name: 'Progress Tracking', category: 'teacher' },
      { key: 'teacher_reports_alerts', name: 'Reports & Alerts', category: 'teacher' },
      { key: 'teacher_messages', name: 'Messages & Notifications', category: 'teacher' },
      { key: 'teacher_chat', name: 'Teacher Chat', category: 'teacher' },
      { key: 'teacher_appointments', name: 'Manage Appointments', category: 'teacher' },
      { key: 'teacher_settings', name: 'Teacher Settings', category: 'teacher' },
      { key: 'teacher_meeting_demo', name: 'Meeting Detail Demo', category: 'teacher' },
      { key: 'teacher_profile', name: 'Teacher Profile', category: 'teacher' },

      // Student permissions
      { key: 'student_course_overview', name: 'Course Overview', category: 'student' },
      { key: 'student_upload_transcript', name: 'Upload Transcript', category: 'student' },
      { key: 'student_adjust_parameters', name: 'Adjust Parameters', category: 'student' },
      { key: 'student_academic_planning', name: 'Academic Planning', category: 'student' },
      { key: 'student_course_detail', name: 'Course Detail', category: 'student' },
      { key: 'student_financial_survey', name: 'Financial Survey', category: 'student' },
      { key: 'student_choose_mascot', name: 'Choose Mascot', category: 'student' },
      { key: 'student_learning_adventure', name: 'Learning Adventure', category: 'student' },
      { key: 'student_live_learning', name: 'Live Learning', category: 'student' },
      { key: 'student_study_rooms', name: 'Study Rooms', category: 'student' },
      { key: 'student_video_room', name: 'Video Room', category: 'student' },
      { key: 'student_profile', name: 'Student Profile', category: 'student' },
      { key: 'student_chat_student', name: 'Student Chat', category: 'student' },
      { key: 'student_learning_space', name: 'Learning Space', category: 'student' },
      { key: 'student_survey', name: 'Student Survey', category: 'student' },

      // Parent permissions
      { key: 'parent_dashboard', name: 'Parent Dashboard', category: 'parent' },
      { key: 'parent_book_appointment', name: 'Book Appointment', category: 'parent' },
      { key: 'parent_appointments', name: 'Parent Appointments', category: 'parent' },
      { key: 'parent_student_details', name: 'Student Details', category: 'parent' },
      { key: 'parent_chat', name: 'Parent Chat', category: 'parent' },
      { key: 'parent_profile', name: 'Parent Profile', category: 'parent' },

      // Booking
      { key: 'booking_scheduler', name: 'Booking Scheduler', category: 'booking' },
    ];

    for (const p of permissionDefs) {
      await prisma.permission.upsert({
        where: { key: p.key },
        update: {},
        create: p,
      });
    }
    console.log('✅ Permissions created\n');

    console.log('📋 Step 3: Assigning Role Permissions...');
    const allPerms = await prisma.permission.findMany();

    // Admin: all permissions
    const adminRole = await prisma.role.findUnique({ where: { code: 'admin' } });
    if (adminRole) {
      await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
      const data = allPerms.map((p) => ({
        roleId: adminRole.id,
        permissionId: p.id,
        enabled: true,
      }));
      if (data.length) await prisma.rolePermission.createMany({ data });
    }

    // Student: selective permissions
    const studentRole = await prisma.role.findUnique({ where: { code: 'student' } });
    if (studentRole) {
      await prisma.rolePermission.deleteMany({ where: { roleId: studentRole.id } });
      const rows = [];
      for (const p of allPerms) {
        const enabled = ['student_course_overview', 'student_profile', 'student_upload_transcript', 'student_chat_student'].includes(p.key);
        rows.push({ roleId: studentRole.id, permissionId: p.id, enabled });
      }
      if (rows.length) await prisma.rolePermission.createMany({ data: rows });
    }

    // Teacher: selective permissions
    const teacherRole = await prisma.role.findUnique({ where: { code: 'teacher' } });
    if (teacherRole) {
      await prisma.rolePermission.deleteMany({ where: { roleId: teacherRole.id } });
      const rows = [];
      for (const p of allPerms) {
        const enabled = [
          'teacher_dashboard',
          'teacher_class_management',
          'teacher_grade_management',
          'teacher_prediction_view',
          'teacher_progress_tracking',
          'teacher_messages',
          'teacher_chat',
          'teacher_appointments',
          'teacher_profile'
        ].includes(p.key);
        rows.push({ roleId: teacherRole.id, permissionId: p.id, enabled });
      }
      if (rows.length) await prisma.rolePermission.createMany({ data: rows });
    }

    // Leader: selective permissions
    const leaderRole = await prisma.role.findUnique({ where: { code: 'leader' } });
    if (leaderRole) {
      await prisma.rolePermission.deleteMany({ where: { roleId: leaderRole.id } });
      const rows = [];
      for (const p of allPerms) {
        const enabled = ['admin_reports', 'admin_overview'].includes(p.key);
        rows.push({ roleId: leaderRole.id, permissionId: p.id, enabled });
      }
      if (rows.length) await prisma.rolePermission.createMany({ data: rows });
    }

    // Parent: selective permissions
    const parentRole = await prisma.role.findUnique({ where: { code: 'parent' } });
    if (parentRole) {
      await prisma.rolePermission.deleteMany({ where: { roleId: parentRole.id } });
      const rows = [];
      for (const p of allPerms) {
        const enabled = ['parent_dashboard', 'parent_book_appointment', 'parent_chat', 'parent_profile'].includes(p.key);
        rows.push({ roleId: parentRole.id, permissionId: p.id, enabled });
      }
      if (rows.length) await prisma.rolePermission.createMany({ data: rows });
    }
    console.log('✅ Role permissions assigned\n');

    // ========== 2. DEMO ACCOUNTS ==========
    console.log('📋 Step 4: Creating Demo Accounts...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Admin Account
    let adminAcc = await prisma.account.upsert({
      where: { email: 'admin@dtu.edu.vn' },
      update: {},
      create: {
        email: 'admin@dtu.edu.vn',
        password_hash: hashedPassword,
        status: 'active',
        role_id: adminRole.id,
      },
    });
    await prisma.profile.upsert({
      where: { account_id: adminAcc.account_id },
      update: {},
      create: {
        account_id: adminAcc.account_id,
        full_name: 'Quản trị viên',
        gender: 'male',
        nationality: 'Vietnam',
        phone_number: '0123456789',
      },
    });
    console.log('  ✓ Admin: admin@dtu.edu.vn / password123');

    // Teacher Accounts
    const teachers = [
      { email: 'teacher@dtu.edu.vn', name: 'Nguyễn Văn Giáo Viên', code: 'GV001', title: 'Thạc sĩ' },
      { email: 'teacher2@dtu.edu.vn', name: 'Trần Thị Thu Hà', code: 'GV002', title: 'Tiến sĩ' },
      { email: 'teacher3@dtu.edu.vn', name: 'Lê Minh Tuấn', code: 'GV003', title: 'PGS.TS' },
    ];

    for (const t of teachers) {
      let teacherAcc = await prisma.account.upsert({
        where: { email: t.email },
        update: {},
        create: {
          email: t.email,
          password_hash: hashedPassword,
          status: 'active',
          role_id: teacherRole.id,
        },
      });
      
      const existingInstructor = await prisma.instructor.findUnique({
        where: { employee_code: t.code }
      });
      
      if (!existingInstructor) {
        await prisma.instructor.upsert({
          where: { account_id: teacherAcc.account_id },
          update: {},
          create: {
            account_id: teacherAcc.account_id,
            employee_code: t.code,
            academic_title: t.title,
            position: 'Giảng viên',
            status: 'active',
          },
        });
      }
      
      await prisma.profile.upsert({
        where: { account_id: teacherAcc.account_id },
        update: {},
        create: {
          account_id: teacherAcc.account_id,
          full_name: t.name,
          gender: 'male',
          nationality: 'Vietnam',
          phone_number: '0987654321',
        },
      });
    }
    console.log('  ✓ Teachers: teacher@dtu.edu.vn, teacher2@dtu.edu.vn, teacher3@dtu.edu.vn / password123');

    // Student Accounts
    const students = [
      { email: 'student@dtu.edu.vn', name: 'Nguyễn Văn Sinh Viên', code: 'SV2023001', major: 'Công nghệ phần mềm' },
      { email: 'student2@dtu.edu.vn', name: 'Trần Thị Lan', code: 'SV2023002', major: 'Khoa học máy tính' },
      { email: 'student3@dtu.edu.vn', name: 'Lê Văn Nam', code: 'SV2023003', major: 'An toàn thông tin' },
      { email: 'student4@dtu.edu.vn', name: 'Phạm Thị Hương', code: 'SV2023004', major: 'Trí tuệ nhân tạo' },
      { email: 'student5@dtu.edu.vn', name: 'Hoàng Văn Đức', code: 'SV2023005', major: 'Công nghệ phần mềm' },
    ];

    for (const s of students) {
      let studentAcc = await prisma.account.upsert({
        where: { email: s.email },
        update: {},
        create: {
          email: s.email,
          password_hash: hashedPassword,
          status: 'active',
          role_id: studentRole.id,
        },
      });
      
      const existingStudent = await prisma.student.findUnique({
        where: { student_code: s.code }
      });
      
      if (!existingStudent) {
        await prisma.student.upsert({
          where: { account_id: studentAcc.account_id },
          update: {},
          create: {
            account_id: studentAcc.account_id,
            student_code: s.code,
            major: s.major,
            cohort_year: 2023,
            status: 'active',
          },
        });
      }
      
      await prisma.profile.upsert({
        where: { account_id: studentAcc.account_id },
        update: {},
        create: {
          account_id: studentAcc.account_id,
          full_name: s.name,
          gender: 'male',
          nationality: 'Vietnam',
          phone_number: '0111111111',
        },
      });
    }
    console.log('  ✓ Students: student@dtu.edu.vn - student5@dtu.edu.vn / password123');

    // Parent Accounts
    const parents = [
      { email: 'parent@dtu.edu.vn', name: 'Nguyễn Văn Phụ Huynh', relation: 'parent' },
      { email: 'parent2@dtu.edu.vn', name: 'Trần Thị Mai', relation: 'parent' },
    ];

    for (const p of parents) {
      let parentAcc = await prisma.account.upsert({
        where: { email: p.email },
        update: {},
        create: {
          email: p.email,
          password_hash: hashedPassword,
          status: 'active',
          role_id: parentRole.id,
        },
      });
      await prisma.parent.upsert({
        where: { account_id: parentAcc.account_id },
        update: {},
        create: {
          account_id: parentAcc.account_id,
          relationship_type: p.relation,
          occupation: 'Giáo viên',
        },
      });
      await prisma.profile.upsert({
        where: { account_id: parentAcc.account_id },
        update: {},
        create: {
          account_id: parentAcc.account_id,
          full_name: p.name,
          gender: 'male',
          nationality: 'Vietnam',
          phone_number: '0222222222',
        },
      });
    }
    console.log('  ✓ Parents: parent@dtu.edu.vn, parent2@dtu.edu.vn / password123\n');

    // ========== 3. DEPARTMENTS & PROGRAMS ==========
    console.log('📋 Step 5: Creating Departments & Programs...');
    const dept = await prisma.department.upsert({
      where: { code: 'CNTT' },
      update: {},
      create: {
        code: 'CNTT',
        name: 'Khoa Công nghệ Thông tin',
        status: 'active',
      },
    });

    const program = await prisma.program.upsert({
      where: { program_code: 'SE2023' },
      update: {},
      create: {
        program_code: 'SE2023',
        program_name: 'Công nghệ Phần mềm 2023',
        duration_years: 4,
        department_id: dept.department_id,
      },
    });
    console.log('✅ Departments & Programs created\n');

    // ========== 4. CLASSES ==========
    console.log('📋 Step 6: Creating Classes...');
    const classGroup = await prisma.classGroup.upsert({
      where: { class_code: '21SE1' },
      update: {},
      create: {
        class_code: '21SE1',
        program_id: program.program_id,
        cohort_year: 2023,
        status: 'active',
      },
    });
    console.log('✅ Classes created\n');

    // ========== 5. COURSES ==========
    console.log('📋 Step 7: Creating Courses...');
    const courses = [
      { code: 'IT101', name: 'Nhập môn Lập trình', credits: 4, difficulty: 'easy' },
      { code: 'IT102', name: 'Cấu trúc Dữ liệu', credits: 4, difficulty: 'medium' },
      { code: 'IT103', name: 'Cơ sở Dữ liệu', credits: 3, difficulty: 'medium' },
      { code: 'IT104', name: 'Mạng máy tính', credits: 3, difficulty: 'hard' },
      { code: 'IT105', name: 'Trí tuệ Nhân tạo', credits: 4, difficulty: 'hard' },
    ];

    for (const c of courses) {
      await prisma.course.upsert({
        where: { course_code_study_format: { course_code: c.code, study_format: 'offline' } },
        update: {},
        create: {
          course_code: c.code,
          course_name: c.name,
          credits_unit: c.credits,
          study_format: 'offline',
          language: 'Vietnamese',
          difficulty: c.difficulty,
        },
      });
    }
    console.log('✅ Courses created\n');

    // ========== 6. ACADEMIC TERMS ==========
    console.log('📋 Step 8: Creating Academic Terms...');
    const terms = [
      { year: '2023-2024', semester: 1 },
      { year: '2023-2024', semester: 2 },
      { year: '2024-2025', semester: 1 },
    ];

    for (const t of terms) {
      await prisma.academicTerm.upsert({
        where: { academic_year_semester_number: { academic_year: t.year, semester_number: t.semester } },
        update: {},
        create: {
          academic_year: t.year,
          semester_number: t.semester,
          is_summer: false,
          status: 'active',
        },
      });
    }
    console.log('✅ Academic Terms created\n');

    // ========== 7. NOTIFICATION TEMPLATES ==========
    console.log('📋 Step 9: Creating Notification Templates...');
    const templates = [
      { code: 'appointment.created', title: 'Cuộc hẹn mới', content: 'Cuộc hẹn của bạn với {instructor_name} vào {date} đã được tạo.', channel: 'both' },
      { code: 'appointment.reminder', title: 'Nhắc nhở cuộc hẹn', content: 'Bạn có cuộc hẹn với {instructor_name} vào {date}.', channel: 'both' },
      { code: 'appointment.cancelled', title: 'Cuộc hẹn bị hủy', content: 'Cuộc hẹn với {instructor_name} vào {date} đã bị hủy.', channel: 'both' },
      { code: 'survey.reminder', title: 'Khảo sát', content: 'Vui lòng hoàn thành khảo sát {survey_title}.', channel: 'in_app' },
    ];

    for (const t of templates) {
      await prisma.notificationTemplate.upsert({
        where: { code: t.code },
        update: {},
        create: t,
      });
    }
    console.log('✅ Notification Templates created\n');

    // ========== 8. CAMPUS NETWORK CONFIG ==========
    console.log('📋 Step 10: Creating Campus Network Config...');
    await prisma.campusNetworkConfig.upsert({
      where: { campus_name: 'DTU Main Campus' },
      update: {},
      create: {
        campus_name: 'DTU Main Campus',
        ip_ranges: JSON.stringify(['192.168.1.0/24', '10.0.0.0/16']),
        wifi_ssids: JSON.stringify(['DTU-WiFi', 'DTU-Student']),
        gateway_ips: JSON.stringify(['192.168.1.1', '10.0.0.1']),
        latitude_center: 16.0544,
        longitude_center: 108.2022,
        radius_meters: 500,
        is_active: true,
      },
    });
    console.log('✅ Campus Network Config created\n');

    // ========== 9. SURVEY QUESTIONS ==========
    console.log('📋 Step 11: Creating Survey Questions...');
    const questions = [
      { text: 'Bạn học bao nhiêu giờ mỗi tuần?', type: 'slider', category: 'academic', code: 'study_time', min: 0, max: 40 },
      { text: 'Bạn làm việc bao nhiêu giờ mỗi tuần?', type: 'slider', category: 'work', code: 'work_time', min: 0, max: 40 },
      { text: 'Tình trạng tài chính của bạn?', type: 'multiple_choice', category: 'financial', code: 'financial_status' },
      { text: 'Tình trạng tinh thần của bạn?', type: 'multiple_choice', category: 'mental', code: 'mental_health' },
    ];

    for (const q of questions) {
      await prisma.surveyQuestion.upsert({
        where: { code: q.code },
        update: {},
        create: {
          question_text: q.text,
          question_type: q.type,
          category: q.category,
          code: q.code,
          is_active: true,
          min_value: q.min,
          max_value: q.max,
        },
      });
    }
    console.log('✅ Survey Questions created\n');

    console.log('🎉 Database seeding completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('👑 Admin:    admin@dtu.edu.vn     / password123');
    console.log('👨‍🏫 Teachers: teacher@dtu.edu.vn   / password123');
    console.log('            teacher2@dtu.edu.vn  / password123');
    console.log('            teacher3@dtu.edu.vn  / password123');
    console.log('👨‍🎓 Students: student@dtu.edu.vn   / password123');
    console.log('            student2@dtu.edu.vn  / password123');
    console.log('            student3@dtu.edu.vn  / password123');
    console.log('            student4@dtu.edu.vn  / password123');
    console.log('            student5@dtu.edu.vn  / password123');
    console.log('👪 Parents:  parent@dtu.edu.vn    / password123');
    console.log('            parent2@dtu.edu.vn   / password123');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCompleteDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
