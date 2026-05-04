import { Module } from '@nestjs/common';
import { AdaptiveService } from './adaptive.service';
import { SpeakingService } from './speaking.service';
import { PlacementController } from './placement.controller';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  providers: [AdaptiveService, SpeakingService],
  controllers: [PlacementController],
})
export class PlacementModule {}
