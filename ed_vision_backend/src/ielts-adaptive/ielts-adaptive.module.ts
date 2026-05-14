import { Module } from '@nestjs/common';
import { IeltsAdaptiveController } from './ielts-adaptive.controller';
import { IeltsAdaptiveService } from './services/ielts-adaptive.service';
import { BandEstimationService } from './services/band-estimation.service';
import { EvaluationService } from './services/evaluation.service';
import { IeltsAiGradingService } from './services/ielts-ai-grading.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiModule } from '../common/gemini/gemini.module';
import { ProgramEffectivenessModule } from '../admin_be/program-effectiveness/program-effectiveness.module';

@Module({
  imports: [PrismaModule, GeminiModule, ProgramEffectivenessModule],
  controllers: [IeltsAdaptiveController],
  providers: [
    IeltsAdaptiveService,
    BandEstimationService,
    EvaluationService,
    PrismaService,
    IeltsAiGradingService,
  ],
  exports: [IeltsAdaptiveService],
})
export class IeltsAdaptiveModule {}
