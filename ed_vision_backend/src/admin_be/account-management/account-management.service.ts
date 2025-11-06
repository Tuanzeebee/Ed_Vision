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

  async getFilterOptions() {
    // Get all departments (schools)
    const departments = await this.prisma.department.findMany({
      where: { status: 'active' },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    // Get all programs (majors) with their department
    const programs = await this.prisma.program.findMany({
      select: { 
        program_name: true,
        department: {
          select: { name: true }
        }
      },
      orderBy: { program_name: 'asc' },
    });

    // Get all roles except admin
    const roles = await this.prisma.role.findMany({
      where: { 
        code: { not: 'admin' }
      },
      select: { code: true, name: true },
      orderBy: { name: 'asc' },
    });

    return {
      schools: departments.map(d => d.name),
      majors: programs.map(p => ({
        name: p.program_name,
        school: p.department.name
      })),
      roles: roles.map(r => ({ code: r.code, name: r.name })),
      statuses: [
        { code: 'active', name: 'Hoạt động' },
        { code: 'inactive', name: 'Vắng mặt' },
        { code: 'blocked', name: 'Đã khóa' }
      ]
    };
  }

  async findAll(filterDto: AccountFilterDto): Promise<AccountListResponse> {
    const { search, role, status, school, major, page = 1, limit = 10 } = filterDto;

    // Debug log
    console.log('Filter params:', { search, role, status, school, major, page, limit });

    // Check for conflicting filters: school/major with non-student role
    // If filtering by school or major AND role is explicitly set to non-student, return empty result
    if ((school || major) && role && role !== 'student') {
      console.log('Conflict detected: school/major filter with non-student role');
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    // Build where clause with proper typing
    interface WhereClause {
      OR?: Array<{
        email?: { contains: string; mode: 'insensitive' };
        profile?: { full_name?: { contains: string; mode: 'insensitive' } };
      }>;
      roleRel?: {
        code?: string;
        NOT?: {
          code: string;
        };
      };
      status?: string;
      AND?: Array<any>;
      student?: any;
    }

    // Start with empty AND array to build conditions
    const andConditions: Array<any> = [];
    
    // Always exclude admin role
    andConditions.push({
      roleRel: {
        NOT: {
          code: 'admin',
        },
      },
    });

    const where: WhereClause = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { full_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Determine effective role (major overrides role to student)
    let effectiveRole = role;
    if (major) {
      effectiveRole = 'student';
    }

    if (effectiveRole) {
      // Add role filter to AND conditions
      andConditions.push({
        roleRel: {
          code: effectiveRole,
        },
      });
    }

    // Filter by major (program) - only for students
    if (major) {
      // Note: effectiveRole is already set to 'student' above
      
      if (school) {
        // Both school and major filters - exact match for program_name
        andConditions.push({
          student: {
            classGroup: {
              program: {
                program_name: { equals: major },
                department: {
                  name: { contains: school, mode: 'insensitive' },
                },
              },
            },
          },
        });
      } else {
        // Only major filter - exact match for program_name
        andConditions.push({
          student: {
            classGroup: {
              program: {
                program_name: { equals: major },
              },
            },
          },
        });
      }
    } else if (school) {
      // If school filter is applied:
      // - If effectiveRole is 'student', show only students from that school
      // - If effectiveRole is not set, show both instructors and students from that school
      // - If effectiveRole is set to non-student (teacher/leader/parent), we already returned empty above
      if (effectiveRole === 'student') {
        // Only students from this school
        andConditions.push({
          student: {
            classGroup: {
              program: {
                department: {
                  name: { contains: school, mode: 'insensitive' },
                },
              },
            },
          },
        });
      } else if (!effectiveRole) {
        // No role specified - show both instructors and students from that school
        andConditions.push({
          OR: [
            {
              instructor: {
                department: {
                  name: { contains: school, mode: 'insensitive' },
                },
              },
            },
            {
              student: {
                classGroup: {
                  program: {
                    department: {
                      name: { contains: school, mode: 'insensitive' },
                    },
                  },
                },
              },
            },
          ],
        });
      }
    }

    // Assign AND conditions to where clause
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Debug: Log the final where clause
    console.log('Where clause:', JSON.stringify(where, null, 2));

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
                program: {
                  include: {
                    department: true,
                  },
                },
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
      updatedAt: account.updated_at.toISOString(),
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
            programName: account.student.classGroup?.program?.program_name,
            departmentName:
              account.student.classGroup?.program?.department?.name,
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
                program: {
                  include: {
                    department: true,
                  },
                },
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
      updatedAt: account.updated_at.toISOString(),
      lastLoginAt: account.last_login_at?.toISOString(),
      lastLogoutAt: account.last_logout_at?.toISOString(),
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
            programName: account.student.classGroup?.program?.program_name,
            departmentName:
              account.student.classGroup?.program?.department?.name,
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
      include: { 
        profile: true,
        instructor: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    let hasChanges = false;

    // Update profile if exists
    if (account.profile) {
      // Build update data object only with fields that are provided
      const profileUpdateData: any = {};
      
      if (updateAccountDto.fullName !== undefined) {
        profileUpdateData.full_name = updateAccountDto.fullName;
        if (updateAccountDto.fullName !== account.profile.full_name) {
          hasChanges = true;
        }
      }
      
      if (updateAccountDto.dateOfBirth !== undefined) {
        profileUpdateData.date_of_birth = new Date(updateAccountDto.dateOfBirth);
        const newDate = new Date(updateAccountDto.dateOfBirth).toDateString();
        const oldDate = account.profile.date_of_birth?.toDateString();
        if (newDate !== oldDate) {
          hasChanges = true;
        }
      }
      
      if (updateAccountDto.gender !== undefined) {
        profileUpdateData.gender = updateAccountDto.gender;
        if (updateAccountDto.gender !== account.profile.gender) {
          hasChanges = true;
        }
      }
      
      if (updateAccountDto.address !== undefined) {
        profileUpdateData.address = updateAccountDto.address;
        if (updateAccountDto.address !== account.profile.address) {
          hasChanges = true;
        }
      }

      // Only update profile if there's data to update
      if (Object.keys(profileUpdateData).length > 0) {
        await this.prisma.profile.update({
          where: { profile_id: account.profile.profile_id },
          data: profileUpdateData,
        });
      }
    }

    // Update instructor if exists and instructor-specific fields are provided
    if (account.instructor) {
      const instructorUpdateData: any = {};
      
      if (updateAccountDto.employeeCode !== undefined) {
        instructorUpdateData.employee_code = updateAccountDto.employeeCode;
        if (updateAccountDto.employeeCode !== account.instructor.employee_code) {
          hasChanges = true;
        }
      }
      
      if (updateAccountDto.academicTitle !== undefined) {
        instructorUpdateData.academic_title = updateAccountDto.academicTitle;
        if (updateAccountDto.academicTitle !== account.instructor.academic_title) {
          hasChanges = true;
        }
      }
      
      if (updateAccountDto.position !== undefined) {
        instructorUpdateData.position = updateAccountDto.position;
        if (updateAccountDto.position !== account.instructor.position) {
          hasChanges = true;
        }
      }
      
      if (updateAccountDto.departmentId !== undefined) {
        instructorUpdateData.department_id = updateAccountDto.departmentId;
        if (updateAccountDto.departmentId !== account.instructor.department_id) {
          hasChanges = true;
        }
      }

      // Only update instructor if there's data to update
      if (Object.keys(instructorUpdateData).length > 0) {
        await this.prisma.instructor.update({
          where: { instructor_id: account.instructor.instructor_id },
          data: instructorUpdateData,
        });
      }
    }

    // Check if status has changed
    if (updateAccountDto.status && updateAccountDto.status !== account.status) {
      hasChanges = true;
    }

    console.log('Update check - hasChanges:', hasChanges);
    console.log('UpdateAccountDto:', updateAccountDto);

    // Only update Account if there are actual changes
    if (hasChanges) {
      await this.prisma.account.update({
        where: { account_id: id },
        data: {
          status: updateAccountDto.status || account.status,
          updated_at: new Date(), // Manually set updated_at
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
