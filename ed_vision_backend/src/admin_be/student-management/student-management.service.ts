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

    const totalChangePercent =
      totalStudentsLastMonth > 0
        ? Math.round(
            ((totalStudents - totalStudentsLastMonth) /
              totalStudentsLastMonth) *
              100,
          )
        : 0;

    // Count by certificate enrollment
    const certEnrollments = await this.prisma.certificateEnrollment.groupBy({
      by: ['cert_type'],
      where: { status: 'active' },
      _count: { cert_type: true },
    });

    const ieltsCount =
      certEnrollments.find((e) => e.cert_type === 'ielts')?._count?.cert_type ||
      0;
    const toeicCount =
      certEnrollments.find((e) => e.cert_type === 'toeic')?._count?.cert_type ||
      0;

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
    const activePercent =
      totalStudents > 0
        ? Math.round((activeStudents / totalStudents) * 100)
        : 0;

    // At-risk students
    const atRiskProgress = await this.prisma.studentLearningProgress.count({
      where: { at_risk: true },
    });

    // At-risk high count - query separately and filter in memory
    const allAtRiskProgress =
      await this.prisma.studentLearningProgress.findMany({
        where: { at_risk: true },
        select: { risk_factors: true },
      });
    const atRiskHigh = allAtRiskProgress.filter((p) => {
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
          include: { learningProgress: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    // ── Batch aggregate counts for progress stats ────────────────────────
    const enrollmentIds = students
      .map((s) => s.certificateEnrollments[0]?.id)
      .filter((id): id is number => id != null);

    const [testCountRows, practiceCountRows, vocabCountRows, allTestResults] =
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
            this.prisma.studentTestResult.findMany({
              where: { enrollment_id: { in: enrollmentIds } },
              orderBy: { completed_at: 'asc' },
            }),
          ])
        : [[], [], [], []];

    // Group test results by enrollment for baseline / progress computation
    const testResultsByEnrollment = new Map<
      number,
      Array<(typeof allTestResults)[number]>
    >();
    for (const t of allTestResults) {
      if (t.enrollment_id == null) continue;
      const arr = testResultsByEnrollment.get(t.enrollment_id) ?? [];
      arr.push(t);
      testResultsByEnrollment.set(t.enrollment_id, arr);
    }

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
      const progress = enrollment?.learningProgress ?? null;
      const enrollmentId = enrollment?.id;
      const certType = enrollment?.cert_type ?? null;

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
      let learningStatus: 'active' | 'inactive' | 'completed' | 'on_hold' =
        'inactive';
      if (enrollment) {
        if (enrollment.learning_status === 'completed')
          learningStatus = 'completed';
        else if (enrollment.learning_status === 'on_hold')
          learningStatus = 'on_hold';
        else if (enrollment.learning_status === 'active')
          learningStatus = 'active';
      }

      // Determine risk level
      const riskFactors = progress?.risk_factors as string[] | null;
      const riskLevel = progress?.at_risk
        ? riskFactors &&
          Array.isArray(riskFactors) &&
          riskFactors.includes('high')
          ? 'high'
          : 'medium'
        : 'low';

      // Compute baseline / current / target scores from real data.
      // currentScore = CertificateEnrollment.current_score (kept in sync by certificate
      // service when student takes tests / practice).
      // initialScore  = baseline score from StudentLearningProgress.baseline_* or the
      // earliest StudentTestResult for this enrollment — NOT the target.
      const testResultsForEnrollment = enrollmentId
        ? (testResultsByEnrollment.get(enrollmentId) ?? [])
        : [];
      const baselineNumeric = this.resolveBaselineNumeric(
        certType,
        progress,
        testResultsForEnrollment,
      );
      const currentNumeric = enrollment?.current_score ?? null;
      const targetNumeric = enrollment?.target_score ?? null;

      const initialScore = this.formatScore(baselineNumeric, certType);
      const currentScore = this.formatScore(currentNumeric, certType);

      let improvementPercent: number | undefined;
      if (
        currentNumeric != null &&
        baselineNumeric != null &&
        baselineNumeric > 0
      ) {
        improvementPercent = Math.round(
          ((currentNumeric - baselineNumeric) / baselineNumeric) * 100,
        );
      }

      const computedProgressPercent = this.computeProgressPercent(
        currentNumeric,
        baselineNumeric,
        targetNumeric,
        enrollment?.progress_percent ?? 0,
      );

      return {
        studentId: student.student_id,
        accountId: student.account_id,
        studentCode: student.student_code,
        fullName: student.account.profile?.full_name || '',
        email: student.account.email,
        avatarUrl: student.account.profile?.avatar_url || undefined,
        certType: certType as 'ielts' | 'toeic' | null,
        certificateName,
        progressPercent: computedProgressPercent,
        examCount: enrollmentId ? (testCountMap.get(enrollmentId) ?? 0) : 0,
        practiceCount: enrollmentId
          ? (practiceCountMap.get(enrollmentId) ?? 0)
          : 0,
        vocabCount: enrollmentId ? (vocabCountMap.get(enrollmentId) ?? 0) : 0,
        initialScore,
        currentScore,
        improvementPercent,
        learningStatus,
        riskLevel,
        department: student.classGroup?.program?.department?.name,
        cohortYear: student.cohort_year || undefined,
        lastActivityAt:
          student.account.activityLogs[0]?.created_at.toISOString(),
      };
    });

    // Filter by learning status if specified
    let filteredData = data;
    if (learningStatus) {
      filteredData = data.filter((s) => s.learningStatus === learningStatus);
    }

    // Filter by risk level if specified
    if (riskLevel) {
      filteredData = filteredData.filter((s) => s.riskLevel === riskLevel);
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
          include: { learningProgress: true },
        },
        // All test results for the student so we can find baseline + compute
        // per-skill progress accurately (the chart still only renders recent ones).
        testResults: {
          orderBy: { completed_at: 'asc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    const enrollment = student.certificateEnrollments[0];
    const progress = enrollment?.learningProgress ?? null;
    const certType = enrollment?.cert_type ?? null;

    // Restrict test results to the active enrollment when one exists; otherwise
    // fall back to all of the student's test results so non-enrolled history
    // (placement, diagnostics) still shows up.
    const enrollmentTestResults = enrollment
      ? student.testResults.filter((t) => t.enrollment_id === enrollment.id)
      : student.testResults;
    const testResultsForChart = enrollmentTestResults.length
      ? enrollmentTestResults
      : student.testResults;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentActivities, dailySummaries, practiceCount, vocabCount] =
      await Promise.all([
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
        enrollment
          ? this.prisma.toeicPracticePartSession.count({
              where: { enrollment_id: enrollment.id },
            })
          : Promise.resolve(0),
        enrollment
          ? this.prisma.userVocabProgress.count({
              where: { enrollment_id: enrollment.id, is_known: true },
            })
          : Promise.resolve(0),
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
    let learningStatus: 'active' | 'inactive' | 'completed' | 'on_hold' =
      'inactive';
    if (enrollment) {
      if (enrollment.learning_status === 'completed')
        learningStatus = 'completed';
      else if (enrollment.learning_status === 'on_hold')
        learningStatus = 'on_hold';
      else if (enrollment.learning_status === 'active')
        learningStatus = 'active';
    }

    // Risk level
    const riskFactorsDetail = progress?.risk_factors as string[] | null;
    const riskLevel = progress?.at_risk
      ? riskFactorsDetail &&
        Array.isArray(riskFactorsDetail) &&
        riskFactorsDetail.includes('high')
        ? 'high'
        : 'medium'
      : 'low';

    // Compute baseline / current / target scores from real data.
    const baselineNumeric = this.resolveBaselineNumeric(
      certType,
      progress,
      enrollmentTestResults,
    );
    const currentNumeric = enrollment?.current_score ?? null;
    const targetNumeric = enrollment?.target_score ?? null;

    const initialScore = this.formatScore(baselineNumeric, certType);
    const currentScore = this.formatScore(currentNumeric, certType);

    let improvementPercent: number | undefined;
    if (
      currentNumeric != null &&
      baselineNumeric != null &&
      baselineNumeric > 0
    ) {
      improvementPercent = Math.round(
        ((currentNumeric - baselineNumeric) / baselineNumeric) * 100,
      );
    }

    const computedProgressPercent = this.computeProgressPercent(
      currentNumeric,
      baselineNumeric,
      targetNumeric,
      enrollment?.progress_percent ?? 0,
    );

    const skillProgress = this.computeSkillProgress(
      enrollmentTestResults,
      certType,
    );

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

    // Score history is ordered chronologically (oldest -> newest) for the
    // progress chart. testResults are already sorted ascending by completed_at.
    const scoreHistory = testResultsForChart
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
      certType: certType as 'ielts' | 'toeic' | null,
      certificateName,
      progressPercent: computedProgressPercent,
      examCount: enrollmentTestResults.length,
      practiceCount,
      vocabCount,
      initialScore,
      currentScore,
      improvementPercent,
      learningStatus,
      riskLevel,
      lastActivityAt: recentActivities[0]?.created_at.toISOString(),
      skillProgress,
      testResults: enrollmentTestResults
        .slice()
        .reverse()
        .map((t) => ({
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
          completedAt:
            t.completed_at?.toISOString() || t.created_at.toISOString(),
          durationMinutes: t.duration_minutes || undefined,
        }))
        .slice(0, 10),
      scoreHistory,
      recentActivities: recentActivities.map((a) => ({
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
      riskFactors: progress?.risk_factors
        ? JSON.parse(JSON.stringify(progress.risk_factors))
        : undefined,
      projectedCompletionDate:
        progress?.projected_completion_date?.toISOString(),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED SCORE / PROGRESS HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Resolve the student's baseline ("entry") score for a certificate enrollment.
   *
   * Priority:
   *   1. `StudentLearningProgress.baseline_band_score` (IELTS, in band 0-9) or
   *      `baseline_total_score` (TOEIC, in points).
   *   2. Earliest `StudentTestResult` flagged `is_baseline = true` for the enrollment.
   *   3. Earliest test result of any kind for the enrollment.
   *
   * Returned as a numeric value in the same units as `CertificateEnrollment.current_score`:
   *   - IELTS: band × 10 (e.g. 65 for band 6.5)
   *   - TOEIC: total score (e.g. 450)
   */
  private resolveBaselineNumeric(
    certType: string | null,
    progress:
      | {
          baseline_band_score: number | null;
          baseline_total_score: number | null;
        }
      | null
      | undefined,
    testResults: Array<{
      band_score: number | null;
      total_score: number | null;
      is_baseline: boolean;
      completed_at: Date | null;
      created_at: Date;
    }>,
  ): number | null {
    if (certType === 'ielts' && progress?.baseline_band_score != null) {
      return Math.round(progress.baseline_band_score * 10);
    }
    if (certType === 'toeic' && progress?.baseline_total_score != null) {
      return progress.baseline_total_score;
    }

    const sorted = [...testResults].sort((a, b) => {
      const aTime = (a.completed_at ?? a.created_at).getTime();
      const bTime = (b.completed_at ?? b.created_at).getTime();
      return aTime - bTime;
    });
    const baseline = sorted.find((t) => t.is_baseline) ?? sorted[0];
    if (!baseline) return null;

    if (certType === 'ielts') {
      if (baseline.band_score != null) {
        return Math.round(baseline.band_score * 10);
      }
      return baseline.total_score ?? null;
    }
    return baseline.total_score ?? null;
  }

  /**
   * Format a numeric score for display in the directory / detail UI.
   *   - IELTS: band with one decimal place (e.g. "6.5").
   *   - TOEIC: integer string (e.g. "750").
   */
  private formatScore(
    numeric: number | null,
    certType: string | null,
  ): string | undefined {
    if (numeric == null) return undefined;
    if (certType === 'ielts') return (numeric / 10).toFixed(1);
    return numeric.toString();
  }

  /**
   * Compute progress percentage toward target using the same convention as
   * `certificate-enrollment.service.ts`:
   *   `(current - baseline) / (target - baseline) × 100`, clamped to 0-100.
   *
   * Returns `fallback` (defaults to 0) when target is missing or invalid so
   * callers can substitute the stored `enrollment.progress_percent` if desired.
   */
  private computeProgressPercent(
    current: number | null,
    baseline: number | null,
    target: number | null,
    fallback = 0,
  ): number {
    if (current == null || target == null || target <= 0) {
      return Math.max(0, Math.min(100, Math.round(fallback)));
    }
    const baselineSafe = baseline ?? 0;
    if (target <= baselineSafe) {
      return current >= target
        ? 100
        : Math.max(0, Math.min(100, Math.round(fallback)));
    }
    const gained = Math.max(0, current - baselineSafe);
    const total = Math.max(1, target - baselineSafe);
    return Math.max(0, Math.min(100, Math.round((gained / total) * 100)));
  }

  /**
   * Compute per-skill progress percentage (0-100) from a student's test history.
   *
   * For each skill we take the most recent positive score across the supplied
   * test results and normalize it to the maximum possible value for the cert
   * type:
   *   - IELTS: max 90 (band 9 × 10)
   *   - TOEIC Listening/Reading: max 495
   *   - TOEIC Writing/Speaking:  max 200
   */
  private computeSkillProgress(
    testResults: Array<{
      listening_score: number | null;
      reading_score: number | null;
      writing_score: number | null;
      speaking_score: number | null;
      completed_at: Date | null;
      created_at: Date;
    }>,
    certType: string | null,
  ): { listening: number; reading: number; writing: number; speaking: number } {
    const sortedDesc = [...testResults].sort((a, b) => {
      const aTime = (a.completed_at ?? a.created_at).getTime();
      const bTime = (b.completed_at ?? b.created_at).getTime();
      return bTime - aTime;
    });

    type SkillKey =
      | 'listening_score'
      | 'reading_score'
      | 'writing_score'
      | 'speaking_score';

    const pickLatest = (key: SkillKey): number | null => {
      for (const t of sortedDesc) {
        const v = t[key];
        if (v != null && v > 0) return v;
      }
      return null;
    };

    const maxFor = (
      skill: 'listening' | 'reading' | 'writing' | 'speaking',
    ): number => {
      if (certType === 'ielts') return 90;
      if (skill === 'listening' || skill === 'reading') return 495;
      return 200;
    };

    const norm = (
      score: number | null,
      skill: 'listening' | 'reading' | 'writing' | 'speaking',
    ): number => {
      if (score == null) return 0;
      return Math.max(
        0,
        Math.min(100, Math.round((score / maxFor(skill)) * 100)),
      );
    };

    return {
      listening: norm(pickLatest('listening_score'), 'listening'),
      reading: norm(pickLatest('reading_score'), 'reading'),
      writing: norm(pickLatest('writing_score'), 'writing'),
      speaking: norm(pickLatest('speaking_score'), 'speaking'),
    };
  }
}
