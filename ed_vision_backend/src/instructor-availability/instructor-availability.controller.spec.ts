import { Test, TestingModule } from '@nestjs/testing';
import { InstructorAvailabilityController } from './instructor-availability.controller';
import { InstructorAvailabilityService } from './instructor-availability.service';

describe('InstructorAvailabilityController', () => {
  let controller: InstructorAvailabilityController;
  let service: InstructorAvailabilityService;

  const mockService = {
    getAvailability: jest.fn(),
    getStatistics: jest.fn(),
    addAvailabilityDate: jest.fn(),
    addTimeSlot: jest.fn(),
    updateTimeSlot: jest.fn(),
    deleteTimeSlot: jest.fn(),
    deleteAvailabilityDate: jest.fn(),
    bulkCreateAvailability: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstructorAvailabilityController],
      providers: [
        {
          provide: InstructorAvailabilityService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<InstructorAvailabilityController>(
      InstructorAvailabilityController,
    );
    service = module.get<InstructorAvailabilityService>(
      InstructorAvailabilityService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('test', () => {
    it('should return test message', () => {
      const result = controller.test();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result.message).toBe('Instructor Availability API is working');
    });
  });

  describe('getAvailability', () => {
    it('should return availability data', async () => {
      const mockData = {
        availabilities: [
          {
            date: '2025-10-25',
            dayOfWeek: 6,
            weekId: 1,
            timeSlots: [],
          },
        ],
        statistics: {
          totalDates: 1,
          totalTimeSlots: 0,
          totalHours: 0,
          upcomingDates: 1,
          totalCapacity: 0,
          bookedSlots: 0,
        },
      };

      mockService.getAvailability.mockResolvedValue(mockData);

      const result = await controller.getAvailability(1);
      expect(result).toEqual(mockData);
      expect(service.getAvailability).toHaveBeenCalledWith(
        1,
        undefined,
        undefined,
      );
    });

    it('should pass date range parameters', async () => {
      const mockData = {
        availabilities: [],
        statistics: {
          totalDates: 0,
          totalTimeSlots: 0,
          totalHours: 0,
          upcomingDates: 0,
          totalCapacity: 0,
          bookedSlots: 0,
        },
      };

      mockService.getAvailability.mockResolvedValue(mockData);

      await controller.getAvailability(1, '2025-10-01', '2025-10-31');
      expect(service.getAvailability).toHaveBeenCalledWith(
        1,
        '2025-10-01',
        '2025-10-31',
      );
    });
  });

  describe('getStatistics', () => {
    it('should return statistics', async () => {
      const mockStats = {
        totalDates: 5,
        totalTimeSlots: 12,
        totalHours: 15.5,
        upcomingDates: 4,
        totalCapacity: 120,
        bookedSlots: 25,
      };

      mockService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics(1);
      expect(result).toEqual(mockStats);
      expect(service.getStatistics).toHaveBeenCalledWith(1);
    });
  });

  describe('addAvailabilityDate', () => {
    it('should add a new availability date', async () => {
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

      const mockResponse = {
        date: '2025-10-25',
        dayOfWeek: 6,
        weekId: 1,
        timeSlots: [
          {
            slotId: 1,
            startTime: '09:00',
            endTime: '10:00',
            meetingType: 'online',
            capacity: 10,
            isOpen: true,
            autoAccept: false,
            bookedCount: 0,
          },
        ],
      };

      mockService.addAvailabilityDate.mockResolvedValue(mockResponse);

      const result = await controller.addAvailabilityDate(1, dto);
      expect(result).toEqual(mockResponse);
      expect(service.addAvailabilityDate).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('addTimeSlot', () => {
    it('should add a time slot to a date', async () => {
      const dto = {
        startTime: '14:00',
        endTime: '15:00',
        meetingType: 'both' as const,
        capacity: 15,
      };

      const mockResponse = {
        slotId: 2,
        startTime: '14:00',
        endTime: '15:00',
        meetingType: 'both',
        capacity: 15,
        isOpen: true,
        autoAccept: false,
        bookedCount: 0,
      };

      mockService.addTimeSlot.mockResolvedValue(mockResponse);

      const result = await controller.addTimeSlot(1, '2025-10-25', dto);
      expect(result).toEqual(mockResponse);
      expect(service.addTimeSlot).toHaveBeenCalledWith(1, '2025-10-25', dto);
    });
  });

  describe('updateTimeSlot', () => {
    it('should update a time slot', async () => {
      const dto = {
        capacity: 20,
        isOpen: true,
      };

      const mockResponse = {
        slotId: 1,
        startTime: '09:00',
        endTime: '10:00',
        meetingType: 'online',
        capacity: 20,
        isOpen: true,
        autoAccept: false,
      };

      mockService.updateTimeSlot.mockResolvedValue(mockResponse);

      const result = await controller.updateTimeSlot(1, 1, dto);
      expect(result).toEqual(mockResponse);
      expect(service.updateTimeSlot).toHaveBeenCalledWith(1, 1, dto);
    });
  });

  describe('deleteTimeSlot', () => {
    it('should delete a time slot', async () => {
      mockService.deleteTimeSlot.mockResolvedValue(undefined);

      await controller.deleteTimeSlot(1, 1);
      expect(service.deleteTimeSlot).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('deleteAvailabilityDate', () => {
    it('should delete all slots for a date', async () => {
      mockService.deleteAvailabilityDate.mockResolvedValue(undefined);

      await controller.deleteAvailabilityDate(1, '2025-10-25');
      expect(service.deleteAvailabilityDate).toHaveBeenCalledWith(
        1,
        '2025-10-25',
      );
    });
  });

  describe('bulkCreateAvailability', () => {
    it('should bulk create availability dates', async () => {
      const dto = {
        availabilities: [
          {
            date: '2025-10-25',
            timeSlots: [
              {
                startTime: '09:00',
                endTime: '10:00',
                meetingType: 'online' as const,
                capacity: 10,
              },
            ],
          },
        ],
      };

      const mockResponse = [
        {
          date: '2025-10-25',
          dayOfWeek: 6,
          weekId: 1,
          timeSlots: [
            {
              slotId: 1,
              startTime: '09:00',
              endTime: '10:00',
              meetingType: 'online',
              capacity: 10,
              isOpen: true,
              autoAccept: false,
              bookedCount: 0,
            },
          ],
        },
      ];

      mockService.bulkCreateAvailability.mockResolvedValue(mockResponse);

      const result = await controller.bulkCreateAvailability(1, dto);
      expect(result).toEqual(mockResponse);
      expect(service.bulkCreateAvailability).toHaveBeenCalledWith(
        1,
        dto.availabilities,
      );
    });
  });
});
