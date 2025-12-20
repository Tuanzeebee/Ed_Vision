import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveAttemptDto {
  @IsInt()
  attemptId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
