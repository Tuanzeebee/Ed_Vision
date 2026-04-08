const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting full permissions seeding...');

  // ========== ROLES ==========
  const roles = [
    { code: 'admin', name: 'Administrator' },
    { code: 'student', name: 'Sinh viên' },
    { code: 'teacher', name: 'Giảng viên' },
    { code: 'leader', name: 'Lãnh đạo' },
    { code: 'parent', name: 'Phụ huynh' },
  ];

  // ========== PERMISSIONS (extracted from App.tsx) ==========
  const permissionDefs = [
    // ========== ADMIN PERMISSIONS ==========
    { key: 'admin_overview', name: 'Admin Overview Dashboard', category: 'admin', description: 'Access admin overview dashboard' },
    { key: 'admin_dashboard', name: 'Admin Dashboard', category: 'admin', description: 'Access admin dashboard' },
    
    // System management
    { key: 'admin_permissions', name: 'Manage Permission Definitions', category: 'admin', description: 'Create and manage permission definitions', sensitive: true },
    { key: 'admin_role_permissions', name: 'Manage Role Permissions', category: 'admin', description: 'Assign permissions to roles', sensitive: true },
    
    // User management
    { key: 'admin_users', name: 'Manage Users', category: 'admin', description: 'View, create, edit, delete user accounts' },
    
    // Student management (admin screens)
    { key: 'admin_students', name: 'Student Management', category: 'admin', description: 'View and manage student list' },
    { key: 'admin_student_detail', name: 'Student Detail', category: 'admin', description: 'View detailed student information' },
    
    // Teacher management (admin screens)
    { key: 'admin_teachers', name: 'Teacher Management', category: 'admin', description: 'View and manage teacher list' },
    { key: 'admin_teacher_detail', name: 'Teacher Detail', category: 'admin', description: 'View teacher detail profile' },
    { key: 'admin_teacher_subjects', name: 'Teacher Subjects', category: 'admin', description: 'View teacher subjects and courses' },
    { key: 'admin_teacher_ratings', name: 'Teacher Ratings', category: 'admin', description: 'View teacher ratings and reviews' },
    { key: 'admin_teacher_performance', name: 'Teacher Performance', category: 'admin', description: 'View teacher performance metrics' },
    { key: 'admin_teacher_schedule', name: 'Teacher Schedule', category: 'admin', description: 'View teacher schedule' },
    { key: 'admin_teacher_support_history', name: 'Teacher Support History', category: 'admin', description: 'View teacher support history' },
    
    // Content / classes / Q&A
    { key: 'admin_classes', name: 'Manage Classes', category: 'admin', description: 'Manage classes and courses' },
    { key: 'admin_questions', name: 'Question Management', category: 'admin', description: 'View and manage questions' },
    { key: 'admin_questions_add', name: 'Add Question', category: 'admin', description: 'Create new questions' },
    
    // Operations
    { key: 'admin_notifications', name: 'Manage Notifications', category: 'admin', description: 'Create and manage system notifications' },
    { key: 'admin_content_approval', name: 'Content Approval', category: 'admin', description: 'Approve or reject content submissions' },
    
    // Analytics & Reports
    { key: 'admin_reports', name: 'View Reports & Analytics', category: 'admin', description: 'Access reports and analytics dashboard' },
    { key: 'admin_ai_insights', name: 'AI Insights', category: 'admin', description: 'View AI prediction results and insights' },

    // ========== TEACHER PERMISSIONS ==========
    { key: 'teacher_dashboard', name: 'Teacher Dashboard', category: 'teacher', description: 'Access teacher dashboard' },
    { key: 'teacher_class_management', name: 'Manage Classes', category: 'teacher', description: 'Manage teaching classes' },
    { key: 'teacher_grade_management', name: 'Manage Grades', category: 'teacher', description: 'Input and manage student grades' },
    { key: 'teacher_grade_setting', name: 'Grade Settings', category: 'teacher', description: 'Configure grade table settings' },
    { key: 'teacher_prediction_view', name: 'Prediction View', category: 'teacher', description: 'View AI grade predictions for students' },
    { key: 'teacher_progress_tracking', name: 'Progress Tracking', category: 'teacher', description: 'Track student progress' },
    { key: 'teacher_reports_alerts', name: 'Reports & Alerts', category: 'teacher', description: 'View reports and alerts' },
    { key: 'teacher_messages', name: 'Messages & Notifications', category: 'teacher', description: 'Send and receive messages' },
    { key: 'teacher_chat', name: 'Teacher Chat', category: 'teacher', description: 'Chat with students and parents' },
    { key: 'teacher_appointments', name: 'Manage Appointments', category: 'teacher', description: 'Manage consultation appointments' },
    { key: 'teacher_settings', name: 'Teacher Settings', category: 'teacher', description: 'Configure personal settings' },
    { key: 'teacher_meeting_demo', name: 'Meeting Detail Demo', category: 'teacher', description: 'View meeting details' },
    { key: 'teacher_notification', name: 'Teacher Notifications', category: 'teacher', description: 'View notifications' },
    { key: 'teacher_profile', name: 'Teacher Profile', category: 'teacher', description: 'View and edit teacher profile' },

    // ========== STUDENT PERMISSIONS ==========
    { key: 'student_course_overview', name: 'Course Overview', category: 'student', description: 'View course overview and grades' },
    { key: 'student_upload_transcript', name: 'Upload Transcript', category: 'student', description: 'Upload academic transcript' },
    { key: 'student_adjust_parameters', name: 'Adjust Parameters', category: 'student', description: 'Adjust prediction parameters' },
    { key: 'student_academic_planning', name: 'Academic Planning', category: 'student', description: 'Plan academic schedule' },
    { key: 'student_course_detail', name: 'Course Detail', category: 'student', description: 'View detailed course information' },
    { key: 'student_financial_survey', name: 'Financial Survey', category: 'student', description: 'Complete financial survey' },
    { key: 'student_choose_mascot', name: 'Choose Mascot', category: 'student', description: 'Select learning mascot' },
    { key: 'student_learning_adventure', name: 'Learning Adventure', category: 'student', description: 'Access learning adventure game' },
    { key: 'student_chat_student', name: 'Student Chat', category: 'student', description: 'Chat with teachers and peers' },
    { key: 'student_learning_space', name: 'Learning Space', category: 'student', description: 'Access virtual learning space' },
    { key: 'student_notification', name: 'Student Notifications', category: 'student', description: 'View notifications' },
    { key: 'student_profile', name: 'Student Profile', category: 'student', description: 'View and edit student profile' },
    { key: 'student_survey', name: 'Student Survey', category: 'student', description: 'Complete student surveys' },
    
    // Legacy student permissions (may be used elsewhere)
    { key: 'student_live_learning', name: 'Live Learning', category: 'student', description: 'Access live learning sessions' },
    { key: 'student_study_rooms', name: 'Study Rooms', category: 'student', description: 'Access virtual study rooms' },
    { key: 'student_video_room', name: 'Video Room', category: 'student', description: 'Join video conference rooms' },

    // ========== PARENT PERMISSIONS ==========
    { key: 'parent_dashboard', name: 'Parent Dashboard', category: 'parent', description: 'Access parent dashboard' },
    { key: 'parent_book_appointment', name: 'Book Appointment', category: 'parent', description: 'Schedule appointments with teachers' },
    { key: 'parent_student_details', name: 'Student Details', category: 'parent', description: 'View child student details' },
    { key: 'parent_chat', name: 'Parent Chat', category: 'parent', description: 'Chat with teachers' },
    { key: 'parent_profile', name: 'Parent Profile', category: 'parent', description: 'View and edit parent profile' },

    // ========== BOOKING PERMISSIONS ==========
    { key: 'appointments', name: 'All Appointments', category: 'booking', description: 'View all appointments' },
    { key: 'booking_scheduler', name: 'Booking Scheduler', category: 'booking', description: 'Access booking scheduler interface' },
  ];

  // ========== UPSERT ROLES ==========
  console.log('📝 Creating/updating roles...');
  for (const r of roles) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name },
      create: r,
    });
    console.log(`  ✓ Role: ${r.code}`);
  }

  // ========== UPSERT PERMISSIONS ==========
  console.log('\n📝 Creating/updating permissions...');
  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { 
        name: p.name, 
        category: p.category,
        description: p.description,
        sensitive: p.sensitive || false
      },
      create: p,
    });
    console.log(`  ✓ Permission: ${p.key}`);
  }

  // ========== ROLE-PERMISSION MAPPINGS ==========
  console.log('\n🔗 Setting up role-permission mappings...');
  
  const allPerms = await prisma.permission.findMany();
  
  // ADMIN: All permissions enabled
  const adminRole = await prisma.role.findUnique({ where: { code: 'admin' } });
  if (adminRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
    const adminData = allPerms.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
      enabled: true,
    }));
    await prisma.rolePermission.createMany({ data: adminData });
    console.log(`  ✓ Admin: ${adminData.length} permissions (all enabled)`);
  }

  // TEACHER: Enable teacher-specific permissions
  const teacherRole = await prisma.role.findUnique({ where: { code: 'teacher' } });
  if (teacherRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: teacherRole.id } });
    const teacherEnabledKeys = [
      'teacher_dashboard',
      'teacher_class_management',
      'teacher_grade_management',
      'teacher_grade_setting',
      'teacher_prediction_view',
      'teacher_progress_tracking',
      'teacher_reports_alerts',
      'teacher_messages',
      'teacher_chat',
      'teacher_appointments',
      'teacher_settings',
      'teacher_meeting_demo',
      'teacher_notification',
      'teacher_profile',
    ];
    const teacherData = allPerms.map((p) => ({
      roleId: teacherRole.id,
      permissionId: p.id,
      enabled: teacherEnabledKeys.includes(p.key),
    }));
    await prisma.rolePermission.createMany({ data: teacherData });
    const enabledCount = teacherData.filter(d => d.enabled).length;
    console.log(`  ✓ Teacher: ${enabledCount}/${teacherData.length} permissions enabled`);
  }

  // STUDENT: Enable student-specific permissions
  const studentRole = await prisma.role.findUnique({ where: { code: 'student' } });
  if (studentRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: studentRole.id } });
    const studentEnabledKeys = [
      'student_course_overview',
      'student_upload_transcript',
      'student_adjust_parameters',
      'student_academic_planning',
      'student_course_detail',
      'student_financial_survey',
      'student_choose_mascot',
      'student_learning_adventure',
      'student_chat_student',
      'student_learning_space',
      'student_notification',
      'student_profile',
      'student_survey',
      'student_live_learning',
      'student_study_rooms',
      'student_video_room',
    ];
    const studentData = allPerms.map((p) => ({
      roleId: studentRole.id,
      permissionId: p.id,
      enabled: studentEnabledKeys.includes(p.key),
    }));
    await prisma.rolePermission.createMany({ data: studentData });
    const enabledCount = studentData.filter(d => d.enabled).length;
    console.log(`  ✓ Student: ${enabledCount}/${studentData.length} permissions enabled`);
  }

  // PARENT: Enable parent-specific permissions
  const parentRole = await prisma.role.findUnique({ where: { code: 'parent' } });
  if (parentRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: parentRole.id } });
    const parentEnabledKeys = [
      'parent_dashboard',
      'parent_book_appointment',
      'parent_student_details',
      'parent_chat',
      'parent_profile',
      'appointments',
    ];
    const parentData = allPerms.map((p) => ({
      roleId: parentRole.id,
      permissionId: p.id,
      enabled: parentEnabledKeys.includes(p.key),
    }));
    await prisma.rolePermission.createMany({ data: parentData });
    const enabledCount = parentData.filter(d => d.enabled).length;
    console.log(`  ✓ Parent: ${enabledCount}/${parentData.length} permissions enabled`);
  }

  // LEADER: Enable leadership/reporting permissions
  const leaderRole = await prisma.role.findUnique({ where: { code: 'leader' } });
  if (leaderRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: leaderRole.id } });
    const leaderEnabledKeys = [
      'admin_overview',
      'admin_dashboard',
      'admin_reports',
      'admin_ai_insights',
      'admin_students',
      'admin_student_detail',
      'admin_teachers',
      'admin_teacher_detail',
      'admin_teacher_performance',
    ];
    const leaderData = allPerms.map((p) => ({
      roleId: leaderRole.id,
      permissionId: p.id,
      enabled: leaderEnabledKeys.includes(p.key),
    }));
    await prisma.rolePermission.createMany({ data: leaderData });
    const enabledCount = leaderData.filter(d => d.enabled).length;
    console.log(`  ✓ Leader: ${enabledCount}/${leaderData.length} permissions enabled`);
  }

  // ========== CREATE DEMO ACCOUNTS ==========
  console.log('\n👤 Creating demo accounts...');

  // 1. Admin account
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@dtu.edu.vn';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const adminRoleRec = await prisma.role.findUnique({ where: { code: 'admin' } });
  if (adminRoleRec) {
    let adminAcc = await prisma.account.findUnique({ where: { email: adminEmail } });
    if (!adminAcc) {
      const hash = await bcrypt.hash(adminPassword, 10);
      adminAcc = await prisma.account.create({
        data: {
          email: adminEmail,
          password_hash: hash,
          status: 'active',
          roleRel: { connect: { id: adminRoleRec.id } },
        },
      });
      console.log(`  ✓ Admin: ${adminEmail} (password: admin123)`);
    } else {
      console.log(`  ✓ Admin exists: ${adminEmail}`);
    }

    // Create profile for admin if not exists
    const adminProfile = await prisma.profile.findUnique({ where: { account_id: adminAcc.account_id } });
    if (!adminProfile) {
      await prisma.profile.create({
        data: {
          account_id: adminAcc.account_id,
          full_name: 'Quản Trị Viên',
          gender: 'male',
          nationality: 'Vietnam',
        },
      });
      console.log('    ✓ Admin profile created');
    }
  }

  // 2. Teacher account
  const teacherEmail = 'teacher@dtu.edu.vn';
  const teacherPassword = 'teacher123';
  const teacherRoleRec = await prisma.role.findUnique({ where: { code: 'teacher' } });
  if (teacherRoleRec) {
    let teacherAcc = await prisma.account.findUnique({ where: { email: teacherEmail } });
    if (!teacherAcc) {
      const hash = await bcrypt.hash(teacherPassword, 10);
      teacherAcc = await prisma.account.create({
        data: {
          email: teacherEmail,
          password_hash: hash,
          status: 'active',
          roleRel: { connect: { id: teacherRoleRec.id } },
        },
      });
      console.log(`  ✓ Teacher: ${teacherEmail} (password: teacher123)`);
    } else {
      console.log(`  ✓ Teacher exists: ${teacherEmail}`);
    }

    // Create Instructor record
    const existingInstructor = await prisma.instructor.findUnique({ where: { account_id: teacherAcc.account_id } });
    if (!existingInstructor) {
      // Find available employee code
      let employeeCode = 'GV001';
      let counter = 1;
      while (await prisma.instructor.findUnique({ where: { employee_code: employeeCode } })) {
        counter++;
        employeeCode = `GV${String(counter).padStart(3, '0')}`;
      }
      
      await prisma.instructor.create({
        data: {
          account_id: teacherAcc.account_id,
          employee_code: employeeCode,
          academic_title: 'Thạc sĩ',
          position: 'Giảng viên',
          status: 'active',
        },
      });
      console.log(`    ✓ Instructor record created (${employeeCode})`);
    }

    // Create Profile
    const teacherProfile = await prisma.profile.findUnique({ where: { account_id: teacherAcc.account_id } });
    if (!teacherProfile) {
      await prisma.profile.create({
        data: {
          account_id: teacherAcc.account_id,
          full_name: 'Nguyễn Văn Giáo Viên',
          gender: 'male',
          nationality: 'Vietnam',
        },
      });
      console.log('    ✓ Teacher profile created');
    }
  }

  // 3. Student account
  const studentEmail = 'student@dtu.edu.vn';
  const studentPassword = 'student123';
  const studentRoleRec = await prisma.role.findUnique({ where: { code: 'student' } });
  if (studentRoleRec) {
    let studentAcc = await prisma.account.findUnique({ where: { email: studentEmail } });
    if (!studentAcc) {
      const hash = await bcrypt.hash(studentPassword, 10);
      studentAcc = await prisma.account.create({
        data: {
          email: studentEmail,
          password_hash: hash,
          status: 'active',
          roleRel: { connect: { id: studentRoleRec.id } },
        },
      });
      console.log(`  ✓ Student: ${studentEmail} (password: student123)`);
    } else {
      console.log(`  ✓ Student exists: ${studentEmail}`);
    }

    // Create Student record
    const existingStudent = await prisma.student.findUnique({ where: { account_id: studentAcc.account_id } });
    if (!existingStudent) {
      // Find available student code
      let studentCode = 'SV001';
      let counter = 1;
      while (await prisma.student.findUnique({ where: { student_code: studentCode } })) {
        counter++;
        studentCode = `SV${String(counter).padStart(3, '0')}`;
      }
      
      await prisma.student.create({
        data: {
          account_id: studentAcc.account_id,
          student_code: studentCode,
          major: 'Công nghệ phần mềm',
          cohort_year: 2023,
          status: 'active',
        },
      });
      console.log(`    ✓ Student record created (${studentCode})`);
    }

    // Create Profile
    const studentProfile = await prisma.profile.findUnique({ where: { account_id: studentAcc.account_id } });
    if (!studentProfile) {
      await prisma.profile.create({
        data: {
          account_id: studentAcc.account_id,
          full_name: 'Nguyễn Văn Sinh Viên',
          gender: 'male',
          nationality: 'Vietnam',
        },
      });
      console.log('    ✓ Student profile created');
    }
  }

  // 4. Parent account
  const parentEmail = 'parent@dtu.edu.vn';
  const parentPassword = 'parent123';
  const parentRoleRec = await prisma.role.findUnique({ where: { code: 'parent' } });
  if (parentRoleRec) {
    let parentAcc = await prisma.account.findUnique({ where: { email: parentEmail } });
    if (!parentAcc) {
      const hash = await bcrypt.hash(parentPassword, 10);
      parentAcc = await prisma.account.create({
        data: {
          email: parentEmail,
          password_hash: hash,
          status: 'active',
          roleRel: { connect: { id: parentRoleRec.id } },
        },
      });
      console.log(`  ✓ Parent: ${parentEmail} (password: parent123)`);
    } else {
      console.log(`  ✓ Parent exists: ${parentEmail}`);
    }

    // Create Parent record
    const existingParent = await prisma.parent.findUnique({ where: { account_id: parentAcc.account_id } });
    if (!existingParent) {
      await prisma.parent.create({
        data: {
          account_id: parentAcc.account_id,
          relationship_type: 'parent',
          occupation: 'Giáo viên',
        },
      });
      console.log('    ✓ Parent record created');
    }

    // Create Profile
    const parentProfile = await prisma.profile.findUnique({ where: { account_id: parentAcc.account_id } });
    if (!parentProfile) {
      await prisma.profile.create({
        data: {
          account_id: parentAcc.account_id,
          full_name: 'Nguyễn Văn Phụ Huynh',
          gender: 'male',
          nationality: 'Vietnam',
        },
      });
      console.log('    ✓ Parent profile created');
    }
  }

  console.log('\n✅ Full permissions seeding completed successfully!');
  console.log('\n📋 Demo Account Credentials:');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ Admin:   admin@dtu.edu.vn   / admin123         │');
  console.log('│ Teacher: teacher@dtu.edu.vn / teacher123       │');
  console.log('│ Student: student@dtu.edu.vn / student123       │');
  console.log('│ Parent:  parent@dtu.edu.vn  / parent123        │');
  console.log('└─────────────────────────────────────────────────┘');
  
  console.log('\n📊 Summary:');
  console.log(`  • ${roles.length} roles created`);
  console.log(`  • ${permissionDefs.length} permissions created`);
  console.log(`  • Role-permission mappings configured`);
  console.log(`  • 4 demo accounts created with profiles`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
