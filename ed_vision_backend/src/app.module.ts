import { Module } from '@nestjs/common';
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
import { StatisticsOverviewModule } from './admin_be/statistics-overview/statistics-overview.module';
import { BookingModule } from './booking/booking.module';
import { ClassManagementModule } from './teacher_be/class-management/class-management.module';
import { SurveysModule } from './teacher_be/surveys/surveys.module';
import { TeacherBeModule } from './teacher_be/teacher-be.module';
import { StudentBeModule } from './student_be/student-be.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './mongodb/database.module';
import { ProfileModule } from './profile/profile.module';
@Module({
  imports: [
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
    StatisticsOverviewModule,
    ClassManagementModule,
    SurveysModule,
    TeacherBeModule,
    StudentBeModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
