import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsOverviewService } from './statistics-overview.service';
import {
  DashboardStatsQueryDto,
  DashboardStatsResponse,
  AccessTimeStatsResponse,
} from './dto/dashboard-stats.dto';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { RolesGuard } from 'src/auth/roles.guard';
// import { Roles } from 'src/auth/roles.decorator';

@Controller('admin/dashboard')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin', 'leader')
export class StatisticsOverviewController {
  constructor(
    private readonly statisticsOverviewService: StatisticsOverviewService,
  ) { }

  /**
   * GET /admin/dashboard/stats
   * Get dashboard statistics with optional filters
   */
  @Get('stats')
  async getDashboardStats(
    @Query() query: DashboardStatsQueryDto,
  ): Promise<DashboardStatsResponse> {
    return this.statisticsOverviewService.getDashboardStats(query);
  }

  /**
   * GET /admin/dashboard/filters/options
   * Get filter options for dashboard (schools, cohorts, programs, classes)
   */
  @Get('filters/options')
  async getFilterOptions() {
    return this.statisticsOverviewService.getFilterOptions();
  }

  /**
   * GET /admin/dashboard/access-time
   * Get access time statistics based on last_login_at
   */
  @Get('access-time')
  async getAccessTimeStats(
    @Query() query: DashboardStatsQueryDto,
  ): Promise<AccessTimeStatsResponse> {
    return this.statisticsOverviewService.getAccessTimeStats(query);
  }
  @Get('gpa-distribution')
  async getGPADistribution(@Query() query: DashboardStatsQueryDto) {
    return this.statisticsOverviewService.getGPADistribution(query);
  }

  @Get('score-distribution')
  async getScoreDistribution(@Query() query: DashboardStatsQueryDto) {
    return this.statisticsOverviewService.getScoreDistribution(query);
  }

  @Get('top-students')
  async getTopStudents(@Query() query: DashboardStatsQueryDto) {
    return this.statisticsOverviewService.getTopStudents(query);
  }

  /**
   * GET /admin/dashboard/learning-summary
   * Get learning dashboard summary (by semester & academic year)
   */
  @Get('learning-summary')
  async getLearningDashboardSummary(@Query() query: DashboardStatsQueryDto) {
    return this.statisticsOverviewService.getLearningDashboardSummary(query);
  }

  /**
   * GET /admin/dashboard/debug-sessions
   * Debug: Get recent sessions from BigQuery
   */
  @Get('debug-sessions')
  async debugSessions() {
    return this.statisticsOverviewService.debugSessions();
  }
}
