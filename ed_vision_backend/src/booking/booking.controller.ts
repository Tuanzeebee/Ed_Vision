import { Controller, Post, Get, Delete, Body, Req, Param, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';

@Controller('booking')
export class BookingController {
	constructor(private readonly bookingService: BookingService) {}

	/**
	 * Create a new appointment (student or parent)
	 */
	@Post()
	@UseGuards(DevAuthGuard)
	@HttpCode(HttpStatus.CREATED)
	async create(@Req() req: any, @Body() dto: CreateAppointmentDto) {
		const accountId = req.user?.account_id;
		return this.bookingService.createAppointment(accountId, dto);
	}

	/**
	 * List appointments of the current account
	 */
	@Get()
	@UseGuards(DevAuthGuard)
	async list(@Req() req: any) {
		const accountId = req.user?.account_id;
		return this.bookingService.listAppointmentsForAccount(accountId);
	}

	/**
	 * Cancel an appointment (booker only)
	 */
	@Delete(':id')
	@UseGuards(DevAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	async cancel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
		const accountId = req.user?.account_id;
		await this.bookingService.cancelAppointment(accountId, id);
	}

	/**
	 * Get slot details for confirmation UI
	 */
	@Get('slot/:id')
	async getSlot(@Param('id', ParseIntPipe) id: number) {
		return this.bookingService.getSlotDetails(id);
	}

	/**
	 * Get the student record for the current logged-in account
	 */
	@Get('me/student')
	@UseGuards(DevAuthGuard)
	async getMeStudent(@Req() req: any) {
		const accountId = req.user?.account_id
		console.log('[booking] getMeStudent', { accountId })
		const student = await this.bookingService.getStudentForAccount(accountId)
		// always return a JSON body (null when not found) to avoid empty responses
		return { student: student ?? null }
	}

	@Get('me/parent')
	@UseGuards(DevAuthGuard)
	async getMeParent(@Req() req: any) {
		const accountId = req.user?.account_id
		const parent = await this.bookingService.getParentForAccount(accountId)
		return { parent: parent ?? null }
	}

	@Get('me/parent/students')
	@UseGuards(DevAuthGuard)
	async getParentStudents(@Req() req: any) {
		const accountId = req.user?.account_id
		const students = await this.bookingService.getStudentsForParentAccount(accountId)
		return { students }
	}

	/**
	 * Debug endpoint — returns a sample student JSON so frontend can be tested without auth/db
	 */
	@Get('debug/student-sample')
	async debugStudentSample() {
		return {
			student: {
				student_id: 1234,
				full_name: 'Nguyễn Văn A',
				student_code: '20250001',
				className: 'K26-CNTT',
				verified: true,
			},
		}
	}
}

