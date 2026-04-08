import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class InstructorFilterDto {
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID khoa phải là số nguyên' })
  departmentId?: number;

  @IsOptional()
  @IsString({ message: 'Học hàm phải là chuỗi ký tự' })
  academicTitle?: string;

  @IsOptional()
  @IsString({ message: 'Chức vụ phải là chuỗi ký tự' })
  position?: string;

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
