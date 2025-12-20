import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ProgressTrackingService } from './progress-tracking.service';
import { ProgressFilterDto } from './dto/progress-filter.dto';
import {
  ProgressTrackingResponse,
  TimelineMilestone,
} from './models/progress.type';

@Controller('teacher/progress')
export class ProgressTrackingController {
  constructor(
    private readonly progressTrackingService: ProgressTrackingService,
  ) {}

  /**
   * GET /teacher/progress/tracking
   * Lấy dữ liệu theo dõi tiến độ với các milestones
   */
  @Get('tracking')
  async getProgressTracking(
    @Query() filterDto: ProgressFilterDto,
    @Req() req: any,
  ): Promise<ProgressTrackingResponse> {
    const instructorId = req.user?.instructorId || 1;
    return this.progressTrackingService.getProgressTracking(
      instructorId,
      filterDto,
    );
  }

  /**
   * GET /teacher/progress/milestone/:id
   * Lấy chi tiết một milestone cụ thể
   */
  @Get('milestone/:id')
  async getMilestoneDetail(
    @Param('id', ParseIntPipe) milestoneId: number,
    @Req() req: any,
  ): Promise<TimelineMilestone> {
    const instructorId = req.user?.instructorId || 1;
    return this.progressTrackingService.getMilestoneDetail(
      milestoneId,
      instructorId,
    );
  }
}
