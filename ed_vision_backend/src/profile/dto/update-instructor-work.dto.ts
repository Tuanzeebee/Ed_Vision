import { IsOptional, IsString, MaxLength, IsInt, IsDateString } from 'class-validator';

export class UpdateInstructorWorkDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employee_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  academic_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsInt()
  department_id?: number;

  @IsOptional()
  @IsDateString()
  hire_date?: string;
}
