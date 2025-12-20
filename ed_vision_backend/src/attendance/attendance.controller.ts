import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { VerifyAttendanceDto } from './dto/verify-attendance.dto';
import { ApproveAttemptDto } from './dto/approve-attempt.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Create a new attendance session for an appointment (Instructor only)
   */
  @Post('session')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Req() req: any,
    @Body() dto: CreateAttendanceSessionDto,
  ) {
    const accountId = req.user?.account_id;
    return this.attendanceService.createSession(accountId, dto);
  }

  /**
   * Get current QR code for a session (Instructor only)
   */
  @Get('session/:sessionId/qr')
  @UseGuards(DevAuthGuard)
  async getQRCode(@Req() req: any, @Param('sessionId') sessionId: string) {
    // Verify instructor owns the session
    const accountId = req.user?.account_id;
    // TODO: Add authorization check

    return this.attendanceService.getCurrentQR(sessionId);
  }

  /**
   * Verify attendance (Student only)
   */
  @Post('verify')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyAttendance(@Req() req: any, @Body() dto: VerifyAttendanceDto) {
    const accountId = req.user?.account_id;
    dto.accountId = accountId; // Add accountId to DTO
    return this.attendanceService.verifyAttendance(accountId, dto);
  }

  /**
   * Approve a verification attempt (Instructor only)
   */
  @Put('attempt/:attemptId/approve')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async approveAttempt(
    @Req() req: any,
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() dto: ApproveAttemptDto,
  ) {
    const accountId = req.user?.account_id;
    return this.attendanceService.approveAttempt(accountId, dto);
  }

  /**
   * Register device fingerprint (Any authenticated user)
   */
  @Post('device')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(@Req() req: any, @Body() dto: RegisterDeviceDto) {
    const accountId = req.user?.account_id;
    return this.attendanceService.registerDevice(accountId, dto);
  }

  /**
   * Get session status and attempts (Instructor or Student in session)
   */
  @Get('session/:sessionId')
  @UseGuards(DevAuthGuard)
  async getSessionStatus(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    const accountId = req.user?.account_id;
    return this.attendanceService.getSessionStatus(sessionId, accountId);
  }

  /**
   * End an attendance session (Instructor only)
   */
  @Put('session/:sessionId/end')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async endSession(@Req() req: any, @Param('sessionId') sessionId: string) {
    const accountId = req.user?.account_id;
    return this.attendanceService.endSession(sessionId, accountId);
  }

  /**
   * Get campus network configuration (Admin only - for setup)
   */
  @Get('campus-config')
  @UseGuards(DevAuthGuard)
  async getCampusConfig(@Req() req: any) {
    // TODO: Add admin role check
    const config = await this.attendanceService.getCampusConfig();
    return config;
  }

  /**
   * Update campus network configuration (Admin only)
   */
  @Post('campus-config')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCampusConfig(@Req() req: any, @Body() dto: any) {
    // TODO: Add admin role check
    return this.attendanceService.createCampusConfig(dto);
  }
}
