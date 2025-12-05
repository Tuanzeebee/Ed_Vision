import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateAppointmentDto,
    UpdateAppointmentStatusDto,
    AppointmentFilterDto,
    SetAvailabilityDto,
    BulkAvailabilityDto,
    RescheduleAppointmentDto,
} from './dto/appointment.dto';
import {
    Appointment,
    AppointmentListResponse,
    AppointmentDashboard,
    InstructorAvailability,
    AvailabilityCalendar,
    MeetingDetail,
} from './models/appointment.type';

@Injectable()
export class AppointmentsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Lấy dashboard appointments
     */
    async getAppointmentDashboard(instructorId: number): Promise<AppointmentDashboard> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        // Mock data - trong thực tế sẽ query từ DB
        const todaySchedule: Appointment[] = [
            {
                id: '1',
                student: {
                    id: '1',
                    code: 'SV001',
                    name: 'Nguyễn Văn A',
                    class: 'CNTT17A',
                },
                date: today.toISOString().split('T')[0],
                timeSlot: '09:00 - 10:00',
                purpose: 'Tư vấn học tập',
                status: 'confirmed',
                location: 'Phòng A101',
                requestedAt: new Date(),
            },
            {
                id: '2',
                student: {
                    id: '2',
                    code: 'SV002',
                    name: 'Trần Thị B',
                    class: 'CNTT17B',
                },
                date: today.toISOString().split('T')[0],
                timeSlot: '14:00 - 15:00',
                purpose: 'Xin phép vắng',
                status: 'confirmed',
                location: 'Phòng A101',
                requestedAt: new Date(),
            },
        ];

        const upcomingAppointments: Appointment[] = [
            {
                id: '3',
                student: {
                    id: '3',
                    code: 'SV003',
                    name: 'Lê Văn C',
                    class: 'CNTT17A',
                },
                date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
                timeSlot: '10:00 - 11:00',
                purpose: 'Hỏi về đồ án',
                status: 'confirmed',
                requestedAt: new Date(),
            },
        ];

        const recentRequests: Appointment[] = [
            {
                id: '4',
                student: {
                    id: '4',
                    code: 'SV004',
                    name: 'Phạm Thị D',
                    class: 'CNTT17B',
                },
                date: new Date(today.getTime() + 172800000).toISOString().split('T')[0],
                timeSlot: '15:00 - 16:00',
                purpose: 'Tư vấn nghề nghiệp',
                status: 'pending',
                requestedAt: new Date(),
            },
        ];

        const weeklyChart = {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [
                {
                    label: 'Số lượt hẹn',
                    data: [3, 5, 4, 6, 8, 2, 0],
                    backgroundColor: 'rgb(59, 130, 246)',
                },
            ],
        };

        return {
            summary: {
                todayAppointments: todaySchedule.length,
                weekAppointments: 28,
                pendingRequests: recentRequests.filter(a => a.status === 'pending').length,
                completedThisWeek: 15,
            },
            todaySchedule,
            upcomingAppointments,
            recentRequests,
            weeklyChart,
        };
    }

    /**
     * Lấy danh sách appointments theo filter
     */
    async getAppointments(
        instructorId: number,
        filterDto: AppointmentFilterDto,
    ): Promise<AppointmentListResponse> {
        // Mock data
        const allAppointments: Appointment[] = this.getMockAppointments();

        let filtered = allAppointments;

        // Filter by status
        if (filterDto.status && filterDto.status !== 'all') {
            filtered = filtered.filter(a => a.status === filterDto.status);
        }

        // Filter by date range
        if (filterDto.startDate) {
            filtered = filtered.filter(a => new Date(a.date) >= new Date(filterDto.startDate!));
        }
        if (filterDto.endDate) {
            filtered = filtered.filter(a => new Date(a.date) <= new Date(filterDto.endDate!));
        }

        // Filter by search
        if (filterDto.search) {
            const search = filterDto.search.toLowerCase();
            filtered = filtered.filter(
                a =>
                    a.student.name.toLowerCase().includes(search) ||
                    a.student.code.toLowerCase().includes(search) ||
                    a.purpose.toLowerCase().includes(search),
            );
        }

        // Pagination
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 10;
        const startIndex = (page - 1) * limit;
        const paginatedAppointments = filtered.slice(startIndex, startIndex + limit);

        // Calculate summary
        const summary = {
            pending: allAppointments.filter(a => a.status === 'pending').length,
            confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
            completed: allAppointments.filter(a => a.status === 'completed').length,
            rejected: allAppointments.filter(a => a.status === 'rejected').length,
            cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
        };

        return {
            appointments: paginatedAppointments,
            total: filtered.length,
            summary,
        };
    }

    /**
     * Lấy chi tiết appointment
     */
    async getAppointmentDetail(instructorId: number, appointmentId: string): Promise<Appointment> {
        const appointments = this.getMockAppointments();
        const appointment = appointments.find(a => a.id === appointmentId);

        if (!appointment) {
            throw new NotFoundException('Không tìm thấy lịch hẹn');
        }

        return appointment;
    }

    /**
     * Cập nhật trạng thái appointment
     */
    async updateAppointmentStatus(
        instructorId: number,
        appointmentId: string,
        dto: UpdateAppointmentStatusDto,
    ): Promise<Appointment> {
        // Mock implementation
        const appointment = await this.getAppointmentDetail(instructorId, appointmentId);

        return {
            ...appointment,
            status: dto.status,
            notes: dto.notes || appointment.notes,
            confirmedAt: dto.status === 'confirmed' ? new Date() : appointment.confirmedAt,
            completedAt: dto.status === 'completed' ? new Date() : appointment.completedAt,
        };
    }

    /**
     * Tạo lịch hẹn mới (từ instructor)
     */
    async createAppointment(
        instructorId: number,
        dto: CreateAppointmentDto,
    ): Promise<Appointment> {
        // Verify student exists and belongs to instructor's classes
        const student = await this.prisma.student.findUnique({
            where: { student_id: parseInt(dto.studentId) },
            include: {
                account: {
                    include: {
                        profile: true,
                    },
                },
                classGroup: true,
            },
        });

        if (!student) {
            throw new NotFoundException('Không tìm thấy sinh viên');
        }

        return {
            id: Date.now().toString(),
            student: {
                id: student.student_id.toString(),
                code: student.student_code,
                name: student.account?.profile?.full_name || 'Unknown',
                class: student.classGroup?.class_code || 'Unknown',
            },
            date: dto.date,
            timeSlot: dto.timeSlot,
            purpose: dto.purpose,
            status: 'confirmed',
            location: dto.location,
            notes: dto.notes,
            requestedAt: new Date(),
            confirmedAt: new Date(),
        };
    }

    /**
     * Reschedule appointment
     */
    async rescheduleAppointment(
        instructorId: number,
        appointmentId: string,
        dto: RescheduleAppointmentDto,
    ): Promise<Appointment> {
        const appointment = await this.getAppointmentDetail(instructorId, appointmentId);

        return {
            ...appointment,
            date: dto.newDate,
            timeSlot: dto.newTimeSlot,
            notes: dto.reason ? `${appointment.notes || ''}\nRescheduled: ${dto.reason}` : appointment.notes,
        };
    }

    /**
     * Lấy instructor availability
     */
    async getInstructorAvailability(instructorId: number): Promise<InstructorAvailability[]> {
        // Mock data
        const today = new Date();
        const availabilities: InstructorAvailability[] = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            availabilities.push({
                id: `avail-${i}`,
                date: date.toISOString().split('T')[0],
                timeSlots: [
                    '08:00 - 09:00',
                    '09:00 - 10:00',
                    '10:00 - 11:00',
                    '14:00 - 15:00',
                    '15:00 - 16:00',
                ],
                bookedSlots: i < 2 ? ['09:00 - 10:00', '14:00 - 15:00'] : [],
                location: 'Phòng A101',
                maxAppointments: 5,
                currentAppointments: i < 2 ? 2 : 0,
            });
        }

        return availabilities;
    }

    /**
     * Set instructor availability
     */
    async setAvailability(
        instructorId: number,
        dto: SetAvailabilityDto,
    ): Promise<InstructorAvailability> {
        // Mock implementation
        return {
            id: Date.now().toString(),
            date: dto.date,
            timeSlots: dto.timeSlots,
            bookedSlots: [],
            location: dto.location,
            maxAppointments: dto.maxAppointments || 10,
            currentAppointments: 0,
        };
    }

    /**
     * Set bulk availability
     */
    async setBulkAvailability(
        instructorId: number,
        dto: BulkAvailabilityDto,
    ): Promise<InstructorAvailability[]> {
        const results: InstructorAvailability[] = [];

        for (const avail of dto.availabilities) {
            const result = await this.setAvailability(instructorId, avail);
            results.push(result);
        }

        return results;
    }

    /**
     * Lấy availability calendar
     */
    async getAvailabilityCalendar(
        instructorId: number,
        month: number,
        year: number,
    ): Promise<AvailabilityCalendar> {
        const daysInMonth = new Date(year, month, 0).getDate();
        const days: AvailabilityCalendar['days'] = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = date.toISOString().split('T')[0];

            days.push({
                date: dateStr,
                isAvailable: day % 7 !== 0 && day % 7 !== 6, // Not weekend
                slots: 5,
                bookedSlots: Math.floor(Math.random() * 3),
                appointments: [],
            });
        }

        return {
            month: new Date(year, month - 1).toLocaleString('vi-VN', { month: 'long' }),
            year,
            days,
        };
    }

    async getWeekOverview(
        instructorId: number,
        startDate?: string,
        endDate?: string,
    ): Promise<any> {
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

        // Flatten slots from all dates
        const allSlots: any[] = [];
        for (const dateRecord of week?.instructorAvailabilityDates ?? []) {
            for (const slot of dateRecord.slots) {
                allSlots.push({ ...slot, date: dateRecord.specific_date });
            }
        }

        const availableSlots = allSlots.map((s: any) => {
            const dateStr = formatDate(s.date);
            const start = formatTime(s.start_time_local);
            const end = formatTime(s.end_time_local);
            return { date: dateStr, time: `${start} - ${end}` };
        });

        const slotIds = allSlots.map((s: any) => s.slot_id);
        const appointments = slotIds.length
            ? await this.prisma.appointment.findMany({
                  where: {
                      slot_id: { in: slotIds },
                      status: { in: ['pending', 'confirmed'] },
                  },
                  include: {
                      slot: true,
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

        const bookings = appointments.map((a: any) => {
            const s = allSlots.find((x: any) => x.slot_id === a.slot_id);
            const dateStr = s?.date ? formatDate(s.date) : '';
            const timeStr = `${formatTime(s?.start_time_local)} - ${formatTime(s?.end_time_local)}`;
            const isStudent = (a.booker_role || '').toLowerCase() === 'student';
            const studentName = a.student?.account?.profile?.full_name || null;
            const className = a.student?.classGroup?.class_code || undefined;
            const parentDisplayName = a.appointmentContact?.contact_name || a.booker?.profile?.full_name || 'Unknown';
            const avatar = isStudent
                ? a.student?.account?.profile?.avatar_url || null
                : a.booker?.profile?.avatar_url || null;
            return {
                id: a.appointment_id,
                date: dateStr,
                time: timeStr,
                name: isStudent ? (studentName || 'Unknown') : parentDisplayName,
                bookerType: isStudent ? 'student' : 'parent',
                class: isStudent ? className : undefined,
                studentName: !isStudent ? studentName || undefined : undefined,
                type: (a.meeting_type as any) === 'online' ? 'online' : 'offline',
                avatar,
            };
        });

        return {
            weekStart: formatDate(weekStartDate),
            weekEnd: formatDate(weekEndDate),
            availableSlots,
            bookings,
        };
    }

    /**
     * Lấy meeting detail
     */
    async getMeetingDetail(instructorId: number, appointmentId: string): Promise<MeetingDetail> {
        const appointment = await this.getAppointmentDetail(instructorId, appointmentId);

        return {
            id: appointmentId,
            appointment,
            agenda: [
                'Thảo luận về kết quả học tập học kỳ vừa qua',
                'Đánh giá điểm mạnh và điểm cần cải thiện',
                'Lập kế hoạch học tập cho học kỳ tiếp theo',
            ],
            discussionPoints: [
                'Kết quả học tập: GPA 3.2/4.0',
                'Môn học cần chú ý: Cấu trúc dữ liệu',
                'Tham gia hoạt động ngoại khóa tích cực',
            ],
            actionItems: [
                {
                    id: '1',
                    description: 'Ôn tập lại kiến thức Cấu trúc dữ liệu',
                    assignedTo: appointment.student.name,
                    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                    status: 'pending',
                },
                {
                    id: '2',
                    description: 'Tham gia nhóm học tập môn CTDL',
                    assignedTo: appointment.student.name,
                    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
                    status: 'pending',
                },
            ],
            meetingNotes: '',
            attachments: [],
            followUp: {
                date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                notes: 'Gặp lại sau 1 tháng để đánh giá tiến độ',
            },
        };
    }

    /**
     * Helper: Get mock appointments
     */
    private getMockAppointments(): Appointment[] {
        const today = new Date();

        return [
            {
                id: '1',
                student: {
                    id: '1',
                    code: 'SV001',
                    name: 'Nguyễn Văn A',
                    class: 'CNTT17A',
                },
                date: today.toISOString().split('T')[0],
                timeSlot: '09:00 - 10:00',
                purpose: 'Tư vấn học tập',
                status: 'confirmed',
                location: 'Phòng A101',
                requestedAt: new Date(today.getTime() - 86400000),
                confirmedAt: new Date(today.getTime() - 43200000),
            },
            {
                id: '2',
                student: {
                    id: '2',
                    code: 'SV002',
                    name: 'Trần Thị B',
                    class: 'CNTT17B',
                },
                date: today.toISOString().split('T')[0],
                timeSlot: '14:00 - 15:00',
                purpose: 'Xin phép vắng',
                status: 'pending',
                requestedAt: new Date(today.getTime() - 3600000),
            },
            {
                id: '3',
                student: {
                    id: '3',
                    code: 'SV003',
                    name: 'Lê Văn C',
                    class: 'CNTT17A',
                },
                date: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
                timeSlot: '10:00 - 11:00',
                purpose: 'Hỏi về đồ án',
                status: 'completed',
                requestedAt: new Date(today.getTime() - 172800000),
                confirmedAt: new Date(today.getTime() - 129600000),
                completedAt: new Date(today.getTime() - 86400000),
            },
        ];
    }
}
