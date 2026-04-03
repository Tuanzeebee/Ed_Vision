import axios from 'axios';
import { cacheService } from '@/services/cacheService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Cache configuration
const CACHE_KEYS = {
    stats: (instructorId: number = 1, filters?: string) =>`dashboard:stats:${instructorId}:${filters || 'default'}`,
};

const CACHE_TTL = {
    STATS: 5 * 60 * 1000, // 5 minutes
};

export interface DashboardStats {
    totalStudents: number;
    totalClasses: number;
    atRiskPercentage: number;
    atRiskCount: number;
    gradeDistribution: {
        low: number;      // < 2.0
        medium: number;   // 2.0 - 3.19
        high: number;     // >= 3.2
    };
    averageGPA: number;
    medianGPA: number;
    minGPA: number;
}

export interface AtRiskStudent {
    studentId: string;
    studentCode: string;
    name: string;
    class: string;
    avatar?: string;
    gpa: number;
    absences: number;
    debtCourses: number;
    riskLevel: 'high'| 'medium'| 'low';
}

export interface DashboardResponse {
    stats: DashboardStats;
    atRiskStudents: AtRiskStudent[];
    weeklyProgressChart: any;
    majorComparisonChart: any;
}

export const dashboardAPI = {
    /**
     * Get dashboard statistics with cache
     */
    getStats: async (filters?: {
        academicYear?: string;
        semester?: number;
        faculty?: string;
        course?: string;
    }): Promise<DashboardResponse>=> {
        const instructorId = 1; // TODO: Get from auth context
        const filterKey = filters ? JSON.stringify(filters) : undefined;
        const cacheKey = CACHE_KEYS.stats(instructorId, filterKey);

        return cacheService.getOrFetch(
            cacheKey,
            async () => {
                console.log('Fetching dashboard stats from API');
                const response = await api.get('/teacher/dashboard/stats', {
                    params: filters,
                });
                return response.data;
            },
            CACHE_TTL.STATS
        );
    },

    /**
     * Clear dashboard cache
     */
    clearCache: () => {
        console.log('Clearing dashboard cache');
        cacheService.clearByPrefix('dashboard:');
    },
};
