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
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    PrismaModule,
    InstructorAvailabilityModule,
    BookingModule,
    AuthModule,
    RolePermissionsModule,
    AccountManagementModule,
    StudentManagementModule,
    InstructorManagementModule,
    SurveyManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
