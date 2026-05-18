import { Module } from '@nestjs/common';
import { IeltsAdaptiveController } from './ielts-adaptive.controller';
import { IeltsSpeakingController } from './ielts-speaking.controller';
import { IeltsAdaptiveService } from './services/ielts-adaptive.service';
import { BandEstimationService } from './services/band-estimation.service';
import { EvaluationService } from './services/evaluation.service';
import { IeltsAiGradingService } from './services/ielts-ai-grading.service';
import { IeltsGroqTutorService } from './services/ielts-groq-tutor.service';
import { GroqWhisperService } from '../common/groq/groq-whisper.service';
import { GroqGradingService } from '../common/groq/groq-grading.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiModule } from '../common/gemini/gemini.module';
import { OpenRouterModule } from '../common/services/openrouter.module';
import { ProgramEffectivenessModule } from '../admin_be/program-effectiveness/program-effectiveness.module';
import { StreakTrackerService } from '../study-room/services/streak-tracker.service';

@Module({
  imports: [PrismaModule, GeminiModule, OpenRouterModule, ProgramEffectivenessModule],
  controllers: [IeltsAdaptiveController, IeltsSpeakingController],
  providers: [
    IeltsAdaptiveService,
    BandEstimationService,
    EvaluationService,
    PrismaService,
    IeltsAiGradingService,
    IeltsGroqTutorService,
    GroqWhisperService,
    GroqGradingService,
    StreakTrackerService,
  ],
  exports: [IeltsAdaptiveService, IeltsGroqTutorService],
})
export class IeltsAdaptiveModule {}
