import { Controller, Get, Query, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AtRiskReportFilterDto } from './dto/at-risk-report-filter.dto';

@Controller('teacher/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /teacher/reports/at-risk
   * Lấy báo cáo sinh viên at-risk
   */
  @Get('at-risk')
  async getAtRiskReport(
    @Req() req: any,
    @Query() filterDto: AtRiskReportFilterDto,
  ) {
    const instructorId = req.user?.instructorId || 1;
    return this.reportsService.getAtRiskReport(instructorId, filterDto);
  }

  /**
   * GET /teacher/reports/performance
   * Lấy báo cáo hiệu suất học tập
   */
  @Get('performance')
  async getPerformanceReport(@Req() req: any) {
    const instructorId = req.user?.instructorId || 1;
    return this.reportsService.getPerformanceReport(instructorId);
  }
}
