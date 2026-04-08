import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SyncRoomTimerDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;
}
