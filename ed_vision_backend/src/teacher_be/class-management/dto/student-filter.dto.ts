import { IsOptional, IsString, IsEnum } from 'class-validator';

export class StudentFilterDto {
  @IsOptional()
  @IsString()
  search?: string; // Tìm theo tên hoặc mã SV

  @IsOptional()
  @IsEnum(['None', 'Monitor', 'Medium', 'High'])
  riskLevel?: 'None' | 'Monitor' | 'Medium' | 'High';
}
