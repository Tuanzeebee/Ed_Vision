import { Module } from '@nestjs/common';
import { ProgramEffectivenessController } from './program-effectiveness.controller';
import { ProgramEffectivenessService } from './program-effectiveness.service';
import { TestResultRecorderService } from './test-result-recorder.service';
import { ProgramEffectivenessAggregationService } from './program-effectiveness-aggregation.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgramEffectivenessController],
  providers: [
    ProgramEffectivenessService,
    TestResultRecorderService,
    ProgramEffectivenessAggregationService,
  ],
  exports: [ProgramEffectivenessService, TestResultRecorderService],
})
export class ProgramEffectivenessModule {}
