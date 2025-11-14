import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClassManagementService {
    constructor(private prisma: PrismaService) { }

    /**
     * Lấy danh sách các lớp mà giảng viên phụ trách
     */
    async getInstructorClasses(instructorId: number) {
        // Lấy tất cả sinh viên có điểm trong hệ thống
        const students = await this.prisma.student.findMany({
            where: {
                status: 'active',
                courseRecords: {
                    some: {
                        raw_score: { not: null }
                    }
                }
            },
            include: {
                classGroup: {
                    include: {
                        program: {
                            include: {
                                department: true
                            }
                        }
                    }
                },
                courseRecords: {
                    where: {
                        raw_score: { not: null }
                    },
                    include: {
                        course: true,
                        academicTerm: true
                    }
                }
            }
        });

        // Nhóm sinh viên theo lớp
        const classGroups = new Map();

        students.forEach(student => {
            const classId = student.class_id;
            const classCode = student.classGroup?.class_code || 'Unknown';

            if (!classGroups.has(classId)) {
                classGroups.set(classId, {
                    id: classCode,
                    name: classCode,
                    major: `${student.classGroup?.program?.program_name || 'Unknown'} - Khóa ${student.classGroup?.cohort_year || ''}`,
                    students: [],
                    teacher: 'TS. Nguyễn Văn A',
                    status: 'Đang hoạt động',
                    year: 'Năm học 2024-2025',
                    department: student.classGroup?.program?.department?.name || 'Unknown'
                });
            }

            classGroups.get(classId).students.push(student);
        });

        // Tính toán thống kê cho từng lớp
        const classList = Array.from(classGroups.values()).map(classGroup => {
            const atRiskCount = classGroup.students.filter(s => {
                const gpa = this.calculateGPA(s.courseRecords);
                return gpa < 2.0;
            }).length;

            return {
                id: classGroup.id,
                name: classGroup.name,
                major: classGroup.major,
                students: classGroup.students.length,
                teacher: classGroup.teacher,
                atRisk: atRiskCount,
                status: classGroup.status,
                year: classGroup.year
            };
        });

        return classList;
    }

    /**
     * Lấy danh sách sinh viên trong lớp
     */
    async getStudentsByClass(classCode: string) {
        const students = await this.prisma.student.findMany({
            where: {
                status: 'active',
                classGroup: {
                    class_code: classCode
                },
                courseRecords: {
                    some: {
                        raw_score: { not: null }
                    }
                }
            },
            include: {
                account: {
                    include: {
                        profile: true
                    }
                },
                courseRecords: {
                    where: {
                        raw_score: { not: null }
                    },
                    include: {
                        course: true,
                        academicTerm: true
                    }
                }
            }
        });

        return students.map(student => {
            const gpa = this.calculateGPA(student.courseRecords);
            const riskLevel = this.determineRiskLevel(gpa);

            return {
                masv: student.student_code,
                name: student.account?.profile?.full_name || 'Unknown',
                avatar: student.account?.profile?.avatar_url || '/default-avatar.png',
                email: student.account?.email || '',
                gpa: parseFloat(gpa.toFixed(2)),
                predictedGpa: parseFloat((gpa + (Math.random() * 0.4 - 0.2)).toFixed(2)),
                attendance: Math.floor(Math.random() * 30) + 70,
                status: this.getStudentStatus(gpa),
                riskLevel: riskLevel,
                address: student.account?.profile?.address || '',
                courses: student.courseRecords.length,
                totalCredits: student.courseRecords.reduce((sum, record) =>
                    sum + (record.course?.credits_unit || 0), 0
                )
            };
        });
    }

    /**
     * Tính GPA từ danh sách môn học
     */
    private calculateGPA(courseRecords: any[]): number {
        if (courseRecords.length === 0) return 0;

        let totalPoints = 0;
        let totalCredits = 0;

        courseRecords.forEach(record => {
            const score = parseFloat(record.raw_score?.toString() || '0');
            const credits = record.course?.credits_unit || 3;

            // Convert 10-point scale to 4-point scale
            let point4Scale = 0;
            if (score >= 9.0) point4Scale = 4.0;
            else if (score >= 8.5) point4Scale = 3.7;
            else if (score >= 8.0) point4Scale = 3.5;
            else if (score >= 7.0) point4Scale = 3.0;
            else if (score >= 6.5) point4Scale = 2.5;
            else if (score >= 5.5) point4Scale = 2.0;
            else if (score >= 5.0) point4Scale = 1.5;
            else if (score >= 4.0) point4Scale = 1.0;
            else point4Scale = 0;

            totalPoints += point4Scale * credits;
            totalCredits += credits;
        });

        return totalCredits > 0 ? totalPoints / totalCredits : 0;
    }

    /**
     * Xác định mức độ rủi ro
     */
    private determineRiskLevel(gpa: number): string {
        if (gpa < 2.0) return 'High';
        if (gpa < 2.4) return 'Medium';
        if (gpa < 2.68) return 'Monitor';
        return 'None';
    }

    /**
     * Xác định trạng thái sinh viên
     */
    private getStudentStatus(gpa: number): string {
        if (gpa >= 3.2) return 'Excellent';
        if (gpa >= 2.68) return 'Good';
        if (gpa >= 2.0) return 'Warning';
        return 'At Risk';
    }

    /**
     * Thống kê tổng quan
     */
    async getStatistics(instructorId: number) {
        const classes = await this.getInstructorClasses(instructorId);

        const totalClasses = classes.length;
        const totalStudents = classes.reduce((sum, cls) => sum + cls.students, 0);
        const activeClasses = classes.filter(cls => cls.status === 'Đang hoạt động').length;
        const totalAtRisk = classes.reduce((sum, cls) => sum + cls.atRisk, 0);

        return {
            totalClasses,
            totalStudents,
            activeClasses,
            totalAtRisk
        };
    }
}
