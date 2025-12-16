import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class UploadGradesDto {
  @IsString()
  @IsNotEmpty()
  course_code: string;

  @IsString()
  @IsNotEmpty()
  class_code: string; // Mã lớp (VD: AIS, DTE-01)

  @IsString()
  @IsNotEmpty()
  semester: string; // Học kỳ (bắt buộc)

  @IsString()
  @IsNotEmpty()
  academic_year: string; // Năm học (VD: "2024-2025") (bắt buộc)
}

export class UploadGradesResponseDto {
  success: boolean;
  message: string;
  data?: {
    upload_id: string;
    total_students: number;
    processed_students: number;
    failed_students: number;
    upload_date: Date;
  };
  errors?: string[];
}
