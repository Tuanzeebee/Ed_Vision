import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InstructorStatsGateway } from '../admin_be/instructor-management/instructor-stats.gateway';
import { StudentStatsGateway } from '../admin_be/student-management/student-stats.gateway';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly instructorStatsGateway: InstructorStatsGateway,
    private readonly studentStatsGateway: StudentStatsGateway,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const account = await this.authService.register(dto);
    return { success: true, data: account };
  }

  // Debug endpoint - quick check to verify Prisma can find an account and include roleRel
  @Get('debug/account')
  async debugAccount(@Query('email') email: string) {
    try {
      const acc = await this.prisma.account.findUnique({
        where: { email },
        include: { roleRel: true },
      });
      return { success: true, data: acc };
    } catch (e) {
      console.error('Error in debugAccount:', e && e.stack ? e.stack : e);
      return { success: false, error: e && e.message ? e.message : String(e) };
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.authService.login(dto.email, dto.password);
      
      // Broadcast instructor online stats update
      await this.broadcastInstructorStats();
      
      // Broadcast student online stats update
      await this.broadcastStudentStats();
      
      return { success: true, data: result };
    } catch (e) {
      // Log full error here to aid debugging of 500 cases from frontend
      console.error(
        'Error in AuthController.login:',
        e && e.stack ? e.stack : e,
      );
      throw e;
    }
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    const result = await this.authService.logout(dto.email);
    
    // Broadcast instructor online stats update
    await this.broadcastInstructorStats();
    
    // Broadcast student online stats update
    await this.broadcastStudentStats();
    
    return { success: true, data: result };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto.email);
    return { success: true, message: result };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
      dto.confirmPassword
    );
    return { success: true, message: result };
  }

  private async broadcastInstructorStats() {
    try {
      const totalCount = await this.prisma.instructor.count();
      const onlineResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "Instructor" i
        INNER JOIN "Account" a ON i.account_id = a.account_id
        WHERE a.last_login_at IS NOT NULL
          AND (a.last_logout_at IS NULL OR a.last_login_at > a.last_logout_at)
      `;
      const onlineCount = Number(onlineResult[0]?.count || 0);
      
      this.instructorStatsGateway.broadcastOnlineStats({
        totalCount,
        onlineCount,
      });
    } catch (error) {
      console.error('Failed to broadcast instructor stats:', error);
    }
  }

  private async broadcastStudentStats() {
    try {
      const totalCount = await this.prisma.student.count();
      const onlineResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "Student" s
        INNER JOIN "Account" a ON s.account_id = a.account_id
        WHERE a.last_login_at IS NOT NULL
          AND (a.last_logout_at IS NULL OR a.last_login_at > a.last_logout_at)
      `;
      const onlineCount = Number(onlineResult[0]?.count || 0);
      
      this.studentStatsGateway.broadcastOnlineStats({
        totalCount,
        onlineCount,
      });
    } catch (error) {
      console.error('Failed to broadcast student stats:', error);
    }
  }
}
