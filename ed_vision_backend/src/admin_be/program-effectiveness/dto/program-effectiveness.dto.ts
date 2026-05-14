import { IsIn, IsOptional, IsString } from 'class-validator';

export type ProgramEffectivenessCertType = 'ielts' | 'toeic' | 'all';

export class ProgramEffectivenessQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['ielts', 'toeic', 'all'])
  certType?: ProgramEffectivenessCertType = 'all';
}

/**
 * Score comparison bar chart — average band-equivalent score per skill, before
 * and after the program. All values are normalised to the IELTS 0–9 scale so
 * the chart can share a single Y axis regardless of which certificate type
 * was selected.
 */
export interface ProgramEffectivenessScoreComparison {
  /** Localised skill labels (Listening / Reading / Writing / Speaking). */
  labels: string[];
  /** Average entry score per skill, 0–9 scale. */
  entry: number[];
  /** Average exit/most-recent score per skill, 0–9 scale. */
  exit: number[];
  /** Suggested upper bound for the Y axis (always 9 today). */
  scaleMax: number;
  /** Number of distinct students contributing to entry data. */
  entrySampleSize: number;
  /** Number of distinct students contributing to exit data. */
  exitSampleSize: number;
}

/**
 * Standards-achievement doughnut — overall % of students who reached their
 * configured target band, plus per-cert sub-breakdowns shown beneath the
 * doughnut.
 */
export interface ProgramEffectivenessAchievement {
  /** Overall % of students meeting their target_band (rounded). */
  successRate: number;
  /** Total students with a learning-progress record evaluated. */
  totalEvaluated: number;
  /** % of IELTS students with last_band_score ≥ 6.5. */
  ieltsAchievementRate: number;
  ieltsEvaluated: number;
  /** % of TOEIC students with last_total_score ≥ 750. */
  toeicAchievementRate: number;
  toeicEvaluated: number;
}

export type ProgramEffectivenessBadgeTone = 'success' | 'info' | 'warning';
export type ProgramEffectivenessIconKey = 'improvement' | 'attention';

export interface ProgramEffectivenessModuleImpact {
  id: string;
  programComponent: string;
  /** Localised module name shown in the list. */
  name: string;
  /** Short description summarising the headline metric. */
  description: string;
  /** Badge label, e.g. "Top 1", "Top 2", "Cần tối ưu". */
  badge: string;
  /** Visual tone the frontend uses to colour the badge & icon. */
  badgeTone: ProgramEffectivenessBadgeTone;
  /** Which icon family to render (improvement = up-trend, attention = alert). */
  iconKey: ProgramEffectivenessIconKey;
  improvement: number | null;
  dropoutRate: number | null;
  completionRate: number | null;
  totalStudents: number;
  effectivenessRank: number | null;
  needsAttention: boolean;
}

export type ProgramEffectivenessRatingTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger';

export interface ProgramEffectivenessGroup {
  id: string;
  cohortType: string;
  cohortId: string;
  /** Pretty Vietnamese label, e.g. "Năm 3 - Khoa CNTT". */
  cohortName: string;
  totalStudents: number;
  /** Average improvement in IELTS band, rounded to 1 decimal. */
  avgImprovement: number;
  /** % of students who reached the target band. */
  successRate: number;
  /** Localised rating label (Xuất sắc / Rất tốt / Tốt / Trung bình / Cần cải thiện). */
  rating: string;
  ratingTone: ProgramEffectivenessRatingTone;
}

export interface ProgramEffectivenessResponse {
  certType: ProgramEffectivenessCertType;
  scoreComparison: ProgramEffectivenessScoreComparison;
  achievement: ProgramEffectivenessAchievement;
  moduleImpact: ProgramEffectivenessModuleImpact[];
  groupEffectiveness: ProgramEffectivenessGroup[];
}
