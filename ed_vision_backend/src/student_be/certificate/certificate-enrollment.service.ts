import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { RagRetrievalService } from '../../rag/rag-retrieval.service';
import { encryptString, encryptRecord } from '../../common/crypto.util';
import {
  access,
  mkdir,
  readFile,
  writeFile,
  constants as fsConstants,
} from 'fs/promises';
import { basename, extname, join } from 'path';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenRouterService } from '../../common/services/openrouter.service';
import { QuestionPointsCalculatorService } from '../../study-room/services/question-points-calculator.service';
import { StreakTrackerService } from '../../study-room/services/streak-tracker.service';
import { getWeekStart } from '../../study-room/leaderboard.constants';
import {
  CreateEnrollmentDto,
  CompleteTopicDto,
  EnrollmentResponseDto,
  ToeicLeaderboardEntryDto,
  ToeicPlanSyncDto,
  ToeicPlanSyncResponseDto,
  ToeicRepositoryOverviewItemDto,
  ToeicRepositoryOverviewResponseDto,
  ToeicRepositoryDetailResponseDto,
  ToeicRepositorySubmitDto,
  ToeicRepositorySubmitResponseDto,
  ToeicReadingImportDto,
  ToeicReadingImportResponseDto,
  ToeicOcrImportDto,
  ToeicOcrImportResponseDto,
  ToeicAnswerKeyImportDto,
  ToeicAnswerKeyImportResponseDto,
  ToeicManualListeningCreateDto,
  ToeicManualListeningCreateResponseDto,
  ToeicExplainAnswerDto,
  ToeicExplainAnswerResponseDto,
  ToeicRepositoryPregenerateExplanationsDto,
  ToeicRepositoryPregenerateExplanationsResponseDto,
  CertificateTutorAskDto,
  CertificateTutorAskResponseDto,
} from './dto/certificate.dto';
import {
  OLLAMA_TIMEOUT_MS,
  OLLAMA_EXPLANATION_OPTIONS,
  OLLAMA_TUTOR_OPTIONS,
  buildExplanationPrompt,
  buildTutorPrompt as buildTutorPromptFromFile,
  buildTutorFallback,
  buildExplanationFallback,
} from './certificate-prompts';

const TOPIC_COUNTS_BY_CERT: Record<string, number> = {
  ielts: 18,
  toeic: 15,
  'mos-word': 12,
  'mos-excel': 12,
  'mos-powerpoint': 10,
};

const CERT_TUTOR_ALLOWED_CERT_TYPES = new Set<string>([
  'ielts',
  'toeic',
  'mos-word',
  'mos-excel',
  'mos-powerpoint',
]);

const CERT_TUTOR_PROMPT_VERSION = 'v8';

// CERT_TUTOR_SYSTEM_PROMPTS đã được chuyển sang certificate-prompts.ts (CERT_PERSONA)

function getTotalTopics(certType: string): number {
  return TOPIC_COUNTS_BY_CERT[certType] ?? 10;
}

const TOEIC_META_PREFIX = '__meta.toeic.';

function isToeicMetaTopic(topicKey: string): boolean {
  return topicKey.startsWith(TOEIC_META_PREFIX);
}

type ToeicPlanStateRaw = {
  current_score?: number;
  target_score?: number;
  total_boost?: number;
  goal_start_score?: number;
  listening_sessions?: number;
  reading_sessions?: number;
  foundation_completed?: string[];
  foundation_skipped?: boolean;
  first_guide_shown?: boolean;
  listening_baseline?: number;
  reading_baseline?: number;
  has_taken_listening_exam?: boolean;
  has_taken_reading_exam?: boolean;
};

type LearningStatus = 'not_started' | 'in_progress' | 'completed';

function toPercent(current: number, start: number, target: number): number {
  if (target <= start) return current >= target ? 100 : 0;
  if (current >= target) return 100;

  const gained = Math.max(0, current - start);
  const total = Math.max(1, target - start);
  return Math.max(0, Math.min(99, Math.round((gained / total) * 100)));
}

type EnrollmentWithTopicProgress = Prisma.CertificateEnrollmentGetPayload<{
  include: { topicProgress: { select: { topic_key: true } } };
}>;

type ToeicRepositoryWithItems = Prisma.ExamRepositoryGetPayload<{
  include: {
    items: {
      orderBy: { item_order: 'asc' };
      include: { options: { orderBy: { sort_order: 'asc' } } };
    };
  };
}>;

type ToeicRepositoryWithItemsForSubmit = Prisma.ExamRepositoryGetPayload<{
  include: {
    items: {
      include: { options: true };
    };
  };
}>;

type ToeicRepositoryItemForPregenerate = Prisma.ExamRepositoryItemGetPayload<{
  select: {
    id: true;
    item_order: true;
    title: true;
    stem: true;
    reading_passage: true;
    metadata: true;
    updated_at: true;
    options: {
      select: {
        option_key: true;
        option_text: true;
        is_correct: true;
        sort_order: true;
      };
    };
  };
}>;

type ToeicEnrollmentLeaderboardRow = Prisma.CertificateEnrollmentGetPayload<{
  include: {
    student: {
      include: {
        account: {
          include: { profile: true; dailyStreak: true };
        };
      };
    };
  };
}>;

function getDefaultTargetScore(certType: string): number | null {
  if (certType === 'toeic') return 600;
  return null;
}

function resolveToeicTargetScore(dto: CreateEnrollmentDto): number {
  const fromScore =
    typeof dto.target_score === 'number' && Number.isFinite(dto.target_score)
      ? Math.round(dto.target_score)
      : undefined;

  if (typeof fromScore === 'number') {
    return Math.max(10, Math.min(990, fromScore));
  }

  return 600;
}

function isInScoreWindow(
  min: number | null | undefined,
  max: number | null | undefined,
  score: number,
): boolean {
  if (typeof min === 'number' && score < min) return false;
  if (typeof max === 'number' && score > max) return false;
  return true;
}

