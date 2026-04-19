import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

interface ReminderWithDetails {
  reminder_id: number;
  appointment_id: number | null;
  account_id: number;
  recipient_role: 'booker' | 'instructor';
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
    booker?: {
      account_id: number;
      profile: {
        full_name: string | null;
      } | null;
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
              // include the booker (account who created the appointment) so we can read profile.full_name
              booker: {
                include: {
                  profile: true,
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

    // Try to atomically mark this reminder as sent to avoid race conditions
    // Atomically mark ALL reminders for the same appointment/account/remind_at/recipient_role as sent
    // This prevents duplicate sends when duplicate rows already exist in the DB or different recipient roles
    const markResult = await this.prisma.reminderSchedule.updateMany({
      where: {
        appointment_id: reminder.appointment_id ?? undefined,
        account_id: reminder.account_id,
        remind_at: reminder.remind_at,
        // include recipient_role to avoid marking instructor reminders when marking booker reminders
        recipient_role: reminder.recipient_role as any,
        sent_at: null,
      },
      data: { sent_at: new Date() },
    });

    if (markResult.count === 0) {
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

    // Nếu là parent đặt lịch, lấy tên parent ưu tiên theo thứ tự: appointment.booker.profile, appointmentContact.contact_name, recipient account profile
    const bookerRole = reminder.appointment?.booker_role;
    const bookerName = ((): string => {
      if (bookerRole === 'parent') {
        const bookerProfileName =
          reminder.appointment?.booker?.profile?.full_name;
        if (bookerProfileName && String(bookerProfileName).trim().length > 0)
          return bookerProfileName;

        const contactName =
          reminder.appointment?.appointmentContact?.contact_name;
        if (contactName && String(contactName).trim().length > 0)
          return contactName;

        // Fall back to account profile of the recipient/booker if available
        const bookerAccountProfile = reminder.account?.profile?.full_name;
        if (
          bookerAccountProfile &&
          String(bookerAccountProfile).trim().length > 0
        )
          return bookerAccountProfile;
        return 'Phụ huynh';
      }
      return studentName;
    })();

    // Determine recipient role from stored recipient_role instead of inferring from account_id
    const isTeacher = reminder.recipient_role === 'instructor';
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
    if (isTeacher) {
      return {
        title: '⏰ Nhắc nhở lịch hẹn',
        body: `Bạn có lịch hẹn "${meetingPurpose}" với ${otherPartyName} lúc ${timeStr} ${dateStr}. Cuộc hẹn sẽ bắt đầu trong ${timeRemainingStr}.`,
      };
    }

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
    options?: { intendedRecipient?: 'booker' | 'instructor' },
  ) {
    // Tạo 3 reminder: trước 10 phút, 5 phút, 1 phút
    const reminderOffsets = [10, 5, 1]; // phút

    const reminders = reminderOffsets.map((offset) => {
      const remindAt = new Date(appointmentTime.getTime() - offset * 60 * 1000);
      return {
        appointment_id: appointmentId,
        account_id: accountId,
        recipient_role:
          options?.intendedRecipient === 'instructor' ? 'instructor' : 'booker',
        template_code: 'appointment.reminder',
        remind_at: remindAt,
        channel: 'in_app',
        metadata: { offset_minutes: offset },
      };
    });

    // Fetch appointment to inspect instructor account and for logging
    const appointmentRecord = await this.prisma.appointment.findUnique({
      where: { appointment_id: appointmentId },
      include: {
        instructor: { include: { account: true } },
        appointmentContact: true,
      },
    });

    // Guard: if we're asked to create a reminder for the instructor using the instructor's own account
    // when this call was intended for booker, skip to avoid creating cross-account reminders.
    const instructorAccountId =
      appointmentRecord?.instructor?.account?.account_id ?? null;

    // Chỉ tạo reminder nếu thời gian nhắc nhở còn trong tương lai
    const now = new Date();
    const validReminders = reminders.filter((r) => r.remind_at > now);

    if (validReminders.length === 0) return 0;

    // Safety guard & logging: only skip when the caller explicitly intended to create reminders for the booker
    // but the provided accountId equals the instructor's account id (indicating a likely caller bug).
    if (
      options?.intendedRecipient === 'booker' &&
      instructorAccountId &&
      accountId === instructorAccountId &&
      appointmentRecord?.booker_account_id !== instructorAccountId
    ) {
      return 0;
    }

    // Avoid creating duplicates: check existing reminders for the same appointment+account and same remind_at timestamps
    const remindAtTimes = validReminders.map((r) => r.remind_at);
    const existing = await this.prisma.reminderSchedule.findMany({
      where: {
        appointment_id: appointmentId,
        account_id: accountId,
        remind_at: { in: remindAtTimes },
        recipient_role:
          options?.intendedRecipient === 'instructor' ? 'instructor' : 'booker',
      },
      select: { remind_at: true },
    });

    const existingTimes = new Set(
      existing.map((e) => new Date(e.remind_at).getTime()),
    );
    const toCreate = validReminders.filter(
      (r) => !existingTimes.has(new Date(r.remind_at).getTime()),
    );

    // debug info suppressed

    if (toCreate.length === 0) {
      return 0;
    }

    // Cast to any so TypeScript accepts the enum values from runtime; ensure you run
    // `npx prisma migrate dev` and `npx prisma generate` so @prisma/client types are up-to-date.
    await this.prisma.reminderSchedule.createMany({
      data: toCreate as any,
      skipDuplicates: true,
    });

    return toCreate.length;
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
      { intendedRecipient: 'booker' },
    );
    const instructorCount = await this.createRemindersForAppointment(
      appointmentId,
      instructorAccountId,
      appointmentTime,
      { intendedRecipient: 'instructor' },
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
      recipient_role: (r as any).recipient_role || 'booker',
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
            // Ensure forced trigger has booker/contact so rendering picks correct names
            booker: { include: { profile: true } },
            appointmentContact: true,
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
