import { Type } from 'class-transformer';
import { IsBoolean, IsInt, Min } from 'class-validator';

export class ToggleMediaStateDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId!: number;

  @IsBoolean()
  enabled!: boolean;
}
