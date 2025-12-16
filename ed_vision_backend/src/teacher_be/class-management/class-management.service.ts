import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import { StudentRowData, UploadClassResponseDto } from './dto/upload-class.dto';

@Injectable()
export class ClassManagementService {
    constructor(private prisma: PrismaService) { }

    /**
     * Lấy danh sách các lớp mà giảng viên phụ trách
     */
    async getInstructorClasses(instructorId: number) {
        // Get all classes where this instructor is the adviser
        const classGroups = await this.prisma.classGroup.findMany({
            where: {
                status: 'active',
                adviserAssignments: {
                    some: {
                        instructor_id: instructorId,
                        ended_date: null
                    }
                }
            },
            include: {
                program: {
                    include: {
                        department: true
                    }
                },
                students: {
                    where: {
                        status: 'active'
                    },
                    include: {
                        courseRecords: {
                            where: {
                                raw_score: { not: null }
                            }
                        }
                    }
                },
                adviserAssignments: {
                    where: {
                        instructor_id: instructorId,
                        ended_date: null
                    },
                    include: {
                        instructor: {
                            include: {
                                account: {
                                    include: {
                                        profile: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Map to frontend format
        const classList = classGroups.map(classGroup => {
            const atRiskCount = classGroup.students.filter(s => {
                if (s.courseRecords.length === 0) return false;
                const gpa = this.calculateGPA(s.courseRecords);
                return gpa < 2.0;
            }).length;

            const adviser = classGroup.adviserAssignments[0]?.instructor;
            const teacherName = adviser?.account?.profile?.full_name || 'Not assigned';

            return {
                id: classGroup.class_code,
                name: classGroup.class_code,
                class_code: classGroup.class_code, // For filter extraction
                major: classGroup.program ? 
                    `${classGroup.program.program_name} - Khóa ${classGroup.cohort_year}` :
                    `Khóa ${classGroup.cohort_year}`,
                faculty: classGroup.program?.department?.name || 'Chưa xác định', // For filter extraction
                academic_year: `${classGroup.cohort_year}-${classGroup.cohort_year + 1}`, // For filter extraction
                students: classGroup.students.length,
                teacher: teacherName,
                atRisk: atRiskCount,
                status: 'Đang hoạt động',
                year: `Năm học ${classGroup.cohort_year}-${classGroup.cohort_year + 1}`
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
            const hasCourseRecords = student.courseRecords.length > 0;
            const gpa = hasCourseRecords ? this.calculateGPA(student.courseRecords) : null;
            const riskLevel = hasCourseRecords && gpa !== null ? this.determineRiskLevel(gpa) : null;

            return {
                masv: student.student_code,
                name: student.account?.profile?.full_name || 'Unknown',
                avatar: student.account?.profile?.avatar_url || '/default-avatar.png',
                email: student.account?.email || '',
                gpa: gpa !== null ? parseFloat(gpa.toFixed(2)) : null,
                predictedGpa: null, // Chỉ tính khi có model dự đoán thật
                attendance: null, // Chỉ có khi có dữ liệu điểm danh thật
                status: hasCourseRecords && gpa !== null ? this.getStudentStatus(gpa) : 'No Data',
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
     * Lấy danh sách chương trình đào tạo
     */
    async getPrograms() {
        return this.prisma.program.findMany({
            select: {
                program_id: true,
                program_code: true,
                program_name: true,
                duration_years: true,
            },
            orderBy: {
                program_code: 'asc',
            },
        });
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

    /**
     * Upload danh sách lớp từ file Excel/CSV
     */
    async uploadClassList(
        instructorId: number,
        file: Express.Multer.File,
        classCode: string,
    ): Promise<UploadClassResponseDto> {
        try {
            if (!file) throw new BadRequestException('No file uploaded');

            const students = await this.parseClassFileNoValidation(file);
            if (!students.length) throw new BadRequestException('No student data found');

            // Find or create class
            let classGroup = await this.prisma.classGroup.findUnique({
                where: { class_code: classCode },
            });

            if (!classGroup) {
                // Create new class + adviser assignment
                classGroup = await this.prisma.classGroup.create({
                    data: { class_code: classCode, cohort_year: new Date().getFullYear() },
                });

                await this.prisma.adviserAssignment.create({
                    data: {
                        class_id: classGroup.class_id,
                        instructor_id: instructorId,
                        assigned_date: new Date(),
                        ended_date: null,
                    },
                });
            } else {
                // Check permission
                const isAdviser = await this.prisma.adviserAssignment.findFirst({
                    where: {
                        class_id: classGroup.class_id,
                        instructor_id: instructorId,
                        ended_date: null,
                    },
                });
                if (!isAdviser) throw new BadRequestException('Access denied - not class adviser');
            }

            const results = {
                total: students.length,
                created: 0,
                updated: 0,
                errors: [] as { student_code: string; email: string; error: string }[],
            };

            const studentRole = await this.prisma.role.findUnique({
                where: { code: 'student' },
            });

            if (!studentRole) throw new BadRequestException('Student role not configured');

            for (const studentData of students) {
                try {
                    let account = await this.prisma.account.findUnique({
                        where: { email: studentData.email },
                        include: { student: true, profile: true },
                    });

                    if (!account) {
                        // Tạo password từ tên trước email + "123"
                        // Ví dụ: nguyenvana@gmail.com -> nguyenvana123
                        const emailUsername = studentData.email.split('@')[0];
                        const defaultPassword = `${emailUsername}123`;
                        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                        
                        account = await this.prisma.account.create({
                            data: {
                                email: studentData.email,
                                password_hash: hashedPassword,
                                status: 'active',
                                role_id: studentRole.id,
                                profile: {
                                    create: {
                                        full_name: studentData.full_name,
                                    },
                                },
                            },
                            include: { student: true, profile: true },
                        });
                    } else {
                        if (account.profile && studentData.full_name) {
                            await this.prisma.profile.update({
                                where: { profile_id: account.profile.profile_id },
                                data: { full_name: studentData.full_name },
                            });
                        }
                    }

                    if (!account.student) {
                        await this.prisma.student.create({
                            data: {
                                account_id: account.account_id,
                                student_code: studentData.student_code,
                                major: studentData.major || null,
                                cohort_year: studentData.cohort_year || new Date().getFullYear(),
                                class_id: classGroup.class_id,
                                status: 'active',
                            },
                        });
                        results.created++;
                    } else {
                        await this.prisma.student.update({
                            where: { student_id: account.student.student_id },
                            data: {
                                student_code: studentData.student_code,
                                major: studentData.major || account.student.major,
                                cohort_year: studentData.cohort_year || account.student.cohort_year,
                                class_id: classGroup.class_id,
                            },
                        });
                        results.updated++;
                    }
                } catch (error) {
                    results.errors.push({
                        student_code: studentData.student_code,
                        email: studentData.email,
                        error: error.message,
                    });
                }
            }

            return {
                success: results.errors.length === 0,
                message:
                    results.errors.length === 0
                        ? `Successfully uploaded ${results.total} students (${results.created} new, ${results.updated} updated)`
                        : `Upload completed: ${results.created + results.updated}/${results.total} success, ${results.errors.length} failed`,
                data: {
                    class_id: classGroup.class_id,
                    class_code: classGroup.class_code,
                    total_records: results.total,
                    successful_records: results.created + results.updated,
                    students_created: results.created,
                    students_updated: results.updated,
                    failed_records: results.errors.length,
                    errors: results.errors.length > 0 ? results.errors : undefined,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException(`File processing error: ${error.message}`);
        }
    }

    /**
     * Parse file - với validation rõ ràng và error messages chi tiết
     */
    private async parseClassFileNoValidation(file: Express.Multer.File): Promise<StudentRowData[]> {
        const rawData = file.mimetype === 'text/csv'
            ? await this.parseCSV(file.buffer)
            : await this.parseExcel(file.buffer);

        if (!rawData.length) throw new BadRequestException('File is empty');

        const columns = Object.keys(rawData[0]);
        console.log('📄 File info:', {
            rows: rawData.length,
            columns: columns,
            firstRow: rawData[0]
        });

        // Validate required columns exist
        const requiredColumns = {
            studentCode: ['student_code', 'Student Code', 'Mã SV', 'MSSV', 'student_id'],
            fullName: ['full_name', 'Full Name', 'Họ tên', 'Name', 'name'],
            email: ['email', 'Email', 'student_email', 'Student Email']
        };

        const foundColumns = {
            studentCode: columns.find(col => requiredColumns.studentCode.includes(col)),
            fullName: columns.find(col => requiredColumns.fullName.includes(col)),
            email: columns.find(col => requiredColumns.email.includes(col))
        };

        // Check missing columns
        const missingColumns: string[] = [];
        if (!foundColumns.studentCode) missingColumns.push('student_code (or Student Code, Mã SV, MSSV)');
        if (!foundColumns.fullName) missingColumns.push('full_name (or Full Name, Họ tên, Name)');
        if (!foundColumns.email) missingColumns.push('email (or Email, student_email)');

        if (missingColumns.length > 0) {
            throw new BadRequestException(
                `Missing required columns: ${missingColumns.join(', ')}. ` +
                `Found columns: ${columns.join(', ')}`
            );
        }

        const students: StudentRowData[] = [];
        const errors: string[] = [];

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rowNum = i + 2; // +2 because row 1 is header

            const studentCode = row['student_code'] || row['Student Code'] || row['Mã SV'] || row['MSSV'] || '';
            const fullName = row['full_name'] || row['Full Name'] || row['Họ tên'] || row['Name'] || '';
            const email = row['email'] || row['Email'] || row['student_email'] || '';

            // Skip completely empty rows
            if (!studentCode && !fullName && !email) continue;

            // Validate each field
            const rowErrors: string[] = [];
            if (!studentCode) rowErrors.push('missing student_code');
            if (!fullName) rowErrors.push('missing full_name');
            if (!email) rowErrors.push('missing email');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) rowErrors.push('invalid email format');

            if (rowErrors.length > 0) {
                errors.push(`Row ${rowNum}: ${rowErrors.join(', ')} | Data: ${studentCode || 'N/A'} | ${fullName || 'N/A'} | ${email || 'N/A'}`);
                continue;
            }

            students.push({
                student_code: String(studentCode).trim(),
                full_name: String(fullName).trim(),
                email: String(email).trim().toLowerCase(),
                major: undefined,
                cohort_year: undefined,
            });
        }

        console.log(`✅ Parsed ${students.length} valid students`);
        if (errors.length > 0) {
            console.warn(`⚠️ ${errors.length} rows skipped due to errors:`);
            errors.slice(0, 5).forEach(err => console.warn(`   ${err}`));
            if (errors.length > 5) console.warn(`   ... and ${errors.length - 5} more errors`);
        }

        if (students.length === 0 && errors.length > 0) {
            throw new BadRequestException(
                `No valid students found. Errors in ${errors.length} rows:\n` +
                errors.slice(0, 3).join('\n') +
                (errors.length > 3 ? `\n... and ${errors.length - 3} more errors` : '')
            );
        }

        return students;
    }

    /**
     * Parse CSV file
     */
    private async parseCSV(buffer: Buffer): Promise<any[]> {
        let content = buffer.toString('utf-8');

        // Remove UTF-8 BOM if present
        if (content.charCodeAt(0) === 0xfeff) {
            content = content.slice(1);
        }

        content = content.trim();
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
        const records: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
            const record: any = {};
            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            records.push(record);
        }

        return records;
    }

    /**
     * Parse Excel file
     */
    private async parseExcel(buffer: Buffer): Promise<any[]> {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(sheet);
    }
}
