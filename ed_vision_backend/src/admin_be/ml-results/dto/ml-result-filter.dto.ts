import { IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum MLModelType {
  STUDENT_PERFORMANCE = 'student_performance',
  DROPOUT_PREDICTION = 'dropout_prediction',
  COURSE_RECOMMENDATION = 'course_recommendation',
  ATTENDANCE_PREDICTION = 'attendance_prediction',
}

export class MLResultFilterDto {
  @IsOptional()
  @IsEnum(MLModelType)
  modelType?: MLModelType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class CreateMLPredictionDto {
  @IsEnum(MLModelType)
  modelType: MLModelType;

  @IsInt()
  @Type(() => Number)
  studentId: number;

  @IsOptional()
  parameters?: Record<string, any>;
}
