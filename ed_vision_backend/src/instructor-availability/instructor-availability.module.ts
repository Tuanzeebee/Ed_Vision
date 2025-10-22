import { Module } from '@nestjs/common';
import { InstructorAvailabilityController } from './instructor-availability.controller';
import { InstructorAvailabilityService } from './instructor-availability.service';
import { InstructorAvailabilityRepository } from './instructor-availability.repository';
import { DebugController } from './test-debug.controller';

@Module({
  controllers: [InstructorAvailabilityController, DebugController],
  providers: [
    InstructorAvailabilityService,
    InstructorAvailabilityRepository,
  ],
  exports: [InstructorAvailabilityService],
})
export class InstructorAvailabilityModule {}

