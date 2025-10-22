import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { InstructorAvailabilityModule } from './instructor-availability/instructor-availability.module';

@Module({
  imports: [
    PrismaModule,
    InstructorAvailabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
