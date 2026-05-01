import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisService } from '../../redis/redis.service';
import { getWeekStart } from '../leaderboard.constants';

/**
 * Leaderboard Cron Service
 *
 * Handles scheduled tasks for the leaderboard system:
 * - Resets weekly EXP counters every Monday at 00:00
 * - Invalidates stale leaderboard caches
 */
@Injectable()
export class LeaderboardCronService {
  private readonly logger = new Logger(LeaderboardCronService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Reset weekly EXP counters every Monday at 00:00.
   *
   * Weekly EXP keys follow the pattern: weekly:exp:{accountId}:{weekStart}
   * They have an 8-day TTL so they expire naturally, but this cron ensures
   * the leaderboard cache is invalidated at the start of each new week.
   */
  @Cron('0 0 * * 1') // Every Monday at 00:00
  async resetWeeklyLeaderboard(): Promise<void> {
    this.logger.log('Running weekly leaderboard reset (Monday 00:00)');

    if (!this.redis.isReady()) {
      this.logger.warn('Redis not available, skipping weekly reset');
      return;
    }

    try {
      const client = this.redis.getClient();
      if (!client) return;

      // Get the previous week start (last Monday) to delete its leaderboard cache
      const now = new Date();
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      const previousWeekStart = getWeekStart(lastWeek);

      // Delete previous week's leaderboard cache
      const previousWeekCacheKey = this.redis.getKey(
        `leaderboard:weekly:${previousWeekStart}`,
      );
      await client.del(previousWeekCacheKey);

      // Delete current week's leaderboard cache to force recalculation
      const currentWeekStart = getWeekStart(now);
      const currentWeekCacheKey = this.redis.getKey(
        `leaderboard:weekly:${currentWeekStart}`,
      );
      await client.del(currentWeekCacheKey);

      // Also delete total leaderboard cache to force refresh
      const totalCacheKey = this.redis.getKey('leaderboard:total');
      await client.del(totalCacheKey);

      this.logger.log(
        `Weekly leaderboard reset complete. Cleared caches for weeks: ${previousWeekStart}, ${currentWeekStart}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to reset weekly leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
