import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsController } from './rooms.controller';
import { StudyRoomController } from './study-room.controller';
import { StudyRoomGateway } from './study-room.gateway';
import { StudyRoomAuthService } from './study-room-auth.service';
import { StudyRoomService } from './study-room.service';
import { StudyRoomStateService } from './study-room-state.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudyRoomController, RoomsController],
  providers: [
    StudyRoomService,
    StudyRoomStateService,
    StudyRoomAuthService,
    StudyRoomGateway,
  ],
  exports: [StudyRoomService],
})
export class StudyRoomModule {}
