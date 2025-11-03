import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum StatisticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class StatisticsFilterDto {
  @IsOptional()
  @IsEnum(StatisticsPeriod)
  period?: StatisticsPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  departmentId?: number;

  @IsOptional()
  roleId?: number;
}
