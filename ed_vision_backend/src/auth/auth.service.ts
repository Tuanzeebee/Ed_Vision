import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RolePermissionsService } from '../role-permissions/role-permissions.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly rolePermissionsSvc: RolePermissionsService,
  ) {}

  /**
   * Register a new account (student or parent)
   * - If linkCode is provided: register as parent and link to student
   * - If no linkCode: register as student with @dtu.edu.vn email
   * - ensure email uniqueness
   * - hash password
   * - create account with pending status and send OTP
   */
  async register(dto: RegisterDto) {
    const { email, password, confirmPassword, linkCode } = dto;

    // simple validation
    if (password !== confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Email domain validation: only enforce for students (no linkCode)
    if (!linkCode) {
      const domain = '@dtu.edu.vn';
      if (!email.toLowerCase().endsWith(domain)) {
        throw new BadRequestException(
          `Chỉ cho phép đăng ký với email ${domain}`,
        );
      }
    }

    // check existing account
    const existing = await this.prisma.account.findUnique({ where: { email } });
    if (existing) {
      // If the account exists but is pending verification, check if OTP was recently sent
      if (existing.status === 'pending') {
        // Check if OTP was sent in last 30 seconds to avoid spam
        const recentOtp = await (this.prisma as any).otp.findFirst({
          where: { account_id: existing.account_id },
          orderBy: { created_at: 'desc' },
        });

        if (recentOtp) {
          const lastCreated = new Date(recentOtp.created_at).getTime();
          const now = Date.now();
          const elapsedSec = Math.floor((now - lastCreated) / 1000);

          // If OTP was sent less than 30 seconds ago, just return success without sending
          if (elapsedSec < 30) {
            return {
              message: 'Mã OTP đã được gửi. Vui lòng kiểm tra email',
              email,
              recentlySent: true,
            };
          }
        }

        // Trigger resend asynchronously and return immediately so frontend can navigate to OTP entry
        this.otpService
          .sendOtpToEmail(email)
          .then(() => {
            // ok
          })
          .catch((e) => {
            console.error(
              'Failed to resend OTP for existing pending account (async)',
              e,
            );
          });
        return { message: 'Mã OTP xác thực đã được gửi lại', email };
      }
      throw new ConflictException('Email đã được đăng ký');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Determine role based on linkCode presence
    const roleCode = linkCode ? 'parent' : 'student';
    const roleName = linkCode ? 'Phụ huynh' : 'Sinh viên';

    // If linkCode provided, validate it and get student info
    if (linkCode) {
      const parentStudentLink = await this.prisma.parentStudentLink.findUnique({
        where: { link_code: linkCode },
        include: { student: true },
      });

      if (!parentStudentLink) {
        throw new BadRequestException('Mã liên kết không hợp lệ');
      }

      // Check if this link is already used (has parent_id)
      if (parentStudentLink.parent_id) {
        throw new BadRequestException('Mã liên kết đã được sử dụng');
      }
    }

    // create account and connect to Role by code (create role if missing)
    const account = await (this.prisma as any).account.create({
      data: {
        email,
        password_hash: passwordHash,
        status: 'pending',
        roleRel: {
          connectOrCreate: {
            where: { code: roleCode },
            create: { code: roleCode, name: roleName },
          },
        },
      },
      select: {
        account_id: true,
        email: true,
        status: true,
        created_at: true,
        roleRel: { select: { code: true, name: true } },
      },
    });

    // Store linkCode temporarily in memory/session for OTP verification step
    // We'll complete the parent-student link after OTP verification
    // For now, just return the account info with linkCode
    const result = {
      ...account,
      linkCode: linkCode || undefined,
    };

    // send OTP asynchronously and don't block response to the client.
    // We don't rollback account creation here to avoid delaying the frontend transition to OTP entry.
    this.otpService
      .sendOtpToEmail(email)
      .then(() => {
        // sent successfully - nothing to do here
      })
      .catch((e) => {
        // log the failure; do not delete the account to avoid surprising UX
        console.error('Failed to send OTP email (async)', e);
      });

    return result;
  }

  /**
   * Simple login handler - verifies credentials and account status.
   * Currently returns a placeholder accessToken. Replace with JWT issuance when ready.
   */
  async login(email: string, password: string) {
    const account = await (this.prisma as any).account.findUnique({
      where: { email },
      include: { roleRel: true },
    });
    if (!account)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    if (account.status !== 'active') {
      // Not yet verified
      throw new BadRequestException(
        'Tài khoản chưa được kích hoạt. Vui lòng xác thực email',
      );
    }

    const match = await bcrypt.compare(password, account.password_hash);
    if (!match)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    // For now return a simple token placeholder. Replace with real JWT in production.
    // update last_login_at
    try {
      await (this.prisma as any).account.update({
        where: { account_id: account.account_id },
        data: { last_login_at: new Date() },
      });
    } catch (e) {
      console.error('Failed to update last_login_at', e);
    }

    const roleCode = account.roleRel?.code || 'student';
    // attach permissions for the role so frontend can make immediate UI decisions
    let perms = {};
    try {
      perms = await this.rolePermissionsSvc.getPermissionsForRole(roleCode);
    } catch (e) {
      perms = {};
    }

    return {
      accessToken: `dev-token-${account.account_id}`,
      account: {
        account_id: account.account_id,
        email: account.email,
        role: roleCode,
        last_login_at: new Date(),
        permissions: perms,
      },
    };
  }

  async logout(email: string) {
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account) throw new BadRequestException('Không tìm thấy tài khoản');
    try {
      await (this.prisma as any).account.update({
        where: { account_id: account.account_id },
        data: { last_logout_at: new Date() },
      });
      return { ok: true };
    } catch (e) {
      console.error('Failed to update last_logout_at', e);
      throw new InternalServerErrorException('Không thể ghi nhận đăng xuất');
    }
  }

  /**
   * Forgot password - send OTP to email for password reset
   */
  async forgotPassword(email: string) {
    // Generic success message for security (don't reveal if email exists)
    const genericMessage =
      'Nếu email tồn tại trong hệ thống, mã xác thực sẽ được gửi đến email của bạn';

    // Check if account exists
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account) {
      // Email doesn't exist - return generic message without sending email
      // This prevents email enumeration and saves resources
      return genericMessage;
    }

    // Check if account is active
    if (account.status !== 'active') {
      // Account exists but not active - still return generic message
      // Don't reveal account status to prevent information leakage
      return genericMessage;
    }

    // Resend OTP: cooldown 60s, max 4 times/1h
    const cooldownSec = 60;
    const windowMinutes = 60;
    const maxPerWindow = 4;

    // Check last OTP created for password reset
    const lastOtp = await (this.prisma as any).otp.findFirst({
      where: { account_id: account.account_id },
      orderBy: { created_at: 'desc' },
    });
    if (lastOtp) {
      const lastCreated = new Date(lastOtp.created_at).getTime();
      const now = Date.now();
      const elapsedSec = Math.floor((now - lastCreated) / 1000);
      if (elapsedSec < cooldownSec) {
        return genericMessage;
      }
    }
    // Count OTPs in the last 1 hour
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recentCount = await (this.prisma as any).otp.count({
      where: {
        account_id: account.account_id,
        created_at: { gte: windowStart },
      },
    });
    if (recentCount >= maxPerWindow) {
      return genericMessage;
    }
    // Send OTP for password reset
    try {
      await this.otpService.sendOtpToEmail(email);
    } catch (error) {
      console.error('Failed to send password reset OTP:', error);
    }
    return genericMessage;
  }

  /**
   * Reset password using OTP code
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Validate password strength
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Find account
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account) {
      throw new BadRequestException('Không tìm thấy tài khoản');
    }

    // Only allow password reset for active accounts
    if (account.status !== 'active') {
      throw new BadRequestException('Tài khoản chưa được kích hoạt');
    }

    // Verify OTP
    const otp = await (this.prisma as any).otp.findFirst({
      where: { account_id: account.account_id, code, used: false },
      orderBy: { created_at: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException('Mã xác thực không hợp lệ');
    }

    if (otp.expires_at < new Date()) {
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }

    // Mark OTP as used
    await (this.prisma as any).otp.update({
      where: { otp_id: otp.otp_id },
      data: { used: true },
    });

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.account.update({
      where: { account_id: account.account_id },
      data: { password_hash: passwordHash },
    });

    return {
      message: 'Mật khẩu đã được đặt lại thành công',
      success: true,
    };
  }
}
