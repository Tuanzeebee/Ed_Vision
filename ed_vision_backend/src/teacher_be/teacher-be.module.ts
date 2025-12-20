import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClassManagementModule } from './class-management/class-management.module';
import { GradeManagementModule } from './grade-management/grade-management.module';
import { ProgressTrackingModule } from './progress-tracking/progress-tracking.module';
import { ReportsModule } from './reports/reports.module';
import { MessagesModule } from './messages/messages.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SurveysModule } from './surveys/surveys.module';
import { PredictionModule } from './prediction/prediction.module';
import { MeetingLogsModule } from './meeting-logs/meeting-logs.module';
import { AcademicDataModule } from './academic-data/academic-data.module';
import { GradeStructureModule } from './grade-structure/grade-structure.module';
import { GpaMetricsModule } from './gpa-metrics/gpa-metrics.module';

@Module({
    imports: [
        DashboardModule,
        ClassManagementModule,
        GradeManagementModule,
        ProgressTrackingModule,
        ReportsModule,
        MessagesModule,
        AppointmentsModule,
        SurveysModule,
        PredictionModule,
        MeetingLogsModule,
        AcademicDataModule,
        GradeStructureModule,
        GpaMetricsModule,
    ],
    exports: [
        DashboardModule,
        ClassManagementModule,
        GradeManagementModule,
        ProgressTrackingModule,
        ReportsModule,
        MessagesModule,
        AppointmentsModule,
        SurveysModule,
        PredictionModule,
        MeetingLogsModule,
        AcademicDataModule,
        GradeStructureModule,
        GpaMetricsModule,
    ],
})
export class TeacherBeModule {}
