import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CertificateEnrollmentController } from './certificate-enrollment.controller';
import { CertificateEnrollmentService } from './certificate-enrollment.service';
import { ToeicExplanationPrefetchService } from './toeic-explanation-prefetch.service';

@Module({
  imports: [PrismaModule],
  controllers: [CertificateEnrollmentController],
  providers: [CertificateEnrollmentService, ToeicExplanationPrefetchService],
  exports: [CertificateEnrollmentService],
})
export class CertificateModule {}
