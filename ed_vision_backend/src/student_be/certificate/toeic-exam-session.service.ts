import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { TestResultRecorderService } from '../../admin_be/program-effectiveness/test-result-recorder.service';

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// Lưu ý: phải có decorator class-validator vì global ValidationPipe bật
// `whitelist: true` — field không khai báo sẽ bị strip khỏi body.
// ─────────────────────────────────────────────────────────────────────────────

export class StartExamSessionDto {
  /** Slug của ExamRepository (đề thi). Bắt buộc. */
  @IsString()
  repository_slug!: string;

  /** Cho phép frontend gợi ý duration (sec); server vẫn clamp lại theo policy. */
  @IsOptional()
  @IsInt()
  @Min(0)
  duration_sec_hint?: number;
}

export class UpsertExamAnswerDto {
  @IsInt()
  question_id!: number;

  /** "A" | "B" | "C" | "D" hoặc null để xoá lựa chọn. */
  @ValidateIf((_, value) => value !== null)
  @IsString()
  selected_key!: string | null;

  @IsOptional()
  @IsBoolean()
  is_flagged?: boolean;
}

export class UpdateCursorDto {
  @IsInt()
  @Min(0)
  current_index!: number;
}

export class SubmitExamSessionDto {
  /** Optional: client xác nhận lý do nộp ('manual' | 'timeout'). Server sẽ cross-check thời gian. */
  @IsOptional()
  @IsIn(['manual', 'timeout'])
  reason?: 'manual' | 'timeout';
}

export interface ExamSessionStateDto {
  session_id: number;
  repository_id: number;
  repository_slug: string;
  repository_title: string;
  started_at: string;
  duration_sec: number;
  /** Server-computed: Math.max(0, duration - elapsed). Client dùng làm SOURCE OF TRUTH. */
  remaining_sec: number;
  submitted_at: string | null;
  auto_submitted: boolean;
  current_index: number;
  total_questions: number;
  answers: Array<{
    question_id: number;
    selected_key: string | null;
    is_flagged: boolean;
  }>;
}

export interface SubmitExamResultDto {
  session_id: number;
  correct_count: number;
  total_count: number;
  total_score: number;
  auto_submitted: boolean;
  submitted_at: string;
  /** Chi tiết đúng/sai để frontend render review. */
  question_results: Array<{
    question_id: number;
    selected_key: string | null;
    correct_key: string | null;
    is_correct: boolean;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ToeicExamSessionService {
  private readonly logger = new Logger(ToeicExamSessionService.name);

  /** Cho phép quá hạn 5 phút trước khi chặn cứng request answer. */
  private readonly GRACE_SEC = 5 * 60;
  /** Trần thời gian: dù cho frontend gợi ý gì, không vượt 3 giờ. */
  private readonly MAX_DURATION_SEC = 3 * 60 * 60;
  /** Sàn thời gian (5 phút). */
  private readonly MIN_DURATION_SEC = 5 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly testResultRecorder: TestResultRecorderService,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private resolveDurationSec(
    repoSkillArea: string | null | undefined,
    totalQuestions: number,
    hint?: number,
  ): number {
    // Mặc định: TOEIC chuẩn ~ Listening 45p, Reading 75p, full test 120p.
    let base: number;
    if (repoSkillArea === 'listening') base = 45 * 60;
    else if (repoSkillArea === 'reading') base = 75 * 60;
    else if (repoSkillArea === 'full') base = 120 * 60;
    else base = Math.max(30 * 60, totalQuestions * 36); // ~36s/câu

    if (typeof hint === 'number' && Number.isFinite(hint) && hint > 0) {
      base = Math.round(hint);
    }
    return Math.min(
      this.MAX_DURATION_SEC,
      Math.max(this.MIN_DURATION_SEC, base),
    );
  }

  private elapsedSec(startedAt: Date): number {
    return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
  }

  private remainingSec(startedAt: Date, durationSec: number): number {
    return Math.max(0, durationSec - this.elapsedSec(startedAt));
  }

  private async loadSessionOrThrow(accountId: number, sessionId: number) {
    const session = await this.prisma.toeicExamSession.findUnique({
      where: { id: sessionId },
      include: {
        repository: {
          select: { id: true, slug: true, title: true, skill_area: true },
        },
        answers: true,
      },
    });
    if (!session) {
      throw new NotFoundException('Phiên thi không tồn tại.');
    }
    if (session.account_id !== accountId) {
      throw new ForbiddenException('Phiên thi không thuộc về bạn.');
    }
    return session;
  }

  private async buildState(sessionId: number): Promise<ExamSessionStateDto> {
    const session = await this.prisma.toeicExamSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        repository: {
          select: {
            id: true,
            slug: true,
            title: true,
            _count: { select: { items: true } },
          },
        },
        answers: {
          select: {
            question_id: true,
            selected_key: true,
            is_flagged: true,
          },
        },
      },
    });

