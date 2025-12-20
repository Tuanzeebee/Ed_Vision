import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

interface ReminderWithDetails {
  reminder_id: number;
  appointment_id: number | null;
  account_id: number;
  template_code: string;
  remind_at: Date;
  sent_at: Date | null;
  channel: string | null;
  metadata: any;
  canceled: boolean;
  appointment: {
    appointment_id: number;
    meeting_purpose: string | null;
    meeting_type: string;
    status: string;
    booker_role: string | null;
    slot: {
      slot_id: number;
      start_time_local: Date | null;
      end_time_local: Date | null;
      date: {
        specific_date: Date;
      };
    };
    student: {
      student_id: number;
      account: {
        account_id: number;
        profile: {
          full_name: string;
        } | null;
      };
    } | null;
    instructor: {
      instructor_id: number;
      account: {
        account_id: number;
        profile: {
          full_name: string;
        } | null;
      };
    } | null;
    appointmentContact: {
      contact_name: string | null;
      contact_phone: string | null;
      contact_email: string | null;
      relationship_to_student: string | null;
    } | null;
  } | null;
  account: {
    account_id: number;
    profile: {
      full_name: string;
    } | null;
  };
}

@Injectable()
export class ReminderSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    this.logger.log(
      '[ReminderScheduler] ✅ Service initialized - @Cron job registered',
    );
    this.logger.log(
      '[ReminderScheduler] Cron will run every minute to check reminders',
    );
  }

  /**
   * Cron job chạy mỗi phút để kiểm tra và gửi reminder
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminderJob() {
    const now = new Date();
    // Cho phép trễ 2 phút để tránh miss
    const windowStart = new Date(now.getTime() - 2 * 60 * 1000);

    this.logger.log(`[CronJob] Running at ${now.toISOString()}`);
    this.logger.log(
      `[CronJob] Window: ${windowStart.toISOString()} - ${now.toISOString()}`,
    );

    try {
      // 1. Lấy các reminder đến giờ gửi mà chưa gửi và chưa bị hủy
      const dueReminders = (await this.prisma.reminderSchedule.findMany({
        where: {
          sent_at: null,
          canceled: false,
          remind_at: {
            gte: windowStart,
            lte: now,
          },
        },
        include: {
          appointment: {
            include: {
              slot: {
                include: {
                  date: true,
                },
              },
              student: {
                include: {
                  account: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
              instructor: {
                include: {
                  account: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
              appointmentContact: true,
            },
          },
          account: {
            include: {
              profile: true,
            },
          },
        },
      })) as unknown as ReminderWithDetails[];

      if (!dueReminders.length) {
        this.logger.debug('[CronJob] No due reminders found');
        return;
      }

      this.logger.log(`[CronJob] Found ${dueReminders.length} due reminders`);

      for (const reminder of dueReminders) {
        this.logger.log(
          `[CronJob] Processing reminder ${reminder.reminder_id}, remind_at: ${reminder.remind_at.toISOString()}`,
        );

        try {
          await this.processReminder(reminder);
        } catch (error) {
          this.logger.error(
            `Error processing reminder ${reminder.reminder_id}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in handleReminderJob:', error);
    }
  }

  /**
   * Xử lý một reminder: tạo notification và đẩy real-time
   */
  private async processReminder(reminder: ReminderWithDetails) {
    // Kiểm tra appointment còn valid không (không bị cancel)
    if (reminder.appointment && reminder.appointment.status === 'cancelled') {
      // Đánh dấu reminder đã xử lý (không gửi)
      await this.prisma.reminderSchedule.update({
        where: { reminder_id: reminder.reminder_id },
        data: { canceled: true },
      });
      this.logger.log(
        `Skipped reminder ${reminder.reminder_id} - appointment cancelled`,
      );
      return;
    }

    // Render nội dung notification từ template
    const { title, body } = await this.renderNotificationContent(reminder);

    // Tạo NotificationMaster
    const master = await this.prisma.notificationMaster.create({
      data: {
        title,
        body,
        type: 'appointment_reminder',
        priority: 'Cao',
        target: 'individual',
        channel: reminder.channel || 'in_app',
        creator: { connect: { account_id: 1 } }, // System account for automated reminders
      },
    });

    // Tạo NotificationRecipient cho người nhận
    await this.prisma.notificationRecipient.create({
      data: {
        master_id: master.id,
        account_id: reminder.account_id,
        is_read: false,
        delivered_at: new Date(),
      },
    });

    // Đánh dấu reminder đã gửi
    await this.prisma.reminderSchedule.update({
      where: { reminder_id: reminder.reminder_id },
      data: { sent_at: new Date() },
    });

    // Push real-time qua WebSocket
    const payload = {
      masterId: master.id,
      title,
      body,
      type: 'appointment_reminder',
      target: 'individual',
      attachments: null,
      createdAt: new Date().toISOString(),
    };
    this.notificationGateway.broadcastNotification(payload, [
      reminder.account_id,
    ]);

    this.logger.log(
      `Sent reminder ${reminder.reminder_id} to account ${reminder.account_id}`,
    );
  }

  /**
   * Render nội dung thông báo từ template hoặc mặc định
   */
  private async renderNotificationContent(
    reminder: ReminderWithDetails,
  ): Promise<{ title: string; body: string }> {
    // Lấy template từ database nếu có
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { code: reminder.template_code },
    });

    // Chuẩn bị dữ liệu để render
    const appointmentDate = reminder.appointment?.slot?.date?.specific_date;
    const startTime = reminder.appointment?.slot?.start_time_local;
    const recipientName = reminder.account?.profile?.full_name || 'Bạn';
    const instructorName =
      reminder.appointment?.instructor?.account?.profile?.full_name || 'Cố vấn';
    const studentName =
      reminder.appointment?.student?.account?.profile?.full_name || 'Sinh viên';
    const meetingPurpose =
      reminder.appointment?.meeting_purpose || 'Cuộc hẹn tư vấn';

    // Nếu là parent đặt lịch, lấy tên parent từ appointmentContact
    const bookerRole = reminder.appointment?.booker_role;
    const bookerName =
      bookerRole === 'parent'
        ? reminder.appointment?.appointmentContact?.contact_name || 'Phụ huynh'
        : studentName;

    // Detect xem recipient là teacher hay student để hiển thị đúng tên người kia
    const isTeacher =
      reminder.account_id ===
      reminder.appointment?.instructor?.account?.account_id;
    // Nếu teacher nhận reminder, hiển thị tên người đặt (parent hoặc student)
    // Nếu student/parent nhận reminder, hiển thị tên teacher
    const otherPartyName = isTeacher ? bookerName : instructorName;
    const otherPartyRole = isTeacher
      ? bookerRole === 'parent'
        ? 'phụ huynh'
        : 'sinh viên'
      : 'cố vấn';

    // Format thời gian
    let timeStr = '';
    if (startTime) {
      const hours = startTime.getUTCHours().toString().padStart(2, '0');
      const minutes = startTime.getUTCMinutes().toString().padStart(2, '0');
      timeStr = `${hours}:${minutes}`;
    }

    let dateStr = '';
    if (appointmentDate) {
      dateStr = appointmentDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // Tính thời gian còn lại
    const now = new Date();
    const minutesRemaining = Math.round(
      (reminder.remind_at.getTime() - now.getTime()) / (1000 * 60),
    );
    let timeRemainingStr = '';
    if (minutesRemaining <= 1) {
      timeRemainingStr = '1 phút nữa';
    } else if (minutesRemaining <= 5) {
      timeRemainingStr = '5 phút nữa';
    } else if (minutesRemaining <= 10) {
      timeRemainingStr = '10 phút nữa';
    } else {
      timeRemainingStr = `${minutesRemaining} phút nữa`;
    }

    if (template) {
      // Render template với placeholder
      let title = template.title || 'Nhắc nhở lịch hẹn';
      let body = template.content;

      // Replace placeholders
      const replacements: Record<string, string> = {
        '{recipient_name}': recipientName,
        '{instructor_name}': instructorName,
        '{student_name}': studentName,
        '{other_party}': otherPartyName, // Tên người kia (teacher thì hiện tên student, student thì hiện tên teacher)
        '{other_party_role}': otherPartyRole, // Role của người kia
        '{meeting_purpose}': meetingPurpose,
        '{time}': timeStr,
        '{date}': dateStr,
        '{time_remaining}': timeRemainingStr,
      };

      Object.entries(replacements).forEach(([key, value]) => {
        title = title.replace(new RegExp(key, 'g'), value);
        body = body.replace(new RegExp(key, 'g'), value);
      });

      return { title, body };
    }

    // Default content nếu không có template
    return {
      title: '⏰ Nhắc nhở lịch hẹn',
      body: `${recipientName}, bạn có lịch hẹn "${meetingPurpose}" với ${otherPartyName} lúc ${timeStr} ${dateStr}. Cuộc hẹn sẽ bắt đầu trong ${timeRemainingStr}.`,
    };
  }

  /**
   * Tạo các reminder cho một appointment mới
   * Gọi method này khi sinh viên đặt lịch thành công
   */
  async createRemindersForAppointment(
    appointmentId: number,
    accountId: number,
    appointmentTime: Date,
  ) {
    // Tạo 3 reminder: trước 10 phút, 5 phút, 1 phút
    const reminderOffsets = [10, 5, 1]; // phút

    const reminders = reminderOffsets.map((offset) => {
      const remindAt = new Date(appointmentTime.getTime() - offset * 60 * 1000);
      return {
        appointment_id: appointmentId,
        account_id: accountId,
        template_code: 'appointment.reminder',
        remind_at: remindAt,
        channel: 'in_app',
        metadata: { offset_minutes: offset },
      };
    });

    // Chỉ tạo reminder nếu thời gian nhắc nhở còn trong tương lai
    const now = new Date();
    const validReminders = reminders.filter((r) => r.remind_at > now);

    if (validReminders.length > 0) {
      // Kiểm tra xem đã có reminder cho appointment + account này chưa
      const existingCount = await this.prisma.reminderSchedule.count({
        where: {
          appointment_id: appointmentId,
          account_id: accountId,
        },
      });

      if (existingCount > 0) {
        this.logger.warn(
          `Reminders already exist for appointment ${appointmentId}, account ${accountId}. Skipping.`,
        );
        return 0;
      }

      await this.prisma.reminderSchedule.createMany({
        data: validReminders,
      });
      this.logger.log(
        `Created ${validReminders.length} reminders for appointment ${appointmentId}, account ${accountId}`,
      );
    }

    return validReminders.length;
  }

  /**
   * Tạo reminder cho cả student và instructor
   */
  async createRemindersForBothParties(
    appointmentId: number,
    studentAccountId: number,
    instructorAccountId: number,
    appointmentTime: Date,
  ) {
    const studentCount = await this.createRemindersForAppointment(
      appointmentId,
      studentAccountId,
      appointmentTime,
    );
    const instructorCount = await this.createRemindersForAppointment(
      appointmentId,
      instructorAccountId,
      appointmentTime,
    );

    return { studentCount, instructorCount };
  }

  /**
   * Hủy tất cả reminder của một appointment (khi appointment bị cancel)
   */
  async cancelRemindersForAppointment(appointmentId: number) {
    const result = await this.prisma.reminderSchedule.updateMany({
      where: {
        appointment_id: appointmentId,
        sent_at: null,
      },
      data: {
        canceled: true,
      },
    });

    this.logger.log(
      `Cancelled ${result.count} reminders for appointment ${appointmentId}`,
    );
    return result.count;
  }

  /**
   * Debug: Lấy tất cả pending reminders
   */
  async getPendingReminders() {
    const now = new Date();
    const reminders = await this.prisma.reminderSchedule.findMany({
      where: {
        sent_at: null,
        canceled: false,
      },
      orderBy: { remind_at: 'asc' },
      take: 20,
    });

    return reminders.map((r) => ({
      id: r.reminder_id,
      appointment_id: r.appointment_id,
      account_id: r.account_id,
      remind_at: r.remind_at.toISOString(),
      remind_at_local: r.remind_at.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
      }),
      is_past: r.remind_at <= now,
      minutes_until: Math.round(
        (r.remind_at.getTime() - now.getTime()) / 60000,
      ),
    }));
  }

  /**
   * Debug: Force trigger một reminder cụ thể
   */
  async forceTriggerReminder(reminderId: number) {
    const reminder = await this.prisma.reminderSchedule.findUnique({
      where: { reminder_id: reminderId },
      include: {
        appointment: {
          include: {
            slot: { include: { date: true } },
            student: { include: { account: { include: { profile: true } } } },
            instructor: {
              include: { account: { include: { profile: true } } },
            },
          },
        },
        account: { include: { profile: true } },
      },
    });

    if (!reminder) {
      return { success: false, message: 'Reminder not found' };
    }

    await this.processReminder(reminder as unknown as ReminderWithDetails);
    return { success: true, message: `Triggered reminder ${reminderId}` };
  }

  /**
   * Debug: Xóa tất cả pending reminders (chưa gửi)
   */
  async clearPendingReminders() {
    const result = await this.prisma.reminderSchedule.deleteMany({
      where: {
        sent_at: null,
      },
    });
    return { deleted: result.count };
  }

  /**
   * Debug: Check cron job status
   */
  getCronStatus() {
    const now = new Date();
    return {
      currentTime: now.toISOString(),
      currentTimeVN: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      cronSchedule: 'EVERY_MINUTE',
      status: 'Active (if @Cron decorator working)',
      note: 'Check backend logs for "[CronJob]" messages to confirm execution',
    };
  }

  /**
   * Debug: Create test reminder for immediate testing
   */
  async createTestReminder(accountId: number, minutesFromNow: number) {
    const now = new Date();
    const remindAt = new Date(now.getTime() + minutesFromNow * 60 * 1000);

    const reminder = await this.prisma.reminderSchedule.create({
      data: {
        account_id: accountId,
        template_code: 'appointment.reminder',
        remind_at: remindAt,
        channel: 'in-app',
        metadata: {
          test: true,
          createdFor: 'cron job testing',
        },
        canceled: false,
      },
    });

    return {
      success: true,
      reminder_id: reminder.reminder_id,
      remind_at: remindAt.toISOString(),
      remind_at_vn: new Date(
        remindAt.getTime() + 7 * 60 * 60 * 1000,
      ).toISOString(),
      message: `Test reminder created. Will trigger in ${minutesFromNow} minutes.`,
    };
  }
}
