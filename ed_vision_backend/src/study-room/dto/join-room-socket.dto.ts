import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class JoinRoomSocketDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;
}
