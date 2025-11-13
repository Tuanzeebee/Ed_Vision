import { IsOptional, IsString, IsIn } from 'class-validator';

export class DashboardStatsQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['hôm-nay', 'tuần-này', 'tháng-này', 'tất-cả'])
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
    morning: number;    // 4:30 - 10:00
    noon: number;       // 10:00 - 13:00
    afternoon: number;  // 13:00 - 18:00
    evening: number;    // 18:00 - 23:00 + 0:00 - 4:30
  };
  percentages: {
    morning: number;
    noon: number;
    afternoon: number;
    evening: number;
  };
  total: number;
}
