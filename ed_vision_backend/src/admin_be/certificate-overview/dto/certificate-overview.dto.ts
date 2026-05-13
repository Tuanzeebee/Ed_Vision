import { IsIn, IsOptional, IsString } from 'class-validator';

export type CertificateOverviewTimeRange =
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'this-year';

export class CertificateOverviewQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['this-month', 'last-month', 'this-quarter', 'this-year'])
  timeRange?: CertificateOverviewTimeRange = 'this-month';
}

/** Trend direction for a KPI value. */
export type Trend = 'up' | 'down' | 'stable';

export interface KpiValue {
  /** Raw numeric value for the current window. */
  value: number;
  /** Percentage change vs the previous comparable window (integer). */
  change: number;
  /** Direction of change. */
  trend: Trend;
}

export interface CertificateOverviewKpis {
  totalStudents: KpiValue;
  activeStudents: KpiValue;
  /**
   * Percentage of active students who returned to the platform on at least 2
   * separate days inside the current window.
   */
  returnRate: KpiValue;
  /**
   * Percentage of certificate enrollments that have been completed (status
   * `completed` or `completed_at` set) inside the current window.
   */
  completionRate: KpiValue;
}

export interface CertificateOverviewTraffic {
  /** Day-of-week labels (T2..CN). */
  labels: string[];
  /** Distinct active accounts per weekday inside the current window. */
  values: number[];
}

export interface CertificateOverviewDistribution {
  /** Localized cert-type labels shown in the doughnut chart. */
  labels: string[];
  /** Count of active enrollments per cert-type bucket. */
  values: number[];
}

export interface CertificateOverviewRetention {
  /** Weekly bucket labels (Tuần 1..Tuần N). */
  labels: string[];
  /**
   * Students whose first-ever activity in the platform fell inside the given
   * week.
   */
  newStudents: number[];
  /**
   * Students who had activity in the given week AND in any prior week — i.e.
   * "quay lại" (returning) users.
   */
  returningStudents: number[];
}

export interface CertificateOverviewActivity {
  id: string;
  text: string;
  /** Pre-formatted Vietnamese relative-time label, e.g. "2 giờ trước". */
  time: string;
  /** Tailwind background color class used for the indicator dot. */
  color: string;
}

export interface CertificateOverviewResponse {
  timeRange: CertificateOverviewTimeRange;
  rangeStart: string;
  rangeEnd: string;
  previousRangeStart: string;
  previousRangeEnd: string;
  kpis: CertificateOverviewKpis;
  traffic: CertificateOverviewTraffic;
  distribution: CertificateOverviewDistribution;
  retention: CertificateOverviewRetention;
  recentActivities: CertificateOverviewActivity[];
}
