import axios from 'axios';
import { API_BASE_URL } from './config';

export type QuestionCategory = 'psychology'| 'finance'| 'general'| 'academic'| 'health';
export type QuestionType = 'single-choice'| 'multiple-choice'| 'text'| 'scale';

export interface Question {
  questionId: number;
  questionCode: string;
  content: string;
  category: QuestionCategory;
  type: QuestionType;
  optionsCount: number | string;
  createdDate: string;
  isActive: boolean;
}

export interface QuestionListResponse {
  data: Question[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface QuestionFilterParams {
  search?: string;
  category?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface CreateQuestionData {
  question_text: string;
  code?: string;
  category: string;
  question_type: string;
  is_active?: boolean;
  min_value?: number;
  max_value?: number;
  options?: Array<{
    option_text: string;
    option_value?: number;
  }>;
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {}

const questionService = {
  async getQuestions(params: QuestionFilterParams = {}): Promise<QuestionListResponse> {
    const response = await axios.get(`${API_BASE_URL}/admin/questions`, { params });
    return response.data;
  },

  async getQuestion(id: number): Promise<Question> {
    const response = await axios.get(`${API_BASE_URL}/admin/questions/${id}`);
    return response.data;
  },

  async createQuestion(data: CreateQuestionData): Promise<Question> {
    const response = await axios.post(`${API_BASE_URL}/admin/questions`, data);
    return response.data;
  },

  async updateQuestion(id: number, data: UpdateQuestionData): Promise<Question> {
    const response = await axios.patch(`${API_BASE_URL}/admin/questions/${id}`, data);
    return response.data;
  },

  async deleteQuestion(id: number): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/questions/${id}`);
  },

  async deleteQuestions(ids: number[]): Promise<{ deletedCount: number }> {
    const response = await axios.delete(`${API_BASE_URL}/admin/questions/bulk`, {
      data: { ids },
    });
    return response.data;
  },
};

export default questionService;
