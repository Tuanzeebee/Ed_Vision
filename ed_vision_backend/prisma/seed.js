const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding roles and permissions...')

  const roles = [
    { code: 'admin', name: 'Administrator' },
    { code: 'student', name: 'Sinh viên' },
    { code: 'teacher', name: 'Giảng viên' },
    { code: 'leader', name: 'Lãnh đạo' },
    { code: 'parent', name: 'Phụ huynh' }
  ]

  const permissionDefs = [
  // ========== ADMIN ==========
  { key: 'admin_overview',            name: 'Admin Overview',                 category: 'admin' },

  // System management
  { key: 'admin_permissions',         name: 'Manage Permission Definitions',  category: 'admin' },
  { key: 'admin_role_permissions',    name: 'Manage Role Permissions',        category: 'admin', sensitive: true },

  // User management
  { key: 'admin_users',               name: 'Manage Users',                   category: 'admin' },

  // Students (admin screens)
  { key: 'admin_students',            name: 'Student Management',             category: 'admin' }, // list/search
  { key: 'admin_student_detail',      name: 'Student Detail',                 category: 'admin' }, // detail page

  // Teachers (admin screens)
  { key: 'admin_teachers',            name: 'Teacher Management',             category: 'admin' }, // list/search
  { key: 'admin_teacher_detail',      name: 'Teacher Detail',                 category: 'admin' },
  { key: 'admin_teacher_subjects',    name: 'Teacher Subjects',               category: 'admin' },
  { key: 'admin_teacher_ratings',     name: 'Teacher Ratings',                category: 'admin' },
  { key: 'admin_teacher_performance', name: 'Teacher Performance',            category: 'admin' },
  { key: 'admin_teacher_schedule',    name: 'Teacher Schedule',               category: 'admin' },
  { key: 'admin_teacher_support_history', name: 'Teacher Support History',    category: 'admin' },

  // Content / classes / Q&A
  { key: 'admin_classes',             name: 'Manage Classes',                 category: 'admin' },
  { key: 'admin_questions',           name: 'Question Management',            category: 'admin' },
  { key: 'admin_questions_add',       name: 'Add Question',                   category: 'admin' },

  // Ops
  { key: 'admin_notifications',       name: 'Manage Notifications',           category: 'admin' },
  { key: 'admin_content_approval',    name: 'Content Approval',               category: 'admin' },

  // Analytics
  { key: 'admin_reports',             name: 'View Reports & Analytics',       category: 'admin' },
  { key: 'admin_ai_insights',         name: 'AI Insights',                    category: 'admin' },

  // ========== TEACHER ==========
  { key: 'teacher_dashboard',         name: 'Teacher Dashboard',              category: 'teacher' },
  { key: 'teacher_class_management',  name: 'Manage Classes',                 category: 'teacher' },
  { key: 'teacher_grade_management',  name: 'Manage Grades',                  category: 'teacher' },
  { key: 'teacher_prediction_view',   name: 'Prediction View',                category: 'teacher' },
  { key: 'teacher_progress_tracking', name: 'Progress Tracking',              category: 'teacher' },
  { key: 'teacher_reports_alerts',    name: 'Reports & Alerts',               category: 'teacher' },
  { key: 'teacher_messages',          name: 'Messages & Notifications',       category: 'teacher' },
  { key: 'teacher_chat',              name: 'Teacher Chat',                   category: 'teacher' },
  { key: 'teacher_appointments',      name: 'Manage Appointments',            category: 'teacher' },
  { key: 'teacher_settings',          name: 'Teacher Settings',               category: 'teacher' },
  { key: 'teacher_meeting_demo',      name: 'Meeting Detail Demo',            category: 'teacher' },

  // ========== STUDENT ==========
  { key: 'student_course_overview',   name: 'Course Overview',                category: 'student' },
  { key: 'student_upload_transcript', name: 'Upload Transcript',              category: 'student' },
  { key: 'student_adjust_parameters', name: 'Adjust Parameters',              category: 'student' },
  { key: 'student_academic_planning', name: 'Academic Planning',              category: 'student' },
  { key: 'student_course_detail',     name: 'Course Detail',                  category: 'student' },
  { key: 'student_financial_survey',  name: 'Financial Survey',               category: 'student' },
  { key: 'student_choose_mascot',     name: 'Choose Mascot',                  category: 'student' },
  { key: 'student_learning_adventure',name: 'Learning Adventure',             category: 'student' },
  { key: 'student_live_learning',     name: 'Live Learning',                  category: 'student' },
  { key: 'student_study_rooms',       name: 'Study Rooms',                    category: 'student' },
  { key: 'student_video_room',        name: 'Video Room',                     category: 'student' },

  // ========== PARENT ==========
  { key: 'parent_dashboard',          name: 'Parent Dashboard',               category: 'parent' },
  { key: 'parent_book_appointment',   name: 'Book Appointment',               category: 'parent' },
  { key: 'parent_appointments',       name: 'Parent Appointments',            category: 'parent' },
  { key: 'parent_student_details',    name: 'Student Details',                category: 'parent' },
  { key: 'parent_chat',               name: 'Parent Chat',                    category: 'parent' },
]

  // upsert permissions
  for (const r of roles) {
    await prisma.role.upsert({ where: { code: r.code }, update: {}, create: r })
  }

  for (const p of permissionDefs) {
    await prisma.permission.upsert({ where: { key: p.key }, update: {}, create: p })
  }

  // default mapping
  // admin: all true
  const allPerms = await prisma.permission.findMany()
  const adminRole = await prisma.role.findUnique({ where: { code: 'admin' } })
  if (adminRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } })
    const data = allPerms.map(p => ({ roleId: adminRole.id, permissionId: p.id, enabled: true }))
    if (data.length) await prisma.rolePermission.createMany({ data })
  }

  // student defaults (allow course_overview, profile)
  const studentRole = await prisma.role.findUnique({ where: { code: 'student' } })
  if (studentRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: studentRole.id } })
    const rows = []
    for (const p of allPerms) {
      const enabled = ['student_course_overview', 'student_profile_access', 'student_upload_transcript'].includes(p.key)
      rows.push({ roleId: studentRole.id, permissionId: p.id, enabled })
    }
    if (rows.length) await prisma.rolePermission.createMany({ data: rows })
  }

  // teacher defaults
  const teacherRole = await prisma.role.findUnique({ where: { code: 'teacher' } })
  if (teacherRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: teacherRole.id } })
    const rows = []
    for (const p of allPerms) {
      const enabled = [
        'teacher_dashboard',
        'teacher_class_management',
        'teacher_grade_management',
        'teacher_prediction_view',
        'teacher_progress_tracking',
        'teacher_messages',
        'teacher_chat',
        'teacher_appointments'
      ].includes(p.key)
      rows.push({ roleId: teacherRole.id, permissionId: p.id, enabled })
    }
    if (rows.length) await prisma.rolePermission.createMany({ data: rows })
  }

  // leader defaults: allow reports
  const leaderRole = await prisma.role.findUnique({ where: { code: 'leader' } })
  if (leaderRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: leaderRole.id } })
    const rows = []
    for (const p of allPerms) {
      const enabled = ['admin_reports', 'admin_overview'].includes(p.key)
      rows.push({ roleId: leaderRole.id, permissionId: p.id, enabled })
    }
    if (rows.length) await prisma.rolePermission.createMany({ data: rows })
  }

  // parent defaults: minimal
  const parentRole = await prisma.role.findUnique({ where: { code: 'parent' } })
  if (parentRole) {
    await prisma.rolePermission.deleteMany({ where: { roleId: parentRole.id } })
    const rows = []
    for (const p of allPerms) {
      const enabled = ['parent_dashboard', 'parent_book_appointment', 'parent_chat'].includes(p.key)
      rows.push({ roleId: parentRole.id, permissionId: p.id, enabled })
    }
    if (rows.length) await prisma.rolePermission.createMany({ data: rows })
  }

  console.log('Seeding finished')

  // Ensure an admin account exists (dev/test only)
  const bcrypt = require('bcryptjs')
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@dtu.edu.vn'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin'
  const adminRoleRec = await prisma.role.findUnique({ where: { code: 'admin' } })
  if (adminRoleRec) {
    const existing = await prisma.account.findUnique({ where: { email: adminEmail } })
    if (!existing) {
      const hash = await bcrypt.hash(adminPassword, 10)
      const acc = await prisma.account.create({
        data: {
          email: adminEmail,
          password_hash: hash,
          status: 'active',
          roleRel: { connect: { id: adminRoleRec.id } }
        }
      })
      console.log('Created admin user:', adminEmail, 'id=', acc.account_id)
      console.log('Dev token for admin (use as Bearer): dev-token-' + acc.account_id)
    } else {
      console.log('Admin user already exists:', adminEmail)
      console.log('Dev token (existing): dev-token-' + existing.account_id)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
