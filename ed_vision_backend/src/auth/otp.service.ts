import { Injectable, BadRequestException, InternalServerErrorException, HttpException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as nodemailer from 'nodemailer'

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  // Generate a numeric OTP code. Default length is 4 to match frontend UI.
  private generateCode(length = 4) {
    const digits = '0123456789'
    let code = ''
    for (let i = 0; i < length; i++) code += digits[Math.floor(Math.random() * digits.length)]
    return code
  }

  private getTransport() {
    // Read SMTP config from env
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
      throw new InternalServerErrorException('SMTP configuration missing')
    }

    return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  }

  async sendOtpToEmail(email: string) {
    // ensure account exists
    const account = await this.prisma.account.findUnique({ where: { email } })
    if (!account) {
      throw new BadRequestException('Account not found')
    }

    // Rate limiting: cooldown between sends and max sends per time window
    const cooldownSec = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60)
    const windowMinutes = Number(process.env.OTP_WINDOW_MINUTES || 30)
    const maxPerWindow = Number(process.env.OTP_MAX_PER_WINDOW || 5)

    // check last OTP created
    const lastOtp = await (this.prisma as any).otp.findFirst({
      where: { account_id: account.account_id },
      orderBy: { created_at: 'desc' },
    })

    if (lastOtp) {
      const lastCreated = new Date(lastOtp.created_at).getTime()
      const now = Date.now()
      const elapsedSec = Math.floor((now - lastCreated) / 1000)
      if (elapsedSec < cooldownSec) {
        const wait = cooldownSec - elapsedSec
        throw new BadRequestException(`Please wait ${wait} seconds before requesting a new code`)
      }
    }

    // count OTPs in the window
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)
    const recentCount = await (this.prisma as any).otp.count({ where: { account_id: account.account_id, created_at: { gte: windowStart } } })
    if (recentCount >= maxPerWindow) {
      throw new HttpException('Too many OTP requests. Please try again later', 429)
    }

    // Generate a 4-digit code to match the frontend input
    const code = this.generateCode(4)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Persist OTP
    await (this.prisma as any).otp.create({
      data: {
        account_id: account.account_id,
        code,
        expires_at: expiresAt,
      },
    })

    // Send email via SMTP transport (Mailjet in your .env)
    const transporter = this.getTransport()
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER
    const mailOptions = {
      from,
      to: email,
      subject: 'Your verification code',
      text: `Your 4-digit verification code is: ${code}. It expires in 5 minutes.`,
      html: `<p>Your 4-digit verification code is: <strong>${code}</strong></p><p>It expires in 5 minutes.</p>`,
    }

    try {
      const result = await transporter.sendMail(mailOptions)
      // log send result for debugging (do not log OTP code in production logs)
      console.log('OTP email sent', { to: email, messageId: result.messageId, accepted: result.accepted })
      return { ok: true }
    } catch (err) {
      // remove persisted OTP on failure to avoid orphaned codes
      try {
        await (this.prisma as any).otp.deleteMany({ where: { account_id: account.account_id, code } })
      } catch (e) {
        console.error('Failed to cleanup OTP after send failure', e)
      }
      console.error('Failed to send OTP email', err)
      throw new InternalServerErrorException('Failed to send verification email')
    }
  }

  async verifyOtp(email: string, code: string) {
    const account = await this.prisma.account.findUnique({ where: { email } })
    if (!account) throw new BadRequestException('Account not found')

    const otp = await (this.prisma as any).otp.findFirst({
      where: { account_id: account.account_id, code, used: false },
      orderBy: { created_at: 'desc' },
    })

    if (!otp) throw new BadRequestException('Invalid code')
    if (otp.expires_at < new Date()) throw new BadRequestException('Code expired')

    // mark used
  await (this.prisma as any).otp.update({ where: { otp_id: otp.otp_id }, data: { used: true } })

    // activate account
    await this.prisma.account.update({ where: { account_id: account.account_id }, data: { status: 'active' } })

    return { ok: true }
  }
}
