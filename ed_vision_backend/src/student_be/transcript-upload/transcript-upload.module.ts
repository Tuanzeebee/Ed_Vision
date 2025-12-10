import { Module } from '@nestjs/common';
import { TranscriptUploadController } from './transcript-upload.controller';
import { TranscriptUploadService } from './transcript-upload.service';
import { TranscriptPredictionService } from './transcript-prediction.service';
import { GPACalculatorService } from './gpa-calculator.service';
import { SemesterPlanningService } from './semester-planning.service';
import { StudentCacheService } from './student-cache.service';
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
