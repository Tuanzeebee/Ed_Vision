import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingCronService {
  private readonly logger = new Logger(BookingCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron job chạy mỗi 1 phút để tự động chuyển trạng thái appointments
   * từ 'pending' hoặc 'confirmed' sang 'completed' khi đã quá giờ kết thúc
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoCompleteAppointments() {
    this.logger.log('Running auto-complete appointments cron job...');

    try {
      // Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
      const now = new Date();

      // Tìm tất cả appointments cần cập nhật
      // Điều kiện: status là 'pending' hoặc 'confirmed' VÀ thời gian kết thúc đã qua
      const appointmentsToUpdate = await this.prisma.appointment.findMany({
        where: {
          status: { in: ['pending', 'confirmed'] },
        },
        include: {
          slot: {
            include: {
              date: true,
            },
          },
        },
      });

      let updatedCount = 0;

      for (const appointment of appointmentsToUpdate) {
        const slot = appointment.slot;
        const slotDate = slot?.date?.specific_date;
        const endTime = slot?.end_time_local;

        if (!slotDate || !endTime) continue;

        try {
          // Parse ngày từ specific_date
          const dateObj = new Date(slotDate);
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth();
          const day = dateObj.getDate();

          // Parse giờ kết thúc từ end_time_local
          const endTimeObj = new Date(endTime);
          const hours = endTimeObj.getUTCHours();
          const minutes = endTimeObj.getUTCMinutes();

          // Tạo datetime kết thúc của cuộc hẹn (theo múi giờ local)
          const appointmentEndDateTime = new Date(
            year,
            month,
            day,
            hours,
            minutes,
            0,
            0,
          );

          // So sánh với thời gian hiện tại
          if (appointmentEndDateTime < now) {
            // Cập nhật trạng thái sang 'completed'
            await this.prisma.appointment.update({
              where: { appointment_id: appointment.appointment_id },
              data: {
                status: 'completed',
                updated_at: new Date(),
              },
            });
            updatedCount++;
          }
        } catch (parseError) {
          this.logger.warn(
            `Failed to parse datetime for appointment ${appointment.appointment_id}: ${parseError}`,
          );
        }
      }

      if (updatedCount > 0) {
        this.logger.log(`Auto-completed ${updatedCount} appointments`);
      } else {
        this.logger.debug('No appointments to auto-complete');
      }
    } catch (error) {
      this.logger.error('Error in auto-complete cron job:', error);
    }
  }

  /**
   * Cron job chạy mỗi 1 phút để tự động disable slots đã quá giờ
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoDisablePastSlots() {
    this.logger.log('Running auto-disable past slots cron job...');

    try {
      const now = new Date();

      // Tìm tất cả slots đang mở nhưng đã quá giờ bắt đầu
      const slotsToDisable = await this.prisma.instructorDailySlot.findMany({
        where: {
          is_open: true,
        },
        include: {
          date: true,
        },
      });

      let disabledCount = 0;

      for (const slot of slotsToDisable) {
        const slotDate = slot.date?.specific_date;
        const startTime = slot.start_time_local;

        if (!slotDate || !startTime) continue;

        try {
          // Parse ngày từ specific_date
          const dateObj = new Date(slotDate);
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth();
          const day = dateObj.getDate();

          // Parse giờ bắt đầu từ start_time_local
          const startTimeObj = new Date(startTime);
          const hours = startTimeObj.getUTCHours();
          const minutes = startTimeObj.getUTCMinutes();

          // Tạo datetime bắt đầu của slot
          const slotStartDateTime = new Date(
            year,
            month,
            day,
            hours,
            minutes,
            0,
            0,
          );

          // Nếu slot đã bắt đầu hoặc đã qua, disable nó
          if (slotStartDateTime <= now) {
            await this.prisma.instructorDailySlot.update({
              where: { slot_id: slot.slot_id },
              data: {
                is_open: false,
              },
            });
            disabledCount++;
          }
        } catch (parseError) {
          this.logger.warn(
            `Failed to parse datetime for slot ${slot.slot_id}: ${parseError}`,
          );
        }
      }

      if (disabledCount > 0) {
        this.logger.log(`Auto-disabled ${disabledCount} past slots`);
      } else {
        this.logger.debug('No slots to auto-disable');
      }
    } catch (error) {
      this.logger.error('Error in auto-disable slots cron job:', error);
    }
  }

  /**
   * Cron job chạy lúc 0:00 mỗi ngày để dọn dẹp và thống kê
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyCleanup() {
    this.logger.log('Running daily cleanup cron job...');

    try {
      // Thống kê appointments trong ngày hôm qua
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await this.prisma.appointment.groupBy({
        by: ['status'],
        where: {
          created_at: {
            gte: yesterday,
            lt: today,
          },
        },
        _count: true,
      });

      this.logger.log(
        `Yesterday's appointment stats: ${JSON.stringify(stats)}`,
      );
    } catch (error) {
      this.logger.error('Error in daily cleanup cron job:', error);
    }
  }
}
