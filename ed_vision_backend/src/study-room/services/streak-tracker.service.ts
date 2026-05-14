import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Streak Information
 */
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;
}

/**
 * Streak Tracker Service
 *
 * Responsible for tracking and updating consecutive study day streaks.
 *
 * Logic:
 * - Same day: No change to streak
 * - Consecutive day (gap = 1): Increment streak
 * - Gap > 1 day: Reset streak to 1
 * - Update longest_streak if current exceeds it
 */
@Injectable()
export class StreakTrackerService {
  private readonly logger = new Logger(StreakTrackerService.name);

  /**
   * Offset (phút) so với UTC dùng để xác định "ngày" của user. Mặc định 420
   * (UTC+7 — Asia/Ho_Chi_Minh) để streak khớp với lịch VN, không phụ thuộc
   * timezone của server (Docker thường chạy UTC). Có thể override bằng env
   * `STREAK_TIMEZONE_OFFSET_MINUTES`.
   */
  private static readonly TZ_OFFSET_MINUTES = (() => {
    const raw = Number.parseInt(
      process.env.STREAK_TIMEZONE_OFFSET_MINUTES?.trim() ?? '420',
      10,
    );
    return Number.isFinite(raw) ? raw : 420;
  })();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute the *effective* current streak based on the last study date.
   *
   * The streak persisted in DB is only updated when the user studies again.
   * If the user has skipped one or more full days since `lastStudyDate`, the
   * stored counter is stale and the effective streak must be reported as 0
   * (broken) until they study again (which resets it to 1 in the write path).
   *
   * Rules (calendar days, local-time normalized):
   * - lastStudyDate is null or storedCurrent <= 0 → 0
   * - diff in days <= 1 (today or yesterday) → storedCurrent (still active)
   * - diff in days >= 2 (missed at least one full day) → 0
   */
  static computeEffectiveCurrentStreak(
    lastStudyDate: Date | null,
    storedCurrent: number,
    now: Date = new Date(),
  ): number {
    if (!lastStudyDate || storedCurrent <= 0) {
      return 0;
    }

    const today = StreakTrackerService.toLocalDateOnly(now);
    const last = StreakTrackerService.toLocalDateOnly(lastStudyDate);

    const diffDays = Math.floor(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Future last_study_date (clock skew) — treat as still active.
    if (diffDays <= 1) {
      return storedCurrent;
    }

    return 0;
  }

  /**
   * Trả về Date đại diện cho 00:00 (UTC) của *ngày theo timezone user* tương
   * ứng với timestamp `date`. Nhờ vậy, mọi so sánh ngày (diff, equals) độc
   * lập với timezone của server. Khớp với cột `@db.Date` của Prisma vì giá
   * trị trả về luôn nằm tại UTC midnight của ngày local đó.
   */
  static toLocalDateOnly(date: Date): Date {
    const offsetMs = StreakTrackerService.TZ_OFFSET_MINUTES * 60 * 1000;
    const shifted = new Date(date.getTime() + offsetMs);
    return new Date(
      Date.UTC(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth(),
        shifted.getUTCDate(),
      ),
    );
  }

  /**
   * Update streak for a user after completing a study session
   *
   * @param accountId - User account ID
   * @param studyDate - Date of the study session (in user's timezone)
   * @param client - Optional Prisma transaction client
   * @returns Promise<StreakInfo> - Updated streak information
   */
  async updateStreak(
    accountId: number,
    studyDate: Date,
    client?: any,
  ): Promise<StreakInfo> {
    try {
      const prismaClient = client || this.prisma;

      // Normalize study date to midnight (remove time component)
      const normalizedDate = this.normalizeDate(studyDate);

      // Get or create DailyStreak record
      const existingStreak = await prismaClient.dailyStreak.findUnique({
        where: { account_id: accountId },
      });

      if (!existingStreak) {
        // First time studying - create new streak record
        const newStreak = await prismaClient.dailyStreak.create({
          data: {
            account_id: accountId,
            current_streak: 1,
            longest_streak: 1,
            last_study_date: normalizedDate,
          },
        });

        this.logger.log(`Created new streak for account ${accountId}: 1 day`);

        return {
          currentStreak: newStreak.current_streak,
          longestStreak: newStreak.longest_streak,
          lastStudyDate: newStreak.last_study_date,
        };
      }

      // Calculate new streak based on last study date
      const newStreakData = this.calculateStreak(
        existingStreak.last_study_date,
        normalizedDate,
        existingStreak.current_streak,
        existingStreak.longest_streak,
      );

      // Update DailyStreak record
      const updatedStreak = await prismaClient.dailyStreak.update({
        where: { account_id: accountId },
        data: {
          current_streak: newStreakData.currentStreak,
          longest_streak: newStreakData.longestStreak,
          last_study_date: normalizedDate,
        },
      });

      this.logger.log(
        `Updated streak for account ${accountId}: ${updatedStreak.current_streak} days (longest: ${updatedStreak.longest_streak})`,
      );

      return {
        currentStreak: updatedStreak.current_streak,
        longestStreak: updatedStreak.longest_streak,
        lastStudyDate: updatedStreak.last_study_date,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update streak for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Calculate new streak based on last study date and current date
   *
   * @param lastStudyDate - Last study date (or null if first time)
   * @param currentDate - Current study date
   * @param currentStreak - Current streak count
   * @param longestStreak - Longest streak count
   * @returns Updated streak data
   */
  private calculateStreak(
    lastStudyDate: Date | null,
    currentDate: Date,
    currentStreak: number,
    longestStreak: number,
  ): { currentStreak: number; longestStreak: number } {
    // If no previous study date, start with streak of 1
    if (!lastStudyDate) {
      return {
        currentStreak: 1,
        longestStreak: Math.max(1, longestStreak),
      };
    }

    // Calculate days difference
    const daysDiff = this.getDaysDifference(lastStudyDate, currentDate);

    let newCurrentStreak: number;

    if (daysDiff === 0) {
      // Same day - no change to streak
      newCurrentStreak = currentStreak;
    } else if (daysDiff === 1) {
      // Consecutive day - increment streak
      newCurrentStreak = currentStreak + 1;
    } else {
      // Gap > 1 day - reset streak to 1
      newCurrentStreak = 1;
    }

    // Update longest streak if current exceeds it
    const newLongestStreak = Math.max(newCurrentStreak, longestStreak);

    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
    };
  }

  /**
   * Get current streak for a user
   *
   * @param accountId - User account ID
   * @returns Promise<number> - Current streak count (0 if not found)
   */
  async getCurrentStreak(accountId: number): Promise<number> {
    try {
      const streak = await this.prisma.dailyStreak.findUnique({
        where: { account_id: accountId },
        select: { current_streak: true, last_study_date: true },
      });

      return StreakTrackerService.computeEffectiveCurrentStreak(
        streak?.last_study_date ?? null,
        streak?.current_streak ?? 0,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get current streak for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return 0;
    }
  }

  /**
   * Get longest streak for a user
   *
   * @param accountId - User account ID
   * @returns Promise<number> - Longest streak count (0 if not found)
   */
  async getLongestStreak(accountId: number): Promise<number> {
    try {
      const streak = await this.prisma.dailyStreak.findUnique({
        where: { account_id: accountId },
        select: { longest_streak: true },
      });

      return streak?.longest_streak ?? 0;
    } catch (error) {
      this.logger.error(
        `Failed to get longest streak for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return 0;
    }
  }

  /**
   * Get full streak info for a user
   *
   * @param accountId - User account ID
   * @returns Promise<StreakInfo> - Streak information
   */
  async getStreakInfo(accountId: number): Promise<StreakInfo> {
    try {
      const streak = await this.prisma.dailyStreak.findUnique({
        where: { account_id: accountId },
      });

      if (!streak) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
        };
      }

      return {
        currentStreak: StreakTrackerService.computeEffectiveCurrentStreak(
          streak.last_study_date,
          streak.current_streak,
        ),
        longestStreak: streak.longest_streak,
        lastStudyDate: streak.last_study_date,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get streak info for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
      };
    }
  }

  /**
   * Get streak info for multiple users (batch operation)
   *
   * @param accountIds - Array of user account IDs
   * @returns Promise<Map<number, StreakInfo>> - Map of accountId -> StreakInfo
   */
  async getStreakInfoBatch(
    accountIds: number[],
  ): Promise<Map<number, StreakInfo>> {
    const result = new Map<number, StreakInfo>();

    try {
      const streaks = await this.prisma.dailyStreak.findMany({
        where: {
          account_id: { in: accountIds },
        },
      });

      // Create map from results
      const now = new Date();
      for (const streak of streaks) {
        result.set(streak.account_id, {
          currentStreak: StreakTrackerService.computeEffectiveCurrentStreak(
            streak.last_study_date,
            streak.current_streak,
            now,
          ),
          longestStreak: streak.longest_streak,
          lastStudyDate: streak.last_study_date,
        });
      }

      // Fill in missing accounts with default values
      for (const accountId of accountIds) {
        if (!result.has(accountId)) {
          result.set(accountId, {
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: null,
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get streak info batch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return result;
    }
  }

  /**
   * Normalize date to start-of-day theo timezone của user (mặc định UTC+7).
   * Dùng `toLocalDateOnly` để không phụ thuộc timezone của server.
   */
  private normalizeDate(date: Date): Date {
    return StreakTrackerService.toLocalDateOnly(date);
  }

  /**
   * Calculate days difference between two dates
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns Number of days difference (absolute value)
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const normalized1 = this.normalizeDate(date1);
    const normalized2 = this.normalizeDate(date2);

    const diffMs = normalized2.getTime() - normalized1.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return Math.abs(diffDays);
  }
}