    return {
      session_id: session.id,
      repository_id: session.repository_id,
      repository_slug: session.repository_slug,
      repository_title: session.repository.title,
      started_at: session.started_at.toISOString(),
      duration_sec: session.duration_sec,
      remaining_sec: session.submitted_at
        ? 0
        : this.remainingSec(session.started_at, session.duration_sec),
      submitted_at: session.submitted_at?.toISOString() ?? null,
      auto_submitted: session.auto_submitted,
      current_index: session.current_index,
      total_questions: session.repository._count.items,
      answers: session.answers.map((a) => ({
        question_id: a.question_id,
        selected_key: a.selected_key,
        is_flagged: a.is_flagged,
      })),
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Bắt đầu HOẶC resume phiên thi.
   * Nếu user đã có phiên `submitted_at = null` cho đề này → trả lại phiên cũ.
   * Đồng thời nếu phiên cũ đã quá hạn (now > started_at + duration + grace),
   * tự động auto-submit phiên cũ trước khi tạo phiên mới.
   */
  async startOrResume(
    accountId: number,
    dto: StartExamSessionDto,
  ): Promise<ExamSessionStateDto> {
    const slug = dto.repository_slug?.trim();
    if (!slug) {
      throw new BadRequestException('repository_slug là bắt buộc.');
    }

    const repository = await this.prisma.examRepository.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        skill_area: true,
        is_published: true,
        _count: { select: { items: true } },
      },
    });
    if (!repository || !repository.is_published) {
      throw new NotFoundException(
        'Đề thi không tồn tại hoặc chưa được công bố.',
      );
    }
    if (repository._count.items === 0) {
      throw new BadRequestException('Đề thi chưa có câu hỏi nào.');
    }

    // Tìm session active
    const active = await this.prisma.toeicExamSession.findFirst({
      where: {
        account_id: accountId,
        repository_id: repository.id,
        submitted_at: null,
      },
      orderBy: { started_at: 'desc' },
    });

    if (active) {
      const remaining = this.remainingSec(
        active.started_at,
        active.duration_sec,
      );
      const overGrace =
        this.elapsedSec(active.started_at) >
        active.duration_sec + this.GRACE_SEC;

      if (remaining > 0 && !overGrace) {
        // Còn thời gian → resume
        return this.buildState(active.id);
      }

      // Phiên cũ đã hết hạn quá lâu → auto-submit để cleanup
      this.logger.log(
        `[ExamSession] Auto-submit stale session ${active.id} (account=${accountId})`,
      );
      await this.gradeAndFinalize(active.id, true);
    }

    const durationSec = this.resolveDurationSec(
      repository.skill_area,
      repository._count.items,
      dto.duration_sec_hint,
    );

    const created = await this.prisma.toeicExamSession.create({
      data: {
        account_id: accountId,
        repository_id: repository.id,
        repository_slug: repository.slug,
        duration_sec: durationSec,
        current_index: 0,
      },
    });

    return this.buildState(created.id);
  }

  async getState(
    accountId: number,
    sessionId: number,
  ): Promise<ExamSessionStateDto> {
    await this.loadSessionOrThrow(accountId, sessionId);
    return this.buildState(sessionId);
  }

  async upsertAnswer(
    accountId: number,
    sessionId: number,
    dto: UpsertExamAnswerDto,
  ): Promise<{ ok: true; remaining_sec: number }> {
    const session = await this.loadSessionOrThrow(accountId, sessionId);
    if (session.submitted_at) {
      throw new BadRequestException('Phiên thi đã nộp, không thể cập nhật.');
    }
    const remaining = this.remainingSec(
      session.started_at,
      session.duration_sec,
    );
    if (remaining <= 0) {
      // Quá hạn → reject + auto-submit nếu chưa
      await this.gradeAndFinalize(sessionId, true);
      throw new BadRequestException('Đã hết thời gian làm bài.');
    }

    if (!dto.question_id) {
      throw new BadRequestException('question_id là bắt buộc.');
    }

    // Validate question thuộc cùng repository
    const question = await this.prisma.examRepositoryItem.findUnique({
      where: { id: dto.question_id },
      select: { id: true, repository_id: true },
    });
    if (!question || question.repository_id !== session.repository_id) {
      throw new BadRequestException('Câu hỏi không thuộc đề thi này.');
    }

    const selectedKey = dto.selected_key?.toUpperCase().trim() || null;
    if (selectedKey && !['A', 'B', 'C', 'D'].includes(selectedKey)) {
      throw new BadRequestException('selected_key không hợp lệ (chỉ A/B/C/D).');
    }

    await this.prisma.toeicExamAnswer.upsert({
      where: {
        session_id_question_id: {
          session_id: sessionId,
          question_id: dto.question_id,
        },
      },
      create: {
        session_id: sessionId,
        question_id: dto.question_id,
        selected_key: selectedKey,
        is_flagged: dto.is_flagged ?? false,
      },
      update: {
        selected_key: selectedKey,
        ...(typeof dto.is_flagged === 'boolean'
          ? { is_flagged: dto.is_flagged }
          : {}),
      },
    });

    return { ok: true, remaining_sec: remaining };
  }

  async updateCursor(
    accountId: number,
    sessionId: number,
    dto: UpdateCursorDto,
  ): Promise<{ ok: true }> {
    const session = await this.loadSessionOrThrow(accountId, sessionId);
    if (session.submitted_at) {
      throw new BadRequestException('Phiên thi đã nộp, không thể cập nhật.');
    }
    const idx = Math.max(0, Math.floor(dto.current_index ?? 0));
    await this.prisma.toeicExamSession.update({
      where: { id: sessionId },
      data: { current_index: idx },
    });
    return { ok: true };
  }

  async submit(
    accountId: number,
    sessionId: number,
    _dto: SubmitExamSessionDto,
  ): Promise<SubmitExamResultDto> {
    const session = await this.loadSessionOrThrow(accountId, sessionId);
    if (session.submitted_at) {
      // Idempotent: trả lại kết quả đã có
      return this.buildSubmitResult(sessionId);
    }

    const remaining = this.remainingSec(
      session.started_at,
      session.duration_sec,
    );
    const auto = remaining <= 0; // hết giờ thì coi như auto

    return this.gradeAndFinalize(sessionId, auto);
  }

  // ── Internal: chấm điểm + finalize ─────────────────────────────────────────

  private async gradeAndFinalize(
    sessionId: number,
    autoSubmitted: boolean,
  ): Promise<SubmitExamResultDto> {
    const session = await this.prisma.toeicExamSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        repository: {
          include: {
            items: {
              select: {
                id: true,
                options: { select: { option_key: true, is_correct: true } },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (session.submitted_at) {
      return this.buildSubmitResult(sessionId);
    }

    const correctMap = new Map<number, string | null>();
    for (const item of session.repository.items) {
      const correct =
        item.options.find((o) => o.is_correct)?.option_key ?? null;
      correctMap.set(item.id, correct ? correct.toUpperCase() : null);
    }
    const answerMap = new Map<number, string | null>();
    for (const ans of session.answers) {
      answerMap.set(ans.question_id, ans.selected_key);
    }

    let correctCount = 0;
    let gradableCount = 0;
    const questionResults: SubmitExamResultDto['question_results'] = [];

    for (const item of session.repository.items) {
      const correctKey = correctMap.get(item.id) ?? null;
      const selectedKey = answerMap.get(item.id) ?? null;
      const isGradable = correctKey !== null;
      const isCorrect = isGradable && selectedKey === correctKey;
      if (isGradable) gradableCount += 1;
      if (isCorrect) correctCount += 1;
      questionResults.push({
        question_id: item.id,
        selected_key: selectedKey,
        correct_key: correctKey,
        is_correct: isCorrect,
      });
    }

    // Quy đổi điểm theo tỉ lệ trên câu chấm được, scale lên 495 (TOEIC half).
    const scaledScore =
      gradableCount > 0 ? Math.round((correctCount / gradableCount) * 495) : 0;

    const submittedAt = new Date();
    await this.prisma.toeicExamSession.update({
      where: { id: sessionId },
      data: {
        submitted_at: submittedAt,
        auto_submitted: autoSubmitted,
        correct_count: correctCount,
        total_count: gradableCount,
        total_score: scaledScore,
      },
    });

    const result: SubmitExamResultDto = {
      session_id: sessionId,
      correct_count: correctCount,
      total_count: gradableCount,
      total_score: scaledScore,
      auto_submitted: autoSubmitted,
      submitted_at: submittedAt.toISOString(),
      question_results: questionResults,
    };

    // Fire-and-forget: record to StudentTestResult for analytics
    this.recordTestResult(session.account_id, session, result).catch(() => {});

    return result;
  }

  private async recordTestResult(
    accountId: number,
    session: {
      id: number;
      repository_id: number;
      started_at: Date;
      duration_sec: number;
      repository: { skill_area?: string | null };
    },
    result: SubmitExamResultDto,
  ): Promise<void> {
    // Resolve enrollment from the active TOEIC enrollment for this account
    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
      select: { student_id: true },
    });
    let enrollmentId: number | null = null;
    if (student) {
      const enrollment = await this.prisma.certificateEnrollment.findFirst({
        where: { student_id: student.student_id, cert_type: 'toeic', status: 'active' },
        select: { id: true },
      });
      enrollmentId = enrollment?.id ?? null;
    }

    // TOEIC only has Listening + Reading. Map score to the correct skill
    // based on the exam's skill_area. 'full' tests report total only.
    const skillArea = session.repository?.skill_area;
    const listeningScore = skillArea === 'listening' ? result.total_score
      : skillArea === 'full' ? Math.round(result.total_score / 2)
      : null;
    const readingScore = skillArea === 'reading' ? result.total_score
      : skillArea === 'full' ? Math.round(result.total_score / 2)
      : null;

    await this.testResultRecorder.record({
      accountId,
      certType: 'toeic',
      testType: 'mock',
      testPhase: 'midterm',
      enrollmentId,
      sessionId: session.id,
      repositoryId: session.repository_id,
      listeningScore,
      readingScore,
      writingScore: null,
      speakingScore: null,
      totalScore: result.total_score,
      totalQuestions: result.total_count,
      correctCount: result.correct_count,
      accuracyPercent: result.total_count > 0
        ? Math.round((result.correct_count / result.total_count) * 100)
        : 0,
      durationMinutes: Math.ceil(session.duration_sec / 60),
      startedAt: session.started_at,
      completedAt: new Date(),
    });
  }

  private async buildSubmitResult(
    sessionId: number,
  ): Promise<SubmitExamResultDto> {
    const session = await this.prisma.toeicExamSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        repository: {
          include: {
            items: {
              select: {
                id: true,
                options: { select: { option_key: true, is_correct: true } },
              },
            },
          },
        },
        answers: true,
      },
    });

    const correctMap = new Map<number, string | null>();
    for (const item of session.repository.items) {
      const correct =
        item.options.find((o) => o.is_correct)?.option_key ?? null;
      correctMap.set(item.id, correct ? correct.toUpperCase() : null);
    }
    const answerMap = new Map<number, string | null>();
    for (const ans of session.answers) {
      answerMap.set(ans.question_id, ans.selected_key);
    }

    const questionResults: SubmitExamResultDto['question_results'] =
      session.repository.items.map((item) => {
        const correctKey = correctMap.get(item.id) ?? null;
        const selectedKey = answerMap.get(item.id) ?? null;
        return {
          question_id: item.id,
          selected_key: selectedKey,
          correct_key: correctKey,
          is_correct: correctKey !== null && selectedKey === correctKey,
        };
      });

    return {
      session_id: sessionId,
      correct_count: session.correct_count ?? 0,
      total_count: session.total_count ?? 0,
      total_score: session.total_score ?? 0,
      auto_submitted: session.auto_submitted,
      submitted_at: (session.submitted_at ?? new Date()).toISOString(),
      question_results: questionResults,
    };
  }
}
