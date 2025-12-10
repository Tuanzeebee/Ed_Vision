import axios from 'axios';
import cacheService from '@/services/cacheService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const CACHE_TTL = {
  GPA: 3 * 60 * 1000,
  PROJECTED_GPA: 3 * 60 * 1000,
  PREDICTED_GPA: 3 * 60 * 1000,
  PHYSICAL_EDU_GPA: 5 * 60 * 1000,
  SEMESTER_PLAN: 3 * 60 * 1000,
  SURVEY: 3 * 60 * 1000,
}
const pendingRequests = new Map<string, Promise<any>>()
const getOrFetchDedup = async <T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> => {
  const cached = cacheService.get<T>(key)
  if (cached !== null) return cached
  const inFlight = pendingRequests.get(key)
  if (inFlight) return inFlight as Promise<T>
  const p = (async () => {
    try {
      const data = await fetchFn()
      cacheService.set(key, data, ttl)
      return data
    } finally {
      pendingRequests.delete(key)
    }
  })()
  pendingRequests.set(key, p)
  return p
}

export interface TranscriptUploadResponse {
  success: boolean;
  message: string;
  data: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    errors?: Array<{
      row: number;
      error: string;
    }>;
  };
}

export interface TranscriptRecordDetail {
  record_id: number;
  student_id: number;
  course_code: string;
  course_name: string;
  academic_year: string;
  semester_number: number;
  credits_unit: number;
  raw_score?: number;
  converted_score?: string;
  status: string;
}

export interface StudentTranscriptResponse {
  studentId: number;
  studentCode: string;
  fullName: string;
  major?: string;
  cohortYear?: number;
  records: TranscriptRecordDetail[];
  totalCredits: number;
  completedCredits: number;
  gpa?: number;
}

export interface GPACalculationResult {
  currentGPA: number;
  totalCredits: number;
  completedCredits: number;
  totalCourses: number;
  completedCourses: number;
  failedCourses: number;
  major?: string; // Major từ Student table
  student_code?: string; // Mã sinh viên
  cohort_year?: number; // Khóa học
  previousSemesterGPA?: number; // GPA tích lũy của học kỳ trước
  gpaChange?: number; // Thay đổi GPA so với học kỳ trước
}

export interface PredictedGPAResult {
  predictedGPA: number;
  totalCredits: number;
  completedCredits: number;
  plannedCredits: number;
  totalCourses: number;
  completedCourses: number;
  plannedCourses: number;
  plannedCoursesWithPrediction: number;
  major?: string;
  student_code?: string;
  cohort_year?: number;
}

export interface PhysicalEducationCourse {
  course_code: string;
  course_name: string;
  score: number; // Thang 10
  score4: number; // Thang 4
}

export interface PhysicalEducationGPAResult {
  averageGPA4: number; // Điểm trung bình thang 4
  averageGPA10: number; // Điểm trung bình thang 10 (averageGPA4 * 2.5)
  isPassing: boolean; // Pass nếu >= 5.0 thang 10
  totalCourses: number; // Tổng số môn DEM đã hoàn thành
  requiredCourses: number; // Số môn DEM yêu cầu (thường là 3)
  courses: PhysicalEducationCourse[];
  isEligible: boolean; // Đủ điều kiện (>= 3 môn)
  note: string; // Note về số môn đã tính
  major?: string;
  student_code?: string;
  cohort_year?: number;
}

export interface GPAResponse {
  success: boolean;
  data: GPACalculationResult;
}

export interface PredictedGPAResponse {
  success: boolean;
  data: PredictedGPAResult;
}

export interface PhysicalEducationGPAResponse {
  success: boolean;
  data: PhysicalEducationGPAResult;
}

export interface PlannedCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  credits_unit: number;
  predicted_gpa: number; // Thang 10
  predicted_gpa_4: number; // Thang 4
  prediction_confidence: number | null;
  academic_year: string | null;
  semester_number: number | null;
  term_id: number | null;
}

export interface SemesterData {
  season: string;
  year: string;
  term_id: number | null;
  academic_year: string | null;
  semester_number: number | null;
  total_credits: number;
  courses_count: number;
  courses: PlannedCourse[];
}

export interface SemesterPlanGrouped {
  student_info: {
    student_id: number;
    student_code: string;
    major: string | null;
    study_time_hours: number | null;
  };
  semesters: SemesterData[];
}

export interface SemesterPlanResponse {
  success: boolean;
  data: SemesterPlanGrouped;
}

export interface StudentSurveyFactors {
  factor_id: number;
  student_id: number;
  study_time_hours: number | null;
  work_time_hours: number | null;
  financial_support_score: number | null;
  mental_health_score: number | null;
  updated_at: string;
}

export interface SurveyFactorsResponse {
  success: boolean;
  message?: string;
  data: StudentSurveyFactors | null;
}

/**
 * Upload transcript file (CSV or Excel)
 */
