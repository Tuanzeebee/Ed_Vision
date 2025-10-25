import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InstructorAvailabilityService } from './instructor-availability.service';
import { InstructorAvailabilityRepository } from './instructor-availability.repository';

describe('InstructorAvailabilityService', () => {
  let service: InstructorAvailabilityService;
  let repository: InstructorAvailabilityRepository;

  const mockRepository = {
    findOrCreateWeek: jest.fn(),
    createTimeSlot: jest.fn(),
    getSlotsWithBookingCounts: jest.fn(),
    deleteTimeSlot: jest.fn(),
    deleteSlotsForDate: jest.fn(),
    updateTimeSlot: jest.fn(),
    getSlotById: jest.fn(),
    checkTimeSlotOverlap: jest.fn(),
    formatTimeToString: jest.fn((date: Date) => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstructorAvailabilityService,
        {
          provide: InstructorAvailabilityRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InstructorAvailabilityService>(InstructorAvailabilityService);
    repository = module.get<InstructorAvailabilityRepository>(
      InstructorAvailabilityRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addAvailabilityDate', () => {
    it('should add a new availability date with time slots', async () => {
      const instructorId = 1;
      const dto = {
        date: '2025-10-25',
        timeSlots: [
          {
            startTime: '09:00',
            endTime: '10:00',
            meetingType: 'online' as const,
            capacity: 10,
          },
        ],
      };

      const mockWeek = {
        week_id: 1,
        instructor_id: 1,
        week_start_date: new Date('2025-10-20'),
        created_at: new Date(),
      };

      const mockSlot = {
        slot_id: 1,
        week_id: 1,
        day_of_week: 6,
        start_time_local: new Date('1970-01-01T09:00:00'),
        end_time_local: new Date('1970-01-01T10:00:00'),
        period_label: null,
        capacity: 10,
        is_open: true,
        note: null,
        auto_accept: false,
        meeting_type: 'online',
      };

      mockRepository.findOrCreateWeek.mockResolvedValue(mockWeek);
      mockRepository.checkTimeSlotOverlap.mockResolvedValue(false);
      mockRepository.createTimeSlot.mockResolvedValue(mockSlot);

      const result = await service.addAvailabilityDate(instructorId, dto);

      expect(result.date).toBe('2025-10-25');
      expect(result.weekId).toBe(1);
      expect(result.timeSlots).toHaveLength(1);
      expect(repository.findOrCreateWeek).toHaveBeenCalledWith(
        instructorId,
        expect.any(Date),
      );
    });

    it('should add a date without time slots', async () => {
      const instructorId = 1;
      const dto = {
        date: '2025-10-25',
      };

      const mockWeek = {
        week_id: 1,
        instructor_id: 1,
        week_start_date: new Date('2025-10-20'),
        created_at: new Date(),
      };

      mockRepository.findOrCreateWeek.mockResolvedValue(mockWeek);

      const result = await service.addAvailabilityDate(instructorId, dto);

      expect(result.date).toBe('2025-10-25');
      expect(result.timeSlots).toHaveLength(0);
    });
  });

  describe('addTimeSlot', () => {
    it('should add a time slot successfully', async () => {
      const instructorId = 1;
      const dateStr = '2025-10-25';
      const dto = {
        startTime: '09:00',
        endTime: '10:00',
        meetingType: 'online' as const,
        capacity: 10,
      };

      const mockWeek = {
        week_id: 1,
        instructor_id: 1,
        week_start_date: new Date('2025-10-20'),
        created_at: new Date(),
      };

      const mockSlot = {
        slot_id: 1,
        week_id: 1,
        day_of_week: 6,
        start_time_local: new Date('1970-01-01T09:00:00'),
        end_time_local: new Date('1970-01-01T10:00:00'),
        period_label: null,
        capacity: 10,
        is_open: true,
        note: null,
        auto_accept: false,
        meeting_type: 'online',
      };

      mockRepository.findOrCreateWeek.mockResolvedValue(mockWeek);
      mockRepository.checkTimeSlotOverlap.mockResolvedValue(false);
      mockRepository.createTimeSlot.mockResolvedValue(mockSlot);

      const result = await service.addTimeSlot(instructorId, dateStr, dto);

      expect(result.slotId).toBe(1);
      expect(result.capacity).toBe(10);
      expect(repository.createTimeSlot).toHaveBeenCalled();
    });

    it('should throw BadRequestException if start time >= end time', async () => {
      const instructorId = 1;
      const dateStr = '2025-10-25';
      const dto = {
        startTime: '10:00',
        endTime: '09:00',
        meetingType: 'online' as const,
        capacity: 10,
      };

      await expect(service.addTimeSlot(instructorId, dateStr, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if time slot overlaps', async () => {
      const instructorId = 1;
      const dateStr = '2025-10-25';
      const dto = {
        startTime: '09:00',
        endTime: '10:00',
        meetingType: 'online' as const,
        capacity: 10,
      };

      const mockWeek = {
        week_id: 1,
        instructor_id: 1,
        week_start_date: new Date('2025-10-20'),
        created_at: new Date(),
      };

      mockRepository.findOrCreateWeek.mockResolvedValue(mockWeek);
      mockRepository.checkTimeSlotOverlap.mockResolvedValue(true);

      await expect(service.addTimeSlot(instructorId, dateStr, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateTimeSlot', () => {
    it('should update a time slot successfully', async () => {
      const instructorId = 1;
      const slotId = 1;
      const dto = {
        capacity: 20,
        isOpen: false,
      };

      const mockSlot = {
        slot_id: 1,
        week_id: 1,
        day_of_week: 6,
        start_time_local: new Date('1970-01-01T09:00:00'),
        end_time_local: new Date('1970-01-01T10:00:00'),
        period_label: null,
        capacity: 10,
        is_open: true,
        note: null,
        auto_accept: false,
        meeting_type: 'online',
        week: {
          instructor_id: 1,
        },
      };

      const updatedSlot = {
        ...mockSlot,
        capacity: 20,
        is_open: false,
      };

      mockRepository.getSlotById.mockResolvedValue(mockSlot);
      mockRepository.updateTimeSlot.mockResolvedValue(updatedSlot);

      const result = await service.updateTimeSlot(instructorId, slotId, dto);

      expect(result.capacity).toBe(20);
      expect(result.isOpen).toBe(false);
    });

    it('should throw NotFoundException if slot not found', async () => {
      const instructorId = 1;
      const slotId = 999;
      const dto = { capacity: 20 };

      mockRepository.getSlotById.mockResolvedValue(null);

      await expect(service.updateTimeSlot(instructorId, slotId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if slot belongs to different instructor', async () => {
      const instructorId = 1;
      const slotId = 1;
      const dto = { capacity: 20 };

      const mockSlot = {
        slot_id: 1,
        week_id: 1,
        week: {
          instructor_id: 2, // Different instructor
        },
      };

      mockRepository.getSlotById.mockResolvedValue(mockSlot);

      await expect(service.updateTimeSlot(instructorId, slotId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteTimeSlot', () => {
    it('should delete a time slot successfully', async () => {
      const instructorId = 1;
      const slotId = 1;

      const mockSlot = {
        slot_id: 1,
        week_id: 1,
        week: {
          instructor_id: 1,
        },
      };

      mockRepository.getSlotById.mockResolvedValue(mockSlot);
      mockRepository.deleteTimeSlot.mockResolvedValue(undefined);

      await service.deleteTimeSlot(instructorId, slotId);

      expect(repository.deleteTimeSlot).toHaveBeenCalledWith(slotId);
    });

    it('should throw NotFoundException if slot not found', async () => {
      const instructorId = 1;
      const slotId = 999;

      mockRepository.getSlotById.mockResolvedValue(null);

      await expect(service.deleteTimeSlot(instructorId, slotId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      mockRepository.getSlotsWithBookingCounts.mockResolvedValue([]);

      const result = await service.getStatistics(1);

      expect(result).toHaveProperty('totalDates');
      expect(result).toHaveProperty('totalTimeSlots');
      expect(result).toHaveProperty('totalHours');
      expect(result).toHaveProperty('upcomingDates');
    });
  });
});

