import apiClient from "./apiClient";

// ──────────────────────────────────────────────────────────────────────────────
// DTOs (mirror the backend)
// ──────────────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  accountId: number;
  username: string;
  avatarUrl?: string;
  gender?: string;
  score: number; // EXP for weekly, total_minutes for total
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  isOnline: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  metadata: {
    type: "weekly" | "total";
    weekStart?: string; // ISO date for weekly leaderboard
    weekEnd?: string; // ISO date for weekly leaderboard
    generatedAt: string; // ISO timestamp
  };
}

export interface PersonalStatsResponse {
  totals: {
    totalMinutes: number;
    totalSessions: number;
    totalExp: number;
  };
  streaks: {
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: string | null; // ISO date
  };
  rankings: {
    weeklyRank: number | null;
    weeklyExp: number;
    totalRank: number | null;
  };
  eligibility: {
    isEligible: boolean;
    hasSurveyCompleted: boolean;
    hasGoalInput: boolean;
  };
  recentSessions: Array<{
    sessionId: number;
    startedAt: string; // ISO timestamp
    endedAt: string; // ISO timestamp
    durationMinutes: number;
    expEarned: number;
  }>;
}

// ──────────────────────────────────────────────────────────────────────────────
// API calls
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get weekly leaderboard (based on EXP earned this week)
 * @param limit - Maximum number of entries to return (default: 10, max: 100)
 * @param offset - Offset for pagination (default: 0)
 */
export async function getWeeklyLeaderboard(
  limit = 10,
  offset = 0,
): Promise<LeaderboardResponse> {
  const res = await apiClient.get<LeaderboardResponse>(
    `/study-rooms/leaderboard/weekly?limit=${limit}&offset=${offset}`,
  );
  return res.data;
}

/**
 * Get total leaderboard (based on total study minutes)
 * @param limit - Maximum number of entries to return (default: 10, max: 100)
 * @param offset - Offset for pagination (default: 0)
 */
export async function getTotalLeaderboard(
  limit = 10,
  offset = 0,
): Promise<LeaderboardResponse> {
  const res = await apiClient.get<LeaderboardResponse>(
    `/study-rooms/leaderboard/total?limit=${limit}&offset=${offset}`,
  );
  return res.data;
}

/**
 * Get personal study statistics for the authenticated user
 */
export async function getPersonalStats(): Promise<PersonalStatsResponse> {
  const res = await apiClient.get<PersonalStatsResponse>(
    "/study-rooms/leaderboard/me/stats",
  );
  return res.data;
}
