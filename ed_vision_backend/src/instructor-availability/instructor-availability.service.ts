import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InstructorAvailabilityRepository } from './instructor-availability.repository';
import { AddAvailabilityDateDto } from './dto/add-availability-date.dto';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import {
  AvailabilityResponse,
  AvailabilityDateResponse,
  TimeSlotResponse,
  AvailabilityStatistics,
} from './models/availability.types';

@Injectable()
export class InstructorAvailabilityService {
  constructor(private readonly repository: InstructorAvailabilityRepository) {}

  /**
   * Get instructor profile by account_id
   * Returns instructor_id and other instructor details
   */
  async getInstructorProfile(accountId: number) {
    const instructor =
      await this.repository.getInstructorByAccountId(accountId);

    if (!instructor) {
      throw new NotFoundException(
        `No instructor found for account_id: ${accountId}`,
      );
    }

    return {
      instructor_id: instructor.instructor_id,
      account_id: instructor.account_id,
      employee_code: instructor.employee_code,
      academic_title: instructor.academic_title,
      position: instructor.position,
      department_id: instructor.department_id,
      status: instructor.status,
      full_name: instructor.account?.profile?.full_name || null,
      avatar_url: instructor.account?.profile?.avatar_url || null,
      email: instructor.account?.email || null,
    };
  }

  /**
   * Get instructor's availability for a date range
   */
  async getAvailability(
    instructorId: number,
    startDate?: string,
    endDate?: string,
    autoCreate: boolean = true, // Mặc định vẫn tự động tạo để tương thích backward
  ): Promise<AvailabilityResponse> {
    // Default to showing from 30 days ago to next 6 months
    const start = startDate
      ? this.parseDateString(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate
      ? this.parseDateString(endDate)
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    // Chỉ tự động tạo tuần nếu autoCreate = true
    if (autoCreate && startDate && endDate) {
      // If requesting a specific week, ensure it exists
      const weekStart = this.parseDateString(startDate);
      await this.repository.findOrCreateWeek(instructorId, weekStart);
    }

    const weeks = await this.repository.getSlotsWithBookingCounts(
      instructorId,
      start,
      end,
    );

    const availabilities: AvailabilityDateResponse[] = [];
    const statistics: AvailabilityStatistics = {
      totalDates: 0,
      totalTimeSlots: 0,
      totalHours: 0,
      upcomingDates: 0,
      totalCapacity: 0,
      bookedSlots: 0,
    };

    const dateMap = new Map<string, AvailabilityDateResponse>();

    for (const week of weeks) {
      // First, add all explicit availability dates (including those with is_available = false)
      if (week.instructorAvailabilityDates) {
        for (const dateRecord of week.instructorAvailabilityDates) {
          const dateStr = dateRecord.specific_date.toISOString().split('T')[0];
          const date = new Date(dateRecord.specific_date);
          const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // Use UTC day

          if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, {
              date: dateStr,
              dayOfWeek: dayOfWeek,
              weekId: week.week_id,
              isAvailable: dateRecord.is_available, // Include availability status
              timeSlots: [],
            });
          }
        }
      }

      // Then, add time slots to the dates
      for (const slot of week.instructorWeeklySlots) {
        // Skip slots with missing required data
        if (
          !slot.day_of_week ||
          !slot.start_time_local ||
          !slot.end_time_local ||
          !slot.meeting_type
        ) {
          continue;
        }

        const slotDate = this.getDateFromWeekAndDay(
          week.week_start_date,
          slot.day_of_week,
        );
        const dateStr = slotDate.toISOString().split('T')[0];

        // Create date entry if it doesn't exist (for backward compatibility)
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, {
            date: dateStr,
            dayOfWeek: slot.day_of_week,
            weekId: week.week_id,
            isAvailable: true, // If slot exists, date should be available
            timeSlots: [],
          });
        }

