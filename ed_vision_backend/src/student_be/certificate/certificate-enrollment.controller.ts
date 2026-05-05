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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request as ExpressRequest } from 'express';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { CertificateEnrollmentService } from './certificate-enrollment.service';
import {
  ToeicPracticeSessionService,
  SubmitPartSessionDto,
  GetQuestionsForPartResponseDto,
  SubmitPartSessionResponseDto,
  ReservePointsStatusDto,
} from './toeic-practice-session.service';
import { ToeicDiagnosticService, SubmitDiagnosticDto } from './toeic-diagnostic.service';
import {
  CreateEnrollmentDto,
  CompleteTopicDto,
  EnrollmentResponseDto,
  ToeicPlanSyncDto,
  ToeicPlanSyncResponseDto,
  ToeicLeaderboardEntryDto,
  ToeicRepositoryOverviewResponseDto,
  ToeicRepositoryDetailResponseDto,
  ToeicRepositorySubmitDto,
  ToeicRepositorySubmitResponseDto,
  ToeicReadingImportDto,
  ToeicReadingImportResponseDto,
  ToeicManualListeningCreateDto,
  ToeicManualListeningCreateResponseDto,
  ToeicExplainAnswerDto,
  ToeicExplainAnswerResponseDto,
  ToeicRepositoryPregenerateExplanationsDto,
  ToeicRepositoryPregenerateExplanationsResponseDto,
  CertificateTutorAskDto,
  CertificateTutorAskResponseDto,
} from './dto/certificate.dto';

type AuthenticatedRequest = ExpressRequest & {
  user: {
    account_id: number;
  };
};

