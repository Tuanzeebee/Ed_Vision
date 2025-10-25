import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { OtpService } from './otp.service'
import { OtpController } from './otp.controller'

@Module({
  imports: [PrismaModule],
  providers: [AuthService, OtpService],
  controllers: [AuthController, OtpController],
})
export class AuthModule {}
