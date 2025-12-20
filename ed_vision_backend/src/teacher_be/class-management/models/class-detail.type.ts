export interface ClassInfo {
  classId: number;
  className: string;
  major: string;
  students: number;
  teacher: string;
  atRisk: number;
  status: string;
  year: string;
}

export interface StudentDetail {
  id: string;
  studentCode: string;
  name: string;
  email: string;
  avatar?: string;
  gpa: number;
  predictedGpa: number;
  attendance: number;
  riskLevel: 'None' | 'Monitor' | 'Medium' | 'High';
  status: string;
}

export interface ClassDetailResponse {
  classInfo: ClassInfo;
  students: StudentDetail[];
  summary: {
    total: number;
    noRisk: number;
    highRisk: number;
    excellent: number; // GPA >= 3.2
  };
}
