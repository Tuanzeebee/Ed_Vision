import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  code: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string;

  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  confirmPassword: string;
}
