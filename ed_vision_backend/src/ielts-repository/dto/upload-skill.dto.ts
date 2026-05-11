import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean, IsUrl, Min, Max } from 'class-validator';

export enum SkillType {
  READING = 'reading',
  LISTENING = 'listening',
  WRITING = 'writing',
  SPEAKING = 'speaking',
}

// ── Reading ──────────────────────────────────────────────────────────────────

export class UploadReadingDto {
  @IsEnum(SkillType)
  skill: SkillType.READING;

  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(9)
  targetBand?: number;

  @IsOptional()
  @IsBoolean()
  isPlacement?: boolean;

  @IsOptional()
  @IsString()
  testId?: string;
}

// ── Listening ────────────────────────────────────────────────────────────────

export class UploadListeningDto {
  @IsEnum(SkillType)
  skill: SkillType.LISTENING;

  @IsUrl()
  audioUrl: string;

  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(9)
  targetBand?: number;

  @IsOptional()
  @IsBoolean()
  isPlacement?: boolean;

  @IsOptional()
  @IsString()
  testId?: string;
}

// ── Writing ──────────────────────────────────────────────────────────────────

export class UploadWritingDto {
  @IsEnum(SkillType)
  skill: SkillType.WRITING;

  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(9)
  targetBand?: number;

  @IsOptional()
  @IsBoolean()
  isPlacement?: boolean;
}

// ── Speaking ─────────────────────────────────────────────────────────────────

export class UploadSpeakingDto {
  @IsEnum(SkillType)
  skill: SkillType.SPEAKING;

  @IsOptional()
  @IsNumber()
  @Min(4)
  @Max(9)
  targetBand?: number;

  @IsOptional()
  @IsBoolean()
  isPlacement?: boolean;
}

// ── Answer Key ───────────────────────────────────────────────────────────────

export class UploadAnswerKeyDto {
  @IsString()
  testId: string;

  @IsEnum(SkillType)
  skill: SkillType;
}

export type UploadSkillDto =
  | UploadReadingDto
  | UploadListeningDto
  | UploadWritingDto
  | UploadSpeakingDto;
