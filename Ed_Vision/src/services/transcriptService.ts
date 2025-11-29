import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
  const response = await axios.get<StudentTranscriptResponse>(
    `${API_BASE_URL}/student/transcript/${studentId}`
  );

  return response.data;
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
