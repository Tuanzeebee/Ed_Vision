import { IsNotEmpty, IsString } from 'class-validator';

export class UploadClassDto {
  @IsNotEmpty()
  @IsString()
  class_code: string;
}

export interface UploadErrorDetail {
  student_code: string;
  email: string;
  error: string;
}

export class UploadClassResponseDto {
  success: boolean;
  message: string;
  data?: {
    class_id: number;
    class_code: string;
    total_records: number;
    successful_records: number;
    students_created: number;
    students_updated: number;
    failed_records: number;
    errors?: UploadErrorDetail[];
  };
}

export interface StudentRowData {
  student_code: string;
  full_name: string;
  email: string;
  major?: string;
  cohort_year?: number;
}
