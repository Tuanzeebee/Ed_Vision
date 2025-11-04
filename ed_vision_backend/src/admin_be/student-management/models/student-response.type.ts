export interface StudentProfileResponse {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
}

export interface StudentClassInfo {
  classId: number;
  classCode: string;
  programName?: string;
}

export interface StudentResponse {
  studentId: number;
  accountId: number;
  studentCode: string;
  email: string;
  major?: string;
  cohortYear?: number;
  status: string;
  createdAt: string;
  profile?: StudentProfileResponse;
  classInfo?: StudentClassInfo;
}
