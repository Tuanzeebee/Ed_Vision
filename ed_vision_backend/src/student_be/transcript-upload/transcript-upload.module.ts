import { Module } from '@nestjs/common';
import { TranscriptUploadController } from './transcript-upload.controller';
import { TranscriptUploadService } from './transcript-upload.service';
import { TranscriptPredictionService, GPACalculatorService, SemesterPlanningService, StudentCacheService } from './logic';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TranscriptUploadController],
  providers: [
    TranscriptUploadService, 
    TranscriptPredictionService,
    GPACalculatorService,
    SemesterPlanningService,
    StudentCacheService,
  ],
  exports: [TranscriptUploadService, GPACalculatorService, SemesterPlanningService],
})
export class TranscriptUploadModule {}