function readJsonString(
  source: Prisma.JsonObject,
  key: string,
): string | undefined {
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function readJsonNumber(
  source: Prisma.JsonObject,
  key: string,
): number | undefined {
  const value = source[key];
  return typeof value === 'number' ? value : undefined;
}

type ParsedImportRow = Record<string, string>;

type ParsedImportOption = {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  rationale?: string | null;
};

type ParsedOcrQuestion = {
  questionNumber?: number | null;
  part: number | null;
  stem: string;
  context?: string | null;
  options: ParsedImportOption[];
  explanation?: string | null;
};

type ToeicOptionKey = 'A' | 'B' | 'C' | 'D';

type ParsedListeningOption = {
  option_key: string;
  option_text: string;
  is_correct?: boolean;
  rationale?: string;
};

type OllamaGenerateResponse = {
  response?: string;
  model?: string;
};

type FileCacheExplanation = {
  explanation: string;
  model: string;
  created_at: string;
};

type FileCacheTutorAnswer = {
  answer: string;
  model: string;
  created_at: string;
};

const DEFAULT_READING_REQUIRED_KEYWORDS = [
  'reading',
  'part 5',
  'part 6',
  'part 7',
];
const DEFAULT_READING_EXCLUDED_KEYWORDS = [
  'listening',
  'part 1',
  'part 2',
  'part 3',
  'part 4',
  'speaking',
  'writing',
];

const TOEIC_LOOKAHEAD_PREFETCH_COUNT = 3;
const TOEIC_LOOKAHEAD_PREFETCH_BATCH_SIZE = 2;
const PHASE1_DEFAULT_BATCH_SIZE = 2;
const PHASE1_MAX_BATCH_SIZE = 8;
const PHASE1_DEFAULT_LIMIT = 120;

@Injectable()
export class CertificateEnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionPointsCalculator: QuestionPointsCalculatorService,
    private readonly openRouter: OpenRouterService,
    private readonly ragRetrieval: RagRetrievalService,
  ) {}

  private readonly inFlightExplanationGenerations = new Map<
    string,
    Promise<string>
  >();

  private getEffectiveToeicScore(
    enrollment:
      | Pick<EnrollmentWithTopicProgress, 'current_score'>
      | null
      | undefined,
    planState: ToeicPlanSyncResponseDto,
  ): number {
    const baseScore = Number(
      enrollment?.current_score ?? planState.current_score ?? 300,
    );
    const projectedScore = Number(
      planState.current_score + planState.total_boost,
    );
    return Math.max(baseScore, projectedScore);
  }

  private async getOrCreateActiveToeicEnrollment(
    studentId: number,
  ): Promise<EnrollmentWithTopicProgress> {
    let enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });

    if (enrollment) return enrollment;

    enrollment = await this.prisma.certificateEnrollment.create({
      data: {
        student_id: studentId,
        cert_type: 'toeic',
        status: 'active',
        learning_status: 'not_started',
        progress_percent: 0,
        current_score: 300,
        target_score: 600,
      },
      include: { topicProgress: { select: { topic_key: true } } },
    });

    return enrollment;
  }

  private toDto(row: {
    id: number;
    cert_type: string;
    status: string;
    learning_status?: string;
    progress_percent?: number;
    current_score?: number | null;
    target_score?: number | null;
    exam_score?: number | null;
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
      exam_score: row.exam_score ?? null,
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
      listening_baseline: state.listening_baseline ?? Math.round(resolvedCurrentScore / 2),
      reading_baseline: state.reading_baseline ?? Math.round(resolvedCurrentScore / 2),
      has_taken_listening_exam: Boolean(state.has_taken_listening_exam ?? false),
      has_taken_reading_exam: Boolean(state.has_taken_reading_exam ?? false),
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

  private resolveOllamaBaseUrlRoot(): string {
    const configured = process.env.OLLAMA_BASE_URL?.trim();
    if (!configured) return 'http://127.0.0.1:11434';
    return configured.replace(/\/api\/generate\/?$/i, '');
  }

  private mapToeicPartTokenToNumber(token: string): number | null {
    const normalized = token
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .trim();
    if (!normalized) return null;

    if (/^[1-7]$/.test(normalized)) {
      return Number(normalized);
    }

    const romanMap: Record<string, number> = {
      I: 1,
      II: 2,
      III: 3,
      IV: 4,
      V: 5,
      VI: 6,
      VII: 7,
    };

    return romanMap[normalized] ?? null;
  }

  private detectToeicPartFromText(
    ...sources: Array<string | null | undefined>
  ): number | null {
    for (const source of sources) {
      if (!source || source.trim().length === 0) continue;
      const normalized = source.toLowerCase();

      const partMatch = normalized.match(/\bpart\s*([ivx]+|[1-7])\b/i);
      if (partMatch?.[1]) {
        const parsed = this.mapToeicPartTokenToNumber(partMatch[1]);
        if (parsed) return parsed;
      }

      const compactPartMatch = normalized.match(/\bpart([ivx]+|[1-7])\b/i);
      if (compactPartMatch?.[1]) {
        const parsed = this.mapToeicPartTokenToNumber(compactPartMatch[1]);
        if (parsed) return parsed;
      }

      const shortMatch = normalized.match(/\bp\s*([1-7])\b/i);
      if (shortMatch?.[1]) return Number(shortMatch[1]);
    }
    return null;
  }

  private readPartFromMetadata(
    metadata: Prisma.JsonValue | null,
  ): number | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const meta = metadata;
    const partRaw = meta.part;

    if (typeof partRaw === 'number' && Number.isFinite(partRaw)) {
      const rounded = Math.round(partRaw);
      return rounded >= 1 && rounded <= 7 ? rounded : null;
    }

    if (typeof partRaw === 'string') {
      const fromText = this.detectToeicPartFromText(partRaw);
      if (fromText) return fromText;
      const numeric = Number(partRaw);
      if (Number.isFinite(numeric)) {
        const rounded = Math.round(numeric);
        return rounded >= 1 && rounded <= 7 ? rounded : null;
      }
    }

    return null;
  }

  private readQuestionNumberFromMetadata(
    metadata: Prisma.JsonValue | null,
  ): number | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const meta = metadata;
    const raw = meta.question_number;

    if (typeof raw === 'number' && Number.isFinite(raw)) {
      const rounded = Math.round(raw);
      return rounded >= 1 && rounded <= 200 ? rounded : null;
    }

    if (typeof raw === 'string') {
      return this.parseQuestionNumber(raw);
    }

    return null;
  }

  private parseQuestionNumber(raw: string): number | null {
    const match = String(raw).match(/\d{1,3}/);
    if (!match?.[0]) return null;
    const parsed = Number(match[0]);
    if (!Number.isFinite(parsed)) return null;
    return parsed >= 1 && parsed <= 200 ? parsed : null;
  }

  private normalizeToeicOptionKey(raw: string): ToeicOptionKey | null {
    const normalized = String(raw).toUpperCase().trim();
    if (!normalized) return null;

    const direct = normalized.match(/^[[(]?\s*([A-D])\s*[\]).:-]?$/);
    if (direct?.[1]) {
      return direct[1] as ToeicOptionKey;
    }

    const token = normalized.match(/\b([A-D])\b/);
    if (token?.[1]) {
      return token[1] as ToeicOptionKey;
    }

    return null;
  }

  private isQuestionNumberInSkillRange(
    questionNumber: number,
    skillArea: string | null | undefined,
  ): boolean {
    if (!Number.isFinite(questionNumber) || questionNumber < 1) return false;

    if (skillArea === 'reading') {
      return questionNumber >= 100 && questionNumber <= 200;
    }

    if (skillArea === 'listening') {
      return questionNumber >= 1 && questionNumber <= 100;
    }

    return questionNumber <= 200;
  }

  private fallbackQuestionNumberByItemOrder(
    itemOrder: number,
    skillArea: string | null | undefined,
  ): number | null {
    if (!Number.isFinite(itemOrder) || itemOrder < 1) return null;

    if (skillArea === 'reading') {
      const mapped = 99 + Math.round(itemOrder);
      return mapped >= 100 && mapped <= 200 ? mapped : null;
    }

    if (skillArea === 'listening') {
      const mapped = Math.round(itemOrder);
      return mapped >= 1 && mapped <= 100 ? mapped : null;
    }

    return Math.round(itemOrder);
  }

  private detectToeicPartFromItem(
    item: ToeicRepositoryItemForPregenerate,
  ): number | null {
    return (
      this.readPartFromMetadata(item.metadata) ??
      this.detectToeicPartFromText(item.title, item.stem, item.reading_passage)
    );
  }

  private isPhase1ReadingItem(
    item: ToeicRepositoryItemForPregenerate,
  ): boolean {
    const part = this.detectToeicPartFromItem(item);
    if (typeof part === 'number') {
      return part >= 5 && part <= 7;
    }

    // Missing part metadata still allowed in Phase 1 if no clear listening signal.
    const combinedText =
      `${item.title ?? ''} ${item.stem ?? ''} ${item.reading_passage ?? ''}`
        .toLowerCase()
        .trim();

    if (
      combinedText.includes('listening') ||
      /\bpart\s*[1-4]\b/.test(combinedText)
    ) {
      return false;
    }

    return true;
  }

  private splitIntoRagChunks(
    text: string,
    chunkSize = 420,
    overlap = 80,
  ): string[] {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return [];
    if (normalized.length <= chunkSize) return [normalized];

    const chunks: string[] = [];
    let cursor = 0;

    while (cursor < normalized.length) {
      const end = Math.min(normalized.length, cursor + chunkSize);
      const chunk = normalized.slice(cursor, end).trim();
      if (chunk.length > 0) chunks.push(chunk);

      if (end >= normalized.length) break;
      cursor = Math.max(0, end - overlap);
    }

    return chunks;
  }

  private tokenizeForSimilarity(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2),
    );
  }

  private scoreLexicalSimilarity(
    chunk: string,
    queryTokens: Set<string>,
  ): number {
    if (queryTokens.size === 0) return 0;
    const chunkTokens = this.tokenizeForSimilarity(chunk);
    if (chunkTokens.size === 0) return 0;

    let overlap = 0;
    for (const token of queryTokens) {
      if (chunkTokens.has(token)) overlap += 1;
    }

    return overlap / Math.max(1, Math.sqrt(chunkTokens.size));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA <= 0 || normB <= 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async rankChunksByRelevance(
    chunks: string[],
    query: string,
  ): Promise<string[]> {
    if (chunks.length <= 1) return chunks;

    const queryTokens = this.tokenizeForSimilarity(query);
    const lexicalScores = chunks.map((chunk) =>
      this.scoreLexicalSimilarity(chunk, queryTokens),
    );

    const embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL?.trim();
    if (!embeddingModel) {
      return chunks
        .map((chunk, idx) => ({ chunk, score: lexicalScores[idx] }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.chunk);
    }

    try {
      const embeddings = new OllamaEmbeddings({
        model: embeddingModel,
        baseUrl: this.resolveOllamaBaseUrlRoot(),
      });

      const [queryVector, chunkVectors] = await Promise.all([
        embeddings.embedQuery(query),
        embeddings.embedDocuments(chunks),
      ]);

      return chunks
        .map((chunk, idx) => {
          const cosine = this.cosineSimilarity(queryVector, chunkVectors[idx]);
          const lexical = lexicalScores[idx] ?? 0;
          const score = cosine * 0.7 + lexical * 0.3;
          return { chunk, score };
        })
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.chunk);
    } catch {
      return chunks
        .map((chunk, idx) => ({ chunk, score: lexicalScores[idx] }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.chunk);
    }
  }

  private async buildRagContextForItem(
    item: ToeicRepositoryItemForPregenerate,
  ): Promise<string> {
    const correctOption = item.options.find((option) => option.is_correct);
    const optionText = item.options
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((option) => `${option.option_key}. ${option.option_text}`)
      .join('\n');

    const chunks: string[] = [];
    if (item.reading_passage?.trim()) {
      const passageChunks = this.splitIntoRagChunks(
        item.reading_passage,
        460,
        90,
      ).map((chunk, index) => `Passage đoạn ${index + 1}: ${chunk}`);
      chunks.push(...passageChunks);
    }

    chunks.push(`Question: ${item.stem}`);
    chunks.push(`Options:\n${optionText}`);

    // No explanation field available

    const query = [
      item.title ?? '',
      item.stem,
      correctOption?.option_text ?? '',
    ]
      .filter((value) => value.trim().length > 0)
      .join(' ')
      .trim();

    const ranked = await this.rankChunksByRelevance(chunks, query);
    return ranked.slice(0, 4).join('\n\n');
  }

  private extractLangChainContent(content: unknown): string {
    if (typeof content === 'string') return content.trim();

    if (Array.isArray(content)) {
      const parts = content
        .map((part) => {
          if (typeof part === 'string') return part.trim();
          if (part && typeof part === 'object' && 'text' in part) {
            const text = (part as { text?: unknown }).text;
            return typeof text === 'string' ? text.trim() : '';
          }
          return '';
        })
        .filter((part) => part.length > 0);

      return parts.join('\n').trim();
    }

    return '';
  }

  private async generatePhase1ExplanationWithLangChain(
    item: ToeicRepositoryItemForPregenerate,
    model: string,
  ): Promise<string> {
    const correctOption = item.options.find((option) => option.is_correct);
    if (!correctOption) {
      throw new BadRequestException('Câu hỏi thiếu đáp án đúng.');
    }

    const options = item.options
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((option) => `${option.option_key}. ${option.option_text}`)
      .join('\n');

    const ragContext = await this.buildRagContextForItem(item);

    const template = PromptTemplate.fromTemplate(
      [
        'Bạn là gia sư TOEIC Reading cho Part 5-7. Trả lời bằng tiếng Việt.',
        'Nhiệm vụ: tạo lời giải NGẮN GỌN, chính xác, không dùng JSON.',
        'BẮT BUỘC FORMAT (mỗi mục một đoạn riêng):',
        'Đáp án đúng: ...',
        'A: ...',
        'B: ...',
        'C: ...',
        'D: ...',
        'Không tiết lộ mẹo mơ hồ, phải chỉ ra bằng chứng cụ thể từ câu/passage.',
        '',
        'Ngữ cảnh đã chọn bằng RAG:',
        '{rag_context}',
        '',
        'Câu hỏi: {stem}',
        'Các lựa chọn:',
        '{options}',
        'Đáp án đúng: {correct_key}. {correct_text}',
        '{base_hint}',
      ].join('\n'),
    );

    const prompt = await template.format({
      rag_context: ragContext,
      stem: item.stem,
      options,
      correct_key: correctOption.option_key,
      correct_text: correctOption.option_text,
      base_hint: 'Gợi ý bổ sung: (không có)',
    });

    const llm = new ChatOllama({
      model,
      baseUrl: this.resolveOllamaBaseUrlRoot(),
      temperature: OLLAMA_EXPLANATION_OPTIONS.temperature,
      numPredict: OLLAMA_EXPLANATION_OPTIONS.num_predict,
      numCtx: OLLAMA_EXPLANATION_OPTIONS.num_ctx,
      topP: OLLAMA_EXPLANATION_OPTIONS.top_p,
      repeatPenalty: OLLAMA_EXPLANATION_OPTIONS.repeat_penalty,
    });

    const message = await llm.invoke(prompt);
    const raw = this.extractLangChainContent(message.content);

    if (!raw || raw.length < 24) {
      throw new BadRequestException(
        'LangChain/Ollama không trả lời đủ nội dung.',
      );
    }

    const normalized = this.normalizeExplanationForDisplay(raw);
    if (normalized.length >= 40) {
      return normalized;
    }

    // Fallback hardening: dùng prompt cũ nếu output quá ngắn.
    const fallbackPrompt = this.buildFullExplanationPrompt({
      stem: item.stem,
      reading_passage: item.reading_passage,
      options: item.options.map((option) => ({
        option_key: option.option_key,
        option_text: option.option_text,
        is_correct: option.is_correct,
      })),
    });

    const fallbackRaw = await this.callOllamaExplanation(fallbackPrompt, model);
    return this.normalizeExplanationForDisplay(fallbackRaw);
  }

  async preGenerateToeicReadingExplanations(
    accountId: number,
    slug: string,
    dto: ToeicRepositoryPregenerateExplanationsDto,
  ): Promise<ToeicRepositoryPregenerateExplanationsResponseDto> {
    await this.getStudentId(accountId);

    const repository = await this.prisma.examRepository.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        cert_type: true,
        skill_area: true,
        items: {
          orderBy: { item_order: 'asc' },
          select: {
            id: true,
            item_order: true,
            title: true,
            stem: true,
            reading_passage: true,
            metadata: true,
            updated_at: true,
            options: {
              orderBy: { sort_order: 'asc' },
              select: {
                option_key: true,
                option_text: true,
                is_correct: true,
                sort_order: true,
              },
            },
          },
        },
      },
    });

    if (!repository || repository.cert_type !== 'toeic') {
      throw new NotFoundException('Không tìm thấy repository TOEIC.');
    }

    if (
      repository.skill_area &&
      repository.skill_area !== 'reading' &&
      repository.skill_area !== 'grammar'
    ) {
      throw new BadRequestException(
        'Phase 1 hiện chỉ hỗ trợ pre-generate cho repository TOEIC Reading (Part 5-7).',
      );
    }

    const forceRegenerate = dto.force_regenerate === true;
    const safeLimit = Math.max(
      1,
      Math.min(500, Math.round(dto.limit ?? PHASE1_DEFAULT_LIMIT)),
    );
    const safeBatchSize = Math.max(
      1,
      Math.min(
        PHASE1_MAX_BATCH_SIZE,
        Math.round(dto.batch_size ?? PHASE1_DEFAULT_BATCH_SIZE),
      ),
    );
    const model = this.resolveOllamaModel('toeic');

    const phase1Eligible = repository.items.filter((item) => {
      const hasCorrect = item.options.some((option) => option.is_correct);
      return hasCorrect && this.isPhase1ReadingItem(item);
    });

    const queued = phase1Eligible
      .filter((item) => {
        if (forceRegenerate) return true;
        return true; // Force regenerate always or skip depending on logic since no ai_explanation exists
      })
      .slice(0, safeLimit);

    let generatedCount = 0;
    let failedCount = 0;
    const failedIds: number[] = [];

    for (let i = 0; i < queued.length; i += safeBatchSize) {
      const batch = queued.slice(i, i + safeBatchSize);
      await Promise.all(
        batch.map(async (item) => {
          try {
            const explanation =
              await this.generatePhase1ExplanationWithLangChain(item, model);

            const cacheKey = this.buildItemLevelCacheKey(
              item.id,
              item.updated_at,
              repository.slug,
              model,
            );
            const cachePath = this.buildExplanationCachePath(cacheKey);
            await this.persistGeneratedExplanation(
              item.id,
              explanation,
              cachePath,
              model,
            );
            generatedCount += 1;
          } catch {
            failedCount += 1;
            failedIds.push(item.id);
          }
        }),
      );
    }

    const skippedCount = Math.max(0, phase1Eligible.length - queued.length);

    return {
      repository_id: repository.id,
      slug: repository.slug,
      model,
      total_items: phase1Eligible.length,
      queued_items: queued.length,
      generated_count: generatedCount,
      skipped_count: skippedCount,
      failed_count: failedCount,
      sample_failed_item_ids: failedIds.slice(0, 20),
    };
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

  async getToeicPlanState(
    accountId: number,
  ): Promise<ToeicPlanSyncResponseDto | null> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });

    if (!enrollment) return null;
    const keys = enrollment.topicProgress.map((t) => t.topic_key);
    const fallbackScores = {
      current_score: enrollment.current_score,
      target_score: enrollment.target_score,
    };
    return this.parseToeicPlanStateFromJson(
      enrollment.toeic_plan_state,
      keys,
      fallbackScores,
    );
  }

  async saveToeicPlanState(
    accountId: number,
    dto: ToeicPlanSyncDto,
  ): Promise<ToeicPlanSyncResponseDto> {
    const studentId = await this.getStudentId(accountId);
    let enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });

    if (!enrollment) {
      const currentScore = Math.max(10, Math.round(dto.current_score ?? 300));
      const targetScore = Math.max(
        currentScore,
        Math.round(dto.target_score ?? 600),
      );

      enrollment = await this.prisma.certificateEnrollment.create({
        data: {
          student_id: studentId,
          cert_type: 'toeic',
          status: 'active',
          learning_status: 'not_started',
          progress_percent: 0,
          current_score: currentScore,
          target_score: targetScore,
        },
        include: { topicProgress: { select: { topic_key: true } } },
      });
    }

    const existingState = this.parseToeicPlanStateFromJson(
      enrollment.toeic_plan_state,
      (enrollment.topicProgress ?? []).map((t) => t.topic_key),
      {
        current_score: enrollment.current_score,
        target_score: enrollment.target_score,
      },
    );

    const currentScore = Math.max(
      10,
      Math.round(dto.current_score ?? existingState.current_score ?? 300),
    );
    const targetScore = Math.max(
      currentScore,
      Math.round(dto.target_score ?? existingState.target_score ?? 600),
    );

    const previousTarget = Number(
      enrollment.target_score ?? existingState.target_score ?? targetScore,
    );
    const targetChanged = targetScore !== previousTarget;

    const guideCompleted =
      dto.first_guide_shown === undefined
        ? Boolean(existingState.first_guide_shown)
        : Boolean(dto.first_guide_shown);

    const rawExistingState =
      (enrollment.toeic_plan_state as ToeicPlanStateRaw | null) ?? null;

    const now = new Date();
    const goalStartScore = targetChanged
      ? currentScore
      : Number(
          rawExistingState?.goal_start_score ??
            enrollment.current_score ??
            currentScore,
        );

    const nextState: ToeicPlanStateRaw = {
      current_score: currentScore,
      target_score: targetScore,
      total_boost: Math.max(
        0,
        Math.round(dto.total_boost ?? existingState.total_boost ?? 0),
      ),
      goal_start_score: goalStartScore,
      listening_sessions: Math.max(
        0,
        Math.round(
          dto.listening_sessions ?? existingState.listening_sessions ?? 0,
        ),
      ),
      reading_sessions: Math.max(
        0,
        Math.round(dto.reading_sessions ?? existingState.reading_sessions ?? 0),
      ),
      foundation_completed: Array.isArray(dto.foundation_completed)
        ? dto.foundation_completed.filter(
            (x): x is string => typeof x === 'string' && x.length > 0,
          )
        : existingState.foundation_completed,
      foundation_skipped: Boolean(
        dto.foundation_skipped ?? existingState.foundation_skipped,
      ),
      first_guide_shown: guideCompleted,
      listening_baseline: dto.listening_baseline !== undefined ? dto.listening_baseline : existingState.listening_baseline,
      reading_baseline: dto.reading_baseline !== undefined ? dto.reading_baseline : existingState.reading_baseline,
      has_taken_listening_exam: dto.has_taken_listening_exam !== undefined ? dto.has_taken_listening_exam : existingState.has_taken_listening_exam,
      has_taken_reading_exam: dto.has_taken_reading_exam !== undefined ? dto.has_taken_reading_exam : existingState.has_taken_reading_exam,
    };

    const hasActivity =
      dto.has_activity === true ||
      Number(nextState.total_boost ?? 0) >
        Number(existingState.total_boost ?? 0) ||
      Number(nextState.listening_sessions ?? 0) >
        Number(existingState.listening_sessions ?? 0) ||
      Number(nextState.reading_sessions ?? 0) >
        Number(existingState.reading_sessions ?? 0);
    const progressPercent = dto.progress_percent !== undefined
      ? Math.max(0, Math.min(100, Math.round(dto.progress_percent)))
      : toPercent(
          currentScore,
          goalStartScore,
          targetScore,
        );

    let learningStatus =
      (enrollment.learning_status as LearningStatus | undefined) ??
      'not_started';
    if (targetChanged) {
      learningStatus =
        currentScore >= targetScore ? 'completed' : 'not_started';
    } else if (currentScore >= targetScore) {
      learningStatus = 'completed';
    } else if (learningStatus === 'not_started' && hasActivity) {
      learningStatus = 'in_progress';
    } else if (learningStatus !== 'completed' && hasActivity) {
      learningStatus = 'in_progress';
    }

    const updated = await this.prisma.certificateEnrollment.update({
      where: { id: enrollment.id },
      data: {
        toeic_plan_state: nextState,
        current_score: currentScore,
        target_score: targetScore,
        progress_percent: progressPercent,
        learning_status: learningStatus,
        started_at:
          learningStatus === 'in_progress' || learningStatus === 'completed'
            ? (enrollment.started_at ?? now)
            : null,
        last_activity_at: hasActivity ? now : enrollment.last_activity_at,
        status: 'active',
        completed_at: learningStatus === 'completed' ? now : null,
      },
      include: { topicProgress: { select: { topic_key: true } } },
    });

    return this.parseToeicPlanStateFromJson(
      updated.toeic_plan_state,
      (updated.topicProgress ?? []).map((t) => t.topic_key),
      {
        current_score: updated.current_score,
        target_score: updated.target_score,
      },
    );
  }

  async resetToeicProgress(accountId: number): Promise<{ success: boolean }> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
    });

    if (!enrollment) {
      throw new NotFoundException('Không tìm thấy enrollment đang hoạt động.');
    }

    // Preserve the first_guide_shown state if it was already completed
    let preservePlanState: any = Prisma.DbNull;
    if (enrollment.toeic_plan_state) {
      const existing = enrollment.toeic_plan_state as any;
      if (existing.first_guide_shown) {
        preservePlanState = {
          first_guide_shown: true,
        };
      }
    }

    await this.prisma.$transaction([
      this.prisma.toeicPracticePartSession.deleteMany({
        where: { enrollment_id: enrollment.id },
      }),
      this.prisma.certificateTopicProgress.deleteMany({
        where: { enrollment_id: enrollment.id },
      }),
      this.prisma.certificateEnrollment.update({
        where: { id: enrollment.id },
        data: {
          reserve_points: 0,
          toeic_plan_state: preservePlanState,
          progress_percent: 0,
          learning_status: 'not_started',
          started_at: null,
          last_activity_at: null,
        },
      }),
    ]);

    return { success: true };
  }

  /**
   * GET /student/certificate/me/scores
   *
   * Returns all score types for the authenticated student:
   * - current_score (Điểm Gốc): from diagnostic test
   * - reserve_points (Điểm Ôn Tập): accumulated from practice questions
   * - target_score: student's goal
   * - exam_score: latest exam-simulation score
   * - total_exp: cumulative EXP from practice questions (StudyStat.total_minutes)
   * - weekly_exp: EXP earned this week (from Redis)
   * - exam_simulation_unlocked: whether exam-simulation is available
   * - progress_percent: (reserve_points / target_score) * 100
   * - remaining_points: points still needed to unlock exam-simulation
   */
  async getPersonalScores(accountId: number): Promise<{
    current_score: number | null;
    reserve_points: number;
    target_score: number | null;
    exam_score: number | null;
    total_exp: number;
    weekly_exp: number;
    exam_simulation_unlocked: boolean;
    progress_percent: number;
    remaining_points: number | null;
  }> {
    // Fetch enrollment and study stats in parallel
    const [enrollment, studyStat, weeklyExp] = await Promise.all([
      this.prisma.certificateEnrollment.findFirst({
        where: {
          student: { account_id: accountId },
          cert_type: 'toeic',
          status: 'active',
        },
        select: {
          current_score: true,
          reserve_points: true,
          target_score: true,
          exam_score: true,
        },
      }),
      this.prisma.studyStat.findUnique({
        where: { account_id: accountId },
        select: { total_minutes: true },
      }),
      this.questionPointsCalculator.getWeeklyPoints(accountId, getWeekStart()),
    ]);

    const reservePoints = Number(enrollment?.reserve_points ?? 0);
    const targetScore = enrollment?.target_score ?? null;
    const totalExp = studyStat?.total_minutes ?? 0;

    // Calculate derived fields
    const examSimulationUnlocked =
      targetScore !== null && reservePoints >= targetScore;

    const progressPercent =
      targetScore && targetScore > 0
        ? Math.min(100, Math.round((reservePoints / targetScore) * 100))
        : 0;

    const remainingPoints =
      targetScore !== null ? Math.max(0, targetScore - reservePoints) : null;

    return {
      current_score: enrollment?.current_score ?? null,
      reserve_points: reservePoints,
      target_score: targetScore,
      exam_score: enrollment?.exam_score ?? null,
      total_exp: totalExp,
      weekly_exp: weeklyExp,
      exam_simulation_unlocked: examSimulationUnlocked,
      progress_percent: progressPercent,
      remaining_points: remainingPoints,
    };
  }

  async getToeicLeaderboard(
    accountId: number,
    limit: number,
  ): Promise<ToeicLeaderboardEntryDto[]> {
    const studentId = await this.getStudentId(accountId);
    const safeLimit = Math.max(1, Math.min(30, Math.round(limit || 10)));

    const rows = await this.prisma.certificateEnrollment.findMany({
      where: { cert_type: 'toeic', status: 'active' },
      include: {
        student: {
          include: {
            account: {
              include: { profile: true, dailyStreak: true },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: safeLimit,
    });

    const now = new Date();

    return rows
      .map((row: ToeicEnrollmentLeaderboardRow) => {
        const plan = this.parseToeicPlanStateFromJson(
          row.toeic_plan_state,
          [],
          {
            current_score: row.current_score,
            target_score: row.target_score,
          },
        );
        const score = Math.max(
          10,
          Math.min(990, Math.round(plan.current_score + plan.total_boost)),
        );

        const name =
          row.student?.account?.profile?.full_name ||
          row.student?.student_code ||
          `Student ${row.student_id}`;

        const dailyStreak = row.student?.account?.dailyStreak ?? null;
        const streak = StreakTrackerService.computeEffectiveCurrentStreak(
          dailyStreak?.last_study_date ?? null,
          dailyStreak?.current_streak ?? 0,
          now,
        );

        return {
          account_id: Number(row.student?.account_id ?? 0),
          name: String(name),
          score,
          streak,
          isCurrentUser: Number(row.student_id) === Number(studentId),
        } satisfies ToeicLeaderboardEntryDto;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit);
  }

  private toSafeSlug(raw: string): string {
    const normalized = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (normalized.length > 0) return normalized;
    return `toeic-repo-${Date.now()}`;
  }

  private normalizeImportKey(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private normalizeImportRow(row: Record<string, unknown>): ParsedImportRow {
    const normalized: ParsedImportRow = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = this.normalizeImportKey(String(key));
      if (!normalizedKey) continue;

      if (typeof value === 'string') {
        normalized[normalizedKey] = value.trim();
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        normalized[normalizedKey] = String(value).trim();
      } else {
        normalized[normalizedKey] = '';
      }
    }
    return normalized;
  }

  private async parseImportRowsFromFile(
    file: Express.Multer.File,
  ): Promise<ParsedImportRow[]> {
    if (!file?.path) {
      throw new BadRequestException('Không tìm thấy file import.');
    }

    const extension = extname(file.originalname || file.path).toLowerCase();
    if (extension === '.json') {
      const raw = await readFile(file.path, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      const rows = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && 'rows' in parsed
          ? (parsed as { rows: unknown }).rows
          : [];

      if (!Array.isArray(rows)) {
        throw new BadRequestException(
          'File JSON không đúng định dạng mảng dòng.',
        );
      }

      return rows
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item) => this.normalizeImportRow(item));
    }

    const workbook = XLSX.readFile(file.path);
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException('File import không có worksheet.');
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    return rows.map((row) => this.normalizeImportRow(row));
  }

  private parseKeywordList(
    source: string | undefined,
    fallback: string[],
  ): string[] {
    if (!source || source.trim().length === 0) {
      return fallback;
    }

    return source
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
  }

  private rowValue(row: ParsedImportRow, aliases: string[]): string {
    for (const alias of aliases) {
      const value = row[this.normalizeImportKey(alias)];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  }

  private sectionMatchesReading(
    sectionText: string,
    requiredKeywords: string[],
    excludedKeywords: string[],
    strictFilter: boolean,
  ): boolean {
    const normalizedSection = sectionText.trim().toLowerCase();
    if (normalizedSection.length === 0) {
      return !strictFilter;
    }

    for (const keyword of excludedKeywords) {
      if (normalizedSection.includes(keyword)) {
        return false;
      }
    }

    if (requiredKeywords.length === 0) return true;
    return requiredKeywords.some((keyword) =>
      normalizedSection.includes(keyword),
    );
  }

  private buildReadingOptionsFromRow(
    row: ParsedImportRow,
  ): ParsedImportOption[] {
    const correctAnswerRaw = this.rowValue(row, [
      'correct_answer',
      'correct_option',
      'answer_key',
      'answer',
    ]).toUpperCase();

    const optionEntries: Array<{
      key: string;
      text: string;
      rationale: string;
    }> = [
      {
        key: 'A',
        text: this.rowValue(row, ['option_a', 'a', 'choice_a']),
        rationale: this.rowValue(row, ['rationale_a']),
      },
      {
        key: 'B',
        text: this.rowValue(row, ['option_b', 'b', 'choice_b']),
        rationale: this.rowValue(row, ['rationale_b']),
      },
      {
        key: 'C',
        text: this.rowValue(row, ['option_c', 'c', 'choice_c']),
        rationale: this.rowValue(row, ['rationale_c']),
      },
      {
        key: 'D',
        text: this.rowValue(row, ['option_d', 'd', 'choice_d']),
        rationale: this.rowValue(row, ['rationale_d']),
      },
    ];

    const options = optionEntries
      .filter((entry) => entry.text.length > 0)
      .map((entry) => ({
        optionKey: entry.key,
        optionText: entry.text,
        isCorrect: entry.key === correctAnswerRaw,
        rationale: entry.rationale || null,
      }));

    if (!options.some((option) => option.isCorrect) && options.length > 0) {
      options[0] = {
        ...options[0],
        isCorrect: true,
      };
    }

    return options;
  }

  private async getOrCreateToeicRepositoryForImport(
    dto: Pick<
      ToeicReadingImportDto,
      | 'repository_slug'
      | 'repository_title'
      | 'repository_description'
      | 'milestone_score'
      | 'unlock_score'
    >,
    skillArea: 'reading' | 'listening',
    options?: {
      contentType?: 'practice_set' | 'mock_test' | 'exam_simulation';
      source?: string;
      createdBy?: number;
      examYear?: number;
    },
  ): Promise<{ id: number; slug: string }> {
    const now = Date.now();
    const fallbackSlug = `toeic-${skillArea}-custom-${now}`;
    const slug = this.toSafeSlug(dto.repository_slug ?? fallbackSlug);

    const milestoneScore = Number(dto.milestone_score ?? 600);
    const unlockScore = Number(
      dto.unlock_score ?? Math.max(300, milestoneScore - 50),
    );
    const contentType = options?.contentType ?? 'exam_simulation';
    const source = options?.source ?? 'manual_import';

    const repository = await this.prisma.examRepository.upsert({
      where: { slug },
      update: {
        cert_type: 'toeic',
        title:
          dto.repository_title ??
          `TOEIC ${skillArea.toUpperCase()} Custom ${now}`,
        description: dto.repository_description ?? null,
        content_type: contentType,
        skill_area: skillArea,
        is_published: true,
        target_score_min: unlockScore,
        target_score_max: milestoneScore + 99,
        created_by: options?.createdBy,
        metadata: {
          topic_key: `${skillArea}.custom_${slug}`,
          milestone_score: milestoneScore,
          unlock_score: unlockScore,
          exam_year: options?.examYear ?? null,
          source,
        },
      },
      create: {
        cert_type: 'toeic',
        title:
          dto.repository_title ??
          `TOEIC ${skillArea.toUpperCase()} Custom ${now}`,
        slug,
        description: dto.repository_description ?? null,
        content_type: contentType,
        skill_area: skillArea,
        is_published: true,
        target_score_min: unlockScore,
        target_score_max: milestoneScore + 99,
        estimated_minutes: 1,
        pass_score: 1,
        created_by: options?.createdBy,
        metadata: {
          topic_key: `${skillArea}.custom_${slug}`,
          milestone_score: milestoneScore,
          unlock_score: unlockScore,
          exam_year: options?.examYear ?? null,
          source,
        },
      },
      select: { id: true, slug: true },
    });

    return repository;
  }

  private resolveSkillAreaFromImportInput(
    requestedSkillArea: 'reading' | 'listening' | undefined,
    filename: string,
  ): 'reading' | 'listening' {
    if (
      requestedSkillArea === 'reading' ||
      requestedSkillArea === 'listening'
    ) {
      return requestedSkillArea;
    }

    const normalized = filename.toLowerCase();
    if (
      normalized.includes('listening') ||
      normalized.includes('part1') ||
      normalized.includes('part2') ||
      normalized.includes('part3') ||
      normalized.includes('part4')
    ) {
      return 'listening';
    }

    return 'reading';
  }

  private async extractRawTextFromOcrImportFile(
    file: Express.Multer.File,
  ): Promise<string> {
    if (!file?.path) {
      throw new BadRequestException('Không tìm thấy file OCR để xử lý.');
    }

    const extension = extname(file.originalname || file.path).toLowerCase();
    if (extension === '.txt' || extension === '.md') {
      return (await readFile(file.path, 'utf8')).trim();
    }

    if (extension === '.pdf') {
      const buffer = await readFile(file.path);
      try {
        const pdfParseModule = await import('pdf-parse');

        // pdf-parse v2 exports PDFParse class; older versions export a default function.
        type PdfParseCtor = new (options: {
          data: Buffer | Uint8Array;
          verbosity?: number;
        }) => {
          getText: (params?: unknown) => Promise<{ text?: string }>;
          destroy?: () => Promise<void>;
        };

        const PDFParseCtor = (pdfParseModule as { PDFParse?: PdfParseCtor })
          .PDFParse;

        if (typeof PDFParseCtor === 'function') {
          const parser = new PDFParseCtor({ data: buffer });
          try {
            const parsed = await parser.getText();
            return String(parsed?.text ?? '').trim();
          } finally {
            if (typeof parser.destroy === 'function') {
              await parser.destroy().catch(() => undefined);
            }
          }
        }

        const legacyDefault = (pdfParseModule as { default?: unknown }).default;
        if (typeof legacyDefault === 'function') {
          const parsed = await (
            legacyDefault as (data: Buffer) => Promise<{ text?: string }>
          )(buffer);
          return String(parsed?.text ?? '').trim();
        }

        const legacyDirect = pdfParseModule as unknown;
        if (typeof legacyDirect === 'function') {
          const parsed = await (
            legacyDirect as (data: Buffer) => Promise<{ text?: string }>
          )(buffer);
          return String(parsed?.text ?? '').trim();
        }

        throw new BadRequestException(
          'Không thể khởi tạo bộ đọc PDF (pdf-parse API không tương thích).',
        );
      } catch (error: unknown) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(
          'Không đọc được nội dung từ file PDF. Vui lòng kiểm tra file hợp lệ.',
        );
      }
    }

    const isImage = [
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.bmp',
      '.tif',
      '.tiff',
    ].includes(extension);

    if (!isImage) {
      throw new BadRequestException(
        'Định dạng file chưa được hỗ trợ OCR. Hỗ trợ: pdf, txt, png, jpg, jpeg, webp, bmp, tif, tiff.',
      );
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const fileData = await readFile(file.path);
        let mimeType = file.mimetype || 'image/jpeg';
        if (mimeType === 'application/octet-stream') mimeType = 'image/jpeg';

        const prompt =
          'Please extract all the text from this image exactly as it appears. Ensure you capture all columns. Output only the text, no markdown, no conversational filler.';
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: fileData.toString('base64'),
              mimeType: mimeType,
            },
          },
        ]);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err: any) {
        Logger.warn(
          'Gemini OCR failed, falling back to Tesseract: ' + err.message,
          'CertificateEnrollmentService',
        );
      }
    }

    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');
    try {
      const result = await worker.recognize(file.path);
      return String(result?.data?.text ?? '').trim();
    } finally {
      await worker.terminate();
    }
  }

  private isOcrNoiseLine(line: string): boolean {
    return (
      /^--\s*\d+\s*of\s*\d+\s*--$/i.test(line) ||
      /^\d{1,3}$/.test(line) ||
      /^mẫu đề thi listening\s*-\s*reading$/i.test(line)
    );
  }

  private isLikelyAnswerKeyLine(line: string): boolean {
    const normalized = line.replace(/\s+/g, ' ').trim();
    if (!normalized) return false;

    // Avoid parsing question text lines such as "131. A. advance".
    if (/\b\d{1,3}\s*[).:-]\s*[A-D]\s*[).:-]\s*[A-Za-z]/.test(normalized)) {
      return false;
    }

    const pairRegex = /\b\d{1,3}\s*[).:-]?\s*\(?\s*[A-D]\s*\)?\b/gi;
    const pairMatches = normalized.match(pairRegex) ?? [];

    // Answer-key lines should mostly contain only number-letter pairs and separators.
    const residue = normalized
      .replace(pairRegex, ' ')
      .replace(/[\s,.;:()-]+/g, '')
      .trim();

    if (residue.length > 0) return false;

    if (pairMatches.length >= 3) return true;
    if (pairMatches.length >= 2 && normalized.length <= 90) return true;
    return false;
  }

  private extractAnswerKeyMapFromOcrText(
    rawText: string,
    skillArea: 'reading' | 'listening',
  ): Map<number, 'A' | 'B' | 'C' | 'D'> {
    const answerMap = new Map<number, 'A' | 'B' | 'C' | 'D'>();
    const lines = rawText
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0);

    let inAnswerSection = false;

    for (const line of lines) {
      if (/\b(answer\s*key|đáp\s*án|dap\s*an)\b/i.test(line)) {
        inAnswerSection = true;
        continue;
      }

      const shouldParseLine =
        inAnswerSection || this.isLikelyAnswerKeyLine(line);
      if (!shouldParseLine) continue;

      const pairRegex =
        /(\d{1,3})\s*[).:-]?\s*([A-D])(?=\s*(?:\d{1,3}\s*[).:-]?\s*[A-D]|$|[,;]))/g;
      let match: RegExpExecArray | null = null;
      while ((match = pairRegex.exec(line)) !== null) {
        const questionNumber = Number(match[1]);
        const answer = match[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        if (!Number.isFinite(questionNumber) || questionNumber < 1) continue;

        if (skillArea === 'reading') {
          if (questionNumber < 100 || questionNumber > 200) continue;
        } else {
          if (questionNumber < 1 || questionNumber > 100) continue;
        }

        answerMap.set(questionNumber, answer);
      }
    }

    return answerMap;
  }

  private extractAnswerKeyMapFromText(
    rawText: string,
    skillArea: string | null | undefined,
  ): Map<number, ToeicOptionKey> {
    const answerMap = new Map<number, ToeicOptionKey>();
    const lines = rawText
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0);

    let inAnswerSection = false;

    for (const line of lines) {
      if (/\b(answer\s*key|đáp\s*án|dap\s*an)\b/i.test(line)) {
        inAnswerSection = true;
        continue;
      }

      const pairRegex = /\b(\d{1,3})\s*[).:-]?\s*\(?\s*([A-D])\s*\)?\b/gi;
      const pairs = Array.from(line.matchAll(pairRegex));
      if (pairs.length === 0) continue;

      const residue = line
        .replace(pairRegex, ' ')
        .replace(/[\s,.;:()\-_/]+/g, '')
        .trim();

      const isSingleCleanPair = pairs.length === 1 && residue.length === 0;
      const shouldParse =
        inAnswerSection ||
        this.isLikelyAnswerKeyLine(line) ||
        isSingleCleanPair;

      if (!shouldParse) continue;

      for (const pair of pairs) {
        const questionNumber = Number(pair[1]);
        const answer = this.normalizeToeicOptionKey(pair[2]);
        if (!answer) continue;
        if (!this.isQuestionNumberInSkillRange(questionNumber, skillArea)) {
          continue;
        }
        answerMap.set(questionNumber, answer);
      }
    }

    return answerMap;
  }

  private extractAnswerKeyMapFromRows(
    rows: ParsedImportRow[],
    skillArea: string | null | undefined,
  ): Map<number, ToeicOptionKey> {
    const answerMap = new Map<number, ToeicOptionKey>();

    for (const row of rows) {
      const questionRaw = this.rowValue(row, [
        'question_number',
        'question_no',
        'question',
        'item_number',
        'item_order',
        'no',
        'stt',
        'id',
      ]);

      const answerRaw = this.rowValue(row, [
        'correct_answer',
        'answer_key',
        'answer',
        'correct_option',
        'correct_option_key',
        'key',
      ]);

      const questionNumber = this.parseQuestionNumber(questionRaw);
      const answer = this.normalizeToeicOptionKey(answerRaw);

      if (
        typeof questionNumber === 'number' &&
        answer &&
        this.isQuestionNumberInSkillRange(questionNumber, skillArea)
      ) {
        answerMap.set(questionNumber, answer);
        continue;
      }

      const mergedLine = Object.values(row)
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .join(' ')
        .trim();

      if (!mergedLine) continue;

      const parsedFromText = this.extractAnswerKeyMapFromText(
        mergedLine,
        skillArea,
      );

      for (const [qNo, key] of parsedFromText.entries()) {
        answerMap.set(qNo, key);
      }
    }

    return answerMap;
  }

  public async parseToeicAnswerKeyFromFile(
    file: Express.Multer.File,
    skillArea: string | null | undefined,
  ): Promise<Map<number, ToeicOptionKey>> {
    if (!file?.path) {
      throw new BadRequestException('Không tìm thấy file answer key.');
    }

    const extension = extname(file.originalname || file.path).toLowerCase();

    if (extension === '.txt' || extension === '.md') {
      const raw = await readFile(file.path, 'utf8');
      return this.extractAnswerKeyMapFromText(raw, skillArea);
    }

    const ocrSupportedExtensions = new Set([
      '.pdf',
      '.png',
      '.jpg',
      '.jpeg',
      '.webp',
      '.bmp',
      '.tif',
      '.tiff',
    ]);

    if (ocrSupportedExtensions.has(extension)) {
      try {
        const raw = await this.extractRawTextFromOcrImportFile(file);
        const parsed = this.extractAnswerKeyMapFromText(raw, skillArea);
        if (parsed.size > 0) {
          return parsed;
        }
      } catch (err: any) {
        throw new BadRequestException(
          'Lỗi trích xuất chữ từ ảnh/PDF: ' + (err.message || 'Unknown error'),
        );
      }
      throw new BadRequestException(
        'Không quét được đáp án (1A, 2B...) nào từ file ảnh/PDF.',
      );
    }

    if (extension === '.json') {
      const raw = await readFile(file.path, 'utf8');
      const parsed = JSON.parse(raw) as unknown;

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const objectParsed = parsed as Record<string, unknown>;
        const rowsValue = objectParsed.rows;

        if (Array.isArray(rowsValue)) {
          const rows = rowsValue
            .filter(
              (item): item is Record<string, unknown> =>
                Boolean(item) &&
                typeof item === 'object' &&
                !Array.isArray(item),
            )
            .map((item) => this.normalizeImportRow(item));

          return this.extractAnswerKeyMapFromRows(rows, skillArea);
        }

        const mapFromObject = new Map<number, ToeicOptionKey>();
        for (const [rawQuestion, rawAnswer] of Object.entries(objectParsed)) {
          const questionNumber = this.parseQuestionNumber(rawQuestion);
          const answerRawValue =
            typeof rawAnswer === 'string' || typeof rawAnswer === 'number'
              ? String(rawAnswer)
              : '';
          const answer = this.normalizeToeicOptionKey(answerRawValue);

          if (
            typeof questionNumber === 'number' &&
            answer &&
            this.isQuestionNumberInSkillRange(questionNumber, skillArea)
          ) {
            mapFromObject.set(questionNumber, answer);
          }
        }

        if (mapFromObject.size > 0) {
          return mapFromObject;
        }
      }
    }

    const rows = await this.parseImportRowsFromFile(file);
    return this.extractAnswerKeyMapFromRows(rows, skillArea);
  }

  private extractInlineOptionsFromLine(line: string): {
    stem: string;
    options: ParsedImportOption[];
  } {
    const markerRegex = /(?:\(([A-D])\)|([A-D]))[).:-]?\s*/gi;
    const markers = Array.from(line.matchAll(markerRegex)).filter((match) => {
      const idx = match.index ?? -1;
      return idx === 0 || /\s/.test(line[idx - 1] ?? '');
    });

    if (markers.length === 0) {
      return { stem: line.trim(), options: [] };
    }

    const stem = line.slice(0, markers[0].index ?? 0).trim();
    const options: ParsedImportOption[] = [];

    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      const nextMarker = markers[i + 1];
      const start = (marker.index ?? 0) + marker[0].length;
      const end = nextMarker?.index ?? line.length;
      const optionText = line.slice(start, end).replace(/\s+/g, ' ').trim();

      if (!optionText) continue;

      const rawKey = marker[1] || marker[2];
      options.push({
        optionKey: rawKey.toUpperCase(),
        optionText,
        isCorrect: false,
        rationale: null,
      });
    }

    return { stem, options };
  }

  private deriveStemFromContextLines(contextLines: string[]): string {
    const preferred = [...contextLines]
      .reverse()
      .find((line) => /\.\.{2,}|_{2,}|…/.test(line));
    if (preferred) return preferred.trim();

    const fallback = [...contextLines]
      .reverse()
      .find(
        (line) =>
          line.length >= 12 &&
          !/^Directions?:/i.test(line) &&
          !/^Questions?\s+\d+/i.test(line) &&
          !/^PART\s*([IVX]+|[1-7])/i.test(line),
      );

    return fallback?.trim() ?? '';
  }

  private isLikelyOptionContinuationLine(line: string): boolean {
    return (
      /^[a-z(]/.test(line) ||
      /^(and|or|to|for|of|with|in|on|at|from|that|which|who|where|when)\b/i.test(
        line,
      )
    );
  }

  private isLikelyPassageLine(line: string): boolean {
    return (
      /\.\.{2,}|_{2,}|…/.test(line) ||
      /^(To:|From:|Date:|Subject:|Dear\s|Sincerely|Thank you)/i.test(line) ||
      /^[A-Z][A-Za-z0-9'",;:()\-\s]{20,}$/.test(line)
    );
  }

  /**
   * Extract the sentence/clause in a Part 6 passage that contains the inline
   * blank marker (N) — used as the question stem.
   */
  private extractPart6BlankStem(passage: string, blankNumber: number): string {
    if (!passage) return '';

    const marker = `(${blankNumber})`;
    const markerIdx = passage.indexOf(marker);
    if (markerIdx === -1) return '';

    // Walk backwards to find sentence start
    let sentenceStart = 0;
    for (let i = markerIdx - 1; i >= 0; i--) {
      if (['.', '!', '?', '\n'].includes(passage[i])) {
        sentenceStart = i + 1;
        break;
      }
    }

    // Walk forwards to find sentence end
    let sentenceEnd = passage.length;
    for (let i = markerIdx + marker.length; i < passage.length; i++) {
      if (['.', '!', '?'].includes(passage[i])) {
        sentenceEnd = i + 1;
        break;
      }
    }

    return passage.slice(sentenceStart, sentenceEnd).trim();
  }

  private parseToeicQuestionsFromOcrText(
    rawText: string,
    skillArea: 'reading' | 'listening',
  ): ParsedOcrQuestion[] {
    const normalized = rawText
      .replace(/\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[\t\f\v]+/g, ' ')
      .trim();

    if (!normalized) return [];

    const lines = normalized
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0);

    const answerKeyMap = this.extractAnswerKeyMapFromOcrText(
      normalized,
      skillArea,
    );

    const allowedParts = new Set(
      skillArea === 'reading' ? [5, 6, 7] : [1, 2, 3, 4],
    );
    const questions: ParsedOcrQuestion[] = [];

    let readingSectionStarted = skillArea !== 'reading';
    let currentPart: number | null = skillArea === 'reading' ? 5 : 1;
    let activeRange: { start: number; end: number } | null = null;
    let rangeContextLines: string[] = [];
    let contextBuffer: string[] = [];
    // Track Part 6 passage accumulation per group
    let part6PassageLines: string[] = [];
    let part6GroupRange: { start: number; end: number } | null = null;
    // Buffer of Part 6 option blocks: each element = one question's options (in order A,B,C,D)
    let part6OptionBlocks: Array<Map<'A' | 'B' | 'C' | 'D', string>> = [];
    let part6CurrentOptionBlock: Map<'A' | 'B' | 'C' | 'D', string> | null =
      null;
    let part6BlankNumbers: number[] = [];

    type WorkingQuestion = {
      questionNumber: number | null;
      stemLines: string[];
      contextLines: string[];
      optionsMap: Map<'A' | 'B' | 'C' | 'D', string>;
      answerKey: 'A' | 'B' | 'C' | 'D' | null;
      explanationLines: string[];
      part: number | null;
      lastOptionKey: 'A' | 'B' | 'C' | 'D' | null;
      inExplanation: boolean;
    };

    let working: WorkingQuestion | null = null;

    const pushContextLine = (line: string) => {
      if (!line || this.isOcrNoiseLine(line)) return;
      contextBuffer.push(line);
      if (contextBuffer.length > 18) {
        contextBuffer.shift();
      }

      if (activeRange) {
        rangeContextLines.push(line);
        if (rangeContextLines.length > 120) {
          rangeContextLines.shift();
        }
      }
    };

    const flushQuestion = () => {
      if (!working) return;
      const current = working;

      const optionKeys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      const options = optionKeys
        .filter((key) => current.optionsMap.has(key))
        .map((key) => ({
          optionKey: key,
          optionText: (current.optionsMap.get(key) ?? '')
            .replace(/\s*Questions?\s+\d+\s*-\s*\d+\s*refer.*$/i, '')
            .trim(),
          isCorrect: false,
          rationale: null,
        }))
        .filter((opt) => opt.optionText.trim().length > 0);

      if (options.length < 2) {
        working = null;
        return;
      }

      const answerFromQuestion =
        current.answerKey &&
        options.some((opt) => opt.optionKey === current.answerKey)
          ? current.answerKey
          : null;

      const questionNo = current.questionNumber;
      const mappedAnswer =
        typeof questionNo === 'number' ? answerKeyMap.get(questionNo) : null;

      const answerFromKeyMap =
        typeof mappedAnswer === 'string' &&
        options.some((opt) => opt.optionKey === mappedAnswer)
          ? mappedAnswer
          : null;

      const effectiveAnswer = answerFromQuestion ?? answerFromKeyMap;

      for (const option of options) {
        option.isCorrect =
          typeof effectiveAnswer === 'string' &&
          option.optionKey === effectiveAnswer;
      }

      let stem = current.stemLines.join(' ').replace(/\s+/g, ' ').trim();
      let context = current.contextLines
        .filter(
          (line) =>
            !/^Directions?:/i.test(line) &&
            !/^Questions?\s+\d+\s*-\s*\d+\s*refer/i.test(line) &&
            !/^PART\s*([IVX]+|[1-7])/i.test(line),
        )
        .join('\n')
        .trim();

      if (!stem) {
        stem = this.deriveStemFromContextLines(current.contextLines);
      }

      if (!stem && context) {
        stem = context;
        context = '';
      }

      if (!stem) {
        working = null;
        return;
      }

      if (context && context.includes(stem)) {
        context = context.replace(stem, '').trim();
      }

      if (current.part === 5) {
        context = '';
      }

      questions.push({
        questionNumber: current.questionNumber,
        part: current.part,
        stem,
        context: context || null,
        options,
        explanation:
          current.explanationLines.length > 0
            ? current.explanationLines.join(' ').trim()
            : null,
      });

      working = null;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || this.isOcrNoiseLine(line)) continue;

      if (/^READING\s*TEST$/i.test(line)) {
        if (skillArea === 'reading') {
          readingSectionStarted = true;
          currentPart = 5;
          activeRange = null;
          rangeContextLines = [];
          contextBuffer = [];
          flushQuestion();
        } else {
          break;
        }
        continue;
      }

      if (skillArea === 'reading' && !readingSectionStarted) {
        continue;
      }

      const partMatch =
        line.match(/\bPART\s*([IVX]+|[1-7])\b/i) ??
        line.match(/\bPART([IVX]+|[1-7])\b/i);
      if (partMatch?.[1]) {
        const parsedPart = this.mapToeicPartTokenToNumber(partMatch[1]);
        if (parsedPart) {
          flushQuestion();

          // If we were in Part 6, flush remaining group before switching parts
          if (
            currentPart === 6 &&
            part6GroupRange &&
            part6BlankNumbers.length > 0
          ) {
            if (part6CurrentOptionBlock && part6CurrentOptionBlock.size > 0) {
              part6OptionBlocks.push(part6CurrentOptionBlock);
              part6CurrentOptionBlock = null;
            }
            const passage = part6PassageLines.join('\n').trim();
            for (let bi = 0; bi < part6BlankNumbers.length; bi++) {
              const blankNum = part6BlankNumbers[bi];
              const optBlock = part6OptionBlocks[bi];
              if (!optBlock || optBlock.size < 2) continue;
              const blankStem = this.extractPart6BlankStem(passage, blankNum);
              const opts = (['A', 'B', 'C', 'D'] as const)
                .filter((k) => optBlock.has(k))
                .map((k) => ({
                  optionKey: k,
                  optionText: optBlock.get(k)!,
                  isCorrect: answerKeyMap.get(blankNum) === k,
                  rationale: null,
                }));
              if (opts.length < 2) continue;
              questions.push({
                questionNumber: blankNum,
                part: 6,
                stem:
                  blankStem || `(${blankNum}) _______ — Chọn từ phù hợp nhất`,
                context: passage || null,
                options: opts,
                explanation: null,
              });
            }
            part6GroupRange = null;
            part6PassageLines = [];
            part6BlankNumbers = [];
            part6OptionBlocks = [];
          }

          currentPart = parsedPart;
          activeRange = null;
          rangeContextLines = [];
          contextBuffer = [];
        }
        continue;
      }

      if (currentPart !== null && !allowedParts.has(currentPart)) {
        continue;
      }

      const rangeMatch =
        line.match(
          /Questions?\s*(\d{1,3})\s*(?:to|-|–|—)\s*(\d{1,3})\s*(?:refer|are based on|relate|correspond)/i,
        ) ?? line.match(/Questions?\s*(\d{1,3})\s*-\s*(\d{1,3})/i);
      if (rangeMatch?.[1] && rangeMatch?.[2]) {
        flushQuestion();
        const rangeStart = Number(rangeMatch[1]);
        const rangeEnd = Number(rangeMatch[2]);
        activeRange = { start: rangeStart, end: rangeEnd };
        rangeContextLines = [];
        contextBuffer = [];

        // Part 6 — flush previous group and start new one
        if (currentPart === 6) {
          // If there was a previous group, emit those questions now
          if (part6GroupRange && part6BlankNumbers.length > 0) {
            const passage = part6PassageLines.join('\n').trim();
            for (let bi = 0; bi < part6BlankNumbers.length; bi++) {
              const blankNum = part6BlankNumbers[bi];
              const optBlock = part6OptionBlocks[bi];
              if (!optBlock || optBlock.size < 2) continue;
              // Extract the sentence containing the blank as stem
              const blankStem = this.extractPart6BlankStem(passage, blankNum);
              const opts = (['A', 'B', 'C', 'D'] as const)
                .filter((k) => optBlock.has(k))
                .map((k) => ({
                  optionKey: k,
                  optionText: optBlock.get(k)!,
                  isCorrect: answerKeyMap.get(blankNum) === k,
                  rationale: null,
                }));
              if (opts.length < 2) continue;
              questions.push({
                questionNumber: blankNum,
                part: 6,
                stem:
                  blankStem || `(${blankNum}) _______ — Chọn từ phù hợp nhất`,
                context: passage || null,
                options: opts,
                explanation: null,
              });
            }
          }
          // Reset for new Part 6 group
          part6GroupRange = { start: rangeStart, end: rangeEnd };
          part6PassageLines = [];
          part6BlankNumbers = [];
          part6OptionBlocks = [];
          part6CurrentOptionBlock = null;
        }
        continue;
      }

      // ── Part 6: accumulate passage lines and detect inline blanks ────────
      if (currentPart === 6 && part6GroupRange) {
        // Detect inline blank markers like (141) anywhere in the line
        const inlineBlankRe = /\((\d{1,3})\)/g;
        let blankMatch: RegExpExecArray | null;
        while ((blankMatch = inlineBlankRe.exec(line)) !== null) {
          const bNum = Number(blankMatch[1]);
          if (
            bNum >= part6GroupRange.start &&
            bNum <= part6GroupRange.end &&
            !part6BlankNumbers.includes(bNum)
          ) {
            part6BlankNumbers.push(bNum);
          }
        }

        // Detect start of an option block: line starting with A.
        const optLineMatch = line.match(/^([A-D])[).:]\s*(.+)$/i);
        if (optLineMatch) {
          const optKey = optLineMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
          const optText = optLineMatch[2].trim();

          if (optKey === 'A') {
            // Starting a new option block
            if (part6CurrentOptionBlock && part6CurrentOptionBlock.size > 0) {
              part6OptionBlocks.push(part6CurrentOptionBlock);
            }
            part6CurrentOptionBlock = new Map();
          }

          if (part6CurrentOptionBlock) {
            part6CurrentOptionBlock.set(optKey, optText);
          } else {
            part6CurrentOptionBlock = new Map([[optKey, optText]]);
          }

          // When we have all 4 options, push the block
          if (part6CurrentOptionBlock.size === 4) {
            part6OptionBlocks.push(part6CurrentOptionBlock);
            part6CurrentOptionBlock = null;
          }
          continue;
        }

        // Non-option line → passage body
        if (!this.isOcrNoiseLine(line) && !/^Directions?:/i.test(line)) {
          part6PassageLines.push(line);
        }
        continue;
      }

      // ── Standard question detection (Parts 5, 7, listening) ──────────────
      const questionStart = line.match(
        /^(?:q(?:uestion)?\s*)?(\d{1,3})[).:-]\s*(.*)$/i,
      );
      if (questionStart?.[1]) {
        const questionNumber = Number(questionStart[1]);

        if (skillArea === 'reading' && questionNumber < 100) {
          continue;
        }
        if (skillArea === 'listening' && questionNumber > 100) {
          continue;
        }

        flushQuestion();

        const remainder = questionStart[2]?.trim() ?? '';
        const inline = this.extractInlineOptionsFromLine(remainder);
        const inRange =
          Boolean(activeRange) &&
          questionNumber >= Number(activeRange?.start) &&
          questionNumber <= Number(activeRange?.end);

        const inheritedContext = [
          ...(inRange ? rangeContextLines : []),
          ...contextBuffer,
        ].filter(
          (value, index, array) =>
            value.length > 0 && array.indexOf(value) === index,
        );

        let stem = inline.stem.trim();
        if (!stem) {
          stem = this.deriveStemFromContextLines(inheritedContext);
        }

        working = {
          questionNumber,
          stemLines: stem ? [stem] : [],
          contextLines: inheritedContext,
          optionsMap: new Map(),
          answerKey: null,
          explanationLines: [],
          part: skillArea === 'listening'
            ? (questionNumber >= 1 && questionNumber <= 6 ? 1
               : questionNumber >= 7 && questionNumber <= 31 ? 2
               : questionNumber >= 32 && questionNumber <= 70 ? 3
               : questionNumber >= 71 && questionNumber <= 100 ? 4
               : currentPart)
            : currentPart,
          lastOptionKey: null,
          inExplanation: false,
        };

        for (const option of inline.options) {
          const key = option.optionKey.toUpperCase() as 'A' | 'B' | 'C' | 'D';
          working.optionsMap.set(key, option.optionText.trim());
          working.lastOptionKey = key;
          if (option.isCorrect) {
            working.answerKey = key;
          }
        }

        contextBuffer = [];
        continue;
      }

      if (!working) {
        pushContextLine(line);
        continue;
      }

      const answerMatch = line.match(
        /^(?:answer|correct\s*answer|dap\s*an|đáp\s*án)\s*[:-]?\s*([A-D])\b/i,
      );
      if (answerMatch?.[1]) {
        working.answerKey = answerMatch[1].toUpperCase() as
          | 'A'
          | 'B'
          | 'C'
          | 'D';
        working.inExplanation = false;
        continue;
      }

      const explanationStart = line.match(
        /^(?:explanation|giai\s*thich|giải\s*thích)\s*[:-]?\s*(.*)$/i,
      );
      if (explanationStart) {
        const initial = explanationStart[1]?.trim();
        if (initial) {
          working.explanationLines.push(initial);
        }
        working.inExplanation = true;
        continue;
      }

      if (working.inExplanation) {
        working.explanationLines.push(line);
        continue;
      }

      const optionLineMatch = line.match(/^(?:\(([A-D])\)|([A-D]))[).:-]?\s*(.*)$/i);
      const matchedOptKey = optionLineMatch ? (optionLineMatch[1] || optionLineMatch[2]) : null;
      if (matchedOptKey) {
        const parsedInlineOptions = this.extractInlineOptionsFromLine(line);
        const incoming = parsedInlineOptions.options;

        if (incoming.length > 0) {
          for (const option of incoming) {
            const key = option.optionKey.toUpperCase() as 'A' | 'B' | 'C' | 'D';
            working.optionsMap.set(key, option.optionText.trim());
            working.lastOptionKey = key;
            if (option.isCorrect) {
              working.answerKey = key;
            }
          }

          if (!working.stemLines.length && parsedInlineOptions.stem.trim()) {
            working.stemLines.push(parsedInlineOptions.stem.trim());
          }
          continue;
        }
      }

      if (working.optionsMap.size >= 2 && this.isLikelyPassageLine(line)) {
        flushQuestion();
        pushContextLine(line);
        continue;
      }

      if (
        working.lastOptionKey &&
        working.optionsMap.size > 0 &&
        this.isLikelyOptionContinuationLine(line)
      ) {
        const previous = working.optionsMap.get(working.lastOptionKey) ?? '';
        working.optionsMap.set(
          working.lastOptionKey,
          `${previous} ${line}`.replace(/\s+/g, ' ').trim(),
        );
        continue;
      }

      if (working.optionsMap.size === 0) {
        working.stemLines.push(line);
        continue;
      }

      flushQuestion();
      pushContextLine(line);
    }

    flushQuestion();

    // ── Flush final Part 6 group ────────────────────────────────────────────
    if (currentPart === 6 && part6GroupRange && part6BlankNumbers.length > 0) {
      // Push any dangling option block
      if (part6CurrentOptionBlock && part6CurrentOptionBlock.size > 0) {
        part6OptionBlocks.push(part6CurrentOptionBlock);
      }
      const passage = part6PassageLines.join('\n').trim();
      for (let bi = 0; bi < part6BlankNumbers.length; bi++) {
        const blankNum = part6BlankNumbers[bi];
        const optBlock = part6OptionBlocks[bi];
        if (!optBlock || optBlock.size < 2) continue;
        const blankStem = this.extractPart6BlankStem(passage, blankNum);
        const opts = (['A', 'B', 'C', 'D'] as const)
          .filter((k) => optBlock.has(k))
          .map((k) => ({
            optionKey: k,
            optionText: optBlock.get(k)!,
            isCorrect: answerKeyMap.get(blankNum) === k,
            rationale: null,
          }));
        if (opts.length < 2) continue;
        questions.push({
          questionNumber: blankNum,
          part: 6,
          stem: blankStem || `(${blankNum}) _______ — Chọn từ phù hợp nhất`,
          context: passage || null,
          options: opts,
          explanation: null,
        });
      }
    }

    const numberedRatio =
      questions.length === 0
        ? 0
        : questions.filter((q) => typeof q.questionNumber === 'number').length /
          questions.length;

    if (numberedRatio >= 0.8) {
      return [...questions].sort(
        (a, b) =>
          Number(a.questionNumber ?? Number.MAX_SAFE_INTEGER) -
          Number(b.questionNumber ?? Number.MAX_SAFE_INTEGER),
      );
    }

    return questions;
  }

  async importToeicExamFromOcrFile(
    accountId: number,
    dto: ToeicOcrImportDto,
    file: Express.Multer.File,
    externalParsed?: Array<{
      questionNumber: number | null;
      part: number | null;
      stem: string;
      context?: string | null;
      options: Array<{
        optionKey: string;
        optionText: string;
        isCorrect: boolean;
        rationale?: string | null;
      }>;
    }>,
  ): Promise<ToeicOcrImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng gửi file để OCR import.');
    }

    const skillArea = this.resolveSkillAreaFromImportInput(
      dto.skill_area,
      file.originalname || '',
    );

    let parsedQuestions: ParsedOcrQuestion[];

    if (externalParsed && externalParsed.length > 0) {
      // Use externally-parsed questions (e.g. from ToeicPracticeImportService)
      parsedQuestions = externalParsed.map((q) => ({
        questionNumber: q.questionNumber,
        part: q.part,
        stem: q.stem,
        context: q.context ?? null,
        options: q.options.map((opt) => ({
          optionKey: opt.optionKey,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
          rationale: opt.rationale ?? null,
        })),
      }));
    } else {
      const rawText = await this.extractRawTextFromOcrImportFile(file);

      const allowEmpty = (dto as any).allow_empty_parsing === true;

      if (!rawText || rawText.length < 40) {
        if (!allowEmpty) {
          throw new BadRequestException(
            'OCR không trích xuất đủ text để tạo bộ câu hỏi.',
          );
        }
      }

      parsedQuestions = this.parseToeicQuestionsFromOcrText(rawText, skillArea);

      if (parsedQuestions.length === 0) {
        if (!allowEmpty) {
          throw new BadRequestException(
            'Không parse được câu hỏi hợp lệ từ nội dung OCR.',
          );
        }
      }
    }

    const repository = await this.getOrCreateToeicRepositoryForImport(
      {
        repository_slug: dto.repository_slug,
        repository_title: dto.repository_title,
        repository_description: dto.repository_description,
        milestone_score: dto.milestone_score,
        unlock_score: dto.unlock_score,
      },
      skillArea,
      {
        contentType: 'exam_simulation',
        source: 'ocr_import',
        createdBy: accountId,
        examYear: dto.exam_year,
      },
    );

    const shouldReplace = dto.replace_existing !== false;
    if (shouldReplace) {
      await this.prisma.examRepositoryItem.deleteMany({
        where: { repository_id: repository.id },
      });
    }

    const lastItem = await this.prisma.examRepositoryItem.findFirst({
      where: { repository_id: repository.id },
      orderBy: { item_order: 'desc' },
      select: { item_order: true },
    });

    let nextItemOrder = Number(lastItem?.item_order ?? 0) + 1;
    let importedCount = 0;
    let skippedCount = 0;

    for (const parsed of parsedQuestions) {
      if (!parsed.stem || parsed.options.length < 2) {
        skippedCount += 1;
        continue;
      }

      const createdItem = await this.prisma.examRepositoryItem.create({
        data: {
          repository_id: repository.id,
          item_order: nextItemOrder,
          item_type: 'single_choice',
          stem: parsed.stem,
          reading_passage: parsed.context ?? null,
          score_weight: 1,
          estimated_seconds: skillArea === 'listening' ? 40 : 60,
          metadata: {
            source: 'ocr_import',
            source_file: basename(file.originalname || file.path),
            part: parsed.part,
            question_number: parsed.questionNumber ?? null,
          },
        },
        select: { id: true },
      });

      await this.prisma.examRepositoryOption.createMany({
        data: parsed.options.map((option, index) => ({
          item_id: createdItem.id,
          option_key: option.optionKey,
          option_text: option.optionText,
          is_correct: option.isCorrect,
          rationale: option.rationale ?? null,
          sort_order: index + 1,
        })),
      });

      importedCount += 1;
      nextItemOrder += 1;
    }

    const totalItems = await this.prisma.examRepositoryItem.count({
      where: { repository_id: repository.id },
    });

    await this.prisma.examRepository.update({
      where: { id: repository.id },
      data: {
        total_items: totalItems,
        estimated_minutes: Math.max(1, Math.ceil(totalItems / 2)),
        pass_score: Math.max(1, Math.ceil(totalItems * 0.7)),
      },
    });

    return {
      repository_id: repository.id,
      slug: repository.slug,
      skill_area: skillArea,
      imported_count: importedCount,
      skipped_count: skippedCount,
      total_detected: parsedQuestions.length,
      source_filename: basename(file.originalname || file.path),
    };
  }

  async importToeicAnswerKeyFromFile(
    accountId: number,
    dto: ToeicAnswerKeyImportDto,
    file: Express.Multer.File,
  ): Promise<ToeicAnswerKeyImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng gửi file answer key.');
    }

    const repositorySlug = dto.repository_slug?.trim();
    if (!repositorySlug) {
      throw new BadRequestException('repository_slug la bat buoc.');
    }

    const repository = await this.prisma.examRepository.findUnique({
      where: { slug: repositorySlug },
      select: {
        id: true,
        slug: true,
        cert_type: true,
        skill_area: true,
        metadata: true,
      },
    });

    if (!repository || repository.cert_type !== 'toeic') {
      throw new NotFoundException(
        'Không tìm thấy repository TOEIC cần cập nhật.',
      );
    }

    const skillArea = repository.skill_area;
    if (skillArea !== 'reading' && skillArea !== 'listening') {
      throw new BadRequestException(
        'Chỉ hỗ trợ import answer key cho repository TOEIC listening/reading.',
      );
    }

    const answerKeyMap = await this.parseToeicAnswerKeyFromFile(
      file,
      skillArea,
    );
    if (answerKeyMap.size === 0) {
      throw new BadRequestException(
        'Không tìm thấy cặp question_number + answer (A/B/C/D) hợp lệ trong file.',
      );
    }

    const items = await this.prisma.examRepositoryItem.findMany({
      where: { repository_id: repository.id },
      orderBy: { item_order: 'asc' },
      select: {
        id: true,
        item_order: true,
        metadata: true,
        options: {
          orderBy: { sort_order: 'asc' },
          select: {
            id: true,
            option_key: true,
          },
        },
      },
    });

    if (items.length === 0) {
      throw new BadRequestException(
        'Repository hiện chưa có câu hỏi để gán đáp án.',
      );
    }

    const clearExisting = dto.clear_existing !== false;
    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (clearExisting) {
      operations.push(
        this.prisma.examRepositoryOption.updateMany({
          where: { item: { repository_id: repository.id } },
          data: { is_correct: false },
        }),
      );
    }

    const repositoryQuestionNumbers = new Set<number>();
    const matchedQuestionNumbers = new Set<number>();
    let appliedItems = 0;

    for (const item of items) {
      const questionNumber =
        this.readQuestionNumberFromMetadata(item.metadata) ??
        this.fallbackQuestionNumberByItemOrder(item.item_order, skillArea);

      if (typeof questionNumber === 'number') {
        repositoryQuestionNumbers.add(questionNumber);
      }

      if (typeof questionNumber !== 'number') continue;

      const mappedAnswer = answerKeyMap.get(questionNumber);

      if (!mappedAnswer) continue;

      const matchedOption = item.options.find(
        (option) =>
          this.normalizeToeicOptionKey(option.option_key) === mappedAnswer,
      );
      if (!matchedOption) continue;

      operations.push(
        this.prisma.examRepositoryOption.updateMany({
          where: { item_id: item.id },
          data: { is_correct: false },
        }),
        this.prisma.examRepositoryOption.update({
          where: { id: matchedOption.id },
          data: { is_correct: true },
        }),
      );

      appliedItems += 1;
      matchedQuestionNumbers.add(questionNumber);
    }

    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }

    const unansweredItems = await this.prisma.examRepositoryItem.count({
      where: {
        repository_id: repository.id,
        options: {
          none: { is_correct: true },
        },
      },
    });

    const unknownQuestionNumbers = [...answerKeyMap.keys()]
      .filter(
        (questionNumber) => !repositoryQuestionNumbers.has(questionNumber),
      )
      .sort((a, b) => a - b);

    const metadata = (repository.metadata ?? {}) as Prisma.JsonObject;
    await this.prisma.examRepository.update({
      where: { id: repository.id },
      data: {
        metadata: {
          ...metadata,
          answer_key_source: 'file_import',
          answer_key_imported_at: new Date().toISOString(),
          answer_key_source_filename: basename(file.originalname || file.path),
          answer_key_imported_by: accountId,
          answer_key_answers_detected: answerKeyMap.size,
          answer_key_matched_questions: matchedQuestionNumbers.size,
        },
      },
    });

    return {
      repository_id: repository.id,
      slug: repository.slug,
      skill_area: skillArea,
      source_filename: basename(file.originalname || file.path),
      total_answers_detected: answerKeyMap.size,
      applied_items: appliedItems,
      unanswered_items: unansweredItems,
      unknown_question_numbers: unknownQuestionNumbers,
    };
  }

  async importToeicReadingFromFile(
    dto: ToeicReadingImportDto,
    file: Express.Multer.File,
  ): Promise<ToeicReadingImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng gửi file reading để import.');
    }

    const rows = await this.parseImportRowsFromFile(file);
    if (rows.length === 0) {
      throw new BadRequestException('Không đọc được dữ liệu từ file import.');
    }

    const requiredKeywords = this.parseKeywordList(
      dto.required_section_keywords,
      DEFAULT_READING_REQUIRED_KEYWORDS,
    );
    const excludedKeywords = this.parseKeywordList(
      dto.excluded_section_keywords,
      DEFAULT_READING_EXCLUDED_KEYWORDS,
    );
    const strictFilter = Boolean(dto.strict_section_filter);

    const repository = await this.getOrCreateToeicRepositoryForImport(
      dto,
      'reading',
    );

    const lastItem = await this.prisma.examRepositoryItem.findFirst({
      where: { repository_id: repository.id },
      orderBy: { item_order: 'desc' },
      select: { item_order: true },
    });

    let nextItemOrder = Number(lastItem?.item_order ?? 0) + 1;
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const sectionText = this.rowValue(row, [
        'section',
        'section_title',
        'part',
        'part_title',
        'skill_area',
      ]);
      const partNumber = this.detectToeicPartFromText(sectionText);

      const isReading = this.sectionMatchesReading(
        sectionText,
        requiredKeywords,
        excludedKeywords,
        strictFilter,
      );

      if (!isReading) {
        skippedCount += 1;
        continue;
      }

      const stem = this.rowValue(row, [
        'stem',
        'question',
        'question_text',
        'content',
      ]);
      if (!stem) {
        skippedCount += 1;
        continue;
      }

      const options = this.buildReadingOptionsFromRow(row);
      if (options.length < 2 || !options.some((option) => option.isCorrect)) {
        skippedCount += 1;
        continue;
      }

      const createdItem = await this.prisma.examRepositoryItem.create({
        data: {
          repository_id: repository.id,
          item_order: nextItemOrder,
          item_type: this.rowValue(row, ['item_type']) || 'single_choice',
          title: this.rowValue(row, ['title', 'question_title']) || null,
          stem,
          reading_passage:
            this.rowValue(row, ['reading_passage', 'passage', 'paragraph']) ||
            null,
          metadata:
            sectionText || partNumber
              ? {
                  source_section: sectionText || null,
                  part: partNumber,
                }
              : undefined,
          estimated_seconds: Number(
            this.rowValue(row, ['estimated_seconds']) || 60,
          ),
          score_weight: 1,
        },
        select: { id: true },
      });

      await this.prisma.examRepositoryOption.createMany({
        data: options.map((option, index) => ({
          item_id: createdItem.id,
          option_key: option.optionKey,
          option_text: option.optionText,
          is_correct: option.isCorrect,
          rationale: option.rationale ?? null,
          sort_order: index + 1,
        })),
      });

      importedCount += 1;
      nextItemOrder += 1;
    }

    const totalItems = await this.prisma.examRepositoryItem.count({
      where: { repository_id: repository.id },
    });

    await this.prisma.examRepository.update({
      where: { id: repository.id },
      data: {
        total_items: totalItems,
        estimated_minutes: Math.max(1, totalItems),
        pass_score: Math.max(1, Math.ceil(totalItems * 0.7)),
      },
    });

    return {
      repository_id: repository.id,
      slug: repository.slug,
      imported_count: importedCount,
      skipped_count: skippedCount,
      total_rows: rows.length,
    };
  }

  private parseListeningOptionsFromDto(
    dto: ToeicManualListeningCreateDto,
  ): ParsedImportOption[] {
    if (dto.options_json && dto.options_json.trim().length > 0) {
      const parsed = JSON.parse(dto.options_json) as unknown;
      if (!Array.isArray(parsed)) {
        throw new BadRequestException('options_json phải là mảng JSON hợp lệ.');
      }

      const normalized = parsed
        .filter(
          (item): item is ParsedListeningOption =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item) => ({
          optionKey: String(item.option_key ?? '')
            .toUpperCase()
            .trim(),
          optionText: String(item.option_text ?? '').trim(),
          isCorrect: Boolean(item.is_correct),
          rationale: item.rationale ? String(item.rationale) : null,
        }))
        .filter(
          (item) => item.optionKey.length > 0 && item.optionText.length > 0,
        );

      if (normalized.length === 0) {
        throw new BadRequestException(
          'Không có đáp án hợp lệ trong options_json.',
        );
      }

      if (!normalized.some((item) => item.isCorrect)) {
        throw new BadRequestException(
          'options_json phai co it nhat mot dap an dung.',
        );
      }

      return normalized;
    }

    const manualOptions: ParsedImportOption[] = [
      {
        optionKey: 'A',
        optionText: dto.option_a?.trim() ?? '',
        isCorrect: dto.correct_option_key?.toUpperCase().trim() === 'A',
      },
      {
        optionKey: 'B',
        optionText: dto.option_b?.trim() ?? '',
        isCorrect: dto.correct_option_key?.toUpperCase().trim() === 'B',
      },
      {
        optionKey: 'C',
        optionText: dto.option_c?.trim() ?? '',
        isCorrect: dto.correct_option_key?.toUpperCase().trim() === 'C',
      },
      {
        optionKey: 'D',
        optionText: dto.option_d?.trim() ?? '',
        isCorrect: dto.correct_option_key?.toUpperCase().trim() === 'D',
      },
    ].filter((option) => option.optionText.length > 0);

    if (manualOptions.length < 2) {
      throw new BadRequestException(
        'Cần tối thiểu 2 đáp án cho câu hỏi listening.',
      );
    }
    if (!manualOptions.some((option) => option.isCorrect)) {
      throw new BadRequestException(
        'Bạn phải chỉ định correct_option_key hợp lệ.',
      );
    }
    return manualOptions;
  }

  async createToeicListeningManualItem(
    dto: ToeicManualListeningCreateDto,
    audioFile?: Express.Multer.File,
    imageFile?: Express.Multer.File,
  ): Promise<ToeicManualListeningCreateResponseDto> {
    const repository = await this.getOrCreateToeicRepositoryForImport(
      dto,
      'listening',
    );
    const options = this.parseListeningOptionsFromDto(dto);

    const existingLast = await this.prisma.examRepositoryItem.findFirst({
      where: { repository_id: repository.id },
      orderBy: { item_order: 'desc' },
      select: { item_order: true },
    });
    const nextOrder = Number(
      dto.item_order ?? Number(existingLast?.item_order ?? 0) + 1,
    );

    const audioUrl = audioFile?.filename
      ? `/uploads/certificate/${basename(audioFile.filename)}`
      : null;
    const imageUrl = imageFile?.filename
      ? `/uploads/certificate/${basename(imageFile.filename)}`
      : null;

    const createdItem = await this.prisma.examRepositoryItem.create({
      data: {
        repository_id: repository.id,
        item_order: nextOrder,
        item_type: 'single_choice',
        title: dto.title?.trim() || null,
        stem: dto.stem.trim(),
        reading_passage: dto.reading_passage?.trim() || null,
        estimated_seconds: Number(dto.estimated_seconds ?? 45),
        media_audio_url: audioUrl,
        media_image_url: imageUrl,
        score_weight: 1,
      },
      select: { id: true, item_order: true },
    });

    await this.prisma.examRepositoryOption.createMany({
      data: options.map((option, index) => ({
        item_id: createdItem.id,
        option_key: option.optionKey,
        option_text: option.optionText,
        is_correct: option.isCorrect,
        rationale: option.rationale ?? null,
        sort_order: index + 1,
      })),
    });

    const totalItems = await this.prisma.examRepositoryItem.count({
      where: { repository_id: repository.id },
    });

    await this.prisma.examRepository.update({
      where: { id: repository.id },
      data: {
        total_items: totalItems,
        estimated_minutes: Math.max(1, totalItems),
        pass_score: Math.max(1, Math.ceil(totalItems * 0.7)),
      },
    });

    return {
      repository_id: repository.id,
      slug: repository.slug,
      item_id: createdItem.id,
      item_order: createdItem.item_order,
      media_audio_url: audioUrl,
      media_image_url: imageUrl,
    };
  }

  private buildExplanationCachePath(cacheKey: string): string {
    const hash = createHash('sha256').update(cacheKey).digest('hex');
    return join(
      process.cwd(),
      'uploads',
      'certificate',
      'TOEIC',
      'toeic-reading-practice',
      'ai-cache',
      `${hash}.json`,
    );
  }

  private async readExplanationCache(
    cachePath: string,
  ): Promise<FileCacheExplanation | null> {
    try {
      await access(cachePath, fsConstants.F_OK);
      const raw = await readFile(cachePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return null;
      const record = parsed as Record<string, unknown>;
      const explanation =
        typeof record.explanation === 'string' ? record.explanation : undefined;
      const model = typeof record.model === 'string' ? record.model : undefined;
      const createdAt =
        typeof record.created_at === 'string' ? record.created_at : undefined;
      if (!explanation || !model || !createdAt) return null;
      return { explanation, model, created_at: createdAt };
    } catch {
      return null;
    }
  }

  private async writeExplanationCache(
    cachePath: string,
    payload: FileCacheExplanation,
  ): Promise<void> {
    await mkdir(
      join(
        process.cwd(),
        'uploads',
        'certificate',
        'TOEIC',
        'toeic-reading-practice',
        'ai-cache',
      ),
      {
        recursive: true,
      },
    );
    await writeFile(cachePath, JSON.stringify(payload), 'utf8');
  }

  private buildFallbackExplanation(
    stem: string,
    _selectedOptionText: string,
    correctOptionText: string,
    _isCorrect: boolean,
    baseExplanation: string | null,
  ): string {
    return buildExplanationFallback(stem, correctOptionText, baseExplanation);
  }

  private async callOllamaExplanation(
    prompt: string,
    model: string,
  ): Promise<string> {
    const baseUrl =
      process.env.OLLAMA_BASE_URL?.trim() ||
      'http://127.0.0.1:11434/api/generate';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: OLLAMA_EXPLANATION_OPTIONS,
        }),
      });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new BadRequestException(
        isAbort
          ? 'Ollama timeout — model phản hồi quá chậm. Thử lại sau.'
          : 'Không thể kết nối Ollama. Hãy kiểm tra service đang chạy.',
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Ollama trả về lỗi HTTP ${response.status}.`,
      );
    }

    const payload = (await response.json()) as OllamaGenerateResponse;
    const raw =
      typeof payload.response === 'string' ? payload.response.trim() : '';
    if (!raw || raw.length < 10) {
      throw new BadRequestException('Ollama không trả về nội dung giải thích.');
    }

    // Plain text response (no JSON parsing needed since format: json was removed)
    return this.normalizeExplanationForDisplay(raw);
  }

  private resolveOllamaModel(certType: string): string {
    const envKey = `OLLAMA_MODEL_${certType.toUpperCase().replace(/-/g, '_')}`;
    const certSpecificModel = process.env[envKey]?.trim();
    if (certSpecificModel && certSpecificModel.length > 0) {
      return certSpecificModel;
    }
    return process.env.OLLAMA_MODEL?.trim() || 'qwen3';
  }

  private extractTutorAnswerFromRaw(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';

    const decodeAnswer = (value: string): string =>
      value.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

    const parseJsonCandidate = (candidate: string): string | null => {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        if (!parsed || typeof parsed !== 'object') return null;
        const answer = (parsed as Record<string, unknown>).answer;
        if (typeof answer !== 'string') return null;
        const normalized = answer.trim();
        return normalized.length > 0 ? normalized : null;
      } catch {
        return null;
      }
    };

    const directParsed = parseJsonCandidate(trimmed);
    if (directParsed) return directParsed;

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      const fencedParsed = parseJsonCandidate(fencedMatch[1].trim());
      if (fencedParsed) return fencedParsed;
    }

    const inlineAnswerMatch = trimmed.match(/"answer"\s*:\s*"([\s\S]*?)"/i);
    if (inlineAnswerMatch?.[1]) {
      return decodeAnswer(inlineAnswerMatch[1]);
    }

    // Fallback to plain text if model did not follow JSON format strictly.
    return trimmed;
  }

  private buildTutorCachePath(cacheKey: string): string {
    const hash = createHash('sha256').update(cacheKey).digest('hex');
    return join(
      process.cwd(),
      'uploads',
      'certificate',
      'TOEIC',
      'toeic-reading-practice',
      'ai-cache',
      'tutor',
      `${hash}.json`,
    );
  }

  private async readTutorCache(
    cachePath: string,
  ): Promise<FileCacheTutorAnswer | null> {
    try {
      await access(cachePath, fsConstants.F_OK);
      const raw = await readFile(cachePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return null;
      const record = parsed as Record<string, unknown>;
      const answer =
        typeof record.answer === 'string' ? record.answer : undefined;
      const model = typeof record.model === 'string' ? record.model : undefined;
      const createdAt =
        typeof record.created_at === 'string' ? record.created_at : undefined;
      if (!answer || !model || !createdAt) return null;
      return { answer, model, created_at: createdAt };
    } catch {
      return null;
    }
  }

  private async writeTutorCache(
    cachePath: string,
    payload: FileCacheTutorAnswer,
  ): Promise<void> {
    await mkdir(
      join(
        process.cwd(),
        'uploads',
        'certificate',
        'TOEIC',
        'toeic-reading-practice',
        'ai-cache',
        'tutor',
      ),
      {
        recursive: true,
      },
    );
    await writeFile(cachePath, JSON.stringify(payload), 'utf8');
  }

  private buildTutorPrompt(
    certType: string,
    dto: CertificateTutorAskDto,
    enrollmentSummary: string,
  ): string {
    const hintOnly =
      dto.question.includes('[HINT_ONLY]') ||
      dto.learning_context?.includes('[HINT_ONLY]') === true;
    const fullExplanation =
      dto.question.includes('[FULL_EXPLANATION]') ||
      dto.learning_context?.includes('[FULL_EXPLANATION]') === true;

    // Strip internal tags before sending to model
    const cleanQuestion = dto.question
      .trim()
      .replace(/^\[FULL_EXPLANATION\]\s*/i, '')
      .replace(/^\[HINT_ONLY\]\s*/i, '')
      .trim();

    return buildTutorPromptFromFile({
      certType,
      questionText: cleanQuestion,
      learningContext: dto.learning_context,
      enrollmentSummary,
      topicKey: dto.topic_key,
      hintOnly,
      fullExplanation,
      concise: dto.concise,
    });
  }

  private normalizeHintOnlyQuestionInput(dto: CertificateTutorAskDto): string {
    const rawQuestion = dto.question.trim();
    const sentenceMatch = rawQuestion.match(/Câu\s*hỏi:\s*([^\n\r]+)/i);
    const selectedMatch = rawQuestion.match(
      /Học\s*viên\s*chọn:\s*[A-D][.):-]?\s*([^\n\r]+)/i,
    );

    const sentence = sentenceMatch?.[1]?.trim() ?? '';
    const selectedText = selectedMatch?.[1]?.trim() ?? '';

    const optionMatches = Array.from(
      (dto.learning_context ?? '').matchAll(
        /(?:^|\n)\s*[A-D][.):-]\s*([^\n\r]+)/gi,
      ),
    )
      .map((match) => match[1]?.trim() ?? '')
      .filter((value) => value.length > 0);

    const uniqueOptions = Array.from(new Set(optionMatches));
    const alternatives = selectedText
      ? uniqueOptions.filter(
          (option) => option.toLowerCase() !== selectedText.toLowerCase(),
        )
      : uniqueOptions;

    const normalizedParts: string[] = [];
    if (sentence) {
      normalizedParts.push(`Câu gốc: ${sentence}`);
    }
    if (selectedText) {
      normalizedParts.push(`Lựa chọn học viên vừa chọn: ${selectedText}`);
    }
    if (alternatives.length > 0) {
      normalizedParts.push(
        `Các phương án còn lại (không gán chữ cái): ${alternatives.join(' | ')}`,
      );
    }

    normalizedParts.push(
      'Mục tiêu: giải thích vì sao lựa chọn học viên vừa chọn chưa phù hợp và gợi ý cách tự kiểm tra.',
    );

    return normalizedParts.join('\n');
  }

  private sanitizeHintOnlyLearningContext(context?: string): string {
    if (!context) return '';
    return context
      .split(/\r?\n/)
      .filter((line) => !/^\s*[A-D][.):-]\s+/.test(line))
      .join('\n')
      .trim();
  }

  private extractHintQuestionSentence(dto: CertificateTutorAskDto): string {
    const sentenceMatch = dto.question.match(/Câu\s*hỏi:\s*([^\n\r]+)/i);
    return sentenceMatch?.[1]?.trim() ?? '';
  }

  private extractHintQuestionEvidence(sentence: string): string {
    if (!sentence) return '';
    const normalized = sentence.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    const blankSnippetMatch = normalized.match(
      /[^.!?\n\r]{0,32}_{2,}[^.!?\n\r]{0,32}/,
    );
    if (blankSnippetMatch?.[0]) {
      return `"${blankSnippetMatch[0].trim()}"`;
    }

    const fallback = normalized.slice(0, 90).trim();
    return fallback.length > 0 ? `"${fallback}"` : '';
  }

  private inferHintOnlyGrammarSignal(sentence: string): string {
    const lowered = sentence.toLowerCase();

    if (
      /\busually\b|\boften\b|\balways\b|\bgenerally\b|\btypically\b/.test(
        lowered,
      )
    ) {
      return 'Dấu hiệu tần suất (usually/often/always) thường yêu cầu dạng động từ hiện tại đơn hoặc dạng từ phù hợp theo cấu trúc câu.';
    }

    if (/\bwill\b/.test(lowered)) {
      return 'Sau modal "will" thường cần động từ nguyên mẫu (bare infinitive), nên cần kiểm tra dạng từ của lựa chọn.';
    }

    if (/\bsince\b|\bfor\b|\balready\b|\byet\b|\bjust\b/.test(lowered)) {
      return 'Các dấu hiệu since/for/already/yet/just thường gắn với thì hoàn thành; hãy đối chiếu lại dạng động từ.';
    }

    if (/\bdespite\b|\bin spite of\b/.test(lowered)) {
      return 'Sau despite/in spite of thường đi với danh từ hoặc V-ing, không đi trực tiếp với mệnh đề đầy đủ nếu thiếu liên từ phù hợp.';
    }

    if (/\beffect\b/.test(lowered)) {
      return 'Câu có tín hiệu collocation với từ "effect"; cần kiểm tra cụm động từ đi kèm danh từ này thay vì chọn theo nghĩa rời rạc.';
    }

    if (/\bfrom\b\s+\bnext\b|\btomorrow\b|\bsoon\b/.test(lowered)) {
      return 'Dấu hiệu thời gian tương lai (from next/tomorrow/soon) cho thấy phải đối chiếu lại thì và dạng động từ cần dùng.';
    }

    return 'Hãy soi từ đứng trước/sau chỗ trống để xác định đúng loại từ cần điền (động từ/danh từ/tính từ/trạng từ) và quan hệ ngữ nghĩa trong câu.';
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private redactAlternativeOptionMentions(
    sentence: string,
    alternativeTexts: string[],
  ): string {
    let redacted = sentence;
    for (const optionText of alternativeTexts) {
      if (optionText.length < 2) continue;
      const pattern = new RegExp(
        `\\b${this.escapeRegExp(optionText)}\\b`,
        'gi',
      );
      redacted = redacted.replace(pattern, 'một phương án khác');
    }

    return redacted.replace(/\s{2,}/g, ' ').trim();
  }

  private buildHintOnlyFallbackAnswer(
    dto: CertificateTutorAskDto,
    selectedText: string,
  ): string {
    const sentence = this.extractHintQuestionSentence(dto);
    const evidence = this.extractHintQuestionEvidence(sentence);
    const grammarSignal = this.inferHintOnlyGrammarSignal(sentence);

    const summary = selectedText
      ? `Kết luận nhanh: lựa chọn "${selectedText}" hiện chưa khớp với yêu cầu của chỗ trống.`
      : 'Kết luận nhanh: lựa chọn hiện tại chưa khớp với yêu cầu của chỗ trống.';

    const evidenceLine = evidence
      ? `Dấu hiệu trong câu: ${evidence}.`
      : 'Hãy nhìn vào cụm từ đứng trước/sau chỗ trống để tìm dạng từ cần điền.';

    return this.limitAnswerSentences(
      [
        summary,
        evidenceLine,
        grammarSignal,
        'Đối chiếu lại vai trò ngữ pháp của từ bạn chọn trước khi thử đáp án khác.',
      ].join(' '),
      4,
    );
  }

  private extractHintOptionTexts(dto: CertificateTutorAskDto): {
    selectedText: string;
    alternativeTexts: string[];
  } {
    const selectedMatch = dto.question.match(
      /Học\s*viên\s*chọn:\s*[A-D][.):-]?\s*([^\n\r]+)/i,
    );
    const selectedText = selectedMatch?.[1]?.trim().toLowerCase() ?? '';

    const optionMatches = Array.from(
      (dto.learning_context ?? '').matchAll(
        /(?:^|\n)\s*[A-D][.):-]\s*([^\n\r]+)/gi,
      ),
    )
      .map((match) => (match[1] ?? '').trim().toLowerCase())
      .filter((value) => value.length > 0);

    const uniqueOptions = Array.from(new Set(optionMatches));
    const alternativeTexts = selectedText
      ? uniqueOptions.filter((option) => option !== selectedText)
      : uniqueOptions;

    return { selectedText, alternativeTexts };
  }

  private isHintAnswerMentioningAlternativeOption(
    answer: string,
    dto: CertificateTutorAskDto,
  ): boolean {
    const loweredAnswer = answer.toLowerCase();
    const { alternativeTexts } = this.extractHintOptionTexts(dto);
    return alternativeTexts.some(
      (optionText) =>
        optionText.length >= 2 && loweredAnswer.includes(optionText),
    );
  }

  private limitAnswerSentences(answer: string, maxSentences: number): string {
    if (maxSentences <= 0) return answer.trim();
    const normalized = answer.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (sentences.length <= maxSentences) return normalized;
    return sentences.slice(0, maxSentences).join(' ').trim();
  }

  private stripCjkCharacters(answer: string): string {
    return answer
      .replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private sanitizeTutorDisplayAnswer(answer: string): string {
    return answer
      .replace(/\bB[1-9]\s*[.):-]\s*/gi, '')
      .replace(/(?:^|\n)\s*Step\s*[1-9]\s*[.):-]\s*/gi, '\n')
      .replace(/Kết luận ngay\s*/gi, '')
      .replace(
        /(lựa chọn học viên hiện tại là|lựa chọn hiện tại của học viên là)\s*(đúng|sai|chưa phù hợp)\b[^.\n]*\.?/gi,
        '',
      )
      .replace(
        /Phân tích lần lượt từng phương án/gi,
        'Phân tích từng phương án',
      )
      .replace(/^[ \t]+|[ \t]+$/gm, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private sanitizeHintOnlyAnswer(
    answer: string,
    dto: CertificateTutorAskDto,
  ): string {
    const normalized = this.stripCjkCharacters(answer);
    const { selectedText, alternativeTexts } = this.extractHintOptionTexts(dto);

    const rawSentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const keptSentences = rawSentences
      .map((sentence) => {
        const loweredSentence = sentence.toLowerCase();
        if (this.isHintSuggestingAlternativeAnswer(loweredSentence)) {
          return '';
        }

        const mentionsAlternative = alternativeTexts.some(
          (optionText) =>
            optionText.length >= 2 && loweredSentence.includes(optionText),
        );

        const rewritten = mentionsAlternative
          ? this.redactAlternativeOptionMentions(sentence, alternativeTexts)
          : sentence;

        if (!rewritten) return '';
        if (this.isHintOnlyLeak(rewritten)) return '';

        return rewritten;
      })
      .filter((sentence) => sentence.length > 0);

    const sanitized = this.limitAnswerSentences(keptSentences.join(' '), 3);
    if (sanitized.length > 0) return sanitized;

    return this.buildHintOnlyFallbackAnswer(dto, selectedText);
  }

  private isOverGenericHintOnlyAnswer(answer: string): boolean {
    const lowered = answer.toLowerCase();
    return (
      lowered.includes('chưa phù hợp với ngữ pháp/ngữ nghĩa của chỗ trống') &&
      lowered.includes('kiểm tra lại dạng từ')
    );
  }

  private isLowQualityTutorAnswer(answer: string): boolean {
    const trimmed = answer.trim();
    // Quá ngắn (dưới 20 ký tự)
    if (trimmed.length < 20) return true;
    // Chỉ là một chữ cái đáp án: "A", "B.", "C:", "D -" — không có text đi kèm
    if (/^[A-D][.):-]?\s*$/i.test(trimmed)) return true;
    // Chỉ 1-2 từ
    if (trimmed.split(/\s+/).filter((w) => w.length > 0).length <= 2)
      return true;
    return false;
  }

  private isHintOnlyLeak(answer: string): boolean {
    const lowered = answer.toLowerCase();
    return (
      lowered.includes('đáp án đúng') ||
      lowered.includes('dap an dung') ||
      lowered.includes('đáp án là') ||
      lowered.includes('dap an la') ||
      lowered.includes('correct answer') ||
      lowered.includes('the answer is') ||
      lowered.includes('correct form') ||
      lowered.includes('should be') ||
      /(?:^|\s)[A-D][.):-](?:\s|$)/.test(answer)
    );
  }

  private isHintSuggestingAlternativeAnswer(answer: string): boolean {
    const lowered = answer.toLowerCase();
    return (
      lowered.includes('hãy chọn') ||
      lowered.includes('nên chọn') ||
      lowered.includes('chọn đáp án') ||
      lowered.includes('chọn phương án') ||
      lowered.includes('phương án còn lại') ||
      lowered.includes('đổi sang') ||
      lowered.includes('thử đáp án')
    );
  }

  private isFallbackStyleTutorAnswer(answer: string): boolean {
    const lowered = answer.toLowerCase();
    return (
      lowered.includes('fallback') ||
      lowered.includes('chưa gọi được ai model') ||
      lowered.includes('hệ thống ai tạm thời') ||
      lowered.includes('chưa kết nối được ollama')
    );
  }

  private isLikelyEnglishTutorAnswer(answer: string): boolean {
    // Nếu có dấu tiếng Việt → chắc chắn là tiếng Việt, không reject
    const hasVietnameseDiacritics =
      /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
        answer,
      );
    if (hasVietnameseDiacritics) return false;

    // Không có dấu → kiểm tra xem có phải HOÀN TOÀN tiếng Anh không
    // (tỷ lệ từ tiếng Anh > 40% mới reject, tránh reject giải thích TOEIC có chứa từ tiếng Anh)
    const words = answer
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (words.length === 0) return false;
    const englishWords = words.filter((w) =>
      /^[a-zA-Z''-]+$/.test(w.replace(/[.,!?;:()[\]{}""'']/g, '')),
    );
    return englishWords.length / words.length > 0.65;
  }

  private isFullExplanationTutorRequest(dto: CertificateTutorAskDto): boolean {
    return (
      dto.question.includes('[FULL_EXPLANATION]') ||
      dto.learning_context?.includes('[FULL_EXPLANATION]') === true
    );
  }

  private isLowQualityFullExplanationAnswer(answer: string): boolean {
    const trimmed = answer.trim();
    // Quá ngắn
    if (trimmed.length < 60) return true;
    // Kết thúc đột ngột bằng liên từ (câu bị cắt ngang)
    const endsAbruptly = /(vì|because|do|nên|since|as)\s*$/i.test(trimmed);
    if (endsAbruptly) return true;
    // Phải có ít nhất thảo luận về đáp án (dùng nhiều pattern khác nhau để bắt 3b/7b)
    const hasAnswerDiscussion =
      /đáp\s*án/i.test(trimmed) ||
      /câu\s*trả\s*lời/i.test(trimmed) ||
      /correct/i.test(trimmed) ||
      /chính\s*xác/i.test(trimmed) ||
      /[A-D][.):-]\s/i.test(trimmed) ||
      /phương\s*án/i.test(trimmed) ||
      /lựa\s*chọn/i.test(trimmed);
    return !hasAnswerDiscussion;
  }

  private isHintOnlyTutorRequest(dto: CertificateTutorAskDto): boolean {
    return (
      dto.question.includes('[HINT_ONLY]') ||
      dto.learning_context?.includes('[HINT_ONLY]') === true
    );
  }

  private shouldRejectCachedTutorAnswer(
    answer: string,
    dto: CertificateTutorAskDto,
  ): boolean {
    if (this.isLowQualityTutorAnswer(answer)) return true;
    if (this.isFallbackStyleTutorAnswer(answer)) return true;
    if (this.isLikelyEnglishTutorAnswer(answer)) return true;
    if (
      this.isFullExplanationTutorRequest(dto) &&
      !dto.concise &&
      this.isLowQualityFullExplanationAnswer(answer)
    ) {
      return true;
    }
    if (
      this.isHintOnlyTutorRequest(dto) &&
      (this.isHintOnlyLeak(answer) ||
        this.isHintSuggestingAlternativeAnswer(answer) ||
        this.isHintAnswerMentioningAlternativeOption(answer, dto) ||
        this.isOverGenericHintOnlyAnswer(answer))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Primary: OpenRouter (fast, no local dependency)
   * Fallback: Ollama (local, khi OpenRouter unavailable)
   * Toggle: AI_TUTOR_PROVIDER=openrouter|ollama (default: openrouter)
   */
  private async callOllamaTutorAnswer(
    prompt: string,
    model: string,
  ): Promise<string> {
    // ── Primary: Groq (cloud) ──
    try {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) throw new Error('GROQ_API_KEY missing');

      const groqRes = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 600,
          }),
        },
      );

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        throw new Error(`Groq API error: ${groqRes.status} - ${errText}`);
      }

      const data = (await groqRes.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content ?? '';
      const answer = this.extractTutorAnswerFromRaw(content);
      const finalAnswer = answer.length > 0 ? answer : content.trim();
      if (finalAnswer.length >= 5) {
        return finalAnswer;
      }
    } catch (err) {
      const logger = new Logger('CertificateEnrollmentService');
      logger.warn(`Groq tutor failed, falling back to Ollama: ${String(err)}`);
    }

    // ── Fallback: Ollama local ──
    const baseUrl =
      process.env.OLLAMA_BASE_URL?.trim() ||
      'http://127.0.0.1:11434/api/generate';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: OLLAMA_TUTOR_OPTIONS,
        }),
      });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new BadRequestException(
        isAbort
          ? 'Ollama timeout — model phản hồi quá chậm. Thử lại sau.'
          : 'Không thể kết nối Ollama cho trợ lý AI. Hãy kiểm tra service đang chạy.',
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Ollama trả về lỗi HTTP ${response.status}.`,
      );
    }

    const payload = (await response.json()) as OllamaGenerateResponse;
    const raw =
      typeof payload.response === 'string' ? payload.response.trim() : '';
    if (!raw) {
      throw new BadRequestException('Ollama không trả về nội dung tư vấn.');
    }

    // Try JSON extraction first (backward compat), then fall back to plain text
    const normalizedAnswer = this.extractTutorAnswerFromRaw(raw);
    const finalAnswer = normalizedAnswer.length > 0 ? normalizedAnswer : raw;

    // Chỉ reject khi hoàn toàn rỗng — không reject dựa trên quality/ngôn ngữ
    // (các check này đã từng gây reject nhầm với qwen3)
    if (finalAnswer.trim().length < 5) {
      throw new BadRequestException('Ollama trả về nội dung rỗng.');
    }

    return finalAnswer.trim();
  }

  private buildTutorFallbackAnswer(dto: CertificateTutorAskDto): string {
    const hintOnly =
      dto.question.includes('[HINT_ONLY]') ||
      dto.learning_context?.includes('[HINT_ONLY]') === true;
    return buildTutorFallback(hintOnly, dto.concise ?? false);
  }

  private summarizeToeicSkillAccuracy(rows: Array<{
    skill_area: string;
    toeic_part: number;
    correct_count: number;
    total_questions: number;
  }>): {
    listening: { correct: number; total: number; accuracy: number };
    reading: { correct: number; total: number; accuracy: number };
  } {
    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;

    for (const row of rows) {
      const isListening =
        row.skill_area === 'listening' ||
        (row.toeic_part >= 1 && row.toeic_part <= 4);
      if (isListening) {
        listeningCorrect += row.correct_count ?? 0;
        listeningTotal += row.total_questions ?? 0;
      } else {
        readingCorrect += row.correct_count ?? 0;
        readingTotal += row.total_questions ?? 0;
      }
    }

    const listeningAccuracy =
      listeningTotal > 0
        ? Math.round((listeningCorrect / listeningTotal) * 100)
        : 0;
    const readingAccuracy =
      readingTotal > 0
        ? Math.round((readingCorrect / readingTotal) * 100)
        : 0;

    return {
      listening: {
        correct: listeningCorrect,
        total: listeningTotal,
        accuracy: listeningAccuracy,
      },
      reading: {
        correct: readingCorrect,
        total: readingTotal,
        accuracy: readingAccuracy,
      },
    };
  }

  private async loadToeicSkillWindowStats(
    enrollmentId: number,
    from: Date,
    to: Date,
  ): Promise<{
    listening: { correct: number; total: number; accuracy: number };
    reading: { correct: number; total: number; accuracy: number };
  }> {
    const rows = await this.prisma.toeicPracticePartSession.findMany({
      where: {
        enrollment_id: enrollmentId,
        completed_at: {
          gte: from,
          lt: to,
        },
      },
      select: {
        skill_area: true,
        toeic_part: true,
        correct_count: true,
        total_questions: true,
      },
    });

    return this.summarizeToeicSkillAccuracy(rows);
  }

  async getToeicSkillFeedback(accountId: number): Promise<{
    answer: string;
    model: string;
    source: 'cache' | 'ollama' | 'fallback' | 'static';
    window: 'week' | 'day';
    current: { listening: number; reading: number };
    previous: { listening: number; reading: number };
  }> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: {
        student_id: studentId,
        cert_type: 'toeic',
        status: 'active',
      },
      select: { id: true },
      orderBy: { enrolled_at: 'desc' },
    });

    if (!enrollment) {
      return {
        answer:
          'Bạn chưa có enrollment TOEIC đang hoạt động. Hãy đăng ký để bắt đầu ôn luyện.',
        model: 'system',
        source: 'static',
        window: 'week',
        current: { listening: 0, reading: 0 },
        previous: { listening: 0, reading: 0 },
      };
    }

    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000,
    );
    const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const prevDayStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const weekStats = await this.loadToeicSkillWindowStats(
      enrollment.id,
      weekStart,
      now,
    );
    const prevWeekStats = await this.loadToeicSkillWindowStats(
      enrollment.id,
      prevWeekStart,
      weekStart,
    );

    const weekTotal =
      weekStats.listening.total + weekStats.reading.total;
    const prevWeekTotal =
      prevWeekStats.listening.total + prevWeekStats.reading.total;

    let window: 'week' | 'day' = 'week';
    let currentStats = weekStats;
    let previousStats = prevWeekStats;

    if (weekTotal === 0) {
      const dayStats = await this.loadToeicSkillWindowStats(
        enrollment.id,
        dayStart,
        now,
      );
      const prevDayStats = await this.loadToeicSkillWindowStats(
        enrollment.id,
        prevDayStart,
        dayStart,
      );
      const dayTotal = dayStats.listening.total + dayStats.reading.total;

      if (dayTotal === 0) {
        return {
          answer:
            'Bạn chưa hoàn thành bất kỳ bài tập ôn luyện nào gần đây. Hãy bắt đầu ôn tập để hệ thống có thể phân tích năng lực và đưa ra nhận xét chính xác nhất!',
          model: 'system',
          source: 'static',
          window: 'day',
          current: { listening: 0, reading: 0 },
          previous: { listening: 0, reading: 0 },
        };
      }

      window = 'day';
      currentStats = dayStats;
      previousStats = prevDayStats;
    } else if (prevWeekTotal === 0) {
      const dayStats = await this.loadToeicSkillWindowStats(
        enrollment.id,
        dayStart,
        now,
      );
      const prevDayStats = await this.loadToeicSkillWindowStats(
        enrollment.id,
        prevDayStart,
        dayStart,
      );
      const dayTotal = dayStats.listening.total + dayStats.reading.total;
      const prevDayTotal =
        prevDayStats.listening.total + prevDayStats.reading.total;

      if (dayTotal > 0 && prevDayTotal > 0) {
        window = 'day';
        currentStats = dayStats;
        previousStats = prevDayStats;
      }
    }

    const currentListening = currentStats.listening.accuracy;
    const currentReading = currentStats.reading.accuracy;
    const previousListening = previousStats.listening.accuracy;
    const previousReading = previousStats.reading.accuracy;

    const periodLabel = window === 'week' ? '7 ngày gần nhất' : '24 giờ gần nhất';
    const previousLabel = window === 'week' ? '7 ngày trước đó' : '24 giờ trước đó';

    const comparisonHint =
      previousStats.listening.total + previousStats.reading.total > 0
        ? `So sánh với ${previousLabel}: Nghe ${previousListening}%, Đọc ${previousReading}%.`
        : `Chưa có đủ dữ liệu ở ${previousLabel} để so sánh xu hướng.`;

    const prompt = [
      `Dữ liệu ${periodLabel}: Nghe ${currentListening}% (${currentStats.listening.correct}/${currentStats.listening.total}), Đọc ${currentReading}% (${currentStats.reading.correct}/${currentStats.reading.total}).`,
      comparisonHint,
      'Hãy phân tích ngắn gọn (2-3 câu) điểm mạnh/yếu và nêu rõ mức cải thiện hoặc giảm sút nếu có. Kết thúc bằng 1 lời khuyên thực tế nhất để cải thiện.',
      'Không chào hỏi, đi thẳng vào vấn đề.',
    ].join(' ');

    const topicKey = [
      'toeic_skill_feedback_v2',
      window,
      String(currentListening),
      String(currentReading),
      String(previousListening),
      String(previousReading),
      String(currentStats.listening.total),
      String(currentStats.reading.total),
      String(previousStats.listening.total),
      String(previousStats.reading.total),
    ].join('_');

    const tutorResult = await this.askCertificateTutor(accountId, {
      cert_type: 'toeic',
      question: prompt,
      topic_key: topicKey,
      concise: true,
    });

    return {
      answer: tutorResult.answer,
      model: tutorResult.model,
      source: tutorResult.source,
      window,
      current: { listening: currentListening, reading: currentReading },
      previous: { listening: previousListening, reading: previousReading },
    };
  }

  async askCertificateTutor(
    accountId: number,
    dto: CertificateTutorAskDto,
  ): Promise<CertificateTutorAskResponseDto> {
    const certType = dto.cert_type.trim().toLowerCase();
    if (!CERT_TUTOR_ALLOWED_CERT_TYPES.has(certType)) {
      throw new BadRequestException(
        'cert_type không được hỗ trợ cho trợ lý AI.',
      );
    }

    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: {
        student_id: studentId,
        cert_type: certType,
        status: 'active',
      },
      select: {
        current_score: true,
        target_score: true,
        progress_percent: true,
      },
      orderBy: { enrolled_at: 'desc' },
    });

    const enrollmentSummary = enrollment
      ? `Tiến độ hiện tại: progress=${enrollment.progress_percent}%, current_score=${enrollment.current_score ?? 0}, target_score=${enrollment.target_score ?? 0}.`
      : 'Học viên chưa có enrollment active cho chứng chỉ này.';

    const model = this.resolveOllamaModel(certType);

    // Build RAG context for tutor (skip when clearly off-topic to avoid latency)
    const OFF_TOPIC_KEYWORDS =
      /\b(c\+\+|python|java\b|javascript|php|sql|mysql|linux|docker|git|toán|vật lý|hóa học|sinh học|lịch sử|địa lý|covid|chính trị|nấu ăn|thể thao|bóng đá)\b/i;
    const isOffTopic = OFF_TOPIC_KEYWORDS.test(dto.question);
    const ragContext = isOffTopic
      ? null
      : await this.ragRetrieval
          .buildRagContext(dto.question, certType)
          .catch(() => null);

    const ragBlock = ragContext
      ? `\n\nTÀI LIỆU THAM KHẢO:\n${ragContext.contextBlock}`
      : '';
    const mergedLearningContext = [dto.learning_context?.trim(), ragBlock]
      .filter((value) => Boolean(value && value.length > 0))
      .join('\n');

    const basePrompt = this.buildTutorPrompt(
      certType,
      { ...dto, learning_context: mergedLearningContext },
      enrollmentSummary,
    );
    const hintOnlyMode = this.isHintOnlyTutorRequest(dto);

    const cacheKey = [
      CERT_TUTOR_PROMPT_VERSION,
      certType,
      dto.topic_key?.trim() ?? '',
      dto.learning_context?.trim() ?? '',
      dto.question.trim(),
      String(Boolean(dto.concise)),
      `hint_only=${String(hintOnlyMode)}`,
      model,
    ].join('|');
    const cachePath = this.buildTutorCachePath(cacheKey);

    // ── 1. DB cache (ToeicNodeQuestionCache) — nhanh nhất, persist qua restart ──
    const dbTopicKey = dto.topic_key?.trim() ?? '';
    if (dbTopicKey.length > 0) {
      const dbCached = await this.prisma.toeicNodeQuestionCache.findUnique({
        where: { topic_key: dbTopicKey },
      });
      if (dbCached && dbCached.ai_answer.trim().length > 24) {
        const cleaned = this.sanitizeTutorDisplayAnswer(dbCached.ai_answer);
        const dbAnswer = cleaned.length > 0 ? cleaned : dbCached.ai_answer;
        if (!this.shouldRejectCachedTutorAnswer(dbAnswer, dto)) {
          return {
            cert_type: certType,
            answer: dbAnswer,
            model: dbCached.model,
            source: 'cache',
          };
        }

        // Cache cũ chất lượng thấp/stale -> xoá để lần gọi hiện tại regenerate.
        void this.prisma.toeicNodeQuestionCache
          .delete({ where: { topic_key: dbTopicKey } })
          .catch(() => {});
      }
    }

    // ── 2. File cache — secondary (backward-compatible) ─────────────────────
    const cached = await this.readTutorCache(cachePath);

    if (cached) {
      const cleanedCachedAnswer = this.sanitizeTutorDisplayAnswer(
        cached.answer,
      );
      const cachedAnswer =
        cleanedCachedAnswer.length > 0 ? cleanedCachedAnswer : cached.answer;

      if (this.shouldRejectCachedTutorAnswer(cachedAnswer, dto)) {
        // Bỏ qua file cache kém chất lượng để thử sinh lại từ model.
      } else {
        // Đưa file-cache lên DB để lần sau dùng DB (nếu có topic_key)
        if (dbTopicKey.length > 0) {
          void this.prisma.toeicNodeQuestionCache
            .upsert({
              where: { topic_key: dbTopicKey },
              update: { ai_answer: cachedAnswer, model: cached.model },
              create: {
                topic_key: dbTopicKey,
                cert_type: certType,
                ai_answer: cachedAnswer,
                model: cached.model,
              },
            })
            .catch(() => {});
        }
        return {
          cert_type: certType,
          answer: cachedAnswer,
          model: cached.model,
          source: 'cache',
        };
      }
    }

    // Attempt to get answer from Ollama — single attempt, no quality-based retry
    // (quality retries caused 15-24s waits; cache handles deduplication)
    try {
      let answer = await this.callOllamaTutorAnswer(basePrompt, model);
      answer = this.sanitizeTutorDisplayAnswer(answer);

      if (
        answer.length === 0 ||
        this.isFallbackStyleTutorAnswer(answer) ||
        this.shouldRejectCachedTutorAnswer(answer, dto)
      ) {
        throw new Error('Empty, fallback-style, or low-quality answer');
      }

      // Persist to file cache and DB
      await this.writeTutorCache(cachePath, {
        answer,
        model,
        created_at: new Date().toISOString(),
      });

      if (dbTopicKey.length > 0) {
        void this.prisma.toeicNodeQuestionCache
          .upsert({
            where: { topic_key: dbTopicKey },
            update: { ai_answer: answer, model },
            create: {
              topic_key: dbTopicKey,
              cert_type: certType,
              ai_answer: answer,
              model,
            },
          })
          .catch(() => {});
      }

      return {
        cert_type: certType,
        answer,
        model,
        source: 'ollama',
      };
    } catch {
      // Ollama failed or returned unusable content → return fallback
    }

    const fallback = this.buildTutorFallbackAnswer(dto);
    return {
      cert_type: certType,
      answer: fallback,
      model,
      source: 'fallback',
    };
  }

  /**
   * Streaming chat tutor:
   *   Primary:  qwen2.5:14b qua QWEN_BASE_URL (OpenAI-compatible, cloud)
   *   Fallback: Groq llama-3.3-70b-versatile
   *
   * Biến env liên quan (không trùng với Ollama local):
   *   QWEN_BASE_URL  = http://...server.../v1   (remote cloud)
   *   QWEN_MODEL     = qwen2.5:14b
   *   GROQ_API_KEY   = gsk_...
   *   OLLAMA_MODEL / OLLAMA_BASE_URL = qwen3 local (không đụng tới)
   */
  async streamChatTutor(
    accountId: number,
    dto: import('./dto/certificate.dto').ToeicChatGroqDto,
    res: import('express').Response,
  ): Promise<void> {
    const logger = new Logger('StreamChatTutor');

    // ── SSE helpers ────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendToken = (token: string) =>
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    const sendDone = () => {
      res.write('data: [DONE]\n\n');
      res.end();
    };
    const sendError = (msg: string) => {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    };

    // ── Build context: DB query + RAG chạy SONG SONG để giảm latency ─────────
    //
    // Phát hiện off-topic trước để skip RAG (tiết kiệm 2-4s embed time).
    // Off-topic: câu hỏi không liên quan TOEIC/tiếng Anh — model sẽ từ chối
    // ngay trong 1 câu nên không cần RAG context.
    const OFF_TOPIC_KEYWORDS =
      /\b(c\+\+|python|java\b|javascript|php|sql|mysql|linux|docker|git|toán|vật lý|hóa học|sinh học|lịch sử|địa lý|covid|chính trị|nấu ăn|thể thao|bóng đá)\b/i;
    const isOffTopic = OFF_TOPIC_KEYWORDS.test(dto.user_message);

    // Chạy DB query và RAG song song (RAG chỉ khi on-topic)
    const [question, ragResult] = await Promise.all([
      this.prisma.toeicPracticeQuestion.findUnique({
        where: { id: dto.question_id },
        // Không include options — không cần thiết cho chatbot context
        select: {
          id: true,
          stem: true,
          ai_explanation: true,
          explanation: true,
          reading_passage: true,
        },
      }),
      isOffTopic
        ? Promise.resolve(null)
        : this.ragRetrieval.buildRagContext(dto.user_message, 'toeic').catch(
            () => null,
          ),
    ]);

    if (!question) {
      sendError('Không tìm thấy câu hỏi.');
      return;
    }

    const explanation =
      question.ai_explanation || question.explanation || 'Chưa có giải thích.';
    const readingPassage = question.reading_passage
      ? `Đoạn văn: ${question.reading_passage.slice(0, 600)}`
      : '';

    const ragBlock =
      ragResult
        ? `\n\nTÀI LIỆU THAM KHẢO:\n${ragResult.contextBlock}`
        : '';

    // ── Phát hiện user đồng ý xem ví dụ ─────────────────────────────────────
    const lastAssistant =
      (dto.chat_history ?? [])
        .slice()
        .reverse()
        .find((m) => m.role === 'assistant')?.content ?? '';
    const assistantAskedExample =
      lastAssistant.includes('muốn xem ví dụ') ||
      lastAssistant.includes('cần ví dụ') ||
      lastAssistant.includes('ví dụ minh hoạ');
    const userConfirmedExample =
      assistantAskedExample &&
      /^(có|ok|okay|dạ|được|sure|yes|vâng|muốn|cho|cần|hiểu)/i.test(
        dto.user_message.trim(),
      );

    // ── System prompt ─────────────────────────────────────────────────────────
    // QUAN TRỌNG: Toàn bộ prompt PHẢI viết tiếng Việt CÓ DẤU đầy đủ.
    // qwen2.5 bắt chước ngôn ngữ của system prompt — nếu prompt không dấu
    // thì model cũng trả lời không dấu. Không được dùng tiếng Việt không dấu.
    const systemPrompt = [
      // [1] Vai trò + ngôn ngữ bắt buộc — đặt TRƯỚC TIÊN để model ưu tiên cao nhất
      'Bạn là trợ lý học tiếng Anh TOEIC/IELTS chuyên nghiệp.',
      'NGÔN NGỮ BẮT BUỘC: Luôn luôn trả lời bằng tiếng Việt CÓ DẤU đầy đủ (ví dụ: "được", "có thể", "giải thích"). TUYỆT ĐỐI không dùng tiếng Việt không dấu (ví dụ: "duoc", "co the", "giai thich"). Giữ nguyên thuật ngữ tiếng Anh chuyên ngành.',
      '',
      // [2] Phạm vi — QUAN TRỌNG: Chỉ xây dựng xung quanh câu hỏi đang hiển thị
      'PHẠM VI: Chỉ hỗ trợ câu hỏi liên quan đến câu hỏi và đáp án đang hiển thị, hoặc ngữ pháp/từ vựng liên quan.',
      'Nếu câu hỏi hoàn toàn không liên quan (đời sống, lập trình, khoa học...): trả lời ngắn "Tôi chỉ giúp được câu hỏi tiếng Anh đang làm." rồi dừng — đây không ảnh hưởng đến câu hỏi kế tiếp.',
      '',
      // [3] Ngữ cảnh câu hỏi (cắt ngắn để giảm token)
      readingPassage,
      `Giải thích đáp án: ${explanation.slice(0, 500)}`,
      ragBlock,
      '',
      // [4] Quy tắc phản hồi
      'QUY TẮC:',
      '- Ngắn gọn, đúng trọng tâm, không dùng markdown (không **, ##, không gạch đầu dòng).',
      '- Dựa vào giải thích đáp án và tài liệu tham khảo ở trên; bổ sung kiến thức nếu phù hợp.',
      userConfirmedExample
        ? '- VÍ DỤ: BẮT BUỘC câu ví dụ phải viết 100% bằng tiếng Anh (không chèn tiếng Việt vào giữa câu ví dụ). Sau khi viết xong câu ví dụ tiếng Anh, dùng tiếng Việt để giải thích. Format: "Ví dụ: \'She ___ looking at him\' -> Đáp án \'is\' đúng vì \'she\' là chủ ngữ..."'
        : '- Không tự thêm ví dụ. Nếu cần, kết thúc bằng: "Bạn muốn xem ví dụ minh hoạ không?"',
    ]
      .filter(Boolean)
      .join('\n');

    // Lọc bỏ các cặp off-topic khỏi history trước khi gửi cho LLM.
    // Vấn đề "context poisoning": nếu history chứa cặp
    //   [user: off-topic] → [assistant: "Tôi chỉ giúp được..."]
    // thì model đọc context đó và tiếp tục từ chối cả câu hỏi hợp lệ kế tiếp.
    // Fix: xóa cả user message lẫn assistant refusal khỏi history.
    const OFF_TOPIC_REFUSAL_RE =
      /^(Tôi chỉ giúp được|Xin lỗi.*chỉ hỗ trợ|Xin lỗi.*TOEIC)/i;

    const rawHistory = (dto.chat_history ?? []).slice(-4);
    const filteredHistory: { role: string; content: string }[] = [];
    for (let i = 0; i < rawHistory.length; i++) {
      const msg = rawHistory[i];
      // Nếu assistant trả lời từ chối off-topic: bỏ cả assistant message
      // lẫn user message đứng trước nó
      if (
        msg.role === 'assistant' &&
        OFF_TOPIC_REFUSAL_RE.test(msg.content.trim())
      ) {
        // Xóa user message đứng trước (nếu có)
        if (
          filteredHistory.length > 0 &&
          filteredHistory[filteredHistory.length - 1].role === 'user'
        ) {
          filteredHistory.pop();
        }
        // Bỏ qua assistant refusal này
        continue;
      }
      filteredHistory.push({ role: msg.role, content: msg.content });
    }

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...filteredHistory,
      { role: 'user', content: dto.user_message },
    ];

    // ── Primary: qwen2.5:14b streaming ────────────────────────────────────
    const qwenBase = (process.env.QWEN_BASE_URL ?? '').replace(/\/+$/, '');
    const qwenModel = process.env.QWEN_MODEL || 'qwen2.5:14b';

    if (qwenBase) {
      try {
        const controller = new AbortController();
        // Timeout 25s — đủ cho first token trên cloud model đã warm
        const tid = setTimeout(() => controller.abort(), 25_000);

        const qwenRes = await fetch(`${qwenBase}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: qwenModel,
            messages,
            stream: true,
            temperature: 0,        // 0 = deterministic, nhanh hơn
            max_tokens: 280,       // giảm nhẹ để first-token đến sớm hơn
            top_p: 0.8,            // giới hạn sampling space = nhanh hơn
            repetition_penalty: 1.05, // tránh lặp token
          }),
        });

        clearTimeout(tid);

        if (!qwenRes.ok || !qwenRes.body) {
          throw new Error(`Qwen HTTP ${qwenRes.status}`);
        }

        const reader = (qwenRes.body as unknown as AsyncIterable<Uint8Array>)[
          Symbol.asyncIterator
        ]
          ? (qwenRes.body as unknown as AsyncIterable<Uint8Array>)
          : null;

        if (!reader) throw new Error('No readable stream');

        const decoder = new TextDecoder();
        let buf = '';
        let hasContent = false;

        for await (const chunk of reader as AsyncIterable<Uint8Array>) {
          buf += decoder.decode(chunk, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') {
              sendDone();
              return;
            }
            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                sendToken(token);
                hasContent = true;
              }
            } catch {
              /* ignore parse errors */
            }
          }
        }

        if (!hasContent) throw new Error('Empty qwen stream');
        sendDone();
        return;
      } catch (err) {
        logger.warn(
          `Qwen stream failed, falling back to Groq: ${(err as Error).message}`,
        );
      }
    }

    // ── Fallback: Groq (non-streaming, send as single chunk) ───────────────
    try {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) throw new Error('GROQ_API_KEY missing');

      const groqRes = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.3,
            max_tokens: 600,
          }),
        },
      );

      const data = (await groqRes.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const answer = data.choices?.[0]?.message?.content ?? '';
      if (answer) sendToken(answer);
      sendDone();
    } catch (err) {
      logger.error(`Groq fallback also failed: ${(err as Error).message}`);
      sendError('Lỗi kết nối trợ lý AI. Vui lòng thử lại sau.');
    }
  }

  async chatGroqTutor(
    accountId: number,
    dto: import('./dto/certificate.dto').ToeicChatGroqDto,
  ) {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is missing in environment variables');
    }

    // Phát hiện off-topic sớm để skip RAG (tiết kiệm 2-4s embed time)
    const OFF_TOPIC_KEYWORDS =
      /\b(c\+\+|python|java\b|javascript|php|sql|mysql|linux|docker|git|toán|vật lý|hóa học|sinh học|lịch sử|địa lý|covid|chính trị|nấu ăn|thể thao|bóng đá)\b/i;
    const isOffTopic = OFF_TOPIC_KEYWORDS.test(dto.user_message);

    // Chạy DB query và RAG song song
    const [question, ragResult] = await Promise.all([
      this.prisma.toeicPracticeQuestion.findUnique({
        where: { id: dto.question_id },
        select: {
          id: true,
          ai_explanation: true,
          explanation: true,
          reading_passage: true,
        },
      }),
      isOffTopic
        ? Promise.resolve(null)
        : this.ragRetrieval
            .buildRagContext(dto.user_message, 'toeic')
            .catch(() => null),
    ]);

    if (!question) {
      throw new BadRequestException('Question not found');
    }

    const qwenExplanation =
      question.ai_explanation ||
      question.explanation ||
      'Chưa có giải thích chi tiết.';

    const readingPassageSnippet = question.reading_passage
      ? `Đoạn văn:\n${question.reading_passage.slice(0, 600)}`
      : '';

    const ragContextBlock = ragResult
      ? `\n\nTÀI LIỆU THAM KHẢO TỪ KNOWLEDGE BASE:\n${ragResult.contextBlock}`
      : '';

    // System prompt: Tiếng Việt CÓ DẤU — bắt buộc để model trả lời đúng ngôn ngữ
    const sysPrompt = [
      'Bạn là gia sư tiếng Anh TOEIC/IELTS chuyên nghiệp.',
      'NGÔN NGỮ BẮT BUỘC: Luôn luôn trả lời bằng tiếng Việt CÓ DẤU đầy đủ (ví dụ: "được", "có thể", "giải thích"). TUYỆT ĐỐI không dùng tiếng Việt không dấu (ví dụ: "duoc", "co the", "giai thich"). Giữ nguyên thuật ngữ tiếng Anh chuyên ngành.',
      '',
      'PHẠM VI: Chỉ hỗ trợ câu hỏi liên quan đến câu hỏi và đáp án đang hiển thị, hoặc ngữ pháp/từ vựng liên quan. Nếu câu hỏi hoàn toàn không liên quan: trả lời ngắn "Tôi chỉ giúp được câu hỏi tiếng Anh đang làm." rồi dừng.',
      '',
      readingPassageSnippet,
      `Giải thích đáp án: ${qwenExplanation.slice(0, 500)}`,
      ragContextBlock,
      '',
      'QUY TẮC:',
      '- Giải thích rõ ràng, ngắn gọn, đúng trọng tâm.',
      '- Không mâu thuẫn giải thích đã có. Không dùng markdown.',
      '- VÍ DỤ: Nếu học viên yêu cầu, BẮT BUỘC câu ví dụ phải viết 100% bằng tiếng Anh (không chèn tiếng Việt vào giữa câu ví dụ). Sau đó dùng tiếng Việt để giải thích. Format: "Ví dụ: \'She ___ looking at him\' -> Đáp án \'is\' đúng vì..."',
      '- Chỉ hỏi lại 1 câu ngắn nếu học viên có vẻ chưa hiểu.',
    ]
      .filter(Boolean)
      .join('\n');

    // Lọc bỏ các cặp off-topic khỏi history (fix context poisoning)
    const GROQ_OFF_TOPIC_REFUSAL_RE =
      /^(Tôi chỉ giúp được|Xin lỗi.*chỉ hỗ trợ|Xin lỗi.*TOEIC)/i;

    const groqRawHistory = (dto.chat_history ?? []).slice(-4);
    const groqFilteredHistory: { role: string; content: string }[] = [];
    for (let i = 0; i < groqRawHistory.length; i++) {
      const msg = groqRawHistory[i];
      if (
        msg.role === 'assistant' &&
        GROQ_OFF_TOPIC_REFUSAL_RE.test(msg.content.trim())
      ) {
        if (
          groqFilteredHistory.length > 0 &&
          groqFilteredHistory[groqFilteredHistory.length - 1].role === 'user'
        ) {
          groqFilteredHistory.pop();
        }
        continue;
      }
      groqFilteredHistory.push({ role: msg.role, content: msg.content });
    }

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: sysPrompt },
      ...groqFilteredHistory,
    ];

    messages.push({ role: 'user', content: dto.user_message });

    try {
      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.2,
            max_tokens: 400,
          }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Groq API error: ${res.status} - ${errText}`);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return {
        answer: data.choices?.[0]?.message?.content ?? '',
      };
    } catch (error) {
      console.error(`Groq Chat Tutor error: ${error}`);
      throw new BadRequestException(
        'Lỗi kết nối đến trợ lý AI. Vui lòng thử lại sau.',
      );
    }
  }

  // ─── Item-level cache key (không phụ thuộc vào option được chọn) ──────────
  private buildItemLevelCacheKey(
    itemId: number,
    updatedAt: Date,
    slug: string,
    model: string,
  ): string {
    return [
      'explain',
      slug,
      String(itemId),
      updatedAt.toISOString(),
      model,
    ].join('|');
  }

  // ─── Prompt giải thích đủ 4 đáp án, tối ưu cho tốc độ ────────────────────
  private buildFullExplanationPrompt(item: {
    stem: string;
    reading_passage: string | null;
    options: Array<{
      option_key: string;
      option_text: string;
      is_correct: boolean;
    }>;
  }): string {
    return buildExplanationPrompt({
      stem: item.stem,
      readingPassage: item.reading_passage,
      options: item.options,
      baseExplanation: null,
    });
  }

  private normalizeExplanationForDisplay(raw: string): string {
    const compact = raw
      .replace(/\r\n/g, '\n')
      .replace(/\u00A0/g, ' ')
      .trim();
    if (!compact) return '';

    let formatted = compact
      .replace(/\s*(Đáp án đúng\s*[:：-])/gi, '\n\n$1')
      .replace(
        /\s*((?:Phương án|Lựa chọn|Đáp án)\s*[A-D]\s*[:：-])/gi,
        '\n\n$1',
      )
      .replace(/\s*([A-D][).:-]\s)/g, '\n\n$1')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .trim();

    if (!formatted.includes('\n\n')) {
      const sentences = formatted
        .replace(/([.!?])\s+/g, '$1\n\n')
        .split('\n\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (sentences.length >= 4) {
        formatted = sentences.join('\n\n');
      }
    }

    return formatted;
  }

  private getOrCreateInFlightExplanation(
    cacheKey: string,
    factory: () => Promise<string>,
  ): Promise<string> {
    const existing = this.inFlightExplanationGenerations.get(cacheKey);
    if (existing) return existing;

    const task = (async () => {
      try {
        return await factory();
      } finally {
        this.inFlightExplanationGenerations.delete(cacheKey);
      }
    })();

    this.inFlightExplanationGenerations.set(cacheKey, task);
    return task;
  }

  private async persistGeneratedExplanation(
    itemId: number,
    explanation: string,
    _cachePath: string, // kept for signature compatibility — file cache removed
    _model: string,
  ): Promise<void> {
    await this.prisma.examRepositoryItem
      .update({
        where: { id: itemId },
        data: {}, // removed ai_explanation update
      })
      .catch(() => {});
  }

  private triggerToeicLookaheadPrefetch(
    repositoryId: number,
    currentItemOrder: number,
    slug: string,
  ): void {
    void (async () => {
      const nextItems = await this.prisma.examRepositoryItem.findMany({
        where: {
          repository_id: repositoryId,
          item_order: { gt: currentItemOrder },
        },
        orderBy: { item_order: 'asc' },
        take: TOEIC_LOOKAHEAD_PREFETCH_COUNT,
        select: {
          id: true,
          updated_at: true,
          stem: true,
          reading_passage: true,
          options: {
            orderBy: { sort_order: 'asc' },
            select: {
              option_key: true,
              option_text: true,
              is_correct: true,
            },
          },
        },
      });

      for (
        let i = 0;
        i < nextItems.length;
        i += TOEIC_LOOKAHEAD_PREFETCH_BATCH_SIZE
      ) {
        const batch = nextItems.slice(
          i,
          i + TOEIC_LOOKAHEAD_PREFETCH_BATCH_SIZE,
        );
        await Promise.all(
          batch.map((nextItem) => this.prefetchItemExplanation(nextItem, slug)),
        );
      }
    })().catch(() => {});
  }

  // ─── Prefetch: được gọi bởi ToeicExplanationPrefetchService ───────────────
  async prefetchItemExplanation(
    item: {
      id: number;
      updated_at: Date;
      stem: string;
      reading_passage: string | null;

      options: Array<{
        option_key: string;
        option_text: string;
        is_correct: boolean;
      }>;
    },
    slug: string,
  ): Promise<void> {
    // Bỏ qua câu hỏi chưa có đáp án đúng
    if (!item.options.some((o) => o.is_correct)) return;

    // No db cache logic anymore since exams don't save AI explanations

    const model = this.resolveOllamaModel('toeic');
    const cacheKey = this.buildItemLevelCacheKey(
      item.id,
      item.updated_at,
      slug,
      model,
    );
    const cachePath = this.buildExplanationCachePath(cacheKey);

    // ── 2. Đã có file cache → đưa lên DB rồi bỏ qua ─────────────────────
    const fileCached = await this.readExplanationCache(cachePath);
    if (fileCached) {
      const normalized = this.normalizeExplanationForDisplay(
        fileCached.explanation,
      );
      return;
    }

    // ── 3. Chưa có cache → gọi Ollama → lưu cả DB lẫn file ──────────────
    const prompt = this.buildFullExplanationPrompt(item);
    try {
      const explanation = await this.getOrCreateInFlightExplanation(
        cacheKey,
        async () => {
          const generated = await this.callOllamaExplanation(prompt, model);
          return this.normalizeExplanationForDisplay(generated);
        },
      );
      await this.persistGeneratedExplanation(
        item.id,
        explanation,
        cachePath,
        model,
      );
    } catch {
      // Lỗi prefetch → im lặng, để request thật sẽ tạo lại sau
    }
  }

  // ─── API chính: chỉ trả explanation khi user chọn đúng ───────────────────
  async explainToeicAnswerWithOllama(
    accountId: number,
    slug: string,
    dto: ToeicExplainAnswerDto,
  ): Promise<ToeicExplainAnswerResponseDto> {
    await this.getStudentId(accountId);

    const item = await this.prisma.examRepositoryItem.findUnique({
      where: { id: dto.item_id },
      include: {
        repository: true,
        options: { orderBy: { sort_order: 'asc' } },
      },
    });

    if (
      !item ||
      item.repository.slug !== slug ||
      item.repository.cert_type !== 'toeic'
    ) {
      throw new NotFoundException(
        'Không tìm thấy câu hỏi TOEIC để giải thích.',
      );
    }

    const selectedOption = item.options.find(
      (option) => Number(option.id) === Number(dto.selected_option_id),
    );
    if (!selectedOption) {
      throw new BadRequestException(
        'selected_option_id không thuộc câu hỏi này.',
      );
    }

    const correctOption = item.options.find((option) => option.is_correct);
    if (!correctOption) {
      throw new BadRequestException('Câu hỏi chưa cấu hình đáp án đúng.');
    }

    // Ưu tiên prefetch vài câu kế tiếp theo ngữ cảnh người dùng, không chặn response.
    this.triggerToeicLookaheadPrefetch(
      item.repository_id,
      item.item_order,
      slug,
    );

    const isCorrect = Number(selectedOption.id) === Number(correctOption.id);

    // ── Nếu chọn sai → không trả explanation, tiết kiệm hoàn toàn Ollama ──
    if (!isCorrect) {
      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
        is_correct: false,
        explanation: null,
        model: this.resolveOllamaModel('toeic'),
        source: 'skipped',
      };
    }

    // ── User chọn đúng → trả explanation đủ 4 đáp án ──────────────────────
    const model = this.resolveOllamaModel('toeic');

    // Removed DB cache check since exams don't save explanations

    // ── 2. File cache — secondary ─────────────────────────────────────────
    const cacheKey = this.buildItemLevelCacheKey(
      item.id,
      item.updated_at,
      slug,
      model,
    );
    const cachePath = this.buildExplanationCachePath(cacheKey);
    const cached = await this.readExplanationCache(cachePath);

    if (cached) {
      const normalized = this.normalizeExplanationForDisplay(
        cached.explanation,
      );
      // Đưa file-cache lên DB để lần sau dùng DB
      void this.prisma.examRepositoryItem
        .update({
          where: { id: item.id },
          data: {}, // removed ai_explanation
        })
        .catch(() => {});
      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
        is_correct: true,
        explanation: encryptString(normalized || cached.explanation),
        model: cached.model,
        source: 'cache',
      };
    }

    // Chưa có cache → gọi Ollama
    const prompt = this.buildFullExplanationPrompt({
      stem: item.stem,
      reading_passage: item.reading_passage,
      options: item.options,
    });

    try {
      const explanation = await this.getOrCreateInFlightExplanation(
        cacheKey,
        async () => {
          const generated = await this.callOllamaExplanation(prompt, model);
          return this.normalizeExplanationForDisplay(generated);
        },
      );

      await this.persistGeneratedExplanation(
        item.id,
        explanation,
        cachePath,
        model,
      );

      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
        is_correct: true,
        explanation: encryptString(explanation),
        model,
        source: 'ollama',
      };
    } catch {
      // Fallback khi Ollama lỗi
      const fallback = this.buildFallbackExplanation(
        item.stem,
        selectedOption.option_text,
        correctOption.option_text,
        true,
        null,
      );
      const normalizedFallback = this.normalizeExplanationForDisplay(fallback);

      // Không cache fallback để lần sau vẫn thử lại Ollama
      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
        is_correct: true,
        explanation: encryptString(normalizedFallback || fallback),
        model,
        source: 'fallback',
      };
    }
  }

  async getToeicExamRepositoryByType(
    accountId: number,
    examType: string,
  ): Promise<ToeicRepositoryDetailResponseDto> {
    if (examType !== 'listening' && examType !== 'reading') {
      throw new BadRequestException(
        'examType không hợp lệ. Chỉ nhận listening hoặc reading.',
      );
    }

    await this.getStudentId(accountId);

    // Only fetch full exam repositories (imported by teachers)
    const candidates = await this.prisma.examRepository.findMany({
      where: {
        cert_type: 'toeic',
        is_published: true,
        skill_area: examType,
        content_type: 'exam_simulation',
      },
      select: {
        slug: true,
        metadata: true,
        created_at: true,
      },
    });

    if (candidates.length === 0) {
      // Fallback: also try mock_test for backward compat
      const fallback = await this.prisma.examRepository.findFirst({
        where: {
          cert_type: 'toeic',
          is_published: true,
          skill_area: examType,
          content_type: { in: ['mock_test', 'exam_simulation'] },
        },
        orderBy: { updated_at: 'desc' },
        select: { slug: true },
      });
      if (!fallback) {
        throw new NotFoundException(
          `Chưa có bộ đề TOEIC ${examType} được publish trong hệ thống.`,
        );
      }
      return this.getToeicRepositoryDetail(accountId, fallback.slug);
    }

    // Sort candidates by exam_year ASC, then created_at ASC
    const sorted = candidates.sort((a, b) => {
      const aYear = Number((a.metadata as any)?.exam_year ?? 9999);
      const bYear = Number((b.metadata as any)?.exam_year ?? 9999);
      if (aYear !== bYear) return aYear - bYear;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    // For now, return the first (earliest year) exam.
    // TODO: track which exams the student completed and pick the next one.
    const selected = sorted[0];
    return this.getToeicRepositoryDetail(accountId, selected.slug);
  }

  async getToeicRepositoryOverview(
    accountId: number,
  ): Promise<ToeicRepositoryOverviewResponseDto> {
    const studentId = await this.getStudentId(accountId);

    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
      orderBy: { enrolled_at: 'desc' },
    });

    const currentScore = Number(enrollment?.current_score ?? 300);
    const targetScore = Number(
      enrollment?.target_score ?? Math.max(600, currentScore),
    );
    const planState = this.parseToeicPlanStateFromJson(
      enrollment?.toeic_plan_state,
      [],
      {
        current_score: enrollment?.current_score,
        target_score: enrollment?.target_score,
      },
    );
    const projectedScore = Number(
      planState.current_score + planState.total_boost,
    );
    const effectiveScore = this.getEffectiveToeicScore(enrollment, planState);

    const repositories = await this.prisma.examRepository.findMany({
      where: { cert_type: 'toeic', is_published: true },
      orderBy: [
        { target_score_min: 'asc' },
        { skill_area: 'asc' },
        { id: 'asc' },
      ],
    });

    const items: ToeicRepositoryOverviewItemDto[] = repositories
      .filter((repo) =>
        isInScoreWindow(
          repo.target_score_min,
          repo.target_score_max,
          targetScore,
        ),
      )
      .map((repo) => {
        const metadata = (repo.metadata ?? {}) as Prisma.JsonObject;
        const milestoneScore = Number(
          readJsonNumber(metadata, 'milestone_score') ??
            repo.target_score_min ??
            targetScore,
        );
        const unlockScore = Number(
          readJsonNumber(metadata, 'unlock_score') ??
            repo.target_score_min ??
            milestoneScore,
        );
        const topicKeyFromMetadata = readJsonString(metadata, 'topic_key');
        const fallbackTopicKey = `${repo.skill_area ?? 'reading'}.repo_${repo.id}`;
        const topicKey = topicKeyFromMetadata ?? fallbackTopicKey;
        const questionCount = Number(repo.total_items ?? 0);

        return {
          repository_id: Number(repo.id),
          slug: String(repo.slug),
          topic_key: topicKey,
          title: String(repo.title),
          description: repo.description ?? null,
          skill_area: String(repo.skill_area ?? 'reading'),
          milestone_score: milestoneScore,
          unlock_score: unlockScore,
          question_count: questionCount,
          estimated_minutes: Number(
            repo.estimated_minutes ?? Math.max(1, questionCount),
          ),
          is_unlocked: effectiveScore >= unlockScore,
        } satisfies ToeicRepositoryOverviewItemDto;
      });

    return {
      current_score: currentScore,
      target_score: targetScore,
      projected_score: projectedScore,
      items,
    };
  }

  async getToeicRepositoryDetail(
    accountId: number,
    slug: string,
  ): Promise<ToeicRepositoryDetailResponseDto> {
    await this.getStudentId(accountId);

    const repo: ToeicRepositoryWithItems | null =
      await this.prisma.examRepository.findUnique({
        where: { slug },
        include: {
          items: {
            orderBy: { item_order: 'asc' },
            include: { options: { orderBy: { sort_order: 'asc' } } },
          },
        },
      });

    if (!repo || repo.cert_type !== 'toeic' || !repo.is_published) {
      throw new NotFoundException('Không tìm thấy bộ đề TOEIC.');
    }

    // Check for an active (unsubmitted) exam session for this user + repo.
    const activeSession = await this.prisma.toeicExamSession.findFirst({
      where: {
        account_id: accountId,
        repository_id: repo.id,
        submitted_at: null,
      },
      orderBy: { started_at: 'desc' },
      select: { id: true },
    });

    const metadata = (repo.metadata ?? {}) as Prisma.JsonObject;

    const totalItems = Number(repo.total_items ?? repo.items?.length ?? 0);
    const items = (repo.items ?? []).map((item) => {
      const parsedPart =
        this.readPartFromMetadata(item.metadata) ??
        this.detectToeicPartFromText(
          item.title ?? undefined,
          item.stem,
          item.reading_passage ?? undefined,
        );

      return {
        id: Number(item.id),
        item_order: Number(item.item_order),
        part: parsedPart ?? null,
        item_type: String(item.item_type),
        title: item.title ?? null,
        stem: encryptString(String(item.stem)),
        reading_passage: item.reading_passage
          ? encryptString(item.reading_passage)
          : null,
        media_audio_url: item.media_audio_url ?? null,
        media_image_url: item.media_image_url ?? null,
        estimated_seconds: item.estimated_seconds ?? null,
        score_weight: Number(item.score_weight ?? 1),
        options: (item.options ?? []).map((opt) => ({
          id: Number(opt.id),
          option_key: String(opt.option_key),
          option_text: encryptString(String(opt.option_text)),
          is_correct: Boolean(opt.is_correct),
          rationale: opt.rationale ? encryptString(opt.rationale) : null,
          option_audio_url: opt.option_audio_url ?? null,
          sort_order: Number(opt.sort_order ?? 1),
        })),
      };
    });

    const answerKeyConfiguredItems = items.filter((item) =>
      item.options.some((opt) => opt.is_correct),
    ).length;
    const answerKeyMissingItems = Math.max(
      0,
      items.length - answerKeyConfiguredItems,
    );

    return {
      repository_id: Number(repo.id),
      slug: String(repo.slug),
      title: String(repo.title),
      description: repo.description ?? null,
      skill_area: repo.skill_area ?? null,
      full_audio_url: (metadata.full_audio_url as string) ?? null,
      milestone_score: Number(
        metadata.milestone_score ?? repo.target_score_min ?? 0,
      ),
      estimated_minutes: Number(
        repo.estimated_minutes ?? Math.max(1, totalItems),
      ),
      pass_score: Number(
        repo.pass_score ?? Math.max(1, Math.ceil(totalItems * 0.7)),
      ),
      total_items: totalItems,
      answer_key_configured_items: answerKeyConfiguredItems,
      answer_key_missing_items: answerKeyMissingItems,
      answer_key_ready: items.length > 0 && answerKeyMissingItems === 0,
      active_session_id: activeSession?.id ?? null,
      items,
    };
  }

  async submitToeicRepositoryAnswers(
    accountId: number,
    slug: string,
    dto: ToeicRepositorySubmitDto,
  ): Promise<ToeicRepositorySubmitResponseDto> {
    const studentId = await this.getStudentId(accountId);

    const repository: ToeicRepositoryWithItemsForSubmit | null =
      await this.prisma.examRepository.findUnique({
        where: { slug },
        include: {
          items: {
            include: { options: true },
          },
        },
      });

    if (
      !repository ||
      repository.cert_type !== 'toeic' ||
      !repository.is_published
    ) {
      throw new NotFoundException('Không tìm thấy bộ đề TOEIC để nộp bài.');
    }

    if (!Array.isArray(dto.answers) || dto.answers.length === 0) {
      throw new BadRequestException('Danh sách câu trả lời không hợp lệ.');
    }

    const enrollment = await this.getOrCreateActiveToeicEnrollment(studentId);
    const currentState = this.parseToeicPlanStateFromJson(
      enrollment.toeic_plan_state,
      (enrollment.topicProgress ?? []).map(
        (topicProgress) => topicProgress.topic_key,
      ),
      {
        current_score: enrollment.current_score,
        target_score: enrollment.target_score,
      },
    );

    const answerByItem = new Map<number, number>();
    for (const ans of dto.answers) {
      answerByItem.set(Number(ans.item_id), Number(ans.option_id));
    }

    let correctCount = 0;
    const totalCount = Number(
      repository.total_items ?? repository.items?.length ?? 0,
    );

    for (const item of repository.items ?? []) {
      const selectedOptionId = answerByItem.get(Number(item.id));
      if (!selectedOptionId) continue;
      const selected = (item.options ?? []).find(
        (opt) => Number(opt.id) === selectedOptionId,
      );
      if (selected?.is_correct) correctCount += 1;
    }

    // TOEIC score calculation:
    // Each skill (Listening / Reading) is scored 5–495, total 10–990.
    // For a full 100-question exam: each correct = ~4.9 points.
    // For partial exams: scale proportionally.
    // Minimum score floor = 5 (per ETS standard).
    const FULL_SKILL_QUESTIONS = 100; // questions in a full skill exam
    const MAX_SKILL_SCORE = 495;
    const MIN_SKILL_SCORE = 5;

    const gradableItems = (repository.items ?? []).filter((item) =>
      (item.options ?? []).some((opt) => opt.is_correct),
    );
    const gradableTotal = gradableItems.length;

    // Use gradable items for score calculation (skip items without official answers)
    let gradableCorrect = 0;
    for (const item of gradableItems) {
      const selectedOptionId = answerByItem.get(Number(item.id));
      if (!selectedOptionId) continue;
      const selected = (item.options ?? []).find(
        (opt) => Number(opt.id) === selectedOptionId,
      );
      if (selected?.is_correct) gradableCorrect += 1;
    }

    const scaledScore =
      gradableTotal > 0
        ? Math.round(
            (gradableCorrect / Math.max(gradableTotal, FULL_SKILL_QUESTIONS)) *
              MAX_SKILL_SCORE,
          )
        : 0;

    const newSkillScore = Math.max(
      MIN_SKILL_SCORE,
      Math.min(MAX_SKILL_SCORE, scaledScore),
    );

    // Build the updated plan: set the skill score directly (not boost-based)
    const isListeningExam = repository.skill_area === 'listening';
    const isReadingExam = repository.skill_area === 'reading';

    // 1. Calculate previous individual baseline scores from the state
    const initialTotalBaseline = Number(currentState.current_score ?? enrollment.current_score ?? 300);
    const prevListeningBaseline = currentState.listening_baseline ?? Math.round(initialTotalBaseline / 2);
    const prevReadingBaseline = currentState.reading_baseline ?? Math.round(initialTotalBaseline / 2);
    const prevHasTakenListening = !!currentState.has_taken_listening_exam;
    const prevHasTakenReading = !!currentState.has_taken_reading_exam;

    // 2. Update baseline scores based on this mock exam attempt
    let listening_baseline = prevListeningBaseline;
    let reading_baseline = prevReadingBaseline;
    let has_taken_listening_exam = prevHasTakenListening;
    let has_taken_reading_exam = prevHasTakenReading;

    if (isListeningExam) {
      listening_baseline = newSkillScore;
      has_taken_listening_exam = true;
    }
    if (isReadingExam) {
      reading_baseline = newSkillScore;
      has_taken_reading_exam = true;
    }

    // 3. Compute the new overall baseline score (current_score)
    let resolvedCurrentScore = 0;
    if (!has_taken_listening_exam && !has_taken_reading_exam) {
      resolvedCurrentScore = listening_baseline + reading_baseline;
    } else {
      const lScore = has_taken_listening_exam ? listening_baseline : 0;
      const rScore = has_taken_reading_exam ? reading_baseline : 0;
      resolvedCurrentScore = lScore + rScore;
    }
    resolvedCurrentScore = Math.min(990, Math.max(10, resolvedCurrentScore));

    const rawNewTotalScore = resolvedCurrentScore;
    const prevTotalScore = Number(currentState.current_score ?? enrollment.current_score ?? 0);
    const gainedScore = Math.max(0, resolvedCurrentScore - prevTotalScore);

    const targetScore = Number(currentState.target_score ?? enrollment.target_score ?? 0);

    // Student clears the milestone when their exam score meets/beats the target.
    const canChangeTarget = rawNewTotalScore >= targetScore && targetScore > 0;

    const updatedPlan = await this.saveToeicPlanState(accountId, {
      current_score: resolvedCurrentScore,
      target_score: targetScore,
      total_boost: Number(currentState.total_boost ?? 0),
      listening_sessions: isListeningExam
        ? Number(currentState.listening_sessions ?? 0) + 1
        : Number(currentState.listening_sessions ?? 0),
      reading_sessions: isReadingExam
        ? Number(currentState.reading_sessions ?? 0) + 1
        : Number(currentState.reading_sessions ?? 0),
      foundation_completed: currentState.foundation_completed,
      foundation_skipped: currentState.foundation_skipped,
      first_guide_shown: currentState.first_guide_shown,
      listening_baseline,
      reading_baseline,
      has_taken_listening_exam,
      has_taken_reading_exam,
      has_activity: true,
    });

    // Persist latest exam score on active TOEIC enrollment(s).
    // When the student reaches target, reset reserve points for the next cycle.
    const enrollmentPatchData = {
      exam_score: rawNewTotalScore,
      current_score: resolvedCurrentScore,
      ...(canChangeTarget ? { reserve_points: 0 } : {}),
    } as Prisma.CertificateEnrollmentUpdateManyMutationInput;

    await this.prisma.certificateEnrollment
      .updateMany({
        where: {
          student_id: studentId,
          cert_type: 'toeic',
          status: 'active',
        },
        data: enrollmentPatchData,
      })
      .catch(() => {});

    const passScore = Number(
      repository.pass_score ?? Math.max(1, Math.ceil(totalCount * 0.7)),
    );
    return {
      repository_id: Number(repository.id),
      slug: String(repository.slug),
      skill_area: repository.skill_area ?? null,
      correct_count: correctCount,
      total_count: totalCount,
      pass_score: passScore,
      is_passed: correctCount >= passScore,
      gained_score: gainedScore,
      exam_score: rawNewTotalScore,
      can_change_target: canChangeTarget,
      projected_score: Number(
        updatedPlan.current_score + updatedPlan.total_boost,
      ),
      updated_plan: updatedPlan,
    };
  }
}
