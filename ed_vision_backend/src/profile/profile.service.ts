import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get student profile with all related information
   */
  async getStudentProfile(accountId: number) {
    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        classGroup: {
          include: {
            adviserAssignments: {
              include: {
                instructor: {
                  include: {
                    account: {
                      include: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        parentStudentLinks: {
          include: {
            parent: {
              include: {
                account: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const profile = student.account?.profile;
    const classGroup = student.classGroup;
    const advisorAssignment = classGroup?.adviserAssignments?.[0];
    const advisor = advisorAssignment
      ? {
          instructorId: advisorAssignment.instructor.instructor_id,
          fullName:
            advisorAssignment.instructor.account?.profile?.full_name ?? null,
          email: advisorAssignment.instructor.account?.email ?? null,
          avatarUrl:
            advisorAssignment.instructor.account?.profile?.avatar_url ?? null,
        }
      : null;

    const parentLinks = student.parentStudentLinks
      .filter((link) => link.parent !== null)
      .map((link) => ({
        linkId: link.link_id,
        linkCode: link.link_code,
        parent: {
          parentId: link.parent!.parent_id,
          fullName: link.parent!.account?.profile?.full_name || 'Parent',
          email: link.parent!.account?.email || '',
          phoneNumber: link.parent!.account?.profile?.phone_number || '',
          relationshipType: link.parent!.relationship_type,
        },
      }));

    return {
      studentId: student.student_id,
      accountId: student.account_id,
      studentCode: student.student_code,
      major: student.major,
      cohortYear: student.cohort_year,
      classId: student.class_id,
      className: classGroup?.class_code ?? null,
      status: student.status,
      profile: {
        fullName: profile?.full_name ?? null,
        dateOfBirth: profile?.date_of_birth ?? null,
        gender: profile?.gender ?? null,
        nationality: profile?.nationality ?? null,
        address: profile?.address ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        phoneNumber: profile?.phone_number ?? null,
        email: student.account?.email ?? null,
      },
      advisor,
      parentLinks,
    };
  }

  /**
   * Get parent profile with linked students
   */
  async getParentProfile(accountId: number) {
    const parent = await this.prisma.parent.findUnique({
      where: { account_id: accountId },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        parentStudentLinks: {
          include: {
            student: {
              include: {
                account: {
                  include: {
                    profile: true,
                  },
                },
                classGroup: true,
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const profile = parent.account?.profile;

    const linkedStudents = parent.parentStudentLinks.map((link) => ({
      linkId: link.link_id,
      linkCode: link.link_code,
      student: {
        studentId: link.student.student_id,
        studentCode: link.student.student_code,
        fullName: link.student.account?.profile?.full_name ?? null,
        className: link.student.classGroup?.class_code ?? null,
        major: link.student.major,
        status: link.student.status,
      },
    }));

    return {
      parentId: parent.parent_id,
      accountId: parent.account_id,
      relationshipType: parent.relationship_type,
      occupation: parent.occupation,
      workplace: parent.workplace,
      profile: {
        fullName: profile?.full_name || 'Parent',
        phoneNumber: profile?.phone_number || '',
        email: parent.account.email,
        dateOfBirth: profile?.date_of_birth ?? null,
        gender: profile?.gender ?? null,
        nationality: profile?.nationality ?? null,
        address: profile?.address ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      },
      linkedStudents,
    };
  }

  /**
   * Update parent occupation information
   */
  async updateParentOccupation(
    accountId: number,
    data: {
      relationship_type?: string;
      occupation?: string;
      workplace?: string;
    },
  ) {
    const parent = await this.prisma.parent.findUnique({
      where: { account_id: accountId },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return this.prisma.parent.update({
      where: { parent_id: parent.parent_id },
      data: {
        relationship_type: data.relationship_type,
        occupation: data.occupation,
        workplace: data.workplace,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Get instructor (teacher) profile
   */
  async getInstructorProfile(accountId: number) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { account_id: accountId },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        department: true,
        adviserAssignments: {
          include: {
            classGroup: {
              include: {
                students: {
                  include: {
                    account: {
                      include: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const profile = instructor.account?.profile;

    const advisedClasses = instructor.adviserAssignments.map((assignment) => ({
      classId: assignment.classGroup.class_id,
      classCode: assignment.classGroup.class_code,
      cohortYear: assignment.classGroup.cohort_year,
      studentCount: assignment.classGroup.students.length,
      assignedDate: assignment.assigned_date,
    }));

    return {
      instructorId: instructor.instructor_id,
      accountId: instructor.account_id,
      employeeCode: instructor.employee_code,
      academicTitle: instructor.academic_title,
      position: instructor.position,
      departmentId: instructor.department_id,
      departmentName: instructor.department?.name ?? null,
      hireDate: instructor.hire_date,
      status: instructor.status,
      profile: {
        fullName: profile?.full_name ?? null,
        phoneNumber: profile?.phone_number ?? null,
        email: instructor.account?.email ?? null,
        dateOfBirth: profile?.date_of_birth ?? null,
        gender: profile?.gender ?? null,
        nationality: profile?.nationality ?? null,
        address: profile?.address ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      },
      advisedClasses,
    };
  }

  /**
   * Update instructor work information
   */
  async updateInstructorWork(accountId: number, updateDto: any) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { account_id: accountId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const data: any = {};
    if (updateDto.employee_code !== undefined)
      data.employee_code = updateDto.employee_code;
    if (updateDto.academic_title !== undefined)
      data.academic_title = updateDto.academic_title;
    if (updateDto.position !== undefined) data.position = updateDto.position;
    if (updateDto.department_id !== undefined)
      data.department_id = updateDto.department_id;
    if (updateDto.hire_date !== undefined)
      data.hire_date = updateDto.hire_date
        ? new Date(updateDto.hire_date)
        : null;

    const updated = await this.prisma.instructor.update({
      where: { instructor_id: instructor.instructor_id },
      data,
    });

    return { success: true, instructor: updated };
  }

  /**
   * Get available classes for instructor to advise
   */
  async getAvailableClassesForInstructor() {
    const classes = await this.prisma.classGroup.findMany({
      where: {
        status: 'active',
      },
      orderBy: [{ cohort_year: 'desc' }, { class_code: 'asc' }],
    });

    return classes.map((cls) => ({
      classId: cls.class_id,
      classCode: cls.class_code,
      cohortYear: cls.cohort_year,
      programId: cls.program_id,
    }));
  }

  /**
   * Update instructor advised classes
   */
  async updateInstructorAdvisedClasses(accountId: number, updateDto: any) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { account_id: accountId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Delete all existing assignments for this instructor
    await this.prisma.adviserAssignment.deleteMany({
      where: { instructor_id: instructor.instructor_id },
    });

    // Create new assignments
    const classes = updateDto.classes || [];
    if (classes.length > 0) {
      await this.prisma.adviserAssignment.createMany({
        data: classes.map((cls: any) => ({
          instructor_id: instructor.instructor_id,
          class_id: cls.classId,
          assigned_date: cls.assignedDate
            ? new Date(cls.assignedDate)
            : new Date(),
        })),
      });
    }

    return { success: true, message: 'Updated advised classes successfully' };
  }

  /**
   * Update profile for any user type
   */
  async updateProfile(accountId: number, updateDto: any) {
    // Check if profile exists
    const existingProfile = await this.prisma.profile.findUnique({
      where: { account_id: accountId },
    });

    const data: any = {};
    if (updateDto.full_name !== undefined) data.full_name = updateDto.full_name;
    if (updateDto.phone_number !== undefined)
      data.phone_number = updateDto.phone_number;
    if (updateDto.date_of_birth !== undefined)
      data.date_of_birth = updateDto.date_of_birth
        ? new Date(updateDto.date_of_birth)
        : null;
    if (updateDto.gender !== undefined) data.gender = updateDto.gender;
    if (updateDto.nationality !== undefined)
      data.nationality = updateDto.nationality;
    if (updateDto.address !== undefined) data.address = updateDto.address;
    if (updateDto.avatar_url !== undefined)
      data.avatar_url = updateDto.avatar_url;

    if (existingProfile) {
      // Update existing profile
      const updated = await this.prisma.profile.update({
        where: { account_id: accountId },
        data,
      });
      return { success: true, profile: updated };
    } else {
      // Create new profile
      if (!data.full_name) {
        throw new NotFoundException(
          'full_name is required to create a new profile',
        );
      }
      const created = await this.prisma.profile.create({
        data: {
          account_id: accountId,
          ...data,
        },
      });
      return { success: true, profile: created };
    }
  }

  /**
   * Update academic info for student
   */
  async updateAcademicInfo(
    accountId: number,
    updateDto: {
      student_code?: string;
      major?: string;
      cohort_year?: number;
      class_code?: string;
    },
  ) {
    // Find the student by account_id
    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const data: any = {};

    if (updateDto.student_code !== undefined)
      data.student_code = updateDto.student_code;
    if (updateDto.major !== undefined) data.major = updateDto.major;
    if (updateDto.cohort_year !== undefined)
      data.cohort_year = updateDto.cohort_year;

    // Handle class_code - need to find ClassGroup by class_code
    if (updateDto.class_code !== undefined) {
      if (updateDto.class_code) {
        const classGroup = await this.prisma.classGroup.findUnique({
          where: { class_code: updateDto.class_code },
        });
        if (classGroup) {
          data.class_id = classGroup.class_id;
        }
        // If class not found, just skip updating class_id
      } else {
        data.class_id = null;
      }
    }

    const updated = await this.prisma.student.update({
      where: { student_id: student.student_id },
      data,
    });

    return { success: true, student: updated };
  }

  /**
   * Get all classes for dropdown selection
   */
  async getAllClasses() {
    const classes = await this.prisma.classGroup.findMany({
      orderBy: [{ cohort_year: 'desc' }, { class_code: 'asc' }],
      select: {
        class_id: true,
        class_code: true,
        cohort_year: true,
      },
    });
    return classes;
  }

  /**
   * Generate a unique parent link code for student
   * Creates a pending ParentStudentLink record with a random code
   */
  async generateParentLinkCode(accountId: number): Promise<string> {
    // Find the student by account_id
    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if there's already a pending link (link_code exists but parent_id is null)
    // Using raw query to handle nullable parent_id
    const existingLinks = await this.prisma.$queryRaw<any[]>`
			SELECT * FROM "ParentStudentLink"
			WHERE student_id = ${student.student_id}
				AND link_code IS NOT NULL
				AND parent_id IS NULL
			ORDER BY link_id DESC
			LIMIT 1
		`;
    const existingLink = existingLinks[0] || null;

    // If an existing pending link code exists, return it (reuse it)
    if (existingLink && existingLink.link_code) {
      return existingLink.link_code;
    }

    // Generate a unique random code (format: PHXXXXXX, 10 chars max)
    let linkCode = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      // Generate random 6-character alphanumeric code
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      linkCode = `PH${randomPart}`;

      // Check if code is unique
      const existing = await this.prisma.parentStudentLink.findUnique({
        where: { link_code: linkCode },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique || !linkCode) {
      throw new Error('Unable to generate unique link code');
    }

    // Create a pending link record (parent_id is null)
    // Using raw query to allow null parent_id
    await this.prisma.$executeRaw`
			INSERT INTO "ParentStudentLink" (student_id, link_code, created_at)
			VALUES (${student.student_id}, ${linkCode}, NOW())
		`;

    return linkCode;
  }

  /**
   * Get student info by link code (for parent registration)
   */
  async getStudentByLinkCode(linkCode: string) {
    const link = await this.prisma.parentStudentLink.findUnique({
      where: { link_code: linkCode },
      include: {
        student: {
          include: {
            account: {
              include: {
                profile: true,
              },
            },
            classGroup: true,
          },
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Invalid link code');
    }

    return {
      linkId: link.link_id,
      studentId: link.student_id,
      studentCode: link.student.student_code,
      studentName: link.student.account?.profile?.full_name || null,
      className: link.student.classGroup?.class_code || null,
    };
  }

  /**
   * Get all departments
   */
  async getDepartments() {
    return this.prisma.department.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
  }
}
