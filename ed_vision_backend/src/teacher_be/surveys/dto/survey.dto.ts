import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsInt,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SurveyQuestionDto {
  @IsNotEmpty()
  @IsString()
  question: string;

  @IsNotEmpty()
  @IsEnum(['text', 'multiple-choice', 'rating', 'yes-no', 'scale'])
  type: 'text' | 'multiple-choice' | 'rating' | 'yes-no' | 'scale';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  minScale?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(10)
  maxScale?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateSurveyDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetClasses?: string[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions: SurveyQuestionDto[];

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}

export class UpdateSurveyDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'closed'])
  status?: 'draft' | 'active' | 'closed';
}

export class SurveyFilterDto {
  @IsOptional()
  @IsEnum(['draft', 'active', 'closed', 'all'])
  status?: 'draft' | 'active' | 'closed' | 'all';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class SendReminderDto {
  @IsNotEmpty()
  @IsString()
  surveyId: string;

  @IsOptional()
  @IsString()
  customMessage?: string;
}
