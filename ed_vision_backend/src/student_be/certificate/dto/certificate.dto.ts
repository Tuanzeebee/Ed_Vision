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
  exam_score?: number | null;
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
  option_audio_url?: string | null;
  sort_order!: number;
}

export class ToeicRepositoryItemDto {
  id!: number;
  item_order!: number;
  part?: number | null;
  item_type!: string;
  title?: string | null;
  stem!: string;
  reading_passage?: string | null;
  media_audio_url?: string | null;
  media_image_url?: string | null;
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
  answer_key_configured_items!: number;
  answer_key_missing_items!: number;
  answer_key_ready!: boolean;
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
  exam_score!: number; // raw scaled score from this exam attempt
  can_change_target!: boolean; // true when exam_score >= target_score
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

export class ToeicOcrImportDto {
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
  @IsIn(['listening', 'reading'])
  skill_area?: 'listening' | 'reading';

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  replace_existing?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(300)
  @Max(990)
  milestone_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(300)
  @Max(990)
  unlock_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  exam_year?: number;
}

export class ToeicOcrImportResponseDto {
  repository_id!: number;
  slug!: string;
  skill_area!: 'listening' | 'reading';
  imported_count!: number;
  skipped_count!: number;
  total_detected!: number;
  source_filename!: string;
}

export class ToeicAnswerKeyImportDto {
  @IsString()
  @IsNotEmpty()
  repository_slug!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  clear_existing?: boolean;
}

export class ToeicAnswerKeyImportResponseDto {
  repository_id!: number;
  slug!: string;
  skill_area!: 'listening' | 'reading';
  source_filename!: string;
  total_answers_detected!: number;
  applied_items!: number;
  unanswered_items!: number;
  unknown_question_numbers!: number[];
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

export class ToeicRepositoryPregenerateExplanationsDto {
  @IsOptional()
  @IsBoolean()
  force_regenerate?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  batch_size?: number;
}

export class ToeicRepositoryPregenerateExplanationsResponseDto {
  repository_id!: number;
  slug!: string;
  model!: string;
  total_items!: number;
  queued_items!: number;
  generated_count!: number;
  skipped_count!: number;
  failed_count!: number;
  sample_failed_item_ids!: number[];
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

export class ToeicListeningImportDto {
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
  @Type(() => Boolean)
  @IsBoolean()
  replace_existing?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(300)
  @Max(990)
  milestone_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(300)
  @Max(990)
  unlock_score?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  exam_year?: number;
}

export class ToeicListeningImageAssetDto {
  filename!: string;
  url!: string;
  page!: number;
  part_hint!: number;
  width!: number;
  height!: number;
  size_bytes!: number;
}

export class ToeicListeningImportResponseDto {
  repository_id!: number;
  slug!: string;
  skill_area!: 'listening';
  imported_count!: number;
  skipped_count!: number;
  total_detected!: number;
  source_filename!: string;
  image_assets!: ToeicListeningImageAssetDto[];
  image_extract_error?: string;
}

export class ToeicListeningAudioUploadDto {
  @IsString()
  @IsNotEmpty()
  repository_slug!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  part?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  track_number?: number;
}

export class ToeicListeningAudioUploadResponseDto {
  repository_id!: number;
  slug!: string;
  audio_url!: string;
  filename!: string;
  part?: number;
  track_number?: number;
  mapped_item_ids!: number[];
}

export class ToeicAudioChunkDto {
  filename!: string;
  url!: string;
  part!: number;
  question_number!: number;
  type!: 'question' | 'talk';
  duration_seconds!: number;
  transcript_hint?: string;
}

export class ToeicAudioChunkRequestDto {
  @IsString()
  @IsNotEmpty()
  repository_slug!: string;

  @IsOptional()
  @IsIn(['whisper', 'silence', 'both'])
  method?: 'whisper' | 'silence' | 'both';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  auto_map?: boolean;
}

export class ToeicAudioChunkResponseDto {
  repository_id!: number;
  slug!: string;
  method_used!: string;
  total_chunks!: number;
  chunks!: ToeicAudioChunkDto[];
  auto_mapped_count!: number;
}

export class ToeicRepositoryListItemDto {
  id!: number;
  slug!: string;
  title!: string;
  skill_area!: string;
  total_items!: number;
  is_published!: boolean;
  created_at!: Date;
}

export class ToeicRepositoryDeleteResponseDto {
  slug!: string;
  deleted!: boolean;
  items_deleted!: number;
}

export class ToeicChatGroqMessageDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class ToeicChatGroqDto {
  @IsInt()
  @Min(1)
  question_id!: number;

  @IsString()
  @IsNotEmpty()
  user_message!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToeicChatGroqMessageDto)
  chat_history?: ToeicChatGroqMessageDto[];
}