        const timeSlot: TimeSlotResponse = {
          slotId: slot.slot_id,
          startTime: this.repository.formatTimeToString(slot.start_time_local),
          endTime: this.repository.formatTimeToString(slot.end_time_local),
          meetingType: slot.meeting_type,
          capacity: slot.capacity,
          isOpen: slot.is_open,
          autoAccept: slot.auto_accept,
          note: slot.note ?? undefined,
          bookedCount: slot._count?.appointments || 0,
          meetingLink: slot.meeting_link ?? undefined,
          meetingLocation: slot.meeting_location ?? undefined,
        };

        const dateEntry = dateMap.get(dateStr);
        if (dateEntry) {
          dateEntry.timeSlots.push(timeSlot);
        }

        // Update statistics
        statistics.totalTimeSlots++;
        const hours = this.calculateHours(timeSlot.startTime, timeSlot.endTime);
        statistics.totalHours += hours;
        statistics.totalCapacity += slot.capacity;
        statistics.bookedSlots += timeSlot.bookedCount || 0;
      }
    }

    // Convert map to array and sort by date
    availabilities.push(
      ...Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    );
    statistics.totalDates = dateMap.size;

    // Count upcoming dates
    const today = new Date().toISOString().split('T')[0];
    statistics.upcomingDates = availabilities.filter(
      (a) => a.date >= today,
    ).length;

    return {
      availabilities,
      statistics,
    };
  }

  /**
   * Add a new availability date with optional time slots
   * This method enables an existing date (sets is_available = true) 
   * rather than creating a new date, since all dates are pre-created when the week is created
   */
  async addAvailabilityDate(
    instructorId: number,
    dto: AddAvailabilityDateDto,
  ): Promise<AvailabilityDateResponse> {
    const date = this.parseDateString(dto.date);
    const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // Convert Sunday from 0 to 7, use UTC

    // Find or create the week (this will also create all 7 default dates if new week)
    const week = await this.repository.findOrCreateWeek(instructorId, date);

    // Check if the date already exists and is available
    const existingDate = await this.repository.findAvailabilityDate(week.week_id, date);
    
    // If date is already available and we're trying to add time slots, reject
    if (existingDate && existingDate.is_available && dto.timeSlots && dto.timeSlots.length > 0) {
      throw new ConflictException(`Date ${dto.date} is already available. Use addTimeSlot endpoint to add time slots.`);
    }
    
    // If date is already available and we're just trying to enable it (no time slots), allow it (idempotent)
    if (existingDate && existingDate.is_available && (!dto.timeSlots || dto.timeSlots.length === 0)) {
      // Return existing date info
      const allWeekSlots = await this.repository.getSlotsForWeek(week.week_id);
      const existingTimeSlots = allWeekSlots.filter(slot => slot.day_of_week === dayOfWeek);
      
      return {
        date: dto.date,
        dayOfWeek,
        weekId: week.week_id,
        isAvailable: true,
        timeSlots: existingTimeSlots.map(slot => ({
          slotId: slot.slot_id,
          startTime: this.repository.formatTimeToString(slot.start_time_local!),
          endTime: this.repository.formatTimeToString(slot.end_time_local!),
          meetingType: slot.meeting_type!,
          capacity: slot.capacity,
          isOpen: slot.is_open,
          autoAccept: slot.auto_accept,
          note: slot.note || undefined,
          bookedCount: 0, // TODO: Get actual booking count
          meetingLink: slot.meeting_link ?? undefined,
          meetingLocation: slot.meeting_location ?? undefined,
        })),
      };
    }

    // Enable the date (set is_available = true)
    // This marks that the instructor has explicitly enabled this date
    await this.repository.upsertAvailabilityDate(
      week.week_id,
      date,
      true, // is_available = true
    );

    const timeSlots: TimeSlotResponse[] = [];

    // Add time slots if provided
    if (dto.timeSlots && dto.timeSlots.length > 0) {
      for (const slotDto of dto.timeSlots) {
        const timeSlot = await this.addTimeSlot(
          instructorId,
          dto.date,
          slotDto,
        );
        timeSlots.push(timeSlot);
      }
    }

    return {
      date: dto.date,
      dayOfWeek,
      weekId: week.week_id,
      isAvailable: true, // Date was just enabled
      timeSlots,
    };
  }

  /**
   * Add a time slot to a specific date
   */
  async addTimeSlot(
    instructorId: number,
    dateStr: string,
    dto: CreateTimeSlotDto,
  ): Promise<TimeSlotResponse> {
    // Validate time
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const date = this.parseDateString(dateStr);
    const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // Use UTC day

    // Find or create the week
    const week = await this.repository.findOrCreateWeek(instructorId, date);

    // Create or update the availability date record
    // This ensures the date is tracked even when adding slots directly
    await this.repository.upsertAvailabilityDate(week.week_id, date, true);

    // Check for overlapping slots
    const hasOverlap = await this.repository.checkTimeSlotOverlap(
      week.week_id,
      dayOfWeek,
      dto.startTime,
      dto.endTime,
    );

    if (hasOverlap) {
      throw new ConflictException('Time slot overlaps with an existing slot');
    }

    const slot = await this.repository.createTimeSlot(
      week.week_id,
      dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.meetingType,
      dto.capacity,
      dto.note,
    );

    // Validate created slot has required fields
    if (!slot.start_time_local || !slot.end_time_local || !slot.meeting_type) {
      throw new BadRequestException('Created time slot has invalid data');
    }

    return {
      slotId: slot.slot_id,
      startTime: this.repository.formatTimeToString(slot.start_time_local),
      endTime: this.repository.formatTimeToString(slot.end_time_local),
      meetingType: slot.meeting_type,
      capacity: slot.capacity,
      isOpen: slot.is_open,
      autoAccept: slot.auto_accept,
      note: slot.note ?? undefined,
      bookedCount: 0,
      meetingLink: slot.meeting_link ?? undefined,
      meetingLocation: slot.meeting_location ?? undefined,
    };
  }

  /**
   * Update a time slot
   */
  async updateTimeSlot(
    instructorId: number,
    slotId: number,
    dto: UpdateTimeSlotDto,
  ): Promise<TimeSlotResponse> {
    const slot = await this.repository.getSlotById(slotId);

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    // Verify the slot belongs to this instructor
    if (!slot.week || slot.week.instructor_id !== instructorId) {
      throw new BadRequestException('This time slot does not belong to you');
    }

    // Ensure required fields exist
    if (
      !slot.start_time_local ||
      !slot.end_time_local ||
      !slot.day_of_week ||
      !slot.meeting_type ||
      !slot.week_id
    ) {
      throw new BadRequestException('Time slot has invalid data');
    }

    // If updating time, check for overlaps
    if (dto.startTime || dto.endTime) {
      const startTime =
        dto.startTime ||
        this.repository.formatTimeToString(slot.start_time_local);
      const endTime =
        dto.endTime || this.repository.formatTimeToString(slot.end_time_local);

      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }

      const hasOverlap = await this.repository.checkTimeSlotOverlap(
        slot.week_id,
        slot.day_of_week,
        startTime,
        endTime,
        slotId, // Exclude current slot from overlap check
      );

      if (hasOverlap) {
        throw new ConflictException('Time slot overlaps with an existing slot');
      }
    }

    const updatedSlot = await this.repository.updateTimeSlot(slotId, dto);

    // Ensure updated slot has required fields
    if (
      !updatedSlot.start_time_local ||
      !updatedSlot.end_time_local ||
      !updatedSlot.meeting_type
    ) {
      throw new BadRequestException('Updated time slot has invalid data');
    }

    return {
      slotId: updatedSlot.slot_id,
      startTime: this.repository.formatTimeToString(
        updatedSlot.start_time_local,
      ),
      endTime: this.repository.formatTimeToString(updatedSlot.end_time_local),
      meetingType: updatedSlot.meeting_type,
      capacity: updatedSlot.capacity,
      isOpen: updatedSlot.is_open,
      autoAccept: updatedSlot.auto_accept,
      note: updatedSlot.note ?? undefined,
      meetingLink: updatedSlot.meeting_link ?? undefined,
      meetingLocation: updatedSlot.meeting_location ?? undefined,
    };
  }

  /**
   * Delete a specific time slot
   */
  async deleteTimeSlot(instructorId: number, slotId: number): Promise<void> {
    const slot = await this.repository.getSlotById(slotId);

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    // Verify the slot belongs to this instructor
    if (!slot.week || slot.week.instructor_id !== instructorId) {
      throw new BadRequestException('This time slot does not belong to you');
    }

    await this.repository.deleteTimeSlot(slotId);
  }

  /**
   * Disable availability for a specific date
   * This sets is_available = false and removes all time slots for that date
   */
  async deleteAvailabilityDate(
    instructorId: number,
    dateStr: string,
  ): Promise<void> {
    const date = this.parseDateString(dateStr);
    const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // Use UTC day

    // Find the week (don't create if not exists)
    const week = await this.repository.findWeek(instructorId, date);

    if (!week) {
      throw new NotFoundException(
        `No availability found for instructor ${instructorId} on ${dateStr}`,
      );
    }

    // Check if the date record exists
    const dateRecord = await this.repository.findAvailabilityDate(
      week.week_id,
      date,
    );

    if (!dateRecord) {
      throw new NotFoundException(
        `No availability date found for instructor ${instructorId} on ${dateStr}`,
      );
    }

    if (!dateRecord.is_available) {
      throw new BadRequestException(
        `Date ${dateStr} is already disabled`,
      );
    }

    // Delete all time slots for this date first
    await this.repository.deleteSlotsForDate(week.week_id, dayOfWeek);

    // Disable the date (set is_available = false) instead of deleting the record
    await this.repository.upsertAvailabilityDate(
      week.week_id,
      date,
      false, // is_available = false
      dateRecord.note || undefined, // preserve existing note
    );

    // Note: We don't delete the week or date records anymore
    // All dates remain in the database, just marked as unavailable
  }

  /**
   * Bulk create availabilities (useful for initial setup)
   */
  async bulkCreateAvailability(
    instructorId: number,
    availabilities: AddAvailabilityDateDto[],
  ): Promise<AvailabilityDateResponse[]> {
    const results: AvailabilityDateResponse[] = [];

    for (const availability of availabilities) {
      const result = await this.addAvailabilityDate(instructorId, availability);
      results.push(result);
    }

    return results;
  }

  /**
   * Get statistics for instructor's availability
   */
  async getStatistics(instructorId: number): Promise<AvailabilityStatistics> {
    // Để lấy thống kê, chúng ta cần tự động tạo tuần
    const { statistics } = await this.getAvailability(instructorId, undefined, undefined, true);
    return statistics;
  }

  /**
   * Helper: Parse date string in YYYY-MM-DD format safely without timezone issues
   * Returns UTC midnight for the given date to ensure consistency with database
   */
  private parseDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create date in UTC to avoid timezone conversion issues
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  /**
   * Helper: Calculate hours between two times
   */
  private calculateHours(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    return (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
  }

  /**
   * Helper: Get date from week start and day of week
   * Uses UTC to avoid timezone issues
   */
  private getDateFromWeekAndDay(weekStart: Date, dayOfWeek: number): Date {
    const date = new Date(weekStart);
    const diff = dayOfWeek === 7 ? 6 : dayOfWeek - 1; // Monday is 1, Sunday is 7
    date.setUTCDate(date.getUTCDate() + diff);
    return date;
  }
}
