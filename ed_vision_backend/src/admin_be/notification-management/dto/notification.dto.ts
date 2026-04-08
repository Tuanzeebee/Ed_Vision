import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error',
  ANNOUNCEMENT = 'announcement',
}

export enum NotificationTarget {
  ALL = 'all',
  STUDENTS = 'students',
  INSTRUCTORS = 'instructors',
  PARENTS = 'parents',
  SPECIFIC_USERS = 'specific_users',
}

export class CreateNotificationDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationTarget)
  target: NotificationTarget;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  specificUserIds?: number[];

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class NotificationFilterDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationTarget)
  target?: NotificationTarget;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
