import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class UploadGradesDto {
  @IsString()
  @IsNotEmpty()
  course_code: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsNumber()
  @IsOptional()
  year?: number;
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
