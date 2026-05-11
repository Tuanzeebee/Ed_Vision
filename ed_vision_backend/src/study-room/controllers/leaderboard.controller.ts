import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { LeaderboardQueryDto } from '../dto/leaderboard-query.dto';
import {
  LeaderboardResponse,
  LeaderboardEntry,
  PersonalStatsResponse,
} from '../dto/leaderboard-response.dto';
import { RankingEngineService } from '../services/ranking-engine.service';
import { OnlineStatusManagerService } from '../services/online-status-manager.service';
import { EligibilityCheckerService } from '../services/eligibility-checker.service';
import { ExpCalculatorService } from '../services/exp-calculator.service';
import { StreakTrackerService } from '../services/streak-tracker.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getWeekStart, getWeekEnd } from '../leaderboard.constants';

/**
 * Leaderboard Controller
 * 
 * Handles leaderboard and personal stats endpoints
 */
@Controller('study-rooms/leaderboard')
@UseGuards(DevAuthGuard)
export class LeaderboardController {
  private readonly logger = new Logger(LeaderboardController.name);

  constructor(
    private readonly rankingEngine: RankingEngineService,
    private readonly onlineStatusManager: OnlineStatusManagerService,
    private readonly eligibilityChecker: EligibilityCheckerService,
    private readonly expCalculator: ExpCalculatorService,
    private readonly streakTracker: StreakTrackerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * GET /study-rooms/leaderboard/weekly
   * 
   * Get weekly leaderboard (based on EXP earned this week)
   * 
   * @param query - Query parameters (limit, offset)
   * @returns LeaderboardResponse - Weekly leaderboard with pagination
   */
  @Get('weekly')
  async getWeeklyLeaderboard(
    @Query() query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponse> {
    const startTime = Date.now();

    try {
      const { limit = 10, offset = 0 } = query;
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd();

      // Get ranking entries from RankingEngine
      const entries = await this.rankingEngine.calculateWeeklyRanking(
        weekStart,
        limit,
        offset,
      );

      // Get online status for all users in the result
      const accountIds = entries.map((e) => e.accountId);
      const onlineUsers = await this.onlineStatusManager.getOnlineUsers(accountIds);

      // Map to LeaderboardEntry format with online status
      const leaderboardEntries: LeaderboardEntry[] = entries.map((entry) => ({
        rank: entry.rank,
        accountId: entry.accountId,
        username: entry.fullName,
        avatarUrl: entry.avatarUrl ?? undefined,
        gender: entry.gender ?? undefined,
        score: entry.score, // Weekly EXP
        totalSessions: 0, // Not available in weekly ranking
        currentStreak: entry.currentStreak,
        longestStreak: 0, // Not fetched for performance
        isOnline: onlineUsers.has(entry.accountId),
      }));

      // Get total count of eligible users for pagination
      // Note: This is an approximation - we don't have exact count without full calculation
      const total = entries.length < limit ? offset + entries.length : offset + limit + 1;

      const response: LeaderboardResponse = {
        entries: leaderboardEntries,
        pagination: {
          limit,
          offset,
          total,
          hasMore: entries.length === limit,
        },
        metadata: {
          type: 'weekly',
          weekStart,
          weekEnd,
          generatedAt: new Date().toISOString(),
        },
      };

      const duration = Date.now() - startTime;
      this.logger.log(
        `Weekly leaderboard generated in ${duration}ms (limit: ${limit}, offset: ${offset})`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get weekly leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * GET /study-rooms/leaderboard/total
   * 
   * Get total leaderboard (based on total study minutes)
   * 
   * @param query - Query parameters (limit, offset)
   * @returns LeaderboardResponse - Total leaderboard with pagination
   */
  @Get('total')
  async getTotalLeaderboard(
    @Query() query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponse> {
    const startTime = Date.now();

    try {
      const { limit = 10, offset = 0 } = query;

      // Get ranking entries from RankingEngine
      const entries = await this.rankingEngine.calculateTotalRanking(limit, offset);

      // Get online status for all users in the result
      const accountIds = entries.map((e) => e.accountId);
      const onlineUsers = await this.onlineStatusManager.getOnlineUsers(accountIds);

      // Get total sessions for each user
      const statsMap = await this.getStatsForUsers(accountIds);

      // Get longest streaks for each user
      const streakMap = await this.streakTracker.getStreakInfoBatch(accountIds);

      // Map to LeaderboardEntry format with online status
      const leaderboardEntries: LeaderboardEntry[] = entries.map((entry) => {
        const stats = statsMap.get(entry.accountId);
        const streak = streakMap.get(entry.accountId);

        return {
          rank: entry.rank,
          accountId: entry.accountId,
          username: entry.fullName,
          avatarUrl: entry.avatarUrl ?? undefined,
          gender: entry.gender ?? undefined,
          score: entry.score, // Total minutes
          totalSessions: stats?.totalSessions ?? 0,
          currentStreak: entry.currentStreak,
          longestStreak: streak?.longestStreak ?? 0,
          isOnline: onlineUsers.has(entry.accountId),
        };
      });

      // Get total count of eligible users for pagination
      const total = entries.length < limit ? offset + entries.length : offset + limit + 1;

      const response: LeaderboardResponse = {
        entries: leaderboardEntries,
        pagination: {
          limit,
          offset,
          total,
          hasMore: entries.length === limit,
        },
        metadata: {
          type: 'total',
          generatedAt: new Date().toISOString(),
        },
      };

      const duration = Date.now() - startTime;
      this.logger.log(
        `Total leaderboard generated in ${duration}ms (limit: ${limit}, offset: ${offset})`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get total leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

/**
 * GET /study-rooms/leaderboard/me/stats
 * 
 * Get personal study statistics for the authenticated user
 * 
 * @param accountId - Authenticated user's account ID
 * @returns PersonalStatsResponse - Comprehensive personal stats
 */
@Get('me/stats')
  async getPersonalStats(
    @GetUser('account_id') accountId: number,
  ): Promise<PersonalStatsResponse> {
    const startTime = Date.now();

    try {
      const weekStart = getWeekStart();

      // Phase 1 — fetch cheap data + practice-session aggregates in parallel.
      // totalExp is derived from ToeicPracticePartSession.earned_points so it
      // stays consistent with the weekly EXP source (QuestionPointsCalculatorService)
      // and the underlying practice scoring engine.
      const [
        studyStat,
        streakInfo,
        weeklyExp,
        eligibilityStatus,
        recentSessions,
        student,
      ] = await Promise.all([
        this.prisma.studyStat.findUnique({
          where: { account_id: accountId },
          select: {
            total_minutes: true,
            total_sessions: true,
          },
        }),
        this.streakTracker.getStreakInfo(accountId),
        this.expCalculator.getWeeklyExp(accountId, weekStart),
        this.eligibilityChecker.checkEligibility(accountId),
        this.prisma.studySession.findMany({
          where: {
            account_id: accountId,
            ended_at: { not: null },
          },
          orderBy: { ended_at: 'desc' },
          take: 10,
          select: {
            id: true,
            started_at: true,
            ended_at: true,
            duration_minutes: true,
          },
        }),
        this.prisma.student.findUnique({
          where: { account_id: accountId },
          select: { student_id: true },
        }),
      ]);

      // Source-of-truth total EXP: TOEIC practice score gain.
      // Mirrors the frontend formula in toeicPracticeScore.ts so the value
      // shown by ToeicLearningMapPage's "+X.X điểm đã tích lũy" sums up to the
      // exact same number displayed on CertificateReview / StudentLeaderboard.
      // Formula: per part earned = (accuracy^0.85) × cap,
      //          cap = (part_questions / total_all_questions) × 200
      // Aggregated from MAX(correct_count) GROUP BY toeic_part across all of
      // the user's TOEIC practice sessions.
      let totalExp = 0;
      if (student) {
        const bestPerPart = await this.prisma.toeicPracticePartSession.groupBy({
          by: ['toeic_part'],
          where: { enrollment: { student_id: student.student_id } },
          _max: { correct_count: true },
        });
        totalExp = this.computeToeicPracticeScoreGain(bestPerPart);
      } else {
        totalExp = studyStat?.total_minutes ?? 0;
      }

      // Phase 2 — only compute ranks when the user actually has activity.
      // This avoids the expensive full-ranking pass for inactive users, which was
      // the dominant cost of this endpoint on cold Redis cache.
      const [weeklyRank, totalRank] = await Promise.all([
        weeklyExp > 0
          ? this.rankingEngine.getUserRank(accountId, 'weekly')
          : Promise.resolve<number | null>(null),
        totalExp > 0
          ? this.rankingEngine.getUserRank(accountId, 'total')
          : Promise.resolve<number | null>(null),
      ]);

      // Map recent sessions to response format
      const recentSessionsResponse = recentSessions.map((session) => ({
        sessionId: session.id,
        startedAt: session.started_at.toISOString(),
        endedAt: session.ended_at?.toISOString() ?? '',
        durationMinutes: session.duration_minutes ?? 0,
        expEarned: 0, // EXP is now question-based, not time-based
      }));

      const response: PersonalStatsResponse = {
        totals: {
          totalMinutes: studyStat?.total_minutes ?? 0,
          totalSessions: studyStat?.total_sessions ?? 0,
          totalExp,
        },
        streaks: {
          currentStreak: streakInfo?.currentStreak ?? 0,
          longestStreak: streakInfo?.longestStreak ?? 0,
          lastStudyDate: streakInfo?.lastStudyDate?.toISOString().split('T')[0] ?? null,
        },
        rankings: {
          weeklyRank,
          weeklyExp,
          totalRank,
        },
        eligibility: {
          isEligible: eligibilityStatus.eligible,
          hasSurveyCompleted: eligibilityStatus.surveyCompleted,
          hasGoalInput: eligibilityStatus.goalInputCompleted,
        },
        recentSessions: recentSessionsResponse,
      };

      const duration = Date.now() - startTime;
      this.logger.log(
        `Personal stats generated for account ${accountId} in ${duration}ms`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get personal stats for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Compute the TOEIC practice score gain for a user.
   *
   * Mirrors the frontend formula in `Ed_Vision/src/modules/student/toeicPracticeScore.ts`
   * so that the "Tổng điểm tích lũy" card on CertificateReview / StudentLeaderboard
   * matches the per-node "+X.X điểm đã tích lũy" message on ToeicLearningMapPage.
   *
   *   cap_part   = (part_questions / total_all_questions) × 200
   *   earned     = (accuracy ^ 0.85) × cap_part
   *   totalGain  = Σ earned over all parts (capped per part by definition)
   *
   * Default config: parts 1..7 with question counts {1:6, 2-7:10}, total 66, range 200.
   */
  private computeToeicPracticeScoreGain(
    bestPerPart: Array<{ toeic_part: number; _max: { correct_count: number | null } }>,
  ): number {
    const PART_QUESTIONS: Record<number, number> = {
      1: 6,
      2: 10,
      3: 10,
      4: 10,
      5: 10,
      6: 10,
      7: 10,
    };
    const TOTAL_ALL_QUESTIONS = Object.values(PART_QUESTIONS).reduce((s, n) => s + n, 0); // 66
    const RANGE = 200;
    const CURVE_EXPONENT = 0.85;

    let total = 0;
    for (const row of bestPerPart) {
      const questions = PART_QUESTIONS[row.toeic_part];
      if (!questions) continue;
      const bestCorrect = Math.max(0, Math.min(row._max.correct_count ?? 0, questions));
      const accuracy = bestCorrect / questions;
      const cap = (questions / TOTAL_ALL_QUESTIONS) * RANGE;
      const rawEarned = Math.min(cap, Math.pow(accuracy, CURVE_EXPONENT) * cap);
      // Round per-part to 2 decimals BEFORE summing — mirrors the frontend
      // formula (toeicPracticeScore.ts: `parseFloat(earned.toFixed(2))`) so
      // the aggregated total matches the "+X.X" practice node display exactly.
      total += Math.round(rawEarned * 100) / 100;
    }

    // Final display rounds to 1 decimal (matches `.toFixed(1)` on the practice node).
    return Math.round(total * 10) / 10;
  }

  /**
   * Helper method to get stats for multiple users
   * 
   * @param accountIds - Array of account IDs
   * @returns Map of accountId -> stats
   */
  private async getStatsForUsers(
    accountIds: number[],
  ): Promise<Map<number, { totalSessions: number }>> {
    const statsMap = new Map<number, { totalSessions: number }>();

    try {
      const stats = await this.prisma.studyStat.findMany({
        where: {
          account_id: { in: accountIds },
        },
        select: {
          account_id: true,
          total_sessions: true,
        },
      });

      for (const stat of stats) {
        statsMap.set(stat.account_id, {
          totalSessions: stat.total_sessions,
        });
      }

      return statsMap;
    } catch (error) {
      this.logger.error(
        `Failed to get stats for users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return statsMap;
    }
  }
}
