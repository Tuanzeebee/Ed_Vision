import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsString()
  timeSlot: string;

  @IsNotEmpty()
  @IsString()
  purpose: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateAppointmentStatusDto {
  @IsNotEmpty()
  @IsEnum(['confirmed', 'rejected', 'completed', 'cancelled'])
  status: 'confirmed' | 'rejected' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AppointmentFilterDto {
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'all'])
  status?:
    | 'pending'
    | 'confirmed'
    | 'rejected'
    | 'completed'
    | 'cancelled'
    | 'all';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}

export class SetAvailabilityDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  timeSlots: string[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  maxAppointments?: number;
}

export class BulkAvailabilityDto {
  @IsNotEmpty()
  @IsArray()
  availabilities: SetAvailabilityDto[];
}

export class RescheduleAppointmentDto {
  @IsNotEmpty()
  @IsDateString()
  newDate: string;

  @IsNotEmpty()
  @IsString()
  newTimeSlot: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
