import { Module } from '@nestjs/common';
import { StudentSurveyController } from './student-survey.controller';
import { StudentSurveyService } from './student-survey.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentSurveyController],
  providers: [StudentSurveyService],
  exports: [StudentSurveyService],
})
export class StudentSurveyModule {}
