import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateMeetingLogDto {
  @IsNotEmpty()
  @IsNumber()
  instructor_id: number;

  @IsOptional()
  @IsNumber()
  slot_id?: number;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsNotEmpty()
  @IsString()
  start_time: string;

  @IsNotEmpty()
  @IsString()
  end_time: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsArray()
  student_ids: number[];

  @IsOptional()
  @IsString()
  location?: string;
}
