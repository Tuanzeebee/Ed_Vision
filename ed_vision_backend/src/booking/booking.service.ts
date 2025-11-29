import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { BookingRepository } from './booking.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

const mapAdvisorFromAssignment = (assignment: any) => {
	if (!assignment) return null
	const instructor = assignment.instructor
	if (!instructor) {
		return {
			assignmentId: assignment.adviser_assign_id,
			instructorId: assignment.instructor_id,
		}
	}
	const account = instructor.account
	const profile = account?.profile
	return {
		assignmentId: assignment.adviser_assign_id,
		instructorId: instructor.instructor_id,
		accountId: instructor.account_id,
		employeeCode: instructor.employee_code,
		academicTitle: instructor.academic_title ?? null,
		position: instructor.position ?? null,
		departmentId: instructor.department_id ?? null,
		fullName: profile?.full_name ?? null,
		avatarUrl: profile?.avatar_url ?? null,
		email: account?.email ?? null,
	}
}

@Injectable()
export class BookingService {
	constructor(private readonly repository: BookingRepository) {}

	/**
	 * Book an appointment for a student (student or parent)
	 */
	async createAppointment(accountId: number, dto: CreateAppointmentDto) {
		const slot = await this.repository.getSlotById(dto.slotId);
		if (!slot) throw new NotFoundException('Time slot not found');

		if (!slot.is_open) throw new BadRequestException('This time slot is not open for booking');

		// Determine who is booking: student or parent
		const studentRecord = await this.repository.getStudentByAccountId(accountId);
		const parentRecord = await this.repository.getParentByAccountId(accountId);

		let bookerRole = 'student';
		let studentIdToUse: number | undefined = undefined;
		let parentContactDefaults: any = null;

		if (parentRecord) {
			// Parent may book on behalf of a studentId provided
			bookerRole = 'parent';
			if (!dto.studentId) throw new BadRequestException('Parent must specify studentId to book for');
			// verify link
			const link = await this.repository.verifyParentStudentLink(parentRecord.parent_id, dto.studentId);
			if (!link) throw new ForbiddenException('Parent is not linked to the requested student');
			studentIdToUse = dto.studentId;
			parentContactDefaults = {
			contact_name: parentRecord.full_name,
			contact_phone: parentRecord.phone_number,
			contact_email: parentRecord.email,
			relationship_to_student: parentRecord.relationship_type || dto.relationshipToStudent || null,
			};
		} else if (studentRecord) {
			bookerRole = 'student';
			studentIdToUse = studentRecord.student_id;
		} else {
			throw new ForbiddenException('Only students and parents can create bookings');
		}

		// Check capacity
		const bookedCount = await this.repository.countActiveAppointmentsForSlot(dto.slotId);
		if (slot.capacity !== undefined && bookedCount >= slot.capacity) {
			throw new ConflictException('This time slot is full');
		}

		// If requested meetingType is provided, accept it; otherwise use slot.meeting_type
		const meetingType = dto.meetingType ?? slot.meeting_type ?? 'offline';

		// Determine status: auto-accept -> confirmed, else pending
		const status = slot.auto_accept ? 'confirmed' : 'pending';

		// Determine instructor_id from slot.week
		const instructorId = slot.week?.instructor_id ?? null;

		const payload: any = {
			slot_id: dto.slotId,
			booker_account_id: accountId,
			booker_role: bookerRole,
			student_id: studentIdToUse,
			instructor_id: instructorId,
			// cast to any to satisfy Prisma enum typing in generated client
			meeting_type: meetingType as any,
			meeting_purpose: dto.meetingPurpose ?? null,
			status,
			created_at: new Date(),
		};

		const appointment = await this.repository.createAppointment(payload);

		// re-fetch to include slot and related info so caller can see slot.meeting_link / meeting_location
		const full = await this.repository.getAppointmentById(appointment.appointment_id);

		if (bookerRole === 'parent') {
			const contactPayload = {
				appointment_id: appointment.appointment_id,
				contact_name: dto.contactName?.trim() || parentContactDefaults?.contact_name || null,
				contact_phone: dto.contactPhone?.trim() || parentContactDefaults?.contact_phone || null,
				contact_email: dto.contactEmail?.trim() || parentContactDefaults?.contact_email || null,
				relationship_to_student:
					dto.relationshipToStudent?.trim() || parentContactDefaults?.relationship_to_student || null,
			};
			const contactRecord = await this.repository.upsertAppointmentContact(contactPayload);
			(full as any).appointmentContact = contactRecord;
		}

		// If online and slot has no meeting_link, generate a transient link for immediate response (do not persist on slot)
		if ((meetingType === 'online' || (full?.meeting_type === 'online')) && full?.slot && !(full.slot as any).meeting_link) {
			// attach a transient field meeting_link on the returned object
			(full as any).transient_meeting_link = `meet.google.com/${Math.random().toString(36).slice(2, 11)}`;
		}

		return full;
	}

