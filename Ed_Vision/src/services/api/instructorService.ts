import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface InstructorOnlineStats {
  onlineCount: number;
  totalCount: number;
}

export interface InstructorProfile {
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  avatarUrl?: string;
}

export interface InstructorDepartment {
  departmentId: number;
  departmentName: string;
  departmentCode?: string;
}

export interface Instructor {
  instructorId: number;
  accountId: number;
  employeeCode: string;
  email: string;
  academicTitle?: string;
  position?: string;
  status: string;
  advisingClassCount?: number;
  createdAt: string;
  profile?: InstructorProfile;
  department?: InstructorDepartment;
}

export interface InstructorListResponse {
  data: Instructor[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface InstructorFilterParams {
  search?: string;
  departmentId?: number;
  academicTitle?: string;
  position?: string;
  status?: string;
  page?: number;
  limit?: number;
}

const instructorService = {
  async getOnlineStats(): Promise<InstructorOnlineStats> {
    const response = await axios.get<InstructorOnlineStats>(
      `${API_BASE_URL}/admin/instructors/stats/online`
    );
    return response.data;
  },

  async getInstructors(params?: InstructorFilterParams): Promise<InstructorListResponse> {
    const response = await axios.get<InstructorListResponse>(
      `${API_BASE_URL}/admin/instructors`,
      { params }
    );
    return response.data;
  },
};

export default instructorService;
