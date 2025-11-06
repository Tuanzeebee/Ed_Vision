import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  slotId: number;

  @IsOptional()
  @IsString()
  meetingPurpose?: string;

  @IsOptional()
  @IsString()
  meetingType?: string; // 'online' | 'offline' or custom

  @IsOptional()
  @IsString()
  meetingLocation?: string;

  @IsOptional()
  @IsInt()
  studentId?: number; // when parent books for a student

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  relationshipToStudent?: string;
}