	async getSlotDetails(slotId: number) {
		const slot = await this.repository.getSlotById(slotId)
		if (!slot) throw new NotFoundException('Slot not found')
		return slot
	}

	/**
	 * Get basic student info for booking purposes only
	 * For full profile, use ProfileService instead
	 */
	async getStudentForAccount(accountId: number) {
		if (!accountId) return null
		const student = await this.repository.getStudentByAccountId(accountId)
		if (!student) return null
		const profile = student.account?.profile
		const classGroup = student.classGroup
		const advisorAssignment = classGroup?.adviserAssignments?.[0]
		const advisor = mapAdvisorFromAssignment(advisorAssignment)
		
		return {
			student_id: student.student_id,
			account_id: student.account_id,
			student_code: student.student_code,
			full_name: profile?.full_name ?? null,
			fullName: profile?.full_name ?? null,
			class_id: student.class_id,
			className: classGroup?.class_code ?? null,
			major: student.major ?? null,
			cohort_year: student.cohort_year ?? null,
			status: student.status ?? null,
			verified: (student.status ?? '').toLowerCase() === 'active',
			advisor,
		}
	}

	/**
	 * Get basic parent info for booking purposes only
	 * For full profile, use ProfileService instead
	 */
	async getParentForAccount(accountId: number) {
		if (!accountId) return null
		const parent = await this.repository.getParentByAccountId(accountId)
		if (!parent) return null
		return {
			parent_id: parent.parent_id,
			account_id: parent.account_id,
			full_name: parent.full_name,
			fullName: parent.full_name,
			phone_number: parent.phone_number,
			phoneNumber: parent.phone_number,
			email: parent.email,
			relationship_type: parent.relationship_type ?? null,
		}
	}

	async getStudentsForParentAccount(accountId: number) {
		if (!accountId) return []
		const parent = await this.repository.getParentByAccountId(accountId)
		if (!parent) return []
		const links = await this.repository.getStudentsForParent(parent.parent_id)
		console.log('[getStudentsForParentAccount] Found links:', links.length)
		const shaped = links
			.map((link) => {
				const student = link.student
				if (!student) return null
				const profile = student.account?.profile
				const classGroup = student.classGroup
				const advisorAssignment = classGroup?.adviserAssignments?.[0]
				const advisor = mapAdvisorFromAssignment(advisorAssignment)
			return {
				linkId: link.link_id,
				studentId: student.student_id,
				studentCode: student.student_code,
				student_code: student.student_code,
				fullName: profile?.full_name ?? null,
				full_name: profile?.full_name ?? null,
				class_id: student.class_id,
				className: classGroup?.class_code ?? null,
				status: student.status ?? null,
				verified: (student.status ?? '').toLowerCase() === 'active',
				advisor,
			}
			})
			.filter((item): item is NonNullable<typeof item> => item !== null)
		console.log('[getStudentsForParentAccount] Returning:', JSON.stringify(shaped, null, 2))
		return shaped
	}
	async listAppointmentsForAccount(accountId: number) {
		return this.repository.getAppointmentsForAccount(accountId);
	}

	async cancelAppointment(accountId: number, appointmentId: number, reason?: string) {
		const appt = await this.repository.getAppointmentById(appointmentId);
		if (!appt) throw new NotFoundException('Appointment not found');

		// Check if the user is either the booker or the instructor
		const instructor = await this.repository.getInstructorByAccountId(accountId);
		const isInstructor = instructor && appt.instructor_id === instructor.instructor_id;
		const isBooker = appt.booker_account_id === accountId;

		if (!isBooker && !isInstructor) {
			throw new ForbiddenException('You are not allowed to cancel this appointment');
		}

		if (appt.status === 'canceled') {
			throw new BadRequestException('Appointment already canceled');
		}

		return this.repository.cancelAppointment(appointmentId, reason);
	}

	/**
	 * Get instructor record by account_id
	 */
	async getInstructorForAccount(accountId: number) {
		if (!accountId) return null;
		return this.repository.getInstructorByAccountId(accountId);
	}

