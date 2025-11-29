import { Module } from '@nestjs/common';
import { TranscriptUploadController } from './transcript-upload.controller';
import { TranscriptUploadService } from './transcript-upload.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TranscriptUploadController],
  providers: [TranscriptUploadService],
  exports: [TranscriptUploadService],
})
export class TranscriptUploadModule {}
