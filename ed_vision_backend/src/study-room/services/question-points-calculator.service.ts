import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { StreakTrackerService } from './streak-tracker.service';
import {
  REDIS_KEY_WEEKLY_EXP,
  TTL_WEEKLY_EXP,
  getWeekStart,
} from '../leaderboard.constants';

// ─────────────────────────────────────────────────────────────────────────────
// EXP Constants
// ─────────────────────────────────────────────────────────────────────────────

/** EXP per correct answer based on difficulty_score range */
const EXP_EASY = 5;    // difficulty_score: 0.0 – 0.3
const EXP_MEDIUM = 7;  // difficulty_score: 0.3 – 0.6
const EXP_HARD = 10;   // difficulty_score: 0.6 – 1.0
const EXP_DEFAULT = 7; // fallback when difficulty_score is null

/** Bonus EXP awarded for completing an entire TOEIC part */
const PART_COMPLETION_BONUS: Record<number, number> = {
  1: 20, // Part 1 – Photographs
  2: 20, // Part 2 – Question-Response
  3: 30, // Part 3 – Conversations
  4: 30, // Part 4 – Short Talks
  5: 35, // Part 5 – Incomplete Sentences
  6: 35, // Part 6 – Text Completion
  7: 50, // Part 7 – Reading Comprehension
};

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface QuestionResult {
  difficulty_score: number | null;
  is_correct: boolean;
}

export interface SessionExpResult {
  questionExp: number;
  bonusExp: number;
  totalPoints: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Question-Based EXP Calculator Service
 *
 * Calculates EXP based on practice question performance instead of study time.
 *
 * EXP Formula:
 *   - Correct answer (easy,   difficulty 0.0–0.3): +5 EXP
 *   - Correct answer (medium, difficulty 0.3–0.6): +7 EXP
 *   - Correct answer (hard,   difficulty 0.6–1.0): +10 EXP
 *   - Null difficulty_score: default +7 EXP
 *   - Wrong answer: 0 EXP
 *   - Part completion bonus: +20/30/35/50 EXP depending on part
 */
@Injectable()
export class QuestionPointsCalculatorService {
  private readonly logger = new Logger(QuestionPointsCalculatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly streakTracker: StreakTrackerService,
  ) {}

  // ─── EXP Calculation ───────────────────────────────────────────────────────

  /**
   * Calculate EXP for a single correct answer based on difficulty_score.
   * Returns 0 for incorrect answers.
   */
  calculateExpForQuestion(
    difficultyScore: number | null,
    isCorrect: boolean,
  ): number {
    if (!isCorrect) return 0;

    if (difficultyScore === null || difficultyScore === undefined) {
      this.logger.warn(
        `Question has null difficulty_score, using default EXP (${EXP_DEFAULT})`,
      );
      return EXP_DEFAULT;
    }

    if (difficultyScore < 0.3) return EXP_EASY;
    if (difficultyScore < 0.6) return EXP_MEDIUM;
    return EXP_HARD;
  }

  /**
   * Calculate bonus EXP for completing a TOEIC part.
   * Bonus is awarded regardless of how many questions were answered correctly.
   */
  calculateBonusExpForPart(toeicPart: number): number {
    const bonus = PART_COMPLETION_BONUS[toeicPart];
    if (bonus === undefined) {
      this.logger.warn(
        `Unknown TOEIC part ${toeicPart}, no bonus EXP awarded`,
      );
      return 0;
    }
    return bonus;
  }

  /**
   * Calculate total EXP for a completed practice session.
   *
   * @param questions - Array of question results with difficulty_score and is_correct
   * @param toeicPart - TOEIC part number (1–7)
   * @returns SessionExpResult with questionExp, bonusExp, and totalPoints
   */
  calculateSessionExp(
    questions: QuestionResult[],
    toeicPart: number,
  ): SessionExpResult {
    const questionExp = questions.reduce((sum, q) => {
      return sum + this.calculateExpForQuestion(q.difficulty_score, q.is_correct);
    }, 0);

    const bonusExp = this.calculateBonusExpForPart(toeicPart);
    const totalPoints = questionExp + bonusExp;

    this.logger.debug(
      `Session EXP: ${questionExp} (questions) + ${bonusExp} (part ${toeicPart} bonus) = ${totalPoints} total`,
    );

    return { questionExp, bonusExp, totalPoints };
  }

  // ─── EXP Persistence ───────────────────────────────────────────────────────

