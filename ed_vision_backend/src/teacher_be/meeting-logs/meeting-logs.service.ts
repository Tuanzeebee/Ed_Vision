import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMeetingLogDto } from './dto/create-meeting-log.dto';
import {
  InstructorInfoResponse,
  StudentInSlotResponse,
  MeetingLogResponse,
} from './models/meeting-log.types';

@Injectable()
export class MeetingLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy thông tin instructor theo account_id
   */
  async getInstructorInfo(
    accountId: number,
  ): Promise<InstructorInfoResponse> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { account_id: accountId },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        department: true,
      },
    });

    if (!instructor) {
      throw new NotFoundException(
        `Không tìm thấy giảng viên với account_id: ${accountId}`,
      );
    }

    return {
      instructor_id: instructor.instructor_id,
      account_id: instructor.account_id,
      employee_code: instructor.employee_code,
      full_name: instructor.account.profile?.full_name || '',
      academic_title: instructor.academic_title || '',
      position: instructor.position || '',
      department: {
        id: instructor.department?.department_id,
        name: instructor.department?.name || '',
        code: instructor.department?.code || '',
      },
      email: instructor.account.email,
    };
  }

  /**
   * Lấy danh sách sinh viên đã đặt lịch cho slot cụ thể
   */
  async getStudentsBySlot(slotId: number): Promise<StudentInSlotResponse> {
    // Lấy thông tin slot trước
    const slot = await this.prisma.instructorDailySlot.findUnique({
      where: { slot_id: slotId },
      include: {
        date: {
          include: {
            week: {
              include: {
                instructor: {
                  include: {
                    account: {
                      include: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        appointments: {
          where: {
            status: {
              in: ['confirmed', 'pending'],
            },
          },
          include: {
            student: {
              include: {
                account: {
                  include: {
                    profile: true,
                  },
                },
                classGroup: true,
              },
            },
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException(`Không tìm thấy slot với ID: ${slotId}`);
    }

    // Lấy ngày cụ thể từ date record
    const specificDate = slot.date ? new Date(slot.date.specific_date) : new Date();
    const dayOfWeek = specificDate.getUTCDay() || 7; // Sunday = 0 -> 7

    const students = slot.appointments
      .filter((appointment) => appointment.student !== null)
      .map((appointment) => ({
        id: appointment.student!.student_id,
        student_id: appointment.student!.student_id,
        account_id: appointment.student!.account_id,
        student_code: appointment.student!.student_code,
        name: appointment.student!.account.profile?.full_name || '',
        class_name:
          appointment.student!.classGroup?.class_code || 'Chưa có lớp',
        email: appointment.student!.account.email,
        appointment_id: appointment.appointment_id,
        meeting_purpose: appointment.meeting_purpose || '',
        status: appointment.status,
        meeting_type: appointment.meeting_type,
      }));

    return {
      slot_id: slotId,
      date: specificDate.toISOString().split('T')[0],
      day_of_week: dayOfWeek,
      start_time: slot.start_time_local
        ? new Date(slot.start_time_local).toISOString().substr(11, 5)
        : '',
      end_time: slot.end_time_local
        ? new Date(slot.end_time_local).toISOString().substr(11, 5)
        : '',
      period_label: slot.period_label || '',
      meeting_location: slot.meeting_location || '',
      meeting_link: slot.meeting_link || '',
      meeting_type: slot.meeting_type || 'offline',
      students: students,
      total_students: students.length,
      capacity: slot.capacity,
    };
  }

  /**
   * Lấy danh sách sinh viên theo thời gian cụ thể
   */
  async getStudentsByTimeSlot(
    instructorId: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<StudentInSlotResponse> {
    try {
      // Parse date
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new BadRequestException('Định dạng ngày không hợp lệ');
      }

      // Tính ngày đầu tuần (Monday)
      const dayOfWeek = targetDate.getUTCDay() || 7; // Sunday = 0 -> 7
      const weekStartDate = new Date(targetDate);
      weekStartDate.setUTCDate(
        targetDate.getUTCDate() - dayOfWeek + 1,
      );
      weekStartDate.setUTCHours(0, 0, 0, 0);

      // Parse time theo GMT+0800 (ICT) để khớp với database
      // Database lưu time type theo local timezone (GMT+0800)
      const startTimeDate = new Date(`1970-01-01T${startTime}:00.000+08:00`);
      const endTimeDate = new Date(`1970-01-01T${endTime}:00.000+08:00`);

      // Tìm week và dates với slots
      const week =
        await this.prisma.instructorAvailabilityWeek.findUnique({
          where: {
            instructor_id_week_start_date: {
              instructor_id: instructorId,
              week_start_date: weekStartDate,
            },
          },
          include: {
            instructor: {
              include: {
                account: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
            instructorAvailabilityDates: {
              where: {
                specific_date: targetDate,
              },
              include: {
                slots: {
                  where: {
                    start_time_local: startTimeDate,
                    end_time_local: endTimeDate,
                  },
                  include: {
                    appointments: {
                      where: {
                        status: {
                          in: ['confirmed', 'pending'],
                        },
                      },
                      include: {
                        student: {
                          include: {
                            account: {
                              include: {
                                profile: true,
                              },
                            },
                            classGroup: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

      // Extract slot from nested structure
      const dateRecord = week?.instructorAvailabilityDates?.[0];
      const slot = dateRecord?.slots?.[0];

      if (!week || !dateRecord || !slot) {
        // Trả về empty response thay vì throw error
        return {
          slot_id: null,
          date: date,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          period_label: '',
          meeting_location: '',
          meeting_link: '',
          meeting_type: 'offline',
          students: [],
          total_students: 0,
          capacity: 0,
        };
      }

      const students = slot.appointments
        .filter((appointment) => appointment.student !== null)
        .map((appointment) => ({
          id: appointment.student!.student_id,
          student_id: appointment.student!.student_id,
          account_id: appointment.student!.account_id,
          student_code: appointment.student!.student_code,
          name: appointment.student!.account.profile?.full_name || '',
          class_name:
            appointment.student!.classGroup?.class_code || 'Chưa có lớp',
          email: appointment.student!.account.email,
          appointment_id: appointment.appointment_id,
          meeting_purpose: appointment.meeting_purpose || '',
          status: appointment.status,
          meeting_type: appointment.meeting_type,
        }));

      return {
        slot_id: slot.slot_id,
        date: date,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        period_label: slot.period_label || '',
        meeting_location: slot.meeting_location || '',
        meeting_link: slot.meeting_link || '',
        meeting_type: slot.meeting_type || 'offline',
        students: students,
        total_students: students.length,
        capacity: slot.capacity,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Lỗi khi lấy danh sách sinh viên: ${error.message}`,
      );
    }
  }

  /**
   * Lưu nhật ký cuộc họp (Tạm thời lưu vào JSON field hoặc tạo bảng mới)
   * TODO: Có thể tạo bảng MeetingLog riêng nếu cần
   */
  async createMeetingLog(
    createMeetingLogDto: CreateMeetingLogDto,
  ): Promise<MeetingLogResponse> {
    // Tạm thời trả về mock response
    // Trong thực tế, bạn có thể tạo bảng MeetingLog mới trong schema.prisma
    return {
      id: Date.now(),
      instructor_id: createMeetingLogDto.instructor_id,
      slot_id: createMeetingLogDto.slot_id,
      date: createMeetingLogDto.date,
      start_time: createMeetingLogDto.start_time,
      end_time: createMeetingLogDto.end_time,
      content: createMeetingLogDto.content,
      student_ids: createMeetingLogDto.student_ids,
      location: createMeetingLogDto.location,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Lấy danh sách nhật ký của instructor
   */
  async getMeetingLogs(
    instructorId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<MeetingLogResponse[]> {
    // TODO: Implement khi có bảng MeetingLog
    return [];
  }
}
