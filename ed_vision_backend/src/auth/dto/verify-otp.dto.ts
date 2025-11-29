import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsString({ message: 'Email phải là chuỗi ký tự' })
  email: string;

  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  code: string;

  @IsOptional()
  @IsString()
  linkCode?: string; // Optional: for completing parent-student link
}
