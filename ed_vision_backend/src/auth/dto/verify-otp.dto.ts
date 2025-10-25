import { IsNotEmpty, IsString } from 'class-validator'

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  email: string

  @IsNotEmpty()
  @IsString()
  code: string
}
