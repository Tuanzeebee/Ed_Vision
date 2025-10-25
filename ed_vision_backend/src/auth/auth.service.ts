import { Injectable, BadRequestException, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import * as bcrypt from 'bcryptjs'
import { OtpService } from './otp.service'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly otpService: OtpService) {}

  /**
   * Register a new student account
   * - enforce email domain @dtu.edu.vn
   * - ensure email uniqueness
   * - hash password
   * - create account with pending status and send OTP
   */
  async register(dto: RegisterDto) {
    const { email, password, confirmPassword } = dto

    // simple validation
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match')
    }

    const domain = '@dtu.edu.vn'
    if (!email.toLowerCase().endsWith(domain)) {
      throw new BadRequestException(`Registration allowed only for ${domain} emails`)
    }

    // check existing account
    const existing = await this.prisma.account.findUnique({ where: { email } })
    if (existing) {
      // If the account exists but is pending verification, resend OTP instead of blocking
      if (existing.status === 'pending') {
        // Trigger resend asynchronously and return immediately so frontend can navigate to OTP entry
        this.otpService.sendOtpToEmail(email).then(() => {
          // ok
        }).catch((e) => {
          console.error('Failed to resend OTP for existing pending account (async)', e)
        })
        return { message: 'Verification OTP resend triggered', email }
      }
      throw new ConflictException('Email already registered')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // create account with role student and pending status
    // create account and connect to Role by code (create role if missing)
    const account = await (this.prisma as any).account.create({
      data: {
        email,
        password_hash: passwordHash,
        status: 'pending',
        roleRel: {
          connectOrCreate: {
            where: { code: 'student' },
            create: { code: 'student', name: 'Sinh viên' }
          }
        }
      },
      select: {
        account_id: true,
        email: true,
        status: true,
        created_at: true,
        roleRel: { select: { code: true, name: true } }
      },
    })

    // send OTP asynchronously and don't block response to the client.
    // We don't rollback account creation here to avoid delaying the frontend transition to OTP entry.
    this.otpService.sendOtpToEmail(email).then(() => {
      // sent successfully - nothing to do here
    }).catch((e) => {
      // log the failure; do not delete the account to avoid surprising UX
      console.error('Failed to send OTP email (async)', e)
    })

    return account
  }

  /**
   * Simple login handler - verifies credentials and account status.
   * Currently returns a placeholder accessToken. Replace with JWT issuance when ready.
   */
  async login(email: string, password: string) {
  const account = await (this.prisma as any).account.findUnique({ where: { email }, include: { roleRel: true } })
    if (!account) throw new UnauthorizedException('Invalid credentials')

    if (account.status !== 'active') {
      // Not yet verified
      throw new BadRequestException('Account not active. Please verify your email')
    }

    const match = await bcrypt.compare(password, account.password_hash)
    if (!match) throw new UnauthorizedException('Invalid credentials')

    // For now return a simple token placeholder. Replace with real JWT in production.
    // update last_login_at
    try {
      await (this.prisma as any).account.update({ where: { account_id: account.account_id }, data: { last_login_at: new Date() } })
    } catch (e) {
      console.error('Failed to update last_login_at', e)
    }

  const roleCode = account.roleRel?.code || 'student'
  return { accessToken: `dev-token-${account.account_id}`, account: { account_id: account.account_id, email: account.email, role: roleCode, last_login_at: new Date() } }
  }

  async logout(email: string) {
    const account = await this.prisma.account.findUnique({ where: { email } })
    if (!account) throw new BadRequestException('Account not found')
    try {
      await (this.prisma as any).account.update({ where: { account_id: account.account_id }, data: { last_logout_at: new Date() } })
      return { ok: true }
    } catch (e) {
      console.error('Failed to update last_logout_at', e)
      throw new InternalServerErrorException('Failed to record logout')
    }
  }
}
