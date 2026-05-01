import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EligibilityCheckerService } from './eligibility-checker.service';
import { QuestionPointsCalculatorService } from './question-points-calculator.service';
import { StreakTrackerService } from './streak-tracker.service';
import {
  REDIS_KEY_WEEKLY_LEADERBOARD,
  REDIS_KEY_TOTAL_LEADERBOARD,
  TTL_WEEKLY_LEADERBOARD,
  TTL_TOTAL_LEADERBOARD,
  getWeekStart,
} from '../leaderboard.constants';

/**
 * Ranking Entry
 */
export interface RankingEntry {
  rank: number;
  accountId: number;
  score: number;
  fullName: string;
  avatarUrl: string | null;
  gender: string | null;
  currentStreak: number;
  onlineStatus: boolean;
}

/**
 * Ranking Engine Service
 * 
 * Responsible for calculating and managing user rankings.
 * 
 * Ranking Types:
 * - Weekly Ranking: Based on EXP earned in current week (Monday-Sunday)
 * - Total Ranking: Based on StudyStat.total_minutes
 * 
 * Tied Ranks: Same score = same rank, skip subsequent numbers
 */
@Injectable()
export class RankingEngineService {
  private readonly logger = new Logger(RankingEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eligibilityChecker: EligibilityCheckerService,
    private readonly pointsCalculator: QuestionPointsCalculatorService,
    private readonly streakTracker: StreakTrackerService,
  ) {}

