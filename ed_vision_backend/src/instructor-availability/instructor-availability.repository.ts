import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InstructorAvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if instructor is an adviser (has AdviserAssignment)
   */
  async isInstructorAdviser(instructorId: number): Promise<boolean> {
    const count = await this.prisma.adviserAssignment.count({
      where: { instructor_id: instructorId },
    });
    return count > 0;
  }

  /**
   * Get all classes that instructor is assigned as adviser
   */
  async getAdviserClasses(instructorId: number) {
    return this.prisma.adviserAssignment.findMany({
      where: { instructor_id: instructorId },
      include: {
        classGroup: {
          select: {
            class_id: true,
            class_code: true,
            cohort_year: true,
            status: true,
            program: {
              select: {
                program_id: true,
                program_name: true,
              },
            },
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
      orderBy: {
        classGroup: {
          class_code: 'asc',
        },
      },
    });
  }

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
        account: {
          select: {
            email: true,
            profile: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
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
      // Create the week
      week = await this.prisma.instructorAvailabilityWeek.create({
        data: {
          instructor_id: instructorId,
          week_start_date: weekStartDate,
        },
      });

      // Create all 7 days (Monday-Sunday) with is_available = false by default
      await this.createDefaultWeekDates(week.week_id, weekStartDate);
    }

    return week;
  }

  /**
   * Create default availability dates for a week (Monday-Sunday)
   * All dates are created with is_available = false by default
   */
  async createDefaultWeekDates(weekId: number, weekStartDate: Date) {
    const datesToCreate: {
      week_id: number;
      specific_date: Date;
      is_available: boolean;
      note?: string | null;
    }[] = [];
    
    // Create 7 days starting from Monday (weekStartDate)
    for (let i = 0; i < 7; i++) {
      const specificDate = new Date(weekStartDate);
      specificDate.setDate(weekStartDate.getDate() + i);
      
      datesToCreate.push({
        week_id: weekId,
        specific_date: specificDate,
        is_available: false, // Default to false - instructor needs to enable manually
        note: null,
      });
    }

    // Bulk create all 7 dates
    await this.prisma.instructorAvailabilityDate.createMany({
      data: datesToCreate,
      skipDuplicates: true, // Just in case
    });

    return datesToCreate;
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
   * Get all slots for a week (via dates)
   */
  async getSlotsForWeek(weekId: number) {
    // Get all dates for this week first
    const dates = await this.prisma.instructorAvailabilityDate.findMany({
      where: { week_id: weekId },
      select: { date_id: true },
    });
    const dateIds = dates.map(d => d.date_id);
    
    return this.prisma.instructorDailySlot.findMany({
      where: { date_id: { in: dateIds } },
      include: { date: true },
      orderBy: [{ date: { specific_date: 'asc' } }, { start_time_local: 'asc' }],
    });
  }

  /**
   * Create a time slot for a specific date
   */
  async createTimeSlot(
    dateId: number,
    startTime: string,
    endTime: string,
    meetingType: 'online' | 'offline' | 'both' | string,
    capacity: number,
    note?: string,
  ) {
    const startTimeDate = this.parseTimeToDate(startTime);
    const endTimeDate = this.parseTimeToDate(endTime);

    return this.prisma.instructorDailySlot.create({
      data: {
        date_id: dateId,
        start_time_local: startTimeDate,
        end_time_local: endTimeDate,
        // meetingType may be a string or enum; cast to any to satisfy generated Prisma types
        meeting_type: meetingType as any,
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
          include: {
            slots: {
              orderBy: { start_time_local: 'asc' },
            },
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
    // Find weeks that overlap with the requested date range
    // We need to find weeks where the week period intersects with our requested range
    const weekStartBound = new Date(startDate);
    weekStartBound.setDate(weekStartBound.getDate() - 7); // Look 1 week earlier
    
    const weekEndBound = new Date(endDate);
    weekEndBound.setDate(weekEndBound.getDate() + 7); // Look 1 week later

    const weeks = await this.prisma.instructorAvailabilityWeek.findMany({
      where: {
        instructor_id: instructorId,
        // Find weeks that potentially contain dates in our range
        week_start_date: {
          gte: weekStartBound,
          lte: weekEndBound,
        },
      },
      include: {
        // Get ALL dates for each week with their slots
        instructorAvailabilityDates: {
          orderBy: {
            specific_date: 'asc',
          },
          include: {
            slots: {
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
              orderBy: { start_time_local: 'asc' },
            },
          },
        },
      },
    });

    // Now filter dates in the service layer to get exact range
    const filteredWeeks = weeks.map(week => ({
      ...week,
      instructorAvailabilityDates: week.instructorAvailabilityDates.filter(date => 
        date.specific_date >= startDate && date.specific_date <= endDate
      )
    })).filter(week => week.instructorAvailabilityDates.length > 0);

    return filteredWeeks;
  }

  /**
   * Delete a specific time slot
   */
  async deleteTimeSlot(slotId: number) {
    return this.prisma.instructorDailySlot.delete({
      where: { slot_id: slotId },
    });
  }

  /**
   * Delete all slots for a specific date
   */
  async deleteSlotsForDate(dateId: number) {
    const result = await this.prisma.instructorDailySlot.deleteMany({
      where: {
        date_id: dateId,
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
      meetingType?: 'online' | 'offline' | 'both' | string;
      capacity?: number;
      isOpen?: boolean;
      autoAccept?: boolean;
      note?: string;
      meetingLink?: string;
      meetingLocation?: string;
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
    if (data.meetingLink !== undefined) {
      updateData.meeting_link = data.meetingLink;
    }
    if (data.meetingLocation !== undefined) {
      updateData.meeting_location = data.meetingLocation;
    }

    return this.prisma.instructorDailySlot.update({
      where: { slot_id: slotId },
      data: updateData,
    });
  }

  /**
   * Get a single slot by ID
   */
  async getSlotById(slotId: number) {
    return this.prisma.instructorDailySlot.findUnique({
      where: { slot_id: slotId },
      include: {
        date: {
          include: {
            week: true,
          },
        },
      },
    });
  }

  /**
   * Check if a time slot overlaps with existing slots
   * NOTE: We check overlap within the SAME DATE only
   */
  async checkTimeSlotOverlap(
    dateId: number,
    startTime: string,
    endTime: string,
    excludeSlotId?: number,
  ): Promise<boolean> {
    const startTimeDate = this.parseTimeToDate(startTime);
    const endTimeDate = this.parseTimeToDate(endTime);

    // Get all slots for this date
    const existingSlots = await this.prisma.instructorDailySlot.findMany({
      where: {
        date_id: dateId,
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
   * Uses local time (GMT+0800) to match database timezone
   */
  formatTimeToString(date: Date): string {
    // Database stores time in GMT+0800, so we need to use local time
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
