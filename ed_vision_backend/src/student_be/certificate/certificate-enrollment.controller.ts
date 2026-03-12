import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { CertificateEnrollmentService } from './certificate-enrollment.service';
import {
  CreateEnrollmentDto,
  CompleteTopicDto,
  EnrollmentResponseDto,
} from './dto/certificate.dto';

@Controller('student/certificate')
@UseGuards(DevAuthGuard)
export class CertificateEnrollmentController {
  constructor(private readonly service: CertificateEnrollmentService) {}

  /**
   * GET /student/certificate/enrollment?certType=ielts
   * Returns the current ACTIVE enrollment for the given cert, or null.
   */
  @Get('enrollment')
  async getEnrollment(
    @Request() req,
    @Query('certType') certType: string,
  ): Promise<EnrollmentResponseDto | null> {
    return this.service.getEnrollment(req.user.account_id, certType);
  }

  /**
   * GET /student/certificate/enrollments
   * Returns ALL enrollments (active + completed) for the student.
   */
  @Get('enrollments')
  async getAllEnrollments(@Request() req): Promise<EnrollmentResponseDto[]> {
    return this.service.getAllEnrollments(req.user.account_id);
  }

  /**
   * POST /student/certificate/enroll
   * Enroll in a certificate band (called after student confirms band selection).
   */
  @Post('enroll')
  @HttpCode(HttpStatus.CREATED)
  async createEnrollment(
    @Request() req,
    @Body() dto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    return this.service.createEnrollment(req.user.account_id, dto);
  }

  /**
   * PATCH /student/certificate/enrollment/:id/complete-topic
   * Mark a single topic as completed for the given enrollment.
   */
  @Patch('enrollment/:id/complete-topic')
  async completeTopic(
    @Request() req,
    @Param('id', ParseIntPipe) enrollmentId: number,
    @Body() dto: CompleteTopicDto,
  ): Promise<EnrollmentResponseDto> {
    return this.service.completeTopic(req.user.account_id, enrollmentId, dto);
  }

  /**
   * PATCH /student/certificate/enrollment/:id/complete
   * Manually mark the entire band as completed.
   */
  @Patch('enrollment/:id/complete')
  async completeBand(
    @Request() req,
    @Param('id', ParseIntPipe) enrollmentId: number,
  ): Promise<EnrollmentResponseDto> {
    return this.service.completeBand(req.user.account_id, enrollmentId);
  }
}
