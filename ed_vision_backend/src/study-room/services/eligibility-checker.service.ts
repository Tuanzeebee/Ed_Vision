import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { REDIS_KEY_ELIGIBILITY, TTL_ELIGIBILITY } from '../leaderboard.constants';

/**
 * Eligibility Status
 */
export interface EligibilityStatus {
  eligible: boolean;
  surveyCompleted: boolean;
  goalInputCompleted: boolean;
  missingRequirements: string[];
}

/**
 * Eligibility Checker Service
 * 
 * Responsible for checking if a user is eligible to appear on the leaderboard.
 * 
 * Eligibility Criteria:
 * 1. Survey Completion: User must have completed at least one input survey (type='input')
 * 2. Goal Input: User must have set target_score in CertificateEnrollment
 */
@Injectable()
export class EligibilityCheckerService {
  private readonly logger = new Logger(EligibilityCheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Check if a user is eligible for the leaderboard
   * 
   * @param accountId - User account ID
   * @returns Promise<EligibilityStatus> - Detailed eligibility status
   */
  async checkEligibility(accountId: number): Promise<EligibilityStatus> {
    try {
      // Check cache first
      const cached = await this.getCachedEligibility(accountId);
      if (cached !== null) {
        return cached;
      }

      // Check survey completion
      const surveyCompleted = await this.checkSurveyCompletion(accountId);

      // Check goal input completion
      const goalInputCompleted = await this.checkGoalInputCompletion(accountId);

      // Determine eligibility
      const eligible = surveyCompleted && goalInputCompleted;

      // Build missing requirements list
      const missingRequirements: string[] = [];
      if (!surveyCompleted) {
        missingRequirements.push('survey_completion');
      }
      if (!goalInputCompleted) {
        missingRequirements.push('goal_input');
      }

      const status: EligibilityStatus = {
        eligible,
        surveyCompleted,
        goalInputCompleted,
        missingRequirements,
      };

      // Cache the result
      await this.cacheEligibility(accountId, status);

      return status;
    } catch (error) {
      this.logger.error(
        `Failed to check eligibility for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Return ineligible on error
      return {
        eligible: false,
        surveyCompleted: false,
        goalInputCompleted: false,
        missingRequirements: ['error'],
      };
    }
  }

  /**
   * Check if a user is eligible (simple boolean check)
   * 
   * @param accountId - User account ID
   * @returns Promise<boolean> - True if eligible, false otherwise
   */
  async isEligible(accountId: number): Promise<boolean> {
    const status = await this.checkEligibility(accountId);
    return status.eligible;
  }

  /**
   * Check if multiple users are eligible (batch operation)
   * 
   * @param accountIds - Array of user account IDs
   * @returns Promise<Map<number, boolean>> - Map of accountId -> eligible
   */
  async isEligibleBatch(accountIds: number[]): Promise<Map<number, boolean>> {
    const result = new Map<number, boolean>();

    try {
      // Check each user's eligibility
      const promises = accountIds.map(async (accountId) => {
        const eligible = await this.isEligible(accountId);
        return { accountId, eligible };
      });

      const results = await Promise.all(promises);

      for (const { accountId, eligible } of results) {
        result.set(accountId, eligible);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to check eligibility batch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return result;
    }
  }

  /**
   * Batch resolve eligibility for many accounts using 3 set-based SQL queries
   * instead of N sequential `isEligible()` calls. This is the fast path used
   * by the leaderboard ranking engine.
   *
   * Eligibility = (surveyCompleted OR toeicDiagnosticDone) AND goalInputSet
   *
   * @param candidateIds - Account IDs to check
   * @returns Promise<Set<number>> - Set of eligible account IDs
   */
  async getEligibleAccountIdsBatch(candidateIds: number[]): Promise<Set<number>> {
    const eligible = new Set<number>();
    if (candidateIds.length === 0) return eligible;

    try {
      // Run 3 bulk queries in parallel — 1 round-trip each.
      const [surveyDone, enrollments, students] = await Promise.all([
        // A) Accounts that have at least one input-survey response.
        this.prisma.surveyResponse.findMany({
          where: {
            account_id: { in: candidateIds },
            survey: { type: 'input', is_active: true },
          },
          distinct: ['account_id'],
          select: { account_id: true },
        }),
        // B+C) All enrollments of these candidate students in one shot.
        this.prisma.certificateEnrollment.findMany({
          where: {
            student: { account_id: { in: candidateIds } },
            OR: [
              { target_score: { not: null } },
              { AND: [{ cert_type: 'toeic' }, { current_score: { gt: 0 } }] },
            ],
          },
          select: {
            cert_type: true,
            target_score: true,
            current_score: true,
            student: { select: { account_id: true } },
          },
        }),
        // Map student → account for candidates (some might not be students).
        this.prisma.student.findMany({
          where: { account_id: { in: candidateIds } },
          select: { account_id: true },
        }),
      ]);

      const studentAccountSet = new Set(students.map((s) => s.account_id));
      const surveySet = new Set(
        surveyDone.map((r) => r.account_id).filter((id): id is number => id !== null),
      );

      // Build per-account flags from the enrollments batch.
      const goalSet = new Set<number>();
      const toeicDiagSet = new Set<number>();
      for (const e of enrollments) {
        const accId = e.student.account_id;
        if (e.target_score !== null && e.target_score !== undefined) {
          goalSet.add(accId);
        }
        if (e.cert_type === 'toeic' && (e.current_score ?? 0) > 0) {
          toeicDiagSet.add(accId);
        }
      }

      for (const id of candidateIds) {
        // Must be a student to be eligible at all.
        if (!studentAccountSet.has(id)) continue;
        const surveyCompleted = surveySet.has(id) || toeicDiagSet.has(id);
        const goalInputCompleted = goalSet.has(id);
        if (surveyCompleted && goalInputCompleted) eligible.add(id);
      }

      return eligible;
    } catch (error) {
      this.logger.error(
        `Failed batch eligibility check: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return eligible;
    }
  }

  /**
   * Invalidate eligibility cache for a user
   * 
   * @param accountId - User account ID
   * @returns Promise<void>
   */
  async invalidateCache(accountId: number): Promise<void> {
    try {
      const key = REDIS_KEY_ELIGIBILITY(accountId);
      await this.redis.delete(key);
      this.logger.debug(`Invalidated eligibility cache for account ${accountId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate eligibility cache for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if user has completed input survey
   * 
   * @param accountId - User account ID
   * @returns Promise<boolean> - True if completed, false otherwise
   */
  private async checkSurveyCompletion(accountId: number): Promise<boolean> {
    try {
      // Primary: Check if user has any survey response for an input survey (teacher module)
      const response = await this.prisma.surveyResponse.findFirst({
        where: {
          account_id: accountId,
          survey: {
            type: 'input',
            is_active: true,
          },
        },
      });

      if (response !== null) return true;

      // Fallback: Accept TOEIC intake/diagnostic completion as equivalent to survey.
      // A student who completed the TOEIC diagnostic test (current_score > 0)
      // has effectively completed their learning-needs survey.
      const student = await this.prisma.student.findUnique({
        where: { account_id: accountId },
        select: { student_id: true },
      });

      if (!student) return false;

      const toeicEnrollment = await this.prisma.certificateEnrollment.findFirst({
        where: {
          student_id: student.student_id,
          cert_type: 'toeic',
          current_score: { gt: 0 },
        },
      });

      return toeicEnrollment !== null;
    } catch (error) {
      this.logger.error(
        `Failed to check survey completion for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Check if user has completed goal input (set target score)
   * 
   * @param accountId - User account ID
   * @returns Promise<boolean> - True if completed, false otherwise
   */
  private async checkGoalInputCompletion(accountId: number): Promise<boolean> {
    try {
      // First, get student_id from account_id
      const student = await this.prisma.student.findUnique({
        where: { account_id: accountId },
        select: { student_id: true },
      });

      if (!student) {
        // Not a student - not eligible
        return false;
      }

      // Check if student has any certificate enrollment with target_score set
      const enrollment = await this.prisma.certificateEnrollment.findFirst({
        where: {
          student_id: student.student_id,
          target_score: {
            not: null,
          },
        },
      });

      return enrollment !== null;
    } catch (error) {
      this.logger.error(
        `Failed to check goal input completion for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Get cached eligibility status
   * 
   * @param accountId - User account ID
   * @returns Promise<EligibilityStatus | null> - Cached status or null if not found
   */
  private async getCachedEligibility(accountId: number): Promise<EligibilityStatus | null> {
    if (!this.redis.isReady()) {
      return null;
    }

    try {
      const key = REDIS_KEY_ELIGIBILITY(accountId);
      const cached = await this.redis.getJson<EligibilityStatus>(key);
      return cached;
    } catch (error) {
      this.logger.error(
        `Failed to get cached eligibility for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Cache eligibility status
   * 
   * @param accountId - User account ID
   * @param status - Eligibility status to cache
   * @returns Promise<void>
   */
  private async cacheEligibility(accountId: number, status: EligibilityStatus): Promise<void> {
    if (!this.redis.isReady()) {
      return;
    }

    try {
      const key = REDIS_KEY_ELIGIBILITY(accountId);
      await this.redis.setJson(key, status, TTL_ELIGIBILITY);
      this.logger.debug(`Cached eligibility for account ${accountId}: ${status.eligible}`);
    } catch (error) {
      this.logger.error(
        `Failed to cache eligibility for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
