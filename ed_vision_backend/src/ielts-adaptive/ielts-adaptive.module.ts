import { Module } from '@nestjs/common';
import { IeltsAdaptiveController } from './ielts-adaptive.controller';
import { IeltsAdaptiveService } from './services/ielts-adaptive.service';
import { BandEstimationService } from './services/band-estimation.service';
import { EvaluationService } from './services/evaluation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [IeltsAdaptiveController],
  providers: [
    IeltsAdaptiveService,
    BandEstimationService,
    EvaluationService,
    PrismaService,
  ],
  exports: [IeltsAdaptiveService],
})
export class IeltsAdaptiveModule {}
