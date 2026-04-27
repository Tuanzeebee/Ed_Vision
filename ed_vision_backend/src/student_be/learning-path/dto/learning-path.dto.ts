import { IsNumber, IsString, IsArray, ValidateNested, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class DiagnosticAnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  skill: string; // e.g. 'Listening', 'Reading'

  @IsString()
  subSkill: string; // e.g. 'Grammar', 'Vocabulary', 'Part 1', etc.

  @IsNumber()
  difficulty: number; // e.g. 1 (easy) to 5 (hard)

  @IsBoolean()
  isCorrect: boolean;

  @IsNumber()
  timeSpentSeconds: number;

  @IsNumber()
  expectedTimeSeconds: number;

  @IsNumber()
  @IsOptional()
  answerChanges?: number; // how many times user changed answer
}

export class DiagnosticAnalyzeRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosticAnswerDto)
  answers: DiagnosticAnswerDto[];

  @IsNumber()
  targetScore: number;

  @IsNumber()
  @IsOptional()
  currentScore?: number;

  @IsNumber()
  @IsOptional()
  selectedBand?: number; // Target band for this specific diagnostic test (e.g. 200, 300, 400, 500)
}

export class RecommendPlanRequestDto {
  @IsString()
  studentId: string;

  @IsNumber()
  targetScore: number;

  @IsNumber()
  hoursPerWeek: number;

  @IsNumber()
  weeksUntilExam: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredStudyDays?: string[];
}
