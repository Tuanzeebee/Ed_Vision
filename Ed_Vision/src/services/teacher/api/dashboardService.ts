import apiClient from '../../api/apiClient';

// Types for teacher dashboard
export interface TeacherDashboardStats {
    totalStudents: number;
    totalClasses: number;
    atRiskPercentage: number;
    atRiskCount: number;
    gradeDistribution: {
        low: number; // < 2.0
        medium: number; // 2.0 - 3.19
        high: number; // >= 3.2
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
    riskLevel: 'high' | 'medium' | 'low';
}

export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        borderColor?: string;
        backgroundColor?: string;
    }>;
}

export interface TeacherDashboardResponse {
    stats: TeacherDashboardStats;
    atRiskStudents: AtRiskStudent[];
    weeklyProgressChart: ChartData;
    majorComparisonChart: ChartData;
}

export interface TeacherDashboardFilterDto {
    faculty?: string;
    course?: string;
    academicYear?: string;
    semester?: number;
}

export interface FilterOptionsResponse {
    faculties: string[];
    courses: string[];
    academicYears: string[];
    semesters: number[];
    classes: any[];
}

class TeacherDashboardService {
    /**
     * Lấy thống kê dashboard cho giảng viên
     */
    async getDashboardStats(filters?: TeacherDashboardFilterDto): Promise<TeacherDashboardResponse> {
        try {
            const response = await apiClient.get<TeacherDashboardResponse>(
                '/teacher/dashboard/stats',
                { params: filters }
            );
            return response.data;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Lấy filter options cho dashboard
     */
    async getFilterOptions(): Promise<FilterOptionsResponse> {
        try {
            const response = await apiClient.get<FilterOptionsResponse>(
                '/teacher/dashboard/filter-options'
            );
            return response.data;
        } catch (error: any) {
            // Return default values if API fails
            return {
                faculties: [],
                courses: [],
                academicYears: ['2024-2025', '2023-2024', '2022-2023'],
                semesters: [1, 2],
                classes: [],
            };
        }
    }
}

export default new TeacherDashboardService();
