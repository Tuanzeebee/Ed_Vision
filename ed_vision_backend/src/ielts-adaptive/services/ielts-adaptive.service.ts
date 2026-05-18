import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BandEstimationService } from './band-estimation.service';
import { EvaluationService } from './evaluation.service';
import { TestResultRecorderService } from '../../admin_be/program-effectiveness/test-result-recorder.service';
import { GeminiService } from '../../common/gemini/gemini.service';
import {
  CreateRoadmapDto,
  UpdateRoadmapTargetsDto,
  RoadmapResponseDto,
  LessonResponseDto,
  SubmitPracticeDto,
  PracticeSessionResponseDto,
  CreateBandTestDto,
  SubmitBandTestDto,
  BandTestResponseDto,
  SkillProgressResponseDto,
  SkillArea,
  LessonStatus,
  SessionType,
  BandChange,
  Recommendation,
} from '../dto/ielts-adaptive.dto';

@Injectable()
export class IeltsAdaptiveService {
  private readonly logger = new Logger(IeltsAdaptiveService.name);

  constructor(
    private prisma: PrismaService,
    private bandEstimation: BandEstimationService,
    private evaluation: EvaluationService,
    private testResultRecorder: TestResultRecorderService,
    private gemini: GeminiService,
  ) { }

  /**
   * Chuyển đổi điểm số nguyên (vd: 450) thành band IELTS (vd: 4.5).
   * Nếu giá trị không hợp lệ (null, NaN, Infinity) thì trả về null.
   */
  private getBandFromScore(score?: number | null): number | null {
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      return null;
    }
    return score / 100;
  }

  /**
   * Đọc giá trị band (currentBand hoặc targetBand) từ trường JSON toeic_plan_state
   * của CertificateEnrollment.
   * Trả về null nếu planState không tồn tại hoặc giá trị không parse được.
   */
  private readBandFromPlanState(
    planState: any,
    key: 'currentBand' | 'targetBand',
  ): number | null {
    if (!planState || typeof planState !== 'object') {
      return null;
    }
    const raw = planState[key];
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * Lấy currentBand và targetBand từ enrollment theo thứ tự ưu tiên:
   *   1. Đọc từ toeic_plan_state (JSON field – nguồn chính xác nhất)
   *   2. Fallback: chuyển đổi từ current_score / target_score
   *   3. Fallback cuối: dùng giá trị mặc định (4.0 / 4.5)
   * Đảm bảo targetBand luôn lớn hơn currentBand ít nhất 0.5.
   */
  private resolveBandsFromEnrollment(enrollment: any): {
    currentBand: number;
    targetBand: number;
  } {
    const planState = enrollment.toeic_plan_state;
    const currentBand =
      this.readBandFromPlanState(planState, 'currentBand') ??
      this.getBandFromScore(enrollment.current_score) ??
      4.0;

    const targetBand =
      this.readBandFromPlanState(planState, 'targetBand') ??
      this.getBandFromScore(enrollment.target_score) ??
      Math.max(currentBand + 0.5, 4.5);

    return { currentBand, targetBand };
  }

  /**
   * Lấy hoặc tự động tạo enrollment IELTS cho học sinh.
   *
   * Luồng xử lý:
   *   1. Tìm Student theo accountId → báo lỗi 404 nếu không có profile.
   *   2. Tìm enrollment IELTS đang active mới nhất của student.
   *   3. Nếu chưa có enrollment → tạo mới với band mặc định 4.0→4.5.
   *   4. Trả về cặp { student, enrollment } để các hàm khác dùng tiếp.
   */
  async getOrCreateStudentEnrollment(accountId: number) {
    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
    });

    if (!student) {
      throw new NotFoundException(
        'Student profile not found for current account',
      );
    }

    let enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: {
        student_id: student.student_id,
        cert_type: 'ielts',
        status: 'active',
      },
      orderBy: { id: 'desc' },
    });

    if (!enrollment) {
      enrollment = await this.prisma.certificateEnrollment.create({
        data: {
          student_id: student.student_id,
          cert_type: 'ielts',
          status: 'active',
          learning_status: 'not_started',
          progress_percent: 0,
          current_score: 400,
          target_score: 450,
          reserve_points: 0,
          toeic_plan_state: {
            type: 'ielts',
            currentBand: 4.0,
            targetBand: 4.5,
          },
        },
      });
    }

    return { student, enrollment };
  }

  /**
   * Phân bổ ngày học đều cho từng bài trong lộ trình.
   *
   * Thuật toán:
   *   - Tính tổng số ngày từ hôm nay đến targetDate.
   *   - Dùng nội suy tuyến tính: bài thứ i được đặt lịch tại vị trí (i / max) * totalDays.
   *   - Nếu không có targetDate hoặc targetDate đã qua → trả mảng null (không lên lịch).
   *
   * @param totalLessons  Số bài học cần lên lịch
   * @param targetDate    Ngày thi mục tiêu (Date | null)
   * @returns             Mảng Date hoặc null tương ứng với từng bài
   */
  private computeScheduledDates(
    totalLessons: number,
    targetDate: Date | null | undefined,
  ): (Date | null)[] {
    if (!targetDate || totalLessons === 0)
      return Array(totalLessons).fill(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
    if (totalDays <= 0) return Array(totalLessons).fill(null);

    return Array.from({ length: totalLessons }, (_, i) => {
      const offset = Math.round(
        (i / Math.max(totalLessons - 1, 1)) * totalDays,
      );
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d;
    });
  }

  /**
   * Chuẩn hoá dữ liệu roadmap trước khi trả về client.
   *
   * Xử lý:
   *   - Tính progressPercent = số bài đã hoàn thành / tổng bài * 100.
   *   - Tính điều kiện mở khoá Band Test (progressPercent >= 70%).
   *   - Map từng lesson: thêm lesson_code (vd: "REA-01"), ép kiểu Decimal → number.
   *   - Kèm theo dữ liệu tiến độ từng kỹ năng (skills).
   */
  private async formatRoadmapResponse(roadmap: any): Promise<any> {
    const lessons = roadmap.lessons || [];
    const completedLessons = lessons.filter(
      (lesson: any) => lesson.status === LessonStatus.COMPLETED,
    ).length;
    const progressPercent =
      lessons.length > 0
        ? Math.round((completedLessons / lessons.length) * 100)
        : 0;

    const skills = await this.getSkillProgress(roadmap.enrollment_id);
    const bandTestUnlocked = progressPercent >= 70;

    return {
      roadmap: {
        id: roadmap.id,
        enrollment_id: roadmap.enrollment_id,
        current_band: Number(roadmap.current_band),
        target_band: Number(roadmap.target_band),
        target_completion_date: roadmap.target_completion_date ?? null,
        difficulty_level: roadmap.difficulty_level,
        status: roadmap.status,
        progress_percent: progressPercent,
        current_lesson_index: roadmap.current_lesson_index,
      },
      lessons: lessons.map((lesson: any) => ({
        ...lesson,
        lesson_code: `${String(lesson.skill_area).slice(0, 3).toUpperCase()}-${String(lesson.lesson_order).padStart(2, '0')}`,
        band_level: Number(lesson.band_level),
        flashcard_repo_id: lesson.flashcard_repo_id ?? undefined,
        practice_repo_id: lesson.practice_repo_id ?? undefined,
        mini_test_repo_id: lesson.mini_test_repo_id ?? undefined,
      })),
      skills,
      band_test: {
        unlocked: bandTestUnlocked,
        reason: bandTestUnlocked
          ? 'Ready to start band test'
          : 'Complete at least 70% of roadmap lessons',
      },
    };
  }

  /**
   * Lấy lộ trình IELTS của account hiện tại; tự động tạo mới nếu chưa có.
   *
   * Luồng:
   *   1. getOrCreateStudentEnrollment → đảm bảo có enrollment.
   *   2. Truy vấn roadmap theo enrollment_id (kèm lessons + repos liên quan).
   *   3. Nếu chưa có roadmap → gọi generateRoadmapForEnrollment để tạo mới.
   *   4. Reload roadmap sau khi tạo (đảm bảo có đủ relations).
   *   5. Trả về formatRoadmapResponse.
   */
  async getOrCreateRoadmapForAccount(accountId: number): Promise<any> {
    const { enrollment } = await this.getOrCreateStudentEnrollment(accountId);

    let roadmap: any = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { enrollment_id: enrollment.id },
      include: {
        lessons: {
          orderBy: { lesson_order: 'asc' },
          include: {
            flashcardRepo: true,
            practiceRepo: true,
            miniTestRepo: true,
          },
        },
      },
    });

    if (!roadmap) {
      const { currentBand, targetBand } =
        this.resolveBandsFromEnrollment(enrollment);
      roadmap = await this.generateRoadmapForEnrollment(
        enrollment.id,
        currentBand,
        targetBand,
      );
      roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
        where: { id: roadmap.id },
        include: {
          lessons: {
            orderBy: { lesson_order: 'asc' },
            include: {
              flashcardRepo: true,
              practiceRepo: true,
              miniTestRepo: true,
            },
          },
        },
      });
    }

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    // Tự động đồng bộ tiến độ lên Dashboard (Healing)
    await this.syncOverallProgress(enrollment.id);

    return this.formatRoadmapResponse(roadmap);
  }

  /**
   * Tạo hoặc tái tạo lộ trình IELTS theo yêu cầu từ client.
   *
   * Khác biệt với getOrCreate:
   *   - Nếu đã có roadmap → gọi regenerateRoadmap (xoá lessons cũ, tạo lại).
   *   - Nếu chưa có → tạo mới qua generateRoadmapForEnrollment.
   *   - Payload có thể override current_band / target_band.
   */
  async generateRoadmapForAccount(
    accountId: number,
    payload?: Partial<CreateRoadmapDto>,
  ): Promise<any> {
    const { enrollment } = await this.getOrCreateStudentEnrollment(accountId);
    const roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { enrollment_id: enrollment.id },
    });

    const enrollmentBands = this.resolveBandsFromEnrollment(enrollment);
    const currentBand = payload?.current_band ?? enrollmentBands.currentBand;
    const targetBand = payload?.target_band ?? enrollmentBands.targetBand;

    const generated = roadmap
      ? await this.regenerateRoadmap(
        roadmap.id,
        currentBand,
        Recommendation.MAINTAIN,
      )
      : await this.generateRoadmapForEnrollment(
        enrollment.id,
        currentBand,
        targetBand,
      );

    const roadmapWithLessons =
      await this.prisma.ieltsAdaptiveRoadmap.findUnique({
        where: { id: generated.id },
        include: {
          lessons: {
            orderBy: { lesson_order: 'asc' },
            include: {
              flashcardRepo: true,
              practiceRepo: true,
              miniTestRepo: true,
            },
          },
        },
      });

    if (!roadmapWithLessons) {
      throw new NotFoundException('Roadmap not found after generation');
    }

    // Đồng bộ tiến độ (thường là 0% nếu tạo mới, hoặc % mới nếu tái tạo)
    await this.syncOverallProgress(enrollment.id);

    return this.formatRoadmapResponse(roadmapWithLessons);
  }

  /**
   * Wrapper tiện lợi: tạo roadmap cho một enrollmentId cụ thể.
   * Đơn giản uỷ quyền cho createRoadmap với đúng tham số.
   */
  async generateRoadmapForEnrollment(
    enrollmentId: number,
    currentBand: number,
    targetBand: number,
  ): Promise<RoadmapResponseDto> {
    return this.createRoadmap({
      enrollment_id: enrollmentId,
      current_band: currentBand,
      target_band: targetBand,
    });
  }

  /**
   * Cập nhật band mục tiêu và/hoặc ngày thi, sau đó tái tạo lại toàn bộ lộ trình.
   *
   * Luồng:
   *   1. Lấy enrollment và roadmap hiện tại.
   *   2. Xác định giá trị mới: dùng dto nếu cung cấp, fallback về giá trị cũ.
   *   3. Cập nhật IeltsAdaptiveRoadmap (target_band, target_completion_date).
   *   4. Đồng bộ toeic_plan_state + current_score/target_score trong CertificateEnrollment
   *      để resolveBands luôn nhất quán.
   *   5. Gọi regenerateRoadmap: xoá lessons cũ, tạo lại với ngày học mới.
   *   6. Reload và trả về formatRoadmapResponse.
   */
  async updateTargetsAndRegenerate(
    accountId: number,
    dto: UpdateRoadmapTargetsDto,
  ): Promise<any> {
    const { enrollment } = await this.getOrCreateStudentEnrollment(accountId);

    const roadmap: any = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { enrollment_id: enrollment.id },
    });

    if (!roadmap) {
      throw new NotFoundException(
        'Roadmap not found. Please generate a roadmap first.',
      );
    }

    const newTargetBand = dto.target_band ?? Number(roadmap.target_band);
    const newCurrentBand = dto.current_band ?? Number(roadmap.current_band);
    const newTargetDate = dto.target_completion_date
      ? new Date(dto.target_completion_date)
      : roadmap.target_completion_date;

    // Persist the new targets without touching lesson sequence yet
    await this.prisma.ieltsAdaptiveRoadmap.update({
      where: { id: roadmap.id },
      data: {
        target_band: newTargetBand,
        target_completion_date: newTargetDate,
      },
    });

    // Also persist to enrollment toeic_plan_state so resolveBands stays consistent
    const existingPlanState = (enrollment.toeic_plan_state as any) ?? {};
    await this.prisma.certificateEnrollment.update({
      where: { id: enrollment.id },
      data: {
        toeic_plan_state: {
          ...existingPlanState,
          targetBand: newTargetBand,
          currentBand: newCurrentBand,
          targetCompletionDate:
            dto.target_completion_date ??
            existingPlanState.targetCompletionDate,
        },
        target_score: Math.round(newTargetBand * 100),
        current_score: Math.round(newCurrentBand * 100),
      },
    });

    // Regenerate roadmap lessons with updated bands and new target date
    await this.regenerateRoadmap(
      roadmap.id,
      newCurrentBand,
      Recommendation.MAINTAIN,
      newTargetDate,
    );

    // Return full formatted roadmap
    const updated = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { id: roadmap.id },
      include: {
        lessons: {
          orderBy: { lesson_order: 'asc' },
          include: {
            flashcardRepo: true,
            practiceRepo: true,
            miniTestRepo: true,
          },
        },
      },
    });

    if (!updated) {
      throw new NotFoundException('Roadmap not found after update');
    }

    return this.formatRoadmapResponse(updated);
  }

  // ============================================
  // ROADMAP MANAGEMENT
  // ============================================

  /**
   * Tạo mới lộ trình học IELTS adaptive cho một enrollment.
   *
   * Luồng chi tiết:
   *   1. Kiểm tra không tồn tại roadmap cũ → ném BadRequest nếu đã có.
   *   2. Xác định độ khó (beginner / intermediate / advanced) từ current_band.
   *   3. Gọi generateLessons để tìm LearningRepository phù hợp với band và tạo danh sách bài.
   *      → Báo lỗi nếu không có repository nào (chưa chạy seed).
   *   4. Lưu IeltsAdaptiveRoadmap vào DB.
   *   5. Tính ngày học cho từng bài (computeScheduledDates).
   *   6. Lưu từng IeltsLesson: bài đầu tiên mở khoá (UNLOCKED), còn lại là LOCKED.
   *   7. Khởi tạo bảng IeltsSkillProgress cho tất cả kỹ năng của enrollment.
   */
  async createRoadmap(dto: CreateRoadmapDto): Promise<RoadmapResponseDto> {
    this.logger.log(
      `Creating roadmap for enrollment ${dto.enrollment_id}, band ${dto.current_band}`,
    );

    // Kiểm tra: mỗi enrollment chỉ được có 1 roadmap active
    const existing = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { enrollment_id: dto.enrollment_id },
    });

    if (existing) {
      throw new BadRequestException(
        'Roadmap already exists for this enrollment',
      );
    }

    // Xác định mức độ khó tương ứng với band hiện tại
    const difficulty = this.getDifficultyLevel(dto.current_band);

    // Tìm kiếm và chuẩn bị danh sách bài học từ repository
    const lessons = await this.generateLessons(
      dto.current_band,
      dto.target_band,
    );

    if (lessons.length === 0) {
      throw new BadRequestException(
        'No IELTS learning repositories found. Please run: node prisma/seedIeltsAdaptive.js',
      );
    }

    // Tạo bản ghi IeltsAdaptiveRoadmap (header)
    const roadmap = await this.prisma.ieltsAdaptiveRoadmap.create({
      data: {
        enrollment_id: dto.enrollment_id,
        current_band: dto.current_band,
        target_band: dto.target_band,
        difficulty_level: difficulty,
        lesson_sequence: lessons.map((l) => l.id),
        current_lesson_index: 0,
        status: 'active',
      },
    });

    // Phân bổ ngày học đều từ hôm nay đến ngày thi
    const scheduledDates = this.computeScheduledDates(
      lessons.length,
      (dto as any).target_completion_date
        ? new Date((dto as any).target_completion_date)
        : null,
    );

    // Lưu từng bài học: mở khoá tất cả bài cùng band_level đầu tiên, còn lại khoá
    const firstBandLevel = lessons[0]?.band_level ?? dto.current_band;
    const createdLessons: any[] = [];
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const bandLevel = lesson.band_level ?? dto.current_band;
      const created = await this.prisma.ieltsLesson.create({
        data: {
          roadmap_id: roadmap.id,
          skill_area: lesson.skill_area,
          lesson_title: lesson.lesson_title,
          lesson_order: i,
          band_level: bandLevel,
          flashcard_repo_id: lesson.flashcard_repo_id,
          practice_repo_id: lesson.practice_repo_id,
          mini_test_repo_id: lesson.mini_test_repo_id,
          estimated_minutes: lesson.estimated_minutes,
          status: bandLevel === firstBandLevel ? LessonStatus.UNLOCKED : LessonStatus.LOCKED,
          scheduled_date: scheduledDates[i] ?? undefined,
        },
      });
      createdLessons.push(created);
    }

    // Khởi tạo tiến độ từng kỹ năng ban đầu (band mặc định = current_band)
    await this.initializeSkillProgress(dto.enrollment_id, dto.current_band);

    // Cập nhật tiến độ tổng thể lên Dashboard
    await this.syncOverallProgress(dto.enrollment_id);

    return {
      ...roadmap,
      current_band: Number(roadmap.current_band),
      target_band: Number(roadmap.target_band),
      lesson_sequence: roadmap.lesson_sequence,
      lessons: createdLessons,
    };
  }

  /**
   * Lấy roadmap (kèm tất cả lessons và repos) theo enrollmentId.
   * Ném NotFoundException nếu chưa có roadmap.
   */
  async getRoadmap(enrollmentId: number): Promise<RoadmapResponseDto> {
    const roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { enrollment_id: enrollmentId },
      include: {
        lessons: {
          orderBy: { lesson_order: 'asc' },
          include: {
            flashcardRepo: true,
            practiceRepo: true,
            miniTestRepo: true,
          },
        },
      },
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    return {
      ...roadmap,
      current_band: Number(roadmap.current_band),
      target_band: Number(roadmap.target_band),
      lesson_sequence: roadmap.lesson_sequence,
    };
  }

  /**
   * Tái tạo toàn bộ lộ trình khi band thay đổi hoặc khi học sinh cập nhật mục tiêu.
   *
   * Luồng:
   *   1. Load roadmap và enrollment liên quan.
   *   2. Xác định mức khó mới theo newBand.
   *   3. Gọi generateLessons để xây dựng danh sách bài phù hợp với band và recommendation.
   *   4. XOÁ toàn bộ lessons cũ (tránh duplicate khi tạo lại).
   *   5. Cập nhật header roadmap: current_band, roadmap_version++, difficulty, lesson_sequence.
   *   6. Tính lại scheduledDates: ưu tiên tham số đầu vào, fallback về target_completion_date cũ.
   *   7. Tạo lại lessons mới: bài đầu UNLOCKED, còn lại LOCKED.
   *
   * @param roadmapId            ID của roadmap cần tái tạo
   * @param newBand              Band mới sau khi ước tính
   * @param recommendation       Gợi ý: advance | maintain | remedial
   * @param targetCompletionDate Ngày thi mới (undefined = giữ nguyên cũ)
   */
  async regenerateRoadmap(
    roadmapId: number,
    newBand: number,
    recommendation: string,
    targetCompletionDate?: Date | null,
  ): Promise<RoadmapResponseDto> {
    this.logger.log(`Regenerating roadmap ${roadmapId} for band ${newBand}`);

    const roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { id: roadmapId },
      include: { enrollment: true },
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    const difficulty = this.getDifficultyLevel(newBand);
    const lessons = await this.generateLessons(
      newBand,
      Number(roadmap.target_band),
      recommendation,
    );

    // Xoá tất cả lessons cũ để tạo lại từ đầu, tránh trùng lặp
    await this.prisma.ieltsLesson.deleteMany({
      where: { roadmap_id: roadmapId },
    });

    // Update roadmap
    const updated = await this.prisma.ieltsAdaptiveRoadmap.update({
      where: { id: roadmapId },
      data: {
        current_band: newBand,
        roadmap_version: { increment: 1 },
        difficulty_level: difficulty,
        lesson_sequence: lessons.map((l) => l.id),
        current_lesson_index: 0,
      },
    });

    // Fetch the latest target_completion_date from roadmap if not supplied
    const roadmapAny = roadmap as any;
    const effectiveTargetDate =
      targetCompletionDate !== undefined
        ? targetCompletionDate
        : (roadmapAny.target_completion_date as Date | null);

    const scheduledDates = this.computeScheduledDates(
      lessons.length,
      effectiveTargetDate,
    );

    // Create new lessons
    const createdLessons: any[] = [];
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const created = await this.prisma.ieltsLesson.create({
        data: {
          roadmap_id: roadmapId,
          skill_area: lesson.skill_area,
          lesson_title: lesson.lesson_title,
          lesson_order: i,
          band_level: newBand,
          flashcard_repo_id: lesson.flashcard_repo_id,
          practice_repo_id: lesson.practice_repo_id,
          mini_test_repo_id: lesson.mini_test_repo_id,
          estimated_minutes: lesson.estimated_minutes,
          status: i === 0 ? LessonStatus.UNLOCKED : LessonStatus.LOCKED,
          scheduled_date: scheduledDates[i] ?? undefined,
        },
      });
      createdLessons.push(created);
    }

    // Đồng bộ tiến độ 0% (reset) hoặc tiến độ mới sau khi tái tạo
    await this.syncOverallProgress(roadmap.enrollment_id);

    return {
      ...updated,
      current_band: Number(updated.current_band),
      target_band: Number(updated.target_band),
      lesson_sequence: updated.lesson_sequence,
      lessons: createdLessons,
    };
  }

  // ============================================
  // LESSON MANAGEMENT
  // ============================================

  /**
   * Lấy chi tiết một bài học theo lessonId.
   * Kèm theo đầy đủ nội dung: flashcard, practice và mini test repos
   * (bao gồm các items và options của từng item).
   * Ném NotFoundException nếu không tìm thấy bài.
   */
  async getLesson(
    lessonId: number,
    accountId?: number,
  ): Promise<LessonResponseDto> {
    // If accountId is provided, scope the lookup to lessons that belong to the user's roadmap
    let roadmapId: number | undefined;
    if (accountId) {
      const student = await this.prisma.student.findUnique({
        where: { account_id: accountId },
        select: { student_id: true },
      });
      if (student) {
        const enrollment = await this.prisma.certificateEnrollment.findFirst({
          where: {
            student_id: student.student_id,
            cert_type: 'ielts',
            status: 'active',
          },
          orderBy: { id: 'desc' },
          select: { id: true },
        });
        if (enrollment) {
          const roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
            where: { enrollment_id: enrollment.id },
            select: { id: true },
          });
          roadmapId = roadmap?.id;
        }
      }
    }

    const lesson = await this.prisma.ieltsLesson.findFirst({
      where: roadmapId
        ? { id: lessonId, roadmap_id: roadmapId }
        : { id: lessonId },
      include: {
        flashcardRepo: {
          include: {
            items: {
              include: { options: true },
              orderBy: { item_order: 'asc' },
            },
          },
        },
        practiceRepo: {
          include: {
            items: {
              include: { options: true },
              orderBy: { item_order: 'asc' },
            },
          },
        },
        miniTestRepo: {
          include: {
            items: {
              include: { options: true },
              orderBy: { item_order: 'asc' },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // ── Build structured content for the frontend ──────────────────────────────
    const buildRepoContent = (repo: any) => {
      if (!repo) return null;
      const meta: any = repo.metadata ?? {};
      return {
        id: repo.id,
        slug: repo.slug,
        title: repo.title,
        content_type: repo.content_type,
        skill_area: repo.skill_area,
        estimated_minutes: repo.estimated_minutes,
        pass_score: repo.pass_score,
        // Structured content from metadata
        passage: meta.content?.passage ?? null,
        audio: meta.content?.audio ?? null,
        writing_prompt: meta.content?.writingPrompt ?? null,
        speaking_prompt: meta.content?.speakingPrompt ?? null,
        lesson_template: meta.lessonTemplate ?? null,
        // Items mapped with clean structure
        items: (repo.items ?? []).map((item: any) => ({
          id: item.id,
          item_order: item.item_order,
          item_type: item.item_type,
          title: item.title,
          stem: item.stem,
          reading_passage: item.reading_passage,
          media_audio_url: item.media_audio_url,
          media_image_url: item.media_image_url,
          hint: item.hint,
          explanation: item.explanation,
          estimated_seconds: item.estimated_seconds,
          score_weight: item.score_weight,
          metadata: item.metadata,
          options: (item.options ?? []).map((opt: any) => ({
            id: opt.id,
            option_key: opt.option_key,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            rationale: opt.rationale,
            sort_order: opt.sort_order,
          })),
        })),
      };
    };

    return {
      ...lesson,
      flashcard_repo_id: lesson.flashcard_repo_id ?? undefined,
      practice_repo_id: lesson.practice_repo_id ?? undefined,
      mini_test_repo_id: lesson.mini_test_repo_id ?? undefined,
      flashcardRepo: buildRepoContent(lesson.flashcardRepo) ?? undefined,
      practiceRepo: buildRepoContent(lesson.practiceRepo) ?? undefined,
      miniTestRepo: buildRepoContent(lesson.miniTestRepo) ?? undefined,
      skill_area: lesson.skill_area as SkillArea,
      status: lesson.status as LessonStatus,
      band_level: Number(lesson.band_level),
    };
  }

  /**
   * Mở khoá tất cả bài học cùng band_level tiếp theo trong lộ trình.
   *
   * Luồng:
   *   1. Load roadmap kèm danh sách lessons (sắp xếp theo lesson_order).
   *   2. Tìm tất cả bài còn LOCKED.
   *   3. Xác định band_level nhỏ nhất trong số bài LOCKED.
   *   4. Mở khoá tất cả bài có cùng band_level đó.
   *   5. Cập nhật current_lesson_index đến bài cuối cùng vừa mở khoá.
   */
  async unlockNextLesson(roadmapId: number): Promise<void> {
    const roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { id: roadmapId },
      include: { lessons: { orderBy: { lesson_order: 'asc' } } },
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    // Tìm tất cả bài còn khoá
    const lockedLessons = roadmap.lessons.filter(
      (l) => l.status === LessonStatus.LOCKED,
    );
    if (lockedLessons.length === 0) return;

    // Band level nhỏ nhất trong các bài còn khoá = band tiếp theo cần mở
    const nextBandLevel = Math.min(
      ...lockedLessons.map((l) => Number(l.band_level)),
    );

    // Mở khoá tất cả bài cùng band_level đó
    const toUnlock = lockedLessons.filter(
      (l) => Number(l.band_level) === nextBandLevel,
    );

    for (const lesson of toUnlock) {
      await this.prisma.ieltsLesson.update({
        where: { id: lesson.id },
        data: { status: LessonStatus.UNLOCKED },
      });
    }

    // Cập nhật con trỏ đến vị trí bài cuối cùng vừa mở khoá
    const lastUnlockedOrder = Math.max(
      ...toUnlock.map((l) => l.lesson_order),
    );
    await this.prisma.ieltsAdaptiveRoadmap.update({
      where: { id: roadmapId },
      data: { current_lesson_index: lastUnlockedOrder },
    });
  }

  /**
   * Đánh dấu một bài học là đã hoàn thành và cập nhật tiến độ kỹ năng.
   *
   * Luồng:
   *   1. Cập nhật status của IeltsLesson → COMPLETED.
   *   2. Load lại lesson kèm roadmap để lấy enrollment_id.
   *   3. Tăng lessons_completed và cập nhật last_practiced_at trong IeltsSkillProgress
   *      tương ứng với kỹ năng của bài học.
   */
  async completeLesson(lessonId: number, score?: number, isFullyCompleted: boolean = true): Promise<void> {
    await this.prisma.ieltsLesson.update({
      where: { id: lessonId },
      data: { status: isFullyCompleted ? LessonStatus.COMPLETED : LessonStatus.IN_PROGRESS },
    });

    // Load lesson để lấy thông tin kỹ năng và enrollment
    const lesson = await this.prisma.ieltsLesson.findUnique({
      where: { id: lessonId },
      include: { roadmap: true },
    });

    if (lesson) {
      if (score !== undefined) {
        // Cập nhật skill progress (total practice count, accuracy trung bình)
        await this.updateSkillProgress(
          lesson.roadmap.enrollment_id,
          lesson.skill_area,
          score,
          1,
        );

        // Tạo IeltsPracticeSession record để lưu lịch sử làm bài Speaking/Writing!
        const repoId = lesson.practice_repo_id ?? lesson.mini_test_repo_id ?? lesson.flashcard_repo_id ?? 0;
        await this.prisma.ieltsPracticeSession.create({
          data: {
            lesson_id: lesson.id,
            session_type: lesson.mini_test_repo_id ? 'MINI_TEST' : 'PRACTICE',
            repository_id: repoId,
            answers: {},
            total_questions: 1,
            correct_count: score >= 50 ? 1 : 0,
            accuracy_percent: score,
            total_time_sec: 120,
            avg_time_per_q: 120,
            error_analysis: {},
          },
        });

        // Chỉ increment lessons_completed cho IeltsSkillProgress khi hoàn thành hoàn toàn bài học
        if (isFullyCompleted) {
          await this.prisma.ieltsSkillProgress.update({
            where: {
              enrollment_id_skill_area: {
                enrollment_id: lesson.roadmap.enrollment_id,
                skill_area: lesson.skill_area,
              },
            },
            data: {
              lessons_completed: { increment: 1 },
            },
          });
        }
      } else {
        // Increment lesson completed count nếu không có score (để giữ logic cũ cho Reading/Listening)
        if (isFullyCompleted) {
          await this.prisma.ieltsSkillProgress.update({
            where: {
              enrollment_id_skill_area: {
                enrollment_id: lesson.roadmap.enrollment_id,
                skill_area: lesson.skill_area,
              },
            },
            data: {
              lessons_completed: { increment: 1 },
              last_practiced_at: new Date(),
            },
          });
        }
      }

      if (isFullyCompleted) {
        // Kiểm tra nếu tất cả bài cùng band_level đã hoàn thành → mở khoá band tiếp theo
        const sameBandLessons = await this.prisma.ieltsLesson.findMany({
          where: {
            roadmap_id: lesson.roadmap_id,
            band_level: lesson.band_level,
          },
        });
        const allSameBandCompleted = sameBandLessons.every(
          (l) => l.status === LessonStatus.COMPLETED,
        );
        if (allSameBandCompleted) {
          await this.unlockNextLesson(lesson.roadmap_id);
        }

        // Đồng bộ tiến độ tổng thể lên Dashboard
        await this.syncOverallProgress(lesson.roadmap.enrollment_id);
      }
    }
  }

  /**
   * Đồng bộ tiến độ từ Roadmap sang CertificateEnrollment để hiển thị trên Dashboard.
   * Tính theo công thức: (số bài đã hoàn thành / tổng số bài trong roadmap) * 100.
   */
  private async syncOverallProgress(enrollmentId: number): Promise<void> {
    const roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { enrollment_id: enrollmentId },
      include: { lessons: true },
    });

    if (!roadmap) return;

    const lessons = roadmap.lessons || [];
    const completedCount = lessons.filter(
      (l) => l.status === LessonStatus.COMPLETED,
    ).length;
    const progressPercent =
      lessons.length > 0
        ? Math.round((completedCount / lessons.length) * 100)
        : 0;

    await this.prisma.certificateEnrollment.update({
      where: { id: enrollmentId },
      data: { progress_percent: progressPercent },
    });

    this.logger.log(
      `Synced overall progress for enrollment ${enrollmentId}: ${progressPercent}%`,
    );
  }

  // ============================================
  // PRACTICE SESSION MANAGEMENT
  // ============================================

  /**
   * Nhận và chấm điểm một phiên luyện tập (warmup hoặc mini test).
   *
   * Luồng xử lý:
   *   1. Load LearningRepository kèm items và options để có đáp án đúng.
   *   2. Duyệt từng câu hỏi:
   *      - So sánh câu trả lời của học sinh với option_key hoặc option_text đúng.
   *      - Cộng dồn correctCount và totalTime.
   *      - Ghi lại detailedResults (kết quả chi tiết từng câu).
   *      - Phân loại lỗi vào errorAnalysis theo errorType trong metadata.
   *   3. Tính accuracy (%) và avgTimePerQ.
   *   4. Lưu IeltsPracticeSession vào DB.
   *   5. Cập nhật IeltsSkillProgress: tổng luyện tập, accuracy trung bình.
   *   6. Nếu session_type là MINI_TEST:
   *      - completeLesson: đánh dấu bài hoàn thành.
   *      - unlockNextLesson: mở bài tiếp theo.
   */
  async submitPractice(
    dto: SubmitPracticeDto,
  ): Promise<PracticeSessionResponseDto> {
    this.logger.log(
      `Submitting ${dto.session_type} practice for lesson ${dto.lesson_id}`,
    );

    // Normalise answers into Record<string, string> regardless of input format
    let answersMap: Record<string, string> = {};
    const timeMap: Record<string, number> = dto.time_per_question ?? {};

    if (Array.isArray(dto.answers)) {
      for (const a of dto.answers) {
        answersMap[String(a.question_id)] = String(a.answer ?? '');
        if (a.time_taken_sec != null)
          timeMap[String(a.question_id)] = a.time_taken_sec;
      }
    } else {
      answersMap = dto.answers ?? {};
    }

    // Load repository with items + options
    const repo = await this.prisma.learningRepository.findUnique({
      where: { id: dto.repository_id },
      include: {
        items: {
          include: { options: true },
          orderBy: { item_order: 'asc' },
        },
      },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    // Grade each item
    let correctCount = 0;
    let totalTime = 0;
    const detailedResults: any[] = [];
    const feedbackList: any[] = [];
    const errorAnalysis: Record<string, number> = {};

    for (const item of repo.items) {
      const key = item.id.toString();
      const studentAnswer = (answersMap[key] ?? '').trim().toLowerCase();
      const correctOption = item.options.find((opt) => opt.is_correct);

      // For gap_fill / short_answer: check correct_answer in metadata or option
      const meta: any = item.metadata ?? {};
      const acceptedAnswers: string[] = (meta.acceptedAnswers ?? []).map(
        (a: string) => a.trim().toLowerCase(),
      );
      const correctKey = correctOption?.option_key?.toLowerCase() ?? '';
      const correctText =
        correctOption?.option_text?.trim().toLowerCase() ?? '';
      const metaCorrect = String(meta.correctAnswer ?? '')
        .trim()
        .toLowerCase();

      const isCorrect =
        studentAnswer.length > 0 &&
        (studentAnswer === correctKey ||
          studentAnswer === correctText ||
          (metaCorrect && studentAnswer === metaCorrect) ||
          (acceptedAnswers.length > 0 &&
            acceptedAnswers.includes(studentAnswer)));

      if (isCorrect) correctCount++;

      const timeTaken = timeMap[key] ?? 0;
      totalTime += timeTaken;

      const displayCorrect =
        correctOption?.option_key ?? meta.correctAnswer ?? '';

      detailedResults.push({
        item_id: item.id,
        question: item.stem,
        student_answer: answersMap[key],
        correct_answer: displayCorrect,
        is_correct: isCorrect,
        time_taken: timeTaken,
        expected_time: item.estimated_seconds ?? 60,
        explanation: item.explanation ?? item.ai_explanation,
      });

      feedbackList.push({
        question_id: key,
        is_correct: isCorrect,
        correct_answer: displayCorrect,
        explanation: item.explanation ?? item.ai_explanation,
        time_taken_sec: timeTaken,
      });

      if (!isCorrect) {
        const errorType = meta.errorTag ?? meta.errorType ?? 'general';
        errorAnalysis[errorType] = (errorAnalysis[errorType] ?? 0) + 1;
      }
    }

    const totalQuestions = repo.items.length;
    const accuracy =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const avgTimePerQ = totalQuestions > 0 ? totalTime / totalQuestions : 0;
    const passScore = repo.pass_score ?? 60;
    const passed = accuracy >= passScore;

    const session = await this.prisma.ieltsPracticeSession.create({
      data: {
        lesson_id: dto.lesson_id,
        session_type: dto.session_type,
        repository_id: dto.repository_id,
        answers: answersMap as any,
        total_questions: totalQuestions,
        correct_count: correctCount,
        accuracy_percent: accuracy,
        total_time_sec: totalTime,
        avg_time_per_q: avgTimePerQ,
        error_analysis: errorAnalysis,
      },
    });

    const lesson = await this.prisma.ieltsLesson.findUnique({
      where: { id: dto.lesson_id },
      include: { roadmap: true },
    });

    if (lesson) {
      await this.updateSkillProgress(
        lesson.roadmap.enrollment_id,
        lesson.skill_area,
        accuracy,
        totalQuestions,
      );
    }

    // Mini test → complete lesson and unlock next (regardless of pass/fail, student progresses)
    let unlockedLessonId: number | undefined;
    const isMiniTest =
      dto.session_type === SessionType.MINI_TEST ||
      repo.content_type === 'mini-test';

    if (isMiniTest) {
      await this.completeLesson(dto.lesson_id);
      if (lesson) {
        // completeLesson đã tự động gọi unlockNextLesson khi tất cả bài cùng band hoàn thành
        // Tìm bài tiếp theo đã được mở khoá
        const nextLesson = await this.prisma.ieltsLesson.findFirst({
          where: {
            roadmap_id: lesson.roadmap_id,
            status: LessonStatus.UNLOCKED,
            lesson_order: { gt: lesson.lesson_order },
          },
          orderBy: { lesson_order: 'asc' },
        });
        unlockedLessonId = nextLesson?.id;
      }
    } else if (lesson && lesson.status === LessonStatus.LOCKED) {
      // Mark in_progress
      await this.prisma.ieltsLesson.update({
        where: { id: dto.lesson_id },
        data: { status: LessonStatus.IN_PROGRESS },
      });
    }

    // Roadmap progress
    let roadmapProgressPercent: number | undefined;
    if (lesson) {
      const roadmapWithLessons =
        await this.prisma.ieltsAdaptiveRoadmap.findUnique({
          where: { id: lesson.roadmap_id },
          include: { lessons: { select: { status: true } } },
        });
      if (roadmapWithLessons) {
        const total = roadmapWithLessons.lessons.length;
        const done = roadmapWithLessons.lessons.filter(
          (l) => l.status === LessonStatus.COMPLETED,
        ).length;
        roadmapProgressPercent =
          total > 0 ? Math.round((done / total) * 100) : 0;
      }
    }

    return {
      id: session.id,
      lesson_id: session.lesson_id,
      session_type: session.session_type as SessionType,
      repository_id: session.repository_id,
      total_questions: session.total_questions,
      correct_count: session.correct_count,
      accuracy_percent: Number(session.accuracy_percent),
      passed,
      total_time_sec: session.total_time_sec ?? undefined,
      avg_time_per_q: session.avg_time_per_q
        ? Number(session.avg_time_per_q)
        : undefined,
      error_analysis: session.error_analysis as any,
      feedback: feedbackList,
      detailed_results: detailedResults,
      next: {
        unlocked_lesson_id: unlockedLessonId,
        lesson_completed: isMiniTest,
        roadmap_progress_percent: roadmapProgressPercent,
      },
    };
  }

  // ============================================
  // BAND TEST MANAGEMENT
  // ============================================

  /**
   * Wrapper tạo Band Test theo accountId.
   * Nếu client không gửi roadmap_id → tự lấy/tạo roadmap của account đó.
   */
  async createBandTestForAccount(
    accountId: number,
    dto: CreateBandTestDto,
  ): Promise<BandTestResponseDto> {
    const roadmapId = dto.roadmap_id
      ? dto.roadmap_id
      : (await this.getOrCreateRoadmapForAccount(accountId)).roadmap.id;

    return this.createBandTest({
      ...dto,
      roadmap_id: roadmapId,
    });
  }

  /**
   * Tạo một bài kiểm tra Band Test toàn diện cho roadmap.
   *
   * Luồng:
   *   1. Validate roadmap_id tồn tại.
   *   2. Với mỗi kỹ năng trong skills_to_test:
   *      - Tìm câu hỏi phù hợp với current_band (bandMin ≤ band ≤ bandMax), status='active'.
   *      - Ưu tiên câu ít được dùng nhất (orderBy usedCount asc) → đa dạng đề thi.
   *      - Sau khi chọn: tăng usedCount của các câu đó lên 1.
   *   3. Tạo bản ghi IeltsBandTest với status='in_progress',
   *      answers={} và các metric được set về 0 (chờ submit để tính).
   */
  async createBandTest(dto: CreateBandTestDto): Promise<BandTestResponseDto> {
    if (!dto.roadmap_id) {
      throw new BadRequestException(
        'roadmap_id is required to create band test',
      );
    }

    this.logger.log(`Creating band test for roadmap ${dto.roadmap_id}`);

    const roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { id: dto.roadmap_id },
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    const questionsPerSkill = dto.questions_per_skill || 20;
    const questionIds: string[] = [];
    const currentBand = Number(roadmap.current_band);

    /**
     * Cơ chế trộn câu hỏi theo tỷ lệ band:
     *   40% câu ở mức band hiện tại (core):    bandMin ≤ band ≤ bandMax, bandMax ≤ band+0.5
     *   35% câu ở mức band thấp hơn (review):  bandMax < band
     *   25% câu ở mức band cao hơn (challenge): bandMin > band
     *
     * Mỗi nhóm được random shuffle trước khi lấy → mỗi lần test khác nhau.
     * Ưu tiên câu ít được dùng nhất (usedCount asc) trong từng nhóm.
     */
    const shuffle = <T>(arr: T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    for (const skill of dto.skills_to_test) {
      const coreCount = Math.round(questionsPerSkill * 0.4);
      const reviewCount = Math.round(questionsPerSkill * 0.35);
      const challengeCount = questionsPerSkill - coreCount - reviewCount;

      // For listening: only select questions whose linked passage has audio_url set.
      // Seed/generated questions without audio are excluded.
      const listeningAudioFilter =
        skill === 'listening'
          ? { passage: { audio_url: { not: null } } }
          : {};

      // reading skill also pulls vocabulary questions (alias — same MCQ format,
      // no dedicated reading question seed exists until teacher imports reading content)
      const skillFilter =
        skill === 'reading'
          ? { skill: { in: ['reading', 'vocabulary'] } }
          : { skill };

      // Core: câu ở mức band hiện tại
      const coreQ = await this.prisma.ieltsQuestion.findMany({
        where: {
          ...skillFilter,
          bandMin: { lte: currentBand + 0.5 },
          bandMax: { gte: currentBand - 0.5 },
          status: { in: ['active', 'approved'] },
          ...listeningAudioFilter,
        },
        orderBy: { usedCount: 'asc' },
        take: coreCount * 3,
      });

      // Review: câu dễ hơn (band thấp hơn)
      const reviewQ = await this.prisma.ieltsQuestion.findMany({
        where: {
          ...skillFilter,
          bandMax: { lt: currentBand - 0.4 },
          status: { in: ['active', 'approved'] },
          ...listeningAudioFilter,
        },
        orderBy: { usedCount: 'asc' },
        take: reviewCount * 3,
      });

      // Challenge: câu khó hơn (band cao hơn)
      const challengeQ = await this.prisma.ieltsQuestion.findMany({
        where: {
          ...skillFilter,
          bandMin: { gt: currentBand + 0.4 },
          status: { in: ['active', 'approved'] },
          ...listeningAudioFilter,
        },
        orderBy: { usedCount: 'asc' },
        take: challengeCount * 3,
      });

      const selected = [
        ...shuffle(coreQ).slice(0, coreCount),
        ...shuffle(reviewQ).slice(0, reviewCount),
        ...shuffle(challengeQ).slice(0, challengeCount),
      ];

      // Shuffle kết quả cuối trước khi đưa vào đề (không lộ thứ tự nhóm)
      const finalSelection = shuffle(selected);
      questionIds.push(...finalSelection.map((q) => q.id));

      // Cập nhật usedCount để lần sau ưu tiên câu hỏi khác
      if (finalSelection.length > 0) {
        await this.prisma.ieltsQuestion.updateMany({
          where: { id: { in: finalSelection.map((q) => q.id) } },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const bandTest = await this.prisma.ieltsBandTest.create({
      data: {
        roadmap_id: dto.roadmap_id,
        test_name: `Band ${roadmap.current_band} Comprehensive Test`,
        band_level: roadmap.current_band,
        skills_tested: dto.skills_to_test,
        question_ids: questionIds,
        answers: {},
        total_questions: questionIds.length,
        correct_count: 0,
        accuracy_percent: 0,
        total_time_sec: 0,
        // expected_time_sec: tính từ expectedTimeSec của từng câu hỏi đã chọn
        expected_time_sec: await this.prisma.ieltsQuestion
          .findMany({
            where: { id: { in: questionIds } },
            select: { expectedTimeSec: true },
          })
          .then((qs) => qs.reduce((s, q) => s + q.expectedTimeSec, 0)),
        response_time_factor: 0,
        previous_band: roadmap.current_band,
        estimated_band: roadmap.current_band,
        band_change: BandChange.STABLE,
        confidence_level: 'low',
        skill_breakdown: {},
        recommendation: 'maintain',
        weak_skills: [],
        status: 'in_progress',
      },
    });

    return {
      ...bandTest,
      band_level: Number(bandTest.band_level),
      accuracy_percent: Number(bandTest.accuracy_percent),
      response_time_factor: Number(bandTest.response_time_factor),
      consistency_score: bandTest.consistency_score
        ? Number(bandTest.consistency_score)
        : undefined,
      previous_band: Number(bandTest.previous_band),
      estimated_band: Number(bandTest.estimated_band),
      band_change: bandTest.band_change as BandChange,
      recommendation: bandTest.recommendation as Recommendation,
    };
  }

  /**
   * Lấy chi tiết Band Test kèm danh sách câu hỏi (không trả đáp án đúng).
   */
  async getBandTestWithQuestions(testId: string): Promise<{
    bandTest: BandTestResponseDto;
    questions: {
      id: string;
      skill: string;
      questionText: string;
      questionType: string;
      options: Record<string, string>;
      expectedTimeSec: number;
    }[];
  }> {
    const bandTest = await this.prisma.ieltsBandTest.findUnique({
      where: { id: testId },
    });

    if (!bandTest) {
      throw new NotFoundException('Band test not found');
    }

    const questions = await this.prisma.ieltsQuestion.findMany({
      where: { id: { in: bandTest.question_ids } },
    });

    // ── Resolve passage audio for listening questions ──────────────────────
    const passageIds = [
      ...new Set(questions.map((q) => q.passage_id).filter((id): id is string => !!id)),
    ];
    const passageMap = new Map<string, { audioUrl: string | null }>();
    if (passageIds.length > 0) {
      const passages = await this.prisma.ieltsPassage.findMany({
        where: { id: { in: passageIds } },
        select: { id: true, audio_url: true },
      });
      for (const p of passages) {
        passageMap.set(p.id, { audioUrl: p.audio_url ?? null });
      }
    }

    const orderMap = new Map<string, number>(
      bandTest.question_ids.map((id, index) => [id, index]),
    );

    const mapOptions = (options: any): Record<string, string> => {
      if (!Array.isArray(options)) return {};
      return options.reduce((acc: Record<string, string>, opt: any) => {
        const key = String(
          opt?.key ?? opt?.option_key ?? opt?.label ?? '',
        ).trim();
        if (!key) return acc;
        acc[key] = String(opt?.text ?? opt?.option_text ?? '').trim();
        return acc;
      }, {});
    };

    const orderedQuestions = [...questions].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? 0;
      const bi = orderMap.get(b.id) ?? 0;
      return ai - bi;
    });

    return {
      bandTest: {
        ...bandTest,
        band_level: Number(bandTest.band_level),
        accuracy_percent: Number(bandTest.accuracy_percent),
        response_time_factor: Number(bandTest.response_time_factor),
        consistency_score: bandTest.consistency_score
          ? Number(bandTest.consistency_score)
          : undefined,
        previous_band: Number(bandTest.previous_band),
        estimated_band: Number(bandTest.estimated_band),
        band_change: bandTest.band_change as BandChange,
        recommendation: bandTest.recommendation as Recommendation,
      },
      questions: orderedQuestions.map((q) => ({
        id: q.id,
        skill: q.skill,
        questionText: q.questionText,
        questionType: q.questionType,
        options: mapOptions(q.options),
        expectedTimeSec: q.expectedTimeSec,
        contextType: q.contextType ?? 'standalone',
        mediaAudioUrl: q.passage_id
          ? (passageMap.get(q.passage_id)?.audioUrl ?? null)
          : null,
      })),
    };
  }

  /**
   * Nộp bài và tính kết quả Band Test.
   *
   * Luồng xử lý chi tiết:
   *   1. Load bandTest kèm roadmap để lấy enrollment_id và previous_band.
   *   2. Load tất cả IeltsQuestion theo question_ids trong đề thi.
   *   3. Chấm điểm từng câu:
   *      - So sánh đáp án học sinh với correctAnswer.
   *      - Thu thập questionResults (cho BandEstimationService) và skillResults (cho breakdown).
   *   4. Xây dựng skillBreakdown: accuracy + avgTime + weakPoints cho từng kỹ năng.
   *   5. Gọi BandEstimationService.estimateBand() để tính:
   *      - Hướng thay đổi band: UP / DOWN / STABLE.
   *      - Band mới ước tính.
   *      - Độ tin cậy và gợi ý học tập.
   *   6. Cập nhật IeltsBandTest với toàn bộ kết quả, status='completed'.
   *   7. Nếu band thay đổi (UP/DOWN) → regenerateRoadmap với band mới.
   *   8. Cập nhật điểm yếu (IeltsWeakPoint) và gợi ý (IeltsRecommendation)
   *      dựa trên danh sách câu sai. Lỗi ở bước này không chặn kết quả trả về.
   */
  async submitBandTest(dto: SubmitBandTestDto): Promise<BandTestResponseDto> {
    this.logger.log(`Submitting band test ${dto.test_id}`);

    const bandTest = await this.prisma.ieltsBandTest.findUnique({
      where: { id: dto.test_id },
      include: { roadmap: true },
    });

    if (!bandTest) {
      throw new NotFoundException('Band test not found');
    }

    // Lấy toàn bộ câu hỏi của đề thi từ DB
    const questions = await this.prisma.ieltsQuestion.findMany({
      where: { id: { in: bandTest.question_ids } },
    });

    // Chấm điểm và tổng hợp kết quả theo từng kỹ năng
    const questionResults: any[] = [];
    const skillResults: Record<
      string,
      { correct: number; total: number; times: number[] }
    > = {};

    for (const question of questions) {
      const rawAnswer = dto.answers[question.id];
      const studentAnswer = rawAnswer;
      let aiBandScore: number | null = null;

      if (typeof rawAnswer === 'string' && rawAnswer.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rawAnswer);
          if (parsed?.bandScore != null) {
            const parsedScore = Number(parsed.bandScore);
            if (Number.isFinite(parsedScore)) {
              aiBandScore = parsedScore;
            }
          }
        } catch (_) {
          // Ignore parse errors, treat as normal answer string.
        }
      }

      const isAiSkill =
        question.skill === 'writing' || question.skill === 'speaking';
      const isCorrect =
        isAiSkill && aiBandScore != null
          ? aiBandScore >= Number(bandTest.previous_band)
          : studentAnswer === question.correctAnswer;
      const timeTaken = dto.time_per_question[question.id] || 60;

      questionResults.push({
        questionId: question.id,
        isCorrect,
        timeTaken,
        expectedTime: question.expectedTimeSec,
        errorSeverity: question.errorTag ? parseInt(question.errorTag) : 0,
      });

      // Gộp kết quả theo kỹ năng để tính skillBreakdown
      if (!skillResults[question.skill]) {
        skillResults[question.skill] = { correct: 0, total: 0, times: [] };
      }
      skillResults[question.skill].total++;
      if (isCorrect) skillResults[question.skill].correct++;
      skillResults[question.skill].times.push(timeTaken);
    }

    // Tổng hợp skillBreakdown: accuracy, avgTime, weakPoints
    const skillBreakdown: Record<string, any> = {};
    for (const [skill, data] of Object.entries(skillResults)) {
      const accuracy = (data.correct / data.total) * 100;
      const avgTime = data.times.reduce((a, b) => a + b, 0) / data.times.length;

      skillBreakdown[skill] = {
        accuracy,
        correct: data.correct,
        total: data.total,
        avgTime,
        weakPoints: accuracy < 60 ? ['needs-practice'] : [],
      };
    }

    // Ước tính band mới dựa trên accuracy, thời gian, consistency và lỗi nghiêm trọng
    const estimation = await this.bandEstimation.estimateBand({
      roadmapId: bandTest.roadmap_id,
      currentBand: Number(bandTest.previous_band),
      questionResults,
      skillBreakdown,
    });

    const totalTime = Object.values(dto.time_per_question).reduce(
      (a: number, b: number) => a + b,
      0,
    );

    // Lưu kết quả hoàn chỉnh vào DB, đánh dấu status='completed'
    // Lưu ý: CHƯA áp dụng band mới vào lộ trình — chờ người dùng xác nhận (applyBandResult)
    const updated = await this.prisma.ieltsBandTest.update({
      where: { id: dto.test_id },
      data: {
        answers: dto.answers as any,
        correct_count: questionResults.filter((r) => r.isCorrect).length,
        accuracy_percent: estimation.metrics.accuracy,
        total_time_sec: totalTime,
        response_time_factor: estimation.metrics.responseTimeFactor,
        consistency_score: estimation.metrics.consistencyScore,
        severe_error_count: estimation.metrics.severeErrorCount,
        suspicious_fast_answers: estimation.metrics.suspiciousFastAnswers,
        estimated_band: estimation.estimatedBand,
        band_change: estimation.bandChange,
        confidence_level: estimation.confidenceLevel,
        skill_breakdown: skillBreakdown,
        recommendation: estimation.recommendation,
        weak_skills: estimation.weakSkills,
        status: 'completed',
        completed_at: new Date(),
      },
    });

    // Chi tiết từng câu hỏi để hiển thị trên giao diện kết quả
    const questionResultsDetail = questionResults.map((r) => {
      const q = questions.find((q) => q.id === r.questionId);
      return {
        questionId: r.questionId,
        skill: q?.skill ?? '',
        isCorrect: r.isCorrect,
        studentAnswer: dto.answers[r.questionId] ?? '',
        correctAnswer: q?.correctAnswer ?? '',
        timeTaken: r.timeTaken,
        expectedTime: r.expectedTime,
        questionText: q?.questionText ?? '',
      };
    });

    // Fire-and-forget: record to StudentTestResult for analytics
    this.recordBandTestResult(bandTest.roadmap.enrollment_id, updated, estimation, totalTime).catch(() => { });

    return {
      ...updated,
      band_level: Number(updated.band_level),
      accuracy_percent: Number(updated.accuracy_percent),
      response_time_factor: Number(updated.response_time_factor),
      consistency_score: updated.consistency_score
        ? Number(updated.consistency_score)
        : undefined,
      previous_band: Number(updated.previous_band),
      estimated_band: Number(updated.estimated_band),
      band_change: updated.band_change as BandChange,
      recommendation: updated.recommendation as Recommendation,
      band_applied: false,
      warnings: estimation.metrics.warnings,
      question_results: questionResultsDetail,
    };
  }

  private async recordBandTestResult(
    enrollmentId: number,
    updated: any,
    estimation: any,
    totalTimeSec: number,
  ): Promise<void> {
    const enrollment = await this.prisma.certificateEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { student_id: true, student: { select: { account_id: true } } },
    });
    if (!enrollment) return;

    const estimatedBand = Number(updated.estimated_band);
    const skillBreakdown = updated.skill_breakdown as Record<string, any> | null;

    await this.testResultRecorder.record({
      accountId: enrollment.student.account_id,
      certType: 'ielts',
      testType: 'mock',
      testPhase: 'midterm',
      enrollmentId,
      totalScore: Math.round(estimatedBand * 10),
      bandScore: estimatedBand,
      listeningScore: skillBreakdown?.listening
        ? Math.round((skillBreakdown.listening.accuracy / 100) * 90)
        : null,
      readingScore: skillBreakdown?.reading
        ? Math.round((skillBreakdown.reading.accuracy / 100) * 90)
        : null,
      writingScore: skillBreakdown?.writing
        ? Math.round((skillBreakdown.writing.accuracy / 100) * 90)
        : null,
      speakingScore: skillBreakdown?.speaking
        ? Math.round((skillBreakdown.speaking.accuracy / 100) * 90)
        : null,
      totalQuestions: updated.total_questions,
      correctCount: updated.correct_count,
      accuracyPercent: Number(updated.accuracy_percent),
      durationMinutes: Math.ceil(totalTimeSec / 60),
      completedAt: new Date(),
    });
  }

  /**
   * Áp dụng kết quả Band Test: cập nhật band + tái tạo lộ trình + cập nhật điểm yếu.
   *
   * Được gọi khi người dùng bấm "Cập nhật năng lực" sau khi xem kết quả bài test.
   *
   * Luồng:
   *   1. Tải IeltsBandTest đã completed.
   *   2. Nếu band_change ≠ STABLE → regenerateRoadmap với band mới.
   *   3. Cập nhật điểm yếu + gợi ý học tập (evaluation).
   *   4. Trả về { applied: true, new_band, band_change, roadmap_regenerated }.
   */
  async applyBandResult(testId: string): Promise<{
    applied: boolean;
    new_band: number;
    band_change: string;
    roadmap_regenerated: boolean;
  }> {
    this.logger.log(`Applying band result for test ${testId}`);

    const bandTest = await this.prisma.ieltsBandTest.findUnique({
      where: { id: testId },
      include: { roadmap: true },
    });

    if (!bandTest) {
      throw new NotFoundException('Band test not found');
    }

    if (bandTest.status !== 'completed') {
      throw new BadRequestException('Band test has not been submitted yet');
    }

    let roadmapRegenerated = false;

    // Áp dụng band mới vào lộ trình nếu có thay đổi
    if (bandTest.band_change !== BandChange.STABLE) {
      await this.regenerateRoadmap(
        bandTest.roadmap_id,
        Number(bandTest.estimated_band),
        bandTest.recommendation as Recommendation,
      );
      roadmapRegenerated = true;
    }

    // Cập nhật điểm yếu & gợi ý học tập dựa trên kết quả bài test
    try {
      await this.evaluation.ensureDefaultErrorTagsSeeded();
      const answers = bandTest.answers as Record<string, string>;
      // Lấy lại question IDs để tìm skill của từng câu sai
      const questions = await this.prisma.ieltsQuestion.findMany({
        where: { id: { in: bandTest.question_ids } },
        select: { id: true, skill: true, correctAnswer: true },
      });
      const wrongSkills = questions
        .filter((q) => answers[q.id] !== q.correctAnswer)
        .map((q) => q.skill ?? (bandTest.skills_tested[0] || 'reading'));

      if (wrongSkills.length) {
        await this.evaluation.updateWeakPoints(
          bandTest.roadmap.enrollment_id,
          wrongSkills,
        );
        await this.evaluation.generateRecommendations(
          bandTest.roadmap.enrollment_id,
        );
      }
    } catch (err: any) {
      this.logger.warn(
        `Evaluation update failed (non-critical): ${err?.message}`,
      );
    }

    return {
      applied: true,
      new_band: Number(bandTest.estimated_band),
      band_change: bandTest.band_change,
      roadmap_regenerated: roadmapRegenerated,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Xác định mức độ khó dựa trên band hiện tại.
   *   - band < 4.0  → beginner
   *   - 4.0 ≤ band < 6.0 → intermediate
   *   - band ≥ 6.0  → advanced
   */
  private getDifficultyLevel(band: number): string {
    if (band < 4.0) return 'beginner';
    if (band < 6.0) return 'intermediate';
    return 'advanced';
  }

  /**
   * Tạo danh sách bài học cho lộ trình từ LearningRepository.
   *
   * Luồng:
   *   - Duyệt qua 4 kỹ năng: reading, listening, grammar, vocabulary.
   *   - Với mỗi kỹ năng, tìm 3 loại repository: lesson (flashcard), practice_set, mini_test.
   *   - Chiến lược tìm kiếm 2 bước (findRepository):
   *       Bước 1: Tìm CHÍNH XÁC theo difficulty_level + target_score_min/max.
   *       Bước 2 (fallback): Tìm bất kỳ repository đã publish của kỹ năng đó.
   *   - Nếu không có repository nào cho kỹ năng → cảnh báo log và bỏ qua kỹ năng đó.
   *   - Trả về mảng bài học với đầy đủ repo IDs.
   *
   * @param currentBand    Band hiện tại của học sinh
   * @param targetBand     Band mục tiêu (hiện chưa dùng, dự phòng mở rộng)
   * @param recommendation Gợi ý từ BandEstimation (advance/maintain/remedial)
   */
  private async generateLessons(
    currentBand: number,
    targetBand: number,
    recommendation?: string,
  ): Promise<any[]> {
    // ── 4 core IELTS skills only ──────────────────────────────────────────────
    const skills: SkillArea[] = [
      SkillArea.READING,
      SkillArea.LISTENING,
      SkillArea.WRITING,
      SkillArea.SPEAKING,
    ];

    const lessons: any[] = [];

    // Build band steps from currentBand up to (but not including) targetBand
    const bandSteps: number[] = [];
    let b = Math.round(currentBand * 10) / 10;
    while (b < targetBand - 0.01) {
      bandSteps.push(b);
      b = Math.round((b + 0.5) * 10) / 10;
    }
    if (bandSteps.length === 0) bandSteps.push(currentBand);

    const findRepository = async (
      skill: SkillArea,
      contentType: string,
      scoreMin: number,
      scoreMax: number,
    ) => {
      // Exact match: skill + contentType + score range
      const exact = await this.prisma.learningRepository.findFirst({
        where: {
          cert_type: 'ielts',
          skill_area: skill,
          content_type: contentType,
          is_published: true,
          target_score_min: { lte: scoreMin },
          target_score_max: { gte: scoreMin },
        },
        orderBy: { updated_at: 'desc' },
      });
      if (exact) return exact;

      // Fallback: ignore score range, match skill + contentType
      return this.prisma.learningRepository.findFirst({
        where: {
          cert_type: 'ielts',
          skill_area: skill,
          content_type: contentType,
          is_published: true,
        },
        orderBy: { updated_at: 'desc' },
      });
    };

    for (const bandStep of bandSteps) {
      const scoreMin = Math.round(bandStep * 100);
      const scoreMax = Math.round((bandStep + 0.5) * 100);

      for (const skill of skills) {
        const flashcardRepo = await findRepository(
          skill,
          'flashcards',
          scoreMin,
          scoreMax,
        );
        const practiceRepo = await findRepository(
          skill,
          'practice',
          scoreMin,
          scoreMax,
        );
        const miniTestRepo = await findRepository(
          skill,
          'mini-test',
          scoreMin,
          scoreMax,
        );

        if (!flashcardRepo && !practiceRepo && !miniTestRepo) {
          this.logger.warn(
            `No IELTS repositories found for skill=${skill} band=${bandStep}. ` +
            'Run: node prisma/seedIeltsAdaptive.js',
          );
          continue;
        }

        lessons.push({
          id: lessons.length + 1,
          skill_area: skill,
          lesson_title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} — Band ${bandStep}→${Math.round((bandStep + 0.5) * 10) / 10}`,
          flashcard_repo_id: flashcardRepo?.id ?? null,
          practice_repo_id: practiceRepo?.id ?? null,
          mini_test_repo_id: miniTestRepo?.id ?? null,
          estimated_minutes:
            flashcardRepo?.estimated_minutes ??
            practiceRepo?.estimated_minutes ??
            30,
          band_level: bandStep,
        });
      }
    }

    return lessons;
  }

  /**
   * Khởi tạo (hoặc đặt lại) bản ghi IeltsSkillProgress cho tất cả kỹ năng
   * của một enrollment khi tạo roadmap mới.
   * Dùng upsert: nếu đã có → cập nhật current_band; nếu chưa → tạo mới với giá trị 0.
   */
  private async initializeSkillProgress(
    enrollmentId: number,
    currentBand: number,
  ): Promise<void> {
    const skills: SkillArea[] = Object.values(SkillArea);

    for (const skill of skills) {
      await this.prisma.ieltsSkillProgress.upsert({
        where: {
          enrollment_id_skill_area: {
            enrollment_id: enrollmentId,
            skill_area: skill,
          },
        },
        update: {
          current_band: currentBand,
        },
        create: {
          enrollment_id: enrollmentId,
          skill_area: skill,
          current_band: currentBand,
          lessons_completed: 0,
          total_practice: 0,
          accuracy_rate: 0,
          recent_sessions: [],
          weak_topics: [],
        },
      });
    }
  }

  /**
   * Cập nhật tiến độ kỹ năng sau mỗi phiên luyện tập.
   *
   * Thuật toán:
   *   1. Load bản ghi IeltsSkillProgress hiện tại.
   *   2. Thêm session mới vào recent_sessions; giữ tối đa 5 session gần nhất.
   *   3. Tính lại accuracy trung bình theo công thức có trọng số:
   *      newAccuracy = (oldAccuracy * oldTotal + accuracy * questionsAttempted) / newTotal
   *   4. Cập nhật total_practice, accuracy_rate, recent_sessions, last_practiced_at.
   */
  private async updateSkillProgress(
    enrollmentId: number,
    skillArea: string,
    accuracy: number,
    questionsAttempted: number,
  ): Promise<void> {
    const progress = await this.prisma.ieltsSkillProgress.findUnique({
      where: {
        enrollment_id_skill_area: {
          enrollment_id: enrollmentId,
          skill_area: skillArea,
        },
      },
    });

    if (!progress) return;

    // Update recent sessions (keep last 5)
    const recentSessions = (progress.recent_sessions as any[]) || [];
    recentSessions.push({
      date: new Date().toISOString(),
      accuracy,
      questions: questionsAttempted,
    });

    const updatedSessions = recentSessions.slice(-5);

    // Calculate new average accuracy
    const totalAttempted = progress.total_practice + questionsAttempted;
    const newAccuracy =
      (Number(progress.accuracy_rate) * progress.total_practice +
        accuracy * questionsAttempted) /
      totalAttempted;

    await this.prisma.ieltsSkillProgress.update({
      where: {
        enrollment_id_skill_area: {
          enrollment_id: enrollmentId,
          skill_area: skillArea,
        },
      },
      data: {
        total_practice: totalAttempted,
        accuracy_rate: newAccuracy,
        recent_sessions: updatedSessions,
        last_practiced_at: new Date(),
      },
    });
  }

  /**
   * Lấy danh sách tiến độ tất cả kỹ năng của một enrollment.
   * Ép kiểu Decimal → number và format lại dữ liệu JSON cho client.
   */
  async getSkillProgress(
    enrollmentId: number,
  ): Promise<SkillProgressResponseDto[]> {
    const progressRecords = await this.prisma.ieltsSkillProgress.findMany({
      where: { enrollment_id: enrollmentId },
      orderBy: { skill_area: 'asc' },
    });

    return progressRecords.map((p) => ({
      id: p.id,
      enrollment_id: p.enrollment_id,
      skill_area: p.skill_area as SkillArea,
      current_band: Number(p.current_band),
      lessons_completed: p.lessons_completed,
      total_practice: p.total_practice,
      accuracy_rate: Number(p.accuracy_rate),
      recent_sessions: (p.recent_sessions as any[]) || [],
      weak_topics: (p.weak_topics as any[]) || [],
      last_practiced_at: p.last_practiced_at ?? undefined,
    }));
  }

  /**
   * Wrapper: lấy tiến độ kỹ năng theo accountId (tự resolve enrollment).
   */
  async getSkillProgressByAccount(
    accountId: number,
  ): Promise<SkillProgressResponseDto[]> {
    const { enrollment } = await this.getOrCreateStudentEnrollment(accountId);
    return this.getSkillProgress(enrollment.id);
  }

  /**
   * Wrapper: lấy phân tích học tập toàn diện theo accountId.
   * Bao gồm: tiến độ kỹ năng, điểm yếu, và gợi ý học tập.
   * Uỷ quyền cho EvaluationService.getLearningAnalysis.
   */
  async getLearningAnalysisByAccount(accountId: number) {
    const { enrollment } = await this.getOrCreateStudentEnrollment(accountId);
    return this.evaluation.getLearningAnalysis(enrollment.id);
  }

  /**
   * Lấy phân tích AI (Gemini) dựa trên tiến độ thực tế các kỹ năng của học viên.
   */
  async getAiInsightForAccount(accountId: number): Promise<any> {
    const skills = await this.getSkillProgressByAccount(accountId);
    const activeSkills = skills.filter((s) => s.total_practice > 0 || s.lessons_completed > 0);

    if (activeSkills.length === 0) {
      return null;
    }

    const summary = activeSkills.map((s) => ({
      skill: s.skill_area,
      band: s.current_band,
      accuracy: s.accuracy_rate,
      lessons: s.lessons_completed,
      practice: s.total_practice,
      trend:
        s.recent_sessions && s.recent_sessions.length >= 2
          ? (
            (s.recent_sessions[s.recent_sessions.length - 1]?.accuracy ?? 0) -
            (s.recent_sessions[0]?.accuracy ?? 0)
          ).toFixed(1)
          : 'N/A',
      weak_topics: s.weak_topics,
    }));

    const prompt = `You are an IELTS tutor AI. Analyze this student's skill progress and provide an actionable analysis in Vietnamese.
Analyze this student's data and return ONLY a JSON object.

Student skill progress data:
${JSON.stringify(summary)}

Ensure all text/descriptions are in clear, natural Vietnamese and customized based on their actual strengths or weaknesses shown in their scores (e.g. low accuracy vs high accuracy).

Return exactly this JSON format:
{
  "summary": "1-2 sentence overall assessment in Vietnamese of their progress.",
  "weakest_skill": "reading|listening|writing|speaking",
  "strengths": ["2-3 short, specific strengths or encouraging points"],
  "improvements": ["2-3 specific actionable tips in Vietnamese for their weak areas"],
  "today_focus": "One specific task to do today, in Vietnamese.",
  "encouragement": "One short motivational sentence."
}`;

    try {
      const response = await this.gemini.generateJson<any>(prompt);
      if (!response || typeof response !== 'object') {
        throw new Error('Gemini did not return a valid object');
      }
      return {
        summary: response.summary || 'Hãy tiếp tục hoàn thành các bài học tiếp theo nhé!',
        weakest_skill: response.weakest_skill || 'reading',
        strengths: Array.isArray(response.strengths) ? response.strengths : ['Tập trung học tập tốt'],
        improvements: Array.isArray(response.improvements) ? response.improvements : ['Luyện tập thêm kỹ năng còn yếu'],
        today_focus: response.today_focus || 'Làm bài học tiếp theo trong lộ trình',
        encouragement: response.encouragement || 'Cố lên! Bạn đang đi đúng hướng trên con đường chinh phục IELTS.',
      };
    } catch (err) {
      this.logger.error(`Failed to generate AI insight with Gemini: ${err.message}`);
      // Fallback
      const weakest = activeSkills.sort((a, b) => a.accuracy_rate - b.accuracy_rate)[0]?.skill_area ?? 'reading';
      return {
        summary: 'Hãy tiếp tục hoàn thành các bài học tiếp theo để AI phân tích chi tiết kỹ năng của bạn nhé!',
        weakest_skill: weakest,
        strengths: ['Tập trung học tập tốt', 'Hoàn thành bài tập đều đặn'],
        improvements: ['Luyện tập thêm kỹ năng còn yếu', 'Xem kỹ giải thích đáp án'],
        today_focus: 'Làm bài học tiếp theo trong lộ trình',
        encouragement: 'Cố lên! Bạn đang đi đúng hướng trên con đường chinh phục IELTS.',
      };
    }
  }
}
