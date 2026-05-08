import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IsInt, IsObject, IsArray, Min, Max } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { encryptString, encryptRecord } from '../../common/crypto.util';
import { QuestionPointsCalculatorService } from '../../study-room/services/question-points-calculator.service';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PART_POINT_BUDGET: Record<number, number> = {
  1: 10,
  2: 10,
  3: 15,
  4: 15, // listening
  5: 15,
  6: 15,
  7: 20, // reading
};

// Unlock threshold is dynamic: enrollment.target_score (not a fixed constant).
// DEFAULT_UNLOCK_THRESHOLD is only used when target_score is not yet set.
const DEFAULT_UNLOCK_THRESHOLD = 300;

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

export class SubmitPartSessionDto {
  @IsInt()
  @Min(1)
  @Max(7)
  toeic_part!: number;

  @IsObject()
  answers!: Record<string, string>; // questionId (string) → chosen option_key

  @IsArray()
  @IsInt({ each: true })
  question_ids!: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Response interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface PracticeQuestionOptionDto {
  id: number;
  option_key: string;
  option_text: string;
  is_correct: boolean;
  rationale: string | null;
  sort_order: number;
}

export interface PracticeQuestionDto {
  id: number;
  part: number | null;
  skill_area: string;
  stem: string;
  reading_passage: string | null;
  context_image: string | null;
  context_audio: string | null;
  score_band_min: number;
  score_band_max: number;
  difficulty_label: string;
  difficulty_score: number | null;
  ai_explanation: string | null;
  options: PracticeQuestionOptionDto[];
}

export interface GetQuestionsForPartResponseDto {
  part: number;
  skill_area: string;
  score_band_min: number;
  score_band_max: number;
  unlock_threshold: number; // = enrollment.target_score
  current_reserve_points: number;
  questions: PracticeQuestionDto[];
}

export interface SubmitPartSessionResponseDto {
  toeic_part: number;
  correct_count: number;
  total_questions: number;
  earned_points: number; // reserve points actually awarded this attempt
  attempt_points: number; // raw points from this attempt (correct_count x part budget)
  previous_best_points_for_part: number;
  best_points_for_part: number;
  awarded_points: number;
  new_reserve_points: number;
  unlock_threshold: number;
  exam_unlocked: boolean;
  correct_answers: Record<string, string>;
  explanations: Record<string, string | null>;
  // EXP earned from this session (question-based)
  exp_earned: number;
  exp_question: number;
  exp_bonus: number;
}

export interface ReservePointsStatusDto {
  reserve_points: number;
  exam_unlocked: boolean;
  unlock_threshold: number;
  part_sessions: Array<{
    toeic_part: number;
    correct_count: number;
    total_questions: number;
    earned_points: number;
    completed_at: Date | null;
  }>;
  // Aggregate stats across ALL practice sessions (not just the 20 recent).
  listening_sessions_count: number;
  reading_sessions_count: number;
  listening_correct: number;
  listening_total: number;
  reading_correct: number;
  reading_total: number;
  listening_accuracy: number; // 0-100
  reading_accuracy: number; // 0-100
  completed_parts: number[]; // distinct parts with >= 1 session
}

export interface ResetPracticeProgressResponseDto {
  sessions_deleted: number;
  enrollments_reset: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ToeicPracticeSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionPointsCalculator: QuestionPointsCalculatorService,
  ) {}

  // ── Internal helpers ──────────────────────────────────────────────────────

  private readProjectedScoreFromPlanState(
    toeicPlanState: unknown,
  ): number | null {
    if (!toeicPlanState || typeof toeicPlanState !== 'object') {
      return null;
    }

    const state = toeicPlanState as Record<string, unknown>;
    const current = Number(state.current_score ?? 0);
    const totalBoost = Number(state.total_boost ?? 0);

    if (!Number.isFinite(current) && !Number.isFinite(totalBoost)) {
      return null;
    }

    const safeCurrent = Number.isFinite(current) ? current : 0;
    const safeBoost = Number.isFinite(totalBoost) ? totalBoost : 0;
    return Math.max(0, Math.round(safeCurrent + safeBoost));
  }

