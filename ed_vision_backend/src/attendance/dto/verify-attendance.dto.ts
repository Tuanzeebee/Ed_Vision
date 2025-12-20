import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsIP,
  IsInt,
} from 'class-validator';

export class VerifyAttendanceDto {
  @IsString()
  sessionId: string;

  @IsString()
  qrToken: string;

  @IsInt()
  accountId: number;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @IsOptional()
  @IsIP()
  clientIp?: string;

  @IsOptional()
  @IsString()
  wifiSsid?: string;

  @IsOptional()
  @IsNumber()
  gpsLatitude?: number;

  @IsOptional()
  @IsNumber()
  gpsLongitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gpsAccuracy?: number; // meters

  @IsOptional()
  @IsNumber()
  @Min(0)
  scanDuration?: number; // milliseconds

  @IsOptional()
  @IsString()
  typingPattern?: string;

  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean; // GPS consent
}
