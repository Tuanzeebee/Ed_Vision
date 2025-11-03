export interface ReportResponse {
  reportId: number;
  title: string;
  type: string;
  description?: string;
  generatedBy: number;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  fileUrl?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface ReportListResponse {
  data: ReportResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AcademicReportData {
  totalStudents: number;
  averageGrade: number;
  passRate: number;
  failRate: number;
  topPerformers: Array<{
    studentId: number;
    studentName: string;
    grade: number;
  }>;
}

export interface AttendanceReportData {
  totalClasses: number;
  averageAttendance: number;
  absentRate: number;
  lateRate: number;
}
