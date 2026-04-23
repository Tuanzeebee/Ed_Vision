import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/get-user.decorator';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatedRoomResponseDto } from './dto/created-room-response.dto';
import { JoinPublicRoomDto } from './dto/join-public-room.dto';
import { JoinPublicRoomResponseDto } from './dto/join-public-room-response.dto';
import { PublicRoomResponseDto } from './dto/public-room-response.dto';
import { QueryPublicRoomsDto } from './dto/query-public-rooms.dto';
import { StudyRoomService } from './study-room.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly studyRoomService: StudyRoomService) {}

  @Post()
  @UseGuards(DevAuthGuard)
  async createRoom(
    @GetUser('account_id') accountId: number,
    @Body() dto: CreateRoomDto,
  ): Promise<CreatedRoomResponseDto> {
    return this.studyRoomService.createPublicRoom(accountId, dto);
  }

  @Post(':id/join')
  @UseGuards(DevAuthGuard)
  async joinRoom(
    @GetUser('account_id') accountId: number,
    @Param('id', ParseIntPipe) roomId: number,
    @Body() dto: JoinPublicRoomDto,
  ): Promise<JoinPublicRoomResponseDto> {
    return this.studyRoomService.joinPublicRoom(accountId, roomId, dto);
  }

  @Get()
  async getPublicRooms(
    @Query() query: QueryPublicRoomsDto,
  ): Promise<PublicRoomResponseDto[]> {
    return this.studyRoomService.getPublicRooms(query);
  }
}
