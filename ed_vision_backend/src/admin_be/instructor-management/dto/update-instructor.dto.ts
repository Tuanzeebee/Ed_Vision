import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateInstructorDto {
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Học hàm phải là chuỗi ký tự' })
  academicTitle?: string;

  @IsOptional()
  @IsString({ message: 'Chức vụ phải là chuỗi ký tự' })
  position?: string;

  @IsOptional()
  @IsInt({ message: 'ID khoa phải là số nguyên' })
  departmentId?: number;

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
