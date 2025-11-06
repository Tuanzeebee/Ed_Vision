import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateTimeSlotDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;

  @IsNotEmpty()
  @IsEnum(['online', 'offline', 'both'])
  meetingType: 'online' | 'offline' | 'both';

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(100)
  capacity: number;

  @IsOptional()
  @IsString()
  note?: string;
}
