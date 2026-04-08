export interface AtRiskStudent {
  id: string;
  studentCode: string;
  name: string;
  class: string;
  department: string;
  course: string;
  gpa: number;
  progress: number;
  absences: number;
  riskLevel: 'Nguy cơ cao' | 'Nguy cơ trung bình' | 'Cần theo dõi';
  processGrade?: number;
  midtermGrade?: number;
  subject?: string;
}

export interface AtRiskReportResponse {
  students: AtRiskStudent[];
  total: number;
  summary: {
    highRisk: number;
    mediumRisk: number;
    monitor: number;
  };
  trendChart: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }>;
  };
  distributionChart: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
}

export interface PerformanceReportResponse {
  summary: {
    totalStudents: number;
    averageGPA: number;
    passRate: number;
    excellentRate: number;
  };
  gradeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  topPerformers: Array<{
    studentCode: string;
    name: string;
    gpa: number;
    class: string;
  }>;
}
