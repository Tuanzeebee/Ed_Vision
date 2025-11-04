import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountFilterDto } from './dto/account-filter.dto';
import { AccountResponse } from './models/account-response.type';
import { AccountListResponse } from './models/account-list.type';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AccountManagementService {
  constructor(private prisma: PrismaService) {}

  async findAll(filterDto: AccountFilterDto): Promise<AccountListResponse> {
    const { search, role, status, page = 1, limit = 10 } = filterDto;

    // Build where clause with proper typing
    interface WhereClause {
      OR?: Array<{
        email?: { contains: string; mode: 'insensitive' };
        profile?: { full_name?: { contains: string; mode: 'insensitive' } };
      }>;
      roleRel?: {
        code?: string;
        NOT: {
          code: string;
        };
      };
      status?: string;
    }

    const where: WhereClause = {
      roleRel: {
        NOT: {
          code: 'admin',
        },
      },
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { full_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (role) {
      where.roleRel = {
        code: role,
        NOT: {
          code: 'admin',
        },
      };
    }

    if (status) {
      where.status = status;
    }

    // Count total
    const total = await this.prisma.account.count({ where });

    // Fetch data with relations
    const accounts = await this.prisma.account.findMany({
      where,
      include: {
        roleRel: true,
        profile: true,
        student: {
          include: {
            classGroup: {
              include: {
                program: true,
              },
            },
          },
        },
        instructor: {
          include: {
            department: true,
          },
        },
        parent: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    // Map to response format
    const data: AccountResponse[] = accounts.map((account) => ({
      accountId: account.account_id,
      email: account.email,
      status: account.status || 'active',
      createdAt: account.created_at.toISOString(),
      lastLoginAt: account.last_login_at?.toISOString(),
      role: account.roleRel
        ? {
            id: account.roleRel.id,
            code: account.roleRel.code,
            name: account.roleRel.name,
          }
        : undefined,
      profile: account.profile
        ? {
            fullName: account.profile.full_name,
            dateOfBirth: account.profile.date_of_birth?.toISOString(),
            gender: account.profile.gender || undefined,
            address: account.profile.address || undefined,
            avatarUrl: account.profile.avatar_url || undefined,
            nationality: account.profile.nationality || undefined,
          }
        : undefined,
      student: account.student
        ? {
            studentCode: account.student.student_code,
            major:
              account.student.major ||
              account.student.classGroup?.program?.program_name,
            cohortYear: account.student.cohort_year || undefined,
            classId: account.student.class_id || undefined,
          }
        : undefined,
      instructor: account.instructor
        ? {
            employeeCode: account.instructor.employee_code,
            academicTitle: account.instructor.academic_title || undefined,
            position: account.instructor.position || undefined,
            departmentId: account.instructor.department_id || undefined,
            departmentName: account.instructor.department?.name,
          }
        : undefined,
      parent: account.parent
        ? {
            parentId: account.parent.parent_id,
            phoneNumber: account.parent.phone_number,
            relationshipType: account.parent.relationship_type || undefined,
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

  async findOne(id: number): Promise<AccountResponse> {
    const account = await this.prisma.account.findUnique({
      where: { account_id: id },
      include: {
        roleRel: true,
        profile: true,
        student: {
          include: {
            classGroup: {
              include: {
                program: true,
              },
            },
          },
        },
        instructor: {
          include: {
            department: true,
          },
        },
        parent: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return {
      accountId: account.account_id,
      email: account.email,
      status: account.status || 'active',
      createdAt: account.created_at.toISOString(),
      lastLoginAt: account.last_login_at?.toISOString(),
      role: account.roleRel
        ? {
            id: account.roleRel.id,
            code: account.roleRel.code,
            name: account.roleRel.name,
          }
        : undefined,
      profile: account.profile
        ? {
            fullName: account.profile.full_name,
            dateOfBirth: account.profile.date_of_birth?.toISOString(),
            gender: account.profile.gender || undefined,
            address: account.profile.address || undefined,
            avatarUrl: account.profile.avatar_url || undefined,
            nationality: account.profile.nationality || undefined,
          }
        : undefined,
      student: account.student
        ? {
            studentCode: account.student.student_code,
            major:
              account.student.major ||
              account.student.classGroup?.program?.program_name,
            cohortYear: account.student.cohort_year || undefined,
            classId: account.student.class_id || undefined,
          }
        : undefined,
      instructor: account.instructor
        ? {
            employeeCode: account.instructor.employee_code,
            academicTitle: account.instructor.academic_title || undefined,
            position: account.instructor.position || undefined,
            departmentId: account.instructor.department_id || undefined,
            departmentName: account.instructor.department?.name,
          }
        : undefined,
      parent: account.parent
        ? {
            parentId: account.parent.parent_id,
            phoneNumber: account.parent.phone_number,
            relationshipType: account.parent.relationship_type || undefined,
          }
        : undefined,
    };
  }

  async create(createAccountDto: CreateAccountDto): Promise<AccountResponse> {
    const { password, role, fullName, ...profileData } = createAccountDto;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find role by code
    const roleRecord = await this.prisma.role.findUnique({
      where: { code: role },
    });

    if (!roleRecord) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    // Create account with profile
    const account = await this.prisma.account.create({
      data: {
        email: createAccountDto.email,
        password_hash: hashedPassword,
        role_id: roleRecord.id,
        status: createAccountDto.status || 'active',
        profile: {
          create: {
            full_name: fullName,
            date_of_birth: profileData.dateOfBirth
              ? new Date(profileData.dateOfBirth)
              : undefined,
            gender: profileData.gender,
            address: profileData.address,
          },
        },
      },
      include: {
        roleRel: true,
        profile: true,
      },
    });

    return this.findOne(account.account_id);
  }

  async update(
    id: number,
    updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponse> {
    const account = await this.prisma.account.findUnique({
      where: { account_id: id },
      include: { profile: true },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    // Update account
    await this.prisma.account.update({
      where: { account_id: id },
      data: {
        status: updateAccountDto.status,
      },
    });

    // Update profile if exists
    if (account.profile) {
      await this.prisma.profile.update({
        where: { profile_id: account.profile.profile_id },
        data: {
          full_name: updateAccountDto.fullName,
          date_of_birth: updateAccountDto.dateOfBirth
            ? new Date(updateAccountDto.dateOfBirth)
            : undefined,
          gender: updateAccountDto.gender,
          address: updateAccountDto.address,
        },
      });
    }

    return this.findOne(id);
  }

  async updateStatus(id: number, status: string): Promise<AccountResponse> {
    const account = await this.prisma.account.findUnique({
      where: { account_id: id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    await this.prisma.account.update({
      where: { account_id: id },
      data: { status },
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const account = await this.prisma.account.findUnique({
      where: { account_id: id },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    await this.prisma.account.delete({
      where: { account_id: id },
    });
  }
}
