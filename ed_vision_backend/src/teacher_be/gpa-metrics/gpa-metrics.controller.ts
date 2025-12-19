import { Controller, Get, Param } from '@nestjs/common';
import { GpaMetricsService } from './gpa-metrics.service';

@Controller('teacher/gpa-metrics')
export class GpaMetricsController {
  constructor(private readonly service: GpaMetricsService) {}

  /**
   * GET /teacher/gpa-metrics/class/:classCode
   * Trả GPA hiện tại và GPA dự đoán cho toàn bộ sinh viên của lớp
   */
  @Get('class/:classCode')
  async getClassGpaMetrics(@Param('classCode') classCode: string) {
    return this.service.getClassGpaMetrics(classCode);
  }

  /**
   * GET /teacher/gpa-metrics/student/:studentId
   * Trả chi tiết GPA hiện tại và GPA dự đoán cho một sinh viên
   */
  @Get('student/:studentId')
  async getStudentGpaMetrics(@Param('studentId') studentId: string) {
    const id = Number(studentId);
    return this.service.getStudentGpaMetrics(id);
  }
}

