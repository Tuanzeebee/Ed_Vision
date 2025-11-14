import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardResponse } from './models/dashboard-stats.type';

@Controller('teacher/dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    /**
     * GET /teacher/dashboard/stats
     * Lấy thống kê tổng quan cho dashboard giảng viên
     */
    @Get('stats')
    async getDashboardStats(
        @Query() filterDto: DashboardFilterDto,
        @Req() req: any,
    ): Promise<DashboardResponse> {
        // Lấy instructorId từ request (sau khi qua auth guard)
        // TODO: Implement proper authentication guard
        const instructorId = req.user?.instructorId || 1; // Mock for now

        return this.dashboardService.getDashboardStats(instructorId, filterDto);
    }
}
