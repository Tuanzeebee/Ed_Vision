import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeetingLogsService } from './meeting-logs.service';
import { CreateMeetingLogDto } from './dto/create-meeting-log.dto';

@Controller('teacher/meeting-logs')
export class MeetingLogsController {
  constructor(private readonly meetingLogsService: MeetingLogsService) {}

  /**
   * GET /teacher/meeting-logs/instructor/:accountId
   * Lấy thông tin instructor theo account_id
   */
  @Get('instructor/:accountId')
  async getInstructorInfo(
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    return this.meetingLogsService.getInstructorInfo(accountId);
  }

  /**
   * GET /teacher/meeting-logs/slot/:slotId/students
   * Lấy danh sách sinh viên đã đặt lịch cho slot cụ thể
   */
  @Get('slot/:slotId/students')
  async getStudentsBySlot(@Param('slotId', ParseIntPipe) slotId: number) {
    return this.meetingLogsService.getStudentsBySlot(slotId);
  }

  /**
   * GET /teacher/meeting-logs/time-slot
   * Lấy danh sách sinh viên đã đặt lịch theo thời gian cụ thể
   * Query params: instructorId, date, startTime, endTime
   */
  @Get('time-slot')
  async getStudentsByTimeSlot(
    @Query('instructorId', ParseIntPipe) instructorId: number,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.meetingLogsService.getStudentsByTimeSlot(
      instructorId,
      date,
      startTime,
      endTime,
    );
  }

  /**
   * POST /teacher/meeting-logs
   * Lưu nhật ký cuộc họp/cố vấn
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMeetingLog(@Body() createMeetingLogDto: CreateMeetingLogDto) {
    return this.meetingLogsService.createMeetingLog(createMeetingLogDto);
  }

  /**
   * GET /teacher/meeting-logs/instructor/:instructorId/logs
   * Lấy danh sách nhật ký của instructor
   */
  @Get('instructor/:instructorId/logs')
  async getMeetingLogs(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.meetingLogsService.getMeetingLogs(
      instructorId,
      startDate,
      endDate,
    );
  }
}
