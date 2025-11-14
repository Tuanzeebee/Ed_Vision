import { IsNotEmpty, IsString, IsNumber, IsArray, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeColumnDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNumber()
    @Min(1)
    @Max(100)
    maxScore: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    weight: number; // Trọng số %
}

export class CreateGradeStructureDto {
    @IsNotEmpty()
    @IsString()
    classId: string;

    @IsNotEmpty()
    @IsString()
    subjectCode: string;

    @IsNotEmpty()
    @IsString()
    subjectName: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GradeColumnDto)
    columns: GradeColumnDto[];
}
