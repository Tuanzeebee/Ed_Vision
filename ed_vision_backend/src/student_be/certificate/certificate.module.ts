import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { CertificateEnrollmentController } from './certificate-enrollment.controller';
import { CertificateEnrollmentService } from './certificate-enrollment.service';
import { ToeicExplanationPrefetchService } from './toeic-explanation-prefetch.service';
import { PracticeExplanationService } from './practice-explanation.service';
import { ToeicPracticeSessionService } from './toeic-practice-session.service';
import { ToeicDiagnosticService } from './toeic-diagnostic.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [CertificateEnrollmentController],
  providers: [
    CertificateEnrollmentService,
    ToeicExplanationPrefetchService,
    PracticeExplanationService,
    ToeicPracticeSessionService,
    ToeicDiagnosticService,
  ],
  exports: [
    CertificateEnrollmentService,
    PracticeExplanationService,
    ToeicPracticeSessionService,
    ToeicDiagnosticService,
  ],
})
export class CertificateModule {}
