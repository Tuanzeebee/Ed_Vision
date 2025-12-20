/**
 * Example: How to use i18n in NestJS Controllers
 *
 * This file demonstrates the correct way to implement i18n
 * following the architecture where:
 * - Backend returns KEYS, not translated text
 * - Frontend translates using those keys
 * - Backend only translates for emails, notifications, exports
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import {
  createErrorResponse,
  createSuccessResponse,
} from '../common/i18n.helper';

// ❌ WRONG: Returning hard-coded text
class WrongExampleController {
  @Get('student/:id')
  async getStudentWrong(@Param('id') id: string) {
    const student = { id, name: 'John', status: 'Đang học' }; // ❌ Hard-coded Vietnamese
    return student;
  }
}

// ✅ CORRECT: Returning keys for frontend to translate
@Controller('example')
export class CorrectExampleController {
  constructor(private readonly i18n: I18nService) {}

  /**
   * ✅ Example 1: Return status as KEY
   * Frontend will translate using: t('student.status.active')
   */
  @Get('student/:id')
  async getStudent(@Param('id') id: string) {
    return {
      id,
      name: 'John Doe',
      status: 'student.status.active', // ✅ Return KEY, not text
      grade: 'student.grade.excellent', // ✅ Return KEY
    };
  }

  /**
   * ✅ Example 2: Error responses with keys
   * Frontend will translate the errorKey
   */
  @Get('student/invalid/:id')
  async getStudentNotFound(@Param('id') id: string) {
    throw new BadRequestException(
      createErrorResponse('error.student.notFound', 404),
    );
  }

  /**
   * ✅ Example 3: Success response with optional message key
   */
  @Post('student')
  async createStudent(@Body() data: any) {
    const newStudent = { id: '123', ...data };
    return createSuccessResponse(newStudent, 'student.created.success');
  }

  /**
   * ✅ Example 4: Backend translates for EMAIL
   * This is when backend SHOULD translate
   */
  @Post('send-welcome-email')
  async sendWelcomeEmail(@Body() body: { email: string; lang: string }) {
    const subject = await this.i18n.translate('mail.welcome.subject', {
      lang: body.lang,
    });

    const title = await this.i18n.translate('mail.welcome.title', {
      lang: body.lang,
    });

    // Send email with translated content
    // await this.mailer.send({ to: body.email, subject, title });

    return { sent: true };
  }

  /**
   * ✅ Example 5: List with status keys
   */
  @Get('bookings')
  async getBookings() {
    return {
      data: [
        {
          id: '1',
          status: 'booking.status.pending', // ✅ KEY
          type: 'booking.type.consultation', // ✅ KEY
        },
        {
          id: '2',
          status: 'booking.status.confirmed', // ✅ KEY
          type: 'booking.type.appointment', // ✅ KEY
        },
      ],
    };
  }

  /**
   * ✅ Example 6: Export file - Backend translates
   */
  @Get('export/students')
  async exportStudents() {
    const lang = 'vi'; // Get from Accept-Language header

    const headers = [
      await this.i18n.translate('export.student.name', { lang }),
      await this.i18n.translate('export.student.email', { lang }),
      await this.i18n.translate('export.student.status', { lang }),
    ];

    // Generate Excel/PDF with translated headers
    return { headers };
  }
}

/**
 * 🎯 KEY POINTS:
 *
 * 1. API Response Structure:
 *    {
 *      "status": "student.status.active"  // ✅ KEY for FE to translate
 *    }
 *
 * 2. Error Response Structure:
 *    {
 *      "statusCode": 404,
 *      "errorKey": "error.student.notFound",  // ✅ KEY for FE
 *      "timestamp": "2024-..."
 *    }
 *
 * 3. Backend ONLY translates for:
 *    - Emails
 *    - Push notifications
 *    - Export files (Excel, PDF, PPTX)
 *    - Audit logs
 *
 * 4. Key Format Convention:
 *    domain.feature.action
 *
 *    Examples:
 *    - student.status.active
 *    - error.auth.invalidPassword
 *    - mail.welcome.subject
 *    - booking.type.consultation
 */
