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
import { CreateStudyRoomDto } from './dto/create-study-room.dto';
import { ListStudyRoomsDto } from './dto/list-study-rooms.dto';
import { VerifyStudyRoomAccessDto } from './dto/verify-study-room-access.dto';
import { StudyRoomService } from './study-room.service';

@Controller('study-rooms')
@UseGuards(DevAuthGuard)
export class StudyRoomController {
  constructor(private readonly studyRoomService: StudyRoomService) {}

  @Post()
  async createRoom(
    @GetUser('account_id') accountId: number,
    @Body() dto: CreateStudyRoomDto,
  ) {
    return this.studyRoomService.createRoom(accountId, dto);
  }

  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.studyRoomService.getLeaderboard(
      parsedLimit !== undefined && Number.isNaN(parsedLimit)
        ? undefined
        : parsedLimit,
    );
  }

  @Get('me/stats')
  async getMyStudyStats(@GetUser('account_id') accountId: number) {
    return this.studyRoomService.getMyStudyStats(accountId);
  }

  @Get()
  async listRooms(
    @GetUser('account_id') accountId: number,
    @Query() query: ListStudyRoomsDto,
  ) {
    return this.studyRoomService.listRooms(accountId, query);
  }

  @Post(':roomId/access')
  async verifyRoomAccess(
    @GetUser('account_id') accountId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() dto: VerifyStudyRoomAccessDto,
  ) {
    return this.studyRoomService.verifyRoomAccess(
      accountId,
      roomId,
      dto.password,
    );
  }

  @Get(':roomId')
  async getRoomById(
    @GetUser('account_id') accountId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.studyRoomService.getRoomById(accountId, roomId);
  }
}
