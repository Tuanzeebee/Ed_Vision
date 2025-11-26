import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectAppointmentDto {
  @IsNotEmpty()
  @IsString()
  reason: string; // Required reason for rejection

  @IsOptional()
  @IsString()
  suggestedDate?: string; // Optional suggested date

  @IsOptional()
  @IsString()
  suggestedTime?: string; // Optional suggested time

  @IsOptional()
  @IsString()
  notes?: string; // Optional additional notes
}
