import { Module } from '@nestjs/common';
import { TranscriptUploadModule } from './transcript-upload/transcript-upload.module';
import { StudentSurveyModule } from './survey/student-survey.module';
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [TranscriptUploadModule, StudentSurveyModule, MessagesModule],
  exports: [TranscriptUploadModule, StudentSurveyModule, MessagesModule],
})
export class StudentBeModule {}
