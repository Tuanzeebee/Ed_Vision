import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AccountFilterDto {
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @IsOptional()
  @IsEnum(['admin', 'teacher', 'student', 'parent', 'leader'], {
    message: 'Vai trò không hợp lệ',
  })
  role?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'], {
    message: 'Trạng thái không hợp lệ',
  })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Trường/Khoa phải là chuỗi ký tự' })
  school?: string;

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
