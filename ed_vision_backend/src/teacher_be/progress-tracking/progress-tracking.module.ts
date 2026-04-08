import { Module } from '@nestjs/common';
import { ProgressTrackingController } from './progress-tracking.controller';
import { ProgressTrackingService } from './progress-tracking.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressTrackingController],
  providers: [ProgressTrackingService],
  exports: [ProgressTrackingService],
})
export class ProgressTrackingModule {}
