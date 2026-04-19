import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface GradeColumnPayload {
  name: string;
  key: string;
  maxScore: number;
  weight: number;
  color?: string;
}

export interface CreateGradeStructurePayload {
  academicYear: string;
  semester: number;
  courseCode: string;
  courseName: string;
  credits: number;
  columns: GradeColumnPayload[];
  teacherId?: string;
}

export interface GradeStructureResponse {
  _id: string;
  academicYear: string;
  semester: number;
  courseCode: string;
  courseName: string;
  credits: number;
  columns: GradeColumnPayload[];
  teacherId?: string;
  isActive: boolean;
  totalWeight: number;
  createdAt: string;
  updatedAt: string;
}

const getAuthToken = () => {
  return localStorage.getItem('token') || '';
};

const gradeStructureService = {
  /**
   * Tạo mới cấu trúc bảng điểm
   */
  async createGradeStructure(
    payload: CreateGradeStructurePayload
  ): Promise<{ success: boolean; data: GradeStructureResponse; message: string }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/teacher/grade-structure`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating grade structure:', error);
      throw new Error(
        error.response?.data?.message || 'Không thể tạo cấu trúc bảng điểm');
    }
  },

  /**
   * Lấy danh sách cấu trúc bảng điểm
   */
  async getGradeStructures(filters?: {
    academicYear?: string;
    semester?: number;
    courseCode?: string;
    teacherId?: string;
    isActive?: boolean;
  }): Promise<GradeStructureResponse[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.academicYear) params.append('academicYear', filters.academicYear);
      if (filters?.semester) params.append('semester', filters.semester.toString());
      if (filters?.courseCode) params.append('courseCode', filters.courseCode);
      if (filters?.teacherId) params.append('teacherId', filters.teacherId);
      if (filters?.isActive !== undefined)
        params.append('isActive', filters.isActive.toString());

      const response = await axios.get(
        `${API_BASE_URL}/teacher/grade-structure?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching grade structures:', error);
      return [];
    }
  },

  /**
   * Lấy cấu trúc bảng điểm theo môn học
   */
  async getGradeStructureByCourse(
    academicYear: string,
    semester: number,
    courseCode: string
  ): Promise<GradeStructureResponse | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/teacher/grade-structure/by-course`,
        {
          params: { academicYear, semester, courseCode },
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching grade structure by course:', error);
      return null;
    }
  },

  /**
   * Lấy một cấu trúc bảng điểm theo ID
   */
  async getGradeStructureById(id: string): Promise<GradeStructureResponse | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/teacher/grade-structure/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching grade structure:', error);
      return null;
    }
  },

  /**
   * Cập nhật cấu trúc bảng điểm
   */
  async updateGradeStructure(
    id: string,
    payload: Partial<CreateGradeStructurePayload>): Promise<{ success: boolean; data: GradeStructureResponse; message: string }> {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/teacher/grade-structure/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error updating grade structure:', error);
      throw new Error(
        error.response?.data?.message || 'Không thể cập nhật cấu trúc bảng điểm');
    }
  },

  /**
   * Xóa cấu trúc bảng điểm (soft delete)
   */
  async deleteGradeStructure(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/teacher/grade-structure/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error deleting grade structure:', error);
      throw new Error(
        error.response?.data?.message || 'Không thể xóa cấu trúc bảng điểm');
    }
  },

  /**
   * Lấy danh sách các key đã được sử dụng
   */
  async getUsedColumnKeys(
    academicYear: string,
    semester: number,
    courseCode: string
  ): Promise<string[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/teacher/grade-structure/used-keys`,
        {
          params: { academicYear, semester, courseCode },
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching used column keys:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách courses có sẵn weights (để populate combobox)
   */
  async getAvailableCourses(): Promise<Array<{
    courseCode: string;
    courseName: string;
    academicYear: string;
    semester: number;
    credits: number;
    totalWeight: number;
  }>> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/teacher/grade-structure/courses/available`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching available courses:', error);
      return [];
    }
  },
};

export default gradeStructureService;
