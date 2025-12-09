import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Types
export interface AcademicYear {
  academic_year: string;
  available_semesters: number[]; // 1, 2, 3 (1=Kỳ 1, 2=Kỳ 2, 3=Kỳ Hè)
}

export interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  displayName: string; // "IT4320 - Requirement Engineering (3 TC)"
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API Service
export const academicDataService = {
  /**
   * Lấy danh sách năm học và học kỳ có sẵn
   */
  async getAcademicYears(): Promise<AcademicYear[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<ApiResponse<AcademicYear[]>>(
        `${API_BASE_URL}/teacher/academic-data/academic-years`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      }
      
      console.error('Failed to fetch academic years:', response.data.message);
      return [];
    } catch (error) {
      console.error('Error fetching academic years:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách môn học
   */
  async getCourses(): Promise<Course[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<ApiResponse<Course[]>>(
        `${API_BASE_URL}/teacher/academic-data/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      }
      
      console.error('Failed to fetch courses:', response.data.message);
      return [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  },
};
