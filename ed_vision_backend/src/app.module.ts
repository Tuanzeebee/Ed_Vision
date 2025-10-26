import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InstructorAvailabilityModule } from './instructor-availability/instructor-availability.module';
import { AuthModule } from './auth/auth.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';

@Module({
  imports: [
    PrismaModule,
    InstructorAvailabilityModule,
    AuthModule,
    RolePermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
