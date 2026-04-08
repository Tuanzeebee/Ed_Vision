import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardFilterDto {
  @IsOptional()
  @IsString()
  faculty?: string; // Khoa

  @IsOptional()
  @IsString()
  course?: string; // Khóa học (K28, K29, etc.)

  @IsOptional()
  @IsString()
  academicYear?: string; // Năm học (2024-2025)

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  semester?: number; // Học kỳ (1, 2, 3)
}
