import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsISO8601, Min } from 'class-validator';

export class BanUserSocketDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetUserId!: number;

  @IsOptional()
  @IsISO8601()
  banned_until?: string;
}