	/**
	 * Get appointments for instructor (pending requests)
	 */
	async getInstructorAppointments(accountId: number, statusFilter?: string[], bookerRole?: string) {
		const instructor = await this.repository.getInstructorByAccountId(accountId);
		if (!instructor) throw new NotFoundException('Instructor not found for this account');

		const appointments = await this.repository.getAppointmentsForInstructor(
			instructor.instructor_id,
			statusFilter,
			bookerRole, // Pass booker_role filter
		);

		// Transform to frontend-friendly format
		return appointments.map((appt) => {
			const student = appt.student;
			const studentProfile = student?.account?.profile;
			const classGroup = student?.classGroup;
			const bookerProfile = appt.booker?.profile;
			const contact = appt.appointmentContact;
			const slot = appt.slot;

			// Helper function to format time from PostgreSQL Time type
			const formatTime = (timeValue: any): string => {
				if (!timeValue) return '';
				try {
					const date = new Date(timeValue);
					if (isNaN(date.getTime())) return '';
					// Extract HH:MM format
					const hours = date.getUTCHours().toString().padStart(2, '0');
					const minutes = date.getUTCMinutes().toString().padStart(2, '0');
					return `${hours}:${minutes}`;
				} catch (e) {
					return '';
				}
			};

			return {
				id: appt.appointment_id,
				appointmentId: appt.appointment_id,
				slotId: appt.slot_id,
				status: appt.status,
				meetingType: appt.meeting_type,
				meetingPurpose: appt.meeting_purpose,
				createdAt: appt.created_at,
				updatedAt: appt.updated_at,
				canceledAt: appt.canceled_at,
				cancelReason: appt.cancel_reason,
				
				// Slot details
				slot: slot ? {
					slotId: slot.slot_id,
					dayOfWeek: slot.day_of_week,
					startTime: formatTime(slot.start_time_local),
					endTime: formatTime(slot.end_time_local),
					meetingType: slot.meeting_type,
					meetingLink: slot.meeting_link,
					meetingLocation: slot.meeting_location,
				} : null,

				// Student info
				studentId: student?.student_id,
				studentName: studentProfile?.full_name ?? 'Unknown Student',
				studentCode: student?.student_code,
				studentClass: classGroup?.class_code ?? 'Unknown Class',
				studentAvatar: studentProfile?.avatar_url,

				// Parent/Booker info
				bookerRole: appt.booker_role,
				bookerAccountId: appt.booker_account_id,
				parentName: contact?.contact_name ?? bookerProfile?.full_name ?? 'Unknown',
				parentPhone: contact?.contact_phone,
				parentEmail: contact?.contact_email,
				parentAvatar: bookerProfile?.avatar_url,
				relationshipToStudent: contact?.relationship_to_student,

				// Computed fields for frontend
				type: appt.meeting_type === 'online' ? 'online' : 'offline',
				reason: appt.meeting_purpose ?? 'No reason provided',
				requestedAt: appt.created_at?.toISOString(),
				desiredDate: slot ? `${slot.day_of_week}` : 'Unknown',
				desiredTime: slot ? `${formatTime(slot.start_time_local)} - ${formatTime(slot.end_time_local)}` : 'Unknown',
				platform: appt.meeting_type === 'online' ? 'Google Meet' : undefined,
			};
		});
	}

	/**
	 * Accept appointment (instructor only)
	 */
	async acceptAppointment(
		accountId: number,
		appointmentId: number,
		data?: { meetingLink?: string; meetingLocation?: string; notes?: string },
	) {
		const instructor = await this.repository.getInstructorByAccountId(accountId);
		if (!instructor) throw new ForbiddenException('Only instructors can accept appointments');

		const appt = await this.repository.getAppointmentById(appointmentId);
		if (!appt) throw new NotFoundException('Appointment not found');

		if (appt.instructor_id !== instructor.instructor_id) {
			throw new ForbiddenException('You can only accept your own appointments');
		}

		if (appt.status !== 'pending') {
			throw new BadRequestException(`Cannot accept appointment with status: ${appt.status}`);
		}

		return this.repository.acceptAppointment(appointmentId, data);
	}

	/**
	 * Reject appointment (instructor only)
	 */
	async rejectAppointment(
		accountId: number,
		appointmentId: number,
		data: { reason: string; suggestedDate?: string; suggestedTime?: string; notes?: string },
	) {
		const instructor = await this.repository.getInstructorByAccountId(accountId);
		if (!instructor) throw new ForbiddenException('Only instructors can reject appointments');

		const appt = await this.repository.getAppointmentById(appointmentId);
		if (!appt) throw new NotFoundException('Appointment not found');

		if (appt.instructor_id !== instructor.instructor_id) {
			throw new ForbiddenException('You can only reject your own appointments');
		}

		if (appt.status !== 'pending') {
			throw new BadRequestException(`Cannot reject appointment with status: ${appt.status}`);
		}

		return this.repository.rejectAppointment(appointmentId, data);
	}
}