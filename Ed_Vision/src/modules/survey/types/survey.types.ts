// Types cho Survey system - dùng khi load câu hỏi từ DB

export type QuestionType = "single-choice"| "multiple-choice"| "likert"| "slider"| "text"| "textarea"| "yes-no"| "free-text";

export interface QuestionOption {
  value: string;
  label: string;
  icon?: string;
}

export interface SliderConfig {
  min: number;
  max: number;
  defaultValue: number;
  step?: number;
  unit: string;
  gradientType?: "stress"| "study"| "work"| "financial"| "default";
  leftLabel: string;
  rightLabel: string;
}

export interface LikertConfig {
  min?: number;
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
}

export interface YesNoConfig {
  yesLabel?: string;
  noLabel?: string;
}

export interface FreeTextConfig {
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  showCharCount?: boolean;
}

export interface Question {
  id: number | string;
  title: string;
  description: string;
  type: QuestionType;
  required?: boolean;
  options?: QuestionOption[];
  sliderConfig?: SliderConfig;
  likertConfig?: LikertConfig;
  yesNoConfig?: YesNoConfig;
  freeTextConfig?: FreeTextConfig;
  placeholder?: string; // For text/textarea
  maxLength?: number;   // For text/textarea
  min_value?: number;   // Từ DB cho slider
  max_value?: number;   // Từ DB cho slider
}

export interface SurveyConfig {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  totalQuestions: number;
  questions: Question[];
}

export interface SurveyAnswers {
  [key: string | number]: string | string[] | number;
}

export interface SurveySubmission {
  surveyId: string;
  answers: SurveyAnswers;
  completedAt: Date;
  userId?: string;
}
