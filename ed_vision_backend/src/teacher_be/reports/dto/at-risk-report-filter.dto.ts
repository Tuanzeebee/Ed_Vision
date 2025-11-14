import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AtRiskReportFilterDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    class?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    course?: string; // Khóa

    @IsOptional()
    @IsEnum(['Nguy cơ cao', 'Nguy cơ trung bình', 'Cần theo dõi', 'all'])
    riskLevel?: 'Nguy cơ cao' | 'Nguy cơ trung bình' | 'Cần theo dõi' | 'all';

    @IsOptional()
    @IsString()
    academicYear?: string;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    semester?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    limit?: number;
}
