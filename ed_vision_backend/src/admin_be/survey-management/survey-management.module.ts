import { Module } from '@nestjs/common';
import { SurveyManagementController } from './survey-management.controller';
import { SurveyManagementService } from './survey-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SurveyManagementController],
  providers: [SurveyManagementService],
  exports: [SurveyManagementService],
})
export class SurveyManagementModule {}
