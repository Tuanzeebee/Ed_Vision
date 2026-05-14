import { Module } from '@nestjs/common';
import { AdaptiveService } from './adaptive.service';
import { SpeakingService } from './speaking.service';
import { PlacementController } from './placement.controller';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgramEffectivenessModule } from '../admin_be/program-effectiveness/program-effectiveness.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './uploads',
    }),
    ProgramEffectivenessModule,
  ],
  providers: [AdaptiveService, SpeakingService],
  controllers: [PlacementController],
})
export class PlacementModule {}
