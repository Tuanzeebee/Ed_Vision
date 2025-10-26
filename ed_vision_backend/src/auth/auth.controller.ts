import { Body, Controller, Post, Get, Query } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { LogoutDto } from './dto/logout.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly prisma: PrismaService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const account = await this.authService.register(dto)
    return { success: true, data: account }
  }

  // Debug endpoint - quick check to verify Prisma can find an account and include roleRel
  @Get('debug/account')
  async debugAccount(@Query('email') email: string) {
    try {
      const acc = await this.prisma.account.findUnique({ where: { email }, include: { roleRel: true } })
      return { success: true, data: acc }
    } catch (e) {
      console.error('Error in debugAccount:', e && e.stack ? e.stack : e)
      return { success: false, error: e && e.message ? e.message : String(e) }
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.authService.login(dto.email, dto.password)
      return { success: true, data: result }
    } catch (e) {
      // Log full error here to aid debugging of 500 cases from frontend
      console.error('Error in AuthController.login:', e && e.stack ? e.stack : e)
      throw e
    }
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    const result = await this.authService.logout(dto.email)
    return { success: true, data: result }
  }
}
