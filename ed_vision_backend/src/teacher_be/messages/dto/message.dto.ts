import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['student', 'parent', 'both'])
  recipientType?: 'student' | 'parent' | 'both';
}

export class SendTemplateMessageDto {
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];

  @IsNotEmpty()
  @IsString()
  templateId: string;

  @IsOptional()
  @IsString()
  customContent?: string;
}

export class CreateTemplateDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(['low_grades', 'absence', 'performance', 'general'])
  category?: 'low_grades' | 'absence' | 'performance' | 'general';
}
