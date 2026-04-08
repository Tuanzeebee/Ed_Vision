import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
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

export class CreateStudyRoomDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsIn(STUDY_ROOM_MODES)
  roomMode!: (typeof STUDY_ROOM_MODES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  password?: string;

  @IsOptional()
  @IsIn(STUDY_ROOM_COVER_TYPES)
  coverType?: (typeof STUDY_ROOM_COVER_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(2)
  @Max(100)
  maxParticipants?: number;
}
