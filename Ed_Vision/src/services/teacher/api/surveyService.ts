import axios from 'axios';
import { API_CONFIG } from './config';
import { cacheService } from '@/services/cacheService';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Cache keys and TTL
const CACHE_KEYS = {
    DASHBOARD: 'survey:dashboard',
    SURVEYS: (filters?: string) =>`survey:surveys:${filters || 'all'}`,
    SURVEY_DETAIL: (id: string) =>`survey:detail:${id}`,
    SURVEY_ANALYTICS: (id: string) =>`survey:analytics:${id}`,
    AVAILABLE_QUESTIONS: (category?: string) =>`survey:questions:${category || 'all'}`,
};

const CACHE_TTL = {
    DASHBOARD: 5 * 60 * 1000, // 5 minutes
    SURVEYS: 5 * 60 * 1000, // 5 minutes
    SURVEY_DETAIL: 3 * 60 * 1000, // 3 minutes
    ANALYTICS: 5 * 60 * 1000, // 5 minutes
    QUESTIONS: 60 * 60 * 1000, // 1 hour (stable data)
};

// Helper to clear all survey caches
export const clearAllSurveyCache = () => {
    cacheService.clearByPrefix('survey:');
};

// Helper to clear specific survey cache
export const clearSurveyCache = (surveyId: string) => {
    cacheService.delete(CACHE_KEYS.SURVEY_DETAIL(surveyId));
    cacheService.delete(CACHE_KEYS.SURVEY_ANALYTICS(surveyId));
    cacheService.clearByPrefix('survey:surveys:'); // Clear all survey lists
    cacheService.delete(CACHE_KEYS.DASHBOARD); // Clear dashboard
};

// Interfaces
export interface SurveyQuestion {
    id: string;
    question: string;
    type: 'text'| 'multiple-choice'| 'rating'| 'yes-no'| 'scale';
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
    status: 'draft'| 'active'| 'completed'| 'expired'| 'closed'; // Added 'closed'from backend
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
    survey?: any; // Full survey object from backend
    totalResponses: number;
    responseRate: number;
    responses?: Array<{
        id: string;
        surveyId: string;
        student?: {
            id: string;
            code: string;
            name: string;
            class: string;
        };
        answers: Array<{
            questionId: string;
            answer: string | string[] | number;
        }>;
        submittedAt: Date | string;
    }>;
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
    charts?: any; // Charts data from backend
}

/**
 * Get survey dashboard
 */
export const getSurveyDashboard = async (): Promise<SurveyDashboard>=> {
    return cacheService.getOrFetch(
        CACHE_KEYS.DASHBOARD,
        async () => {
            const response = await axios.get(`${API_BASE_URL}/teacher/surveys/dashboard`);
            return response.data;
        },
        CACHE_TTL.DASHBOARD
    );
};

/**
 * Get list of surveys with filters
 */
