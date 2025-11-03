export interface InstructorProfileResponse {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
}

export interface InstructorDepartmentInfo {
  departmentId: number;
  departmentName: string;
  departmentCode?: string;
}

export interface InstructorResponse {
  instructorId: number;
  accountId: number;
  employeeCode: string;
  email: string;
  academicTitle?: string;
  position?: string;
  status: string;
  createdAt: string;
  profile?: InstructorProfileResponse;
  department?: InstructorDepartmentInfo;
}
