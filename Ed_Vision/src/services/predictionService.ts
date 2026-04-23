import axios from 'axios';
import { TokenManager } from '../lib/tokenManager';
import cacheService from './cacheService';
import { API_BASE_URL } from '@/services/api/config';

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  STUDENTS: 5 * 60 * 1000,      // 5 minutes - student data
  UPLOAD_LIST: 2 * 60 * 1000,   // 2 minutes - upload history
  SHAP: 10 * 60 * 1000,         // 10 minutes - SHAP explanations (rarely change)
  PREDICTION: 5 * 60 * 1000,    // 5 minutes - prediction results
};

export interface StudentGrade {
  student_id: string;
  student_name?: string;
  grades: Record<string, number>;
  weekly_study_hours_by_course?: number | null;
  part_time_hours_by_course?: number | null;
  financial_support_by_course?: number | null;
  emotional_support_by_course?: number | null;
  final_pred?: number | null;
  confidence?: 'high'| 'medium'| 'low'| null;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    upload_id: string;
    total_students: number;
    processed_students: number;
    failed_students: number;
    upload_date: Date;
  };
  errors?: string[];
}

export interface StudentDetailResponse {
  success: boolean;
  data?: {
    _id: string;
    teacher_id: string;
    course_code: string;
    semester?: string;
    year?: number;
    upload_date: Date;
    students: StudentGrade[];
  };
}

export interface BehaviorUpdateData {
  weeklyStudyHours: number;
  partTimeHours: number;
  financialSupport: number;
  emotionalSupport: number;
}

export interface StudentBehaviorUpdate {
  studentId: string;
  courseCode: string;
  behaviorData: BehaviorUpdateData;
}

export interface BulkBehaviorUpdateResponse {
  success: boolean;
  message: string;
  updatedCount: number;
}

export interface UploadListResponse {
  success: boolean;
  data?: Array<{
    _id: string;
    course_code: string;
    semester?: string;
    year?: number;
    upload_date: Date;
    total_students: number;
    students_with_behavior: number;
    students_with_prediction: number;
  }>;
}

export interface AcademicTermsResponse {
  success: boolean;
  data?: {
    academicYears: string[];
    semesters: number[];
  };
}

