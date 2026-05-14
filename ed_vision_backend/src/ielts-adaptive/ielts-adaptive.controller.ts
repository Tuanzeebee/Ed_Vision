import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';
import { Logger } from '@nestjs/common';
import { IeltsAdaptiveService } from './services/ielts-adaptive.service';
import { IeltsAiGradingService } from './services/ielts-ai-grading.service';
import { GeminiService } from '../common/gemini/gemini.service';
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
  GradeSpeakingDto,
  GradeWritingDto,
  IeltsGradingResultDto,
} from './dto/ielts-adaptive.dto';

@Controller('ielts-adaptive')
export class IeltsAdaptiveController {
  private readonly logger = new Logger(IeltsAdaptiveController.name);

  constructor(
    private readonly service: IeltsAdaptiveService,
    private readonly gradingService: IeltsAiGradingService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get('health')
  health() {
    return {
      ok: true,
      module: 'ielts-adaptive',
      time: new Date().toISOString(),
    };
  }

  private resolveAccountId(req: any): number {
    const accountId = Number(req?.user?.account_id ?? req?.user?.id);
    if (!Number.isFinite(accountId) || accountId <= 0) {
      throw new UnauthorizedException(
        'Unable to resolve account id from JWT token. Please login again.',
      );
    }
    return accountId;
  }

  // ============================================
  // ROADMAP ENDPOINTS (ME)
  // ============================================

  @UseGuards(DevAuthGuard)
  @Get('me/roadmap')
  async getMyRoadmap(@Req() req: any): Promise<any> {
    return this.service.getOrCreateRoadmapForAccount(
      this.resolveAccountId(req),
    );
  }

  @UseGuards(DevAuthGuard)
  @Post('me/roadmap/generate')
  async generateMyRoadmap(
    @Req() req: any,
    @Body() dto: Partial<CreateRoadmapDto>,
  ): Promise<any> {
    return this.service.generateRoadmapForAccount(
      this.resolveAccountId(req),
      dto,
    );
  }

  @UseGuards(DevAuthGuard)
  @Patch('me/targets')
  async updateMyTargets(
    @Req() req: any,
    @Body() dto: UpdateRoadmapTargetsDto,
  ): Promise<any> {
    return this.service.updateTargetsAndRegenerate(
      this.resolveAccountId(req),
      dto,
    );
  }

  @UseGuards(DevAuthGuard)
  @Get('me/progress')
  async getMyProgress(@Req() req: any): Promise<SkillProgressResponseDto[]> {
    return this.service.getSkillProgressByAccount(this.resolveAccountId(req));
  }

  @UseGuards(DevAuthGuard)
  @Get('me/learning-analysis')
  async getLearningAnalysis(@Req() req: any) {
    return this.service.getLearningAnalysisByAccount(
      this.resolveAccountId(req),
    );
  }

  // ============================================
  // LESSON ENDPOINTS
  // ============================================

  @UseGuards(DevAuthGuard)
  @Get('lessons/:lessonId')
  async getLesson(
    @Req() req: any,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<LessonResponseDto> {
    return this.service.getLesson(lessonId, this.resolveAccountId(req));
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
  ): Promise<BandTestResponseDto> {
    return this.service.createBandTestForAccount(
      this.resolveAccountId(req),
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
  async getBandTest(@Param('testId') testId: string): Promise<any> {
    return this.service.getBandTestWithQuestions(testId);
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
    @Req() req: any,
    @Param('lessonId', ParseIntPipe) lessonId: number,
  ): Promise<LessonResponseDto> {
    return this.service.getLesson(lessonId, this.resolveAccountId(req));
  }

  // ============================================
  // AI GRADING ENDPOINTS
  // ============================================

  @Post('grade/speaking')
  async gradeSpeaking(
    @Body() dto: GradeSpeakingDto,
  ): Promise<IeltsGradingResultDto> {
    if (!dto.transcript?.trim()) {
      throw new BadRequestException('transcript is required');
    }
    return this.gradingService.gradeSpeaking({
      transcript: dto.transcript,
      itemPrompt: dto.item_prompt,
      targetBand: dto.target_band,
      partType: dto.part_type,
    }) as any;
  }

  @Post('grade/speaking/audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = './uploads/audio/ielts-grading';
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${path.extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async gradeSpeakingAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      item_prompt: string;
      target_band: string;
      part_type?: string;
      lesson_id?: string;
      timeTakenSec?: string;
    },
  ): Promise<IeltsGradingResultDto> {
    // MOCK: clean up uploaded file if any
    if (file?.path) fs.unlink(file.path, () => {});

    const rand = (min: number, max: number) =>
      Math.round((Math.random() * (max - min) + min) * 2) / 2;
    const band = rand(4, 8);
    return {
      bandScore: band,
      skill: 'speaking',
      transcript: '(mock transcript)',
      criteria: [
        {
          name: 'Fluency & Coherence',
          score: rand(4, 8),
          feedback: 'Mock feedback',
        },
        {
          name: 'Lexical Resource',
          score: rand(4, 8),
          feedback: 'Mock feedback',
        },
        {
          name: 'Grammatical Range',
          score: rand(4, 8),
          feedback: 'Mock feedback',
        },
        { name: 'Pronunciation', score: rand(4, 8), feedback: 'Mock feedback' },
      ],
      overallFeedback: 'This is a mock grading response.',
      strengths: ['Good attempt'],
      weaknesses: ['Needs improvement'],
      suggestions: ['Practice more'],
      confidence: 'high',
      estimatedCefrLevel: band >= 7 ? 'C1' : band >= 5.5 ? 'B2' : 'B1',
    } as any;
  }

  @Post('grade/writing')
  async gradeWriting(
    @Body() dto: GradeWritingDto,
  ): Promise<IeltsGradingResultDto> {
    // MOCK: return random scores
    const rand = (min: number, max: number) =>
      Math.round((Math.random() * (max - min) + min) * 2) / 2;
    const band = rand(4, 8);
    return {
      bandScore: band,
      skill: 'writing',
      criteria: [
        {
          name: 'Task Achievement',
          score: rand(4, 8),
          feedback: 'Mock feedback',
        },
        {
          name: 'Coherence & Cohesion',
          score: rand(4, 8),
          feedback: 'Mock feedback',
        },
        {
          name: 'Lexical Resource',
          score: rand(4, 8),
          feedback: 'Mock feedback',
        },
        {
          name: 'Grammatical Range',
          score: rand(4, 8),
          feedback: 'Mock feedback',
        },
      ],
      overallFeedback: 'This is a mock grading response.',
      strengths: ['Clear structure'],
      weaknesses: ['Vocabulary range'],
      suggestions: ['Use more varied vocabulary'],
      correctedExamples: [],
      confidence: 'high',
      estimatedCefrLevel: band >= 7 ? 'C1' : band >= 5.5 ? 'B2' : 'B1',
    } as any;
  }

  @UseGuards(DevAuthGuard)
  @Post('band-test')
  async createBandTestLegacy(
    @Req() req: any,
    @Body() dto: CreateBandTestDto,
  ): Promise<BandTestResponseDto> {
    return this.service.createBandTestForAccount(
      this.resolveAccountId(req),
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
