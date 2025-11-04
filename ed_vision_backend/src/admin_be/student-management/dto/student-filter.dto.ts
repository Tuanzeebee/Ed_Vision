import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class StudentFilterDto {
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'Chuyên ngành phải là chuỗi ký tự' })
  major?: string;

  @IsOptional()
  @IsInt({ message: 'Khóa học phải là số nguyên' })
  cohortYear?: number;

  @IsOptional()
  @IsInt({ message: 'ID lớp phải là số nguyên' })
  classId?: number;

  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  status?: string;

  @IsOptional()
  @IsInt({ message: 'Trang phải là số nguyên' })
  @Min(1, { message: 'Trang phải lớn hơn 0' })
  page?: number;

  @IsOptional()
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  limit?: number;
}
