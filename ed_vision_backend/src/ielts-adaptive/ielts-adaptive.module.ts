import { Module } from '@nestjs/common';
import { IeltsAdaptiveController } from './ielts-adaptive.controller';
import { IeltsAdaptiveService } from './services/ielts-adaptive.service';
import { BandEstimationService } from './services/band-estimation.service';
import { EvaluationService } from './services/evaluation.service';
import { IeltsAiGradingService } from './services/ielts-ai-grading.service';
import { IeltsGroqTutorService } from './services/ielts-groq-tutor.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiModule } from '../common/gemini/gemini.module';

@Module({
  imports: [PrismaModule, GeminiModule],
  controllers: [IeltsAdaptiveController],
  providers: [
    IeltsAdaptiveService,
    BandEstimationService,
    EvaluationService,
    PrismaService,
    IeltsAiGradingService,
    IeltsGroqTutorService,
  ],
  exports: [IeltsAdaptiveService, IeltsGroqTutorService],
})
export class IeltsAdaptiveModule {}
