// ============================================
// ENUMS
// ============================================

export const SkillArea = {
  READING: 'reading',
  LISTENING: 'listening',
  GRAMMAR: 'grammar',
  VOCABULARY: 'vocabulary',
  WRITING: 'writing',
  SPEAKING: 'speaking',
} as const;
export type SkillArea = typeof SkillArea[keyof typeof SkillArea];

export const LessonStatus = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;
export type LessonStatus = typeof LessonStatus[keyof typeof LessonStatus];

export const SessionType = {
  WARMUP: 'warmup',
  MINI_TEST: 'mini_test',
} as const;
export type SessionType = typeof SessionType[keyof typeof SessionType];

export const BandChange = {
  UP: 'UP',
  DOWN: 'DOWN',
  STABLE: 'STABLE',
} as const;
export type BandChange = typeof BandChange[keyof typeof BandChange];

export const Recommendation = {
  ADVANCE: 'advance',
  MAINTAIN: 'maintain',
  REMEDIAL: 'remedial',
} as const;
export type Recommendation = typeof Recommendation[keyof typeof Recommendation];

// ============================================
// INTERFACES
// ============================================

export interface Roadmap {
  id: number;
  enrollment_id: number;
  current_band: number;
  target_band: number;
  target_completion_date?: string | null;
  roadmap_version: number;
  difficulty_level: string;
  lesson_sequence: number[];
  current_lesson_index: number;
  status: string;
  lessons?: Lesson[];
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  roadmap_id: number;
  skill_area: SkillArea;
  lesson_title: string;
  lesson_order: number;
  lesson_code?: string;
  band_level: number;
  flashcard_repo_id?: number;
  practice_repo_id?: number;
  mini_test_repo_id?: number;
  estimated_minutes: number;
  status: LessonStatus;
  scheduled_date?: string | null;
  flashcardRepo?: LearningRepository;
  practiceRepo?: LearningRepository;
  miniTestRepo?: LearningRepository;
  created_at: string;
  updated_at: string;
}

export interface LearningRepository {
  id: number;
  cert_type: string;
  title: string;
  slug: string;
  description?: string;
  content_type: string;
  skill_area?: string;
  topic_group?: string;
  difficulty_level?: string;
  target_score_min?: number;
  target_score_max?: number;
  estimated_minutes?: number;
  pass_score?: number;
  tags?: string[];
  metadata?: any;
  total_items: number;
  is_published: boolean;
  items?: LearningRepositoryItem[];
}

export interface LearningRepositoryItem {
  id: number;
  repository_id: number;
  item_order: number;
  item_type: string;
  title?: string;
  stem: string;
  reading_passage?: string;
  hint?: string;
  explanation?: string;
  ai_explanation?: string;
  difficulty_level?: string;
  score_weight: number;
  estimated_seconds?: number;
  media_audio_url?: string;
  media_image_url?: string;
  metadata?: any;
  options?: LearningRepositoryOption[];
}

export interface LearningRepositoryOption {
  id: number;
  item_id: number;
  option_key: string;
  option_text: string;
  is_correct: boolean;
  rationale?: string;
  sort_order: number;
}

export interface PracticeSession {
  id: string;
  lesson_id: number;
  session_type: SessionType;
  repository_id: number;
  total_questions: number;
  correct_count: number;
  accuracy_percent: number;
  total_time_sec?: number;
  avg_time_per_q?: number;
  error_analysis?: Record<string, number>;
  detailed_results?: QuestionResult[];
  completed_at: string;
}

export interface QuestionResult {
  item_id: number;
  question: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_taken: number;
  expected_time: number;
  explanation?: string;
  /** Present for speaking/writing items graded by AI */
  ai_grading?: {
    bandScore: number;
    overallFeedback: string;
    suggestions: string[];
    criteria: { code: string; name: string; score: number; feedback: string }[];
    wordCount?: number;
  };
}

export interface BandTest {
  id: string;
  roadmap_id: number;
  test_name: string;
  band_level: number;
  skills_tested: string[];
  question_ids: string[];
  total_questions: number;
  correct_count: number;
  accuracy_percent: number;
  total_time_sec: number;
  expected_time_sec: number;
  response_time_factor: number;
  consistency_score?: number;
  severe_error_count: number;
  suspicious_fast_answers: number;
  previous_band: number;
  estimated_band: number;
  band_change: BandChange;
  confidence_level: string;
  skill_breakdown: Record<string, SkillBreakdown>;
  recommendation: Recommendation;
  weak_skills: string[];
  status: string;
  started_at: string;
  completed_at?: string;
  /** Đã áp dụng band mới vào lộ trình chưa */
  band_applied?: boolean;
  /** Cảnh báo hành vi bất thường */
  warnings?: string[];
  /** Chi tiết kết quả từng câu hỏi */
  question_results?: QuestionResult[];
}

export interface SkillBreakdown {
  accuracy: number;
  correct: number;
  total: number;
  avgTime: number;
  weakPoints: string[];
}

export interface QuestionResult {
  questionId: string;
  skill: string;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  timeTaken: number;
  expectedTime: number;
  questionText?: string;
}

export interface SkillProgress {
  id: number;
  enrollment_id: number;
  skill_area: SkillArea;
  current_band: number;
  lessons_completed: number;
  total_practice: number;
  accuracy_rate: number;
  recent_sessions?: SessionSummary[];
  weak_topics: string[];
  last_practiced_at?: string;
  updated_at: string;
}

export interface SessionSummary {
  date: string;
  accuracy: number;
  questions: number;
}

// ============================================
// REQUEST DTOs
// ============================================

export interface CreateRoadmapRequest {
  enrollment_id: number;
  current_band: number;
  target_band: number;
}

export interface SubmitPracticeRequest {
  lesson_id: number;
  session_type: SessionType;
  repository_id: number;
  answers: Record<string, string>;
  time_per_question?: Record<string, number>;
}

export interface CreateBandTestRequest {
  roadmap_id: number;
  skills_to_test: SkillArea[];
  questions_per_skill?: number;
}

export interface SubmitBandTestRequest {
  test_id: string;
  answers: Record<string, string>;
  time_per_question: Record<string, number>;
}

export interface WeakPoint {
  id: number;
  skill: string;
  name: string;
  severity: number;
  occurrences: number;
  last_seen_at: string;
  improvement_suggestion?: string | null;
  recommended_action?: string | null;
}

export interface LearningRecommendation {
  id: number;
  type: string;
  title: string;
  reason?: string | null;
  skill?: string | null;
  priority: number;
  lesson_id?: number | null;
}

export interface SkillProgressItem {
  skill: string;
  band: number;
  accuracy: number;
  lessons_completed: number;
  total_practice: number;
  last_practiced_at?: string | null;
}

export interface LearningAnalysis {
  overall_band: number | null;
  skill_progress: SkillProgressItem[];
  weak_points: WeakPoint[];
  recommendations: LearningRecommendation[];
}