export const uploadTranscriptFile = async (file: File): Promise<TranscriptUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<TranscriptUploadResponse>(
    `${API_BASE_URL}/student/transcript/upload-file`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

/**
 * Upload transcript from JSON data
 */
export const uploadTranscriptJSON = async (records: any[]): Promise<TranscriptUploadResponse> => {
  const response = await axios.post<TranscriptUploadResponse>(
    `${API_BASE_URL}/student/transcript/upload`,
    { records }
  );

  return response.data;
};

/**
 * Get student transcript by student ID
 */
export const getStudentTranscript = async (studentId: number): Promise<StudentTranscriptResponse> => {
  const key = `transcript:${studentId}`
  return getOrFetchDedup<StudentTranscriptResponse>(
    key,
    async () => {
      const response = await axios.get<StudentTranscriptResponse>(
        `${API_BASE_URL}/student/transcript/${studentId}`
      )
      return response.data
    },
    3 * 60 * 1000,
  )
};

/**
 * Delete student transcript
 */
export const deleteStudentTranscript = async (studentId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/student/transcript/${studentId}`);
};

/**
 * Validate file type
 */
export const isValidFileType = (file: File): boolean => {
  const validTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  
  const validExtensions = ['.csv', '.xlsx', '.xls'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
};

/**
 * Validate file size (10MB limit)
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return file.size <= maxSize;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get student GPA by student_id or account_id
 * Backend tự động detect: nếu là account_id thì tìm Student table
 * CHỈ TÍNH CÁC MÔN ĐÃ HOÀN THÀNH (completed)
 */
export const getStudentGPA = async (idOrAccountId: number): Promise<GPACalculationResult> => {
  const key = `gpa:current:${idOrAccountId}`
  return getOrFetchDedup<GPACalculationResult>(
    key,
    async () => {
      const response = await axios.get<GPAResponse>(
        `${API_BASE_URL}/student/transcript/${idOrAccountId}/gpa`
      )
      return response.data.data
    },
    CACHE_TTL.GPA,
  )
};

/**
 * Get student PROJECTED GPA (completed + planned courses with predictions)
 * Tính GPA DỰ ĐOÁN bao gồm cả môn PLANNED
 * Dùng cho AcademicPlanningDashboard
 */
export const getProjectedGPA = async (idOrAccountId: number): Promise<GPACalculationResult> => {
  const key = `gpa:projected:${idOrAccountId}`
  return getOrFetchDedup<GPACalculationResult>(
    key,
    async () => {
      const response = await axios.get<GPAResponse>(
        `${API_BASE_URL}/student/transcript/${idOrAccountId}/gpa-projected`
      )
      return response.data.data
    },
    CACHE_TTL.PROJECTED_GPA,
  )
};

/**
 * Get student survey factors by student_id or account_id
 * Lấy thông tin khảo sát từ bảng StudentSurveyFactors
 */
export const getStudentSurveyFactors = async (idOrAccountId: number): Promise<SurveyFactorsResponse> => {
  const key = `survey:${idOrAccountId}`
  return getOrFetchDedup<SurveyFactorsResponse>(
    key,
    async () => {
      const response = await axios.get<SurveyFactorsResponse>(
        `${API_BASE_URL}/student/transcript/${idOrAccountId}/survey-factors`
      )
      return response.data
    },
    CACHE_TTL.SURVEY,
  )
};

/**
 * Get student PREDICTED GPA by student_id or account_id
 * Tính GPA dự đoán bao gồm:
 * - Điểm thật (completed courses)
 * - Điểm dự đoán từ PredictionResult (planned courses)
 */
export const getPredictedGPA = async (idOrAccountId: number): Promise<PredictedGPAResult> => {
  const key = `gpa:predicted:${idOrAccountId}`
  return getOrFetchDedup<PredictedGPAResult>(
    key,
    async () => {
      const response = await axios.get<PredictedGPAResponse>(
        `${API_BASE_URL}/student/transcript/${idOrAccountId}/predicted-gpa`
      )
      return response.data.data
    },
    CACHE_TTL.PREDICTED_GPA,
  )
};

/**
 * Get student Physical Education GPA by student_id or account_id
 * Lấy điểm trung bình 3 môn Giáo dục thể chất (DEM)
 */
export const getPhysicalEducationGPA = async (idOrAccountId: number): Promise<PhysicalEducationGPAResult> => {
  const key = `gpa:dem:${idOrAccountId}`
  return getOrFetchDedup<PhysicalEducationGPAResult>(
    key,
    async () => {
      const response = await axios.get<PhysicalEducationGPAResponse>(
        `${API_BASE_URL}/student/transcript/${idOrAccountId}/physical-education-gpa`
      )
      return response.data.data
    },
    CACHE_TTL.PHYSICAL_EDU_GPA,
  )
};

/**
 * Get student semester plan by student_id or account_id
 * Lấy recommended semester plan với các môn học dự đoán được group theo học kỳ
 * Bao gồm:
 * - Thông tin sinh viên (major, study_time_hours)
 * - Danh sách học kỳ với các môn học
 * - Tổng tín chỉ mỗi học kỳ
 */
export const getSemesterPlan = async (idOrAccountId: number): Promise<SemesterPlanGrouped> => {
  const key = `semesterPlan:${idOrAccountId}`
  return getOrFetchDedup<SemesterPlanGrouped>(
    key,
    async () => {
      const response = await axios.get<SemesterPlanResponse>(
        `${API_BASE_URL}/student/transcript/${idOrAccountId}/semester-plan`
      )
      return response.data.data
    },
    CACHE_TTL.SEMESTER_PLAN,
  )
};
