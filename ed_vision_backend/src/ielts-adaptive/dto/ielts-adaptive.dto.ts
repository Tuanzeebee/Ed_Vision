import { Type, Transform } from 'class-transformer';
import {
  Allow,
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
  FLASHCARD = 'flashcard',
  PRACTICE_SET = 'practice_set',
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

export enum WritingTaskType {
  TASK1 = 'task1',
  TASK2 = 'task2',
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

  @IsOptional()
  @IsDateString()
  target_completion_date?: string;
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

export class AnswerItemDto {
  @IsString()
  question_id: string;

  @Allow()
  answer: any;

  @IsOptional()
  @IsNumber()
  time_taken_sec?: number;
}

export class SubmitPracticeDto {
  @IsInt()
  lesson_id: number;

  @IsEnum(SessionType)
  session_type: SessionType;

  @IsInt()
  repository_id: number;

  /**
   * Accepts EITHER:
   *   - Array format (new): { question_id, answer, time_taken_sec }[]
   *   - Object format (legacy): Record<itemId, answerString>
   */
  @Allow()
  answers: AnswerItemDto[] | Record<string, string>;

  @IsOptional()
  @IsObject()
  time_per_question?: Record<string, number>;

  @IsOptional()
  @IsNumber()
  total_time_sec?: number;
}

export class PracticeSessionResponseDto {
  id: string;

  lesson_id: number;

  session_type: SessionType;

  repository_id: number;

  total_questions: number;

  correct_count: number;

  accuracy_percent: number;

  passed: boolean;

  total_time_sec?: number;

  avg_time_per_q?: number;

  error_analysis?: any;

  /** Per-question feedback */
  feedback: {
    question_id: string;
    is_correct: boolean;
    correct_answer: string;
    explanation?: string;
    time_taken_sec?: number;
  }[];

  detailed_results: any;

  /** Lesson/progression info after submit */
  next?: {
    unlocked_lesson_id?: number;
    lesson_completed: boolean;
    roadmap_progress_percent?: number;
  };
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

// ============================================
// DTOs for AI Grading (Speaking / Writing)
// ============================================

export class GradeSpeakingDto {
  @IsString()
  @IsNotEmpty()
  transcript: string;

  @IsString()
  @IsNotEmpty()
  item_prompt: string;

  @IsNumber()
  @Min(0)
  @Max(9)
  target_band: number;

  @IsOptional()
  @IsString()
  part_type?: 'part1' | 'part2' | 'part3';

  @IsOptional()
  @IsInt()
  lesson_id?: number;
}

export class GradeWritingDto {
  @IsString()
  @IsNotEmpty()
  essay: string;

  @IsString()
  @IsNotEmpty()
  task_prompt: string;

  @IsOptional()
  @IsEnum(WritingTaskType)
  task_type?: 'task1' | 'task2';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9)
  target_band?: number;

  @IsOptional()
  @IsInt()
  word_count?: number;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : value))
  @IsString()
  lesson_id?: string;

  @IsOptional()
  @IsString()
  lesson_level?: string;
}

export class IeltsCriterionDto {
  name: string;
  score: number;
  feedback: string;
}

export class CorrectedExampleDto {
  original: string;
  suggestion: string;
  explanation: string;
}

export class IeltsGradingResultDto {
  skill: 'speaking' | 'writing';
  bandScore: number;
  criteria: IeltsCriterionDto[];
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  correctedExamples?: CorrectedExampleDto[];
  estimatedCefrLevel: string;
  confidence: 'low' | 'medium' | 'high';
}

export class IeltsChatMessageDto {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class IeltsChatGroqDto {
  @IsEnum(SkillArea)
  @IsNotEmpty()
  skill: SkillArea;

  @IsString()
  @IsNotEmpty()
  context_text: string;

  @IsString()
  @IsNotEmpty()
  user_message: string;

  @IsOptional()
  @IsArray()
  @Type(() => IeltsChatMessageDto)
  chat_history?: IeltsChatMessageDto[];

  @IsOptional()
  @IsNumber()
  band_target?: number;
}
