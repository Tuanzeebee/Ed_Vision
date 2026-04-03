import apiClient from './apiClient';

export interface DashboardStatsQuery {
  timeFilter?: 'hôm-nay'| 'tuần-này'| 'tháng-này'| 'tất-cả';
  school?: string;
  courseYear?: string;
  major?: string;
  class?: string;
  semester?: string;
  academicYear?: string;
  selectedYear?: string;
  // Optional anchorDate (YYYY-MM-DD) used for offset navigation
  anchorDate?: string;
}

export interface ComparisonData {
  value: number;
  percentage: number;
  trend: 'up'| 'down'| 'stable';
}

export interface DashboardStatsResponse {
  current: {
    students: number;
    instructors: number;
    atRisk: number;
    performance: {
      student: number;
      instructor: number;
    };
  };
  previous: {
    students: number;
    instructors: number;
  };
  comparison: {
    students: ComparisonData;
    instructors: ComparisonData;
    atRisk?: ComparisonData;
  };
  timeRange: string;
  filters: {
    school?: string;
    courseYear?: string;
    major?: string;
    class?: string;
  };
}

export interface AccessTimeStatsResponse {
  data: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  percentages: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  total: number;
}

// ===== MỚI THÊM: Interfaces cho GPA, Score Distribution, Top Students =====
export interface GPADistributionResponse {
  excellent: number;
  good: number;
  average: number;
}

export interface ScoreDistributionResponse {
  schools: Array<{
    schoolName: string;
    scores: number[];
  }>;
}

export interface TopStudentResponse {
  students: Array<{
    id: number;
    name: string;
    school: string;
    major: string;
    class: string;
    gpa: number;
    rank: number;
  }>;
}

export interface LearningStatsContext {
  currentLabel: string;
  previousLabel: string;
}

export interface LearningDashboardStatsResponse extends DashboardStatsResponse {
  learningContext?: LearningStatsContext;
}

export interface LearningDashboardSummaryResponse {
  current: {
    students: number;
    instructors: number;
    warning?: number;  // GPA 2.0 - 2.5 (nguy cơ)
    atRisk: number;    // GPA < 2.0 (buộc thôi học)
    performance: { student: number; instructor: number };
  };
  previous?: { students: number; warning?: number; atRisk: number };
  comparison?: { students?: ComparisonData | null; warning?: ComparisonData | null; atRisk?: ComparisonData | null };
  gpaDistribution: { excellent: number; veryGood: number; good: number; average: number; weak: number };
  scoreDistribution: { labels?: string[]; schools: Array<{ schoolName: string; scores: number[]; averageGpa?: number }>};
  topStudents: Array<{ id: number; name: string; school: string; major: string; class: string; gpa: number; gpaCategory: string; rank: number }>;
  filters: { school?: string; courseYear?: string; major?: string; class?: string; academicYear: string; semester: string };
  learningContext: { currentLabel: string; previousLabel?: string };
}

class DashboardStatsService {
  /**
   * Get filter options for dashboard
   */
  async getFilterOptions() {
    const response = await apiClient.get('/admin/dashboard/filters/options');
    return response.data;
  }

  /**
   * Get dashboard statistics with filters
   */
  async getDashboardStats(query?: DashboardStatsQuery): Promise<DashboardStatsResponse> {
    const response = await apiClient.get<DashboardStatsResponse>('/admin/dashboard/stats', {
      params: query,
    });
    return response.data;
  }

  /**
   * Get access time statistics
   */
  async getAccessTimeStats(query?: DashboardStatsQuery): Promise<AccessTimeStatsResponse> {
    const response = await apiClient.get<AccessTimeStatsResponse>('/admin/dashboard/access-time', {
      params: query,
    });
    return response.data;
  }

  // ===== MỚI THÊM: Get GPA distribution =====
  async getGPADistribution(query?: DashboardStatsQuery): Promise<GPADistributionResponse> {
    const response = await apiClient.get<GPADistributionResponse>('/admin/dashboard/gpa-distribution', {
      params: query,
    });
    return response.data;
  }

  // ===== MỚI THÊM: Get score distribution (0-10) =====
  async getScoreDistribution(query?: DashboardStatsQuery): Promise<ScoreDistributionResponse> {
    const response = await apiClient.get<ScoreDistributionResponse>('/admin/dashboard/score-distribution', {
      params: query,
    });
    return response.data;
  }

  // ===== MỚI THÊM: Get top students =====
  async getTopStudents(query?: DashboardStatsQuery): Promise<TopStudentResponse> {
    const response = await apiClient.get<TopStudentResponse>('/admin/dashboard/top-students', {
      params: query,
    });
    return response.data;
  }

  // ===== MỚI: Learning dashboard stats (semester + academicYear) =====
  async getLearningDashboardStats(query?: DashboardStatsQuery): Promise<LearningDashboardStatsResponse> {
    const response = await apiClient.get<LearningDashboardStatsResponse>('/admin/dashboard/learning-stats', {
      params: query,
    });
    return response.data;
  }

  // Consolidated learning summary endpoint (server-side aggregates)
  async getLearningDashboardSummary(query?: DashboardStatsQuery): Promise<LearningDashboardSummaryResponse> {
    const response = await apiClient.get<LearningDashboardSummaryResponse>('/admin/dashboard/learning-summary', {
      params: query,
    });
    return response.data;
  }
}

export default new DashboardStatsService();