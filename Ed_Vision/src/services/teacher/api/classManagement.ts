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
    classes: (instructorId: number = 1) => `class_mgmt:classes:${instructorId}`,
    statistics: (instructorId: number = 1) => `class_mgmt:stats:${instructorId}`,
    students: (classCode: string) => `class_mgmt:students:${classCode}`,
    programs: () => 'class_mgmt:programs',
};

const CACHE_TTL = {
    CLASSES: 5 * 60 * 1000,      // 5 minutes
    STATISTICS: 5 * 60 * 1000,   // 5 minutes
    STUDENTS: 3 * 60 * 1000,     // 3 minutes
    PROGRAMS: 60 * 60 * 1000,    // 1 hour (programs rarely change)
};

export const classManagementAPI = {
    /**
     * Get classes list with cache
     */
    getClasses: async () => {
        const instructorId = 1; // TODO: Get from auth context
        const cacheKey = CACHE_KEYS.classes(instructorId);

        return cacheService.getOrFetch(
            cacheKey,
            async () => {
                console.log('🌐 Fetching classes from API');
                const response = await api.get('/teacher/class-management/classes');
                return response.data;
            },
            CACHE_TTL.CLASSES
        );
    },

    /**
     * Get statistics with cache
     */
    getStatistics: async () => {
        const instructorId = 1; // TODO: Get from auth context
        const cacheKey = CACHE_KEYS.statistics(instructorId);

        return cacheService.getOrFetch(
            cacheKey,
            async () => {
                console.log('🌐 Fetching statistics from API');
                const response = await api.get('/teacher/class-management/statistics');
                return response.data;
            },
            CACHE_TTL.STATISTICS
        );
    },

    /**
     * Get programs list with cache (long TTL)
     */
    getPrograms: async () => {
        const cacheKey = CACHE_KEYS.programs();

        return cacheService.getOrFetch(
            cacheKey,
            async () => {
                console.log('🌐 Fetching programs from API');
                const response = await api.get('/teacher/class-management/programs');
                return response.data;
            },
            CACHE_TTL.PROGRAMS
        );
    },

    /**
     * Get filter options (faculties, classes, academic years, semesters)
     */
    getFilterOptions: async () => {
        const cacheKey = 'class_mgmt:filter_options';

        return cacheService.getOrFetch(
            cacheKey,
            async () => {
                console.log('🌐 Fetching filter options from API');
                const classesResponse = await api.get('/teacher/class-management/classes');
                const classes = classesResponse.data;
                console.log('📊 Received classes data:', classes);

                // Extract unique values
                const faculties = [...new Set(classes.map((c: any) => c.faculty).filter(Boolean))].map(String);
                const classNames = [...new Set(classes.map((c: any) => c.class_code).filter(Boolean))].map(String);
                const academicYears = [...new Set(classes.map((c: any) => c.academic_year).filter(Boolean))].map(String);
                const semesters = ['HK1', 'HK2', 'HK3']; // Standard semesters

                console.log('📋 Extracted filters:', {
                    faculties: faculties.length,
                    classes: classNames.length,
                    academicYears: academicYears.length,
                    semesters: semesters.length
                });

                return {
                    faculties: faculties.sort(),
                    classes: classNames.sort(),
                    academicYears: academicYears.sort().reverse(), // Latest first
                    semesters
                };
            },
            CACHE_TTL.PROGRAMS // Same TTL as programs (1 hour)
        );
    },

    /**
     * Get students by class with cache
     */
    getStudentsByClass: async (classCode: string) => {
        const cacheKey = CACHE_KEYS.students(classCode);

        return cacheService.getOrFetch(
            cacheKey,
            async () => {
                console.log(`🌐 Fetching students for class ${classCode} from API`);
                const response = await api.get(`/teacher/class-management/classes/${classCode}/students`);
                return response.data;
            },
            CACHE_TTL.STUDENTS
        );
    },

    /**
     * Upload class list - invalidate cache after success
     */
    uploadClassList: async (formData: FormData) => {
        const response = await api.post('/teacher/class-management/upload-class', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // Invalidate related cache after successful upload
        if (response.data.success) {
            const instructorId = 1; // TODO: Get from auth context
            const classCode = formData.get('class_code')?.toString();

            console.log('🗑️ Clearing cache after upload');
            cacheService.delete(CACHE_KEYS.classes(instructorId));
            cacheService.delete(CACHE_KEYS.statistics(instructorId));
            
            if (classCode) {
                cacheService.delete(CACHE_KEYS.students(classCode));
            }
        }

        return response.data;
    },

    /**
     * Manual refresh - clear all class management cache
     */
    clearCache: () => {
        console.log('🗑️ Manual cache clear');
        cacheService.clearByPrefix('class_mgmt:');
    },

    /**
     * Clear cache for specific class
     */
    clearClassCache: (classCode: string) => {
        console.log(`🗑️ Clearing cache for class ${classCode}`);
        cacheService.delete(CACHE_KEYS.students(classCode));
    },
};
