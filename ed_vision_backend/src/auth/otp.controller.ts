import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('resend')
  async resend(@Body() dto: ResendOtpDto) {
    await this.otpService.sendOtpToEmail(dto.email);
    return { ok: true };
  }

  @Post('verify')
  async verify(@Body() dto: VerifyOtpDto) {
    await this.otpService.verifyOtp(dto.email, dto.code, dto.linkCode);
    return { ok: true };
  }
}
