import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import { StudentResponse } from './models/student-response.type';
import { StudentListResponse } from './models/student-list.type';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentManagementService {
  constructor(private prisma: PrismaService) {}

  async findAll(filterDto: StudentFilterDto): Promise<StudentListResponse> {
    const {
      search,
      major,
      cohortYear,
      classId,
      status,
      page = 1,
      limit = 10,
    } = filterDto;

    const where: {
      OR?: Array<{
        student_code?: { contains: string; mode: 'insensitive' };
        account?: {
          email?: { contains: string; mode: 'insensitive' };
          profile?: { full_name?: { contains: string; mode: 'insensitive' } };
        };
      }>;
      major?: { contains: string; mode: 'insensitive' };
      cohort_year?: number;
      class_id?: number;
      status?: string;
    } = {};

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

    if (major) {
      where.major = { contains: major, mode: 'insensitive' };
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
            program: true,
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
    const { password, fullName, studentCode, ...studentData } =
      createStudentDto;

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
