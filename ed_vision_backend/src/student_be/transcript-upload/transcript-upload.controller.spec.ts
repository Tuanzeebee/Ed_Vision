import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptUploadController } from './transcript-upload.controller';
import { TranscriptUploadService } from './transcript-upload.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TranscriptUploadController', () => {
  let controller: TranscriptUploadController;
  let service: TranscriptUploadService;

  const mockPrismaService = {
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    academicTerm: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    studentCourseRecord: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptUploadController],
      providers: [
        TranscriptUploadService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<TranscriptUploadController>(TranscriptUploadController);
    service = module.get<TranscriptUploadService>(TranscriptUploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadTranscript', () => {
    it('should upload transcript successfully', async () => {
      const uploadDto = {
        records: [
          {
            student_code: 'SV001',
            year: 2023,
            semester_number: 1,
            course_code: 'IT001',
            course_name: 'Introduction to Programming',
            credits_unit: 3,
            raw_score: 8.5,
            converted_score: 'B+',
            converted_numeric_score: 3.5,
          },
        ],
      };

      mockPrismaService.student.findMany.mockResolvedValue([{ 
        student_id: 1,
        student_code: 'SV001'
      }]);
      mockPrismaService.academicTerm.findFirst.mockResolvedValue({
        term_id: 1,
        academic_year: '2023-2024',
        semester_number: 1,
      });
      mockPrismaService.course.findUnique.mockResolvedValue({
        course_id: 1,
        course_code: 'IT001',
        course_name: 'Introduction to Programming',
      });
      mockPrismaService.studentCourseRecord.upsert.mockResolvedValue({
        record_id: 1,
      });

      const result = await controller.uploadTranscript(uploadDto);

      expect(result.success).toBe(true);
      expect(result.data.successfulRecords).toBe(1);
      expect(result.data.failedRecords).toBe(0);
    });
  });

  describe('getStudentTranscript', () => {
    it('should return student transcript', async () => {
      const studentId = 1;
      
      mockPrismaService.student.findUnique.mockResolvedValue({
        student_id: 1,
        student_code: 'SV001',
        account: {
          profile: {
            full_name: 'Nguyễn Văn A',
          },
        },
        courseRecords: [],
      });

      const result = await controller.getStudentTranscript(studentId);

      expect(result.studentId).toBe(1);
      expect(result.studentCode).toBe('SV001');
    });
  });
});
