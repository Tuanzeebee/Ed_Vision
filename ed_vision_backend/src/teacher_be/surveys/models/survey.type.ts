export interface SurveyQuestion {
    id: string;
    question: string;
    type: 'text' | 'multiple-choice' | 'rating' | 'yes-no' | 'scale';
    options?: string[];
    minScale?: number;
    maxScale?: number;
    required: boolean;
}

export interface Survey {
    id: string;
    title: string;
    description?: string;
    targetClasses: string[];
    questions: SurveyQuestion[];
    startDate: string;
    endDate: string;
    status: 'draft' | 'active' | 'closed';
    anonymous: boolean;
    createdAt: Date;
    totalResponses: number;
    responseRate: number;
}

export interface SurveyListResponse {
    surveys: Survey[];
    total: number;
    summary: {
        draft: number;
        active: number;
        closed: number;
        totalResponses: number;
    };
}

export interface SurveyResponse {
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
    submittedAt: Date;
}

export interface SurveyAnalytics {
    surveyId: string;
    title: string;
    survey: Survey;
    totalResponses: number;
    responseRate: number;
    responses: SurveyResponse[];
    questionAnalytics: Array<{
        questionId: string;
        question: string;
        type: string;
        // For multiple choice / yes-no
        distribution?: Array<{
            option: string;
            count: number;
            percentage: number;
        }>;
        // For rating / scale
        average?: number;
        median?: number;
        mode?: number;
        // For text
        textResponses?: string[];
    }>;
    charts: {
        responseRateChart: {
            labels: string[];
            datasets: Array<{
                label: string;
                data: number[];
                backgroundColor: string | string[];
            }>;
        };
        classResponseChart: {
            labels: string[];
            datasets: Array<{
                label: string;
                data: number[];
                backgroundColor: string | string[];
            }>;
        };
    };
}

export interface SurveyDashboard {
    summary: {
        totalSurveys: number;
        activeSurveys: number;
        totalResponses: number;
        averageResponseRate: number;
    };
    recentSurveys: Survey[];
    upcomingSurveys: Survey[];
    responsesTrend: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            borderColor: string;
            backgroundColor: string;
        }>;
    };
}
