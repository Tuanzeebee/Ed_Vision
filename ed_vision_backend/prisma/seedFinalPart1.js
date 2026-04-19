const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(' Starting seedFinalPart1.js - Seeding Role table...');

  // Seed Role table with data from the image
  const roles = [
    {
      code: 'admin',
      name: 'Administrator',
    },
    {
      code: 'student',
      name: 'Sinh viên',
    },
    {
      code: 'teacher',
      name: 'Giảng viên',
    },
    {
      code: 'leader',
      name: 'Lãnh đạo',
    },
    {
      code: 'parent',
      name: 'Phụ huynh',
    },
  ];

  for (const role of roles) {
    const createdRole = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    });
    console.log(` Role created/updated: ${createdRole.code} (id: ${createdRole.id})`);
  }

  // Seed Permission table with data extracted from App.tsx
  console.log('\n Seeding Permission table...');
  
  const permissions = [
    // ========== SHARED PERMISSIONS (Cross-role) ==========
    { key: 'appointments', name: 'Appointments Management', category: 'shared' },
    { key: 'booking_scheduler', name: 'Booking Scheduler', category: 'shared' },
    
    // ========== STUDENT PERMISSIONS ==========
    { key: 'student_course_overview', name: 'Course Overview', category: 'student' },
    { key: 'student_upload_transcript', name: 'Upload Transcript', category: 'student' },
    { key: 'student_adjust_parameters', name: 'Adjust Parameters', category: 'student' },
    { key: 'student_academic_planning', name: 'Academic Planning', category: 'student' },
    { key: 'student_course_detail', name: 'Course Detail View', category: 'student' },
    { key: 'student_financial_survey', name: 'Financial Survey', category: 'student' },
    { key: 'student_choose_mascot', name: 'Choose Mascot', category: 'student' },
    { key: 'student_learning_adventure', name: 'Learning Adventure', category: 'student' },
    { key: 'student_chat_student', name: 'Chat with Student', category: 'student' },
    { key: 'student_learning_space', name: 'Learning Space', category: 'student' },
    { key: 'student_profile', name: 'Student Profile', category: 'student' },
    { key: 'student_survey', name: 'Student Survey', category: 'student' },
    { key: 'student_notification', name: 'Student Notifications', category: 'student' },
    
    // ========== TEACHER PERMISSIONS ==========
    { key: 'teacher_dashboard', name: 'Teacher Dashboard', category: 'teacher' },
    { key: 'teacher_class_management', name: 'Class Management', category: 'teacher' },
    { key: 'teacher_grade_management', name: 'Grade Management', category: 'teacher' },
    { key: 'teacher_grade_setting', name: 'Grade Table Settings', category: 'teacher' },
    { key: 'teacher_prediction_view', name: 'Prediction View', category: 'teacher' },
    { key: 'teacher_progress_tracking', name: 'Progress Tracking', category: 'teacher' },
    { key: 'teacher_reports_alerts', name: 'Reports & Alerts', category: 'teacher' },
    { key: 'teacher_messages', name: 'Messages', category: 'teacher' },
    { key: 'teacher_appointments', name: 'Appointments & Schedule', category: 'teacher' },
    { key: 'teacher_settings', name: 'Settings', category: 'teacher' },
    { key: 'teacher_meeting_demo', name: 'Meeting Details', category: 'teacher' },
    { key: 'teacher_profile', name: 'Teacher Profile', category: 'teacher' },
    { key: 'teacher_notification', name: 'Teacher Notifications', category: 'teacher' },
    
    // ========== PARENT PERMISSIONS ==========
    { key: 'parent_dashboard', name: 'Parent Dashboard', category: 'parent' },
    { key: 'parent_book_appointment', name: 'Book Appointment', category: 'parent' },
    { key: 'parent_student_details', name: 'Student Details', category: 'parent' },
    { key: 'parent_chat', name: 'Chat with Teachers', category: 'parent' },
    { key: 'parent_profile', name: 'Parent Profile', category: 'parent' },
    
    // ========== ADMIN PERMISSIONS ==========
    { key: 'admin_overview', name: 'Admin Dashboard Overview', category: 'admin' },
    { key: 'admin_users', name: 'User Account Management', category: 'admin' },
    { key: 'admin_students', name: 'Student Management', category: 'admin' },
    { key: 'admin_student_detail', name: 'Student Details', category: 'admin' },
    { key: 'admin_teachers', name: 'Teacher Management', category: 'admin' },
    { key: 'admin_teacher_detail', name: 'Teacher Details', category: 'admin' },
    { key: 'admin_teacher_subjects', name: 'Teacher Subjects', category: 'admin' },
    { key: 'admin_teacher_ratings', name: 'Teacher Ratings', category: 'admin' },
    { key: 'admin_teacher_performance', name: 'Teacher Performance', category: 'admin' },
    { key: 'admin_teacher_schedule', name: 'Teacher Schedule', category: 'admin' },
    { key: 'admin_teacher_support_history', name: 'Teacher Support History', category: 'admin' },
    { key: 'admin_questions', name: 'Question Management', category: 'admin' },
    { key: 'admin_questions_add', name: 'Add Questions', category: 'admin' },
    { key: 'admin_classes', name: 'Classes Management', category: 'admin' },
    { key: 'admin_reports', name: 'Reports & Analytics', category: 'admin' },
    { key: 'admin_ai_insights', name: 'AI Insights & Predictions', category: 'admin' },
    { key: 'admin_notifications', name: 'Notification Management', category: 'admin' },
    { key: 'admin_content_approval', name: 'Content Approval', category: 'admin' },
    { key: 'admin_permissions', name: 'Permission Management', category: 'admin' },
    { key: 'admin_role_permissions', name: 'Role Permission Management', category: 'admin' },
    { key: 'admin_dashboard', name: 'Admin Dashboard', category: 'admin' },
  ];

  for (const permission of permissions) {
    const createdPermission = await prisma.permission.upsert({
      where: { key: permission.key },
      update: { name: permission.name, category: permission.category },
      create: permission,
    });
    console.log(` Permission created/updated: ${createdPermission.key} (id: ${createdPermission.id})`);
  }

  // Seed Department table
  console.log('\n Seeding Department table...');

  const departments = [
    { code: 'SET', name: 'Trường Công nghệ & Kỹ thuật' },
    { code: 'SBE', name: 'Trường Kinh tế & Kinh doanh' },
    { code: 'SCS', name: 'Trường Khoa học Máy tính' },
    { code: 'LHSS', name: 'Trường Ngôn ngữ & Xã hội Nhân văn' },
    { code: 'HTI', name: 'Trường Du lịch & Dịch vụ' },
    { code: 'IS', name: 'Trường Đào tạo Quốc tế' },
    { code: 'CMP', name: 'Trường Y Dược' },
  ];

  // Build deptMap during seeding to ensure departments are created
  const deptMap = {};
  for (const dept of departments) {
    const createdDept = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: { code: dept.code, name: dept.name, status: 'active' },
    });
    deptMap[dept.code] = createdDept.department_id;
    console.log(` Department created/updated: ${createdDept.code} - ${createdDept.name} (id: ${createdDept.department_id})`);
  }

  console.log('\n Department Map:', deptMap);

  // Seed Program table
  console.log('\n Seeding Program table...');

  const programs = [
    // SET – Trường Công nghệ & Kỹ thuật
    { code: 'KKTDT', name: 'Kỹ thuật Điện – Điện tử', deptCode: 'SET', duration: 4 },
    { code: 'CODT', name: 'Cơ Điện tử', deptCode: 'SET', duration: 4 },
    { code: 'CAKO', name: 'Công nghệ Kỹ thuật Ô tô', deptCode: 'SET', duration: 4 },
    { code: 'KKTDKTH', name: 'Kỹ thuật Điều khiển & Tự động hóa', deptCode: 'SET', duration: 4 },
    { code: 'KTC', name: 'Kiến trúc Công trình', deptCode: 'SET', duration: 5 },
    { code: 'KTN', name: 'Kiến trúc Nội thất', deptCode: 'SET', duration: 4 },

    // SBE – Trường Kinh tế & Kinh doanh
    { code: 'QTKD', name: 'Quản trị Kinh doanh', deptCode: 'SBE', duration: 4 },
    { code: 'KTKD', name: 'Kế toán', deptCode: 'SBE', duration: 4 },
    { code: 'KTTC', name: 'Kinh tế – Tài chính', deptCode: 'SBE', duration: 4 },

    // SCS – Trường Khoa học Máy tính
    { code: 'CNPM', name: 'Công nghệ Phần mềm', deptCode: 'SCS', duration: 4 },
    { code: 'TCGM', name: 'Thiết kế Game & Multimedia', deptCode: 'SCS', duration: 4 },
    { code: 'MMTDC', name: 'Mạng máy tính & Truyền thông dữ liệu', deptCode: 'SCS', duration: 4 },
    { code: 'KTMM', name: 'Kỹ thuật Mạng', deptCode: 'SCS', duration: 4 },
    { code: 'KHCDL', name: 'Khoa học Dữ liệu', deptCode: 'SCS', duration: 4 },
    { code: 'KHMT', name: 'Khoa học Máy tính', deptCode: 'SCS', duration: 4 },
    { code: 'TTNH', name: 'Trí tuệ Nhân tạo', deptCode: 'SCS', duration: 4 },

    // LHSS – Trường Ngôn ngữ & Xã hội Nhân văn
    { code: 'TA', name: 'Tiếng Anh', deptCode: 'LHSS', duration: 4 },
    { code: 'TQ', name: 'Tiếng Trung', deptCode: 'LHSS', duration: 4 },
    { code: 'TH', name: 'Tiếng Hàn', deptCode: 'LHSS', duration: 4 },
    { code: 'TNJ', name: 'Tiếng Nhật', deptCode: 'LHSS', duration: 4 },
    { code: 'VLBC', name: 'Văn học & Báo chí', deptCode: 'LHSS', duration: 4 },
    { code: 'QHQT', name: 'Quan hệ Quốc tế', deptCode: 'LHSS', duration: 4 },
    { code: 'TTDPM', name: 'Truyền thông đa phương tiện', deptCode: 'LHSS', duration: 4 },

    // HTI – Trường Du lịch & Dịch vụ
    { code: 'QTDLKS', name: 'Quản trị Du lịch & Khách sạn', deptCode: 'HTI', duration: 4 },
    { code: 'QLNHDV', name: 'Quản lý Nhà hàng & Dịch vụ', deptCode: 'HTI', duration: 4 },
    { code: 'QTLH', name: 'Quản trị Lữ hành', deptCode: 'HTI', duration: 4 },

    // IS – Trường Đào tạo Quốc tế
    { code: 'CNPMC', name: 'Công nghệ Phần mềm chuẩn CMU', deptCode: 'IS', duration: 4 },
    { code: 'HSTQGC', name: 'Hệ thống Thông tin Quản lý chuẩn CMU', deptCode: 'IS', duration: 4 },
    { code: 'ANMC', name: 'An ninh mạng chuẩn CMU', deptCode: 'IS', duration: 4 },
    { code: 'QTKDP', name: 'Quản trị Kinh doanh chuẩn PSU', deptCode: 'IS', duration: 4 },
    { code: 'KTTCP', name: 'Kế toán & Tài chính – Ngân hàng chuẩn PSU', deptCode: 'IS', duration: 4 },

    // CMP – Trường Y Dược
    { code: 'BSDK', name: 'Bác sĩ Đa khoa', deptCode: 'CMP', duration: 6 },
    { code: 'BSRHM', name: 'Bác sĩ Răng – Hàm – Mặt', deptCode: 'CMP', duration: 6 },
    { code: 'BSDKDHDQT', name: 'Bác sĩ Đa khoa định hướng quốc tế', deptCode: 'CMP', duration: 6 },
    { code: 'DDDKDK', name: 'Điều dưỡng Đa khoa', deptCode: 'CMP', duration: 3 },
  ];

  for (const prog of programs) {
    const deptId = deptMap[prog.deptCode];
    if (!deptId) {
      console.warn(` Department ${prog.deptCode} not found for program ${prog.code}`);
      continue;
    }

    const createdProg = await prisma.program.upsert({
      where: { program_code: prog.code },
      update: {
        program_name: prog.name,
        duration_years: prog.duration,
        department_id: deptId,
      },
      create: {
        program_code: prog.code,
        program_name: prog.name,
        duration_years: prog.duration,
        department_id: deptId,
      },
    });
    console.log(` Program created/updated: ${createdProg.program_code} - ${createdProg.program_name} (id: ${createdProg.program_id})`);
  }

  // Seed RolePermission - Enable appropriate permissions for each role
  console.log('\n Seeding RolePermission table...');

  // Get all roles and permissions from DB
  const allRoles = await prisma.role.findMany();
  const allPermissions = await prisma.permission.findMany();

  // Define which permissions should be enabled for each role
  const rolePermissionMap = {
    admin: [
      // Admin dashboard & overview
      'admin_overview', 'admin_dashboard',
      // User management
      'admin_users',
      // Student management
      'admin_students', 'admin_student_detail',
      // Teacher management
      'admin_teachers', 'admin_teacher_detail', 'admin_teacher_subjects',
      'admin_teacher_ratings', 'admin_teacher_performance', 'admin_teacher_schedule',
      'admin_teacher_support_history',
      // Question management
      'admin_questions', 'admin_questions_add', 'admin_classes',
      // Reports & Analytics
      'admin_reports', 'admin_ai_insights',
      // System management
      'admin_notifications', 'admin_content_approval', 'admin_permissions',
      'admin_role_permissions',
      // Shared
      'appointments', 'booking_scheduler',
    ],
    student: [
      // Student-specific
      'student_course_overview', 'student_upload_transcript', 'student_adjust_parameters',
      'student_academic_planning', 'student_course_detail', 'student_financial_survey',
      'student_choose_mascot', 'student_learning_adventure', 'student_chat_student',
      'student_learning_space', 'student_profile', 'student_survey', 'student_notification',
      // Shared
      'appointments', 'booking_scheduler',
    ],
    teacher: [
      // Teacher-specific
      'teacher_dashboard', 'teacher_class_management', 'teacher_grade_management',
      'teacher_grade_setting', 'teacher_prediction_view', 'teacher_progress_tracking',
      'teacher_reports_alerts', 'teacher_messages', 'teacher_appointments',
      'teacher_settings', 'teacher_meeting_demo', 'teacher_profile', 'teacher_notification',
      // Shared
      'appointments', 'booking_scheduler',
    ],
    parent: [
      // Parent-specific
      'parent_dashboard', 'parent_book_appointment', 'parent_student_details',
      'parent_chat', 'parent_profile',
      // Shared
      'appointments', 'booking_scheduler',
    ],
    leader: [
      // Leader has access to reports and analytics
      'admin_overview', 'admin_reports', 'admin_ai_insights',
      // Can also view student & teacher info
      'admin_students', 'admin_student_detail',
      'admin_teachers', 'admin_teacher_detail',
      // Shared
      'appointments',
    ],
  };

  // Create RolePermission entries
  let rolePermissionCount = 0;
  for (const role of allRoles) {
    for (const permission of allPermissions) {
      const enabledPermissions = rolePermissionMap[role.code] || [];
      const isEnabled = enabledPermissions.includes(permission.key);

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: { enabled: isEnabled },
        create: {
          roleId: role.id,
          permissionId: permission.id,
          enabled: isEnabled,
        },
      });
      
      if (isEnabled) {
        rolePermissionCount++;
        console.log(` Enabled: ${role.code} → ${permission.key}`);
      }
    }
  }

  console.log(`\n Created ${rolePermissionCount} enabled role-permission mappings!`);

  // Seed Course table
  console.log('\n Seeding Course table...');

  const csvData = `1,CHE 101,Hóa Học Đại Cương,1,LAB
2,CMU-SE 100,Introduction to Software Engineering,3,LEC
3,CS 201,Tin Học Ứng Dụng,2,LEC
4,CS 211,Lập Trình Cơ Sở,3,LEC
5,DTE-IS 102,Hướng Nghiệp 1,1,LEC
6,ES 221,Bóng Đá Sơ Cấp,1,DEM
7,IS-ENG 136,English for International School - Level 1,3,LEC
8,STA 151,Lý Thuyết Xác Suất & Thống Kê Toán,2,LEC
9,CMU-CS 246,Application Development Practices,3,LEC
10,CMU-CS 297,Đồ Án CDIO,1,DIS
11,CMU-CS 311,Object-Oriented Programming C++ (Advanced Concepts in Computing),3,LEC
12,CMU-ENG 130,Anh Văn Chuyên Ngành cho Sinh Viên CMU 1,2,LEC
13,COM 141,Nói & Trình Bày (tiếng Việt),1,LAB
14,IS-ENG 137,English for International School - Level 2,3,LEC
15,IS-ENG 186,English for International School - Level 3,3,LEC
16,MTH 254,Toán Rời Rạc & Ứng Dụng,2,LEC
17,CMU-CS 303,Fundamentals of Computing 1,2,LEC
18,CMU-IS 432,Software Project Management,3,LEC
19,CMU-SE 252,Computer Science for Practicing Engineers (Software Construction),3,LEC
20,COM 142,Viết (tiếng Việt),1,CON
21,IS 301,Cơ Sở Dữ Liệu,3,LEC
22,MTH 291,Toán Ứng Dụng cho Công Nghệ Thông Tin 1,3,LEC
23,PHI 150,Triết Học Marx - Lenin,3,LEC
24,CMU-CS 447,Đồ Án CDIO,1,PRJ
25,CMU-CS 462,Software Measurements & Analysis,3,LEC
26,CMU-ENG 230,Anh Văn Chuyên Ngành cho Sinh Viên CMU 2,2,LEC
27,CMU-SE 214,Requirements Engineering,3,LEC
28,CS 464,Lập Trình Ứng Dụng .NET,2,LEC
29,ES 101,Chạy Ngắn & Bài Thể Dục Tay Không,1,DEM
30,MTH 203,Toán Cao Cấp A3,3,LEC
31,MTH 204,Toán Cao Cấp A3 (LAB),1,LAB
32,MTH 341,Toán Ứng Dụng cho Công Nghệ Thông Tin 2,3,LEC
33,CMU-CS 316,Fundamentals of Computing 2,3,LEC
34,CMU-SE 403,Software Architecture & Design,3,LEC
35,CMU-SE 433,Software Process & Quality Management,3,LEC
36,CMU-SE 450,Capstone Project for Software Engineering 1,3,PRJ
37,ES 276,Cầu Lông Cao Cấp,1,DEM
38,IS 385,Kỹ Thuật Thương Mại Điện Tử,3,LEC
39,IS-ENG 187,English for International School - Level 4,3,LEC
40,IS-ENG 236,English for International School - Level 5,3,LEC
41,ES 100,Giáo Dục Quốc Phòng & An Ninh,3,LEC
42,CMU-IS 401,Information System Applications,3,LEC
43,CMU-SE 303,Software Testing (Verification & Validation),3,LEC
44,CS 466,Perl & Python,2,LEC
45,HIS 221,Lịch Sử Văn Minh Thế Giới 1,2,LEC
46,POS 361,Tư Tưởng Hồ Chí Minh,2,LEC
47,CHE 101,Hóa Học Đại Cương,2,LEC
48,CS 201,Tin Học Ứng Dụng,1,LAB
49,CS 211,Lập Trình Cơ Sở,1,LAB
50,STA 151,Lý Thuyết Xác Suất & Thống Kê Toán,1,REC
51,CMU-CS 311,Object-Oriented Programming C++ (Advanced Concepts in Computing),1,LAB
52,MTH 254,Toán Rời Rạc & Ứng Dụng,1,LAB
53,ES 100,Giáo Dục Quốc Phòng & An Ninh,5,DEM
54,CMU-CS 303,Fundamentals of Computing 1,1,LAB
55,CS 464,Lập Trình Ứng Dụng .NET,1,LAB
56,CMU-SE 403,Software Architecture & Design,1,LAB
57,IS-CS 101,Basic Computer Skills,2,LEC
58,IS-CS 101,Basic Computer Skills,1,LAB
59,IS-DTE 102,Career Orientation,1,LEC
60,IS-ECO 151,Introduction to Microeconomics,3,LEC
61,ES 226,Cầu Lông Sơ Cấp,1,DEM
62,PHI 100,Phương Pháp Luận (gồm Nghiên Cứu Khoa Học),2,LEC
63,CMU-CS 252,Introduction to Network & Telecommunications Technology,3,LEC
64,MTH 103,Toán Cao Cấp A1,2,LEC
65,MTH 103,Toán Cao Cấp A1,1,REC
66,CMU-CS 445,System Integration Practices,3,LEC
67,DTE-IS 152,Hướng Nghiệp 2,1,WOR
68,HIS 362,Lịch Sử Đảng Cộng Sản Việt Nam,2,LEC
69,LAW 201,Pháp Luật Đại Cương,2,LEC
70,POS 151,Kinh Tế Chính Trị Marx - Lenin,2,LEC
71,EVR 205,Sức Khỏe Môi Trường,2,LEC
72,HIS 222,Lịch Sử Văn Minh Thế Giới 2,2,LEC
73,POS 351,Chủ Nghĩa Xã Hội Khoa Học,2,LEC
74,PHY 101,Vật Lý Đại Cương 1,1,LAB
75,PHY 101,Vật Lý Đại Cương 1,2,LEC
76,MTH 104,Toán Cao Cấp A2,1,REC
77,MTH 104,Toán Cao Cấp A2,3,LEC`;

  const lines = csvData.trim().split('\n');
  const courses = lines.map(line => {
    const parts = line.split(',');
    const course_code = parts[1].trim();
    const course_name = parts[2].trim();
    const credits_unit = parseInt(parts[3].trim());
    const study_format = parts[4].trim();
    return {
      course_code,
      course_name,
      credits_unit,
      study_format: study_format || 'offline',
    };
  });

  // Use upsert for courses to avoid duplicates but still handle existing ones
  let courseCount = 0;
  for (const course of courses) {
    try {
      await prisma.course.upsert({
        where: { course_code_study_format: { course_code: course.course_code, study_format: course.study_format } },
        update: { course_name: course.course_name, credits_unit: course.credits_unit },
        create: course,
      });
      courseCount++;
    } catch (e) {
      // Handle potential constraint issues
      console.warn(` Could not upsert course ${course.course_code}: ${e.message}`);
    }
  }

  console.log(` Seeded ${courseCount} courses successfully!`);

  // Seed CurriculumCourse table for CNPMC program
  console.log('\n Seeding CurriculumCourse table for CNPMC...');

  // Debug: list all programs to find the correct code
  const allPrograms = await prisma.program.findMany({
    select: { program_id: true, program_code: true, program_name: true },
  });
  console.log(' Available programs:', allPrograms.map(p => p.program_code).join(', '));

  // Get CNPMC program (CMU Software Engineering standard program)
  const cnpmcProgram = await prisma.program.findUnique({
    where: { program_code: 'CNPMC' },
  });

  if (!cnpmcProgram) {
    console.warn(' CNPMC program not found. Available codes:', allPrograms.map(p => p.program_code));
  } else {
    console.log(` Found CNPMC program (id: ${cnpmcProgram.program_id})`);
    // Curriculum structure for CNPM program
    const curriculumData = [
      // Học Kỳ 1 - Năm 1
      { courseCode: 'CS 201', year: 1, term: 1 },
      { courseCode: 'CS 211', year: 1, term: 1 },
      { courseCode: 'CMU-SE 100', year: 1, term: 1 },
      { courseCode: 'DTE-IS 102', year: 1, term: 1 },
      { courseCode: 'IS-ENG 136', year: 1, term: 1 },

      // Học Kỳ 2 - Năm 1
      { courseCode: 'MTH 103', year: 1, term: 2 },
      { courseCode: 'CHE 101', year: 1, term: 2 },
      { courseCode: 'CMU-CS 311', year: 1, term: 2 },
      { courseCode: 'CMU-CS 252', year: 1, term: 2 },
      { courseCode: 'DTE-IS 152', year: 1, term: 2 },
      { courseCode: 'IS-ENG 137', year: 1, term: 2 },
      { courseCode: 'IS-ENG 186', year: 1, term: 2 },

      // Học Kỳ 1 - Năm 2
      { courseCode: 'PHI 100', year: 2, term: 1 },
      { courseCode: 'MTH 104', year: 2, term: 1 },
      { courseCode: 'CMU-CS 303', year: 2, term: 1 },
      { courseCode: 'CMU-SE 214', year: 2, term: 1 },
      { courseCode: 'COM 141', year: 2, term: 1 },
      { courseCode: 'IS-ENG 187', year: 2, term: 1 },
      { courseCode: 'IS-ENG 236', year: 2, term: 1 },

      // Học Kỳ 2 - Năm 2
      { courseCode: 'PHY 101', year: 2, term: 2 },
      { courseCode: 'EVR 205', year: 2, term: 2 },
      { courseCode: 'STA 151', year: 2, term: 2 },
      { courseCode: 'MTH 254', year: 2, term: 2 },
      { courseCode: 'CMU-CS 246', year: 2, term: 2 },
      { courseCode: 'CMU-CS 316', year: 2, term: 2 },
      { courseCode: 'CMU-CS 297', year: 2, term: 2 },
      { courseCode: 'CMU-ENG 130', year: 2, term: 2 },

      // Học Kỳ 1 - Năm 3
      { courseCode: 'IS 301', year: 3, term: 1 },
      { courseCode: 'CMU-SE 252', year: 3, term: 1 },
      { courseCode: 'CMU-IS 432', year: 3, term: 1 },
      { courseCode: 'CMU-SE 303', year: 3, term: 1 },
      { courseCode: 'MTH 291', year: 3, term: 1 },
      { courseCode: 'PHI 150', year: 3, term: 1 },
      { courseCode: 'COM 142', year: 3, term: 1 },

      // Học Kỳ 2 - Năm 3
      { courseCode: 'MTH 203', year: 3, term: 2 },
      { courseCode: 'CMU-CS 445', year: 3, term: 2 },
      { courseCode: 'CMU-CS 462', year: 3, term: 2 },
      { courseCode: 'CMU-CS 447', year: 3, term: 2 },
      { courseCode: 'CMU-ENG 230', year: 3, term: 2 },
      { courseCode: 'MTH 341', year: 3, term: 2 },
      { courseCode: 'MTH 204', year: 3, term: 2 },
      { courseCode: 'CS 464', year: 3, term: 2 },

      // Học Kỳ 1 - Năm 4
      { courseCode: 'LAW 201', year: 4, term: 1 },
      { courseCode: 'HIS 221', year: 4, term: 1 },
      { courseCode: 'CMU-SE 450', year: 4, term: 1 },
      { courseCode: 'CMU-SE 403', year: 4, term: 1 },
      { courseCode: 'CMU-IS 401', year: 4, term: 1 },
      { courseCode: 'CS 466', year: 4, term: 1 },
      { courseCode: 'POS 151', year: 4, term: 1 },

      // Học Kỳ 2 - Năm 4
      { courseCode: 'POS 361', year: 4, term: 2 },
      { courseCode: 'CMU-SE 451', year: 4, term: 2 },
      { courseCode: 'CMU-SE 433', year: 4, term: 2 },
      { courseCode: 'POS 351', year: 4, term: 2 },
      { courseCode: 'HIS 362', year: 4, term: 2 },
      { courseCode: 'IS 385', year: 4, term: 2 },
    ];

    let curriculumCount = 0;
    for (const item of curriculumData) {
      try {
        // Find ALL variants (LEC, LAB, etc.) of this course code
        const courseVariants = await prisma.course.findMany({
          where: { course_code: item.courseCode },
        });

        if (courseVariants.length === 0) {
          console.warn(` No course variants found for: ${item.courseCode}`);
          continue;
        }

        // Add all variants to curriculum
        for (const course of courseVariants) {
          await prisma.curriculumCourse.upsert({
            where: {
              program_id_course_id: {
                program_id: cnpmcProgram.program_id,
                course_id: course.course_id,
              },
            },
            update: {
              year_number: item.year,
              term_number: item.term,
              is_mandatory: true,
            },
            create: {
              program_id: cnpmcProgram.program_id,
              course_id: course.course_id,
              year_number: item.year,
              term_number: item.term,
              is_mandatory: true,
            },
          });

          curriculumCount++;
          console.log(` ${item.courseCode} (${course.study_format}) → Year ${item.year}, Term ${item.term}`);
        }
      } catch (e) {
        console.warn(` Error: ${item.courseCode} - ${e.message}`);
      }
    }

    console.log(`\n Seeded ${curriculumCount} curriculum course variants for CNPMC!`);
  }

  // Seed AcademicTerm table
  console.log('\n Seeding AcademicTerm table...');

  const academicTerms = [
    // 2021-2022
    { academic_year: '2021-2022', semester_number: 1, is_summer: false },
    { academic_year: '2021-2022', semester_number: 2, is_summer: false },
    { academic_year: '2021-2022', semester_number: 3, is_summer: true },

    // 2022-2023
    { academic_year: '2022-2023', semester_number: 1, is_summer: false },
    { academic_year: '2022-2023', semester_number: 2, is_summer: false },
    { academic_year: '2022-2023', semester_number: 3, is_summer: true },

    // 2023-2024
    { academic_year: '2023-2024', semester_number: 1, is_summer: false },
    { academic_year: '2023-2024', semester_number: 2, is_summer: false },
    { academic_year: '2023-2024', semester_number: 3, is_summer: true },

    // 2024-2025
    { academic_year: '2024-2025', semester_number: 1, is_summer: false },
    { academic_year: '2024-2025', semester_number: 2, is_summer: false },
    { academic_year: '2024-2025', semester_number: 3, is_summer: true },

    // 2025-2026
    { academic_year: '2025-2026', semester_number: 1, is_summer: false },
    { academic_year: '2025-2026', semester_number: 2, is_summer: false },
    { academic_year: '2025-2026', semester_number: 3, is_summer: true },
  ];

  let termCount = 0;
  for (const term of academicTerms) {
    try {
      await prisma.academicTerm.upsert({
        where: { academic_year_semester_number: { academic_year: term.academic_year, semester_number: term.semester_number } },
        update: { is_summer: term.is_summer, status: 'active' },
        create: {
          academic_year: term.academic_year,
          semester_number: term.semester_number,
          is_summer: term.is_summer,
          status: 'active',
        },
      });
      const termType = term.is_summer ? 'Summer' : (term.semester_number === 1 ? 'Fall' : 'Spring');
      console.log(` ${term.academic_year} - Semester ${term.semester_number} (${termType})`);
      termCount++;
    } catch (e) {
      console.warn(` Error: ${term.academic_year} Semester ${term.semester_number} - ${e.message}`);
    }
  }

  console.log(`\n Seeded ${termCount} academic terms!`);

  // Seed Account and Profile tables
  console.log('\n Seeding Account and Profile tables...');

  // Vietnamese male names - expanded list to minimize duplicates
  const vietnameseMaleNames = [
    'Nguyễn Văn An', 'Trần Văn Bình', 'Phạm Văn Cường', 'Hoàng Văn Đạo', 'Đỗ Văn Ẩn',
    'Vũ Văn Hùng', 'Lê Văn Kiên', 'Trương Văn Lợi', 'Bùi Văn Minh', 'Đặng Văn Nam',
    'Ngô Văn Phát', 'Phan Văn Quân', 'Huỳnh Văn Rung', 'Võ Văn Sáng', 'Tạ Văn Thắng',
    'Hà Văn Ưu', 'Dương Văn Việt', 'Cao Văn Xuyên', 'Lý Văn Yên', 'Trần Văn Zoro',
    'Nguyễn Minh Toàn', 'Trần Hải Đức', 'Phạm Quốc Huy', 'Hoàng Kiến Hùng', 'Đỗ Thanh Hòa',
    'Vũ Quang Hải', 'Lê Trọng Hoàng', 'Trương Xuân Hồng', 'Bùi Tú Hơn', 'Đặng Khắc Hội',
    'Ngô Thế Hải', 'Phan Thành Hoa', 'Huỳnh Văn Hiến', 'Võ Thanh Hòa', 'Tạ Xuân Hằng',
    'Hà Duy Hoa', 'Dương Xuân Hòa', 'Cao Kiến Hưng', 'Lý Thanh Hùng', 'Trần Quốc Hiệu',
    'Nguyễn Đức Anh', 'Trần Mạnh Bảo', 'Phạm Văn Chương', 'Hoàng Gia Dũng', 'Đỗ Thái Đông',
    'Vũ Hữu Gia', 'Lê Đức Giang', 'Trương Minh Giao', 'Bùi Nhật Gia', 'Đặng Thắng Giáp',
    'Nguyễn Hữu Chiến', 'Trần Tuấn Anh', 'Phạm Thái Bình', 'Hoàng Hải Đông', 'Đỗ Hồng Ân',
    'Vũ Trung Hiếu', 'Lê Vĩ Hồng', 'Trương Bảo Hùng', 'Bùi Công Hơn', 'Đặng Tiến Hợp',
    'Ngô Hữu Hùng', 'Phan Hoàng Hà', 'Huỳnh Chí Hoàng', 'Võ Công Huyền', 'Tạ Duy Huy',
    'Hà Anh Hiếu', 'Dương Bình Hóa', 'Cao Vinh Hợp', 'Lý Hoàng Hùng', 'Trần Xuân Hạo',
    'Nguyễn Khánh Anh', 'Trần Linh Bảo', 'Phạm Ngân Cảnh', 'Hoàng Đạt Động', 'Đỗ Gia Ân',
    'Vũ Khoa Hà', 'Lê Khôi Giang', 'Trương Khoa Ghi', 'Bùi Kiên Giao', 'Đặng Kỳ Giai',
    'Ngô Kiên Hạn', 'Phan Kông Hà', 'Huỳnh Khánh Hàng', 'Võ Khải Hảo', 'Tạ Khang Hấp',
    'Hà Bảo Hiển', 'Dương Bách Hoàn', 'Cao Bằng Hợi', 'Lý Bát Hùng', 'Trần Bảy Hạ',
    'Nguyễn Long Anh', 'Trần Lương Bác', 'Phạm Lực Câu', 'Hoàng Lưu Đắc', 'Đỗ Lứa Ấn',
    'Vũ Liêm Hanh', 'Lê Liễu Ghi', 'Trương Liên Giáp', 'Bùi Lộc Giao', 'Đặng Lợi Giải',
    'Ngô Lý Hàng', 'Phan Lâm Hà', 'Huỳnh Lê Hàm', 'Võ Lực Hài', 'Tạ Lơi Hại',
    'Hà Loa Hiêu', 'Dương Lư Hòa', 'Cao Lỗ Hớn', 'Lý Lọc Hùng', 'Trần Lơn Hảy',
    'Nguyễn Mạnh Anh', 'Trần Minh Bảo', 'Phạm Mộ Cám', 'Hoàng Mục Đâm', 'Đỗ Mỹ Ái',
    'Vũ Mạc Hai', 'Lê Mên Ghi', 'Trương Mật Giả', 'Bùi Mắm Giao', 'Đặng Mắt Giai',
    'Ngô Mặc Hàng', 'Phan Mặn Hà', 'Huỳnh Mành Hàng', 'Võ Mặng Hải', 'Tạ Mặp Hại',
    'Hà Mặu Hiểu', 'Dương Mắy Hoà', 'Cao Mắz Hơi', 'Lý Máy Hùng', 'Trần Máy Hạm',
    'Nguyễn Nô Anh', 'Trần Nội Bạc', 'Phạm Nũng Cấm', 'Hoàng Nẩm Đấm', 'Đỗ Nấc Ắm',
    'Vũ Nặn Hà', 'Lê Nấu Ghi', 'Trương Nấm Gía', 'Bùi Nấy Giao', 'Đặng Nấz Giai',
    'Ngô Nên Hàn', 'Phan Nép Hà', 'Huỳnh Nết Hàn', 'Võ Nều Hải', 'Tạ Nếu Hại',
    'Hà Nếy Hiêu', 'Dương Nếz Hòa', 'Cao Ni Hơi', 'Lý Nì Hùng', 'Trần Níi Hạm',
    'Nguyễn Oân Anh', 'Trần Ôi Bạp', 'Phạm Ôn Cân', 'Hoàng Ông Đân', 'Đỗ Ôp Ân',
    'Vũ Ơi Hà', 'Lê Ơn Ghi', 'Trương Ơp Gía', 'Bùi Ơ Giao', 'Đặng Ơ Giai',
    'Ngô Ơi Hàn', 'Phan Ơn Hà', 'Huỳnh Ơp Hàn', 'Võ Ơ Hải', 'Tạ Ơ Hại',
    'Hà Ơi Hiêu', 'Dương Ơn Hòa', 'Cao Ơp Hơi', 'Lý Ơ Hùng', 'Trần Ơ Hạm',
    'Nguyễn Pháp Anh', 'Trần Phải Bạn', 'Phạm Phân Cân', 'Hoàng Phát Đận', 'Đỗ Phát Ân',
    'Vũ Phét Hà', 'Lê Phổ Ghi', 'Trương Phúc Gía', 'Bùi Phù Giao', 'Đặng Phủ Giai',
    'Ngô Phụi Hàn', 'Phan Phụ Hà', 'Huỳnh Phực Hàn', 'Võ Phứ Hải', 'Tạ Phự Hại',
    'Hà Phố Hiêu', 'Dương Phớ Hòa', 'Cao Phớp Hơi', 'Lý Phớu Hùng', 'Trần Phớy Hạm',
    'Nguyễn Quân Anh', 'Trần Quảng Bạo', 'Phạm Quạng Cạo', 'Hoàng Quầng Đạo', 'Đỗ Quặng Ạo',
    'Vũ Quên Hạ', 'Lê Quết Ghi', 'Trương Quễ Gía', 'Bùi Quễng Giao', 'Đặng Quễn Giai',
    'Ngô Quễu Hàn', 'Phan Quễy Hà', 'Huỳnh Quễz Hàn', 'Võ Quì Hải', 'Tạ Quìn Hại',
    'Hà Quìu Hiêu', 'Dương Quìy Hòa', 'Cao Quìz Hơi', 'Lý Quím Hùng', 'Trần Quín Hạm',
  ];

  // Vietnamese female names - expanded list to minimize duplicates
  const vietnameseFemaleNames = [
    'Nguyễn Thị Mỹ', 'Trần Thị Hoa', 'Phạm Thị Hương', 'Hoàng Thị Hậu', 'Đỗ Thị Hiền',
    'Vũ Thị Huế', 'Lê Thị Hương', 'Trương Thị Hương', 'Bùi Thị Hồng', 'Đặng Thị Hiệp',
    'Ngô Thị Hạnh', 'Phan Thị Hương', 'Huỳnh Thị Hằng', 'Võ Thị Hiền', 'Tạ Thị Hương',
    'Hà Thị Hằng', 'Dương Thị Huệ', 'Cao Thị Hoa', 'Lý Thị Hương', 'Trần Thị Liên',
    'Nguyễn Cẩm Tú', 'Trần Hải Yến', 'Phạm Quỳnh Nhi', 'Hoàng Nhật Hà', 'Đỗ Thảo Nhi',
    'Vũ Tiên Nữ', 'Lê Quỳnh Nhi', 'Trương Kiều Nhi', 'Bùi Ánh Nguyệt', 'Đặng Thảo Nhi',
    'Ngô Mỹ Nhi', 'Phan Quỳnh Nhi', 'Huỳnh Kiều Nhi', 'Võ Thanh Nhi', 'Tạ Quỳnh Nhi',
    'Hà Kiều Nhi', 'Dương Thảo Nhi', 'Cao Mỹ Nhi', 'Lý Quỳnh Nhi', 'Trần Thảo Nhi',
    'Nguyễn Hoài Thu', 'Trần Bích Nhi', 'Phạm Bảo Nhi', 'Hoàng Cẩm Nhi', 'Đỗ Diễm Nhi',
    'Vũ Gia Nhi', 'Lê Huyền Nhi', 'Trương Hương Nhi', 'Bùi Khánh Nhi', 'Đặng Linh Nhi',
    'Nguyễn Anh Tú', 'Trần Bảo Anh', 'Phạm Cẩm Anh', 'Hoàng Diễm Anh', 'Đỗ Gia Anh',
    'Vũ Hải Anh', 'Lê Hương Anh', 'Trương Huyền Anh', 'Bùi Khánh Anh', 'Đặng Linh Anh',
    'Ngô Mỹ Anh', 'Phan Quỳnh Anh', 'Huỳnh Kiều Anh', 'Võ Thanh Anh', 'Tạ Quỳnh Anh',
    'Hà Kiều Anh', 'Dương Thảo Anh', 'Cao Mỹ Anh', 'Lý Quỳnh Anh', 'Trần Thảo Anh',
    'Nguyễn Hoài Tâm', 'Trần Bích Tâm', 'Phạm Bảo Tâm', 'Hoàng Cẩm Tâm', 'Đỗ Diễm Tâm',
    'Vũ Gia Tâm', 'Lê Huyền Tâm', 'Trương Hương Tâm', 'Bùi Khánh Tâm', 'Đặng Linh Tâm',
    'Ngô Mỹ Tâm', 'Phan Quỳnh Tâm', 'Huỳnh Kiều Tâm', 'Võ Thanh Tâm', 'Tạ Quỳnh Tâm',
    'Hà Kiều Tâm', 'Dương Thảo Tâm', 'Cao Mỹ Tâm', 'Lý Quỳnh Tâm', 'Trần Thảo Tâm',
    'Nguyễn Anh Đào', 'Trần Bảo Đào', 'Phạm Cẩm Đào', 'Hoàng Diễm Đào', 'Đỗ Gia Đào',
    'Vũ Hải Đào', 'Lê Hương Đào', 'Trương Huyền Đào', 'Bùi Khánh Đào', 'Đặng Linh Đào',
    'Ngô Mỹ Đào', 'Phan Quỳnh Đào', 'Huỳnh Kiều Đào', 'Võ Thanh Đào', 'Tạ Quỳnh Đào',
    'Hà Kiều Đào', 'Dương Thảo Đào', 'Cao Mỹ Đào', 'Lý Quỳnh Đào', 'Trần Thảo Đào',
    'Nguyễn Anh Dương', 'Trần Bảo Dương', 'Phạm Cẩm Dương', 'Hoàng Diễm Dương', 'Đỗ Gia Dương',
    'Vũ Hải Dương', 'Lê Hương Dương', 'Trương Huyền Dương', 'Bùi Khánh Dương', 'Đặng Linh Dương',
    'Ngô Mỹ Dương', 'Phan Quỳnh Dương', 'Huỳnh Kiều Dương', 'Võ Thanh Dương', 'Tạ Quỳnh Dương',
    'Hà Kiều Dương', 'Dương Thảo Dương', 'Cao Mỹ Dương', 'Lý Quỳnh Dương', 'Trần Thảo Dương',
    'Nguyễn Anh Giang', 'Trần Bảo Giang', 'Phạm Cẩm Giang', 'Hoàng Diễm Giang', 'Đỗ Gia Giang',
    'Vũ Hải Giang', 'Lê Hương Giang', 'Trương Huyền Giang', 'Bùi Khánh Giang', 'Đặng Linh Giang',
    'Ngô Mỹ Giang', 'Phan Quỳnh Giang', 'Huỳnh Kiều Giang', 'Võ Thanh Giang', 'Tạ Quỳnh Giang',
    'Hà Kiều Giang', 'Dương Thảo Giang', 'Cao Mỹ Giang', 'Lý Quỳnh Giang', 'Trần Thảo Giang',
    'Nguyễn Anh Hà', 'Trần Bảo Hà', 'Phạm Cẩm Hà', 'Hoàng Diễm Hà', 'Đỗ Gia Hà',
    'Vũ Hải Hà', 'Lê Hương Hà', 'Trương Huyền Hà', 'Bùi Khánh Hà', 'Đặng Linh Hà',
    'Ngô Mỹ Hà', 'Phan Quỳnh Hà', 'Huỳnh Kiều Hà', 'Võ Thanh Hà', 'Tạ Quỳnh Hà',
    'Hà Kiều Hà', 'Dương Thảo Hà', 'Cao Mỹ Hà', 'Lý Quỳnh Hà', 'Trần Thảo Hà',
    'Nguyễn Anh Hạ', 'Trần Bảo Hạ', 'Phạm Cẩm Hạ', 'Hoàng Diễm Hạ', 'Đỗ Gia Hạ',
    'Vũ Hải Hạ', 'Lê Hương Hạ', 'Trương Huyền Hạ', 'Bùi Khánh Hạ', 'Đặng Linh Hạ',
    'Ngô Mỹ Hạ', 'Phan Quỳnh Hạ', 'Huỳnh Kiều Hạ', 'Võ Thanh Hạ', 'Tạ Quỳnh Hạ',
    'Hà Kiều Hạ', 'Dương Thảo Hạ', 'Cao Mỹ Hạ', 'Lý Quỳnh Hạ', 'Trần Thảo Hạ',
    'Nguyễn Anh Hậu', 'Trần Bảo Hậu', 'Phạm Cẩm Hậu', 'Hoàng Diễm Hậu', 'Đỗ Gia Hậu',
    'Vũ Hải Hậu', 'Lê Hương Hậu', 'Trương Huyền Hậu', 'Bùi Khánh Hậu', 'Đặng Linh Hậu',
    'Ngô Mỹ Hậu', 'Phan Quỳnh Hậu', 'Huỳnh Kiều Hậu', 'Võ Thanh Hậu', 'Tạ Quỳnh Hậu',
    'Hà Kiều Hậu', 'Dương Thảo Hậu', 'Cao Mỹ Hậu', 'Lý Quỳnh Hậu', 'Trần Thảo Hậu',
    'Nguyễn Anh Hệ', 'Trần Bảo Hệ', 'Phạm Cẩm Hệ', 'Hoàng Diễm Hệ', 'Đỗ Gia Hệ',
    'Vũ Hải Hệ', 'Lê Hương Hệ', 'Trương Huyền Hệ', 'Bùi Khánh Hệ', 'Đặng Linh Hệ',
    'Ngô Mỹ Hệ', 'Phan Quỳnh Hệ', 'Huỳnh Kiều Hệ', 'Võ Thanh Hệ', 'Tạ Quỳnh Hệ',
    'Hà Kiều Hệ', 'Dương Thảo Hệ', 'Cao Mỹ Hệ', 'Lý Quỳnh Hệ', 'Trần Thảo Hệ',
    'Nguyễn Anh Hòa', 'Trần Bảo Hòa', 'Phạm Cẩm Hòa', 'Hoàng Diễm Hòa', 'Đỗ Gia Hòa',
    'Vũ Hải Hòa', 'Lê Hương Hòa', 'Trương Huyền Hòa', 'Bùi Khánh Hòa', 'Đặng Linh Hòa',
    'Ngô Mỹ Hòa', 'Phan Quỳnh Hòa', 'Huỳnh Kiều Hòa', 'Võ Thanh Hòa', 'Tạ Quỳnh Hòa',
    'Hà Kiều Hòa', 'Dương Thảo Hòa', 'Cao Mỹ Hòa', 'Lý Quỳnh Hòa', 'Trần Thảo Hòa',
    'Nguyễn Anh Hoài', 'Trần Bảo Hoài', 'Phạm Cẩm Hoài', 'Hoàng Diễm Hoài', 'Đỗ Gia Hoài',
    'Vũ Hải Hoài', 'Lê Hương Hoài', 'Trương Huyền Hoài', 'Bùi Khánh Hoài', 'Đặng Linh Hoài',
  ];

  const passwordHash = '$2a$10$OSWizRYWcoX94zZiY0vaxuen2oT9bnGHnHOBZj17f6S/HZ5h.Y4LW'; // '123456'

  // Get roles
  const adminRole = await prisma.role.findFirst({ where: { code: 'admin' } });
  const leaderRole = await prisma.role.findFirst({ where: { code: 'leader' } });
  const teacherRole = await prisma.role.findFirst({ where: { code: 'teacher' } });
  const studentRole = await prisma.role.findFirst({ where: { code: 'student' } });
  const parentRole = await prisma.role.findFirst({ where: { code: 'parent' } });

  let accountCount = 0;
  let profileCount = 0;

  // Helper function to shuffle array
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  // Create 1 Admin account (no profile)
  console.log('\n Creating Admin accounts...');
  const adminAccount = await prisma.account.upsert({
    where: { email: 'admin@dtu.edu.vn' },
    update: { status: 'active' },
    create: {
      email: 'admin@dtu.edu.vn',
      password_hash: passwordHash,
      role_id: adminRole?.id,
      status: 'active',
    },
  });
  accountCount++;
  console.log(` Admin: admin@dtu.edu.vn`);

  // Create 3 Leader accounts (no profiles)
  console.log('\n Creating Leader accounts...');
  const leaderNames = shuffle([...vietnameseMaleNames.slice(0, 10)]);
  for (let i = 0; i < 3; i++) {
    const email = `leader${i + 1}@dtu.edu.vn`;
    await prisma.account.upsert({
      where: { email },
      update: { status: 'active' },
      create: {
        email,
        password_hash: passwordHash,
        role_id: leaderRole?.id,
        status: 'active',
      },
    });
    accountCount++;
    console.log(` Leader ${i + 1}: ${email}`);
  }

  // Create 15 Teacher accounts + profiles
  console.log('\n Creating Teacher accounts and profiles...');
  const teacherNames = shuffle([...vietnameseMaleNames.slice(10, 35)]);
  for (let i = 0; i < 15; i++) {
    const email = `teacher${i + 1}@dtu.edu.vn`;
    const account = await prisma.account.upsert({
      where: { email },
      update: { status: 'active' },
      create: {
        email,
        password_hash: passwordHash,
        role_id: teacherRole?.id,
        status: 'active',
      },
    });

    // Create profile for teacher
    await prisma.profile.upsert({
      where: { account_id: account.account_id },
      update: { full_name: teacherNames[i] },
      create: {
        account_id: account.account_id,
        full_name: teacherNames[i],
        phone_number: `039${String(i + 1).padStart(7, '0')}`,
        gender: 'Nam',
      },
    });

    accountCount++;
    profileCount++;
    console.log(` Teacher ${i + 1}: ${email} - ${teacherNames[i]}`);
  }

  // Create 1000 Student accounts + profiles
  console.log('\n Creating Student accounts and profiles...');
  const studentNamesMale = shuffle([...vietnameseMaleNames]);
  const studentNamesFemale = shuffle([...vietnameseFemaleNames]);
  
  for (let i = 0; i < 1000; i++) {
    const email = `student${i + 1}@dtu.edu.vn`;
    const isMale = i % 2 === 0;
    const fullName = isMale ? studentNamesMale[i % studentNamesMale.length] : studentNamesFemale[i % studentNamesFemale.length];
    const gender = isMale ? 'Nam' : 'Nữ';

    const account = await prisma.account.upsert({
      where: { email },
      update: { status: 'active' },
      create: {
        email,
        password_hash: passwordHash,
        role_id: studentRole?.id,
        status: 'active',
      },
    });

    // Create profile for student
    await prisma.profile.upsert({
      where: { account_id: account.account_id },
      update: { full_name: fullName },
      create: {
        account_id: account.account_id,
        full_name: fullName,
        phone_number: `090${String(i + 1).padStart(7, '0')}`,
        gender,
      },
    });

    accountCount++;
    profileCount++;

    if ((i + 1) % 100 === 0) {
      console.log(` Created ${i + 1} students...`);
    }
  }

  // Create 1000 Parent accounts + profiles
  console.log('\n Creating Parent accounts and profiles...');
  const parentNamesMale = shuffle([...vietnameseMaleNames]);
  const parentNamesFemale = shuffle([...vietnameseFemaleNames]);
  
  for (let i = 0; i < 1000; i++) {
    const email = `parent${i + 1}@gmail.com`;
    const isMale = i % 2 === 0;
    const fullName = isMale ? parentNamesMale[i % parentNamesMale.length] : parentNamesFemale[i % parentNamesFemale.length];
    const gender = isMale ? 'Nam' : 'Nữ';

    const account = await prisma.account.upsert({
      where: { email },
      update: { status: 'active' },
      create: {
        email,
        password_hash: passwordHash,
        role_id: parentRole?.id,
        status: 'active',
      },
    });

    // Create profile for parent
    await prisma.profile.upsert({
      where: { account_id: account.account_id },
      update: { full_name: fullName },
      create: {
        account_id: account.account_id,
        full_name: fullName,
        phone_number: `087${String(i + 1).padStart(7, '0')}`,
        gender,
      },
    });

    accountCount++;
    profileCount++;

    if ((i + 1) % 100 === 0) {
      console.log(` Created ${i + 1} parents...`);
    }
  }

  console.log(`\n Seeded ${accountCount} accounts and ${profileCount} profiles!`);

  // Seed ClassGroup table for CNPMC program
  console.log('\n Seeding ClassGroup table for CNPMC...');

  if (!cnpmcProgram) {
    console.warn(' CNPMC program not found');
  } else {
    // Class structure: K27-K31 with TPM1-TPM11
    // K27 → 2021, K28 → 2022, K29 → 2023, K30 → 2024, K31 → 2025
    const classGroups = [];
    
    for (let kYear = 27; kYear <= 31; kYear++) {
      const cohortYear = 2021 + (kYear - 27);
      const kCode = `K${kYear}`;
      
      for (let tpmNum = 1; tpmNum <= 11; tpmNum++) {
        classGroups.push({
          class_code: `${kCode} CMU-TPM${tpmNum}`,
          cohort_year: cohortYear,
          program_id: cnpmcProgram.program_id,
        });
      }
    }

    let classCount = 0;
    for (const classGroup of classGroups) {
      try {
        await prisma.classGroup.upsert({
          where: { class_code: classGroup.class_code },
          update: { cohort_year: classGroup.cohort_year, status: 'active' },
          create: {
            class_code: classGroup.class_code,
            program_id: classGroup.program_id,
            cohort_year: classGroup.cohort_year,
            status: 'active',
          },
        });
        classCount++;
        console.log(` ${classGroup.class_code} (Cohort: ${classGroup.cohort_year})`);
      } catch (e) {
        console.warn(` Error: ${classGroup.class_code} - ${e.message}`);
      }
    }

    console.log(`\n Seeded ${classCount} class groups for CNPMC!`);
  }

  // Seed Student, Parent, and Instructor tables
  console.log('\n Seeding Student table...');

  // Get all student accounts
  const studentAccounts = await prisma.account.findMany({
    where: { email: { contains: '@dtu.edu.vn', startsWith: 'student' } },
    select: { account_id: true, email: true },
    orderBy: { account_id: 'asc' },
  });

  // Get CNPMC program for major
  const cnpmcProgramForStudent = await prisma.program.findUnique({
    where: { program_code: 'CNPMC' },
  });

  // Get all ClassGroups for CNPMC program
  const classGroups = await prisma.classGroup.findMany({
    where: { program_id: cnpmcProgramForStudent?.program_id },
    orderBy: { class_code: 'asc' },
  });

  console.log(` Found ${classGroups.length} class groups for CNPMC program`);

  // Organize classes by cohort year
  const classesByYear = {};
  classGroups.forEach(classGroup => {
    // Extract year from class code: K27 CMU-TPM1 → 2021
    const yearMatch = classGroup.class_code.match(/K(\d+)/);
    if (yearMatch) {
      const cohortCode = parseInt(yearMatch[1]);
      const cohortYear = 1994 + cohortCode; // K27 = 1994 + 27 = 2021, K28 = 2022, etc.
      if (!classesByYear[cohortYear]) {
        classesByYear[cohortYear] = [];
      }
      classesByYear[cohortYear].push(classGroup);
    }
  });

  console.log(` Classes by cohort year:`, Object.keys(classesByYear).map(year => `${year}: ${classesByYear[year].length} classes`).join(', '));

  // Group students by cohort year (K27-K31: 2021-2025)
  // Distribute 1000 students across 5 cohorts (200 per cohort)
  const cohortYears = [2021, 2022, 2023, 2024, 2025]; // K27, K28, K29, K30, K31
  const cohortCounters = {}; // Track sequence number per cohort
  const cohortClassCounters = {}; // Track which class in each cohort for distribution
  cohortYears.forEach(year => {
    cohortCounters[year] = 0;
    cohortClassCounters[year] = 0;
  });

  let studentCount = 0;
  for (let i = 0; i < studentAccounts.length; i++) {
    const account = studentAccounts[i];
    
    // Assign cohort year: 200 students per cohort
    const cohortIndex = Math.floor(i / 200) % cohortYears.length;
    const cohortYear = cohortYears[cohortIndex];
    const cohortCode = cohortYear - 1994; // 2021-1994=27, 2022-1994=28, etc.
    
    // Increment sequence for this cohort
    cohortCounters[cohortYear]++;
    const sequenceNum = String(cohortCounters[cohortYear]).padStart(6, '0');
    
    // Student code format: {cohort_2_digits}{sequence_6_digits} (e.g., 27000001, 28000001)
    const studentCode = `${cohortCode}${sequenceNum}`;

    // Assign to class from same cohort year
    let classId = null;
    const classesForCohort = classesByYear[cohortYear] || [];
    if (classesForCohort.length > 0) {
      const classIndex = cohortClassCounters[cohortYear] % classesForCohort.length;
      classId = classesForCohort[classIndex].class_id;
      cohortClassCounters[cohortYear]++;
    }

    try {
      await prisma.student.upsert({
        where: { account_id: account.account_id },
        update: {
          student_code: studentCode,
          major: 'Công nghệ Phần mềm chuẩn CMU',
          cohort_year: cohortYear,
          class_id: classId,
          status: 'active',
        },
        create: {
          account_id: account.account_id,
          student_code: studentCode,
          major: 'Công nghệ Phần mềm chuẩn CMU',
          cohort_year: cohortYear,
          class_id: classId,
          status: 'active',
        },
      });
      studentCount++;
      if ((i + 1) % 100 === 0) {
        console.log(` Created ${i + 1} students...`);
      }
    } catch (e) {
      console.warn(` Error creating student for ${account.email}: ${e.message}`);
    }
  }
  console.log(` Seeded ${studentCount} students!`);

  // Seed Parent table
  console.log('\n Seeding Parent table...');

  const parentRelationships = ['Cha', 'Mẹ', 'Ông', 'Bà', 'Chú', 'Cô', 'Dì', 'Mợ'];
  const parentOccupations = [
    'Kỹ sư', 'Bác sĩ', 'Giáo viên', 'Luật sư', 'Kế toán', 'Công nhân',
    'Nông dân', 'Thương nhân', 'Doanh nhân', 'Công chức', 'Nhân viên văn phòng',
    'Lái xe', 'Thợ xây', 'Cơ khí', 'Điện lực', 'Y tá', 'Nhà báo', 'Ca sĩ',
  ];

  // Get all parent accounts
  const parentAccounts = await prisma.account.findMany({
    where: { email: { contains: '@gmail.com', startsWith: 'parent' } },
    select: { account_id: true, email: true },
  });

  let parentCount = 0;
  for (let i = 0; i < parentAccounts.length; i++) {
    const account = parentAccounts[i];
    const relationshipType = parentRelationships[i % parentRelationships.length];
    const occupation = parentOccupations[i % parentOccupations.length];
    const workplace = ['Công ty A', 'Công ty B', 'Công ty C', 'Trường ĐH', 'Bệnh viện', 'Văn phòng'][i % 6];

    try {
      await prisma.parent.upsert({
        where: { account_id: account.account_id },
        update: {
          relationship_type: relationshipType,
          occupation,
          workplace,
        },
        create: {
          account_id: account.account_id,
          relationship_type: relationshipType,
          occupation,
          workplace,
        },
      });
      parentCount++;
      if ((i + 1) % 100 === 0) {
        console.log(` Created ${i + 1} parents...`);
      }
    } catch (e) {
      console.warn(` Error creating parent for ${account.email}: ${e.message}`);
    }
  }
  console.log(` Seeded ${parentCount} parents!`);

  // Seed Instructor table
  console.log('\n Seeding Instructor table...');

  const academicTitles = ['Tiến sĩ', 'Thạc sĩ', 'Cử nhân', 'Phó giáo sư', 'Giáo sư', 'Thầy giáo'];
  const positions = [
    null, // Some instructors don't have positions
    'Trưởng khoa', 'Phó khoa', 'Trưởng bộ môn', 'Phó bộ môn', 'Trưởng tiểu ban',
    'Phó phòng', 'Chủ tịch hội đồng', 'Phó chủ tịch', 'Thủ quỹ', 'Thư ký',
  ];

  // Get SCS department for teachers
  const scsDepart = await prisma.department.findFirst({
    where: { code: 'IS' },
  });

  // Get all teacher accounts
  const teacherAccounts = await prisma.account.findMany({
    where: { email: { contains: '@dtu.edu.vn', startsWith: 'teacher' } },
    select: { account_id: true, email: true },
  });

  let instructorCount = 0;
  for (let i = 0; i < teacherAccounts.length; i++) {
    const account = teacherAccounts[i];
    const employeeCode = `EMP${String(i + 1).padStart(5, '0')}`; // EMP00001, EMP00002, etc.
    const academicTitle = academicTitles[i % academicTitles.length];
    const position = positions[i % positions.length];

    try {
      // Check if instructor already exists
      const existingInstructor = await prisma.instructor.findFirst({
        where: { account_id: account.account_id },
      });

      if (existingInstructor) {
        // Update existing instructor (don't change employee_code as it's unique)
        await prisma.instructor.update({
          where: { instructor_id: existingInstructor.instructor_id },
          data: {
            academic_title: academicTitle,
            position,
            department_id: scsDepart?.department_id,
            status: 'active',
          },
        });
      } else {
        // Create new instructor
        await prisma.instructor.create({
          data: {
            account_id: account.account_id,
            employee_code: employeeCode,
            academic_title: academicTitle,
            position,
            department_id: scsDepart?.department_id,
            status: 'active',
          },
        });
      }
      instructorCount++;
      console.log(` Teacher ${i + 1}: ${academicTitle}${position ? ` - ${position}` : ''}`);
    } catch (e) {
      console.warn(` Error creating instructor for ${account.email}: ${e.message}`);
    }
  }
  console.log(` Seeded ${instructorCount} instructors!`);

  // ====================================================================
  // 14. Seed ParentStudentLink (1:1 mapping)
  // ====================================================================
  console.log('\n Seeding ParentStudentLink...');
  
  // Get all parents and students ordered by account_id
  const allParents = await prisma.parent.findMany({
    orderBy: { account_id: 'asc' }
  });
  
  const allStudents = await prisma.student.findMany({
    orderBy: { account_id: 'asc' }
  });
  
  console.log(`Found ${allParents.length} parents and ${allStudents.length} students`);
  
  let linkCount = 0;
  const minLength = Math.min(allParents.length, allStudents.length);
  
  for (let i = 0; i < minLength; i++) {
    try {
      await prisma.parentStudentLink.upsert({
        where: {
          parent_id_student_id: {
            parent_id: allParents[i].parent_id,
            student_id: allStudents[i].student_id,
          },
        },
        update: {},
        create: {
          parent_id: allParents[i].parent_id,
          student_id: allStudents[i].student_id,
        },
      });
      linkCount++;
      
      if ((i + 1) % 100 === 0) {
        console.log(` Linked ${i + 1} parent-student pairs`);
      }
    } catch (e) {
      console.warn(` Error linking parent ${allParents[i].parent_id} to student ${allStudents[i].student_id}: ${e.message}`);
    }
  }
  console.log(` Seeded ${linkCount} ParentStudentLinks!`);

  // ====================================================================
  // 15. Seed AdviserAssignment (Instructors to Classes with dates)
  // ====================================================================
  console.log('\n Seeding AdviserAssignment...');
  
  // Get all instructors and CNPMC classes
  const allInstructors = await prisma.instructor.findMany({
    orderBy: { instructor_id: 'asc' }
  });
  
  const cnpmcClasses = await prisma.classGroup.findMany({
    where: { program_id: cnpmcProgram.program_id },
    orderBy: { class_code: 'asc' }
  });
  
  console.log(`Assigning ${allInstructors.length} instructors to ${cnpmcClasses.length} CNPMC classes`);
  
  // Shuffle instructors for random distribution
  const shuffledInstructors = [...allInstructors].sort(() => Math.random() - 0.5);
  
  let assignmentCount = 0;
  for (let i = 0; i < cnpmcClasses.length; i++) {
    const classGroup = cnpmcClasses[i];
    const instructor = shuffledInstructors[i % shuffledInstructors.length]; // Round-robin
    
    // Calculate dates based on cohort_year
    const cohortYear = classGroup.cohort_year;
    const assignedDate = new Date(cohortYear, 9, 1); // October 1st (month index 9)
    const endedDate = new Date(cohortYear + 4, 9, 1); // 4 years later
    
    try {
      await prisma.adviserAssignment.upsert({
        where: {
          class_id_instructor_id: {
            class_id: classGroup.class_id,
            instructor_id: instructor.instructor_id,
          },
        },
        update: {
          assigned_date: assignedDate,
          ended_date: endedDate,
        },
        create: {
          class_id: classGroup.class_id,
          instructor_id: instructor.instructor_id,
          assigned_date: assignedDate,
          ended_date: endedDate,
          note: `Assigned as class adviser for ${classGroup.class_code}`,
        },
      });
      assignmentCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(` Assigned ${i + 1} adviser assignments`);
      }
    } catch (e) {
      console.warn(` Error assigning instructor ${instructor.instructor_id} to class ${classGroup.class_id}: ${e.message}`);
    }
  }
  console.log(` Seeded ${assignmentCount} AdviserAssignments!`);

  console.log('\n seedFinalPart1.js completed!');
}

main()
  .catch((e) => {
    console.error(' Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

