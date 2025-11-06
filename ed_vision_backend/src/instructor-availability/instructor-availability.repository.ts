import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstructorAvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get instructor by account_id
   */
  async getInstructorByAccountId(accountId: number) {
    return this.prisma.instructor.findUnique({
      where: { account_id: accountId },
      select: {
        instructor_id: true,
        account_id: true,
        employee_code: true,
        academic_title: true,
        position: true,
        department_id: true,
        status: true,
      },
    });
  }

  /**
   * Find or create a week for the given instructor and date
   */
  async findOrCreateWeek(instructorId: number, date: Date) {
    // Verify instructor exists first
    const instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: instructorId },
    });

    if (!instructor) {
      throw new Error(`Instructor with ID ${instructorId} does not exist`);
    }

    const weekStartDate = this.getWeekStartDate(date);

    let week = await this.prisma.instructorAvailabilityWeek.findUnique({
      where: {
        instructor_id_week_start_date: {
          instructor_id: instructorId,
          week_start_date: weekStartDate,
        },
      },
    });

    if (!week) {
      week = await this.prisma.instructorAvailabilityWeek.create({
        data: {
          instructor_id: instructorId,
          week_start_date: weekStartDate,
        },
      });
    }

    return week;
  }

  /**
   * Find a week for the given instructor and date (without creating)
   */
  async findWeek(instructorId: number, date: Date) {
    const weekStartDate = this.getWeekStartDate(date);

    return this.prisma.instructorAvailabilityWeek.findUnique({
      where: {
        instructor_id_week_start_date: {
          instructor_id: instructorId,
          week_start_date: weekStartDate,
        },
      },
    });
  }

  /**
   * Create or update an availability date record
   */
  async upsertAvailabilityDate(
    weekId: number,
    specificDate: Date,
    isAvailable: boolean = true,
    note?: string,
  ) {
    return this.prisma.instructorAvailabilityDate.upsert({
      where: {
        week_id_specific_date: {
          week_id: weekId,
          specific_date: specificDate,
        },
      },
      update: {
        is_available: isAvailable,
        note,
      },
      create: {
        week_id: weekId,
        specific_date: specificDate,
        is_available: isAvailable,
        note,
      },
    });
  }

  /**
   * Find availability date record
   */
  async findAvailabilityDate(weekId: number, specificDate: Date) {
    return this.prisma.instructorAvailabilityDate.findUnique({
      where: {
        week_id_specific_date: {
          week_id: weekId,
          specific_date: specificDate,
        },
      },
    });
  }

  /**
   * Delete availability date record
   */
  async deleteAvailabilityDate(weekId: number, specificDate: Date) {
    const result = await this.prisma.instructorAvailabilityDate.delete({
      where: {
        week_id_specific_date: {
          week_id: weekId,
          specific_date: specificDate,
        },
      },
    });
    return result;
  }

  /**
   * Get all availability dates for a week
   */
  async getAvailabilityDatesForWeek(weekId: number) {
    return this.prisma.instructorAvailabilityDate.findMany({
      where: { week_id: weekId },
      orderBy: { specific_date: 'asc' },
    });
  }

  /**
   * Delete a week (should only be called when week has no more dates)
   */
  async deleteWeek(weekId: number) {
    const result = await this.prisma.instructorAvailabilityWeek.delete({
      where: { week_id: weekId },
    });
    return result;
  }

  /**
   * Get all slots for a week
   */
  async getSlotsForWeek(weekId: number) {
    return this.prisma.instructorWeeklySlot.findMany({
      where: { week_id: weekId },
      orderBy: [{ day_of_week: 'asc' }, { start_time_local: 'asc' }],
    });
  }

  /**
   * Create a time slot for a specific date
   */
  async createTimeSlot(
    weekId: number,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    meetingType: string,
    capacity: number,
    note?: string,
  ) {
    const startTimeDate = this.parseTimeToDate(startTime);
    const endTimeDate = this.parseTimeToDate(endTime);

    return this.prisma.instructorWeeklySlot.create({
      data: {
        week_id: weekId,
        day_of_week: dayOfWeek,
        start_time_local: startTimeDate,
        end_time_local: endTimeDate,
        meeting_type: meetingType,
        capacity,
        is_open: true,
        auto_accept: false,
        note,
      },
    });
  }

  /**
   * Get all availability for an instructor within a date range
   */
  async getInstructorAvailability(
    instructorId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const weeks = await this.prisma.instructorAvailabilityWeek.findMany({
      where: {
        instructor_id: instructorId,
        week_start_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        instructorWeeklySlots: {
          orderBy: [{ day_of_week: 'asc' }, { start_time_local: 'asc' }],
        },
        instructorAvailabilityDates: {
          where: {
            specific_date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            specific_date: 'asc',
          },
        },
      },
    });

    return weeks;
  }

  /**
   * Get slots with appointment counts
   */
  async getSlotsWithBookingCounts(
    instructorId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const weeks = await this.prisma.instructorAvailabilityWeek.findMany({
      where: {
        instructor_id: instructorId,
        week_start_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        instructorWeeklySlots: {
          include: {
            _count: {
              select: {
                appointments: {
                  where: {
                    status: {
                      in: ['pending', 'confirmed'],
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ day_of_week: 'asc' }, { start_time_local: 'asc' }],
        },
        instructorAvailabilityDates: {
          where: {
            specific_date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            specific_date: 'asc',
          },
        },
      },
    });

    return weeks;
  }

  /**
   * Delete a specific time slot
   */
  async deleteTimeSlot(slotId: number) {
    return this.prisma.instructorWeeklySlot.delete({
      where: { slot_id: slotId },
    });
  }

  /**
   * Delete all slots for a specific date (day of week in a week)
   */
  async deleteSlotsForDate(weekId: number, dayOfWeek: number) {
    const result = await this.prisma.instructorWeeklySlot.deleteMany({
      where: {
        week_id: weekId,
        day_of_week: dayOfWeek,
      },
    });
    return result;
  }

  /**
   * Update a time slot
   */
  async updateTimeSlot(
    slotId: number,
    data: {
      startTime?: string;
      endTime?: string;
      meetingType?: string;
      capacity?: number;
      isOpen?: boolean;
      autoAccept?: boolean;
      note?: string;
    },
  ) {
    const updateData: any = {};

    if (data.startTime) {
      updateData.start_time_local = this.parseTimeToDate(data.startTime);
    }
    if (data.endTime) {
      updateData.end_time_local = this.parseTimeToDate(data.endTime);
    }
    if (data.meetingType) {
      updateData.meeting_type = data.meetingType;
    }
    if (data.capacity !== undefined) {
      updateData.capacity = data.capacity;
    }
    if (data.isOpen !== undefined) {
      updateData.is_open = data.isOpen;
    }
    if (data.autoAccept !== undefined) {
      updateData.auto_accept = data.autoAccept;
    }
    if (data.note !== undefined) {
      updateData.note = data.note;
    }

    return this.prisma.instructorWeeklySlot.update({
      where: { slot_id: slotId },
      data: updateData,
    });
  }

  /**
   * Get a single slot by ID
   */
  async getSlotById(slotId: number) {
    return this.prisma.instructorWeeklySlot.findUnique({
      where: { slot_id: slotId },
      include: {
        week: true,
      },
    });
  }

  /**
   * Check if a time slot overlaps with existing slots
   * NOTE: We check overlap within the SAME WEEK only
   * This allows same time slots on same day_of_week in different weeks
   */
  async checkTimeSlotOverlap(
    weekId: number,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeSlotId?: number,
  ): Promise<boolean> {
    const startTimeDate = this.parseTimeToDate(startTime);
    const endTimeDate = this.parseTimeToDate(endTime);

    // Get all slots for this week and day
    const existingSlots = await this.prisma.instructorWeeklySlot.findMany({
      where: {
        week_id: weekId,
        day_of_week: dayOfWeek,
        slot_id: excludeSlotId ? { not: excludeSlotId } : undefined,
      },
    });

    // Check for time overlap
    for (const slot of existingSlots) {
      if (!slot.start_time_local || !slot.end_time_local) continue;

      const slotStart = slot.start_time_local;
      const slotEnd = slot.end_time_local;

      // Check if times overlap:
      // 1. New slot starts during existing slot
      // 2. New slot ends during existing slot
      // 3. New slot completely contains existing slot
      const overlaps =
        (startTimeDate >= slotStart && startTimeDate < slotEnd) ||
        (endTimeDate > slotStart && endTimeDate <= slotEnd) ||
        (startTimeDate <= slotStart && endTimeDate >= slotEnd);

      if (overlaps) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get week start date (Monday) for a given date
   * Uses UTC to avoid timezone issues
   */
  private getWeekStartDate(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay(); // Use UTC day
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0); // Reset time to start of day in UTC
    return d;
  }

  /**
   * Parse time string (HH:mm) to Date object
   * Uses UTC to avoid timezone conversion issues
   */
  private parseTimeToDate(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Format Date to time string (HH:mm)
   * Uses UTC to avoid timezone conversion issues
   */
  formatTimeToString(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
