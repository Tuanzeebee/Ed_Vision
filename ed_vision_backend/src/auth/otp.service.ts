import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  // Generate a numeric OTP code. Default length is 4 to match frontend UI.
  private generateCode(length = 4) {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++)
      code += digits[Math.floor(Math.random() * digits.length)];
    return code;
  }

  private getTransport() {
    // Read SMTP config from env
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new InternalServerErrorException('Thiếu cấu hình SMTP');
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendOtpToEmail(email: string) {
    // ensure account exists
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account) {
      throw new BadRequestException('Không tìm thấy tài khoản');
    }

    // Rate limiting: cooldown between sends and max sends per time window
    const cooldownSec = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 30); // Giảm từ 60 xuống 30 giây
    const windowMinutes = Number(process.env.OTP_WINDOW_MINUTES || 30);
    const maxPerWindow = Number(process.env.OTP_MAX_PER_WINDOW || 10); // Tăng từ 5 lên 10 lần

    // check last OTP created
    const lastOtp = await (this.prisma as any).otp.findFirst({
      where: { account_id: account.account_id },
      orderBy: { created_at: 'desc' },
    });

    if (lastOtp) {
      const lastCreated = new Date(lastOtp.created_at).getTime();
      const now = Date.now();
      const elapsedSec = Math.floor((now - lastCreated) / 1000);
      if (elapsedSec < cooldownSec) {
        const wait = cooldownSec - elapsedSec;
        throw new BadRequestException(
          `Vui lòng đợi ${wait} giây trước khi yêu cầu mã mới`,
        );
      }
    }

    // count OTPs in the window
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recentCount = await (this.prisma as any).otp.count({
      where: {
        account_id: account.account_id,
        created_at: { gte: windowStart },
      },
    });
    if (recentCount >= maxPerWindow) {
      throw new HttpException(
        'Quá nhiều yêu cầu OTP. Vui lòng thử lại sau',
        429,
      );
    }

    // Generate a 4-digit code to match the frontend input
    const code = this.generateCode(4);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Persist OTP
    await (this.prisma as any).otp.create({
      data: {
        account_id: account.account_id,
        code,
        expires_at: expiresAt,
      },
    });

    // Send email via SMTP transport (Mailjet in your .env)
    const transporter = this.getTransport();
    const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
    const expiryMinutes = 5; // đổi nếu bạn muốn
    // Optional: thêm verifyUrl nếu có trang xác thực riêng.

    const mailOptions = {
      from,
      to: email,
      subject: ' Ed_Vision - Your Verification Code',
      text: `Ed_Vision - Email Verification

Hello there!

Welcome to Ed_Vision! We're excited to have you join our AI-powered learning platform.

Your verification code: ${code}
 Valid for ${expiryMinutes} minutes

Simply enter this code to activate your account and start your learning journey.

If you didn't sign up for Ed_Vision, please ignore this email.

Happy learning!
The Ed_Vision Team`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Ed_Vision - Email Verification</title>
<style>
  @media (prefers-color-scheme: dark) {
    :root { color-scheme: dark; supported-color-schemes: dark light; }
    .bg-page { background:#0b0e14 !important; }
    .bg-card { background:#151a23 !important; }
    .text-muted { color:#a3b1c6 !important; }
    .text-strong { color:#e6edf6 !important; }
    .divider { border-color:#2a3342 !important; }
  }
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background:#f5f7fb;">
  <!-- Preheader (ẩn) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your EdVision verification code is ${code}. It expires in ${expiryMinutes} minutes.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 20px rgba(18,38,63,0.08);" class="bg-card">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 20px;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);">
              <div style="font-family:Segoe UI,Arial,sans-serif;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.2px;">EdVision</div>
              <div style="font-family:Segoe UI,Arial,sans-serif;color:#E9ECF5;font-size:13px;margin-top:6px;opacity:.95;">AI-Powered Learning Platform</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:28px 28px 8px 28px;">
              <div style="font-family:Segoe UI,Arial,sans-serif;font-size:20px;line-height:1.35;color:#0f172a;font-weight:700;" class="text-strong">Verify your email</div>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:0 28px 8px 28px;">
              <div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;color:#475569;" class="text-muted">
                Hello,<br/>
                Thanks for signing up for <strong>EdVision</strong>. Use the verification code below to finish creating your account.
              </div>
            </td>
          </tr>

          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding:22px 28px 6px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);border-radius:12px;">
                <tr>
                  <td align="center" style="padding:26px 26px;">
                    <div style="font-family:Segoe UI,Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#E9ECF5;opacity:.9;margin-bottom:10px;">Your code</div>
                    <div aria-label="Your verification code is ${code}" style="background:#ffffff;border-radius:10px;padding:18px 22px;display:inline-block;min-width:240px;">
                      <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-weight:800;font-size:28px;letter-spacing:10px;color:#0f172a;display:inline-block;">${code}</span>
                    </div>
                    <div style="font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#E9ECF5;opacity:.9;margin-top:12px;">Expires in <strong>${expiryMinutes} minutes</strong></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tips -->
          <tr>
            <td style="padding:16px 28px 6px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;border-left:4px solid #60a5fa;border-radius:8px;" class="divider">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-family:Segoe UI,Arial,sans-serif;font-size:13px;color:#334155;" class="text-muted">
                      <strong>Next steps:</strong><br/>
                      1) Enter this code in the verification form<br/>
                      2) Complete your profile<br/>
                      3) Start exploring EdVision
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:8px 28px 4px 28px;">
              <div style="font-family:Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.6;color:#64748b;" class="text-muted">
                If you didn’t request this code, you can safely ignore this email. Your account won’t be activated without verification.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 28px 26px 28px;border-top:1px solid #e2e8f0;" class="divider">
              <div style="font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#64748b;" class="text-muted">
                Best regards,<br/>
                <strong style="color:#0f172a;" class="text-strong">EdVision Team</strong>
              </div>
              <div style="font-family:Segoe UI,Arial,sans-serif;font-size:11px;color:#94a3b8;margin-top:10px;" class="text-muted">
                This is an automated email. Please do not reply.
              </div>
            </td>
          </tr>
        </table>

        <!-- spacing -->
        <div style="height:32px;line-height:32px;">&zwnj;</div>
      </td>
    </tr>
  </table>
</body>
</html>
  `,
    };

    try {
      // Add timeout to prevent hanging - 10 seconds max
      const sendPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout')), 10000),
      );

      const result = (await Promise.race([sendPromise, timeoutPromise])) as any;

      // log send result for debugging (do not log OTP code in production logs)
      console.log('OTP email sent', {
        to: email,
        messageId: result?.messageId,
        accepted: result?.accepted,
      });
      return { ok: true };
    } catch (err) {
      // Don't remove OTP on failure - user can still use it if email arrives late
      // Just log the error
      console.error('Failed to send OTP email (OTP still valid)', err);

      // Return success anyway - OTP is in database and user can use it
      // This prevents blocking user flow due to slow email delivery
      return { ok: true, emailDeliveryDelayed: true };
    }
  }

  async verifyOtp(email: string, code: string, linkCode?: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: { roleRel: true },
    });
    if (!account) throw new BadRequestException('Không tìm thấy tài khoản');

    const otp = await (this.prisma as any).otp.findFirst({
      where: { account_id: account.account_id, code, used: false },
      orderBy: { created_at: 'desc' },
    });

    if (!otp) throw new BadRequestException('Mã xác thực không hợp lệ');
    if (otp.expires_at < new Date())
      throw new BadRequestException('Mã xác thực đã hết hạn');

    // mark used
    await (this.prisma as any).otp.update({
      where: { otp_id: otp.otp_id },
      data: { used: true },
    });

    // activate account
    await this.prisma.account.update({
      where: { account_id: account.account_id },
      data: { status: 'active' },
    });

    // Create Profile record if it doesn't exist
    const existingProfile = await this.prisma.profile.findUnique({
      where: { account_id: account.account_id },
    });

    if (!existingProfile) {
      // Extract name from email (before @)
      const emailName = email.split('@')[0];
      const defaultName =
        emailName.charAt(0).toUpperCase() + emailName.slice(1);

      await this.prisma.profile.create({
        data: {
          account_id: account.account_id,
          full_name: defaultName, // Will be updated by user later
          phone_number: null,
          date_of_birth: null,
          gender: null,
          address: null,
          avatar_url: null,
          nationality: null,
        },
      });
    }

    // If this is a student registration (no linkCode), create Student record
    if (!linkCode && account.roleRel?.code === 'student') {
      const existingStudent = await this.prisma.student.findUnique({
        where: { account_id: account.account_id },
      });

      if (!existingStudent) {
        // Extract student code from email (before @)
        const studentCode = email.split('@')[0];

        await this.prisma.student.create({
          data: {
            account_id: account.account_id,
            student_code: studentCode,
            major: null,
            cohort_year: null,
            class_id: null,
            status: 'active',
          },
        });
      }
    }

    // If this is a parent registration (has linkCode), create Parent record and link
    if (linkCode && account.roleRel?.code === 'parent') {
      // Validate linkCode and get the pending link
      const parentStudentLink = await this.prisma.parentStudentLink.findUnique({
        where: { link_code: linkCode },
        include: {
          student: { include: { account: { include: { profile: true } } } },
        },
      });

      if (!parentStudentLink) {
        throw new BadRequestException('Mã liên kết không hợp lệ');
      }

      if (parentStudentLink.parent_id) {
        throw new BadRequestException('Mã liên kết đã được sử dụng');
      }

      // Create Parent record if doesn't exist
      let parent = await this.prisma.parent.findUnique({
        where: { account_id: account.account_id },
      });

      if (!parent) {
        parent = await this.prisma.parent.create({
          data: {
            account_id: account.account_id,
            relationship_type: null, // Will be updated later if needed
          },
        });
      }

      // Update the link with parent_id if not already set
      if (!parentStudentLink.parent_id) {
        await this.prisma.parentStudentLink.update({
          where: { link_id: parentStudentLink.link_id },
          data: { parent_id: parent.parent_id },
        });
      }

      console.log(
        `Parent ${parent.parent_id} linked to student ${parentStudentLink.student_id}`,
      );
    }

    return { ok: true };
  }
}
