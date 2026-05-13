import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InstructorAvailabilityModule } from './instructor-availability/instructor-availability.module';
import { AuthModule } from './auth/auth.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { AccountManagementModule } from './admin_be/account-management/account-management.module';
import { StudentManagementModule } from './admin_be/student-management/student-management.module';
import { InstructorManagementModule } from './admin_be/instructor-management/instructor-management.module';
import { SurveyManagementModule } from './admin_be/survey-management/survey-management.module';
import { QuestionManagementModule } from './admin_be/question-management/question-management.module';
import { StatisticsOverviewModule } from './admin_be/statistics-overview/statistics-overview.module';
import { UsageBehaviorModule } from './admin_be/usage-behavior/usage-behavior.module';
import { CertificateOverviewModule } from './admin_be/certificate-overview/certificate-overview.module';
import { NotificationModule } from './admin_be/notification/notification.module';
import { BookingModule } from './booking/booking.module';
import { ClassManagementModule } from './teacher_be/class-management/class-management.module';
import { SurveysModule } from './teacher_be/surveys/surveys.module';
import { TeacherBeModule } from './teacher_be/teacher-be.module';
import { StudentBeModule } from './student_be/student-be.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './mongodb/database.module';
import { ProfileModule } from './profile/profile.module';
import { TeacherChatModule } from './teacher_be/chat/teacher-chat.module';
import { StudentChatModule } from './student_be/chat/student-chat.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ChatModule } from './mongodb/chat.module';
import { ReminderSchedulerService } from './admin_be/notification/reminder-scheduler.service';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';
import { existsSync } from 'fs';
import { YouTubeMusicModule } from './youtube-music/youtube-music.module';
import { TtsModule } from './tts/tts.module';
import { SttModule } from './stt/stt.module';
import { RedisModule } from './redis/redis.module';
import { StudyRoomModule } from './study-room/study-room.module';
import { MongooseModule } from '@nestjs/mongoose';
import { IeltsAdaptiveModule } from './ielts-adaptive/ielts-adaptive.module';
import { PlacementModule } from './placement/placement.module';
import { IeltsRepositoryModule } from './ielts-repository/ielts-repository.module';

function resolveI18nPath(): string {
  const candidatePaths = [
    path.join(process.cwd(), 'src', 'i18n'),
    path.join(__dirname, 'i18n'),
  ];

  const found = candidatePaths.find((candidatePath) =>
    existsSync(candidatePath),
  );
  return found ?? path.join(process.cwd(), 'src', 'i18n');
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // i18n Configuration
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: resolveI18nPath(),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    PrismaModule,
    InstructorAvailabilityModule,
    BookingModule,
    AuthModule,
    RolePermissionsModule,
    ProfileModule,
    AccountManagementModule,
    StudentManagementModule,
    InstructorManagementModule,
    SurveyManagementModule,
    QuestionManagementModule,
    StatisticsOverviewModule,
    UsageBehaviorModule,
    CertificateOverviewModule,
    NotificationModule,
    ClassManagementModule,
    SurveysModule,
    TeacherBeModule,
    StudentBeModule,
    DatabaseModule,
    RedisModule,
    ChatModule,
    TeacherChatModule,
    StudentChatModule,
    AttendanceModule,
    StudyRoomModule,
    IeltsAdaptiveModule,
    PlacementModule,
    YouTubeMusicModule,
    IeltsRepositoryModule,
    TtsModule,
    SttModule,
  ],
  controllers: [AppController],
  providers: [AppService, ReminderSchedulerService],
})
export class AppModule {
  constructor(private readonly reminderScheduler: ReminderSchedulerService) {
    // Inject to ensure instantiation
  }
}
