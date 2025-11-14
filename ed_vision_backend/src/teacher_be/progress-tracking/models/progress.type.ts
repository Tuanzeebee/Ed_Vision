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
