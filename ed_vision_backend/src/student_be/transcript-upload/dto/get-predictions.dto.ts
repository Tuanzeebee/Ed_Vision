import { IsInt, IsOptional, IsString } from 'class-validator';

export class GetPredictionsDto {
  @IsInt()
  student_id: number;

  @IsOptional()
  @IsInt()
  course_id?: number;

  @IsOptional()
  @IsString()
  model_type?: string; // 'student' | 'teacher'
}

export class PredictionResultDto {
  prediction_id: number;
  student_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  predicted_gpa: number;
  predicted_fail_warning: boolean;
  prediction_confidence: number | null;
  model_type: string;
  model_version: string;
  term_id: number | null;
  academic_year: string | null;
  semester_number: number | null;
  created_at: Date;
}

export class PredictionsResponse {
  success: boolean;
  data: {
    predictions: PredictionResultDto[];
    total: number;
  };
}
