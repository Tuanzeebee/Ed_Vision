import { Controller, Get, Query } from '@nestjs/common';
import { UsageBehaviorService } from './usage-behavior.service';
import {
  UsageBehaviorQueryDto,
  UsageBehaviorResponse,
} from './dto/usage-behavior.dto';

@Controller('admin/dashboard/usage-behavior')
export class UsageBehaviorController {
  constructor(private readonly usageBehaviorService: UsageBehaviorService) {}

  /**
   * GET /admin/dashboard/usage-behavior?timeRange=7d|30d|90d
   *
   * Aggregated payload powering the admin "Hành vi sử dụng & Khung giờ cao điểm"
   * dashboard: heatmap (hour × weekday), average session duration per weekday,
   * and feature usage breakdown.
   */
  @Get()
  async getUsageBehavior(
    @Query() query: UsageBehaviorQueryDto,
  ): Promise<UsageBehaviorResponse> {
    return this.usageBehaviorService.getUsageBehavior(query);
  }
}
