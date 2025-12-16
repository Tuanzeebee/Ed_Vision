import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { BookingRepository } from './booking.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ReminderSchedulerService } from '../admin_be/notification/reminder-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../admin_be/notification/notification.gateway';

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
	private readonly logger = new Logger(BookingService.name);

	constructor(
		private readonly repository: BookingRepository,
		private readonly reminderScheduler: ReminderSchedulerService,
		private readonly prisma: PrismaService,
		private readonly notificationGateway: NotificationGateway,
	) {}

	/**
	 * Book an appointment for a student (student or parent)
	 */
	async createAppointment(accountId: number, dto: CreateAppointmentDto) {
		const slot = await this.repository.getSlotById(dto.slotId);
		if (!slot) throw new NotFoundException('Time slot not found');

		if (!slot.is_open) throw new BadRequestException('This time slot is not open for booking');

		// Check if slot has already passed (prevent booking past slots)
		const slotDate = slot.date?.specific_date;
		const startTime = slot.start_time_local;
		if (slotDate && startTime) {
			try {
				const dateObj = new Date(slotDate);
				const year = dateObj.getFullYear();
				const month = dateObj.getMonth();
				const day = dateObj.getDate();

				const startTimeObj = new Date(startTime);
				const hours = startTimeObj.getUTCHours();
				const minutes = startTimeObj.getUTCMinutes();

				const slotStartDateTime = new Date(year, month, day, hours, minutes, 0, 0);
				const now = new Date();

				if (slotStartDateTime <= now) {
					throw new BadRequestException('This time slot has already passed and cannot be booked');
				}
			} catch (error) {
				// If parsing fails, allow booking but log warning
				console.warn(`Failed to parse slot datetime for slot ${dto.slotId}:`, error);
			}
		}

		// Determine who is booking: student or parent
		const studentRecord = await this.repository.getStudentByAccountId(accountId);
		const parentRecord = await this.repository.getParentByAccountId(accountId);

		console.log(`Booking for accountId ${accountId}: studentRecord=${!!studentRecord}, parentRecord=${!!parentRecord}`);

		let bookerRole = 'student';
		let studentIdToUse: number | undefined = undefined;
		let parentContactDefaults: any = null;

		if (parentRecord) {
			// Parent may book on behalf of a studentId provided
			bookerRole = 'parent';
			console.log(`Setting bookerRole to 'parent' for accountId ${accountId}`);
			if (!dto.studentId) throw new BadRequestException('Parent must specify studentId to book for');
			// verify link
			const link = await this.repository.verifyParentStudentLink(parentRecord.parent_id, dto.studentId);
			if (!link) throw new ForbiddenException('Parent is not linked to the requested student');
			studentIdToUse = dto.studentId;
			parentContactDefaults = {
				contact_name: parentRecord.account.profile?.full_name || 'Parent',
				contact_phone: parentRecord.account.profile?.phone_number || '',
				contact_email: parentRecord.account.email,
				relationship_to_student: parentRecord.relationship_type || dto.relationshipToStudent || null,
			};
		} else if (studentRecord) {
			bookerRole = 'student';
			console.log(`Setting bookerRole to 'student' for accountId ${accountId}`);
			studentIdToUse = studentRecord.student_id;
		} else {
			throw new ForbiddenException('Only students and parents can create bookings');
		}

		// Ensure studentIdToUse is defined at this point
		if (studentIdToUse === undefined) {
			throw new BadRequestException('Unable to determine student for this booking');
		}

		// Check if student already has any appointment for this slot
		const existingAppointment = await this.repository.findAnyAppointmentForSlotAndStudent(dto.slotId, studentIdToUse);
		if (existingAppointment) {
			// If appointment is cancelled, reactivate it
			if (existingAppointment.status === 'canceled' || existingAppointment.status === 'cancelled') {
				const status = bookerRole === 'student' ? 'confirmed' : 'pending';
				const meetingType = dto.meetingType ?? slot.meeting_type ?? 'offline';

				const updatedAppointment = await this.repository.reactivateCancelledAppointment(
					existingAppointment.appointment_id,
					status,
					meetingType as any,
					dto.meetingPurpose
				);

				// re-fetch to include slot and related info
				const full = await this.repository.getAppointmentById(updatedAppointment.appointment_id);

				if (bookerRole === 'parent') {
					const contactPayload = {
						appointment_id: updatedAppointment.appointment_id,
						contact_name: dto.contactName?.trim() || parentContactDefaults?.contact_name || null,
						contact_phone: dto.contactPhone?.trim() || parentContactDefaults?.contact_phone || null,
						contact_email: dto.contactEmail?.trim() || parentContactDefaults?.contact_email || null,
						relationship_to_student:
							dto.relationshipToStudent?.trim() || parentContactDefaults?.relationship_to_student || null,
					};
					const contactRecord = await this.repository.upsertAppointmentContact(contactPayload);
					(full as any).appointmentContact = contactRecord;
				}

				// If online and slot has no meeting_link, generate a transient link
				const fullWithSlot = full as any;
				if ((meetingType === 'online' || (full?.meeting_type === 'online')) && fullWithSlot?.slot && !fullWithSlot.slot.meeting_link) {
					(full as any).transient_meeting_link = `meet.google.com/${Math.random().toString(36).slice(2, 11)}`;
				}

				return full;
			} else if (existingAppointment.status === 'rejected') {
				throw new BadRequestException('Khung giờ này đã bị giảng viên từ chối. Vui lòng chọn khung giờ khác.');
			} else if (existingAppointment.status === 'pending' || existingAppointment.status === 'confirmed') {
				// Student already has an active appointment for this slot
				throw new ConflictException('Bạn đã có lịch hẹn cho khung giờ này rồi');
			}
		}

		// Check capacity
		const bookedCount = await this.repository.countActiveAppointmentsForSlot(dto.slotId);
		if (slot.capacity !== undefined && bookedCount >= slot.capacity) {
			throw new ConflictException('This time slot is full');
		}

		// If requested meetingType is provided, accept it; otherwise use slot.meeting_type
		const meetingType = dto.meetingType ?? slot.meeting_type ?? 'offline';

		// Determine status: student -> confirmed, parent -> pending
		const status = bookerRole === 'student' ? 'confirmed' : 'pending';

		// Determine instructor_id from slot.date.week
		const instructorId = slot.date?.week?.instructor_id ?? null;

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
		const fullWithSlot = full as any;
		if ((meetingType === 'online' || (full?.meeting_type === 'online')) && fullWithSlot?.slot && !fullWithSlot.slot.meeting_link) {
			// attach a transient field meeting_link on the returned object
			(full as any).transient_meeting_link = `meet.google.com/${Math.random().toString(36).slice(2, 11)}`;
		}

		// Tạo reminder nhắc nhở trước cuộc hẹn (10 phút, 5 phút, 1 phút)
		try {
			if (fullWithSlot?.slot?.date?.specific_date && fullWithSlot?.slot?.start_time_local) {
				// specific_date là ngày (YYYY-MM-DD) lưu dạng Date trong DB
				// start_time_local là giờ local (HH:MM) lưu dạng Time trong DB
				const specificDate = new Date(fullWithSlot.slot.date.specific_date);
				const startTime = new Date(fullWithSlot.slot.start_time_local);
				
				// Log raw values để debug
				this.logger.log(`[Reminder] Raw specific_date: ${fullWithSlot.slot.date.specific_date}`);
				this.logger.log(`[Reminder] Raw start_time_local: ${fullWithSlot.slot.start_time_local}`);
				this.logger.log(`[Reminder] Parsed specificDate: ${specificDate.toISOString()}`);
				this.logger.log(`[Reminder] Parsed startTime: ${startTime.toISOString()}`);
				
				// ===== FIX TIMEZONE =====
				// specific_date: DATE type trong DB (lưu ngày không có time)
				// start_time_local: TIME type trong DB (lưu giờ local VN)
				// 
				// VÍ DỤ: Slot 21:15 VN ngày 06/12/2025
				// - Cần tạo: 2025-12-06T14:15:00Z (UTC)
				
				// Lấy ngày từ specific_date
				const year = specificDate.getUTCFullYear();
				const month = specificDate.getUTCMonth();
				const day = specificDate.getUTCDate();
				
				// Lấy giờ VN từ start_time_local
				const hoursVN = startTime.getUTCHours();
				const minutesVN = startTime.getUTCMinutes();
				
				// Tạo datetime string dạng: "2025-12-06T21:15:00+07:00"
				const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
				const timeStr = `${String(hoursVN).padStart(2, '0')}:${String(minutesVN).padStart(2, '0')}:00`;
				const datetimeVN = `${dateStr}T${timeStr}+07:00`;
				
				// Parse thành UTC
				const appointmentTimeUTC = new Date(datetimeVN);
				
				this.logger.log(`[Reminder] Date: ${dateStr}, Time VN: ${timeStr}`);
				this.logger.log(`[Reminder] DateTime VN: ${datetimeVN}`);
				this.logger.log(`[Reminder] appointmentTimeUTC: ${appointmentTimeUTC.toISOString()}`);
				this.logger.log(`[Reminder] Now (UTC): ${new Date().toISOString()}`);

				// Tạo reminder cho người đặt lịch (student hoặc parent)
				await this.reminderScheduler.createRemindersForAppointment(
					appointment.appointment_id,
					accountId,
					appointmentTimeUTC,
				);

				// Nếu có instructor, tạo reminder cho instructor
				if (instructorId) {
					const instructorAccount = await this.repository.getInstructorById(instructorId);
					if (instructorAccount) {
						await this.reminderScheduler.createRemindersForAppointment(
							appointment.appointment_id,
							instructorAccount.account_id,
							appointmentTimeUTC,
						);
					}
				}

				this.logger.log(`Created reminders for appointment ${appointment.appointment_id}`);
			}
		} catch (error) {
			this.logger.error(`Failed to create reminders for appointment ${appointment.appointment_id}:`, error);
			// Không throw error, vì appointment đã được tạo thành công
		}

		// GỬI INSTANT NOTIFICATION cho teacher ngay khi student book lịch
		try {
			if (instructorId) {
				const instructorAccount = await this.repository.getInstructorById(instructorId);
				if (instructorAccount) {
					const studentName = fullWithSlot?.student?.account?.profile?.full_name || 'Sinh viên';
					
					// Format date
					const slotDate = fullWithSlot?.slot?.date?.specific_date 
						? new Date(fullWithSlot.slot.date.specific_date).toLocaleDateString('vi-VN', { 
							weekday: 'long', 
							year: 'numeric', 
							month: 'long', 
							day: 'numeric' 
						})
						: '';
					
					// Format time - FIX: start_time_local là TIME type, giờ đã là VN time
					let slotTime = '';
					if (fullWithSlot?.slot?.start_time_local) {
						const timeObj = new Date(fullWithSlot.slot.start_time_local);
						const hours = timeObj.getUTCHours(); // Giờ VN lưu dạng UTC trong TIME type
						const minutes = timeObj.getUTCMinutes();
						slotTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
					}

					// Tạo notification master
					const master = await this.prisma.notificationMaster.create({
						data: {
							title: '📅 Lịch hẹn mới',
							body: `Sinh viên ${studentName} đã đặt lịch vào khung giờ ${slotTime} ngày ${slotDate} của bạn.`,
							type: 'appointment_created',
							priority: 'Cao',
							target: 'individual',
							channel: 'in_app',
							created_by: accountId, // Student who created
						},
					});

					// Tạo notification recipient cho instructor
					const now = new Date();
					await this.prisma.notificationRecipient.create({
						data: {
							master_id: master.id,
							account_id: instructorAccount.account_id,
							is_read: false,
							delivered_at: now,
						},
					});

					// Push real-time qua WebSocket
					const payload = {
						masterId: master.id,
						title: '📅 Lịch hẹn mới',
						body: `Sinh viên ${studentName} đã đặt lịch vào khung giờ ${slotTime} ngày ${slotDate} của bạn.`,
						type: 'appointment_created',
						target: 'individual',
						attachments: null,
						createdAt: now.toISOString(),
					};
					this.notificationGateway.broadcastNotification(payload, [instructorAccount.account_id]);

					this.logger.log(`Sent instant notification to instructor ${instructorAccount.account_id} for appointment ${appointment.appointment_id}`);
				}
			}
		} catch (error) {
			this.logger.error(`Failed to send instant notification:`, error);
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
			full_name: parent.account.profile?.full_name || 'Parent',
			fullName: parent.account.profile?.full_name || 'Parent',
			phone_number: parent.account.profile?.phone_number || '',
			phoneNumber: parent.account.profile?.phone_number || '',
			email: parent.account.email,
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
		// Debug logs removed to reduce console noise in production
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

		if (appt.status === 'cancelled') {
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
			const apptAny = appt as any;
			const student = apptAny.student;
			const studentProfile = student?.account?.profile;
			const classGroup = student?.classGroup;
			const bookerProfile = apptAny.booker?.profile;
			const contact = apptAny.appointmentContact;
			const slot = apptAny.slot;

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
				
				// Slot details - get day from date.specific_date
				slot: slot ? {
					slotId: slot.slot_id,
					dayOfWeek: slot.date ? new Date(slot.date.specific_date).getUTCDay() || 7 : null,
					specificDate: slot.date?.specific_date,
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
				desiredDate: slot?.date?.specific_date ? new Date(slot.date.specific_date).toISOString().split('T')[0] : 'Unknown',
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

		// Allow reject for both pending and confirmed appointments
		if (appt.status !== 'pending' && appt.status !== 'confirmed') {
			throw new BadRequestException(`Cannot reject appointment with status: ${appt.status}`);
		}

		return this.repository.rejectAppointment(appointmentId, data);
	}

	/**
	 * Update appointment status (instructor, admin, or appointment booker)
	 */
	async updateAppointmentStatus(accountId: number, appointmentId: number, status: string) {
		// Check if user is instructor or admin
		const instructor = await this.repository.getInstructorByAccountId(accountId);
		const account = await this.repository.getAccountById(accountId);
		
		const isInstructor = !!instructor;
		const isAdmin = account?.role_id && await this.repository.isAdminRole(account.role_id);
		
		// Get the appointment to check ownership
		const appt = await this.repository.getAppointmentById(appointmentId);
		if (!appt) throw new NotFoundException('Appointment not found');
		
		const isBooker = appt.booker_account_id === accountId;
		
		// Allow if user is admin, instructor of the appointment, or the booker
		const hasPermission = isAdmin || (isInstructor && appt.instructor_id === instructor.instructor_id) || isBooker;
		
		if (!hasPermission) {
			throw new ForbiddenException('You do not have permission to update this appointment status');
		}

		// Validate status
		const validStatuses = ['pending', 'confirmed', 'completed', 'canceled'];
		if (!validStatuses.includes(status)) {
			throw new BadRequestException(`Invalid status: ${status}`);
		}

		// Update status
		await this.repository.updateAppointmentStatus(appointmentId, status);
		
		// Return updated appointment
		return this.repository.getAppointmentById(appointmentId);
	}
}