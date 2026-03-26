import { Module } from '@nestjs/common';
import { TranscriptUploadModule } from './transcript-upload/transcript-upload.module';
import { StudentSurveyModule } from './survey/student-survey.module';
import { MessagesModule } from './messages/messages.module';
import { CertificateModule } from './certificate/certificate.module';

@Module({
  imports: [TranscriptUploadModule, StudentSurveyModule, MessagesModule, CertificateModule],
  exports: [TranscriptUploadModule, StudentSurveyModule, MessagesModule, CertificateModule],
})
export class StudentBeModule {}
