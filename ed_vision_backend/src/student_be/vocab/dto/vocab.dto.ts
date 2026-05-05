import { IsArray, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

// ── Student DTOs ─────────────────────────────────────────────────────────────

export class ToggleKnownDto {
  /** true = mark known, false = mark unknown */
  @IsIn([true, false])
  is_known: boolean;
}

export class StartTestSessionDto {
  @IsIn(['flashcard', 'write'])
  mode: 'flashcard' | 'write';

  /** Giới hạn số từ trong phiên test (mặc định 20) */
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  /** Lọc theo topic (optional) */
  @IsOptional()
  @IsInt()
  topic_id?: number;
}

export class SubmitAnswerDto {
  @IsInt()
  word_id: number;

  /** Chỉ cần với mode=write; null/undefined với mode=flashcard */
  @IsOptional()
  @IsString()
  user_input?: string;

  /** Với mode=flashcard, frontend tự đánh giá (user chọn đúng/sai) */
  @IsOptional()
  is_correct?: boolean;
}

// ── Teacher DTOs ──────────────────────────────────────────────────────────────

export class CreateTopicDto {
  @IsString()
  title_vi: string;

  @IsString()
  title_en: string;

  @IsString()
  emoji: string;

  @IsOptional()
  @IsString()
  cert_type?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class VocabImportDto {
  /** Topic ID đích; nếu để trống, AI tự phát hiện */
  @IsOptional()
  @IsInt()
  topic_id?: number;

  @IsOptional()
  @IsString()
  cert_type?: string;
}

export class ConfirmImportDto {
  /** Danh sách từ vựng đã preview, giảng viên xác nhận lưu */
  @IsArray()
  words: Array<{
    word: string;
    topic_id?: number;      // optional — nếu có dùng luôn
    topic_slug?: string;    // fallback — tự upsert topic từ predefined list
    level: string;
    freq: number;
    definitions: Array<{
      pos: string;
      meaning: string;
      example_en: string;
      example_vi: string;
    }>;
  }>;
}
