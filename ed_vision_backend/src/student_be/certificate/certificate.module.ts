import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CertificateEnrollmentController } from './certificate-enrollment.controller';
import { CertificateEnrollmentService } from './certificate-enrollment.service';

@Module({
  imports: [PrismaModule],
  controllers: [CertificateEnrollmentController],
  providers: [CertificateEnrollmentService],
  exports: [CertificateEnrollmentService],
})
export class CertificateModule {}
