import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorFilterDto } from './dto/instructor-filter.dto';
import { InstructorResponse } from './models/instructor-response.type';
import { InstructorListResponse } from './models/instructor-list.type';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InstructorManagementService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    filterDto: InstructorFilterDto,
  ): Promise<InstructorListResponse> {
    const {
      search,
      departmentId,
      academicTitle,
      status,
      page = 1,
      limit = 10,
    } = filterDto;

    const where: {
      OR?: Array<{
        employee_code?: { contains: string; mode: 'insensitive' };
        account?: {
          email?: { contains: string; mode: 'insensitive' };
          profile?: { full_name?: { contains: string; mode: 'insensitive' } };
        };
      }>;
      department_id?: number;
      academic_title?: { contains: string; mode: 'insensitive' };
      status?: string;
    } = {};

    if (search) {
      where.OR = [
        { employee_code: { contains: search, mode: 'insensitive' } },
        { account: { email: { contains: search, mode: 'insensitive' } } },
        {
          account: {
            profile: { full_name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    if (departmentId) {
      where.department_id = departmentId;
    }

    if (academicTitle) {
      where.academic_title = { contains: academicTitle, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    const total = await this.prisma.instructor.count({ where });

    const instructors = await this.prisma.instructor.findMany({
      where,
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        department: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { instructor_id: 'desc' },
    });

    const data: InstructorResponse[] = instructors.map((instructor) => ({
      instructorId: instructor.instructor_id,
      accountId: instructor.account_id,
      employeeCode: instructor.employee_code,
      email: instructor.account.email,
      academicTitle: instructor.academic_title || undefined,
      position: instructor.position || undefined,
      status: instructor.status || 'active',
      createdAt: instructor.account.created_at.toISOString(),
      profile: instructor.account.profile
        ? {
            fullName: instructor.account.profile.full_name,
            dateOfBirth:
              instructor.account.profile.date_of_birth?.toISOString(),
            gender: instructor.account.profile.gender || undefined,
            address: instructor.account.profile.address || undefined,
            avatarUrl: instructor.account.profile.avatar_url || undefined,
          }
        : undefined,
      department: instructor.department
        ? {
            departmentId: instructor.department.department_id,
            departmentName: instructor.department.name,
            departmentCode: instructor.department.code || undefined,
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

  async findOne(id: number): Promise<InstructorResponse> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: id },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        department: true,
      },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${id} not found`);
    }

    return {
      instructorId: instructor.instructor_id,
      accountId: instructor.account_id,
      employeeCode: instructor.employee_code,
      email: instructor.account.email,
      academicTitle: instructor.academic_title || undefined,
      position: instructor.position || undefined,
      status: instructor.status || 'active',
      createdAt: instructor.account.created_at.toISOString(),
      profile: instructor.account.profile
        ? {
            fullName: instructor.account.profile.full_name,
            dateOfBirth:
              instructor.account.profile.date_of_birth?.toISOString(),
            gender: instructor.account.profile.gender || undefined,
            address: instructor.account.profile.address || undefined,
            avatarUrl: instructor.account.profile.avatar_url || undefined,
          }
        : undefined,
      department: instructor.department
        ? {
            departmentId: instructor.department.department_id,
            departmentName: instructor.department.name,
            departmentCode: instructor.department.code || undefined,
          }
        : undefined,
    };
  }

  async create(
    createInstructorDto: CreateInstructorDto,
  ): Promise<InstructorResponse> {
    const { password, fullName, employeeCode, ...instructorData } =
      createInstructorDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacherRole = await this.prisma.role.findUnique({
      where: { code: 'teacher' },
    });

    if (!teacherRole) {
      throw new NotFoundException('Teacher role not found');
    }

    const account = await this.prisma.account.create({
      data: {
        email: createInstructorDto.email,
        password_hash: hashedPassword,
        role_id: teacherRole.id,
        status: 'active',
        profile: {
          create: {
            full_name: fullName,
            date_of_birth: instructorData.dateOfBirth
              ? new Date(instructorData.dateOfBirth)
              : undefined,
            gender: instructorData.gender,
            address: instructorData.address,
          },
        },
        instructor: {
          create: {
            employee_code: employeeCode,
            academic_title: instructorData.academicTitle,
            position: instructorData.position,
            department_id: instructorData.departmentId,
            status: 'active',
          },
        },
      },
      include: {
        instructor: true,
      },
    });

    return this.findOne(account.instructor!.instructor_id);
  }

  async update(
    id: number,
    updateInstructorDto: UpdateInstructorDto,
  ): Promise<InstructorResponse> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: id },
      include: { account: { include: { profile: true } } },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${id} not found`);
    }

    await this.prisma.instructor.update({
      where: { instructor_id: id },
      data: {
        academic_title: updateInstructorDto.academicTitle,
        position: updateInstructorDto.position,
        department_id: updateInstructorDto.departmentId,
        status: updateInstructorDto.status,
      },
    });

    if (instructor.account.profile) {
      await this.prisma.profile.update({
        where: { profile_id: instructor.account.profile.profile_id },
        data: {
          full_name: updateInstructorDto.fullName,
          date_of_birth: updateInstructorDto.dateOfBirth
            ? new Date(updateInstructorDto.dateOfBirth)
            : undefined,
          gender: updateInstructorDto.gender,
          address: updateInstructorDto.address,
        },
      });
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { instructor_id: id },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${id} not found`);
    }

    await this.prisma.account.delete({
      where: { account_id: instructor.account_id },
    });
  }
}