class PredictionService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_BASE_URL}/api/teacher/prediction`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Use TokenManager to get token (supports session management)
        const token = TokenManager.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Upload file điểm (CSV hoặc Excel)
   * teacher_id được tự động lấy từ JWT token ở backend
   * Invalidate cache sau khi upload thành công
   */
  async uploadGrades(
    file: File, 
    courseCode: string,
    classCode: string,
    academicYear: string,
    semester: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_code', courseCode);
    formData.append('class_code', classCode);
    formData.append('academic_year', academicYear);
    formData.append('semester', semester);
    // teacher_id được backend tự động lấy từ account_id trong token

    const response = await this.axiosInstance.post<UploadResponse>(
      '/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Invalidate upload list cache khi có upload mới
    if (response.data.success) {
      cacheService.delete('upload:list');
    }

    return response.data;
  }

  /**
   * Lấy danh sách các lần upload với caching
   */
  async getUploadList(): Promise<UploadListResponse> {
    return cacheService.getOrFetch(
      'upload:list',
      async () => {
        const response = await this.axiosInstance.get<UploadListResponse>('/uploads');
        return response.data;
      },
      CACHE_TTL.UPLOAD_LIST
    );
  }

  /**
   * Lấy chi tiết sinh viên theo uploadId với caching
   */
  async getStudentsByUploadId(uploadId: string): Promise<StudentDetailResponse> {
    return cacheService.getOrFetch(
      `students:${uploadId}`,
      async () => {
        const response = await this.axiosInstance.get<StudentDetailResponse>(
          `/upload/${uploadId}`
        );
        return response.data;
      },
      CACHE_TTL.STUDENTS
    );
  }

  /**
   * Cập nhật behavior cho tất cả sinh viên trong một upload
   * Invalidate cache sau khi update
   */
  async bulkUpdateBehavior(
    uploadId: string,
    behaviorData: BehaviorUpdateData
  ): Promise<BulkBehaviorUpdateResponse> {
    const response = await this.axiosInstance.put<BulkBehaviorUpdateResponse>(
      '/behavior/bulk',
      {
        upload_id: uploadId,
        weekly_study_hours_by_course: behaviorData.weeklyStudyHours,
        part_time_hours_by_course: behaviorData.partTimeHours,
        financial_support_by_course: behaviorData.financialSupport,
        emotional_support_by_course: behaviorData.emotionalSupport,
      }
    );
    
    // Invalidate cache cho upload này
    if (response.data.success) {
      cacheService.invalidateUpload(uploadId);
    }
    
    return response.data;
  }

  /**
   * Cập nhật behavior cho một sinh viên cụ thể
   * Invalidate cache sau khi update
   */
  async updateStudentBehavior(
    data: StudentBehaviorUpdate
  ): Promise<StudentDetailResponse> {
    const response = await this.axiosInstance.put<StudentDetailResponse>(
      '/behavior',
      data
    );
    return response.data;
  }

  /**
   * Lấy thông tin chi tiết của một sinh viên
   */
  async getStudentDetail(
    studentId: string,
    courseCode: string
  ): Promise<StudentDetailResponse> {
    const response = await this.axiosInstance.get<StudentDetailResponse>(
      `/student/${studentId}`,
      {
        params: { courseCode },
      }
    );
    return response.data;
  }

  /**
   * Chạy ML prediction cho một upload
   * Invalidate cache sau khi prediction xong
   */
  async runPrediction(uploadId: string): Promise<StudentDetailResponse> {
    const response = await this.axiosInstance.post<StudentDetailResponse>(
      `/run/${uploadId}`
    );
    
    // Invalidate cache cho upload này
    if (response.data.success) {
      cacheService.invalidateUpload(uploadId);
    }
    
    return response.data;
  }

  /**
   * Lấy SHAP explanation cho predictions với caching
   */
  async getShapExplanation(uploadId: string, topK: number = 8): Promise<any> {
    return cacheService.getOrFetch(
      `shap:${uploadId}:${topK}`,
      async () => {
        const response = await this.axiosInstance.post(
          `/explain/${uploadId}`,
          { top_k: topK }
        );
        return response.data;
      },
      CACHE_TTL.SHAP
    );
  }

  /**
   * Lấy danh sách academic years và semesters từ GradeStructure
   * Optionally filter by courseCode
   */
  async getAvailableAcademicTerms(courseCode?: string): Promise<AcademicTermsResponse> {
    const params = courseCode ? { courseCode } : {};
    const response = await this.axiosInstance.get<AcademicTermsResponse>(
      '/academic-terms',
      { params }
    );
    return response.data;
  }

  /**
   * Gửi thông báo khảo sát đến sinh viên
   */
  async sendSurveyNotification(uploadId: string): Promise<{
    success: boolean;
    message: string;
    data?: {
      total_students: number;
      students_with_accounts: number;
      students_without_accounts: number;
      notification_id: number;
    };
  }> {
    const response = await this.axiosInstance.post(
      `/survey-notification/${uploadId}`
    );
    return response.data;
  }

  /**
   * Lấy thông tin grade structure và tính điểm cần thiết để pass
   */
  async getPassThreshold(uploadId: string): Promise<{
    success: boolean;
    message: string;
    data?: {
      gradeStructure: {
        courseCode: string;
        courseName: string;
        columns: Array<{
          name: string;
          key: string;
          maxScore: number;
          weight: number;
        }>;
        totalWeight: number;
      };
      students: Array<{
        student_id: string;
        currentScore: number;
        currentWeightUsed: number;
        finalWeightNeeded: number;
        finalScoreNeeded: number;
        finalColumnKey: string;
        isPassing: boolean;
        canPass: boolean;
      }>;
    };
  }> {
    const response = await this.axiosInstance.get(
      `/${uploadId}/pass-threshold`
    );
    return response.data;
  }
}

export const predictionService = new PredictionService();
export default predictionService;
