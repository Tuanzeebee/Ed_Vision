import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ProgressFilterDto {
  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  semester?: number;

  @IsOptional()
  @IsString()
  classId?: string;
}
