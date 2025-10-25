import { IsNotEmpty, IsDateString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTimeSlotDto } from './create-time-slot.dto';

export class AddAvailabilityDateDto {
  @IsNotEmpty()
  @IsDateString()
  date: string; // Format: YYYY-MM-DD

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTimeSlotDto)
  timeSlots?: CreateTimeSlotDto[];
}

