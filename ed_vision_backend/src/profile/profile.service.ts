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
						parent: true,
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
					fullName: advisorAssignment.instructor.account?.profile?.full_name ?? null,
					email: advisorAssignment.instructor.account?.email ?? null,
					avatarUrl: advisorAssignment.instructor.account?.profile?.avatar_url ?? null,
			  }
			: null;

		const parentLinks = student.parentStudentLinks.map((link) => ({
			linkId: link.link_id,
			linkCode: link.link_code,
			parent: {
				parentId: link.parent.parent_id,
				fullName: link.parent.full_name,
				email: link.parent.email,
				phoneNumber: link.parent.phone_number,
				relationshipType: link.parent.relationship_type,
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
			profile: {
				fullName: profile?.full_name ?? parent.full_name,
				phoneNumber: profile?.phone_number ?? parent.phone_number,
				email: parent.email,
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
		}));

			return {
			instructorId: instructor.instructor_id,
			accountId: instructor.account_id,
			employeeCode: instructor.employee_code,
			academicTitle: instructor.academic_title,
			position: instructor.position,
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
	 * Update profile for any user type
	 */
	async updateProfile(accountId: number, updateDto: any) {
		// Check if profile exists
		const existingProfile = await this.prisma.profile.findUnique({
			where: { account_id: accountId },
		});

		const data: any = {};
		if (updateDto.full_name !== undefined) data.full_name = updateDto.full_name;
		if (updateDto.phone_number !== undefined) data.phone_number = updateDto.phone_number;
		if (updateDto.date_of_birth !== undefined) data.date_of_birth = updateDto.date_of_birth ? new Date(updateDto.date_of_birth) : null;
		if (updateDto.gender !== undefined) data.gender = updateDto.gender;
		if (updateDto.nationality !== undefined) data.nationality = updateDto.nationality;
		if (updateDto.address !== undefined) data.address = updateDto.address;
		if (updateDto.avatar_url !== undefined) data.avatar_url = updateDto.avatar_url;

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
				throw new NotFoundException('full_name is required to create a new profile');
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
		updateDto: { student_code?: string; major?: string; cohort_year?: number; class_code?: string },
	) {
		// Find the student by account_id
		const student = await this.prisma.student.findUnique({
			where: { account_id: accountId },
		});

		if (!student) {
			throw new NotFoundException('Student not found');
		}

		const data: any = {};

		if (updateDto.student_code !== undefined) data.student_code = updateDto.student_code;
		if (updateDto.major !== undefined) data.major = updateDto.major;
		if (updateDto.cohort_year !== undefined) data.cohort_year = updateDto.cohort_year;

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
}