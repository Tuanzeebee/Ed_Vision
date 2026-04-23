import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class StartRoomTimerDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds!: number;
}
