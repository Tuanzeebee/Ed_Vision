import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ContentType {
  COURSE = 'course',
  LESSON = 'lesson',
  ASSIGNMENT = 'assignment',
  ANNOUNCEMENT = 'announcement',
  RESOURCE = 'resource',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION_REQUIRED = 'revision_required',
}

export class SubmitForApprovalDto {
  @IsEnum(ContentType)
  contentType: ContentType;

  @IsInt()
  @Type(() => Number)
  contentId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ReviewContentDto {
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsString()
  @MaxLength(1000)
  reviewNotes: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  revisionInstructions?: string;
}

export class ContentApprovalFilterDto {
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  submittedBy?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  reviewedBy?: number;

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
