import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName?: string;

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
  @IsString({ message: 'Ngày sinh phải là chuỗi ký tự' })
  dateOfBirth?: string;

  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi ký tự' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Trạng thái phải là chuỗi ký tự' })
  status?: string;
}
