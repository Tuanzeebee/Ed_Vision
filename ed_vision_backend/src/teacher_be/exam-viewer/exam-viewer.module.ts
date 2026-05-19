import { Module } from '@nestjs/common';
import { ExamViewerController } from './exam-viewer.controller';
import { ExamViewerService } from './exam-viewer.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExamViewerController],
  providers: [ExamViewerService],
  exports: [ExamViewerService],
})
export class ExamViewerModule {}
