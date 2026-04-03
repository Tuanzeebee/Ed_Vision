import { Test, TestingModule } from '@nestjs/testing';
import { MeetingLogsController } from './meeting-logs.controller';
import { MeetingLogsService } from './meeting-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MeetingLogsController', () => {
  let controller: MeetingLogsController;
  let service: MeetingLogsService;

  // Generate non-hardcoded IDs for tests to avoid static id collisions
  let _idCounter = 1000;
  const genId = () => ++_idCounter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingLogsController],
      providers: [MeetingLogsService, PrismaService],
    }).compile();

    controller = module.get<MeetingLogsController>(MeetingLogsController);
    service = module.get<MeetingLogsService>(MeetingLogsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getInstructorInfo', () => {
    it('should return instructor info', async () => {
      const instructorId = genId();
      const accountId = genId();
      const mockInstructorInfo = {
        instructor_id: instructorId,
        account_id: accountId,
        employee_code: 'GV001',
        full_name: 'TS. Nguyễn Văn A',
        academic_title: 'Tiến sĩ',
        position: 'Giảng viên chính',
        department: {
          id: 1,
          name: 'Công nghệ thông tin',
          code: 'CNTT',
        },
        email: 'nguyenvana@duytan.edu.vn',
      };

      const getInstructorInfoSpy = jest
        .spyOn(service, 'getInstructorInfo')
        .mockResolvedValue(mockInstructorInfo);

      const result = await controller.getInstructorInfo(accountId);
      expect(result).toEqual(mockInstructorInfo);
      expect(getInstructorInfoSpy).toHaveBeenCalledWith(accountId);
    });
  });

  describe('getStudentsByTimeSlot', () => {
    it('should return students for a specific time slot', async () => {
      const slotId = genId();
      const studentId = genId();
      const accountId = genId();

      const mockResponse = {
        slot_id: slotId,
        date: '2025-11-25',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:00',
        period_label: 'Tiết 1-2',
        meeting_location: 'Phòng A101',
        meeting_link: '',
        meeting_type: 'offline',
        students: [
          {
            id: studentId,
            student_id: studentId,
            account_id: accountId,
            student_code: 'SV001',
            name: 'Nguyễn Văn B',
            class_name: 'K28 CMU TPM 1',
            email: 'sv001@duytan.edu.vn',
            appointment_id: 456,
            meeting_purpose: 'Tư vấn học tập',
            status: 'confirmed',
            meeting_type: 'offline',
          },
        ],
        total_students: 1,
        capacity: 10,
      };

      const getStudentsByTimeSlotSpy = jest
        .spyOn(service, 'getStudentsByTimeSlot')
        .mockResolvedValue(mockResponse);

      const result = await controller.getStudentsByTimeSlot(
        1,
        '2025-11-25',
        '09:00',
        '10:00',
      );
      expect(result).toEqual(mockResponse);
      expect(getStudentsByTimeSlotSpy).toHaveBeenCalledWith(
        1,
        '2025-11-25',
        '09:00',
        '10:00',
      );
    });
  });

  describe('createMeetingLog', () => {
    it('should create a meeting log', async () => {
      const createInstructorId = genId();
      const createSlotId = genId();
      const studentIds = [genId(), genId(), genId()];

      const createDto = {
        instructor_id: createInstructorId,
        slot_id: createSlotId,
        date: '2025-11-25',
        start_time: '09:00',
        end_time: '10:00',
        content: '<html>Test content</html>',
        student_ids: studentIds,
        location: 'Phòng A101',
      };

      const mockResponse = {
        id: genId(),
        ...createDto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const createMeetingLogSpy = jest
        .spyOn(service, 'createMeetingLog')
        .mockReturnValue(mockResponse);

      const result = controller.createMeetingLog(createDto);
      expect(result).toEqual(mockResponse);
      expect(createMeetingLogSpy).toHaveBeenCalledWith(createDto);
    });
  });
});
