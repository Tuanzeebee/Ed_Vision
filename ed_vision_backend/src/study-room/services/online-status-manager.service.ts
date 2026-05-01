import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEY_ONLINE_USERS } from '../leaderboard.constants';

/**
 * Online Status Manager Service
 * 
 * Responsible for managing user online status for the leaderboard.
 * 
 * Uses Redis Set to track currently online users.
 * A user is considered online when they are actively in a study room.
 */
@Injectable()
export class OnlineStatusManagerService {
  private readonly logger = new Logger(OnlineStatusManagerService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Mark a user as online
   * 
   * @param accountId - User account ID
   * @returns Promise<void>
   */
  async setOnline(accountId: number): Promise<void> {
    if (!this.redis.isReady()) {
      this.logger.warn('Redis not available, skipping online status update');
      return;
    }

    try {
      await this.redis.addToSet(REDIS_KEY_ONLINE_USERS, accountId.toString());
      this.logger.debug(`Set account ${accountId} as online`);
    } catch (error) {
      this.logger.error(
        `Failed to set account ${accountId} as online: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Mark a user as offline
   * 
   * @param accountId - User account ID
   * @returns Promise<void>
   */
  async setOffline(accountId: number): Promise<void> {
    if (!this.redis.isReady()) {
      this.logger.warn('Redis not available, skipping online status update');
      return;
    }

    try {
      await this.redis.removeFromSet(REDIS_KEY_ONLINE_USERS, accountId.toString());
      this.logger.debug(`Set account ${accountId} as offline`);
    } catch (error) {
      this.logger.error(
        `Failed to set account ${accountId} as offline: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if a user is online
   * 
   * @param accountId - User account ID
   * @returns Promise<boolean> - True if online, false otherwise
   */
  async isOnline(accountId: number): Promise<boolean> {
    if (!this.redis.isReady()) {
      return false;
    }

    try {
      const members = await this.redis.getSetMembers(REDIS_KEY_ONLINE_USERS);
      return members.includes(accountId.toString());
    } catch (error) {
      this.logger.error(
        `Failed to check online status for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Get online status for multiple users (batch operation)
   * 
   * @param accountIds - Array of user account IDs
   * @returns Promise<Set<number>> - Set of online user IDs
   */
  async getOnlineUsers(accountIds: number[]): Promise<Set<number>> {
    const onlineUsers = new Set<number>();

    if (!this.redis.isReady()) {
      return onlineUsers;
    }

    try {
      const members = await this.redis.getSetMembers(REDIS_KEY_ONLINE_USERS);
      const onlineSet = new Set(members);

      for (const accountId of accountIds) {
        if (onlineSet.has(accountId.toString())) {
          onlineUsers.add(accountId);
        }
      }

      return onlineUsers;
    } catch (error) {
      this.logger.error(
        `Failed to get online users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return onlineUsers;
    }
  }

  /**
   * Get all online users
   * 
   * @returns Promise<number[]> - Array of online user account IDs
   */
  async getAllOnlineUsers(): Promise<number[]> {
    if (!this.redis.isReady()) {
      return [];
    }

    try {
      const members = await this.redis.getSetMembers(REDIS_KEY_ONLINE_USERS);
      return members.map((m) => parseInt(m, 10)).filter((id) => !isNaN(id));
    } catch (error) {
      this.logger.error(
        `Failed to get all online users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Get online user count
   * 
   * @returns Promise<number> - Number of online users
   */
  async getOnlineUserCount(): Promise<number> {
    if (!this.redis.isReady()) {
      return 0;
    }

    try {
      const members = await this.redis.getSetMembers(REDIS_KEY_ONLINE_USERS);
      return members.length;
    } catch (error) {
      this.logger.error(
        `Failed to get online user count: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return 0;
    }
  }

  /**
   * Clear all online users (for maintenance/testing)
   * 
   * @returns Promise<void>
   */
  async clearAllOnlineUsers(): Promise<void> {
    if (!this.redis.isReady()) {
      return;
    }

    try {
      await this.redis.delete(REDIS_KEY_ONLINE_USERS);
      this.logger.log('Cleared all online users');
    } catch (error) {
      this.logger.error(
        `Failed to clear online users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
