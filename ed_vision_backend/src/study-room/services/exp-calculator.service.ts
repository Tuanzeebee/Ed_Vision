import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  EXP_PER_MINUTE,
  MIN_SESSION_DURATION_MINUTES,
  REDIS_KEY_WEEKLY_EXP,
  TTL_WEEKLY_EXP,
  getWeekStart,
} from '../leaderboard.constants';

/**
 * EXP Calculator Service
 *
 * Responsible for calculating and awarding EXP (Experience Points) based on study session duration.
 *
 * Formula: EXP = Math.floor(durationMinutes) * EXP_PER_MINUTE
 * Minimum session: 1 minute (< 1 minute = 0 EXP)
 */
@Injectable()
export class ExpCalculatorService {
  private readonly logger = new Logger(ExpCalculatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Calculate EXP points from session duration
   *
   * @param durationMinutes - Duration of study session in minutes
   * @returns EXP points to award (0 if duration < MIN_SESSION_DURATION_MINUTES)
   */
  calculateExp(durationMinutes: number): number {
    // Validate input
    if (
      typeof durationMinutes !== 'number' ||
      !Number.isFinite(durationMinutes)
    ) {
      this.logger.warn(`Invalid duration provided: ${durationMinutes}`);
      return 0;
    }

    // Negative or zero duration = 0 EXP
    if (durationMinutes <= 0) {
      return 0;
    }

    // Less than minimum duration = 0 EXP
    if (durationMinutes < MIN_SESSION_DURATION_MINUTES) {
      return 0;
    }

    // Calculate EXP: floor the duration and multiply by EXP_PER_MINUTE
    const exp = Math.floor(durationMinutes) * EXP_PER_MINUTE;

    return exp;
  }

  /**
   * Award EXP to a user and update StudyStat
   *
   * This method:
   * 1. Updates StudyStat.total_minutes and total_sessions
   * 2. Stores weekly EXP in Redis for weekly ranking
   *
   * @param accountId - User account ID
   * @param exp - EXP points to award
   * @param sessionId - Study session ID (for audit trail)
   * @param durationMinutes - Session duration in minutes
   * @param sessionDate - Date of the study session (defaults to now)
   * @param client - Optional Prisma transaction client
   * @returns Promise<StudyStat> - Updated StudyStat record
   *
   * @throws Error if database transaction fails
   */
  async awardExp(
    accountId: number,
    exp: number,
    sessionId: number,
    durationMinutes: number,
    sessionDate: Date = new Date(),
    client?: any,
  ): Promise<any> {
    try {
      const prismaClient = client || this.prisma;

      // Upsert StudyStat: increment total_minutes and total_sessions
      const stats = await prismaClient.studyStat.upsert({
        where: { account_id: accountId },
        create: {
          account_id: accountId,
          total_minutes: Math.floor(durationMinutes),
          total_sessions: 1,
          updated_at: new Date(),
        },
        update: {
          total_minutes: {
            increment: Math.floor(durationMinutes),
          },
          total_sessions: {
            increment: 1,
          },
          updated_at: new Date(),
        },
      });

      this.logger.log(
        `Awarded ${exp} EXP to account ${accountId} for session ${sessionId} (${durationMinutes} minutes)`,
      );

      // Store weekly EXP in Redis (outside transaction for performance)
      await this.storeWeeklyExp(accountId, exp, sessionDate);

      return stats;
    } catch (error) {
      this.logger.error(
        `Failed to award EXP to account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Store weekly EXP in Redis for weekly ranking
   *
   * @param accountId - User account ID
   * @param exp - EXP points to add
   * @param sessionDate - Date of the study session
   * @returns Promise<void>
   */
  private async storeWeeklyExp(
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

      // Get current weekly EXP
      const currentExpStr = await this.redis
        .getClient()
        ?.get(this.redis.getKey(key));
      const currentExp = currentExpStr ? parseInt(currentExpStr, 10) : 0;

      // Add new EXP
      const newExp = currentExp + exp;

      // Store with TTL
      await this.redis
        .getClient()
        ?.set(this.redis.getKey(key), newExp.toString(), {
          EX: TTL_WEEKLY_EXP,
        });

      this.logger.debug(
        `Stored weekly EXP for account ${accountId}, week ${weekStart}: ${newExp} (added ${exp})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to store weekly EXP in Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Don't throw - Redis failure shouldn't break the main flow
    }
  }

  /**
   * Get weekly EXP for a user
   *
   * @param accountId - User account ID
   * @param weekStart - Week start date (ISO string YYYY-MM-DD)
   * @returns Promise<number> - Weekly EXP points (0 if not found)
   */
  async getWeeklyExp(accountId: number, weekStart: string): Promise<number> {
    if (!this.redis.isReady()) {
      this.logger.warn('Redis not available, returning 0 for weekly EXP');
      return 0;
    }

    try {
      const key = REDIS_KEY_WEEKLY_EXP(accountId, weekStart);
      const expStr = await this.redis.getClient()?.get(this.redis.getKey(key));

      if (!expStr) {
        return 0;
      }

      const exp = parseInt(expStr, 10);
      return Number.isFinite(exp) ? exp : 0;
    } catch (error) {
      this.logger.error(
        `Failed to get weekly EXP from Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return 0;
    }
  }

  /**
   * Get weekly EXP for multiple users (batch operation)
   *
   * @param accountIds - Array of user account IDs
   * @param weekStart - Week start date (ISO string YYYY-MM-DD)
   * @returns Promise<Map<number, number>> - Map of accountId -> weeklyExp
   */
  async getWeeklyExpBatch(
    accountIds: number[],
    weekStart: string,
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>();

    if (!this.redis.isReady()) {
      this.logger.warn(
        'Redis not available, returning empty map for weekly EXP batch',
      );
      return result;
    }

    try {
      // Use pipeline for batch operations
      const pipeline = this.redis.getClient()?.multi();

      if (!pipeline) {
        return result;
      }

      // Queue all GET operations
      for (const accountId of accountIds) {
        const key = REDIS_KEY_WEEKLY_EXP(accountId, weekStart);
        pipeline.get(this.redis.getKey(key));
      }

      // Execute pipeline
      const results = await pipeline.exec();

      if (!results) {
        return result;
      }

      // Parse results
      for (let i = 0; i < accountIds.length; i++) {
        const accountId = accountIds[i];
        const [error, value] = results[i] as [Error | null, string | null];

        if (error) {
          this.logger.error(
            `Error getting weekly EXP for account ${accountId}: ${error.message}`,
          );
          result.set(accountId, 0);
          continue;
        }

        const exp = value ? parseInt(value, 10) : 0;
        result.set(accountId, Number.isFinite(exp) ? exp : 0);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get weekly EXP batch from Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return result;
    }
  }
}