  /**
   * Award EXP to a user from a completed practice session.
   *
   * Updates StudyStat (total_minutes repurposed as total_exp) and stores
   * weekly EXP in Redis for leaderboard calculations.
   *
   * @param accountId - User account ID
   * @param totalPoints - Total EXP to award
   * @param sessionId - Practice session ID (for logging)
   * @param sessionDate - Date of the session (defaults to now)
   * @param client - Optional Prisma transaction client
   */
  async awardSessionPoints(
    accountId: number,
    totalPoints: number,
    sessionId: number,
    sessionDate: Date = new Date(),
    client?: any,
  ): Promise<void> {
    if (totalPoints <= 0) {
      this.logger.debug(
        `No EXP to award for account ${accountId}, session ${sessionId}`,
      );
      return;
    }

    try {
      const prismaClient = client || this.prisma;

      // Upsert StudyStat — total_minutes is repurposed as total_exp
      await prismaClient.studyStat.upsert({
        where: { account_id: accountId },
        create: {
          account_id: accountId,
          total_minutes: totalPoints,
          total_sessions: 1,
          updated_at: new Date(),
        },
        update: {
          total_minutes: { increment: totalPoints },
          total_sessions: { increment: 1 },
          updated_at: new Date(),
        },
      });

      this.logger.log(
        `Awarded ${totalPoints} EXP to account ${accountId} (session ${sessionId})`,
      );

      // Update Daily Streak
      await this.streakTracker.updateStreak(accountId, sessionDate, prismaClient);

      // Store weekly EXP in Redis (outside transaction for performance)
      await this.storeWeeklyPoints(accountId, totalPoints, sessionDate);
    } catch (error) {
      this.logger.error(
        `Failed to award EXP to account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  // ─── Weekly EXP (Redis) ────────────────────────────────────────────────────

  /**
   * Get weekly EXP for a single user.
   */
  async getWeeklyPoints(accountId: number, weekStart: string): Promise<number> {
    try {
      // 1. Try Redis first
      if (this.redis.isReady()) {
        const key = REDIS_KEY_WEEKLY_EXP(accountId, weekStart);
        const raw = await this.redis.getClient()?.get(this.redis.getKey(key));
        if (raw) {
          const exp = parseInt(raw, 10);
          if (Number.isFinite(exp)) return exp;
        }
      }

      // 2. Fallback to DB (calculating from ToeicPracticePartSession earned_points)
      const startDate = new Date(weekStart);
      const student = await this.prisma.student.findUnique({
        where: { account_id: accountId },
        select: { student_id: true },
      });

      if (!student) return 0;

      const result = await this.prisma.toeicPracticePartSession.aggregate({
        where: {
          enrollment: { student_id: student.student_id },
          created_at: { gte: startDate },
        },
        _sum: { earned_points: true },
      });

      return Math.round(result._sum.earned_points || 0);
    } catch (error) {
      this.logger.error(
        `Failed to get weekly EXP for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return 0;
    }
  }

  /**
   * Get weekly EXP for multiple users.
   *
   * Source of truth is Redis — `awardSessionPoints()` tích lũy EXP vào key
   * `REDIS_KEY_WEEKLY_EXP(accountId, weekStart)`. Trước đây hàm này tổng hợp
   * `ToeicPracticePartSession.earned_points` từ DB — cột đó thực chất là
   * *reserve points* (thang điểm mở khóa practice), KHÔNG phải EXP → tất cả
   * user hiển thị sai / 0 ở tab "Xếp hạng tuần".
   */
  async getWeeklyPointsBatch(
    accountIds: number[],
    weekStart: string,
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    for (const id of accountIds) result.set(id, 0);
    if (accountIds.length === 0) return result;

    // ── Primary path: Redis MGET ──────────────────────────────────────────
    if (this.redis.isReady()) {
      const client = this.redis.getClient();
      if (client) {
        try {
          const keys = accountIds.map((id) =>
            this.redis.getKey(REDIS_KEY_WEEKLY_EXP(id, weekStart)),
          );
          const values = await client.mGet(keys);
          values.forEach((raw, idx) => {
            const parsed = raw ? parseInt(raw, 10) : 0;
            result.set(accountIds[idx], Number.isFinite(parsed) ? parsed : 0);
          });
          return result;
        } catch (error) {
          this.logger.warn(
            `Redis MGET weekly EXP failed, will attempt DB fallback: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }
    }

    // ── Fallback: derive from practice sessions in DB ────────────────────
    // LƯU Ý: `ToeicPracticePartSession.earned_points` là reserve-points chứ
    // không phải EXP, nên kết quả là proxy gần đúng. Chỉ dùng khi Redis chết
    // để tránh trả về toàn 0 (giữ hành vi cũ làm an toàn).
    try {
      const startDate = new Date(weekStart);
      const sessions = await this.prisma.toeicPracticePartSession.findMany({
        where: {
          enrollment: { student: { account_id: { in: accountIds } } },
          created_at: { gte: startDate },
        },
        select: {
          earned_points: true,
          enrollment: { select: { student: { select: { account_id: true } } } },
        },
      });

      for (const session of sessions) {
        const accId = session.enrollment.student.account_id;
        result.set(accId, (result.get(accId) ?? 0) + session.earned_points);
      }
      for (const [key, val] of result.entries()) result.set(key, Math.round(val));
      return result;
    } catch (error) {
      this.logger.error(
        `Failed DB fallback for weekly EXP batch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return result;
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async storeWeeklyPoints(
    accountId: number,
    exp: number,
    sessionDate: Date,
  ): Promise<void> {
    if (!this.redis.isReady()) {
      this.logger.warn('Redis not available, skipping weekly EXP storage');
      return;
    }

    try {
      const weekStart = getWeekStart(sessionDate);
      const key = REDIS_KEY_WEEKLY_EXP(accountId, weekStart);
      const fullKey = this.redis.getKey(key);

      const currentRaw = await this.redis.getClient()?.get(fullKey);
      const currentExp = currentRaw ? parseInt(currentRaw, 10) : 0;
      const newExp = currentExp + exp;

      await this.redis.getClient()?.set(fullKey, newExp.toString(), {
        EX: TTL_WEEKLY_EXP,
      });

      this.logger.debug(
        `Weekly EXP for account ${accountId} (week ${weekStart}): ${currentExp} → ${newExp}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to store weekly EXP in Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw — Redis failure should not break the main flow
    }
  }
}
