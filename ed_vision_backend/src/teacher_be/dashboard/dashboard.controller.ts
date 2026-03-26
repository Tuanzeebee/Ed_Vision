import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardResponse } from './models/dashboard-stats.type';
import { PrismaService } from '../../prisma/prisma.service';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';

@Controller('teacher/dashboard')
@UseGuards(DevAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Helper: Lấy instructor_id từ account_id
   */
  private async getInstructorIdFromAccount(
    accountId: number,
  ): Promise<number | null> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { account_id: accountId },
      select: { instructor_id: true },
    });
    return instructor?.instructor_id || null;
  }

  /**
   * GET /teacher/dashboard/stats
   * Lấy thống kê tổng quan cho dashboard giảng viên
   */
  @Get('stats')
  async getDashboardStats(
    @Query() filterDto: DashboardFilterDto,
    @Req() req: any,
  ): Promise<DashboardResponse> {
    // Lấy account_id từ JWT token (req.user được populate bởi DevAuthGuard)
    const accountId = req.user?.account_id;

    if (!accountId) {
      throw new Error('Account ID not found in request');
    }

    const instructorId = await this.getInstructorIdFromAccount(accountId);

    if (!instructorId) {
      throw new Error(`Account ${accountId} is not linked to an instructor`);
    }

    return this.dashboardService.getDashboardStats(instructorId, filterDto);
  }

  /**
   * GET /teacher/dashboard/filter-options
   * Lấy danh sách options cho các filter dropdown
   */
  @Get('filter-options')
  async getFilterOptions(@Req() req: any) {
    const accountId = req.user?.account_id;

    if (!accountId) {
      throw new Error('Account ID not found in request');
    }

    const instructorId = await this.getInstructorIdFromAccount(accountId);

    if (!instructorId) {
      throw new Error(`Account ${accountId} is not linked to an instructor`);
    }

    return this.dashboardService.getFilterOptions(instructorId);
  }
}
