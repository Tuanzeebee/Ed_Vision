import { IsIn, IsOptional, IsString } from 'class-validator';

export type UsageTimeRange = '7d' | '30d' | '90d';

export class UsageBehaviorQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['7d', '30d', '90d'])
  timeRange?: UsageTimeRange = '7d';
}

export interface HeatmapResponse {
  /** Time-of-day bucket labels shown to the user. */
  hours: string[];
  /** Day-of-week labels (Mon..Sun). */
  days: string[];
  /** Raw counts per bucket: matrix[hourBucketIndex][dayIndex]. */
  matrix: number[][];
  /**
   * Normalized intensity per bucket (0..4) — directly maps to one of the
   * Tailwind shades used by the UI (bg-blue-50 / 100 / 200 / 400 / 600).
   */
  intensity: number[][];
}

export interface DurationResponse {
  /** Day-of-week labels (Mon..Sun). */
  labels: string[];
  /** Average study session duration in minutes per weekday. */
  values: number[];
}

export interface FeatureUsageItem {
  id: string;
  name: string;
  /** Total events / sessions counted for the feature in the time window. */
  count: number;
  /** Share of overall feature usage in percent (0..100, integer). */
  percent: number;
}

export interface FeatureUsageResponse {
  items: FeatureUsageItem[];
  total: number;
}

export interface UsageBehaviorResponse {
  timeRange: UsageTimeRange;
  rangeStart: string;
  rangeEnd: string;
  heatmap: HeatmapResponse;
  duration: DurationResponse;
  featureUsage: FeatureUsageResponse;
}
