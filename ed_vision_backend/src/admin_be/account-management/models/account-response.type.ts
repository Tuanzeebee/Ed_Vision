export interface ProfileResponse {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
  nationality?: string;
}

export interface StudentInfo {
  studentCode: string;
  major?: string;
  cohortYear?: number;
  classId?: number;
}

export interface InstructorInfo {
  employeeCode: string;
  academicTitle?: string;
  position?: string;
  departmentId?: number;
  departmentName?: string;
}

export interface ParentInfo {
  parentId: number;
  phoneNumber: string;
  relationshipType?: string;
}

export interface RoleInfo {
  id: number;
  code: string;
  name: string;
}

export interface AccountResponse {
  accountId: number;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  role?: RoleInfo;
  profile?: ProfileResponse;
  student?: StudentInfo;
  instructor?: InstructorInfo;
  parent?: ParentInfo;
}
