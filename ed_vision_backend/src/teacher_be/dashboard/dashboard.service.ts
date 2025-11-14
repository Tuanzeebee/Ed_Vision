import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import {
    DashboardResponse,
    DashboardStats,
    AtRiskStudent,
    ChartData,
} from './models/dashboard-stats.type';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    /**
     * Lấy thống kê tổng quan cho giảng viên
     */
    async getDashboardStats(
        instructorId: number,
        filterDto: DashboardFilterDto,
    ): Promise<DashboardResponse> {
        // Lấy danh sách lớp mà giảng viên phụ trách (adviser)
        const classes = await this.getInstructorClasses(instructorId);

        if (!classes || classes.length === 0) {
            return this.getEmptyDashboard();
        }

        const classIds = classes.map((c) => c.class_id);

        // Lấy danh sách sinh viên trong các lớp
        const students = await this.prisma.student.findMany({
            where: {
                class_id: { in: classIds },
                status: 'active',
            },
            include: {
                account: {
                    include: {
                        profile: true,
                    },
                },
                courseRecords: {
                    where: {
                        academicTerm: this.buildTermFilter(filterDto),
                    },
                    include: {
                        course: true,
                    },
                },
            },
        });

        // Tính toán stats
        const stats = await this.calculateStats(students);
        const atRiskStudents = this.identifyAtRiskStudents(students);
        const weeklyProgressChart = this.generateWeeklyProgressChart(students);
        const majorComparisonChart =
            this.generateMajorComparisonChart(students, classes);

        return {
            stats,
            atRiskStudents: atRiskStudents.slice(0, 4), // Top 4 at-risk students
            weeklyProgressChart,
            majorComparisonChart,
        };
    }

    /**
     * Lấy danh sách lớp mà giảng viên phụ trách
     */
    private async getInstructorClasses(instructorId: number) {
        const assignments = await this.prisma.adviserAssignment.findMany({
            where: {
                instructor_id: instructorId,
                ended_date: null, // Chỉ lấy những lớp đang phụ trách
            },
            include: {
                classGroup: {
                    include: {
                        program: {
                            include: {
                                department: true,
                            },
                        },
                    },
                },
            },
        });

        return assignments.map((a) => a.classGroup);
    }

    /**
     * Xây dựng filter cho academic term
     */
    private buildTermFilter(filterDto: DashboardFilterDto) {
        const filter: any = {};

        if (filterDto.academicYear) {
            filter.academic_year = filterDto.academicYear;
        }

        if (filterDto.semester) {
            filter.semester_number = filterDto.semester;
        }

        return filter;
    }

    /**
     * Tính toán thống kê từ dữ liệu sinh viên
     */
    private async calculateStats(students: any[]): Promise<DashboardStats> {
        const totalStudents = students.length;

        // Tính GPA cho từng sinh viên
        const studentGPAs = students.map((student) => {
            const records = student.courseRecords;
            if (!records || records.length === 0) return 0;

            // Lấy các môn đã có điểm cuối kỳ
            const completedRecords = records.filter(
                (r: any) =>
                    r.converted_numeric_score !== null && r.status === 'completed',
            );

            if (completedRecords.length === 0) return 0;

            const totalScore = completedRecords.reduce(
                (sum: number, r: any) => sum + parseFloat(r.converted_numeric_score || 0),
                0,
            );
            return totalScore / completedRecords.length;
        });

        const validGPAs = studentGPAs.filter((gpa) => gpa > 0);
        const averageGPA =
            validGPAs.length > 0
                ? validGPAs.reduce((sum, gpa) => sum + gpa, 0) / validGPAs.length
                : 0;

        // Tính median GPA
        const sortedGPAs = [...validGPAs].sort((a, b) => a - b);
        const medianGPA =
            sortedGPAs.length > 0
                ? sortedGPAs[Math.floor(sortedGPAs.length / 2)]
                : 0;

        const minGPA = sortedGPAs.length > 0 ? sortedGPAs[0] : 0;

        // Phân phối điểm
        const gradeDistribution = {
            low: validGPAs.filter((gpa) => gpa < 5.0).length,
            medium: validGPAs.filter((gpa) => gpa >= 5.0 && gpa < 8.0).length,
            high: validGPAs.filter((gpa) => gpa >= 8.0).length,
        };

        // Sinh viên at-risk (GPA < 2.5 theo schema frontend)
        const atRiskCount = validGPAs.filter((gpa) => gpa < 2.5).length;
        const atRiskPercentage =
            totalStudents > 0 ? (atRiskCount / totalStudents) * 100 : 0;

        // Tính số lớp (unique class_id)
        const uniqueClassIds = new Set(
            students.map((s) => s.class_id).filter(Boolean),
        );
        const totalClasses = uniqueClassIds.size;

        return {
            totalStudents,
            totalClasses,
            atRiskPercentage: Math.round(atRiskPercentage * 10) / 10,
            atRiskCount,
            gradeDistribution,
            averageGPA: Math.round(averageGPA * 100) / 100,
            medianGPA: Math.round(medianGPA * 100) / 100,
            minGPA: Math.round(minGPA * 100) / 100,
        };
    }

    /**
     * Xác định sinh viên at-risk
     */
    private identifyAtRiskStudents(students: any[]): AtRiskStudent[] {
        const atRiskStudents: AtRiskStudent[] = [];

        for (const student of students) {
            const records = student.courseRecords || [];
            const completedRecords = records.filter(
                (r: any) =>
                    r.converted_numeric_score !== null && r.status === 'completed',
            );

            if (completedRecords.length === 0) continue;

            const gpa =
                completedRecords.reduce(
                    (sum: number, r: any) => sum + parseFloat(r.converted_numeric_score || 0),
                    0,
                ) / completedRecords.length;

            // At-risk if GPA < 2.5
            if (gpa < 2.5) {
                const debtCourses = records.filter(
                    (r: any) => r.status === 'failed' || r.status === 'planned',
                ).length;

                // Estimate absences (placeholder - would need actual attendance data)
                const absences = Math.floor(Math.random() * 15);

                let riskLevel: 'high' | 'medium' | 'low' = 'low';
                if (gpa < 1.5) riskLevel = 'high';
                else if (gpa < 2.0) riskLevel = 'medium';

                atRiskStudents.push({
                    studentId: student.student_id.toString(),
                    studentCode: student.student_code,
                    name: student.account?.profile?.full_name || 'Unknown',
                    class: student.classGroup?.class_code || 'Unknown',
                    avatar: student.account?.profile?.avatar_url,
                    gpa: Math.round(gpa * 100) / 100,
                    absences,
                    debtCourses,
                    riskLevel,
                });
            }
        }

        // Sắp xếp theo mức độ rủi ro (cao -> thấp) và GPA (thấp -> cao)
        return atRiskStudents.sort((a, b) => {
            const riskOrder = { high: 0, medium: 1, low: 2 };
            if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
                return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
            }
            return a.gpa - b.gpa;
        });
    }

    /**
     * Tạo dữ liệu biểu đồ tiến độ theo tuần
     */
    private generateWeeklyProgressChart(students: any[]): ChartData {
        // Mock data - in production would calculate from actual weekly data
        return {
            labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
            datasets: [
                {
                    label: 'Average GPA',
                    data: [6.5, 7.2, 6.8, 7.5, 7.8, 8.2, 8.5, 8.3, 8.8, 9.0, 8.7, 9.2],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
            ],
        };
    }

    /**
     * Tạo dữ liệu biểu đồ so sánh theo ngành
     */
    private generateMajorComparisonChart(
        students: any[],
        classes: any[],
    ): ChartData {
        // Group by program
        const programStats = new Map<string, { totalGPA: number; count: number }>();

        for (const student of students) {
            const records = student.courseRecords || [];
            const completedRecords = records.filter(
                (r: any) =>
                    r.converted_numeric_score !== null && r.status === 'completed',
            );

            if (completedRecords.length === 0) continue;

            const gpa =
                completedRecords.reduce(
                    (sum: number, r: any) => sum + parseFloat(r.converted_numeric_score || 0),
                    0,
                ) / completedRecords.length;

            const classInfo = classes.find((c) => c.class_id === student.class_id);
            const programName =
                classInfo?.program?.program_name || 'Unknown Program';

            if (!programStats.has(programName)) {
                programStats.set(programName, { totalGPA: 0, count: 0 });
            }

            const stats = programStats.get(programName)!;
            stats.totalGPA += gpa;
            stats.count += 1;
        }

        const labels: string[] = [];
        const data: number[] = [];

        programStats.forEach((stats, programName) => {
            labels.push(programName);
            data.push(Math.round((stats.totalGPA / stats.count) * 100) / 100);
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Average GPA by Program',
                    data,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                },
            ],
        };
    }

    /**
     * Trả về dashboard rỗng khi không có dữ liệu
     */
    private getEmptyDashboard(): DashboardResponse {
        return {
            stats: {
                totalStudents: 0,
                totalClasses: 0,
                atRiskPercentage: 0,
                atRiskCount: 0,
                gradeDistribution: { low: 0, medium: 0, high: 0 },
                averageGPA: 0,
                medianGPA: 0,
                minGPA: 0,
            },
            atRiskStudents: [],
            weeklyProgressChart: { labels: [], datasets: [] },
            majorComparisonChart: { labels: [], datasets: [] },
        };
    }
}
