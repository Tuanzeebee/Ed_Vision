import { Module } from '@nestjs/common';
import { CertificateModule } from '../../student_be/certificate/certificate.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { TeacherToeicRepositoryController } from './toeic-repository.controller';
import { ToeicListeningImportService } from './toeic-listening-import.service';
import { ToeicPracticeImportService } from './toeic-practice-import.service';
import { DiagnosticImportService } from './diagnostic-import.service';

@Module({
  imports: [CertificateModule, PrismaModule],
  controllers: [TeacherToeicRepositoryController],
  providers: [ToeicListeningImportService, ToeicPracticeImportService, DiagnosticImportService],
})
export class TeacherToeicRepositoryModule {}
