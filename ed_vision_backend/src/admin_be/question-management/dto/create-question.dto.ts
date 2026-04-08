import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OptionDto {
  @IsString()
  @IsNotEmpty()
  option_text: string;

  @IsOptional()
  @IsNumber()
  option_value?: number;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  question_text: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  category: string;

  @IsString()
  @IsNotEmpty({ message: 'Loại câu hỏi không được để trống' })
  question_type: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  min_value?: number;

  @IsOptional()
  @IsNumber()
  max_value?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];
}
