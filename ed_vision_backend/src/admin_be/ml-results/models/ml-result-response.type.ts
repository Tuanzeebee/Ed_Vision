export interface MLResultResponse {
  resultId: number;
  modelType: string;
  studentId: number;
  studentName?: string;
  predictionScore: number;
  confidence: number;
  prediction: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface MLResultListResponse {
  data: MLResultResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface StudentPerformancePrediction {
  studentId: number;
  predictedGrade: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  factors: Array<{
    factor: string;
    impact: number;
  }>;
}

export interface DropoutPrediction {
  studentId: number;
  dropoutProbability: number;
  riskFactors: string[];
  interventions: string[];
}
