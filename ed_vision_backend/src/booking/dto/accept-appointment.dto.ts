import { IsOptional, IsString } from 'class-validator';

export class AcceptAppointmentDto {
  @IsOptional()
  @IsString()
  meetingLink?: string; // Optional meeting link for online meetings

  @IsOptional()
  @IsString()
  meetingLocation?: string; // Optional location for offline meetings

  @IsOptional()
  @IsString()
  notes?: string; // Optional notes from instructor
}
