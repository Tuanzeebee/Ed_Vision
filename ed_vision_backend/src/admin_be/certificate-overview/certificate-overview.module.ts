import { Module } from '@nestjs/common';
import { CertificateOverviewController } from './certificate-overview.controller';
import { CertificateOverviewService } from './certificate-overview.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CertificateOverviewController],
  providers: [CertificateOverviewService],
  exports: [CertificateOverviewService],
})
export class CertificateOverviewModule {}
