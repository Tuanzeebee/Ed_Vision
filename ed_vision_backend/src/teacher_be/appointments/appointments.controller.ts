import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentStatusDto,
  AppointmentFilterDto,
  SetAvailabilityDto,
  BulkAvailabilityDto,
  RescheduleAppointmentDto,
} from './dto/appointment.dto';

@Controller('teacher/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * GET /teacher/appointments/dashboard
   * Lấy dashboard appointments
   */
  @Get('dashboard')
  async getAppointmentDashboard(@Req() req: any) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.getAppointmentDashboard(instructorId);
  }

  /**
   * GET /teacher/appointments
   * Lấy danh sách appointments với filter
   */
  @Get()
  async getAppointments(
    @Req() req: any,
    @Query() filterDto: AppointmentFilterDto,
  ) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.getAppointments(instructorId, filterDto);
  }

  @Get('week-overview')
  async getWeekOverview(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('instructorId') instructorIdParam?: string,
  ) {
    const instructorId = instructorIdParam
      ? parseInt(instructorIdParam, 10)
      : req.user?.instructorId || 1;
    return this.appointmentsService.getWeekOverview(
      instructorId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  async getAppointmentDetail(@Req() req: any, @Param('id') id: string) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.getAppointmentDetail(instructorId, id);
  }

  /**
   * POST /teacher/appointments
   * Tạo appointment mới
   */
  @Post()
  async createAppointment(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.createAppointment(instructorId, dto);
  }

  /**
   * PATCH /teacher/appointments/:id/status
   * Cập nhật trạng thái appointment
   */
  @Patch(':id/status')
  async updateAppointmentStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.updateAppointmentStatus(
      instructorId,
      id,
      dto,
    );
  }

  /**
   * PUT /teacher/appointments/:id/reschedule
   * Reschedule appointment
   */
  @Put(':id/reschedule')
  async rescheduleAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.rescheduleAppointment(
      instructorId,
      id,
      dto,
    );
  }

  /**
   * GET /teacher/appointments/:id/meeting-detail
   * Lấy meeting detail
   */
  @Get(':id/meeting-detail')
  async getMeetingDetail(@Req() req: any, @Param('id') id: string) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.getMeetingDetail(instructorId, id);
  }

  /**
   * GET /teacher/appointments/availability/list
   * Lấy instructor availability
   */
  @Get('availability/list')
  async getInstructorAvailability(@Req() req: any) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.getInstructorAvailability(instructorId);
  }

  /**
   * POST /teacher/appointments/availability/set
   * Set availability
   */
  @Post('availability/set')
  async setAvailability(@Req() req: any, @Body() dto: SetAvailabilityDto) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.setAvailability(instructorId, dto);
  }

  /**
   * POST /teacher/appointments/availability/bulk
   * Set bulk availability
   */
  @Post('availability/bulk')
  async setBulkAvailability(@Req() req: any, @Body() dto: BulkAvailabilityDto) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.setBulkAvailability(instructorId, dto);
  }

  /**
   * GET /teacher/appointments/availability/calendar
   * Lấy availability calendar
   */
  @Get('availability/calendar')
  async getAvailabilityCalendar(
    @Req() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const instructorId = req.user?.instructorId || 1;
    return this.appointmentsService.getAvailabilityCalendar(
      instructorId,
      parseInt(month),
      parseInt(year),
    );
  }
}
