import { IsEnum } from 'class-validator';

export enum CertificateType {
  IELTS = 'ielts',
  TOEIC = 'toeic',
}

export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum LearningStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  AT_RISK = 'at-risk',
}

export class StudentDirectoryFilterDto {
  search?: string;
  certType?: CertificateType;
  learningStatus?: LearningStatus;
  riskLevel?: RiskLevel;
  department?: string;
  cohortYear?: number;
  page: number = 1;
  limit: number = 10;
  sortBy: string = 'student_id';
  sortOrder: 'asc' | 'desc' = 'desc';
}
