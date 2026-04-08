import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentFilterDto {
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'Trường phải là chuỗi ký tự' })
  department?: string;

  @IsOptional()
  @IsString({ message: 'Ngành phải là chuỗi ký tự' })
  program?: string;

  @IsOptional()
  @IsString({ message: 'Chuyên ngành phải là chuỗi ký tự' })
  major?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Khóa học phải là số nguyên' })
  cohortYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID lớp phải là số nguyên' })
  classId?: number;

  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang phải lớn hơn 0' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  limit?: number;
}
