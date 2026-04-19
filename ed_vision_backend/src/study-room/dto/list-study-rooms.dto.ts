import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_STUDY_ROOM_PAGE_SIZE,
  MAX_STUDY_ROOM_PAGE_SIZE,
  STUDY_ROOM_MODES,
} from '../study-room.constants';

const transformBoolean = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }

    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  return value;
};

export class ListStudyRoomsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(STUDY_ROOM_MODES)
  roomMode?: (typeof STUDY_ROOM_MODES)[number];

  @IsOptional()
  @Transform(transformBoolean)
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_STUDY_ROOM_PAGE_SIZE)
  limit = DEFAULT_STUDY_ROOM_PAGE_SIZE;
}
