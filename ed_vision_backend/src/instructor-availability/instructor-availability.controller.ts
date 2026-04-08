import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InstructorAvailabilityService } from './instructor-availability.service';
import { AddAvailabilityDateDto } from './dto/add-availability-date.dto';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';
import { BulkCreateAvailabilityDto } from './dto/bulk-create-availability.dto';

@Controller('instructor-availability')
export class InstructorAvailabilityController {
  constructor(
    private readonly availabilityService: InstructorAvailabilityService,
  ) {}

  /**
   * Smoke test endpoint
   */
  @Get('admin/test')
  test() {
    return {
      message: 'Instructor Availability API is working',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get instructor profile by account_id
   * GET /instructor-availability/profile/:accountId
   * NOTE: This must come BEFORE the :instructorId routes
   */
  @Get('profile/:accountId')
  async getInstructorProfile(
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    return this.availabilityService.getInstructorProfile(accountId);
  }

  /**
   * Check if instructor is an adviser (has adviser assignments)
   * GET /instructor-availability/:instructorId/is-adviser
   */
  @Get(':instructorId/is-adviser')
  async checkIsAdviser(
    @Param('instructorId', ParseIntPipe) instructorId: number,
  ) {
    return this.availabilityService.checkIsAdviser(instructorId);
  }

  /**
   * Get classes that instructor is assigned as adviser
   * GET /instructor-availability/:instructorId/adviser-classes
   */
  @Get(':instructorId/adviser-classes')
  async getAdviserClasses(
    @Param('instructorId', ParseIntPipe) instructorId: number,
  ) {
    return this.availabilityService.getAdviserClasses(instructorId);
  }

  /**
   * Delete all time slots for a specific date
   * DELETE /instructor-availability/:instructorId/dates/:date
   * IMPORTANT: Must come BEFORE general :instructorId routes to avoid conflicts
   */
  @Delete(':instructorId/dates/:date')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAvailabilityDate(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('date') date: string,
  ) {
    await this.availabilityService.deleteAvailabilityDate(instructorId, date);
  }

  /**
   * Get instructor's availability statistics
   * GET /instructor-availability/:instructorId/statistics
   * NOTE: This must come BEFORE the general :instructorId route
   */
  @Get(':instructorId/statistics')
  async getStatistics(
    @Param('instructorId', ParseIntPipe) instructorId: number,
  ) {
    return this.availabilityService.getStatistics(instructorId);
  }

  /**
   * Get instructor's availability
   * GET /instructor-availability/:instructorId
   */
  @Get(':instructorId')
  async getAvailability(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('autoCreate') autoCreate?: string, // 'true' hoặc 'false'
  ) {
    const shouldAutoCreate = autoCreate === 'true';
    return this.availabilityService.getAvailability(
      instructorId,
      startDate,
      endDate,
      shouldAutoCreate,
    );
  }

  /**
   * Add a new availability date (with optional time slots)
   * POST /instructor-availability/:instructorId/dates
   */
  @Post(':instructorId/dates')
  @HttpCode(HttpStatus.CREATED)
  async addAvailabilityDate(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Body() dto: AddAvailabilityDateDto,
  ) {
    return this.availabilityService.addAvailabilityDate(instructorId, dto);
  }

  /**
   * Bulk create availability dates
   * POST /instructor-availability/:instructorId/dates/bulk
   */
  @Post(':instructorId/dates/bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateAvailability(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Body() dto: BulkCreateAvailabilityDto,
  ) {
    return this.availabilityService.bulkCreateAvailability(
      instructorId,
      dto.availabilities,
    );
  }

  /**
   * Add a time slot to a specific date
   * POST /instructor-availability/:instructorId/dates/:date/slots
   */
  @Post(':instructorId/dates/:date/slots')
  @HttpCode(HttpStatus.CREATED)
  async addTimeSlot(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('date') date: string,
    @Body() dto: CreateTimeSlotDto,
  ) {
    return this.availabilityService.addTimeSlot(instructorId, date, dto);
  }

  /**
   * Update a time slot
   * PATCH /instructor-availability/:instructorId/slots/:slotId
   */
  @Patch(':instructorId/slots/:slotId')
  async updateTimeSlot(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: UpdateTimeSlotDto,
  ) {
    return this.availabilityService.updateTimeSlot(instructorId, slotId, dto);
  }

  /**
   * Delete a specific time slot
   * DELETE /instructor-availability/:instructorId/slots/:slotId
   */
  @Delete(':instructorId/slots/:slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTimeSlot(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    await this.availabilityService.deleteTimeSlot(instructorId, slotId);
  }
}