const certificateMulterStorage = diskStorage({
  destination: (req, file, cb) => {
    const destinationPath = './uploads/certificate';
    if (!existsSync(destinationPath)) {
      mkdirSync(destinationPath, { recursive: true });
    }
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

@Controller('student/certificate')
@UseGuards(DevAuthGuard)
export class CertificateEnrollmentController {
  constructor(
    private readonly service: CertificateEnrollmentService,
    private readonly practiceSessionService: ToeicPracticeSessionService,
    private readonly diagnosticService: ToeicDiagnosticService,
  ) {}

  @Get('toeic-diagnostic/generate')
  async generateDiagnosticTest(
    @Query('target_score', ParseIntPipe) targetScore: number,
  ) {
    return this.diagnosticService.generateDiagnosticTest(targetScore);
  }

  @Post('toeic-diagnostic/submit')
  async submitDiagnosticTest(
    @Body() dto: SubmitDiagnosticDto,
  ) {
    return this.diagnosticService.submitDiagnosticTest(dto);
  }

  /**
   * GET /student/certificate/enrollment?certType=ielts
   * Returns the current ACTIVE enrollment for the given cert, or null.
   */
  @Get('enrollment')
  async getEnrollment(
    @Request() req: AuthenticatedRequest,
    @Query('certType') certType: string,
  ): Promise<EnrollmentResponseDto | null> {
    return this.service.getEnrollment(req.user.account_id, certType);
  }

  /**
   * GET /student/certificate/enrollments
   * Returns ALL enrollments (active + completed) for the student.
   */
  @Get('enrollments')
  async getAllEnrollments(
    @Request() req: AuthenticatedRequest,
  ): Promise<EnrollmentResponseDto[]> {
    return this.service.getAllEnrollments(req.user.account_id);
  }

  /**
   * POST /student/certificate/enroll
   * Enroll in a certificate band (called after student confirms band selection).
   */
  @Post('enroll')
  @HttpCode(HttpStatus.CREATED)
  async createEnrollment(
    @Request() req: AuthenticatedRequest,
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
    @Request() req: AuthenticatedRequest,
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
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) enrollmentId: number,
  ): Promise<EnrollmentResponseDto> {
    return this.service.completeBand(req.user.account_id, enrollmentId);
  }

  /**
   * GET /student/certificate/toeic-plan
   * Returns synced TOEIC milestone state for current student's active TOEIC enrollment.
   */
  @Get('toeic-plan')
  async getToeicPlan(
    @Request() req: AuthenticatedRequest,
  ): Promise<ToeicPlanSyncResponseDto | null> {
    return this.service.getToeicPlanState(req.user.account_id);
  }

  /**
   * PATCH /student/certificate/toeic-plan
   * Saves TOEIC milestone state to backend for cross-platform sync.
   */
  @Patch('toeic-plan')
  async saveToeicPlan(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ToeicPlanSyncDto,
  ): Promise<ToeicPlanSyncResponseDto> {
    return this.service.saveToeicPlanState(req.user.account_id, dto);
  }

  /**
   * GET /student/certificate/toeic-leaderboard?limit=10
   * Real leaderboard from TOEIC enrollments.
   */
  @Get('toeic-leaderboard')
  async getToeicLeaderboard(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ): Promise<ToeicLeaderboardEntryDto[]> {
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 10;
    return this.service.getToeicLeaderboard(req.user.account_id, safeLimit);
  }

  /**
   * GET /student/certificate/me/scores
   * Returns all score types for the authenticated student:
   * - current_score (Điểm Gốc): from diagnostic test
   * - reserve_points (Điểm Ôn Tập): accumulated from practice questions
   * - target_score, exam_score, total_exp, weekly_exp
   * - exam_simulation_unlocked, progress_percent, remaining_points
   */
  @UseGuards(DevAuthGuard)
  @Get('me/scores')
  async getPersonalScores(@Request() req: AuthenticatedRequest) {
    return this.service.getPersonalScores(req.user.account_id);
  }

  /**
   * GET /student/certificate/toeic-repository/overview
   * Returns TOEIC micro-learning repositories unlocked by student's score/milestones.
   */
  @Get('toeic-repository/overview')
  async getToeicRepositoryOverview(
    @Request() req: AuthenticatedRequest,
  ): Promise<ToeicRepositoryOverviewResponseDto> {
    return this.service.getToeicRepositoryOverview(req.user.account_id);
  }

  /**
   * GET /student/certificate/toeic-repository/exam/:examType
   * Return latest published TOEIC exam repository (mock_test preferred) by skill area.
   */
  @Get('toeic-repository/exam/:examType')
  async getToeicExamRepositoryByType(
    @Request() req: AuthenticatedRequest,
    @Param('examType') examType: string,
  ): Promise<ToeicRepositoryDetailResponseDto> {
    return this.service.getToeicExamRepositoryByType(
      req.user.account_id,
      examType,
    );
  }

  /**
   * GET /student/certificate/toeic-repository/:slug
   * Returns detailed question set for a TOEIC repository slug.
   */
  @Get('toeic-repository/:slug')
  async getToeicRepositoryDetail(
    @Request() req: AuthenticatedRequest,
    @Param('slug') slug: string,
  ): Promise<ToeicRepositoryDetailResponseDto> {
    return this.service.getToeicRepositoryDetail(req.user.account_id, slug);
  }

  /**
   * POST /student/certificate/toeic-repository/:slug/submit
   * Server-side scoring for TOEIC repository attempt and milestone score update.
   */
  @Post('toeic-repository/:slug/submit')
  async submitToeicRepository(
    @Request() req: AuthenticatedRequest,
    @Param('slug') slug: string,
    @Body() dto: ToeicRepositorySubmitDto,
  ): Promise<ToeicRepositorySubmitResponseDto> {
    return this.service.submitToeicRepositoryAnswers(
      req.user.account_id,
      slug,
      dto,
    );
  }

  /**
   * POST /student/certificate/toeic-repository/import-reading-file
   * Import reading questions from CSV/XLSX/JSON, with section-title filtering.
   */
  @Post('toeic-repository/import-reading-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: certificateMulterStorage,
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async importToeicReadingFromFile(
    @Body() dto: ToeicReadingImportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ToeicReadingImportResponseDto> {
    return this.service.importToeicReadingFromFile(dto, file);
  }

  /**
   * POST /student/certificate/toeic-repository/listening/manual-item
   * Manually add one listening item with optional audio and image files.
   */
  @Post('toeic-repository/listening/manual-item')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'audio', maxCount: 1 },
        { name: 'image', maxCount: 1 },
      ],
      {
        storage: certificateMulterStorage,
        limits: { fileSize: 25 * 1024 * 1024 },
      },
    ),
  )
  async createToeicListeningManualItem(
    @Body() dto: ToeicManualListeningCreateDto,
    @UploadedFiles()
    files: {
      audio?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
  ): Promise<ToeicManualListeningCreateResponseDto> {
    const audioFile = files.audio?.[0];
    const imageFile = files.image?.[0];
    return this.service.createToeicListeningManualItem(
      dto,
      audioFile,
      imageFile,
    );
  }

  /**
   * POST /student/certificate/toeic-repository/:slug/explain-answer
   * Generate or reuse cached AI explanation with Ollama for selected answer.
   */
  @Post('toeic-repository/:slug/explain-answer')
  async explainToeicAnswer(
    @Request() req: AuthenticatedRequest,
    @Param('slug') slug: string,
    @Body() dto: ToeicExplainAnswerDto,
  ): Promise<ToeicExplainAnswerResponseDto> {
    return this.service.explainToeicAnswerWithOllama(
      req.user.account_id,
      slug,
      dto,
    );
  }

  /**
   * POST /student/certificate/toeic-repository/:slug/pregenerate-explanations
   * Phase 1: pre-generate high-quality reading explanations into DB cache.
   */
  @Post('toeic-repository/:slug/pregenerate-explanations')
  async preGenerateToeicRepositoryExplanations(
    @Request() req: AuthenticatedRequest,
    @Param('slug') slug: string,
    @Body() dto: ToeicRepositoryPregenerateExplanationsDto,
  ): Promise<ToeicRepositoryPregenerateExplanationsResponseDto> {
    return this.service.preGenerateToeicReadingExplanations(
      req.user.account_id,
      slug,
      dto,
    );
  }

  /**
   * POST /student/certificate/ai-tutor/ask
   * Shared AI tutor endpoint for all certificate types.
   */
  @Post('ai-tutor/ask')
  async askCertificateTutor(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CertificateTutorAskDto,
  ): Promise<CertificateTutorAskResponseDto> {
    return this.service.askCertificateTutor(req.user.account_id, dto);
  }

  /**
   * POST /student/certificate/ai-tutor/groq-chat
   * Chat with Groq AI Tutor for a specific TOEIC question
   */
  @Post('ai-tutor/groq-chat')
  async chatGroqTutor(
    @Request() req: AuthenticatedRequest,
    @Body() dto: import('./dto/certificate.dto').ToeicChatGroqDto,
  ) {
    return this.service.chatGroqTutor(req.user.account_id, dto);
  }

  /**
   * GET /student/certificate/toeic/practice-questions/:part
   * Returns up to 10 questions for one TOEIC part in the learner score band.
   */
  @Get('toeic/practice-questions/:part')
  async getPracticeQuestionsForPart(
    @Request() req: AuthenticatedRequest,
    @Param('part', ParseIntPipe) part: number,
    @Query('count') count?: string,
  ): Promise<GetQuestionsForPartResponseDto> {
    const parsedCount = count !== undefined ? Number(count) : 10;
    const safeCount =
      Number.isFinite(parsedCount) && parsedCount > 0
        ? Math.min(parsedCount, 10)
        : 10;
    return this.practiceSessionService.getQuestionsForPart(
      req.user.account_id,
      part,
      safeCount,
    );
  }

  /**
   * POST /student/certificate/toeic/practice-session/submit
   * Submit answers for a completed practice session.
   * Scores the attempt, creates a ToeicPracticePartSession record,
   * and increments reserve_points on the enrollment (capped at 100).
   */
  @Post('toeic/practice-session/submit')
  async submitPracticeSession(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubmitPartSessionDto,
  ): Promise<SubmitPartSessionResponseDto> {
    return this.practiceSessionService.submitPartSession(
      req.user.account_id,
      dto,
    );
  }

  /**
   * GET /student/certificate/toeic/reserve-points
   * Returns the student's current reserve_points balance, exam-unlock status,
   * and their 20 most recent practice part-session records.
   */
  @Get('toeic/reserve-points')
  async getReservePointsStatus(
    @Request() req: AuthenticatedRequest,
  ): Promise<ReservePointsStatusDto> {
    return this.practiceSessionService.getReservePointsStatus(
      req.user.account_id,
    );
  }
}
