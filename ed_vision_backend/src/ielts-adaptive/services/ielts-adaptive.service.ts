import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BandEstimationService } from './band-estimation.service';
import { EvaluationService } from './evaluation.service';
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
  ) {}

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
    const planState = enrollment.toeic_plan_state as any;
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
      throw new NotFoundException('Student profile not found for current account');
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
    if (!targetDate || totalLessons === 0) return Array(totalLessons).fill(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil((end.getTime() - today.getTime()) / 86400000);
    if (totalDays <= 0) return Array(totalLessons).fill(null);

    return Array.from({ length: totalLessons }, (_, i) => {
      const offset = Math.round((i / Math.max(totalLessons - 1, 1)) * totalDays);
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
      lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

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
      const { currentBand, targetBand } = this.resolveBandsFromEnrollment(enrollment);
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
      ? await this.regenerateRoadmap(roadmap.id, currentBand, Recommendation.MAINTAIN)
      : await this.generateRoadmapForEnrollment(enrollment.id, currentBand, targetBand);

    const roadmapWithLessons = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
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

    const roadmap:any = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { enrollment_id: enrollment.id },
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found. Please generate a roadmap first.');
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
          targetCompletionDate: dto.target_completion_date ?? existingPlanState.targetCompletionDate,
        },
        target_score: Math.round(newTargetBand * 100),
        current_score: Math.round(newCurrentBand * 100),
      },
    });

    // Regenerate roadmap lessons with updated bands and new target date
    await this.regenerateRoadmap(roadmap.id, newCurrentBand, Recommendation.MAINTAIN, newTargetDate);

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
      throw new BadRequestException('Roadmap already exists for this enrollment');
    }

    // Xác định mức độ khó tương ứng với band hiện tại
    const difficulty = this.getDifficultyLevel(dto.current_band);

    // Tìm kiếm và chuẩn bị danh sách bài học từ repository
    const lessons = await this.generateLessons(dto.current_band, dto.target_band);

    if (lessons.length === 0) {
      throw new BadRequestException(
        'No IELTS learning repositories found. Please run seed first.',
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
      (dto as any).target_completion_date ? new Date((dto as any).target_completion_date) : null,
    );

    // Lưu từng bài học: bài đầu mở khoá, còn lại khoá chờ mở tuần tự
    const createdLessons: any[] = [];
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const created = await this.prisma.ieltsLesson.create({
        data: {
          roadmap_id: roadmap.id,
          skill_area: lesson.skill_area,
          lesson_title: lesson.lesson_title,
          lesson_order: i,
          band_level: dto.current_band,
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

    // Khởi tạo tiến độ từng kỹ năng ban đầu (band mặc định = current_band)
    await this.initializeSkillProgress(dto.enrollment_id, dto.current_band);

    return {
      ...roadmap,
      current_band: Number(roadmap.current_band),
      target_band: Number(roadmap.target_band),
      lesson_sequence: roadmap.lesson_sequence as number[],
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
      lesson_sequence: roadmap.lesson_sequence as number[],
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

    const scheduledDates = this.computeScheduledDates(lessons.length, effectiveTargetDate);

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

    return {
      ...updated,
      current_band: Number(updated.current_band),
      target_band: Number(updated.target_band),
      lesson_sequence: updated.lesson_sequence as number[],
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
  async getLesson(lessonId: number): Promise<LessonResponseDto> {
    const lesson = await this.prisma.ieltsLesson.findUnique({
      where: { id: lessonId },
      include: {
        flashcardRepo: {
          include: { items: { include: { options: true }, orderBy: { item_order: 'asc' } } },
        },
        practiceRepo: {
          include: { items: { include: { options: true }, orderBy: { item_order: 'asc' } } },
        },
        miniTestRepo: {
          include: { items: { include: { options: true }, orderBy: { item_order: 'asc' } } },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return {
      ...lesson,
      flashcard_repo_id: lesson.flashcard_repo_id ?? undefined,
      practice_repo_id: lesson.practice_repo_id ?? undefined,
      mini_test_repo_id: lesson.mini_test_repo_id ?? undefined,
      flashcardRepo: lesson.flashcardRepo ?? undefined,
      practiceRepo: lesson.practiceRepo ?? undefined,
      miniTestRepo: lesson.miniTestRepo ?? undefined,
      skill_area: lesson.skill_area as SkillArea,
      status: lesson.status as LessonStatus,
      band_level: Number(lesson.band_level),
    };
  }

  /**
   * Mở khoá bài học tiếp theo trong lộ trình sau khi hoàn thành bài hiện tại.
   *
   * Luồng:
   *   1. Load roadmap kèm danh sách lessons (sắp xếp theo lesson_order).
   *   2. Tính nextIndex = current_lesson_index + 1.
   *   3. Nếu còn bài tiếp theo: đổi status của bài đó thành UNLOCKED
   *      và tăng current_lesson_index trong roadmap.
   *   4. Nếu không còn bài nào → không làm gì (học sinh đã hoàn thành lộ trình).
   */
  async unlockNextLesson(roadmapId: number): Promise<void> {
    const roadmap = await this.prisma.ieltsAdaptiveRoadmap.findUnique({
      where: { id: roadmapId },
      include: { lessons: { orderBy: { lesson_order: 'asc' } } },
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found');
    }

    const nextIndex = roadmap.current_lesson_index + 1;
    if (nextIndex < roadmap.lessons.length) {
      const nextLesson = roadmap.lessons[nextIndex];

      // Mở khoá bài kế tiếp
      await this.prisma.ieltsLesson.update({
        where: { id: nextLesson.id },
        data: { status: LessonStatus.UNLOCKED },
      });

      // Tiến con trỏ lộ trình lên 1 vị trí
      await this.prisma.ieltsAdaptiveRoadmap.update({
        where: { id: roadmapId },
        data: { current_lesson_index: nextIndex },
      });
    }
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
  async completeLesson(lessonId: number): Promise<void> {
    await this.prisma.ieltsLesson.update({
      where: { id: lessonId },
      data: { status: LessonStatus.COMPLETED },
    });

    // Load lesson để lấy thông tin kỹ năng và enrollment
    const lesson = await this.prisma.ieltsLesson.findUnique({
      where: { id: lessonId },
      include: { roadmap: true },
    });

    if (lesson) {
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

    // Tải repository kèm toàn bộ câu hỏi và lựa chọn
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

    // Chấm điểm từng câu: so sánh câu trả lời với đáp án đúng
    let correctCount = 0;
    let totalTime = 0;
    const detailedResults: any[] = [];
    const errorAnalysis: Record<string, number> = {};

    for (const item of repo.items) {
      const studentAnswer = dto.answers[item.id.toString()];
      const correctOption = item.options.find((opt) => opt.is_correct);

      if (!correctOption) continue;

      // Chấp nhận cả option_key (A/B/C/D) hoặc option_text
      const isCorrect =
        studentAnswer === correctOption.option_key ||
        studentAnswer === correctOption.option_text;

      if (isCorrect) correctCount++;

      const timeTaken = dto.time_per_question?.[item.id.toString()] || 0;
      totalTime += timeTaken;

      detailedResults.push({
        item_id: item.id,
        question: item.stem,
        student_answer: studentAnswer,
        correct_answer: correctOption.option_key,
        is_correct: isCorrect,
        time_taken: timeTaken,
        expected_time: item.estimated_seconds || 60,
        explanation: item.explanation || item.ai_explanation,
      });

      // Phân loại loại lỗi (ví dụ: skimming, vocabulary) từ metadata câu hỏi
      if (!isCorrect) {
        const errorType = item.metadata?.['errorType'] || 'general';
        errorAnalysis[errorType] = (errorAnalysis[errorType] || 0) + 1;
      }
    }

    const totalQuestions = repo.items.length;
    const accuracy = (correctCount / totalQuestions) * 100;
    const avgTimePerQ = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    // Lưu kết quả phiên luyện tập vào DB
    const session = await this.prisma.ieltsPracticeSession.create({
      data: {
        lesson_id: dto.lesson_id,
        session_type: dto.session_type,
        repository_id: dto.repository_id,
        answers: dto.answers as any,
        total_questions: totalQuestions,
        correct_count: correctCount,
        accuracy_percent: accuracy,
        total_time_sec: totalTime,
        avg_time_per_q: avgTimePerQ,
        error_analysis: errorAnalysis,
      },
    });

    // Cập nhật tiến độ kỹ năng: accuracy trung bình, số câu đã luyện
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

    // Mini test: hoàn thành bài học và mở khoá bài tiếp theo
    if (dto.session_type === SessionType.MINI_TEST) {
      await this.completeLesson(dto.lesson_id);
      if (lesson) {
        await this.unlockNextLesson(lesson.roadmap_id);
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
      total_time_sec: session.total_time_sec ?? undefined,
      avg_time_per_q: session.avg_time_per_q ? Number(session.avg_time_per_q) : undefined,
      error_analysis: session.error_analysis as any,
      detailed_results: detailedResults,
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
      throw new BadRequestException('roadmap_id is required to create band test');
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

    // Chọn câu hỏi cho từng kỹ năng: phù hợp band, ít dùng nhất
    for (const skill of dto.skills_to_test) {
      const questions = await this.prisma.ieltsQuestion.findMany({
        where: {
          skill: skill,
          bandMin: { lte: roadmap.current_band },
          bandMax: { gte: roadmap.current_band },
          status: 'active',
        },
        take: questionsPerSkill,
        orderBy: { usedCount: 'asc' }, // Ưu tiên câu chưa/ít được dùng để đa dạng đề
      });

      questionIds.push(...questions.map((q) => q.id));

      // Cập nhật usedCount để lần sau ưu tiên câu hỏi khác
      await this.prisma.ieltsQuestion.updateMany({
        where: { id: { in: questions.map((q) => q.id) } },
        data: { usedCount: { increment: 1 } },
      });
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
        expected_time_sec: questionIds.length * 60,
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
      consistency_score: bandTest.consistency_score ? Number(bandTest.consistency_score) : undefined,
      previous_band: Number(bandTest.previous_band),
      estimated_band: Number(bandTest.estimated_band),
      band_change: bandTest.band_change as BandChange,
      recommendation: bandTest.recommendation as Recommendation,
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
    const skillResults: Record<string, { correct: number; total: number; times: number[] }> = {};

    for (const question of questions) {
      const studentAnswer = dto.answers[question.id];
      const isCorrect = studentAnswer === question.correctAnswer;
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

    const totalTime = Object.values(dto.time_per_question).reduce((a: number, b: number) => a + b, 0);

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

    return {
      ...updated,
      band_level: Number(updated.band_level),
      accuracy_percent: Number(updated.accuracy_percent),
      response_time_factor: Number(updated.response_time_factor),
      consistency_score: updated.consistency_score ? Number(updated.consistency_score) : undefined,
      previous_band: Number(updated.previous_band),
      estimated_band: Number(updated.estimated_band),
      band_change: updated.band_change as BandChange,
      recommendation: updated.recommendation as Recommendation,
      band_applied: false,
      warnings: estimation.metrics.warnings,
      question_results: questionResultsDetail,
    };
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
        await this.evaluation.updateWeakPoints(bandTest.roadmap.enrollment_id, wrongSkills);
        await this.evaluation.generateRecommendations(bandTest.roadmap.enrollment_id);
      }
    } catch (err: any) {
      this.logger.warn(`Evaluation update failed (non-critical): ${err?.message}`);
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
    const skills: SkillArea[] = [
      SkillArea.READING,
      SkillArea.LISTENING,
      SkillArea.GRAMMAR,
      SkillArea.VOCABULARY,
    ];

    const lessons: any[] = [];
    const difficulty = this.getDifficultyLevel(currentBand);
    const currentScore = Math.round(currentBand * 100);

    /**
     * Tìm repository phù hợp nhất:
     *   - Ưu tiên: đúng difficulty + nằm trong range target_score.
     *   - Fallback: bất kỳ repo đã publish của kỹ năng và content type đó.
     */
    const findRepository = async (skill: SkillArea, contentType: string) => {
      const exact = await this.prisma.learningRepository.findFirst({
        where: {
          cert_type: 'ielts',
          skill_area: skill,
          content_type: contentType,
          difficulty_level: difficulty,
          is_published: true,
          target_score_min: { lte: currentScore },
          target_score_max: { gte: currentScore },
        },
        orderBy: { updated_at: 'desc' },
      });

      if (exact) {
        return exact;
      }

      // Fallback: không lọc theo score range, chỉ cần đúng skill + content type
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

    for (const skill of skills) {
      const flashcardRepo = await findRepository(skill, 'lesson');
      const practiceRepo = await findRepository(skill, 'practice_set');
      const miniTestRepo = await findRepository(skill, 'mini_test');

      if (!flashcardRepo && !practiceRepo && !miniTestRepo) {
        this.logger.warn(
          `No repositories found for skill ${skill} at band ${currentBand}. Skipping lesson.`,
        );
        continue;
      }

      lessons.push({
        id: lessons.length + 1,
        skill_area: skill,
        lesson_title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} - Band ${currentBand}`,
        flashcard_repo_id: flashcardRepo?.id,
        practice_repo_id: practiceRepo?.id,
        mini_test_repo_id: miniTestRepo?.id,
        estimated_minutes: 30,
      });
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
}
