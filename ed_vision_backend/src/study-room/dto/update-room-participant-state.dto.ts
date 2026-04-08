import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateRoomParticipantStateDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @IsOptional()
  @IsBoolean()
  micOn?: boolean;

  @IsOptional()
  @IsBoolean()
  cameraOn?: boolean;

  @IsOptional()
  @IsBoolean()
  handRaised?: boolean;
}
