import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorFilterDto } from './dto/instructor-filter.dto';
import { InstructorResponse } from './models/instructor-response.type';
import { InstructorListResponse } from './models/instructor-list.type';
import { InstructorOnlineStats } from './models/instructor-stats.type';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InstructorManagementService {
  constructor(private prisma: PrismaService) {}

  async getOnlineStats(): Promise<InstructorOnlineStats> {
    // Get total instructor count
    const totalCount = await this.prisma.instructor.count();

    // Get online instructor count - count instructors whose account is logged in
    const onlineResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "Instructor" i
      INNER JOIN "Account" a ON i.account_id = a.account_id
      WHERE a.last_login_at IS NOT NULL
        AND (a.last_logout_at IS NULL OR a.last_login_at > a.last_logout_at)
    `;

    const onlineCount = Number(onlineResult[0]?.count || 0);

    return {
      totalCount,
      onlineCount,
    };
  }

  async findAll(
    filterDto: InstructorFilterDto,
  ): Promise<InstructorListResponse> {
    const {
      search,
      departmentId,
      academicTitle,
      status,
      page = 1,
      limit = 10,
    } = filterDto;

    const where: {
      OR?: Array<{
        employee_code?: { contains: string; mode: 'insensitive' };
        account?: {
          email?: { contains: string; mode: 'insensitive' };
          profile?: { full_name?: { contains: string; mode: 'insensitive' } };
        };
      }>;
      department_id?: number;
      academic_title?: { contains: string; mode: 'insensitive' };
      status?: string;
    } = {};

    if (search) {
      where.OR = [
        { employee_code: { contains: search, mode: 'insensitive' } },
        { account: { email: { contains: search, mode: 'insensitive' } } },
        {
          account: {
            profile: { full_name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    if (departmentId) {
      where.department_id = departmentId;
    }

    if (academicTitle) {
      where.academic_title = { contains: academicTitle, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    const total = await this.prisma.instructor.count({ where });

    const instructors = await this.prisma.instructor.findMany({
      where,
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        department: true,
        adviserAssignments: {
          select: {
            class_id: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { instructor_id: 'desc' },
    });

    const data: InstructorResponse[] = instructors.map((instructor) => ({
      instructorId: instructor.instructor_id,
      accountId: instructor.account_id,
      employeeCode: instructor.employee_code,
      email: instructor.account.email,
      academicTitle: instructor.academic_title || undefined,
      position: instructor.position || undefined,
      status: instructor.status || 'active',
      advisingClassCount: instructor.adviserAssignments.length,
      createdAt: instructor.account.created_at.toISOString(),
      profile: instructor.account.profile
        ? {
            fullName: instructor.account.profile.full_name,
            dateOfBirth:
              instructor.account.profile.date_of_birth?.toISOString(),
            gender: instructor.account.profile.gender || undefined,
            address: instructor.account.profile.address || undefined,
            avatarUrl: instructor.account.profile.avatar_url || undefined,
          }
        : undefined,
      department: instructor.department
        ? {
            departmentId: instructor.department.department_id,
            departmentName: instructor.department.name,
            departmentCode: instructor.department.code || undefined,
          }
        : undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<InstructorResponse> {
    // Try to find by instructor_id first, then by account_id
    let instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: id },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        department: true,
      },
    });

    // If not found by instructor_id, try account_id
    if (!instructor) {
      instructor = await this.prisma.instructor.findUnique({
        where: { account_id: id },
        include: {
          account: {
            include: {
              profile: true,
            },
          },
          department: true,
        },
      });
    }

    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${id} not found`);
    }

    return {
      instructorId: instructor.instructor_id,
      accountId: instructor.account_id,
      employeeCode: instructor.employee_code,
      email: instructor.account.email,
      academicTitle: instructor.academic_title || undefined,
      position: instructor.position || undefined,
      status: instructor.status || 'active',
      createdAt: instructor.account.created_at.toISOString(),
      profile: instructor.account.profile
        ? {
            fullName: instructor.account.profile.full_name,
            dateOfBirth:
              instructor.account.profile.date_of_birth?.toISOString(),
            gender: instructor.account.profile.gender || undefined,
            address: instructor.account.profile.address || undefined,
            avatarUrl: instructor.account.profile.avatar_url || undefined,
          }
        : undefined,
      department: instructor.department
        ? {
            departmentId: instructor.department.department_id,
            departmentName: instructor.department.name,
            departmentCode: instructor.department.code || undefined,
          }
        : undefined,
    };
  }

  async create(
    createInstructorDto: CreateInstructorDto,
  ): Promise<InstructorResponse> {
    const { password, fullName, employeeCode, ...instructorData } =
      createInstructorDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacherRole = await this.prisma.role.findUnique({
      where: { code: 'teacher' },
    });

    if (!teacherRole) {
      throw new NotFoundException('Teacher role not found');
    }

    const account = await this.prisma.account.create({
      data: {
        email: createInstructorDto.email,
        password_hash: hashedPassword,
        role_id: teacherRole.id,
        status: 'active',
        profile: {
          create: {
            full_name: fullName,
            date_of_birth: instructorData.dateOfBirth
              ? new Date(instructorData.dateOfBirth)
              : undefined,
            gender: instructorData.gender,
            address: instructorData.address,
          },
        },
        instructor: {
          create: {
            employee_code: employeeCode,
            academic_title: instructorData.academicTitle,
            position: instructorData.position,
            department_id: instructorData.departmentId,
            status: 'active',
          },
        },
      },
      include: {
        instructor: true,
      },
    });

    return this.findOne(account.instructor!.instructor_id);
  }

  async update(
    id: number,
    updateInstructorDto: UpdateInstructorDto,
  ): Promise<InstructorResponse> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: id },
      include: { account: { include: { profile: true } } },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${id} not found`);
    }

    await this.prisma.instructor.update({
      where: { instructor_id: id },
      data: {
        academic_title: updateInstructorDto.academicTitle,
        position: updateInstructorDto.position,
        department_id: updateInstructorDto.departmentId,
        status: updateInstructorDto.status,
      },
    });

    if (instructor.account.profile) {
      await this.prisma.profile.update({
        where: { profile_id: instructor.account.profile.profile_id },
        data: {
          full_name: updateInstructorDto.fullName,
          date_of_birth: updateInstructorDto.dateOfBirth
            ? new Date(updateInstructorDto.dateOfBirth)
            : undefined,
          gender: updateInstructorDto.gender,
          address: updateInstructorDto.address,
        },
      });
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: id },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${id} not found`);
    }

    await this.prisma.account.delete({
      where: { account_id: instructor.account_id },
    });
  }

  async getInstructorSchedule(
    instructorId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    const parseDate = (s?: string) => {
      if (!s) return null;
      const [y, m, d] = s.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    };
    const mondayFrom = (date: Date) => {
      const day = date.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() + diff);
      monday.setUTCHours(0, 0, 0, 0);
      return monday;
    };
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const dt = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${dt}`;
    };
    const formatTime = (t: any) => {
      if (!t) return '';
      try {
        const dt = new Date(t);
        const hh = dt.getUTCHours().toString().padStart(2, '0');
        const mm = dt.getUTCMinutes().toString().padStart(2, '0');
        return `${hh}:${mm}`;
      } catch {
        return '';
      }
    };

    const now = new Date();
    const targetStart = parseDate(startDate) ?? now;
    const weekStartDate = mondayFrom(targetStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);

    // Get instructor's weekly availability with slots
    const week = await this.prisma.instructorAvailabilityWeek.findFirst({
      where: {
        instructor_id: instructorId,
        week_start_date: weekStartDate,
      },
      include: {
        instructorAvailabilityDates: {
          include: {
            slots: true,
          },
        },
      },
    });

    const availabilityDates = week?.instructorAvailabilityDates ?? [];
    const allSlots = availabilityDates.flatMap((ad) => ad.slots);
    const slotIds = allSlots.map((s: any) => s.slot_id);

    // Get appointments for these slots
    const appointments = slotIds.length
      ? await this.prisma.appointment.findMany({
          where: {
            slot_id: { in: slotIds },
          },
          include: {
            slot: {
              include: {
                date: true,
              },
            },
            student: {
              include: {
                account: { include: { profile: true } },
                classGroup: true,
              },
            },
            booker: { include: { profile: true } },
            appointmentContact: true,
          },
        })
      : [];

    // Build schedule for each day
    const result: any[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setUTCDate(weekStartDate.getUTCDate() + i);
      const dateStr = formatDate(currentDate);

      // Find availability and slots for this day
      const dayAvailability = availabilityDates.find((ad) => {
        const adDate = new Date(ad.specific_date);
        return (
          adDate.getUTCFullYear() === currentDate.getUTCFullYear() &&
          adDate.getUTCMonth() === currentDate.getUTCMonth() &&
          adDate.getUTCDate() === currentDate.getUTCDate()
        );
      });

      const daySlots = dayAvailability?.slots ?? [];
      const daySchedule: any[] = daySlots.map((slot: any) => {
        const startTime = formatTime(slot.start_time_local);
        const endTime = formatTime(slot.end_time_local);

        const appointment = appointments.find(
          (a: any) => a.slot_id === slot.slot_id,
        );

        return {
          slotId: slot.slot_id,
          startTime,
          endTime,
          isOpen: slot.is_open ?? true,
          appointment: appointment
            ? {
                appointmentId: appointment.appointment_id,
                bookerName:
                  appointment.booker_role?.toLowerCase() === 'student'
                    ? appointment.student?.account?.profile?.full_name ||
                      'Unknown'
                    : appointment.appointmentContact?.contact_name ||
                      appointment.booker?.profile?.full_name ||
                      'Unknown',
                bookerRole: appointment.booker_role || 'unknown',
                studentName:
                  appointment.student?.account?.profile?.full_name || undefined,
                meetingPurpose: appointment.meeting_purpose || undefined,
                status: appointment.status || 'pending',
                meetingType: appointment.meeting_type || 'offline',
              }
            : undefined,
        };
      });

      result.push({
        date: dateStr,
        slots: daySchedule,
      });
    }

    return result;
  }

  /**
   * Get filter options for instructor schedule
   * - meetingPurposes: distinct meeting_purpose from appointments
   * - meetingTypes: all available meeting types from enum
   * - statuses: all appointment statuses
   */
  async getScheduleFilterOptions(instructorId: number): Promise<{
    meetingPurposes: string[];
    meetingTypes: string[];
    statuses: string[];
  }> {
    // Get distinct meeting purposes from appointments of this instructor
    const appointments = await this.prisma.appointment.findMany({
      where: {
        instructor_id: instructorId,
        meeting_purpose: { not: null },
      },
      select: {
        meeting_purpose: true,
      },
      distinct: ['meeting_purpose'],
    });

    const meetingPurposes = appointments
      .map((a) => a.meeting_purpose)
      .filter((p): p is string => p !== null && p.trim() !== '')
      .sort();

    // Meeting types from the MeetingType enum in schema
    const meetingTypes = ['online', 'offline', 'both'];

    // Common appointment statuses
    const statuses = [
      'pending',
      'confirmed',
      'completed',
      'cancelled',
      'no_show',
    ];

    return {
      meetingPurposes,
      meetingTypes,
      statuses,
    };
  }

  /**
   * Get upcoming appointments for an instructor (next 7 days)
   */
  async getUpcomingAppointments(
    instructorId: number,
    page: number = 1,
    limit: number = 5,
  ): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);

    const where = {
      instructor_id: instructorId,
      status: { in: ['pending', 'confirmed'] },
      slot: {
        date: {
          specific_date: { lte: sevenDaysLater },
        },
      },
    };

    const total = await this.prisma.appointment.count({ where });

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        slot: {
          include: {
            date: true,
          },
        },
        student: {
          include: {
            account: { include: { profile: true } },
          },
        },
        booker: { include: { profile: true } },
        appointmentContact: true,
      },
      orderBy: [
        { slot: { date: { specific_date: 'asc' } } },
        { slot: { start_time_local: 'asc' } },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    const formatTime = (t: any) => {
      if (!t) return '';
      try {
        const dt = new Date(t);
        return `${dt.getUTCHours().toString().padStart(2, '0')}:${dt.getUTCMinutes().toString().padStart(2, '0')}`;
      } catch {
        return '';
      }
    };

    const formatDate = (date: Date) => {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const data = appointments.map((apt) => {
      const slotDate = new Date(apt.slot.date.specific_date);
      return {
        id: apt.appointment_id.toString(),
        time: `${formatTime(apt.slot.start_time_local)} - ${formatTime(apt.slot.end_time_local)}`,
        date: formatDate(slotDate),
        name:
          apt.booker_role?.toLowerCase() === 'student'
            ? apt.student?.account?.profile?.full_name || 'Unknown'
            : apt.appointmentContact?.contact_name ||
              apt.booker?.profile?.full_name ||
              'Unknown',
        bookerRole: apt.booker_role,
        meetingPurpose: apt.meeting_purpose,
        format: apt.meeting_type,
        status: apt.status,
        description: apt.meeting_purpose || '',
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get appointment history for an instructor
   */
  async getAppointmentHistory(
    instructorId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: any[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const where = {
      instructor_id: instructorId,
      status: { in: ['completed', 'cancelled', 'no_show'] },
    };

    const total = await this.prisma.appointment.count({ where });

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        slot: {
          include: {
            date: true,
          },
        },
        student: {
          include: {
            account: { include: { profile: true } },
          },
        },
        booker: { include: { profile: true } },
        appointmentContact: true,
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formatTime = (t: any) => {
      if (!t) return '';
      try {
        const dt = new Date(t);
        return `${dt.getUTCHours().toString().padStart(2, '0')}:${dt.getUTCMinutes().toString().padStart(2, '0')}`;
      } catch {
        return '';
      }
    };

    const formatDate = (date: Date) => {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const data = appointments.map((apt) => {
      const slotDate = new Date(apt.slot.date.specific_date);
      return {
        id: apt.appointment_id.toString(),
        time: `${formatTime(apt.slot.start_time_local)} - ${formatTime(apt.slot.end_time_local)}`,
        date: formatDate(slotDate),
        name:
          apt.booker_role?.toLowerCase() === 'student'
            ? apt.student?.account?.profile?.full_name || 'Unknown'
            : apt.appointmentContact?.contact_name ||
              apt.booker?.profile?.full_name ||
              'Unknown',
        bookerRole: apt.booker_role,
        relationship: apt.booker_role === 'student' ? 'Sinh viên' : 'Phụ huynh',
        meetingPurpose: apt.meeting_purpose,
        format: apt.meeting_type,
        status: apt.status,
        description: apt.meeting_purpose || '',
        result: apt.status === 'cancelled' ? apt.cancel_reason : '',
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get appointment statistics for chart (last 6 months)
   */
  async getAppointmentStats(instructorId: number): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  }> {
    const now = new Date();
    const labels: string[] = [];
    const months: Date[] = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`T${date.getMonth() + 1}`);
      months.push(date);
    }

    // Get all appointments for this instructor in the last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        instructor_id: instructorId,
        created_at: { gte: sixMonthsAgo },
      },
      select: {
        created_at: true,
        booker_role: true,
        meeting_purpose: true,
      },
    });

    // Count by month and category
    const parentData: number[] = Array(6).fill(0);
    const studentData: number[] = Array(6).fill(0);
    const otherData: number[] = Array(6).fill(0);

    appointments.forEach((apt) => {
      const aptMonth = apt.created_at.getMonth();
      const aptYear = apt.created_at.getFullYear();

      for (let i = 0; i < months.length; i++) {
        if (
          months[i].getMonth() === aptMonth &&
          months[i].getFullYear() === aptYear
        ) {
          if (apt.booker_role === 'parent') {
            parentData[i]++;
          } else if (apt.booker_role === 'student') {
            studentData[i]++;
          } else {
            otherData[i]++;
          }
          break;
        }
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Phụ huynh',
          data: parentData,
          backgroundColor: '#a855f7',
          borderColor: '#9333ea',
          borderWidth: 2,
        },
        {
          label: 'Sinh viên',
          data: studentData,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 2,
        },
        {
          label: 'Khác',
          data: otherData,
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          borderWidth: 2,
        },
      ],
    };
  }
}
