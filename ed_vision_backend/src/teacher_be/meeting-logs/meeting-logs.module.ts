import { Module } from '@nestjs/common';
import { MeetingLogsController } from './meeting-logs.controller';
import { MeetingLogsService } from './meeting-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MeetingLogsController],
  providers: [MeetingLogsService, PrismaService],
  exports: [MeetingLogsService],
})
export class MeetingLogsModule {}
