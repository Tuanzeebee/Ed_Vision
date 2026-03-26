import { Module } from '@nestjs/common';
import { StudentSurveyController } from './student-survey.controller';
import { StudentSurveyService } from './student-survey.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeminiModule } from '../../common/services/gemini.module';

@Module({
  imports: [PrismaModule, GeminiModule],
  controllers: [StudentSurveyController],
  providers: [StudentSurveyService],
  exports: [StudentSurveyService],
})
export class StudentSurveyModule {}
