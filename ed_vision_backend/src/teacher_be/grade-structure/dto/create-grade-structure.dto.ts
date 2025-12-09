import { IsString, IsNumber, IsArray, ValidateNested, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeColumnDto {
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  maxScore: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;

  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateGradeStructureDto {
  @IsString()
  academicYear: string; // VD: "2024-2025"

  @IsNumber()
  @Min(1)
  @Max(3)
  semester: number; // 1, 2, hoặc 3

  @IsString()
  courseCode: string;

  @IsString()
  courseName: string;

  @IsNumber()
  @Min(0)
  credits: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeColumnDto)
  columns: GradeColumnDto[];

  @IsOptional()
  @IsString()
  teacherId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
