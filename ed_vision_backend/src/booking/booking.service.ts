import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { BookingRepository } from './booking.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

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
				relationship_to_student: link.relationship || dto.relationshipToStudent || null,
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

	async getStudentForAccount(accountId: number) {
		if (!accountId) return null
		const student = await this.repository.getStudentByAccountId(accountId)
		if (!student) return null
		const profile = student.account?.profile
		const classGroup = student.classGroup
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
		}
	}

	async getParentForAccount(accountId: number) {
		if (!accountId) return null
		const parent = await this.repository.getParentByAccountId(accountId)
		if (!parent) return null
		const profile = parent.account?.profile
		return {
			parent_id: parent.parent_id,
			account_id: parent.account_id,
			full_name: parent.full_name,
			fullName: parent.full_name,
			phone_number: parent.phone_number,
			phoneNumber: parent.phone_number,
			email: parent.email,
			gender: profile?.gender ?? null,
			avatar_url: profile?.avatar_url ?? null,
			relationship_type: parent.relationship_type ?? null,
		}
	}

	async getStudentsForParentAccount(accountId: number) {
		if (!accountId) return []
		const parent = await this.repository.getParentByAccountId(accountId)
		if (!parent) return []
		const links = await this.repository.getStudentsForParent(parent.parent_id)
		const shaped = links
			.map((link) => {
				const student = link.student
				if (!student) return null
				const profile = student.account?.profile
				const classGroup = student.classGroup
				return {
					linkId: link.link_id,
					studentId: student.student_id,
					relationship: link.relationship ?? null,
					student_code: student.student_code,
					full_name: profile?.full_name ?? null,
					fullName: profile?.full_name ?? null,
					class_id: student.class_id,
					className: classGroup?.class_code ?? null,
					status: student.status ?? null,
					verified: (student.status ?? '').toLowerCase() === 'active',
				}
			})
			.filter((item): item is NonNullable<typeof item> => item !== null)
		return shaped
	}
	async listAppointmentsForAccount(accountId: number) {
		return this.repository.getAppointmentsForAccount(accountId);
	}

	async cancelAppointment(accountId: number, appointmentId: number, reason?: string) {
		const appt = await this.repository.getAppointmentById(appointmentId);
		if (!appt) throw new NotFoundException('Appointment not found');

		// Only booker can cancel (for now)
		if (appt.booker_account_id !== accountId) {
			throw new ForbiddenException('You are not allowed to cancel this appointment');
		}

		if (appt.status === 'canceled') {
			throw new BadRequestException('Appointment already canceled');
		}

		return this.repository.cancelAppointment(appointmentId, reason);
	}
}

