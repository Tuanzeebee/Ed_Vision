import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinPublicRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  password?: string;
}
