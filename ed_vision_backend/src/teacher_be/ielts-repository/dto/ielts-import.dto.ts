import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ─── Import (OCR / PDF upload) ────────────────────────────────────────────────

export class IeltsOcrImportDto {
  @IsString()
  repository_slug: string;

  @IsString()
  repository_title: string;

  @IsOptional()
  @IsString()
  repository_description?: string;

  /**
   * IELTS skill area to import.
   * listening | reading  (writing / speaking are not auto-importable from PDF)
   */
  @IsOptional()
  @IsString()
  skill_area?: string;

  /**
   * IELTS band context (optional metadata).
   * e.g. "5.0-6.5"
   */
  @IsOptional()
  @IsString()
  band_range?: string;

  /**
   * Whether to wipe existing items before re-importing (default true).
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return true;
  })
  replace_existing?: boolean;

  /**
   * Optional exam year / session tag, e.g. "2024-C1".
   */
  @IsOptional()
  @IsString()
  exam_year?: string;
}

export class IeltsOcrImportResponseDto {
  repository_id: number;
  slug: string;
  skill_area: string;
  imported_count: number;
  skipped_count: number;
  total_detected: number;
  source_filename: string;
}

// ─── Answer-key upload ────────────────────────────────────────────────────────

export class IeltsAnswerKeyImportDto {
  @IsString()
  repository_slug: string;
}

export class IeltsAnswerKeyImportResponseDto {
  repository_id: number;
  slug: string;
  updated_count: number;
  skipped_count: number;
  answer_key_complete: boolean;
}

// ─── Audio upload (Listening) ─────────────────────────────────────────────────

export class IeltsListeningAudioUploadDto {
  @IsString()
  repository_slug: string;

  /**
   * IELTS Listening section 1–4.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  section?: number;

  /**
   * Track number within the section (1-based).
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  track_number?: number;
}

export class IeltsListeningAudioUploadResponseDto {
  repository_id: number;
  slug: string;
  audio_url: string;
  filename: string;
  section: number;
  track_number: number;
  mapped_item_ids: number[];
}

// ─── Repository list / delete ─────────────────────────────────────────────────

export class IeltsRepositoryListItemDto {
  id: number;
  slug: string;
  title: string;
  skill_area: string;
  total_items: number;
  is_published: boolean;
  created_at: Date;
}

export class IeltsRepositoryDeleteResponseDto {
  slug: string;
  deleted: boolean;
  items_deleted: number;
}
