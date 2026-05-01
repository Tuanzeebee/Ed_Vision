/**
 * Leaderboard System Constants
 * 
 * Redis keys, TTLs, and configuration for the leaderboard system
 */

// ===== REDIS KEY PATTERNS =====

/**
 * Weekly EXP tracking key pattern
 * Format: weekly:exp:{account_id}:{week_start_iso}
 * Example: weekly:exp:123:2024-01-15
 * TTL: 8 days (1 week + 1 day buffer)
 */
export const REDIS_KEY_WEEKLY_EXP = (accountId: number, weekStart: string) =>
  `weekly:exp:${accountId}:${weekStart}`;

/**
 * Weekly leaderboard cache key pattern
 * Format: leaderboard:weekly:{week_start_iso}
 * Example: leaderboard:weekly:2024-01-15
 * TTL: 5 minutes
 */
export const REDIS_KEY_WEEKLY_LEADERBOARD = (weekStart: string) =>
  `leaderboard:weekly:v3:${weekStart}`;

/**
 * Total leaderboard cache key
 * Format: leaderboard:total
 * TTL: 10 minutes
 */
export const REDIS_KEY_TOTAL_LEADERBOARD = 'leaderboard:total:v3';

/**
 * Online users set key
 * Format: online:users
 * No TTL (managed by presence system)
 */
export const REDIS_KEY_ONLINE_USERS = 'online:users';

/**
 * User eligibility cache key pattern
 * Format: eligibility:{account_id}
 * Example: eligibility:123
 * TTL: 1 hour
 */
export const REDIS_KEY_ELIGIBILITY = (accountId: number) =>
  `eligibility:${accountId}`;

// ===== TTL VALUES (in seconds) =====

/**
 * TTL for weekly EXP data: 8 days (1 week + 1 day buffer)
 */
export const TTL_WEEKLY_EXP = 8 * 24 * 60 * 60; // 691200 seconds

/**
 * TTL for weekly leaderboard cache: 5 minutes
 */
export const TTL_WEEKLY_LEADERBOARD = 5 * 60; // 300 seconds

/**
 * TTL for total leaderboard cache: 10 minutes
 */
export const TTL_TOTAL_LEADERBOARD = 10 * 60; // 600 seconds

/**
 * TTL for eligibility cache: 1 hour
 */
export const TTL_ELIGIBILITY = 60 * 60; // 3600 seconds

// ===== EXP CALCULATION =====

/**
 * @deprecated EXP is no longer calculated based on study time.
 * EXP is now awarded based on practice question performance.
 * See QuestionExpCalculatorService for the new EXP logic.
 */
export const EXP_PER_MINUTE = 1;

/**
 * @deprecated No longer used. EXP is now question-based, not time-based.
 * See QuestionExpCalculatorService for the new EXP logic.
 */
export const MIN_SESSION_DURATION_MINUTES = 1;

// ===== WEEK DEFINITION =====

/**
 * Day of week that starts a new week (0 = Sunday, 1 = Monday, etc.)
 * Monday = 1
 */
export const WEEK_START_DAY = 1; // Monday

/**
 * Get the start of the week (Monday at 00:00:00) for a given date
 * @param date The date to get the week start for
 * @returns ISO date string (YYYY-MM-DD) of the Monday that starts the week
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days; otherwise go to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

/**
 * Get the end of the week (Sunday at 23:59:59) for a given date
 * @param date The date to get the week end for
 * @returns ISO date string (YYYY-MM-DD) of the Sunday that ends the week
 */
export function getWeekEnd(date: Date = new Date()): string {
  const weekStart = getWeekStart(date);
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6); // Add 6 days to get to Sunday
  return d.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

// ===== PAGINATION =====

/**
 * Default limit for leaderboard queries
 */
export const DEFAULT_LEADERBOARD_LIMIT = 10;

/**
 * Maximum limit for leaderboard queries
 */
export const MAX_LEADERBOARD_LIMIT = 100;

/**
 * Default offset for leaderboard queries
 */
export const DEFAULT_LEADERBOARD_OFFSET = 0;

// ===== PERFORMANCE TARGETS =====

/**
 * Target response time for leaderboard endpoints (in milliseconds)
 */
export const TARGET_LEADERBOARD_RESPONSE_TIME_MS = 200;

/**
 * Target response time for personal stats endpoint (in milliseconds)
 */
export const TARGET_STATS_RESPONSE_TIME_MS = 100;

/**
 * Target time to complete all updates after session completion (in milliseconds)
 */
export const TARGET_SESSION_COMPLETION_TIME_MS = 1000;
