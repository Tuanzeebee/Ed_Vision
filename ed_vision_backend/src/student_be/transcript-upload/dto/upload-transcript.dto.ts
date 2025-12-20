import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsIn,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TranscriptRecordDto {
  @IsString()
  @IsNotEmpty()
  student_code: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsNumber()
  @IsNotEmpty()
  semester_number: number;

  @IsString()
  @IsNotEmpty()
  course_code: string;

  @IsString()
  @IsNotEmpty()
  course_name: string;

  @IsString()
  @IsOptional()
  @IsIn(['online', 'offline', 'hybrid'])
  study_format?: string;

  @IsNumber()
  @IsNotEmpty()
  credits_unit: number;

  @IsNumber()
  @IsOptional()
  raw_score?: number;

  @IsString()
  @IsOptional()
  converted_score?: string;

  @IsNumber()
  @IsOptional()
  converted_numeric_score?: number;
}

export class UploadTranscriptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TranscriptRecordDto)
  records: TranscriptRecordDto[];
}
