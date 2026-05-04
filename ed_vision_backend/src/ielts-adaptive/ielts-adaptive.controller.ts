import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';
import { IeltsAdaptiveService } from './services/ielts-adaptive.service';
import {
  CreateRoadmapDto,
  RoadmapResponseDto,
  LessonResponseDto,
  SubmitPracticeDto,
  PracticeSessionResponseDto,
  CreateBandTestDto,
  SubmitBandTestDto,
  BandTestResponseDto,
  SkillProgressResponseDto,
  UpdateRoadmapTargetsDto,
} from './dto/ielts-adaptive.dto';

@Controller('ielts-adaptive')
export class IeltsAdaptiveController {
  constructor(private readonly service: IeltsAdaptiveService) {}

  @Get('health')
  health() {
    return {
      ok: true,
      module: 'ielts-adaptive',
      time: new Date().toISOString(),
    };
  }

  private resolveAccountId(req: any, accountId?: string): number {
    const reqAccountId = Number(req?.user?.account_id ?? req?.user?.id);
    if (Number.isFinite(reqAccountId) && reqAccountId > 0) {
      return reqAccountId;
    }

    const fallback = Number(accountId);
    if (Number.isFinite(fallback) && fallback > 0) {
      return fallback;
    }

    throw new BadRequestException(
      'Unable to resolve account id from auth context or query fallback',
    );
  }

  // ============================================
  // ROADMAP ENDPOINTS (ME)
  // ============================================

  @UseGuards(DevAuthGuard)
  @Get('me/roadmap')
  async getMyRoadmap(@Req() req: any): Promise<any> {
    const accountId = Number(req?.user?.account_id ?? req?.user?.id);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      throw new BadRequestException(
        'Unable to resolve account id from JWT token',
      );
    }
    return this.service.getOrCreateRoadmapForAccount(accountId);
  }

  @UseGuards(DevAuthGuard)
  @Post('me/roadmap/generate')
  async generateMyRoadmap(
    @Req() req: any,
    @Body() dto: Partial<CreateRoadmapDto>,
    @Query('accountId') accountId?: string,
  ): Promise<any> {
    return this.service.generateRoadmapForAccount(
      this.resolveAccountId(req, accountId),
      dto,
    );
  }

  @UseGuards(DevAuthGuard)
  @Patch('me/targets')
  async updateMyTargets(
    @Req() req: any,
    @Body() dto: UpdateRoadmapTargetsDto,
    @Query('accountId') accountId?: string,
  ): Promise<any> {
    return this.service.updateTargetsAndRegenerate(
      this.resolveAccountId(req, accountId),
      dto,
    );
  }

  @UseGuards(DevAuthGuard)
  @Get('me/progress')
  async getMyProgress(
    @Req() req: any,
    @Query('accountId') accountId?: string,
  ): Promise<SkillProgressResponseDto[]> {
    return this.service.getSkillProgressByAccount(
      this.resolveAccountId(req, accountId),
    );
  }

  @UseGuards(DevAuthGuard)
  @Get('me/learning-analysis')
  async getLearningAnalysis(
    @Req() req: any,
    @Query('accountId') accountId?: string,
  ) {
    return this.service.getLearningAnalysisByAccount(
      this.resolveAccountId(req, accountId),
    );
  }

  // ============================================
  // LESSON ENDPOINTS
  // ============================================

  @UseGuards(DevAuthGuard)
  @Get('lessons/:lessonId')
  async getLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<LessonResponseDto> {
    return this.service.getLesson(lessonId);
  }

  @UseGuards(DevAuthGuard)
  @Post('lesson/:lessonId/complete')
  async completeLesson(
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<{ message: string }> {
    await this.service.completeLesson(lessonId);
    return { message: 'Lesson completed successfully' };
  }

  // ============================================
  // PRACTICE SESSION ENDPOINTS
  // ============================================

  @UseGuards(DevAuthGuard)
  @Post('practice/submit')
  async submitPractice(
    @Body() dto: SubmitPracticeDto,
  ): Promise<PracticeSessionResponseDto> {
    return this.service.submitPractice(dto);
  }

  // ============================================
  // BAND TEST ENDPOINTS
  // ============================================

  @UseGuards(DevAuthGuard)
  @Post('band-tests')
  async createBandTest(
    @Req() req: any,
    @Body() dto: CreateBandTestDto,
    @Query('accountId') accountId?: string,
  ): Promise<BandTestResponseDto> {
    return this.service.createBandTestForAccount(
      this.resolveAccountId(req, accountId),
      dto,
    );
  }

  @UseGuards(DevAuthGuard)
  @Post('band-tests/submit')
  async submitBandTest(
    @Body() dto: SubmitBandTestDto,
  ): Promise<BandTestResponseDto> {
    return this.service.submitBandTest(dto);
  }

  @UseGuards(DevAuthGuard)
  @Post('band-tests/:testId/apply')
  async applyBandResult(@Param('testId') testId: string): Promise<{
    applied: boolean;
    new_band: number;
    band_change: string;
    roadmap_regenerated: boolean;
  }> {
    return this.service.applyBandResult(testId);
  }

  @UseGuards(DevAuthGuard)
  @Get('band-test/:testId')
  async getBandTest(
    @Param('testId') testId: string,
  ): Promise<BandTestResponseDto> {
    return { message: 'Fetch test implementation here' } as any;
  }

  // ============================================
  // SKILL PROGRESS ENDPOINTS
  // ============================================

  @UseGuards(DevAuthGuard)
  @Get('progress/enrollment/:enrollmentId')
  async getSkillProgress(
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
  ): Promise<SkillProgressResponseDto[]> {
    return this.service.getSkillProgress(enrollmentId);
  }

  // ============================================
  // LEGACY ALIAS ROUTES (avoid frontend 404)
  // ============================================

  @UseGuards(DevAuthGuard)
  @Post('roadmap')
  async createRoadmap(
    @Body() dto: CreateRoadmapDto,
  ): Promise<RoadmapResponseDto> {
    return this.service.createRoadmap(dto);
  }

  @UseGuards(DevAuthGuard)
  @Get('roadmap/enrollment/:enrollmentId')
  async getRoadmap(
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
  ): Promise<RoadmapResponseDto> {
    return this.service.getRoadmap(enrollmentId);
  }

  @UseGuards(DevAuthGuard)
  @Post('roadmap/:roadmapId/unlock-next')
  async unlockNextLesson(
    @Param('roadmapId', ParseIntPipe) roadmapId: number,
  ): Promise<{ message: string }> {
    await this.service.unlockNextLesson(roadmapId);
    return { message: 'Next lesson unlocked successfully' };
  }

  @UseGuards(DevAuthGuard)
  @Get('lesson/:lessonId')
  async getLessonLegacy(
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<LessonResponseDto> {
    return this.service.getLesson(lessonId);
  }

  @UseGuards(DevAuthGuard)
  @Post('band-test')
  async createBandTestLegacy(
    @Req() req: any,
    @Body() dto: CreateBandTestDto,
    @Query('accountId') accountId?: string,
  ): Promise<BandTestResponseDto> {
    return this.service.createBandTestForAccount(
      this.resolveAccountId(req, accountId),
      dto,
    );
  }

  @UseGuards(DevAuthGuard)
  @Post('band-test/submit')
  async submitBandTestLegacy(
    @Body() dto: SubmitBandTestDto,
  ): Promise<BandTestResponseDto> {
    return this.service.submitBandTest(dto);
  }
}
