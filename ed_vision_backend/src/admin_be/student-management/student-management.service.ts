import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import { StudentResponse } from './models/student-response.type';
import { StudentListResponse } from './models/student-list.type';
import { StudentOnlineStats } from './models/student-stats.type';
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
            program: true,
          },
        },
      },
    });

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
}
