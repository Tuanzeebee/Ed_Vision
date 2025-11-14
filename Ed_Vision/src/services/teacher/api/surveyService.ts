import axios from 'axios';
import { API_CONFIG } from './config';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Interfaces
export interface SurveyQuestion {
    id: string;
    question: string;
    type: 'text' | 'multiple-choice' | 'rating' | 'yes-no' | 'scale';
    options?: string[];
    minScale?: number;
    maxScale?: number;
    required?: boolean;
    category?: string;
}

export interface Survey {
    id: string;
    title: string;
    description?: string;
    type?: string;
    status: 'draft' | 'active' | 'completed' | 'expired' | 'closed'; // Added 'closed' from backend
    questions: SurveyQuestion[];
    startDate?: string;
    endDate?: string;
    createdAt: string;
    totalResponses?: number;
    responseRate?: number;
    targetClasses?: string[];
}

export interface SurveyDashboard {
    totalSurveys: number;
    activeSurveys: number;
    totalResponses: number;
    averageResponseRate: number;
    recentSurveys: Survey[];
    responsesTrend: {
        date: string;
        count: number;
    }[];
}

export interface AvailableQuestion {
    id: number;
    question: string;
    type: string;
    category?: string;
    options?: {
        id: number;
        text: string;
        value: number;
    }[];
}

export interface CreateSurveyDto {
    title: string;
    description?: string;
    type?: string;
    startDate: string;
    endDate: string;
    questions: {
        question: string;
        type: string;
        category?: string;
        options?: string[];
        required?: boolean;
    }[];
    targetClasses?: string[];
}

export interface CreateSurveyFromQuestionsDto {
    title: string;
    description?: string;
    questionIds: number[];
    startDate: string;
    endDate: string;
    targetClasses?: string[];
}

export interface SurveyAnalytics {
    surveyId: string;
    title: string;
    totalResponses: number;
    responseRate: number;
    questionAnalytics: {
        questionId: string;
        question: string;
        type: string;
        totalAnswers: number;
        distribution?: {
            option: string;
            count: number;
            percentage: number;
        }[];
        average?: number;
        median?: number;
        mode?: number;
        textAnswers?: string[];
    }[];
}

/**
 * Get survey dashboard
 */
export const getSurveyDashboard = async (): Promise<SurveyDashboard> => {
    const response = await axios.get(`${API_BASE_URL}/teacher/surveys/dashboard`);
    return response.data;
};

/**
 * Get list of surveys with filters
 */
export const getSurveys = async (filters?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{ surveys: Survey[]; total: number }> => {
    const response = await axios.get(`${API_BASE_URL}/teacher/surveys`, {
        params: filters,
    });
    return response.data;
};

/**
 * Get survey detail by ID
 */
export const getSurveyDetail = async (id: string): Promise<Survey> => {
    const response = await axios.get(`${API_BASE_URL}/teacher/surveys/${id}`);
    return response.data;
};

/**
 * Create new survey
 */
export const createSurvey = async (data: CreateSurveyDto): Promise<Survey> => {
    const response = await axios.post(`${API_BASE_URL}/teacher/surveys`, data);
    return response.data;
};

/**
 * Update survey
 */
export const updateSurvey = async (
    id: string,
    data: Partial<CreateSurveyDto>
): Promise<Survey> => {
    const response = await axios.put(`${API_BASE_URL}/teacher/surveys/${id}`, data);
    return response.data;
};

/**
 * Delete survey
 */
export const deleteSurvey = async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/teacher/surveys/${id}`);
};

/**
 * Get survey analytics
 */
export const getSurveyAnalytics = async (id: string): Promise<SurveyAnalytics> => {
    const response = await axios.get(`${API_BASE_URL}/teacher/surveys/${id}/analytics`);
    return response.data;
};

/**
 * Send reminder to incomplete students
 */
export const sendReminder = async (data: {
    surveyId: string;
    message: string;
    studentIds?: string[];
}): Promise<void> => {
    await axios.post(`${API_BASE_URL}/teacher/surveys/send-reminder`, data);
};

/**
 * Export survey responses
 */
export const exportSurveyResponses = async (id: string): Promise<Blob> => {
    const response = await axios.get(`${API_BASE_URL}/teacher/surveys/${id}/export`, {
        responseType: 'blob',
    });
    return response.data;
};

/**
 * Get available questions from question bank
 */
export const getAvailableQuestions = async (
    category?: string
): Promise<AvailableQuestion[]> => {
    const response = await axios.get(`${API_BASE_URL}/teacher/surveys/questions/available`, {
        params: { category },
    });
    return response.data;
};

/**
 * Create survey from existing questions
 */
export const createSurveyFromQuestions = async (
    data: CreateSurveyFromQuestionsDto
): Promise<Survey> => {
    const response = await axios.post(
        `${API_BASE_URL}/teacher/surveys/from-questions`,
        data
    );
    return response.data;
};
