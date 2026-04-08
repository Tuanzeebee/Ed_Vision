import {
  IsString,
  IsOptional,
  IsInt,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateInstructorDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName: string;

  @IsString({ message: 'Mã giảng viên phải là chuỗi ký tự' })
  employeeCode: string;

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
}
