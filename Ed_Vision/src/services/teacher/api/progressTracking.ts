import axios from 'axios';
import { API_CONFIG } from './config';

// Types matching backend
export interface MilestoneOverview {
    totalStudents: number;
    avgGPA: number;
    medianGPA: number;
    avgAttendance: number;
    assignmentCompletion: number;
    onTrack: number;
    atRisk: number;
    improvement: number;
    teachingEffectiveness: number;
}

export interface ClassMetric {
    classId: string;
    className: string;
    gpa: number;
    median: number;
    attendance: number;
    assignmentRate: number;
    onTrack: number;
    atRisk: number;
    trend: 'up' | 'down' | 'stable';
    topStudents: string[];
}

export interface AtRiskStudentInfo {
    id: string;
    studentCode: string;
    name: string;
    class: string;
    gpa: number;
    attendance: number;
    issues: string[];
}

export interface TimelineMilestone {
    id: number;
    title: string;
    date: string;
    status: 'completed' | 'in-progress' | 'upcoming';
    description: string;
    overview: MilestoneOverview;
    classMetrics: ClassMetric[];
    atRiskStudents: AtRiskStudentInfo[];
}

export interface ProgressTrackingResponse {
    currentMilestone: TimelineMilestone;
    allMilestones: TimelineMilestone[];
    comparisonWithPrevious: {
        gpaChange: number;
        attendanceChange: number;
        atRiskChange: number;
    };
}

export interface ProgressFilterDto {
    classCode?: string;
    semester?: string;
    year?: number;
}

/**
 * Progress Tracking API Service
 */
export const progressTrackingAPI = {
    /**
     * Lấy dữ liệu theo dõi tiến độ với các milestones
     * GET /api/teacher/progress/tracking
     */
    getProgressTracking: async (filters?: ProgressFilterDto): Promise<ProgressTrackingResponse> => {
        try {
            const token = localStorage.getItem('dev-token') || localStorage.getItem('token');
            
            const response = await axios.get<ProgressTrackingResponse>(
                `${API_CONFIG.BASE_URL}/teacher/progress/tracking`,
                {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Content-Type': 'application/json',
                    },
                    params: filters,
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error fetching progress tracking:', error);
            throw new Error(
                error.response?.data?.message || 
                'Không thể tải dữ liệu theo dõi tiến độ'
            );
        }
    },

    /**
     * Lấy chi tiết một milestone cụ thể
     * GET /api/teacher/progress/milestone/:id
     */
    getMilestoneDetail: async (milestoneId: number): Promise<TimelineMilestone> => {
        try {
            const token = localStorage.getItem('dev-token') || localStorage.getItem('token');
            
            const response = await axios.get<TimelineMilestone>(
                `${API_CONFIG.BASE_URL}/teacher/progress/milestone/${milestoneId}`,
                {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error fetching milestone detail:', error);
            throw new Error(
                error.response?.data?.message || 
                'Không thể tải chi tiết milestone'
            );
        }
    },

    /**
     * Lấy danh sách sinh viên trong lớp với chi tiết tiến độ
     * (Sử dụng class-management API để lấy students by class)
     */
    getClassStudentsProgress: async (classCode: string) => {
        try {
            const token = localStorage.getItem('dev-token') || localStorage.getItem('token');
            
            const response = await axios.get(
                `${API_CONFIG.BASE_URL}/teacher/class-management/students/${classCode}`,
                {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error: any) {
            console.error('Error fetching class students:', error);
            throw new Error(
                error.response?.data?.message || 
                'Không thể tải danh sách sinh viên'
            );
        }
    },
};
