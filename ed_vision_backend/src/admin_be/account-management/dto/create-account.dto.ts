import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  Matches,
} from 'class-validator';

export class CreateAccountDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @Matches(/@dtu\.edu\.vn$/, { message: 'Email phải có đuôi @dtu.edu.vn' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @IsEnum(['leader', 'instructor', 'student', 'parent'], {
    message: 'Vai trò không hợp lệ',
  })
  role: string;

  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  birthDate?: string;

  @IsOptional()
  @IsEnum(['male', 'female'], { message: 'Giới tính không hợp lệ' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phone?: string;

  @IsOptional()
  @IsInt({ message: 'Department ID phải là số nguyên' })
  departmentId?: number;

  @IsOptional()
  @IsString({ message: 'Ngành phải là chuỗi ký tự' })
  major?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'], {
    message: 'Trạng thái không hợp lệ',
  })
  status?: string;

  @IsOptional()
  @IsBoolean({ message: 'sendEmail phải là boolean' })
  sendEmail?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'forcePasswordChange phải là boolean' })
  forcePasswordChange?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'twoFactor phải là boolean' })
  twoFactor?: boolean;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  notes?: string;
}
