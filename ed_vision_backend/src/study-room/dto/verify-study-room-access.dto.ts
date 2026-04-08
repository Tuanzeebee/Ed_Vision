import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyStudyRoomAccessDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  password?: string;
}
