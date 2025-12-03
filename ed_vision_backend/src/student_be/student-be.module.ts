import { Module } from '@nestjs/common';
import { TranscriptUploadModule } from './transcript-upload/transcript-upload.module';
import { StudentSurveyModule } from './survey/student-survey.module';

@Module({
  imports: [TranscriptUploadModule, StudentSurveyModule],
  exports: [TranscriptUploadModule, StudentSurveyModule],
})
export class StudentBeModule {}
