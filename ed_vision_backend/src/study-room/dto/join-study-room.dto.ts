import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class JoinStudyRoomDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  password?: string;

  @IsOptional()
  @IsBoolean()
  micOn?: boolean;

  @IsOptional()
  @IsBoolean()
  cameraOn?: boolean;
}
