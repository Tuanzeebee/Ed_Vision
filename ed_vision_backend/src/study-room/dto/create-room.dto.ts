import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  STUDY_ROOM_COVER_TYPES,
  STUDY_ROOM_MODES,
} from '../study-room.constants';

export class CreateRoomDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsIn(STUDY_ROOM_MODES)
  room_mode!: (typeof STUDY_ROOM_MODES)[number];

  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(100)
  max_participants!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  password?: string;

  @IsIn(STUDY_ROOM_COVER_TYPES)
  cover_type!: (typeof STUDY_ROOM_COVER_TYPES)[number];

  @IsString()
  @MaxLength(500)
  cover_url!: string;
}
