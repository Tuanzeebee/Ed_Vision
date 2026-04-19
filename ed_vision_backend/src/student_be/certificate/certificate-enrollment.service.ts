import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEnrollmentDto,
  CompleteTopicDto,
  EnrollmentResponseDto,
} from './dto/certificate.dto';

/** MOS Expert is unavailable for PowerPoint */
const MOS_EXPERT_ALLOWED = ['mos-word', 'mos-excel'];

const IELTS_ORDER = ['4.0', '5.0', '6.0', '6.5', '7.0', '7.5+'];
const TOEIC_ORDER = ['350-495', '500-599', '600-699', '700-799', '800+'];

function getBandOrder(certType: string): string[] | null {
  if (certType === 'ielts') return IELTS_ORDER;
  if (certType === 'toeic') return TOEIC_ORDER;
  return null;
}

const BAND_TOPIC_COUNTS: Record<string, Record<string, number>> = {
  ielts: { '4.0': 18, '5.0': 18, '6.0': 18, '6.5': 18, '7.0': 18, '7.5+': 18 },
  toeic: {
    '350-495': 15,
    '500-599': 15,
    '600-699': 15,
    '700-799': 15,
    '800+': 15,
  },
  'mos-word': { associate: 12, expert: 10 },
  'mos-excel': { associate: 12, expert: 10 },
  'mos-powerpoint': { associate: 10 },
};

function getTotalTopics(certType: string, band: string): number {
  return BAND_TOPIC_COUNTS[certType]?.[band] ?? 10;
}

@Injectable()
export class CertificateEnrollmentService {
  private readonly logger = new Logger(CertificateEnrollmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Typed db accessor � works around VS Code nodenext/Prisma junction resolution */
  private get db(): PrismaClient {
    return this.prisma as unknown as PrismaClient;
  }

  private toDto(row: {
    id: number;
    cert_type: string;
    target_band: string;
    status: string;
    enrolled_at: Date;
    completed_at: Date | null;
    topicProgress: { topic_key: string }[];
  }): EnrollmentResponseDto {
    return {
      id: row.id,
      cert_type: row.cert_type,
      target_band: row.target_band,
      status: row.status as 'active' | 'completed',
      enrolled_at: row.enrolled_at,
      completed_at: row.completed_at,
      completed_topics: row.topicProgress.map((t) => t.topic_key),
      total_topics: getTotalTopics(row.cert_type, row.target_band),
    };
  }

  private async getStudentId(accountId: number): Promise<number> {
    const student = await this.prisma.student.findFirst({
      where: { account_id: accountId },
      select: { student_id: true },
    });
    if (!student)
      throw new NotFoundException('Không tìm thấy thông tin sinh viên.');
    return student.student_id;
  }

  async getEnrollment(
    accountId: number,
    certType: string,
  ): Promise<EnrollmentResponseDto | null> {
    const studentId = await this.getStudentId(accountId);
    const row = await this.db.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: certType, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });
    return row ? this.toDto(row) : null;
  }

  async getAllEnrollments(accountId: number): Promise<EnrollmentResponseDto[]> {
    const studentId = await this.getStudentId(accountId);
    const rows = await this.db.certificateEnrollment.findMany({
      where: { student_id: studentId },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async createEnrollment(
    accountId: number,
    dto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    const studentId = await this.getStudentId(accountId);

    // [DEV MODE] Band progression checks bypassed - freely switch bands for testing
    const existing = await this.db.certificateEnrollment.findFirst({
      where: {
        student_id: studentId,
        cert_type: dto.cert_type,
        status: 'active',
      },
    });
    if (existing) {
      await this.db.certificateEnrollment.update({
        where: { id: existing.id },
        data: { status: 'completed', completed_at: new Date() },
      });
    }
    const created = await this.db.certificateEnrollment.create({
      data: {
        student_id: studentId,
        cert_type: dto.cert_type,
        target_band: dto.target_band,
        status: 'active',
      },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    this.logger.log(
      `Student ${studentId} enrolled in ${dto.cert_type} ${dto.target_band}`,
    );
    return this.toDto(created);
  }

  async completeTopic(
    accountId: number,
    enrollmentId: number,
    dto: CompleteTopicDto,
  ): Promise<EnrollmentResponseDto> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.db.certificateEnrollment.findFirst({
      where: { id: enrollmentId, student_id: studentId, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    if (!enrollment)
      throw new NotFoundException('Không tìm thấy enrollment đang active.');

    await this.db.certificateTopicProgress.upsert({
      where: {
        enrollment_id_topic_key: {
          enrollment_id: enrollmentId,
          topic_key: dto.topic_key,
        },
      },
      create: { enrollment_id: enrollmentId, topic_key: dto.topic_key },
      update: {},
    });

    const totalTopics = getTotalTopics(
      enrollment.cert_type,
      enrollment.target_band,
    );
    const completedCount = enrollment.topicProgress.length + 1;
    if (completedCount >= totalTopics) {
      await this.db.certificateEnrollment.update({
        where: { id: enrollmentId },
        data: { status: 'completed', completed_at: new Date() },
      });
    }

    const updated = await this.db.certificateEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    return this.toDto(updated!);
  }

  async completeBand(
    accountId: number,
    enrollmentId: number,
  ): Promise<EnrollmentResponseDto> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.db.certificateEnrollment.findFirst({
      where: { id: enrollmentId, student_id: studentId, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    if (!enrollment)
      throw new NotFoundException('Không tìm thấy enrollment đang active.');

    const updated = await this.db.certificateEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'completed', completed_at: new Date() },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    return this.toDto(updated);
  }
}
