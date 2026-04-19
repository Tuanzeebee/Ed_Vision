import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { STUDY_ROOM_MODES } from '../study-room.constants';

export class QueryPublicRoomsDto {
  @IsOptional()
  @IsIn(STUDY_ROOM_MODES)
  room_mode?: (typeof STUDY_ROOM_MODES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
