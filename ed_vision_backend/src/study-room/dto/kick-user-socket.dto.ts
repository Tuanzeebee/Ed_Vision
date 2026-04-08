import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class KickUserSocketDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetUserId!: number;
}