export const getSurveys = async (filters?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{ surveys: Survey[]; total: number }>=> {
    const filterKey = JSON.stringify(filters || {});
    return cacheService.getOrFetch(
        CACHE_KEYS.SURVEYS(filterKey),
        async () => {
            const response = await axios.get(`${API_BASE_URL}/teacher/surveys`, {
                params: filters,
            });
            return response.data;
        },
        CACHE_TTL.SURVEYS
    );
};

/**
 * Get survey detail by ID
 */
export const getSurveyDetail = async (id: string): Promise<Survey>=> {
    return cacheService.getOrFetch(
        CACHE_KEYS.SURVEY_DETAIL(id),
        async () => {
            const response = await axios.get(`${API_BASE_URL}/teacher/surveys/${id}`);
            return response.data;
        },
        CACHE_TTL.SURVEY_DETAIL
    );
};

/**
 * Create new survey
 */
export const createSurvey = async (data: CreateSurveyDto): Promise<Survey>=> {
    const response = await axios.post(`${API_BASE_URL}/teacher/surveys`, data);
    // Clear cache after creating
    clearAllSurveyCache();
    return response.data;
};

/**
 * Update survey
 */
export const updateSurvey = async (
    id: string,
    data: Partial<CreateSurveyDto>): Promise<Survey>=> {
    const response = await axios.put(`${API_BASE_URL}/teacher/surveys/${id}`, data);
    // Clear cache after updating
    clearSurveyCache(id);
    return response.data;
};

/**
 * Delete survey
 */
export const deleteSurvey = async (id: string): Promise<void>=> {
    await axios.delete(`${API_BASE_URL}/teacher/surveys/${id}`);
    // Clear ALL cache after deleting (affects dashboard and lists)
    clearAllSurveyCache();
};

/**
 * Get survey analytics
 */
export const getSurveyAnalytics = async (id: string): Promise<SurveyAnalytics>=> {
    return cacheService.getOrFetch(
        CACHE_KEYS.SURVEY_ANALYTICS(id),
        async () => {
            const response = await axios.get(`${API_BASE_URL}/teacher/surveys/${id}/analytics`);
            return response.data;
        },
        CACHE_TTL.ANALYTICS
    );
};

/**
 * Get incomplete students for a survey
 */
export const getIncompleteStudents = async (id: string): Promise<any[]>=> {
    const response = await axios.get(`${API_BASE_URL}/teacher/surveys/${id}/incomplete-students`);
    return response.data;
};

/**
 * Send reminder to incomplete students
 */
export const sendReminder = async (data: {
    surveyId: string;
    message: string;
    studentIds?: string[];
}): Promise<void>=> {
    await axios.post(`${API_BASE_URL}/teacher/surveys/send-reminder`, data);
};

/**
 * Get history statistics for completed surveys
 */
export const getHistoryStatistics = async (): Promise<{
    totalCompletedSurveys: number;
    totalResponses: number;
    improvingStudents: number;
    needSupportStudents: number;
}>=> {
    const response = await axios.get(`${API_BASE_URL}/teacher/surveys/history-statistics`);
    return response.data;
};

/**
 * Get target student count by faculty and class
 */
export const getTargetStudentCount = async (
    facultyId?: string,
    classId?: string,
): Promise<number>=> {
    const params = new URLSearchParams();
    if (facultyId && facultyId !== 'all') params.append('facultyId', facultyId);
    if (classId && classId !== 'all') params.append('classId', classId);
    
    const response = await axios.get(
        `${API_BASE_URL}/teacher/surveys/target-student-count?${params.toString()}`
    );
    return response.data;
};

/**
 * Export survey responses
 */
export const exportSurveyResponses = async (id: string): Promise<Blob>=> {
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
): Promise<AvailableQuestion[]>=> {
    return cacheService.getOrFetch(
        CACHE_KEYS.AVAILABLE_QUESTIONS(category),
        async () => {
            const response = await axios.get(`${API_BASE_URL}/teacher/surveys/questions/available`, {
                params: { category },
            });
            return response.data;
        },
        CACHE_TTL.QUESTIONS
    );
};

/**
 * Create survey from existing questions
 */
export const createSurveyFromQuestions = async (
    data: CreateSurveyFromQuestionsDto
): Promise<Survey>=> {
    const response = await axios.post(
        `${API_BASE_URL}/teacher/surveys/from-questions`,
        data
    );
    // Clear cache after creating
    clearAllSurveyCache();
    return response.data;
};

/**
 * Add question to survey
 */
export const addQuestionToSurvey = async (
    surveyId: string,
    questionId: number
): Promise<{ success: boolean }>=> {
    const response = await axios.post(
        `${API_BASE_URL}/teacher/surveys/${surveyId}/questions/${questionId}`
    );
    // Clear specific survey cache after adding question
    clearSurveyCache(surveyId);
    return response.data;
};

/**
 * Remove question from survey
 */
export const removeQuestionFromSurvey = async (
    surveyId: string,
    questionId: number
): Promise<{ success: boolean }>=> {
    const response = await axios.delete(
        `${API_BASE_URL}/teacher/surveys/${surveyId}/questions/${questionId}`
    );
    // Clear specific survey cache after removing question
    clearSurveyCache(surveyId);
    return response.data;
};

/**
 * Reorder questions in survey
 */
export const reorderSurveyQuestions = async (
    surveyId: string,
    questionOrder: { questionId: number; order: number }[]
): Promise<{ success: boolean }>=> {
    const response = await axios.put(
        `${API_BASE_URL}/teacher/surveys/${surveyId}/questions/reorder`,
        { questionOrder }
    );
    // Clear specific survey cache after reordering
    clearSurveyCache(surveyId);
    return response.data;
};
