import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';

export class DashboardStatsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['hôm-nay', 'tuần-này', 'tháng-này', 'năm-này', 'tất-cả'])
  timeFilter?: string = 'tháng-này';

  @IsOptional()
  @IsString()
  school?: string; // Department name

  @IsOptional()
  @IsString()
  courseYear?: string; // e.g., "K30"

  @IsOptional()
  @IsString()
  major?: string; // Program name

  @IsOptional()
  @IsString()
  class?: string; // ClassGroup code

  @IsOptional()
  @IsString()
  semester?: string; // Kỳ 1, Kỳ 2, Kỳ Hè

  @IsOptional()
  @IsString()
  academicYear?: string; // e.g., "2024-2025"

  @IsOptional()
  @IsString()
  selectedYear?: string; // Year from TimeFilter

  @IsOptional()
  @IsString()
  // Optional anchor date used for offset navigation (format: YYYY-MM-DD)
  anchorDate?: string;

  @IsOptional()
  @IsNumberString()
  // Optional sinceYear used when requesting 'tất-cả' across multiple years (format: YYYY)
  sinceYear?: string;
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
    students: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    instructors: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
    atRisk?: { value: number; percentage: number; trend: 'up' | 'down' | 'stable' };
  };
  timeRange: string;
  filters: {
    school?: string;
    courseYear?: string;
    major?: string;
    class?: string;
    semester?: string;        // thêm
    academicYear?: string;
  };
}

export interface AccessTimeStatsResponse {
  data: {
    morning: number;    // 4:30 - 13:00
    afternoon: number;  // 13:00 - 18:00
    evening: number;    // 18:00 - 4:30
  };
  percentages: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  total: number;
}

// ===== MỚI THÊM: Response types cho GPA, Score Distribution, Top Students =====

export interface GPADistributionResponse {
  excellent: number;  // Xuất sắc/Giỏi (GPA >= 8.0) - phần trăm
  good: number;       // Khá/Tốt (GPA 6.5-7.99) - phần trăm
  average: number;    // Trung bình/Yếu (GPA < 6.5) - phần trăm
}

export interface ScoreDistributionResponse {
  labels?: string[];  // Labels cho các mốc GPA: ['0', '0.5', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0']
  schools: Array<{
    schoolName: string;
    scores: number[];  // Array 9 phần tử cho các mốc GPA 0-4 (bước 0.5) - số lượng sinh viên
    averageGpa?: number;  // GPA trung bình của trường
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
  previousLabel?: string;
}

export interface LearningDashboardStatsResponse {
  current: {
    students: number;
    instructors: number;
    warning?: number;  // GPA 2.0 - 2.5 (nguy cơ)
    atRisk: number;    // GPA < 2.0 (buộc thôi học)
    performance: {
      student: number;
      instructor: number;
    };
  };
  previous?: {
    students: number;
    warning?: number;
    atRisk?: number;
    instructors?: number;
  };
  comparison?: {
    students?: ComparisonData | null;
    instructors?: ComparisonData | null;
    warning?: ComparisonData | null;
    atRisk?: ComparisonData | null;
  };
  gpaDistribution?: {
    excellent: number;
    veryGood: number;
    good: number;
    average: number;
    weak: number;
  };
  scoreDistribution?: ScoreDistributionResponse;
  topStudents?: Array<{
    id: number;
    name: string;
    school: string;
    major: string;
    class: string;
    gpa: number;
    gpaCategory?: string;
    rank: number;
  }>;
  filters?: {
    school?: string;
    courseYear?: string;
    major?: string;
    class?: string;
    academicYear?: string;
    semester?: string;
  };
  learningContext?: LearningStatsContext;
  timeRange?: string;
}