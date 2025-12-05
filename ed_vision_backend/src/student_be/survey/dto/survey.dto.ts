import { IsNumber, IsString, IsArray, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// DTO cho câu trả lời của một câu hỏi
export class AnswerDto {
  @IsNumber()
  questionId: number;

  @IsOptional()
  @IsNumber()
  optionId?: number; // Cho multiple_choice, yes_no, scale, rating

  @IsOptional()
  @IsString()
  freeText?: string; // Cho free_text
}

// DTO để submit toàn bộ khảo sát
export class SubmitSurveyDto {
  @IsNumber()
  surveyId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

// Response type cho survey list
export class SurveyListItemDto {
  surveyId: number;
  title: string;
  description?: string;
  type: string; // 'input' | 'periodic'
  totalQuestions: number;
  estimatedTime: string;
  startDate?: Date;
  endDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

// Response type cho survey detail với questions
export class SurveyQuestionOptionDto {
  optionId: number;
  text: string;
  value: number;
}

export class SurveyQuestionDto {
  questionId: number;
  questionText: string;
  questionType: string; // 'scale' | 'yes_no' | 'multiple_choice' | 'free_text' | 'rating'
  category?: string;
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  options?: SurveyQuestionOptionDto[];
}

export class SurveyDetailDto {
  surveyId: number;
  title: string;
  description?: string;
  type: string;
  totalQuestions: number;
  estimatedTime: string;
  questions: SurveyQuestionDto[];
}

// Check status response
export class SurveyStatusDto {
  hasCompletedInputSurvey: boolean;
  pendingInputSurvey?: SurveyListItemDto;
  pendingPeriodicSurveys: SurveyListItemDto[];
}
