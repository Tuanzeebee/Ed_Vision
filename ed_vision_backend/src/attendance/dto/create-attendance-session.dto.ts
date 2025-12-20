import { IsInt, IsOptional, Min, Max, ValidateIf } from 'class-validator';

export class CreateAttendanceSessionDto {
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => !o.slotId) // Only required if slotId is not provided
  appointmentId?: number;

  @IsOptional()
  @IsInt()
  @ValidateIf((o) => !o.appointmentId) // Only required if appointmentId is not provided
  slotId?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(10000)
  qrRefreshInterval?: number; // milliseconds

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  qrExpirySeconds?: number;
}
