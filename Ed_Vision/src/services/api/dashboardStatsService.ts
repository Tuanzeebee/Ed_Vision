import apiClient from './apiClient';

export interface DashboardStatsQuery {
  timeFilter?: 'hôm-nay' | 'tuần-này' | 'tháng-này' | 'tất-cả';
  school?: string;
  courseYear?: string;
  major?: string;
  class?: string;
  semester?: string;
  academicYear?: string;
  selectedYear?: string;
}

export interface ComparisonData {
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardStatsResponse {
  current: {
    students: number;
    instructors: number;
    atRisk: number;
    performance: number;
  };
  previous: {
    students: number;
    instructors: number;
  };
  comparison: {
    students: ComparisonData;
    instructors: ComparisonData;
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
    noon: number;
    afternoon: number;
    evening: number;
  };
  percentages: {
    morning: number;
    noon: number;
    afternoon: number;
    evening: number;
  };
  total: number;
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
}

export default new DashboardStatsService();
