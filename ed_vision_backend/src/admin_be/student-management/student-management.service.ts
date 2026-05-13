import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import { StudentResponse } from './models/student-response.type';
import { StudentListResponse } from './models/student-list.type';
import { StudentOnlineStats } from './models/student-stats.type';
import {
  StudentDirectoryFilterDto,
  CertificateType,
  RiskLevel,
  LearningStatus,
} from './dto/student-directory-filter.dto';
import {
  StudentDirectoryResponse,
  StudentDirectoryItem,
  StudentDirectoryStats,
  StudentDetailResponse,
} from './models/student-directory.types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentManagementService {
  constructor(private prisma: PrismaService) {}

  async getOnlineStats(): Promise<StudentOnlineStats> {
    // Get total count of students (all students in Student table)
    const totalCount = await this.prisma.student.count();

    // Get online student count - only count accounts that:
    // 1. Are linked to a student (via account_id in Student table)
    // 2. Have role = 'student' in Role table (via role_id)
    // 3. Are currently logged in (last_login_at > last_logout_at or last_logout_at is null)
    const onlineResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::int as count
      FROM "Account" a
      INNER JOIN "Student" s ON a.account_id = s.account_id
      INNER JOIN "Role" r ON a.role_id = r.id
      WHERE r.code = 'student'
        AND a.last_login_at IS NOT NULL
        AND (
          a.last_logout_at IS NULL
          OR a.last_login_at > a.last_logout_at
        )
    `;

    const onlineCount = Number(onlineResult[0]?.count || 0);

    return {
      onlineCount,
      totalCount,
    };
  }

  async getFilterOptions() {
    // Get all departments
    const departments = await this.prisma.department.findMany({
      where: { status: 'active' },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    // Get all programs with their department
    const programs = await this.prisma.program.findMany({
      select: {
        program_name: true,
        department: {
          select: { name: true },
        },
      },
      orderBy: { program_name: 'asc' },
    });

    return {
      departments: departments.map((d) => d.name),
      programs: programs.map((p) => ({
        name: p.program_name,
        department: p.department.name,
      })),
      statuses: [
        { code: 'active', name: 'Đang học' },
        { code: 'inactive', name: 'Tạm nghỉ' },
        { code: 'at-risk', name: 'Cảnh báo' },
        { code: 'blocked', name: 'Đã khóa' },
      ],
    };
  }

  async findAll(filterDto: StudentFilterDto): Promise<StudentListResponse> {
    const {
      search,
      department,
      program,
      cohortYear,
      classId,
      status,
      page = 1,
      limit = 10,
    } = filterDto;

    const where: any = {};

    if (search) {
      where.OR = [
        { student_code: { contains: search, mode: 'insensitive' } },
        { account: { email: { contains: search, mode: 'insensitive' } } },
        {
          account: {
            profile: { full_name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    // Filter by department through ClassGroup -> Program -> Department
    if (department) {
      where.classGroup = {
        ...where.classGroup,
        program: {
          ...where.classGroup?.program,
          department: {
            name: department,
          },
        },
      };
    }

    // Filter by program through ClassGroup -> Program
    if (program) {
      where.classGroup = {
        ...where.classGroup,
        program: {
          ...where.classGroup?.program,
          program_name: program,
        },
      };
    }

    if (cohortYear) {
      where.cohort_year = cohortYear;
    }

    if (classId) {
      where.class_id = classId;
    }

    if (status) {
      where.status = status;
    }

    const total = await this.prisma.student.count({ where });

    const students = await this.prisma.student.findMany({
      where,
      include: {
        account: {
          include: {
            profile: true,
          },
        },
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
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { student_id: 'desc' },
    });

    const data: StudentResponse[] = students.map((student) => ({
      studentId: student.student_id,
      accountId: student.account_id,
      studentCode: student.student_code,
      email: student.account.email,
      major: student.major || undefined,
      cohortYear: student.cohort_year || undefined,
      status: student.status || 'active',
      createdAt: student.account.created_at.toISOString(),
      gpa: undefined, // GPA will be calculated separately in the future
      profile: student.account.profile
        ? {
            fullName: student.account.profile.full_name,
            dateOfBirth: student.account.profile.date_of_birth?.toISOString(),
            gender: student.account.profile.gender || undefined,
            address: student.account.profile.address || undefined,
            avatarUrl: student.account.profile.avatar_url || undefined,
          }
        : undefined,
      department: student.classGroup?.program?.department
        ? {
            name: student.classGroup.program.department.name,
          }
        : undefined,
      program: student.classGroup?.program
        ? {
            programName: student.classGroup.program.program_name,
          }
        : undefined,
      classInfo: student.classGroup
        ? {
            classId: student.classGroup.class_id,
            classCode: student.classGroup.class_code,
            programName: student.classGroup.program?.program_name,
          }
        : undefined,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<StudentResponse> {
    // Try to find by student_id first, then by account_id
    let student = await this.prisma.student.findUnique({
      where: { student_id: id },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        classGroup: {
          include: {
            program: true,
          },
        },
      },
    });

    // If not found by student_id, try account_id
    if (!student) {
      student = await this.prisma.student.findUnique({
        where: { account_id: id },
        include: {
          account: {
            include: {
              profile: true,
            },
          },
          classGroup: {
            include: {
              program: true,
            },
          },
        },
      });
    }

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return {
      studentId: student.student_id,
      accountId: student.account_id,
      studentCode: student.student_code,
      email: student.account.email,
      major: student.major || undefined,
      cohortYear: student.cohort_year || undefined,
      status: student.status || 'active',
      createdAt: student.account.created_at.toISOString(),
      profile: student.account.profile
        ? {
            fullName: student.account.profile.full_name,
            dateOfBirth: student.account.profile.date_of_birth?.toISOString(),
            gender: student.account.profile.gender || undefined,
            address: student.account.profile.address || undefined,
            avatarUrl: student.account.profile.avatar_url || undefined,
          }
        : undefined,
      classInfo: student.classGroup
        ? {
            classId: student.classGroup.class_id,
            classCode: student.classGroup.class_code,
            programName: student.classGroup.program?.program_name,
          }
        : undefined,
    };
  }

  async create(createStudentDto: CreateStudentDto): Promise<StudentResponse> {
    const { fullName, studentCode, ...studentData } = createStudentDto;

    // Tự động tạo password từ email nếu không được cung cấp
    // Ví dụ: nguyenvana@gmail.com -> nguyenvana123
    let password = createStudentDto.password;
    if (!password) {
      const emailUsername = createStudentDto.email.split('@')[0];
      password = `${emailUsername}123`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const studentRole = await this.prisma.role.findUnique({
      where: { code: 'student' },
    });

    if (!studentRole) {
      throw new NotFoundException('Student role not found');
    }

    const account = await this.prisma.account.create({
      data: {
        email: createStudentDto.email,
        password_hash: hashedPassword,
        role_id: studentRole.id,
        status: 'active',
        profile: {
          create: {
            full_name: fullName,
            date_of_birth: studentData.dateOfBirth
              ? new Date(studentData.dateOfBirth)
              : undefined,
            gender: studentData.gender,
            address: studentData.address,
          },
        },
        student: {
          create: {
            student_code: studentCode,
            major: studentData.major,
            cohort_year: studentData.cohortYear,
            class_id: studentData.classId,
            status: 'active',
          },
        },
      },
      include: {
        student: true,
      },
    });

    return this.findOne(account.student!.student_id);
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponse> {
    const student = await this.prisma.student.findUnique({
      where: { student_id: id },
      include: { account: { include: { profile: true } } },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    await this.prisma.student.update({
      where: { student_id: id },
      data: {
        major: updateStudentDto.major,
        cohort_year: updateStudentDto.cohortYear,
        class_id: updateStudentDto.classId,
        status: updateStudentDto.status,
      },
    });

    if (student.account.profile) {
      await this.prisma.profile.update({
        where: { profile_id: student.account.profile.profile_id },
        data: {
          full_name: updateStudentDto.fullName,
          date_of_birth: updateStudentDto.dateOfBirth
            ? new Date(updateStudentDto.dateOfBirth)
            : undefined,
          gender: updateStudentDto.gender,
          address: updateStudentDto.address,
        },
      });
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { student_id: id },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    await this.prisma.account.delete({
      where: { account_id: student.account_id },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT DIRECTORY DASHBOARD APIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get statistics for Student Directory Dashboard cards
   */
  async getDirectoryStats(): Promise<StudentDirectoryStats> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total students
    const totalStudents = await this.prisma.student.count();

    // Total students last month (for comparison)
    const totalStudentsLastMonth = await this.prisma.student.count({
      where: {
        account: {
          created_at: { lt: thisMonth },
        },
      },
    });

    const totalChangePercent = totalStudentsLastMonth > 0
      ? Math.round(((totalStudents - totalStudentsLastMonth) / totalStudentsLastMonth) * 100)
      : 0;

    // Count by certificate enrollment
    const certEnrollments = await this.prisma.certificateEnrollment.groupBy({
      by: ['cert_type'],
      where: { status: 'active' },
      _count: { cert_type: true },
    });

    const ieltsCount = certEnrollments.find(e => e.cert_type === 'ielts')?._count?.cert_type || 0;
    const toeicCount = certEnrollments.find(e => e.cert_type === 'toeic')?._count?.cert_type || 0;

    // Active students (have activity in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeStudentIds = await this.prisma.userActivityLog.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo },
        action_type: { not: 'logout' },
      },
      select: { account_id: true },
      distinct: ['account_id'],
    });

    const activeStudents = activeStudentIds.length;
    const activePercent = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

    // At-risk students
    const atRiskProgress = await this.prisma.studentLearningProgress.count({
      where: { at_risk: true },
    });

    // At-risk high count - query separately and filter in memory
    const allAtRiskProgress = await this.prisma.studentLearningProgress.findMany({
      where: { at_risk: true },
      select: { risk_factors: true },
    });
    const atRiskHigh = allAtRiskProgress.filter(p => {
      const factors = p.risk_factors as string[] | null;
      return factors && Array.isArray(factors) && factors.includes('high');
    }).length;

    return {
      totalStudents,
      totalChangePercent,
      ieltsCount,
      toeicCount,
      activeStudents,
      activePercent,
      atRiskCount: atRiskProgress,
      atRiskHighCount: atRiskHigh,
    };
  }

  /**
   * Find all students for Directory Dashboard with filters
   */
  async findAllForDirectory(
    filterDto: StudentDirectoryFilterDto,
  ): Promise<StudentDirectoryResponse> {
    const {
      search,
      certType,
      learningStatus,
      riskLevel,
      department,
      cohortYear,
      page = 1,
      limit = 10,
      sortBy = 'student_id',
      sortOrder = 'desc',
    } = filterDto;

    // Build where clause
    const where: any = {};

    // Search by name, code, or email
    if (search) {
      where.OR = [
        { student_code: { contains: search, mode: 'insensitive' } },
        { account: { email: { contains: search, mode: 'insensitive' } } },
        {
          account: {
            profile: { full_name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    // Filter by department
    if (department) {
      where.classGroup = {
        program: {
          department: { name: department },
        },
      };
    }

    // Filter by cohort year
    if (cohortYear) {
      where.cohort_year = cohortYear;
    }

    // Filter by certificate type - need to join with enrollment
    let certFilter: any = {};
    if (certType) {
      certFilter = {
        certificateEnrollments: {
          some: {
            cert_type: certType,
            status: 'active',
          },
        },
      };
    }

    // Get total count
    const total = await this.prisma.student.count({
      where: { ...where, ...certFilter },
    });

    // Get students with related data
    const students = await this.prisma.student.findMany({
      where: { ...where, ...certFilter },
      include: {
        account: {
          include: {
            profile: true,
            activityLogs: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
        classGroup: {
          include: {
            program: {
              include: {
                department: true,
              },
            },
          },
        },
        certificateEnrollments: {
          where: { status: 'active' },
          orderBy: { enrolled_at: 'desc' },
          take: 1,
        },
        learningProgress: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    // ── Batch aggregate counts for progress stats ────────────────────────
    const enrollmentIds = students
      .map((s) => s.certificateEnrollments[0]?.id)
      .filter((id): id is number => id != null);

    const [testCountRows, practiceCountRows, vocabCountRows] =
      enrollmentIds.length > 0
        ? await Promise.all([
            this.prisma.studentTestResult.groupBy({
              by: ['enrollment_id'],
              where: { enrollment_id: { in: enrollmentIds } },
              _count: { id: true },
            }),
            this.prisma.toeicPracticePartSession.groupBy({
              by: ['enrollment_id'],
              where: { enrollment_id: { in: enrollmentIds } },
              _count: { id: true },
            }),
            this.prisma.userVocabProgress.groupBy({
              by: ['enrollment_id'],
              where: {
                enrollment_id: { in: enrollmentIds },
                is_known: true,
              },
              _count: { id: true },
            }),
          ])
        : [[], [], []];

    const testCountMap = new Map(
      testCountRows.map((r) => [r.enrollment_id, r._count.id]),
    );
    const practiceCountMap = new Map(
      practiceCountRows.map((r) => [r.enrollment_id, r._count.id]),
    );
    const vocabCountMap = new Map(
      vocabCountRows.map((r) => [r.enrollment_id, r._count.id]),
    );

    // Map to response type
    const data: StudentDirectoryItem[] = students.map((student) => {
      const enrollment = student.certificateEnrollments[0];
      const progress = student.learningProgress?.[0];
      const enrollmentId = enrollment?.id;

      // Determine certificate name
      let certificateName: string | undefined;
      if (enrollment) {
        if (enrollment.cert_type === 'ielts') {
          certificateName = `IELTS ${enrollment.target_score ? (enrollment.target_score / 10).toFixed(1) : '6.5'}+`;
        } else if (enrollment.cert_type === 'toeic') {
          certificateName = `TOEIC ${enrollment.target_score || '750'}`;
        }
      }

      // Determine learning status
      let learningStatus: 'active' | 'inactive' | 'completed' | 'on_hold' = 'inactive';
      if (enrollment) {
        if (enrollment.learning_status === 'completed') learningStatus = 'completed';
        else if (enrollment.learning_status === 'on_hold') learningStatus = 'on_hold';
        else if (enrollment.learning_status === 'active') learningStatus = 'active';
      }

      // Determine risk level
      const riskFactors = progress?.risk_factors as string[] | null;
      const riskLevel = progress?.at_risk
        ? (riskFactors && Array.isArray(riskFactors) && riskFactors.includes('high') ? 'high' : 'medium')
        : 'low';

      // Use CertificateEnrollment.current_score for current score (same as student page)
      // Use target_score as the initial/target score
      let initialScore: string | undefined;
      let currentScore: string | undefined;
      let improvementPercent: number | undefined;

      if (enrollment) {
        if (enrollment.cert_type === 'ielts') {
          // IELTS: scores are stored as integers (e.g., 65 for 6.5)
          currentScore = enrollment.current_score ? (enrollment.current_score / 10).toFixed(1) : undefined;
          initialScore = enrollment.target_score ? (enrollment.target_score / 10).toFixed(1) : undefined;
        } else if (enrollment.cert_type === 'toeic') {
          // TOEIC: scores are stored as integers (e.g., 750)
          currentScore = enrollment.current_score?.toString();
          initialScore = enrollment.target_score?.toString();
        }

        // Calculate improvement if both scores exist
        if (currentScore && initialScore) {
          const current = parseFloat(currentScore);
          const initial = parseFloat(initialScore);
          if (current > 0 && initial > 0) {
            improvementPercent = Math.round(((current - initial) / initial) * 100);
          }
        }
      }

      return {
        studentId: student.student_id,
        accountId: student.account_id,
        studentCode: student.student_code,
        fullName: student.account.profile?.full_name || '',
        email: student.account.email,
        avatarUrl: student.account.profile?.avatar_url || undefined,
        certType: enrollment?.cert_type as 'ielts' | 'toeic' | null,
        certificateName,
        progressPercent: enrollment?.progress_percent || 0,
        examCount: enrollmentId ? (testCountMap.get(enrollmentId) ?? 0) : 0,
        practiceCount: enrollmentId ? (practiceCountMap.get(enrollmentId) ?? 0) : 0,
        vocabCount: enrollmentId ? (vocabCountMap.get(enrollmentId) ?? 0) : 0,
        initialScore,
        currentScore,
        improvementPercent,
        learningStatus,
        riskLevel,
        department: student.classGroup?.program?.department?.name,
        cohortYear: student.cohort_year || undefined,
        lastActivityAt: student.account.activityLogs[0]?.created_at.toISOString(),
      };
    });

    // Filter by learning status if specified
    let filteredData = data;
    if (learningStatus) {
      filteredData = data.filter(s => s.learningStatus === learningStatus);
    }

    // Filter by risk level if specified
    if (riskLevel) {
      filteredData = filteredData.filter(s => s.riskLevel === riskLevel);
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: filteredData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get detailed student info for Directory Dashboard
   */
  async findOneForDirectory(id: number): Promise<StudentDetailResponse> {
    const student = await this.prisma.student.findUnique({
      where: { student_id: id },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        classGroup: {
          include: {
            program: {
              include: {
                department: true,
              },
            },
          },
        },
        certificateEnrollments: {
          where: { status: 'active' },
          orderBy: { enrolled_at: 'desc' },
          take: 1,
        },
        learningProgress: true,
        testResults: {
          orderBy: { completed_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    const enrollment = student.certificateEnrollments[0];
    const progress = student.learningProgress?.[0];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentActivities, dailySummaries] = await Promise.all([
      this.prisma.userActivityLog.findMany({
        where: { account_id: student.account_id },
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
      this.prisma.userDailyActivitySummary.findMany({
        where: {
          account_id: student.account_id,
          activity_date: { gte: thirtyDaysAgo },
        },
        orderBy: { activity_date: 'desc' },
      }),
    ]);

    // Determine certificate name
    let certificateName: string | undefined;
    if (enrollment) {
      if (enrollment.cert_type === 'ielts') {
        certificateName = `IELTS ${enrollment.target_score ? (enrollment.target_score / 10).toFixed(1) : '6.5'}+`;
      } else if (enrollment.cert_type === 'toeic') {
        certificateName = `TOEIC ${enrollment.target_score || '750'}`;
      }
    }

    // Learning status
    let learningStatus: 'active' | 'inactive' | 'completed' | 'on_hold' = 'inactive';
    if (enrollment) {
      if (enrollment.learning_status === 'completed') learningStatus = 'completed';
      else if (enrollment.learning_status === 'on_hold') learningStatus = 'on_hold';
      else if (enrollment.learning_status === 'active') learningStatus = 'active';
    }

    // Risk level
    const riskFactorsDetail = progress?.risk_factors as string[] | null;
    const riskLevel = progress?.at_risk
      ? (riskFactorsDetail && Array.isArray(riskFactorsDetail) && riskFactorsDetail.includes('high') ? 'high' : 'medium')
      : 'low';

    // Use CertificateEnrollment.current_score for current score (same as student page)
    // Use target_score as the initial/target score
    let initialScore: string | undefined;
    let currentScore: string | undefined;
    let improvementPercent: number | undefined;

    if (enrollment) {
      if (enrollment.cert_type === 'ielts') {
        // IELTS: scores are stored as integers (e.g., 65 for 6.5)
        currentScore = enrollment.current_score ? (enrollment.current_score / 10).toFixed(1) : undefined;
        initialScore = enrollment.target_score ? (enrollment.target_score / 10).toFixed(1) : undefined;
      } else if (enrollment.cert_type === 'toeic') {
        // TOEIC: scores are stored as integers (e.g., 750)
        currentScore = enrollment.current_score?.toString();
        initialScore = enrollment.target_score?.toString();
      }

      // Calculate improvement if both scores exist
      if (currentScore && initialScore) {
        const current = parseFloat(currentScore);
        const initial = parseFloat(initialScore);
        if (current > 0 && initial > 0) {
          improvementPercent = Math.round(((current - initial) / initial) * 100);
        }
      }
    }

    const totalStudyMinutes = dailySummaries.reduce(
      (sum, item) => sum + item.total_duration_min,
      0,
    );
    const totalSessions = dailySummaries.reduce(
      (sum, item) => sum + item.total_sessions,
      0,
    );
    const totalPageViews = dailySummaries.reduce(
      (sum, item) => sum + item.total_page_views,
      0,
    );
    const averageDailyMinutes = dailySummaries.length
      ? Math.round(totalStudyMinutes / dailySummaries.length)
      : 0;

    const scoreHistory = student.testResults
      .slice()
      .reverse()
      .map((test, index) => {
        const score =
          test.band_score ??
          (test.total_score !== null && test.total_score !== undefined
            ? test.total_score
            : 0);
        const completedAt = test.completed_at ?? test.created_at;

        return {
          id: test.id,
          label: test.is_baseline
            ? 'Đầu vào'
            : test.test_phase === 'final'
              ? 'Cuối kỳ'
              : `Lần ${index + 1}`,
          score,
          certType: test.cert_type as 'ielts' | 'toeic',
          testType: test.test_type,
          testPhase: test.test_phase,
          completedAt: completedAt.toISOString(),
        };
      })
      .filter((item) => item.score > 0);

    return {
      studentId: student.student_id,
      accountId: student.account_id,
      studentCode: student.student_code,
      fullName: student.account.profile?.full_name || '',
      email: student.account.email,
      avatarUrl: student.account.profile?.avatar_url || undefined,
      phoneNumber: student.account.profile?.phone_number || undefined,
      dateOfBirth: student.account.profile?.date_of_birth?.toISOString(),
      gender: student.account.profile?.gender || undefined,
      address: student.account.profile?.address || undefined,
      nationality: student.account.profile?.nationality || undefined,
      major: student.major || undefined,
      classCode: student.classGroup?.class_code,
      programName: student.classGroup?.program?.program_name,
      department: student.classGroup?.program?.department?.name,
      cohortYear: student.cohort_year || undefined,
      certType: enrollment?.cert_type as 'ielts' | 'toeic' | null,
      certificateName,
      progressPercent: enrollment?.progress_percent || 0,
      examCount: student.testResults?.length || 0,
      practiceCount: 0,
      vocabCount: 0,
      initialScore,
      currentScore,
      improvementPercent,
      learningStatus,
      riskLevel,
      lastActivityAt: recentActivities[0]?.created_at.toISOString(),
      skillProgress: {
        listening: progress?.listening_improvement || 0,
        reading: progress?.reading_improvement || 0,
        writing: progress?.writing_improvement || 0,
        speaking: progress?.speaking_improvement || 0,
      },
      testResults: student.testResults.map(t => ({
        id: t.id,
        testType: t.test_type as any,
        testPhase: t.test_phase as any,
        certType: t.cert_type as any,
        totalScore: t.total_score || undefined,
        bandScore: t.band_score || undefined,
        listeningScore: t.listening_score || undefined,
        readingScore: t.reading_score || undefined,
        writingScore: t.writing_score || undefined,
        speakingScore: t.speaking_score || undefined,
        completedAt: t.completed_at?.toISOString() || t.created_at.toISOString(),
        durationMinutes: t.duration_minutes || undefined,
      })),
      scoreHistory,
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        actionType: a.action_type,
        feature: a.feature,
        pagePath: a.page_path || undefined,
        createdAt: a.created_at.toISOString(),
      })),
      studyStats: {
        averageDailyMinutes,
        totalSessions,
        totalPageViews,
        activeDays: dailySummaries.length,
        lastActivityAt: recentActivities[0]?.created_at.toISOString(),
      },
      riskFactors: progress?.risk_factors ? JSON.parse(JSON.stringify(progress.risk_factors)) : undefined,
      projectedCompletionDate: progress?.projected_completion_date?.toISOString(),
    };
  }
}
