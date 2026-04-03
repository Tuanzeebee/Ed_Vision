import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { GpaMetricsController } from './gpa-metrics.controller';
import { GpaMetricsService } from './gpa-metrics.service';
import { TranscriptUploadModule } from '../../student_be/transcript-upload/transcript-upload.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    // Reuse GPA calculator logic from student module
    TranscriptUploadModule,
  ],
  controllers: [GpaMetricsController],
  providers: [GpaMetricsService],
  exports: [GpaMetricsService],
})
export class GpaMetricsModule {}
