import { Module } from '@nestjs/common';
import { TranscriptUploadModule } from './transcript-upload/transcript-upload.module';
import { StudentSurveyModule } from './survey/student-survey.module';
import { MessagesModule } from './messages/messages.module';
import { CertificateModule } from './certificate/certificate.module';
import { LearningPathModule } from './learning-path/learning-path.module';
import { VocabModule } from './vocab/vocab.module';

@Module({
  imports: [
    TranscriptUploadModule,
    StudentSurveyModule,
    MessagesModule,
    CertificateModule,
    LearningPathModule,
    VocabModule,
  ],
  exports: [
    TranscriptUploadModule,
    StudentSurveyModule,
    MessagesModule,
    CertificateModule,
    LearningPathModule,
    VocabModule,
  ],
})
export class StudentBeModule {}
