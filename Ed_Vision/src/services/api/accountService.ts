import apiClient from './apiClient';

export interface AccountFilterParams {
  search?: string;
  role?: string;
  status?: string;
  school?: string;
  page?: number;
  limit?: number;
}

export interface RoleInfo {
  id: number;
  code: string;
  name: string;
}

export interface ProfileInfo {
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

export interface AccountData {
  accountId: number;
  email: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  role?: RoleInfo;
  profile?: ProfileInfo;
  student?: StudentInfo;
  instructor?: InstructorInfo;
  parent?: ParentInfo;
}

export interface AccountListResponse {
  data: AccountData[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateAccountDto {
  email: string;
  password: string;
  roleCode: string;
  profile: {
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    phoneNumber?: string;
    nationality?: string;
  };
  student?: {
    studentCode: string;
    major?: string;
    cohortYear?: number;
    classId?: number;
  };
  instructor?: {
    employeeCode: string;
    academicTitle?: string;
    position?: string;
    departmentId?: number;
  };
  parent?: {
    phoneNumber: string;
    relationshipType?: string;
  };
}

export interface UpdateAccountDto {
  email?: string;
  password?: string;
  status?: string;
  roleCode?: string;
  profile?: {
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    phoneNumber?: string;
    nationality?: string;
  };
}

class AccountService {
  /**
   * Get all accounts with filters
   */
  async getAccounts(filters: AccountFilterParams): Promise<AccountListResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.school) params.append('school', filters.school);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<AccountListResponse>(
      `/admin/accounts?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get account by ID
   */
  async getAccountById(id: number): Promise<AccountData> {
    const response = await apiClient.get<AccountData>(`/admin/accounts/${id}`);
    return response.data;
  }

  /**
   * Create new account
   */
  async createAccount(data: CreateAccountDto): Promise<AccountData> {
    const response = await apiClient.post<AccountData>('/admin/accounts', data);
    return response.data;
  }

  /**
   * Update account
   */
  async updateAccount(id: number, data: UpdateAccountDto): Promise<AccountData> {
    const response = await apiClient.patch<AccountData>(`/admin/accounts/${id}`, data);
    return response.data;
  }

  /**
   * Delete account
   */
  async deleteAccount(id: number): Promise<void> {
    await apiClient.delete(`/admin/accounts/${id}`);
  }

  /**
   * Lock account (set status to blocked)
   */
  async lockAccount(id: number): Promise<AccountData> {
    return this.updateAccount(id, { status: 'blocked' });
  }

  /**
   * Unlock account (set status to active)
   */
  async unlockAccount(id: number): Promise<AccountData> {
    return this.updateAccount(id, { status: 'active' });
  }
}

export const accountService = new AccountService();
