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
    type: 'weekly' | 'total';
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
