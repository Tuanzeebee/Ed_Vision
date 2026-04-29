import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

// ============================================
// ENUMS
// ============================================

export enum SkillArea {
  READING = 'reading',
  LISTENING = 'listening',
  GRAMMAR = 'grammar',
  VOCABULARY = 'vocabulary',
  WRITING = 'writing',
  SPEAKING = 'speaking',
}

export enum LessonStatus {
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum SessionType {
  WARMUP = 'warmup',
  MINI_TEST = 'mini_test',
}

export enum BandChange {
  UP = 'UP',
  DOWN = 'DOWN',
  STABLE = 'STABLE',
}

export enum Recommendation {
  ADVANCE = 'advance',
  MAINTAIN = 'maintain',
  REVIEW = 'review',
  REMEDIAL = 'remedial',
}

// ============================================
// DTOs for Roadmap
// ============================================

export class CreateRoadmapDto {
  @IsInt()
  @IsNotEmpty()
  enrollment_id: number;

  @IsNumber()
  @Min(1.0)
  @Max(9.0)
  current_band: number;

  @IsNumber()
  @Min(1.0)
  @Max(9.0)
  target_band: number;
}

// DTO to update target band + target completion date and optionally regenerate roadmap
export class UpdateRoadmapTargetsDto {
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(9.0)
  target_band?: number;

  @IsOptional()
  @IsDateString()
  target_completion_date?: string; // ISO 8601 date string e.g. "2026-12-01"

  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(9.0)
  current_band?: number;
}

export class RoadmapResponseDto {
  id: number;

  enrollment_id: number;

  current_band: number;

  target_band: number;

  roadmap_version: number;

  difficulty_level: string;

  lesson_sequence: number[];

  current_lesson_index: number;

  status: string;

  lessons?: any[];
}

// ============================================
// DTOs for Lessons
// ============================================

export class LessonResponseDto {
  id: number;

  roadmap_id: number;

  skill_area: SkillArea;

  lesson_title: string;

  lesson_order: number;

  band_level: number;

  flashcard_repo_id?: number;

  practice_repo_id?: number;

  mini_test_repo_id?: number;

  estimated_minutes: number;

  status: LessonStatus;

  flashcardRepo?: any;

  practiceRepo?: any;

  miniTestRepo?: any;
}

export class UnlockLessonDto {
  @IsInt()
  lesson_id: number;
}

// ============================================
// DTOs for Practice Sessions
// ============================================

export class SubmitPracticeDto {
  @IsInt()
  lesson_id: number;

  @IsEnum(SessionType)
  session_type: SessionType;

  @IsInt()
  repository_id: number;

  @IsObject()
  answers: Record<string, string>;

  @IsOptional()
  @IsObject()
  time_per_question?: Record<string, number>;
}

export class PracticeSessionResponseDto {
  id: string;

  lesson_id: number;

  session_type: SessionType;

  repository_id: number;

  total_questions: number;

  correct_count: number;

  accuracy_percent: number;

  total_time_sec?: number;

  avg_time_per_q?: number;

  error_analysis?: any;

  detailed_results: any; // Question-by-question breakdown
}

// ============================================
// DTOs for Band Tests
// ============================================

export class CreateBandTestDto {
  @IsOptional()
  @IsInt()
  roadmap_id?: number;

  @IsArray()
  @IsEnum(SkillArea, { each: true })
  skills_to_test: SkillArea[];

  @IsOptional()
  @IsInt()
  // @Min(1)
  @Max(50)
  questions_per_skill?: number;
}

export class SubmitBandTestDto {
  @IsUUID()
  test_id: string;

  @IsObject()
  answers: Record<string, string>;

  @IsObject()
  time_per_question: Record<string, number>;
}

export class BandTestResponseDto {
  id: string;

  roadmap_id: number;

  test_name: string;

  band_level: number;

  skills_tested: string[];

  total_questions: number;

  correct_count: number;

  accuracy_percent: number;

  response_time_factor: number;

  consistency_score?: number;

  severe_error_count: number;

  suspicious_fast_answers: number;

  previous_band: number;

  estimated_band: number;

  band_change: BandChange;

  confidence_level: string;

  skill_breakdown: any;

  recommendation: Recommendation;

  weak_skills: string[];

  status: string;

  /** Đã áp dụng band mới vào lộ trình hay chưa */
  band_applied?: boolean;

  /** Cảnh báo hành vi bất thường (trả lời quá nhanh, v.v.) */
  warnings?: string[];

  /** Chi tiết kết quả từng câu hỏi */
  question_results?: {
    questionId: string;
    skill: string;
    isCorrect: boolean;
    studentAnswer: string;
    correctAnswer: string;
    timeTaken: number;
    expectedTime: number;
    /** Câu hỏi gốc (nếu được trả về) */
    questionText?: string;
  }[];
}

// ============================================
// DTOs for Skill Progress
// ============================================

export class SkillProgressResponseDto {
  id: number;

  enrollment_id: number;

  skill_area: SkillArea;

  current_band: number;

  lessons_completed: number;

  total_practice: number;

  accuracy_rate: number;

  recent_sessions?: any[];

  weak_topics: string[];

  last_practiced_at?: Date;
}
