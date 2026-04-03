import axios from 'axios';
import { TokenManager } from '@/lib/tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create a separate axios instance for survey that doesn't auto-redirect on 401
const surveyApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get token from multiple sources (matches other modules)
const getAuthToken = (): string | null => {
  // Priority: dev-token → simple 'token'key (set by TokenManager.setToken) → TokenManager
  const devToken = localStorage.getItem('dev-token');
  if (devToken) return devToken;

  const simpleToken = localStorage.getItem('token');
  if (simpleToken) return simpleToken;

  // Fallback to TokenManager (reads auth_token_data)
  return TokenManager.getToken();
};

// Request interceptor to add auth token
surveyApiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - NO auto redirect, let component handle errors
surveyApiClient.interceptors.response.use(
  (response) =>response,
  (error) => {
    // Don't redirect, just reject the promise
    return Promise.reject(error);
  }
);

// Types matching backend DTOs
export interface AnswerDto {
  questionId: number;
  optionId?: number;
  freeText?: string;
}

export interface SubmitSurveyDto {
  surveyId: number;
  answers: AnswerDto[];
}

export interface SurveyListItemDto {
  surveyId: number;
  title: string;
  description?: string;
  type: string; // 'input' | 'periodic'
  totalQuestions: number;
  estimatedTime: string;
  startDate?: string;
  endDate?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface SurveyQuestionOptionDto {
  optionId: number;
  text: string;
  value: number;
}

export interface SurveyQuestionDto {
  questionId: number;
  questionText: string;
  questionType: string; // 'likert' | 'yes-no' | 'single-choice' | 'free-text' | 'slider'
  category?: string;
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  options?: SurveyQuestionOptionDto[];
}

export interface SurveyDetailDto {
  surveyId: number;
  title: string;
  description?: string;
  type: string;
  totalQuestions: number;
  estimatedTime: string;
  questions: SurveyQuestionDto[];
}

export interface SurveyStatusDto {
  hasCompletedInputSurvey: boolean;
  pendingInputSurvey?: SurveyListItemDto;
  pendingPeriodicSurveys: SurveyListItemDto[];
}

export interface SubmitSurveyResponse {
  success: boolean;
  message: string;
}

// API Functions
const surveyService = {
  /**
   * Kiểm tra trạng thái khảo sát của student
   */
  async checkSurveyStatus(): Promise<SurveyStatusDto> {
    const response = await surveyApiClient.get<SurveyStatusDto>('/student/survey/status');
    return response.data;
  },

  /**
   * Lấy danh sách tất cả surveys cho student
   */
  async getAllSurveys(): Promise<SurveyListItemDto[]> {
    const response = await surveyApiClient.get<SurveyListItemDto[]>('/student/survey/list');
    return response.data;
  },

  /**
   * Lấy lịch sử khảo sát đã làm
   */
  async getSurveyHistory(): Promise<SurveyListItemDto[]> {
    const response = await surveyApiClient.get<SurveyListItemDto[]>('/student/survey/history');
    return response.data;
  },

  /**
   * Lấy chi tiết một survey với tất cả questions
   */
  async getSurveyDetail(surveyId: number): Promise<SurveyDetailDto> {
    const response = await surveyApiClient.get<SurveyDetailDto>(`/student/survey/${surveyId}`);
    return response.data;
  },

  /**
   * Submit survey response
   */
  async submitSurvey(data: SubmitSurveyDto): Promise<SubmitSurveyResponse> {
    const response = await surveyApiClient.post<SubmitSurveyResponse>('/student/survey/submit', data);
    return response.data;
  },
};

export default surveyService;
