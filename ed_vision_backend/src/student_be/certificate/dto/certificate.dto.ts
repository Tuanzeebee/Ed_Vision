import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const CERT_TYPES = [
  'ielts',
  'toeic',
  'mos-word',
  'mos-excel',
  'mos-powerpoint',
] as const;
const ALL_BANDS = [
  '4.0',
  '5.0',
  '6.0',
  '6.5',
  '7.0',
  '7.5+', // IELTS
  '350-495',
  '500-599',
  '600-699',
  '700-799',
  '800+', // TOEIC
  'associate',
  'expert', // MOS
] as const;

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(CERT_TYPES)
  cert_type!: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(990)
  target_score?: number;
}

export class CompleteTopicDto {
  @IsString()
  @IsNotEmpty()
  topic_key!: string; // e.g. 'grammar.basic_tenses'
}

export class EnrollmentResponseDto {
  id!: number;
  cert_type!: string;
  status!: 'active' | 'completed';
  learning_status!: 'not_started' | 'in_progress' | 'completed';
  progress_percent!: number;
  current_score?: number | null;
  target_score?: number | null;
  enrolled_at!: Date;
  completed_at?: Date | null;
  completed_topics!: string[]; // array of topic_key strings
  total_topics?: number;
}

export class ToeicPlanSyncDto {
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(990)
  current_score?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(990)
  target_score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  total_boost?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  listening_sessions?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  reading_sessions?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foundation_completed?: string[];

  @IsOptional()
  @IsBoolean()
  foundation_skipped?: boolean;

  @IsOptional()
  @IsBoolean()
  first_guide_shown?: boolean;

  @IsOptional()
  @IsBoolean()
  has_activity?: boolean;
}

export class ToeicPlanSyncResponseDto {
  current_score!: number;
  target_score!: number;
  total_boost!: number;
  listening_sessions!: number;
  reading_sessions!: number;
  foundation_completed!: string[];
  foundation_skipped!: boolean;
  first_guide_shown!: boolean;
}

export class ToeicLeaderboardEntryDto {
  account_id!: number;
  name!: string;
  score!: number;
  streak!: number;
  isCurrentUser!: boolean;
}

export class ToeicRepositoryOverviewItemDto {
  repository_id!: number;
  slug!: string;
  topic_key!: string;
  title!: string;
  description?: string | null;
  skill_area!: string;
  milestone_score!: number;
  unlock_score!: number;
  question_count!: number;
  estimated_minutes!: number;
  is_unlocked!: boolean;
}

export class ToeicRepositoryOverviewResponseDto {
  current_score!: number;
  target_score!: number;
  projected_score!: number;
  items!: ToeicRepositoryOverviewItemDto[];
}

export class ToeicRepositoryOptionDto {
  id!: number;
  option_key!: string;
  option_text!: string;
  is_correct!: boolean;
  rationale?: string | null;
  sort_order!: number;
}

export class ToeicRepositoryItemDto {
  id!: number;
  item_order!: number;
  item_type!: string;
  title?: string | null;
  stem!: string;
  reading_passage?: string | null;
  media_audio_url?: string | null;
  explanation?: string | null;
  estimated_seconds?: number | null;
  score_weight!: number;
  options!: ToeicRepositoryOptionDto[];
}

export class ToeicRepositoryDetailResponseDto {
  repository_id!: number;
  slug!: string;
  title!: string;
  description?: string | null;
  skill_area?: string | null;
  milestone_score!: number;
  estimated_minutes!: number;
  pass_score!: number;
  total_items!: number;
  items!: ToeicRepositoryItemDto[];
}

export class ToeicRepositorySubmitAnswerDto {
  @IsInt()
  @Min(1)
  item_id!: number;

  @IsInt()
  @Min(1)
  option_id!: number;
}

export class ToeicRepositorySubmitDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToeicRepositorySubmitAnswerDto)
  answers!: ToeicRepositorySubmitAnswerDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7200)
  elapsed_seconds?: number;
}

export class ToeicRepositorySubmitResponseDto {
  repository_id!: number;
  slug!: string;
  skill_area?: string | null;
  correct_count!: number;
  total_count!: number;
  pass_score!: number;
  is_passed!: boolean;
  gained_score!: number;
  projected_score!: number;
  updated_plan!: ToeicPlanSyncResponseDto;
}

export class ToeicReadingImportDto {
  @IsOptional()
  @IsString()
  repository_slug?: string;

  @IsOptional()
  @IsString()
  repository_title?: string;

  @IsOptional()
  @IsString()
  repository_description?: string;

  @IsOptional()
  @IsString()
  required_section_keywords?: string;

  @IsOptional()
  @IsString()
  excluded_section_keywords?: string;

  @IsOptional()
  @IsBoolean()
  strict_section_filter?: boolean;

  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(990)
  milestone_score?: number;

  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(990)
  unlock_score?: number;
}

export class ToeicReadingImportResponseDto {
  repository_id!: number;
  slug!: string;
  imported_count!: number;
  skipped_count!: number;
  total_rows!: number;
}

export class ToeicManualListeningCreateDto {
  @IsOptional()
  @IsString()
  repository_slug?: string;

  @IsOptional()
  @IsString()
  repository_title?: string;

  @IsOptional()
  @IsString()
  repository_description?: string;

  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(990)
  milestone_score?: number;

  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(990)
  unlock_score?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  item_order?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  stem!: string;

  @IsOptional()
  @IsString()
  reading_passage?: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(600)
  estimated_seconds?: number;

  @IsOptional()
  @IsString()
  options_json?: string;

  @IsOptional()
  @IsString()
  option_a?: string;

  @IsOptional()
  @IsString()
  option_b?: string;

  @IsOptional()
  @IsString()
  option_c?: string;

  @IsOptional()
  @IsString()
  option_d?: string;

  @IsOptional()
  @IsString()
  correct_option_key?: string;
}

export class ToeicManualListeningCreateResponseDto {
  repository_id!: number;
  slug!: string;
  item_id!: number;
  item_order!: number;
  media_audio_url?: string | null;
  media_image_url?: string | null;
}

export class ToeicExplainAnswerDto {
  @IsInt()
  @Min(1)
  item_id!: number;

  @IsInt()
  @Min(1)
  selected_option_id!: number;
}

export class ToeicExplainAnswerResponseDto {
  item_id!: number;
  selected_option_id!: number;
  correct_option_id!: number;
  is_correct!: boolean;
  /** null khi user chọn sai – frontend ẩn phần giải thích */
  explanation!: string | null;
  model!: string;
  source!: 'cache' | 'ollama' | 'fallback' | 'skipped';
}

export class CertificateTutorAskDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(CERT_TYPES)
  cert_type!: string;

  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsOptional()
  @IsString()
  topic_key?: string;

  @IsOptional()
  @IsString()
  learning_context?: string;

  @IsOptional()
  @IsBoolean()
  concise?: boolean;
}

export class CertificateTutorAskResponseDto {
  cert_type!: string;
  answer!: string;
  model!: string;
  source!: 'cache' | 'ollama' | 'fallback';
}
