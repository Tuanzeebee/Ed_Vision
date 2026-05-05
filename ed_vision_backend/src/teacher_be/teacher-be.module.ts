import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClassManagementModule } from './class-management/class-management.module';
import { GradeManagementModule } from './grade-management/grade-management.module';
import { ReportsModule } from './reports/reports.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SurveysModule } from './surveys/surveys.module';
import { PredictionModule } from './prediction/prediction.module';
import { MeetingLogsModule } from './meeting-logs/meeting-logs.module';
import { AcademicDataModule } from './academic-data/academic-data.module';
import { GradeStructureModule } from './grade-structure/grade-structure.module';
import { GpaMetricsModule } from './gpa-metrics/gpa-metrics.module';
import { TeacherToeicRepositoryModule } from './toeic-repository/toeic-repository.module';
import { IeltsRepositoryModule } from './ielts-repository/ielts-repository.module';

@Module({
  imports: [
    DashboardModule,
    ClassManagementModule,
    GradeManagementModule,
    ReportsModule,
    AppointmentsModule,
    SurveysModule,
    PredictionModule,
    MeetingLogsModule,
    AcademicDataModule,
    GradeStructureModule,
    GpaMetricsModule,
    TeacherToeicRepositoryModule,
    IeltsRepositoryModule,
  ],
  exports: [
    DashboardModule,
    ClassManagementModule,
    GradeManagementModule,
    ReportsModule,
    AppointmentsModule,
    SurveysModule,
    PredictionModule,
    MeetingLogsModule,
    AcademicDataModule,
    GradeStructureModule,
    GpaMetricsModule,
    TeacherToeicRepositoryModule,
    IeltsRepositoryModule,
  ],
})
export class TeacherBeModule {}
