import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AcceptAppointmentDto } from './dto/accept-appointment.dto';
import { RejectAppointmentDto } from './dto/reject-appointment.dto';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Create a new appointment (student or parent)
   */
  @Post()
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    const accountId = req.user?.account_id;
    return this.bookingService.createAppointment(accountId, dto);
  }

  /**
   * List appointments of the current account
   */
  @Get()
  @UseGuards(DevAuthGuard)
  async list(@Req() req: any) {
    const accountId = req.user?.account_id;
    return this.bookingService.listAppointmentsForAccount(accountId);
  }

  /**
   * Cancel an appointment (booker or instructor)
   */
  @Delete(':id')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('reason') reason?: string,
  ) {
    const accountId = req.user?.account_id;
    await this.bookingService.cancelAppointment(accountId, id, reason);
  }

  /**
   * Get slot details for confirmation UI
   */
  @Get('slot/:id')
  async getSlot(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.getSlotDetails(id);
  }

  /**
   * @deprecated Use /profile/student instead for full profile data
   * Get basic student info for booking context only
   */
  @Get('me/student')
  @UseGuards(DevAuthGuard)
  async getMeStudent(@Req() req: any) {
    const accountId = req.user?.account_id;
    const student = await this.bookingService.getStudentForAccount(accountId);
    return { student: student ?? null };
  }

  /**
   * @deprecated Use /profile/parent instead for full profile data
   * Get basic parent info for booking context only
   */
  @Get('me/parent')
  @UseGuards(DevAuthGuard)
  async getMeParent(@Req() req: any) {
    const accountId = req.user?.account_id;
    const parent = await this.bookingService.getParentForAccount(accountId);
    return { parent: parent ?? null };
  }

  @Get('me/parent/students')
  @UseGuards(DevAuthGuard)
  async getParentStudents(@Req() req: any) {
    const accountId = req.user?.account_id;
    const students =
      await this.bookingService.getStudentsForParentAccount(accountId);
    return { students };
  }

  /**
   * Debug endpoint — returns a sample student JSON so frontend can be tested without auth/db
   */
  @Get('debug/student-sample')
  async debugStudentSample() {
    return {
      student: {
        student_id: 1234,
        full_name: 'Nguyễn Văn A',
        student_code: '20250001',
        className: 'K26-CNTT',
        verified: true,
      },
    };
  }

  /**
   * Get appointments for the current instructor (teacher)
   * Query params:
   *   - status (optional) - filter by status (pending, confirmed, rejected, canceled)
   *   - bookerRole (optional) - filter by booker role (parent, student)
   */
  @Get('instructor/requests')
  @UseGuards(DevAuthGuard)
  async getInstructorRequests(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('bookerRole') bookerRole?: string,
  ) {
    const accountId = req.user?.account_id;
    const statusFilter = status ? status.split(',') : undefined;
    return this.bookingService.getInstructorAppointments(
      accountId,
      statusFilter,
      bookerRole,
    );
  }

  /**
   * Accept an appointment (instructor only)
   */
  @Put(':id/accept')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptAppointment(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AcceptAppointmentDto,
  ) {
    const accountId = req.user?.account_id;
    return this.bookingService.acceptAppointment(accountId, id, dto);
  }

  /**
   * Reject an appointment (instructor only)
   */
  @Put(':id/reject')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async rejectAppointment(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectAppointmentDto,
  ) {
    const accountId = req.user?.account_id;
    return this.bookingService.rejectAppointment(accountId, id, dto);
  }

  /**
   * Update appointment status (instructor or admin)
   */
  @Put(':id/status')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    const accountId = req.user?.account_id;
    return this.bookingService.updateAppointmentStatus(
      accountId,
      id,
      body.status,
    );
  }
}