  private resolveLearnerBandScore(enrollment: {
    current_score: number | null;
    exam_score: number | null;
    toeic_plan_state: unknown;
  }): number {
    const projectedScore = this.readProjectedScoreFromPlanState(
      enrollment.toeic_plan_state,
    );
    const currentScore = Number(enrollment.current_score ?? 0);
    const latestExamScore = Number(enrollment.exam_score ?? 0);

    return Math.max(
      0,
      Number.isFinite(projectedScore ?? Number.NaN) ? Number(projectedScore) : 0,
      Number.isFinite(currentScore) ? currentScore : 0,
      Number.isFinite(latestExamScore) ? latestExamScore : 0,
    );
  }

  private deriveSkillArea(part: number): string {
    return part <= 4 ? 'listening' : 'reading';
  }

  private shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private parseQuestionIdsFromJson(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => Number(item))
      .filter((id) => Number.isFinite(id) && id > 0)
      .map((id) => Math.round(id));
  }

  private scoreBandDistance(
    learnerScore: number,
    scoreBandMin: number,
    scoreBandMax: number,
  ): number {
    if (learnerScore < scoreBandMin) return scoreBandMin - learnerScore;
    if (learnerScore > scoreBandMax) return learnerScore - scoreBandMax;
    return 0;
  }

  private sortQuestionsByBandDistance<T extends {
    id: number;
    score_band_min: number;
    score_band_max: number;
  }>(questions: T[], learnerScore: number): T[] {
    return [...questions].sort((a, b) => {
      const distanceA = this.scoreBandDistance(
        learnerScore,
        a.score_band_min,
        a.score_band_max,
      );
      const distanceB = this.scoreBandDistance(
        learnerScore,
        b.score_band_min,
        b.score_band_max,
      );

      if (distanceA !== distanceB) return distanceA - distanceB;

      const spanA = a.score_band_max - a.score_band_min;
      const spanB = b.score_band_max - b.score_band_min;
      if (spanA !== spanB) return spanA - spanB;

      return a.id - b.id;
    });
  }

  private mergeUniqueQuestionsById<T extends { id: number }>(
    current: T[],
    incoming: T[],
  ): T[] {
    if (incoming.length === 0) return current;

    const existingIds = new Set(current.map((item) => item.id));
    const merged = [...current];

    for (const item of incoming) {
      if (!existingIds.has(item.id)) {
        existingIds.add(item.id);
        merged.push(item);
      }
    }

    return merged;
  }

  private async getUsedQuestionIdSet(
    enrollmentId: number,
    toeicPart: number,
  ): Promise<Set<number>> {
    const sessions = await this.prisma.toeicPracticePartSession.findMany({
      where: {
        enrollment_id: enrollmentId,
        toeic_part: toeicPart,
      },
      select: { question_ids: true },
    });

    const used = new Set<number>();
    for (const session of sessions) {
      for (const id of this.parseQuestionIdsFromJson(session.question_ids)) {
        used.add(id);
      }
    }
    return used;
  }

  /**
   * Resolve account_id → student → active TOEIC enrollment.
   * Throws 404 if either is missing.
   */
  private async findActiveEnrollment(accountId: number) {
    const student = await this.prisma.student.findFirst({
      where: { account_id: accountId },
      select: { student_id: true },
    });
    if (!student) {
      throw new NotFoundException(
        'Không tìm thấy học viên tương ứng với tài khoản này.',
      );
    }

    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: {
        student_id: student.student_id,
        cert_type: 'toeic',
        status: 'active',
      },
    });
    if (!enrollment) {
      throw new NotFoundException(
        'Không tìm thấy enrollment TOEIC đang hoạt động. Vui lòng đăng ký trước.',
      );
    }

    return enrollment;
  }

  // ── Public methods ────────────────────────────────────────────────────────

  /**
   * GET /student/certificate/toeic/practice-questions/:part
   *
   * Returns `count` shuffled questions suitable for the student's current score
    * band, excluding questions the learner already completed in previous sessions.
   */
  async getQuestionsForPart(
    accountId: number,
    part: number,
    count = 10,
  ): Promise<GetQuestionsForPartResponseDto> {
    void count;

    if (part < 1 || part > 7) {
      throw new BadRequestException('TOEIC part phải là số từ 1 đến 7.');
    }

    const enrollment = await this.findActiveEnrollment(accountId);
    const learnerScore = this.resolveLearnerBandScore(enrollment);
    const skillArea = this.deriveSkillArea(part);

    // Target: 10 questions per part.
    // - If DB has ≥10 valid: random-pick 10, prioritising questions with audio.
    // - If DB has <10: return all available (no throw).
    const targetCount = 10;

    const usedQuestionIds = await this.getUsedQuestionIdSet(enrollment.id, part);
    const usedQuestionIdList = [...usedQuestionIds];

    const fetchQuestions = async (opts: {
      strictBand: boolean;
      excludeUsed: boolean;
    }) =>
      this.prisma.toeicPracticeQuestion.findMany({
        where: {
          part,
          is_published: true,
          ...(opts.strictBand
            ? {
                score_band_min: { lte: learnerScore },
                score_band_max: { gte: learnerScore },
              }
            : {}),
          ...(opts.excludeUsed && usedQuestionIdList.length > 0
            ? { id: { notIn: usedQuestionIdList } }
            : {}),
          options: { some: { is_correct: true } },
        },
        include: {
          options: { orderBy: { sort_order: 'asc' } },
        },
      });

    // ── Primary fetch: strict score-band match ───────────────────────────
    let questions = await fetchQuestions({ strictBand: true, excludeUsed: true });

    // Fallback 1: still unseen, but open all score bands for this part.
    if (questions.length < targetCount) {
      const unseenAllBands = await fetchQuestions({
        strictBand: false,
        excludeUsed: true,
      });
      questions = this.mergeUniqueQuestionsById(questions, unseenAllBands);
    }

    // Fallback 2: if unseen pool is exhausted, allow previously-seen questions.
    if (questions.length < targetCount) {
      const allQuestionsForPart = await fetchQuestions({
        strictBand: false,
        excludeUsed: false,
      });
      questions = this.mergeUniqueQuestionsById(questions, allQuestionsForPart);
    }

    if (questions.length === 0) {
      throw new NotFoundException(
        `Chưa có bộ câu hỏi TOEIC Part ${part} đã publish. Vui lòng liên hệ giáo viên để bổ sung.`,
      );
    }

    // ── Audio-grouped parts (Listening Part 1-4) ──────────────────────────
    // - Part 3/4: 1 audio dùng chung cho 3 câu liên tiếp (vd Q32-34). Khi
    //   import, audio chunker chỉ gán `context_audio` lên câu đầu nhóm
    //   (anchor); 2 câu sau (sibling) có context_audio = null → bị bỏ qua.
    // - Part 1/2: thường 1 audio / 1 câu, nhưng nếu data thực tế cũng có
    //   pattern "anchor + sibling không audio" thì xử lý y hệt Part 3/4.
    //   Sibling chỉ được gom vào nhóm khi `context_audio` của nó là null
    //   (nếu sibling có audio riêng → vẫn coi là độc lập, không gom).
    // → Lấy nguyên nhóm và lan truyền audio cho mọi sibling không có audio.
    const isGroupedPart = part >= 1 && part <= 4;

    type QuestionRow = (typeof questions)[number];

    let selected: QuestionRow[];

    if (isGroupedPart) {
      // 1. Bổ sung sibling còn thiếu (cùng source_slug, item_id +1/+2 của
      //    mỗi anchor có context_audio) — kể cả khi sibling đã used hay
      //    không khớp band.
      const anchorsInPool = questions.filter(
        (q) =>
          !!q.context_audio &&
          !!q.source_slug &&
          q.source_item_id != null,
      );

      const siblingFilters: { source_slug: string; source_item_id: number }[] =
        [];
      for (const anchor of anchorsInPool) {
        const slug = anchor.source_slug as string;
        const startId = anchor.source_item_id as number;
        siblingFilters.push({ source_slug: slug, source_item_id: startId + 1 });
        siblingFilters.push({ source_slug: slug, source_item_id: startId + 2 });
      }

      if (siblingFilters.length > 0) {
        const siblings = await this.prisma.toeicPracticeQuestion.findMany({
          where: {
            part,
            is_published: true,
            options: { some: { is_correct: true } },
            OR: siblingFilters,
          },
          include: {
            options: { orderBy: { sort_order: 'asc' } },
          },
        });
        questions = this.mergeUniqueQuestionsById(questions, siblings);
      }

      // 2. Build groups: anchor + sibling+1 + sibling+2 (cùng source_slug)
      const byKey = new Map<string, QuestionRow>();
      for (const q of questions) {
        if (q.source_slug && q.source_item_id != null) {
          byKey.set(`${q.source_slug}:${q.source_item_id}`, q);
        }
      }

      const allAnchors = questions.filter(
        (q) =>
          !!q.context_audio &&
          !!q.source_slug &&
          q.source_item_id != null,
      );

      // Sibling chỉ được merge vào group nếu nó KHÔNG có context_audio
      // riêng (tránh nuốt mất câu hỏi Part 1/2 vốn 1 audio/1 câu, hoặc bất kỳ
      // câu nào có audio độc lập). Khi gặp sibling có audio riêng → coi đó
      // là anchor của nhóm khác, không gom.
      const groups: QuestionRow[][] = allAnchors.map((anchor) => {
        const slug = anchor.source_slug as string;
        const startId = anchor.source_item_id as number;
        const group: QuestionRow[] = [anchor];
        for (let offset = 1; offset <= 2; offset++) {
          const sibling = byKey.get(`${slug}:${startId + offset}`);
          if (!sibling) continue;
          if (sibling.context_audio) break; // sibling có audio riêng → dừng nhóm
          group.push(sibling);
        }
        return group;
      });

      // 3. Pick random groups cho tới khi đạt ~ targetCount câu.
      //    Tránh cắt ngang nhóm (đảm bảo nhóm nào lấy thì lấy đủ 3 câu).
      const shuffledGroups = this.shuffle(groups);
      selected = [];
      for (const group of shuffledGroups) {
        if (selected.length >= targetCount) break;
        // Cho phép vượt target tối đa 2 câu để giữ nguyên nhóm cuối.
        if (
          selected.length + group.length > targetCount &&
          selected.length >= targetCount - 1
        ) {
          break;
        }
        selected.push(...group);
      }

      // 4. Fallback nếu không có anchor nào (vd dữ liệu chưa chunk audio):
      //    quay về logic cũ (random toàn bộ).
      if (selected.length === 0) {
        selected = this.shuffle(questions).slice(0, targetCount);
      }

      // 5. Lan truyền context_audio từ anchor xuống sibling để frontend
      //    hiển thị audio cho cả nhóm. Dừng khi gặp sibling có audio riêng
      //    (đó là anchor của nhóm khác).
      const audioByQid = new Map<number, string>();
      for (const anchor of allAnchors) {
        const slug = anchor.source_slug as string;
        const startId = anchor.source_item_id as number;
        const audio = anchor.context_audio as string;
        audioByQid.set(anchor.id, audio);
        for (let offset = 1; offset <= 2; offset++) {
          const sibling = byKey.get(`${slug}:${startId + offset}`);
          if (!sibling) continue;
          if (sibling.context_audio) break;
          audioByQid.set(sibling.id, audio);
        }
      }
      selected = selected.map((q) => {
        const shared = audioByQid.get(q.id);
        return shared && !q.context_audio ? { ...q, context_audio: shared } : q;
      });
    } else {
      // ── Selection cũ cho Reading Part 5, 6, 7 ───────────────────────────
      // Reading parts không có audio → chỉ random thuần.
      const withAudio = questions.filter((q) => !!q.context_audio);
      const withoutAudio = questions.filter((q) => !q.context_audio);

      const pickRandom = <T>(arr: T[], n: number): T[] =>
        this.shuffle(arr).slice(0, n);

      if (questions.length <= targetCount) {
        selected = this.shuffle(questions);
      } else if (withAudio.length >= targetCount) {
        selected = pickRandom(withAudio, targetCount);
      } else {
        const remainder = targetCount - withAudio.length;
        selected = [
          ...this.shuffle(withAudio),
          ...pickRandom(withoutAudio, remainder),
        ];
      }
    }

    // Keep the variable name used downstream.
    const shuffled = selected;

    const scoreBandMin =
      shuffled.length > 0
        ? Math.min(...shuffled.map((q) => q.score_band_min))
        : learnerScore;

    const scoreBandMax =
      shuffled.length > 0
        ? Math.max(...shuffled.map((q) => q.score_band_max))
        : learnerScore;

    // ── Map to response ───────────────────────────────────────────────────
    const aiExplanationRaw = (q_: typeof shuffled[0]) => q_.ai_explanation ?? q_.explanation ?? null;
    const mappedQuestions: PracticeQuestionDto[] = shuffled.map((q) => ({
      id: q.id,
      part: q.part,
      skill_area: q.skill_area,
      stem: encryptString(q.stem),
      reading_passage: q.reading_passage ? encryptString(q.reading_passage) : null,
      context_image: q.context_image,
      context_audio: q.context_audio,
      score_band_min: q.score_band_min,
      score_band_max: q.score_band_max,
      difficulty_label: q.difficulty_label,
      difficulty_score: q.difficulty_score,
      ai_explanation: aiExplanationRaw(q) ? encryptString(aiExplanationRaw(q)!) : null,
      options: q.options.map((o) => ({
        id: o.id,
        option_key: o.option_key,
        option_text: encryptString(o.option_text),
        is_correct: o.is_correct,
        rationale: null, // hidden until submission
        sort_order: o.sort_order,
      })),
    }));

    const unlockThreshold = enrollment.target_score ?? DEFAULT_UNLOCK_THRESHOLD;

    return {
      part,
      skill_area: skillArea,
      score_band_min: scoreBandMin,
      score_band_max: scoreBandMax,
      unlock_threshold: unlockThreshold,
      current_reserve_points: enrollment.reserve_points,
      questions: mappedQuestions,
    };
  }

  /**
   * POST /student/certificate/toeic/practice-session/submit
   *
   * Scores the session, persists a ToeicPracticePartSession record,
   * and recalculates reserve_points using BEST score per part
   * (repeat attempts only increase reserve_points when beating prior best).
   */
  async submitPartSession(
    accountId: number,
    dto: SubmitPartSessionDto,
  ): Promise<SubmitPartSessionResponseDto> {
    if (dto.toeic_part < 1 || dto.toeic_part > 7) {
      throw new BadRequestException('TOEIC part phải là số từ 1 đến 7.');
    }
    if (!dto.question_ids || dto.question_ids.length === 0) {
      throw new BadRequestException('question_ids không được để trống.');
    }

    // Accept any reasonable number of questions (1..maxCount) — some TOEIC
    // parts have fewer than 10 items available (e.g. Part 1 Photographs = 6).
    const maxCount = 10;
    const uniqueQuestionIds = Array.from(
      new Set(
        dto.question_ids
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
          .map((id) => Math.round(id)),
      ),
    );

    if (uniqueQuestionIds.length < 1 || uniqueQuestionIds.length > maxCount) {
      throw new BadRequestException(
        `Mỗi phiên luyện tập phải nộp từ 1 đến ${maxCount} câu hỏi hợp lệ.`,
      );
    }

    const enrollment = await this.findActiveEnrollment(accountId);

    // Fetch all served questions with their full options
    const questions = await this.prisma.toeicPracticeQuestion.findMany({
      where: { id: { in: uniqueQuestionIds }, part: dto.toeic_part },
      include: {
        options: { orderBy: { sort_order: 'asc' } },
      },
    });

    if (questions.length !== uniqueQuestionIds.length) {
      throw new BadRequestException(
        `Một số câu hỏi không hợp lệ hoặc không thuộc Part ${dto.toeic_part}.`,
      );
    }

    // ── Grade the submission ─────────────────────────────────────────────
    let correctCount = 0;
    const correctAnswers: Record<string, string> = {};
    const explanations: Record<string, string | null> = {};
    // Track per-question results for EXP calculation
    const questionResults: Array<{ difficulty_score: number | null; is_correct: boolean }> = [];

    for (const q of questions) {
      const correctOption = q.options.find((o) => o.is_correct);
      const correctKey = correctOption?.option_key ?? null;

      if (correctKey) {
        correctAnswers[String(q.id)] = correctKey;
      }

      explanations[String(q.id)] = q.ai_explanation ?? null;

      const chosenKey = dto.answers[String(q.id)] ?? null;
      const isCorrect =
        !!(chosenKey &&
        correctKey &&
        chosenKey.toUpperCase() === correctKey.toUpperCase());

      if (isCorrect) {
        correctCount++;
      }

      questionResults.push({
        difficulty_score: q.difficulty_score ?? null,
        is_correct: isCorrect,
      });
    }

    // Calculate Points for this session
    const pointsResult = this.questionPointsCalculator.calculateSessionExp(
      questionResults,
      dto.toeic_part,
    );

    const totalQuestions = uniqueQuestionIds.length;
    const budget = PART_POINT_BUDGET[dto.toeic_part] ?? 10;
    // Scale per-correct value by the actual number of questions served so
    // that parts with fewer than 10 items (e.g. Part 1 Photographs = 6)
    // can still earn the full part budget when fully correct.
    const pointsPerCorrect = budget / Math.max(1, totalQuestions);
    const earnedPoints = correctCount * pointsPerCorrect;

    const previousBestAggregate = await this.prisma.toeicPracticePartSession.aggregate({
      where: {
        enrollment_id: enrollment.id,
        toeic_part: dto.toeic_part,
      },
      _max: {
        earned_points: true,
      },
    });
    const previousBestPointsForPart = Number(
      previousBestAggregate._max.earned_points ?? 0,
    );

    // Session score-band summary
    const scoreBandMin =
      questions.length > 0
        ? Math.min(...questions.map((q) => q.score_band_min))
        : 0;
    const scoreBandMax =
      questions.length > 0
        ? Math.max(...questions.map((q) => q.score_band_max))
        : 990;
    const skillArea = this.deriveSkillArea(dto.toeic_part);

    // ── Persist session + recalculate reserve using best-per-part ─────────
    const scoringContext = await this.prisma.$transaction(async (tx) => {
      await tx.toeicPracticePartSession.create({
        data: {
          enrollment_id: enrollment.id,
          skill_area: skillArea,
          toeic_part: dto.toeic_part,
          score_band_min: scoreBandMin,
          score_band_max: scoreBandMax,
          question_ids: uniqueQuestionIds,
          answers: dto.answers as object,
          total_questions: totalQuestions,
          correct_count: correctCount,
          earned_points: earnedPoints,
          completed_at: new Date(),
        },
      });

      const allPartSessions = await tx.toeicPracticePartSession.findMany({
        where: {
          enrollment_id: enrollment.id,
        },
        select: {
          toeic_part: true,
          earned_points: true,
        },
      });

      const bestPointsByPart = new Map<number, number>();
      for (const session of allPartSessions) {
        const partBest = bestPointsByPart.get(session.toeic_part) ?? 0;
        if (session.earned_points > partBest) {
          bestPointsByPart.set(session.toeic_part, session.earned_points);
        }
      }

      const bestPointsForPart = bestPointsByPart.get(dto.toeic_part) ?? 0;
      const awardedPoints = Math.max(
        0,
        bestPointsForPart - previousBestPointsForPart,
      );

      const recalculatedReserve = [...bestPointsByPart.values()].reduce(
        (sum, value) => sum + value,
        0,
      );

      // Cap at target_score so the bar never overflows the milestone display.
      const targetScore = enrollment.target_score ?? DEFAULT_UNLOCK_THRESHOLD;
      const newReserve = Math.min(recalculatedReserve, targetScore);

      const updatedEnrollment = await tx.certificateEnrollment.update({
        where: { id: enrollment.id },
        data: { reserve_points: newReserve },
      });

      return {
        updatedEnrollment,
        bestPointsForPart,
        awardedPoints,
      };
    });

    const newReservePoints = scoringContext.updatedEnrollment.reserve_points ?? 0;
    const unlockThreshold =
      scoringContext.updatedEnrollment.target_score ?? DEFAULT_UNLOCK_THRESHOLD;

    // ── Award Points for this practice session (async, non-blocking) ─────────
    // Points is awarded outside the transaction to avoid blocking the response.
    // Failure to award Points does not affect the session result.
    setImmediate(() => {
      this.questionPointsCalculator
        .awardSessionPoints(accountId, pointsResult.totalPoints, enrollment.id)
        .catch((err) => {
          // Log but don't throw — Points failure is non-critical
          console.error(
            `[ToeicPracticeSessionService] Failed to award Points for account ${accountId}:`,
            err,
          );
        });
    });

    // Encrypt correct answers and explanations before sending to client
    const encryptedCorrectAnswers: Record<string, string> = {};
    for (const [qId, key] of Object.entries(correctAnswers)) {
      encryptedCorrectAnswers[qId] = encryptString(key);
    }
    const encryptedExplanations = encryptRecord(explanations);

    return {
      toeic_part: dto.toeic_part,
      correct_count: correctCount,
      total_questions: totalQuestions,
      earned_points: scoringContext.awardedPoints,
      attempt_points: earnedPoints,
      previous_best_points_for_part: previousBestPointsForPart,
      best_points_for_part: scoringContext.bestPointsForPart,
      awarded_points: scoringContext.awardedPoints,
      new_reserve_points: newReservePoints,
      unlock_threshold: unlockThreshold,
      exam_unlocked: newReservePoints >= unlockThreshold,
      correct_answers: encryptedCorrectAnswers,
      explanations: encryptedExplanations,
      exp_earned: pointsResult.totalPoints,
      exp_question: pointsResult.questionExp,
      exp_bonus: pointsResult.bonusExp,
    };
  }

  async resetPracticeProgressForAllUsers(
    resetReservePoints = true,
  ): Promise<ResetPracticeProgressResponseDto> {
    const [deletedSessions, resetEnrollments] = await this.prisma.$transaction([
      this.prisma.toeicPracticePartSession.deleteMany({}),
      resetReservePoints
        ? this.prisma.certificateEnrollment.updateMany({
            where: { cert_type: 'toeic' },
            data: { reserve_points: 0 },
          })
        : this.prisma.certificateEnrollment.updateMany({
            where: { id: -1 },
            data: { reserve_points: 0 },
          }),
    ]);

    return {
      sessions_deleted: deletedSessions.count,
      enrollments_reset: resetReservePoints ? resetEnrollments.count : 0,
    };
  }

  /**
   * GET /student/certificate/toeic/reserve-points
   *
   * Returns current reserve-points balance and recent practice session history.
   */
  async getReservePointsStatus(
    accountId: number,
  ): Promise<ReservePointsStatusDto> {
    const enrollment = await this.findActiveEnrollment(accountId);

    const recentSessions = await this.prisma.toeicPracticePartSession.findMany({
      where: { enrollment_id: enrollment.id },
      orderBy: { completed_at: 'desc' },
      take: 20,
      select: {
        toeic_part: true,
        correct_count: true,
        total_questions: true,
        earned_points: true,
        completed_at: true,
      },
    });

    const reservePoints = enrollment.reserve_points ?? 0;
    const unlockThreshold = enrollment.target_score ?? DEFAULT_UNLOCK_THRESHOLD;

    // ── Aggregate across ALL practice sessions (not just the 20 recent) ──
    const allSessions = await this.prisma.toeicPracticePartSession.findMany({
      where: { enrollment_id: enrollment.id },
      select: {
        toeic_part: true,
        correct_count: true,
        total_questions: true,
      },
    });

    let listeningSessionsCount = 0;
    let readingSessionsCount = 0;
    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    const completedPartsSet = new Set<number>();

    for (const s of allSessions) {
      completedPartsSet.add(s.toeic_part);
      if (s.toeic_part >= 1 && s.toeic_part <= 4) {
        listeningSessionsCount += 1;
        listeningCorrect += s.correct_count || 0;
        listeningTotal += s.total_questions || 0;
      } else if (s.toeic_part >= 5 && s.toeic_part <= 7) {
        readingSessionsCount += 1;
        readingCorrect += s.correct_count || 0;
        readingTotal += s.total_questions || 0;
      }
    }

    const listeningAccuracy =
      listeningTotal > 0
        ? Math.round((listeningCorrect / listeningTotal) * 100)
        : 0;
    const readingAccuracy =
      readingTotal > 0
        ? Math.round((readingCorrect / readingTotal) * 100)
        : 0;

    return {
      reserve_points: reservePoints,
      exam_unlocked: reservePoints >= unlockThreshold,
      unlock_threshold: unlockThreshold,
      part_sessions: recentSessions.map((s) => ({
        toeic_part: s.toeic_part,
        correct_count: s.correct_count,
        total_questions: s.total_questions,
        earned_points: s.earned_points,
        completed_at: s.completed_at,
      })),
      listening_sessions_count: listeningSessionsCount,
      reading_sessions_count: readingSessionsCount,
      listening_correct: listeningCorrect,
      listening_total: listeningTotal,
      reading_correct: readingCorrect,
      reading_total: readingTotal,
      listening_accuracy: listeningAccuracy,
      reading_accuracy: readingAccuracy,
      completed_parts: Array.from(completedPartsSet).sort((a, b) => a - b),
    };
  }
}
