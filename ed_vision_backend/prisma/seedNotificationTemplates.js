// Seed NotificationTemplate data
// Run with: node prisma/seedNotificationTemplates.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const templates = [
  {
    code: 'appointment.reminder',
    title: '⏰ Nhắc nhở lịch hẹn',
    content: '{recipient_name}, bạn có lịch hẹn "{meeting_purpose}" với {other_party} lúc {time} {date}. Cuộc hẹn sẽ bắt đầu trong {time_remaining}.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'appointment.created',
    title: '📅 Lịch hẹn mới được tạo',
    content: 'Bạn đã đặt lịch hẹn với {instructor_name} vào lúc {time} ngày {date}. Mục đích: {meeting_purpose}.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'appointment.confirmed',
    title: '✅ Lịch hẹn đã được xác nhận',
    content: 'Lịch hẹn của bạn với {instructor_name} vào lúc {time} ngày {date} đã được xác nhận.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'appointment.rejected',
    title: '❌ Lịch hẹn bị từ chối',
    content: 'Lịch hẹn của bạn với {instructor_name} vào {date} đã bị từ chối. Lý do: {reason}',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'appointment.cancelled',
    title: '🚫 Lịch hẹn đã bị hủy',
    content: 'Lịch hẹn của bạn với {instructor_name} vào {date} đã bị hủy.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'appointment.instructor.new',
    title: '📅 Yêu cầu lịch hẹn mới',
    content: '{student_name} đã đặt lịch hẹn với bạn vào lúc {time} ngày {date}. Mục đích: {meeting_purpose}.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'appointment.instructor.reminder',
    title: '⏰ Nhắc nhở lịch hẹn',
    content: 'Bạn có lịch hẹn với {student_name} lúc {time} {date}. Cuộc hẹn sẽ bắt đầu trong {time_remaining}.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'survey.reminder',
    title: '📝 Nhắc nhở khảo sát',
    content: '{recipient_name}, bạn có khảo sát "{survey_title}" chưa hoàn thành. Hạn chót: {deadline}.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'survey.new',
    title: '📋 Khảo sát mới',
    content: 'Có khảo sát mới "{survey_title}" dành cho bạn. Vui lòng hoàn thành trước {deadline}.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'system.update',
    title: '🔄 Cập nhật hệ thống',
    content: '{content}',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'system.maintenance',
    title: '🛠️ Bảo trì hệ thống',
    content: 'Hệ thống sẽ bảo trì từ {start_time} đến {end_time} ngày {date}. Xin lỗi vì sự bất tiện này.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'exam.schedule',
    title: '📚 Lịch thi',
    content: '{recipient_name}, bạn có lịch thi môn {course_name} vào lúc {time} ngày {date} tại phòng {room}.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'grade.updated',
    title: '📊 Điểm số được cập nhật',
    content: 'Điểm môn {course_name} của bạn đã được cập nhật. Điểm: {score}',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'parent.child.update',
    title: '👨‍👩‍👧 Cập nhật về con em',
    content: 'Thông tin về {student_name}: {content}',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'welcome.student',
    title: '🎉 Chào mừng đến Ed_Vision',
    content: 'Chào mừng {recipient_name} đến với hệ thống Ed_Vision! Hãy khám phá các tính năng hỗ trợ học tập của chúng tôi.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'welcome.teacher',
    title: '🎉 Chào mừng Giảng viên',
    content: 'Chào mừng {recipient_name} đến với hệ thống Ed_Vision! Bạn có thể quản lý lịch hẹn và theo dõi sinh viên tại đây.',
    channel: 'in_app',
    is_active: true,
  },
  {
    code: 'welcome.parent',
    title: '🎉 Chào mừng Phụ huynh',
    content: 'Chào mừng {recipient_name} đến với hệ thống Ed_Vision! Hãy liên kết với con em để theo dõi quá trình học tập.',
    channel: 'in_app',
    is_active: true,
  },
];

async function main() {
  console.log('Seeding NotificationTemplate...');

  for (const template of templates) {
    const existing = await prisma.notificationTemplate.findUnique({
      where: { code: template.code },
    });

    if (existing) {
      console.log(`  Template "${template.code}" already exists, updating...`);
      await prisma.notificationTemplate.update({
        where: { code: template.code },
        data: template,
      });
    } else {
      console.log(`  Creating template "${template.code}"...`);
      await prisma.notificationTemplate.create({
        data: template,
      });
    }
  }

  console.log('Done! Created/Updated', templates.length, 'templates.');
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
