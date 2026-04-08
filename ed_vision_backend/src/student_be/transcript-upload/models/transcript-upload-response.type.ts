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
