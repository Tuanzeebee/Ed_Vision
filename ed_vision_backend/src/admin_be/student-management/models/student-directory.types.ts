// Student Directory Overview Dashboard Types

export interface StudentDirectoryItem {
  studentId: number;
  accountId: number;
  studentCode: string;
  fullName: string;
  email: string;
  avatarUrl?: string;

  // Enrollment info
  certType: 'ielts' | 'toeic' | null;
  certificateName?: string; // e.g., "IELTS 7.5+", "TOEIC 850"

  // Progress
  progressPercent: number; // 0-100
  examCount: number; // Số bài thi đã làm
  practiceCount: number; // Số lượt luyện tập
  vocabCount: number; // Số từ vựng đã biết

  // Scores
  initialScore?: string; // e.g., "5.5", "450"
  currentScore?: string; // e.g., "6.5", "790"
  improvementPercent?: number;

  // Status
  learningStatus: 'active' | 'inactive' | 'completed' | 'on_hold';
  riskLevel: 'high' | 'medium' | 'low';

  // Department info
  department?: string;
  cohortYear?: number;

  // Last activity
  lastActivityAt?: string;
}

export interface StudentDirectoryResponse {
  data: StudentDirectoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface StudentDirectoryStats {
  // Card 1: Total students
  totalStudents: number;
  totalChangePercent: number; // Change from last month

  // Card 2: IELTS / TOEIC breakdown
  ieltsCount: number;
  toeicCount: number;

  // Card 3: Active students
  activeStudents: number;
  activePercent: number; // % of total

  // Card 4: At risk
  atRiskCount: number;
  atRiskHighCount: number;
}

export interface StudentDetailResponse extends StudentDirectoryItem {
  // Profile details
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  nationality?: string;

  // Academic info
  major?: string;
  classCode?: string;
  programName?: string;

  // Learning progress details
  skillProgress: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };

  // Test history
  testResults: StudentTestResultItem[];

  // Chart-ready score history, ordered from oldest to newest
  scoreHistory: StudentScoreHistoryItem[];

  // Recent activity
  recentActivities: StudentActivityItem[];

  // Learning activity summary
  studyStats: StudentStudyStats;

  // Risk factors
  riskFactors?: string[];
  projectedCompletionDate?: string;
}

export interface StudentTestResultItem {
  id: number;
  testType: 'diagnostic' | 'placement' | 'mock' | 'official';
  testPhase: 'entry' | 'midterm' | 'final';
  certType: 'ielts' | 'toeic';
  totalScore?: number;
  bandScore?: number;
  listeningScore?: number;
  readingScore?: number;
  writingScore?: number;
  speakingScore?: number;
  completedAt: string;
  durationMinutes?: number;
}

export interface StudentActivityItem {
  id: number;
  actionType: string;
  feature: string;
  pagePath?: string;
  createdAt: string;
}

export interface StudentScoreHistoryItem {
  id: number;
  label: string;
  score: number;
  certType: 'ielts' | 'toeic';
  testType: string;
  testPhase: string;
  completedAt: string;
}

export interface StudentStudyStats {
  averageDailyMinutes: number;
  totalSessions: number;
  totalPageViews: number;
  activeDays: number;
  lastActivityAt?: string;
}
