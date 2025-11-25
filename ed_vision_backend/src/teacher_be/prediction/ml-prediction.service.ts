import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

// Interface cho Python API request/response
export interface PythonPredictionRow {
  student_id: string;
  course_code?: string;
  no?: number;
  attend?: number;
  quiz?: number;
  quiz1?: number;
  quiz2?: number;
  midterm?: number;
  homework?: number;
  homework1?: number;
  homework2?: number;
  group_project?: number;
  individual_project?: number;
  practice?: number;
  regular?: number;
  speech_and_discussion?: number;
  project?: number;
  // Behavior features (nếu có)
  weekly_study_hours_by_course?: number;
  part_time_hours_by_course?: number;
  financial_support_by_course?: number;
  emotional_support_by_course?: number;
}

export interface PythonPredictionRequest {
  course_code?: string;
  rows: PythonPredictionRow[];
}

export interface PythonPredictionResult {
  student_id: string;
  course_code: string;
  no: number;
  final_pred: number | null;
  pred_final_gb: number | null;
  baseline_final_weighted: number | null;
  pred_source: string;
  confidence_level: string;
}

export interface PythonPredictionResponse {
  n: number;
  predictions: PythonPredictionResult[];
}

export interface ShapFeature {
  feature: string;
  value: number;
  shap_value: number;
}

export interface PythonExplainResult {
  student_id: string;
  course_code: string;
  no: number;
  final_pred: number;
  baseline_final_weighted: number | null;
  top_features: ShapFeature[];
}

export interface PythonExplainResponse {
  n: number;
  model: string;
  top_k: number;
  explanations: PythonExplainResult[];
}

@Injectable()
export class MLPredictionService {
  private readonly pythonApiUrl: string;

  constructor() {
    // URL của Python FastAPI service
    this.pythonApiUrl = process.env.PYTHON_ML_API_URL || 'http://localhost:8000';
  }

  /**
   * Gọi Python API để dự đoán điểm final cho danh sách sinh viên
   */
  async predictScores(
    courseCode: string,
    students: PythonPredictionRow[],
  ): Promise<PythonPredictionResponse> {
    try {
      const payload: PythonPredictionRequest = {
        course_code: courseCode,
        rows: students,
      };

      const response = await axios.post<PythonPredictionResponse>(
        `${this.pythonApiUrl}/predict_json`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error calling Python ML API /predict_json:', error.message);
      throw new InternalServerErrorException(
        `Failed to get predictions from ML service: ${error.message}`,
      );
    }
  }

  /**
   * Gọi Python API để lấy SHAP explanation (XAI)
   */
  async explainPredictions(
    courseCode: string,
    students: PythonPredictionRow[],
    topK: number = 8,
  ): Promise<PythonExplainResponse> {
    try {
      const payload = {
        course_code: courseCode,
        top_k: topK,
        rows: students,
      };

      const response = await axios.post<PythonExplainResponse>(
        `${this.pythonApiUrl}/explain_json`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 seconds (SHAP có thể chậm hơn)
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error calling Python ML API /explain_json:', error.message);
      throw new InternalServerErrorException(
        `Failed to get explanations from ML service: ${error.message}`,
      );
    }
  }

  /**
   * Health check Python API
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.pythonApiUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Python ML API health check failed:', error.message);
      return false;
    }
  }
}
