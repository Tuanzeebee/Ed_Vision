export interface GradeColumn {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
}

export interface StudentGrade {
  studentId: string;
  studentCode: string;
  name: string;
  grades: Record<string, number>; // columnId -> grade
  totalScore: number;
}

export interface GradeStructureResponse {
  structureId: string;
  classId: string;
  subjectCode: string;
  subjectName: string;
  columns: GradeColumn[];
  students: StudentGrade[];
}

export interface StudentPrediction {
  studentId: string;
  studentCode: string;
  name: string;
  currentAverage: number;
  predictedGrade: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface PredictionResponse {
  predictions: StudentPrediction[];
  summary: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
}
