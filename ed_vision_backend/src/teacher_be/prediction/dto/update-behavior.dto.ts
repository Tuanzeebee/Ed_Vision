import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class UpdateBehaviorDto {
  @IsString()
  @IsNotEmpty()
  upload_id: string;

  @IsString()
  @IsNotEmpty()
  student_id: string;

  @IsNumber()
  @Min(0)
  weekly_study_hours_by_course: number;

  @IsNumber()
  @Min(0)
  part_time_hours_by_course: number;

  @IsNumber()
  @Min(0)
  @Max(3)
  financial_support_by_course: number; // 0: Thấp, 1: Trung bình, 2: Cao, 3: Rất cao

  @IsNumber()
  @Min(0)
  @Max(3)
  emotional_support_by_course: number; // 0: Thấp, 1: Trung bình, 2: Cao, 3: Rất cao
}

export class BulkUpdateBehaviorDto {
  @IsString()
  @IsNotEmpty()
  upload_id: string;

  @IsNumber()
  @Min(0)
  weekly_study_hours_by_course: number;

  @IsNumber()
  @Min(0)
  part_time_hours_by_course: number;

  @IsNumber()
  @Min(0)
  @Max(3)
  financial_support_by_course: number;

  @IsNumber()
  @Min(0)
  @Max(3)
  emotional_support_by_course: number;
}
