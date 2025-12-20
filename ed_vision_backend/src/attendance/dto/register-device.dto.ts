import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class RegisterDeviceDto {
  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  screenResolution?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsNumber()
  hardwareConcurrency?: number;

  @IsOptional()
  @IsNumber()
  deviceMemory?: number;

  @IsOptional()
  @IsString()
  canvasFingerprint?: string;

  @IsOptional()
  @IsString()
  webglFingerprint?: string;
}
