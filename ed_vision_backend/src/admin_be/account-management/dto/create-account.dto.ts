import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateAccountDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @IsEnum(['admin', 'teacher', 'student', 'parent', 'leader'], {
    message: 'Vai trò không hợp lệ',
  })
  role: string;

  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(['Nam', 'Nữ', 'Khác'], { message: 'Giới tính không hợp lệ' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'Mã sinh viên phải là chuỗi ký tự' })
  studentCode?: string;

  @IsOptional()
  @IsString({ message: 'Mã giảng viên phải là chuỗi ký tự' })
  employeeCode?: string;

  @IsOptional()
  @IsString({ message: 'Khoa/Phòng ban phải là chuỗi ký tự' })
  department?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'], {
    message: 'Trạng thái không hợp lệ',
  })
  status?: string;
}
