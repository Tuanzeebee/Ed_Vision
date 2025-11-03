export interface StatisticsResponse {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalParents: number;
  activeUsers: number;
  totalCourses: number;
  totalClasses: number;
  averageAttendance: number;
  periodStart: string;
  periodEnd: string;
}

export interface UserGrowthData {
  date: string;
  totalUsers: number;
  newUsers: number;
}

export interface DepartmentStatistics {
  departmentId: number;
  departmentName: string;
  totalInstructors: number;
  totalStudents: number;
  totalClasses: number;
}

export interface StatisticsOverview {
  summary: StatisticsResponse;
  userGrowth: UserGrowthData[];
  departmentStats: DepartmentStatistics[];
}
