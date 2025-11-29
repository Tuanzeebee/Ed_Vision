import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @MinLength(6, { message: 'Xác nhận mật khẩu phải có ít nhất 6 ký tự' })
  confirmPassword: string;

  @IsOptional()
  @IsString()
  linkCode?: string; // Optional: for parent registration via student link
}
