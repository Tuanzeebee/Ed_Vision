import { Module } from '@nestjs/common';
import { IeltsRepositoryService } from './ielts-repository.service';
import { IeltsRepositoryController } from './ielts-repository.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenRouterModule } from '../common/services/openrouter.module';
import { IrtRefinementService } from './services/irt-refinement.service';
import { QuestionUploadService } from './services/question-upload.service';
import { IeltsStorageService } from './services/storage.service';
import { IrtRecalibrationService } from './services/irt-recalibration.service';

@Module({
  imports: [PrismaModule, OpenRouterModule],
  controllers: [IeltsRepositoryController],
  providers: [
    IeltsRepositoryService,
    IrtRefinementService,
    QuestionUploadService,
    IeltsStorageService,
    IrtRecalibrationService,
  ],
  exports: [IeltsRepositoryService, QuestionUploadService, IrtRecalibrationService, IrtRefinementService],
})
export class IeltsRepositoryModule {}
