export interface DashboardStats {
    totalStudents: number;
    totalClasses: number;
    atRiskPercentage: number;
    atRiskCount: number;
    gradeDistribution: {
        low: number; // < 5.0
        medium: number; // 5.0 - 7.9
        high: number; // >= 8.0
    };
    averageGPA: number;
    medianGPA: number;
    minGPA: number;
    maxGPA: number;
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

export interface DashboardResponse {
    stats: DashboardStats;
    atRiskStudents: AtRiskStudent[];
    weeklyProgressChart: ChartData;
    majorComparisonChart: ChartData;
}
