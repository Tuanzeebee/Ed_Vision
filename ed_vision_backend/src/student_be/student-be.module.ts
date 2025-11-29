import { Module } from '@nestjs/common';
import { TranscriptUploadModule } from './transcript-upload/transcript-upload.module';

@Module({
  imports: [TranscriptUploadModule],
  exports: [TranscriptUploadModule],
})
export class StudentBeModule {}
