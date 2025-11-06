import apiClient from './apiClient';

export interface StudentData {
  studentId: number;
  accountId: number;
  studentCode: string;
  email: string;
  status: string;
  cohortYear?: number;
  classId?: number;
  gpa?: number;
  profile?: {
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    avatarUrl?: string;
  };
  department?: {
    name: string;
  };
  program?: {
    programName: string;
  };
}

export interface StudentListResponse {
  data: StudentData[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface StudentFilterDto {
  search?: string;
  department?: string;
  program?: string;
  cohortYear?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface StatusOption {
  code: string;
  name: string;
}

export interface FilterOptions {
  departments: string[];
  programs: { name: string; department: string }[];
  statuses: StatusOption[];
}

export interface StudentOnlineStats {
  onlineCount: number;
  totalCount: number;
}

export const studentService = {
  async getOnlineStats(): Promise<StudentOnlineStats> {
    const response = await apiClient.get<StudentOnlineStats>('/admin/students/stats/online');
    return response.data;
  },

  async getFilterOptions(): Promise<FilterOptions> {
    const response = await apiClient.get('/admin/students/filters/options');
    return response.data;
  },

  async getStudents(filters: StudentFilterDto): Promise<StudentListResponse> {
    const response = await apiClient.get('/admin/students', {
      params: filters
    });
    return response.data;
  },

  async getStudentById(id: number): Promise<StudentData> {
    const response = await apiClient.get(`/admin/students/${id}`);
    return response.data;
  }
};
