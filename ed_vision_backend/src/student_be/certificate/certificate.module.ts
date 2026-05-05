import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CertificateEnrollmentController } from './certificate-enrollment.controller';
import { CertificateEnrollmentService } from './certificate-enrollment.service';
import { ToeicExplanationPrefetchService } from './toeic-explanation-prefetch.service';
import { PracticeExplanationService } from './practice-explanation.service';
import { ToeicPracticeSessionService } from './toeic-practice-session.service';
import { ToeicDiagnosticService } from './toeic-diagnostic.service';
import { ToeicExamSessionService } from './toeic-exam-session.service';
import { StudyRoomModule } from '../../study-room/study-room.module';

@Module({
  imports: [PrismaModule, StudyRoomModule],
  controllers: [CertificateEnrollmentController],
  providers: [
    CertificateEnrollmentService,
    ToeicExplanationPrefetchService,
    PracticeExplanationService,
    ToeicPracticeSessionService,
    ToeicDiagnosticService,
    ToeicExamSessionService,
  ],
  exports: [
    CertificateEnrollmentService,
    PracticeExplanationService,
    ToeicPracticeSessionService,
    ToeicDiagnosticService,
    ToeicExamSessionService,
  ],
})
export class CertificateModule {}