  /**
   * Calculate weekly ranking based on EXP earned in current week
   * 
   * @param weekStart - Week start date (ISO string YYYY-MM-DD)
   * @param limit - Maximum number of entries to return
   * @param offset - Offset for pagination
   * @returns Promise<RankingEntry[]> - Sorted ranking entries
   */
  async calculateWeeklyRanking(
    weekStart: string,
    limit?: number,
    offset?: number,
  ): Promise<RankingEntry[]> {
    try {
      // Check cache first
      const cached = await this.getCachedWeeklyRanking(weekStart);
      if (cached && cached.length > 0) {
        // Apply pagination to cached results
        const start = offset ?? 0;
        const end = limit ? start + limit : undefined;
        return cached.slice(start, end);
      }

      // Get all eligible users
      const eligibleUsers = await this.getEligibleUsers();

      if (eligibleUsers.length === 0) {
        return [];
      }

      // Get weekly points for all eligible users
      const accountIds = eligibleUsers.map((u) => u.accountId);
      const weeklyExpMap = await this.pointsCalculator.getWeeklyPointsBatch(accountIds, weekStart);

      // Get streak info for all users
      const streakMap = await this.streakTracker.getStreakInfoBatch(accountIds);

      // Build ranking entries
      const entries: Array<{
        accountId: number;
        score: number;
        fullName: string;
        avatarUrl: string | null;
        gender: string | null;
        currentStreak: number;
      }> = [];

      for (const user of eligibleUsers) {
        const weeklyExp = weeklyExpMap.get(user.accountId) ?? 0;
        const streak = streakMap.get(user.accountId);

        entries.push({
          accountId: user.accountId,
          score: weeklyExp,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          gender: user.gender,
          currentStreak: streak?.currentStreak ?? 0,
        });
      }

      // Sort by score descending
      entries.sort((a, b) => b.score - a.score);

      // Assign ranks (handle tied scores)
      const rankedEntries = this.assignRanks(entries);

      // Cache the full result
      await this.cacheWeeklyRanking(weekStart, rankedEntries);

      // Apply pagination
      const start = offset ?? 0;
      const end = limit ? start + limit : undefined;
      return rankedEntries.slice(start, end);
    } catch (error) {
      this.logger.error(
        `Failed to calculate weekly ranking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Calculate total ranking based on StudyStat.total_minutes
   * 
   * @param limit - Maximum number of entries to return
   * @param offset - Offset for pagination
   * @returns Promise<RankingEntry[]> - Sorted ranking entries
   */
  async calculateTotalRanking(limit?: number, offset?: number): Promise<RankingEntry[]> {
    try {
      // Check cache first
      const cached = await this.getCachedTotalRanking();
      if (cached && cached.length > 0) {
        // Apply pagination to cached results
        const start = offset ?? 0;
        const end = limit ? start + limit : undefined;
        return cached.slice(start, end);
      }

      // Get all eligible users with their stats
      const eligibleUsers = await this.getEligibleUsersWithStats();

      if (eligibleUsers.length === 0) {
        return [];
      }

      // Get streak info for all users
      const accountIds = eligibleUsers.map((u) => u.accountId);
      const streakMap = await this.streakTracker.getStreakInfoBatch(accountIds);

      // Build ranking entries
      const entries: Array<{
        accountId: number;
        score: number;
        fullName: string;
        avatarUrl: string | null;
        gender: string | null;
        currentStreak: number;
      }> = [];

      for (const user of eligibleUsers) {
        const streak = streakMap.get(user.accountId);

        entries.push({
          accountId: user.accountId,
          score: user.totalMinutes,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          gender: user.gender,
          currentStreak: streak?.currentStreak ?? 0,
        });
      }

      // Sort by score descending
      entries.sort((a, b) => b.score - a.score);

      // Assign ranks (handle tied scores)
      const rankedEntries = this.assignRanks(entries);

      // Update Leaderboard table with total rankings
      await this.updateLeaderboardTable(rankedEntries);

      // Cache the full result
      await this.cacheTotalRanking(rankedEntries);

      // Apply pagination
      const start = offset ?? 0;
      const end = limit ? start + limit : undefined;
      return rankedEntries.slice(start, end);
    } catch (error) {
      this.logger.error(
        `Failed to calculate total ranking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Get user's rank in weekly or total ranking
   * 
   * @param accountId - User account ID
   * @param type - Ranking type ('weekly' or 'total')
   * @returns Promise<number | null> - User's rank (null if not eligible or not found)
   */
  async getUserRank(accountId: number, type: 'weekly' | 'total'): Promise<number | null> {
    try {
      // Check eligibility first
      const eligible = await this.eligibilityChecker.isEligible(accountId);
      if (!eligible) {
        return null;
      }

      if (type === 'weekly') {
        const weekStart = getWeekStart();
        const ranking = await this.calculateWeeklyRanking(weekStart);
        const entry = ranking.find((e) => e.accountId === accountId);
        return entry?.rank ?? null;
      } else {
        // For total ranking, check Leaderboard table first
        const leaderboard = await this.prisma.leaderboard.findUnique({
          where: { account_id: accountId },
          select: { rank: true },
        });

        if (leaderboard?.rank) {
          return leaderboard.rank;
        }

        // Fallback: calculate from full ranking
        const ranking = await this.calculateTotalRanking();
        const entry = ranking.find((e) => e.accountId === accountId);
        return entry?.rank ?? null;
      }
    } catch (error) {
      this.logger.error(
        `Failed to get user rank for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Assign ranks to entries (handle tied scores)
   * 
   * @param entries - Sorted entries (by score descending)
   * @returns RankingEntry[] - Entries with ranks assigned
   */
  private assignRanks(
    entries: Array<{
      accountId: number;
      score: number;
      fullName: string;
      avatarUrl: string | null;
      gender: string | null;
      currentStreak: number;
    }>,
  ): RankingEntry[] {
    const rankedEntries: RankingEntry[] = [];
    let currentRank = 1;
    let previousScore: number | null = null;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // If score is different from previous, update rank
      if (previousScore !== null && entry.score !== previousScore) {
        currentRank = i + 1;
      }

      rankedEntries.push({
        rank: currentRank,
        accountId: entry.accountId,
        score: entry.score,
        fullName: entry.fullName,
        avatarUrl: entry.avatarUrl,
        gender: entry.gender,
        currentStreak: entry.currentStreak,
        onlineStatus: false, // Will be filled by OnlineStatusManager
      });

      previousScore = entry.score;
    }

    return rankedEntries;
  }

  /**
   * Get all eligible users (with profile info)
   * 
   * @returns Promise<Array> - Array of eligible users
   */
  private async getEligibleUsers(): Promise<
    Array<{
      accountId: number;
      fullName: string;
      avatarUrl: string | null;
      gender: string | null;
    }>
  > {
    try {
      // Get all accounts with profiles
      const accounts = await this.prisma.account.findMany({
        where: {
          profile: {
            isNot: null,
          },
        },
        select: {
          account_id: true,
          profile: {
            select: {
              full_name: true,
              avatar_url: true,
              gender: true,
            },
          },
        },
      });

      // Filter by eligibility
      const eligibleUsers: Array<{
        accountId: number;
        fullName: string;
        avatarUrl: string | null;
        gender: string | null;
      }> = [];

      for (const account of accounts) {
        const eligible = await this.eligibilityChecker.isEligible(account.account_id);
        if (eligible && account.profile) {
          eligibleUsers.push({
            accountId: account.account_id,
            fullName: account.profile.full_name,
            avatarUrl: account.profile.avatar_url,
            gender: account.profile.gender,
          });
        }
      }

      return eligibleUsers;
    } catch (error) {
      this.logger.error(
        `Failed to get eligible users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Get all eligible users with their study stats
   * 
   * @returns Promise<Array> - Array of eligible users with stats
   */
  private async getEligibleUsersWithStats(): Promise<
    Array<{
      accountId: number;
      fullName: string;
      avatarUrl: string | null;
      gender: string | null;
      totalMinutes: number;
    }>
  > {
    try {
      // Get all accounts with profiles and stats
      const accounts = await this.prisma.account.findMany({
        where: {
          profile: {
            isNot: null,
          },
          studyStat: {
            isNot: null,
          },
        },
        select: {
          account_id: true,
          profile: {
            select: {
              full_name: true,
              avatar_url: true,
              gender: true,
            },
          },
          studyStat: {
            select: {
              total_minutes: true,
            },
          },
        },
      });

      // Filter by eligibility
      const eligibleUsers: Array<{
        accountId: number;
        fullName: string;
        avatarUrl: string | null;
        gender: string | null;
        totalMinutes: number;
      }> = [];

      for (const account of accounts) {
        const eligible = await this.eligibilityChecker.isEligible(account.account_id);
        if (eligible && account.profile && account.studyStat) {
          eligibleUsers.push({
            accountId: account.account_id,
            fullName: account.profile.full_name,
            avatarUrl: account.profile.avatar_url,
            gender: account.profile.gender,
            totalMinutes: account.studyStat.total_minutes,
          });
        }
      }

      return eligibleUsers;
    } catch (error) {
      this.logger.error(
        `Failed to get eligible users with stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Update Leaderboard table with total rankings
   * 
   * @param entries - Ranking entries
   * @returns Promise<void>
   */
  private async updateLeaderboardTable(entries: RankingEntry[]): Promise<void> {
    try {
      // Use transaction for batch updates
      await this.prisma.$transaction(
        entries.map((entry) =>
          this.prisma.leaderboard.upsert({
            where: { account_id: entry.accountId },
            create: {
              account_id: entry.accountId,
              score: entry.score,
              rank: entry.rank,
              updated_at: new Date(),
            },
            update: {
              score: entry.score,
              rank: entry.rank,
              updated_at: new Date(),
            },
          }),
        ),
      );

      this.logger.debug(`Updated Leaderboard table with ${entries.length} entries`);
    } catch (error) {
      this.logger.error(
        `Failed to update Leaderboard table: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get cached weekly ranking
   * 
   * @param weekStart - Week start date
   * @returns Promise<RankingEntry[] | null>
   */
  private async getCachedWeeklyRanking(weekStart: string): Promise<RankingEntry[] | null> {
    if (!this.redis.isReady()) {
      return null;
    }

    try {
      const key = REDIS_KEY_WEEKLY_LEADERBOARD(weekStart);
      return await this.redis.getJson<RankingEntry[]>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get cached weekly ranking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Cache weekly ranking
   * 
   * @param weekStart - Week start date
   * @param entries - Ranking entries
   * @returns Promise<void>
   */
  private async cacheWeeklyRanking(weekStart: string, entries: RankingEntry[]): Promise<void> {
    if (!this.redis.isReady()) {
      return;
    }

    try {
      const key = REDIS_KEY_WEEKLY_LEADERBOARD(weekStart);
      await this.redis.setJson(key, entries, TTL_WEEKLY_LEADERBOARD);
      this.logger.debug(`Cached weekly ranking for week ${weekStart}: ${entries.length} entries`);
    } catch (error) {
      this.logger.error(
        `Failed to cache weekly ranking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get cached total ranking
   * 
   * @returns Promise<RankingEntry[] | null>
   */
  private async getCachedTotalRanking(): Promise<RankingEntry[] | null> {
    if (!this.redis.isReady()) {
      return null;
    }

    try {
      return await this.redis.getJson<RankingEntry[]>(REDIS_KEY_TOTAL_LEADERBOARD);
    } catch (error) {
      this.logger.error(
        `Failed to get cached total ranking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Cache total ranking
   * 
   * @param entries - Ranking entries
   * @returns Promise<void>
   */
  private async cacheTotalRanking(entries: RankingEntry[]): Promise<void> {
    if (!this.redis.isReady()) {
      return;
    }

    try {
      await this.redis.setJson(REDIS_KEY_TOTAL_LEADERBOARD, entries, TTL_TOTAL_LEADERBOARD);
      this.logger.debug(`Cached total ranking: ${entries.length} entries`);
    } catch (error) {
      this.logger.error(
        `Failed to cache total ranking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Invalidate all ranking caches
   * 
   * @returns Promise<void>
   */
  async invalidateAllCaches(): Promise<void> {
    try {
      const weekStart = getWeekStart();
      await this.redis.delete(REDIS_KEY_WEEKLY_LEADERBOARD(weekStart));
      await this.redis.delete(REDIS_KEY_TOTAL_LEADERBOARD);
      this.logger.debug('Invalidated all ranking caches');
    } catch (error) {
      this.logger.error(
        `Failed to invalidate ranking caches: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
