import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  access,
  mkdir,
  readFile,
  writeFile,
  constants as fsConstants,
} from 'fs/promises';
import { basename, extname, join } from 'path';
import type { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
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
  toeic: { '350-495': 15, '500-599': 15, '600-699': 15, '700-799': 15, '800+': 15 },
  'mos-word': { associate: 12, expert: 10 },
  'mos-excel': { associate: 12, expert: 10 },
  'mos-powerpoint': { associate: 10 },
};

function getTotalTopics(certType: string, band: string): number {
  return BAND_TOPIC_COUNTS[certType]?.[band] ?? 10;
}

@Injectable()
export class CertificateEnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Typed db accessor � works around VS Code nodenext/Prisma junction resolution */
  private get db(): PrismaClient {
    return this.prisma as unknown as PrismaClient;
  }

  private toDto(row: {
    id: number;
    cert_type: string;
    status: string;
    learning_status?: string;
    progress_percent?: number;
    current_score?: number | null;
    target_score?: number | null;
    enrolled_at: Date;
    completed_at: Date | null;
    topicProgress: { topic_key: string }[];
  }): EnrollmentResponseDto {
    const learningTopics = row.topicProgress
      .map((t) => t.topic_key)
      .filter((topicKey) => !isToeicMetaTopic(topicKey));

    return {
      id: row.id,
      cert_type: row.cert_type,
      status: row.status as 'active' | 'completed',
      learning_status: (row.learning_status as LearningStatus) ?? 'not_started',
      progress_percent: Number(row.progress_percent ?? 0),
      current_score: row.current_score ?? null,
      target_score: row.target_score ?? null,
      enrolled_at: row.enrolled_at,
      completed_at: row.completed_at,
      completed_topics: learningTopics,
      total_topics: getTotalTopics(row.cert_type),
    };
  }

  private parseToeicPlanState(topicKeys: string[]): ToeicPlanSyncResponseDto {
    const state: ToeicPlanSyncResponseDto = {
      current_score: 300,
      target_score: 600,
      total_boost: 0,
      listening_sessions: 0,
      reading_sessions: 0,
      foundation_completed: [],
      foundation_skipped: false,
      first_guide_shown: false,
    };

    for (const key of topicKeys) {
      if (!isToeicMetaTopic(key)) continue;

      if (key.startsWith('__meta.toeic.current.')) {
        state.current_score =
          Number(key.replace('__meta.toeic.current.', '')) ||
          state.current_score;
      } else if (key.startsWith('__meta.toeic.target.')) {
        state.target_score =
          Number(key.replace('__meta.toeic.target.', '')) || state.target_score;
      } else if (key.startsWith('__meta.toeic.boost.')) {
        state.total_boost = Number(key.replace('__meta.toeic.boost.', '')) || 0;
      } else if (key.startsWith('__meta.toeic.listening.')) {
        state.listening_sessions =
          Number(key.replace('__meta.toeic.listening.', '')) || 0;
      } else if (key.startsWith('__meta.toeic.reading.')) {
        state.reading_sessions =
          Number(key.replace('__meta.toeic.reading.', '')) || 0;
      } else if (key === '__meta.toeic.foundation.skip') {
        state.foundation_skipped = true;
      } else if (key === '__meta.toeic.first_guide.shown') {
        state.first_guide_shown = true;
      } else if (key.startsWith('__meta.toeic.foundation.done.')) {
        const topic = key.replace('__meta.toeic.foundation.done.', '');
        if (topic) state.foundation_completed.push(topic);
      }
    }

    state.foundation_completed = Array.from(
      new Set(state.foundation_completed),
    );
    state.target_score = Math.max(state.current_score, state.target_score);

    return state;
  }

  private parseToeicPlanStateFromJson(
    raw: unknown,
    fallbackTopicKeys: string[] = [],
    fallbackScores?: {
      current_score?: number | null;
      target_score?: number | null;
    },
  ): ToeicPlanSyncResponseDto {
    const fromMeta = this.parseToeicPlanState(fallbackTopicKeys);
    const state = (raw ?? {}) as ToeicPlanStateRaw;
    const baseCurrentScore = Number(
      fallbackScores?.current_score ?? fromMeta.current_score ?? 300,
    );
    const baseTargetScore = Number(
      fallbackScores?.target_score ?? fromMeta.target_score ?? 600,
    );
    const resolvedCurrentScore = Number(
      state.current_score ?? baseCurrentScore,
    );
    const resolvedTargetScore = Number(state.target_score ?? baseTargetScore);

    return {
      current_score: resolvedCurrentScore,
      target_score: Number(Math.max(resolvedCurrentScore, resolvedTargetScore)),
      total_boost: Number(state.total_boost ?? fromMeta.total_boost ?? 0),
      listening_sessions: Number(
        state.listening_sessions ?? fromMeta.listening_sessions ?? 0,
      ),
      reading_sessions: Number(
        state.reading_sessions ?? fromMeta.reading_sessions ?? 0,
      ),
      foundation_completed: Array.from(
        new Set(
          Array.isArray(state.foundation_completed)
            ? state.foundation_completed.filter(
                (x): x is string => typeof x === 'string',
              )
            : fromMeta.foundation_completed,
        ),
      ),
      foundation_skipped: Boolean(
        state.foundation_skipped ?? fromMeta.foundation_skipped,
      ),
      first_guide_shown: Boolean(
        state.first_guide_shown ?? fromMeta.first_guide_shown,
      ),
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
    const row = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: certType, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });
    return row ? this.toDto(row) : null;
  }

  async getAllEnrollments(accountId: number): Promise<EnrollmentResponseDto[]> {
    const studentId = await this.getStudentId(accountId);
    const rows = await this.prisma.certificateEnrollment.findMany({
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
    const existing = await this.prisma.certificateEnrollment.findFirst({
      where: {
        student_id: studentId,
        cert_type: dto.cert_type,
        status: 'active',
      },
    });
    if (existing) {
      await this.prisma.certificateEnrollment.update({
        where: { id: existing.id },
        data: { status: 'completed', completed_at: new Date() },
      });
    }
    const created = await this.prisma.certificateEnrollment.create({
      data: (() => {
        if (dto.cert_type === 'toeic') {
          const mappedTargetScore = resolveToeicTargetScore(dto);
          return {
            student_id: studentId,
            cert_type: dto.cert_type,
            status: 'active' as const,
            learning_status: 'not_started' as const,
            progress_percent: 0,
            current_score: Math.max(10, mappedTargetScore - 120),
            target_score: mappedTargetScore,
          };
        }

        return {
          student_id: studentId,
          cert_type: dto.cert_type,
          status: 'active' as const,
          learning_status: 'not_started' as const,
          progress_percent: 0,
          target_score: getDefaultTargetScore(dto.cert_type),
        };
      })(),
      include: { topicProgress: { select: { topic_key: true } } },
    });
    return this.toDto(created);
  }

  async completeTopic(
    accountId: number,
    enrollmentId: number,
    dto: CompleteTopicDto,
  ): Promise<EnrollmentResponseDto> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { id: enrollmentId, student_id: studentId, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    if (!enrollment)
      throw new NotFoundException('Không tìm thấy enrollment đang active.');

    await this.prisma.certificateTopicProgress.upsert({
      where: {
        enrollment_id_topic_key: {
          enrollment_id: enrollmentId,
          topic_key: dto.topic_key,
        },
      },
      create: { enrollment_id: enrollmentId, topic_key: dto.topic_key },
      update: {},
    });

    const totalTopics = getTotalTopics(enrollment.cert_type);
    const alreadyCompleted = enrollment.topicProgress.some(
      (topic) => topic.topic_key === dto.topic_key,
    );
    const completedCount =
      enrollment.topicProgress.filter(
        (topic) => !isToeicMetaTopic(topic.topic_key),
      ).length + (alreadyCompleted ? 0 : 1);
    const progressPercent = Math.max(
      0,
      Math.min(
        100,
        Math.round((completedCount / Math.max(1, totalTopics)) * 100),
      ),
    );

    const now = new Date();
    if (completedCount >= totalTopics) {
      await this.prisma.certificateEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'completed',
          learning_status: 'completed',
          progress_percent: 100,
          completed_at: now,
          started_at: enrollment.started_at ?? now,
          last_activity_at: now,
        },
      });
    } else {
      await this.prisma.certificateEnrollment.update({
        where: { id: enrollmentId },
        data: {
          learning_status: 'in_progress',
          progress_percent: progressPercent,
          started_at: enrollment.started_at ?? now,
          last_activity_at: now,
          completed_at: null,
          status: 'active',
        },
      });
    }

    const updated = await this.prisma.certificateEnrollment.findUnique({
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
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { id: enrollmentId, student_id: studentId, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    if (!enrollment)
      throw new NotFoundException('Không tìm thấy enrollment đang active.');

    const updated = await this.prisma.certificateEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'completed',
        learning_status: 'completed',
        progress_percent: 100,
        completed_at: new Date(),
        started_at: enrollment.started_at ?? new Date(),
        last_activity_at: new Date(),
      },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    return this.toDto(updated);
  }
}
