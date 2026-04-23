import axios from 'axios';
import apiClient from '../api/apiClient';

const STUDY_ROOM_MODES = ['audio', 'video', 'focus'] as const;
const STUDY_ROOM_COVER_TYPES = ['image', 'youtube'] as const;

type AnyRecord = Record<string, unknown>;

export type StudyRoomMode = (typeof STUDY_ROOM_MODES)[number];
export type StudyRoomCoverType = (typeof STUDY_ROOM_COVER_TYPES)[number];

export interface StudyRoomHostInfo {
  accountId: number;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface StudyRoomParticipantPresence {
  accountId: number;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  isHost: boolean;
  micOn: boolean;
  cameraOn: boolean;
  handRaised: boolean;
  joinedAt: string;
  lastSeenAt: string;
}

export interface StudyRoomSummary {
  roomId: number;
  title: string;
  roomMode: StudyRoomMode;
  coverType: StudyRoomCoverType | null;
  coverUrl: string | null;
  isPublic: boolean;
  maxParticipants: number;
  requiresPassword: boolean;
  createdAt: string;
  onlineCount: number;
  availableSlots: number;
  host: StudyRoomHostInfo | null;
}

export interface StudyRoomDetail extends StudyRoomSummary {
  participants: StudyRoomParticipantPresence[];
  viewerCanModerate: boolean;
  joined: boolean;
}

export interface StudyRoomAccessInfo {
  accessGranted: boolean;
  room: StudyRoomSummary & {
    participants: StudyRoomParticipantPresence[];
  };
}

export interface PublicStudyRoom {
  roomId: number;
  title: string;
  roomMode: StudyRoomMode;
  coverUrl: string | null;
  coverType: StudyRoomCoverType | null;
  maxParticipants: number;
  currentParticipantsCount: number;
  hasPassword: boolean;
}

export interface CreatedPublicStudyRoom extends PublicStudyRoom {
  hostId: number | null;
  createdAt: string;
}

export interface JoinPublicRoomResult {
  success: boolean;
  roomId: number;
  participantId: number;
  livekitToken: string;
  livekitUrl: string | null;
}

export interface StudyRoomListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StudyRoomListResponse {
  items: StudyRoomSummary[];
  meta: StudyRoomListMeta;
}

export interface StudyRoomSessionRecord {
  id: number;
  roomId: number | null;
  roomTitle: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
}

export interface MyStudyStats {
  totals: {
    totalMinutes: number;
    totalSessions: number;
    updatedAt: string | null;
  };
  streak: {
    current: number;
    longest: number;
    lastStudyDate: string | null;
  };
  leaderboard: {
    score: number;
    rank: number | null;
  };
  recentSessions: StudyRoomSessionRecord[];
}

export interface StudyLeaderboardEntry {
  rank: number;
  accountId: number;
  fullName: string;
  avatarUrl: string | null;
  score: number;
  totalMinutes: number;
  totalSessions: number;
  currentStreak: number;
  updatedAt: string | null;
}

export interface StudyLeaderboardResponse {
  items: StudyLeaderboardEntry[];
}

export interface StudyRoomTimerState {
  roomId: number;
  startedBy: number;
  startedAt: string;
  endsAt: string;
  durationSeconds: number;
}

export interface StudyRoomParticipantStateUpdate {
  roomId: number;
  participant: StudyRoomParticipantPresence;
}

export interface StudyRoomJoinRealtimeResult {
  success: boolean;
  room: StudyRoomSummary & {
    participants: StudyRoomParticipantPresence[];
    viewerCanModerate: boolean;
  };
  participant: StudyRoomParticipantPresence | null;
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === 'object' && value !== null;
}

function asRecord(value: unknown): AnyRecord {
  return isRecord(value) ? value : {};
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
}

function toNullableString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toInteger(value: unknown, fallback = 0): number {
  return Math.trunc(toNumberValue(value, fallback));
}

function toIsoDateString(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date(0).toISOString();
}

function normalizeRoomMode(value: unknown): StudyRoomMode {
  const mode = toStringValue(value).toLowerCase();
  if ((STUDY_ROOM_MODES as readonly string[]).includes(mode)) {
    return mode as StudyRoomMode;
  }

  return 'focus';
}

function normalizeCoverType(value: unknown): StudyRoomCoverType | null {
  const coverType = toStringValue(value).toLowerCase();
  if ((STUDY_ROOM_COVER_TYPES as readonly string[]).includes(coverType)) {
    return coverType as StudyRoomCoverType;
  }

  return null;
}

function parseStudyRoomHost(value: unknown): StudyRoomHostInfo | null {
  const payload = asRecord(value);
  if (!payload.accountId && !payload.account_id) {
    return null;
  }

  return {
    accountId: toInteger(payload.accountId ?? payload.account_id),
    fullName: toNullableString(payload.fullName ?? payload.full_name),
    avatarUrl: toNullableString(payload.avatarUrl ?? payload.avatar_url),
  };
}

function parseParticipantPresence(value: unknown): StudyRoomParticipantPresence {
  const payload = asRecord(value);

  return {
    accountId: toInteger(payload.accountId ?? payload.account_id),
    fullName: toNullableString(payload.fullName ?? payload.full_name),
    avatarUrl: toNullableString(payload.avatarUrl ?? payload.avatar_url),
    email: toNullableString(payload.email),
    isHost: toBooleanValue(payload.isHost ?? payload.is_host),
    micOn: toBooleanValue(payload.micOn ?? payload.mic_on),
    cameraOn: toBooleanValue(payload.cameraOn ?? payload.camera_on),
    handRaised: toBooleanValue(payload.handRaised ?? payload.hand_raised),
    joinedAt: toIsoDateString(payload.joinedAt ?? payload.joined_at),
    lastSeenAt: toIsoDateString(payload.lastSeenAt ?? payload.last_seen_at),
  };
}

function parseStudyRoomSummary(value: unknown): StudyRoomSummary {
  const payload = asRecord(value);

  return {
    roomId: toInteger(payload.roomId ?? payload.room_id),
    title: toStringValue(payload.title),
    roomMode: normalizeRoomMode(payload.roomMode ?? payload.room_mode),
    coverType: normalizeCoverType(payload.coverType ?? payload.cover_type),
    coverUrl: toNullableString(payload.coverUrl ?? payload.cover_url),
    isPublic: toBooleanValue(payload.isPublic ?? payload.is_public, true),
    maxParticipants: toInteger(payload.maxParticipants ?? payload.max_participants, 0),
    requiresPassword: toBooleanValue(
      payload.requiresPassword ?? payload.requires_password ?? payload.has_password,
      false,
    ),
    createdAt: toIsoDateString(payload.createdAt ?? payload.created_at),
    onlineCount: toInteger(payload.onlineCount ?? payload.online_count ?? payload.current_participants_count, 0),
    availableSlots: toInteger(payload.availableSlots ?? payload.available_slots, 0),
    host: parseStudyRoomHost(payload.host),
  };
}

function parsePublicRoom(value: unknown): PublicStudyRoom {
  const payload = asRecord(value);

  return {
    roomId: toInteger(payload.room_id ?? payload.roomId),
    title: toStringValue(payload.title),
    roomMode: normalizeRoomMode(payload.room_mode ?? payload.roomMode),
    coverUrl: toNullableString(payload.cover_url ?? payload.coverUrl),
    coverType: normalizeCoverType(payload.cover_type ?? payload.coverType),
    maxParticipants: toInteger(payload.max_participants ?? payload.maxParticipants, 0),
    currentParticipantsCount: toInteger(
      payload.current_participants_count ?? payload.currentParticipantsCount,
      0,
    ),
    hasPassword: toBooleanValue(payload.has_password ?? payload.hasPassword),
  };
}

function parseStudyRoomListMeta(value: unknown): StudyRoomListMeta {
  const payload = asRecord(value);

  return {
    page: Math.max(1, toInteger(payload.page, 1)),
    limit: Math.max(1, toInteger(payload.limit, 12)),
    total: Math.max(0, toInteger(payload.total, 0)),
    totalPages: Math.max(1, toInteger(payload.totalPages ?? payload.total_pages, 1)),
  };
}

function parseStudySessionRecord(value: unknown): StudyRoomSessionRecord {
  const payload = asRecord(value);

  return {
    id: toInteger(payload.id),
    roomId: payload.roomId === null || payload.room_id === null
      ? null
      : toInteger(payload.roomId ?? payload.room_id),
    roomTitle: toNullableString(payload.roomTitle ?? payload.room_title),
    startedAt: toIsoDateString(payload.startedAt ?? payload.started_at),
    endedAt: payload.endedAt === null || payload.ended_at === null
      ? null
      : toIsoDateString(payload.endedAt ?? payload.ended_at),
    durationMinutes: Math.max(
      0,
      toInteger(payload.durationMinutes ?? payload.duration_minutes, 0),
    ),
  };
}

function parseJoinRealtimeResult(value: unknown): StudyRoomJoinRealtimeResult {
  const payload = asRecord(value);
  const roomPayload = asRecord(payload.room);

  const participants = Array.isArray(roomPayload.participants)
    ? roomPayload.participants.map(parseParticipantPresence)
    : [];

  return {
    success: toBooleanValue(payload.success, false),
    room: {
      ...parseStudyRoomSummary(roomPayload),
      participants,
      viewerCanModerate: toBooleanValue(
        roomPayload.viewerCanModerate ?? roomPayload.viewer_can_moderate,
        false,
      ),
    },
    participant: payload.participant ? parseParticipantPresence(payload.participant) : null,
  };
}

function extractApiErrorMessage(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (Array.isArray(payload)) {
    const parts = payload
      .map((item) => extractApiErrorMessage(item))
      .filter((item): item is string => Boolean(item));
    return parts.length > 0 ? parts.join(', ') : null;
  }

  if (isRecord(payload)) {
    const message = payload.message;
    const error = payload.error;

    return (
      extractApiErrorMessage(message) ??
      extractApiErrorMessage(error) ??
      null
    );
  }

  return null;
}

export function getStudyRoomErrorMessage(
  error: unknown,
  fallback = 'Unexpected study room error',
): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = extractApiErrorMessage(error.response?.data);
    if (responseMessage) {
      return responseMessage;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function parseStudyRoomSocketAck(value: unknown): StudyRoomJoinRealtimeResult {
  return parseJoinRealtimeResult(value);
}

export const studyRoomService = {
  async getPublicRooms(params?: {
    search?: string;
    roomMode?: StudyRoomMode;
  }): Promise<PublicStudyRoom[]> {
    const response = await apiClient.get('/rooms', {
      params: {
        search: params?.search?.trim() || undefined,
        room_mode: params?.roomMode,
      },
    });

    const payload = response.data;
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.map(parsePublicRoom);
  },

  async createPublicRoom(payload: {
    title: string;
    roomMode: StudyRoomMode;
    maxParticipants: number;
    password?: string;
    coverType: StudyRoomCoverType;
    coverUrl: string;
  }): Promise<CreatedPublicStudyRoom> {
    const response = await apiClient.post('/rooms', {
      title: payload.title,
      room_mode: payload.roomMode,
      max_participants: payload.maxParticipants,
      password: payload.password,
      cover_type: payload.coverType,
      cover_url: payload.coverUrl,
    });

    const room = asRecord(response.data);
    return {
      ...parsePublicRoom(room),
      hostId: room.host_id === null ? null : toInteger(room.host_id),
      createdAt: toIsoDateString(room.created_at ?? room.createdAt),
    };
  },

  async createStudyRoom(payload: {
    title: string;
    roomMode: StudyRoomMode;
    maxParticipants?: number;
    password?: string;
    coverType?: StudyRoomCoverType;
    coverUrl?: string;
    isPublic?: boolean;
  }): Promise<StudyRoomSummary> {
    const response = await apiClient.post('/study-rooms', {
      title: payload.title,
      roomMode: payload.roomMode,
      maxParticipants: payload.maxParticipants,
      password: payload.password,
      coverType: payload.coverType,
      coverUrl: payload.coverUrl,
      isPublic: payload.isPublic,
    });

    return parseStudyRoomSummary(response.data);
  },

  async joinPublicRoom(
    roomId: number,
    payload?: { password?: string },
  ): Promise<JoinPublicRoomResult> {
    const response = await apiClient.post(`/rooms/${roomId}/join`, {
      password: payload?.password,
    });

    const body = asRecord(response.data);

    return {
      success: toBooleanValue(body.success, true),
      roomId: toInteger(body.room_id ?? body.roomId),
      participantId: toInteger(body.participant_id ?? body.participantId),
      livekitToken: toStringValue(body.livekit_token ?? body.livekitToken),
      livekitUrl: toNullableString(body.livekit_url ?? body.livekitUrl),
    };
  },

  async listStudyRooms(params?: {
    search?: string;
    roomMode?: StudyRoomMode;
    isPublic?: boolean;
    page?: number;
    limit?: number;
  }): Promise<StudyRoomListResponse> {
    const response = await apiClient.get('/study-rooms', {
      params: {
        search: params?.search?.trim() || undefined,
        roomMode: params?.roomMode,
        isPublic: params?.isPublic,
        page: params?.page,
        limit: params?.limit,
      },
    });

    const payload = asRecord(response.data);
    const items = Array.isArray(payload.items)
      ? payload.items.map(parseStudyRoomSummary)
      : [];

    return {
      items,
      meta: parseStudyRoomListMeta(payload.meta),
    };
  },

  async getRoomById(roomId: number): Promise<StudyRoomDetail> {
    const response = await apiClient.get(`/study-rooms/${roomId}`);
    const payload = asRecord(response.data);

    return {
      ...parseStudyRoomSummary(payload),
      participants: Array.isArray(payload.participants)
        ? payload.participants.map(parseParticipantPresence)
        : [],
      viewerCanModerate: toBooleanValue(
        payload.viewerCanModerate ?? payload.viewer_can_moderate,
        false,
      ),
      joined: toBooleanValue(payload.joined, false),
    };
  },

  async verifyRoomAccess(
    roomId: number,
    password?: string,
  ): Promise<StudyRoomAccessInfo> {
    const response = await apiClient.post(`/study-rooms/${roomId}/access`, {
      password,
    });

    const payload = asRecord(response.data);
    const roomPayload = asRecord(payload.room);

    return {
      accessGranted: toBooleanValue(payload.accessGranted, false),
      room: {
        ...parseStudyRoomSummary(roomPayload),
        participants: Array.isArray(roomPayload.participants)
          ? roomPayload.participants.map(parseParticipantPresence)
          : [],
      },
    };
  },

  async getMyStudyStats(): Promise<MyStudyStats> {
    const response = await apiClient.get('/study-rooms/me/stats');
    const payload = asRecord(response.data);

    const totals = asRecord(payload.totals);
    const streak = asRecord(payload.streak);
    const leaderboard = asRecord(payload.leaderboard);

    return {
      totals: {
        totalMinutes: Math.max(0, toInteger(totals.totalMinutes, 0)),
        totalSessions: Math.max(0, toInteger(totals.totalSessions, 0)),
        updatedAt:
          totals.updatedAt === null
            ? null
            : toIsoDateString(totals.updatedAt),
      },
      streak: {
        current: Math.max(0, toInteger(streak.current, 0)),
        longest: Math.max(0, toInteger(streak.longest, 0)),
        lastStudyDate:
          streak.lastStudyDate === null
            ? null
            : toIsoDateString(streak.lastStudyDate),
      },
      leaderboard: {
        score: Math.max(0, toInteger(leaderboard.score, 0)),
        rank:
          leaderboard.rank === null
            ? null
            : Math.max(1, toInteger(leaderboard.rank, 1)),
      },
      recentSessions: Array.isArray(payload.recentSessions)
        ? payload.recentSessions.map(parseStudySessionRecord)
        : [],
    };
  },

  async getLeaderboard(limit?: number): Promise<StudyLeaderboardResponse> {
    const response = await apiClient.get('/study-rooms/leaderboard', {
      params: {
        limit,
      },
    });

    const payload = asRecord(response.data);
    const rawItems = Array.isArray(payload.items) ? payload.items : [];

    return {
      items: rawItems.map((item) => {
        const entry = asRecord(item);
        return {
          rank: Math.max(1, toInteger(entry.rank, 1)),
          accountId: toInteger(entry.accountId ?? entry.account_id),
          fullName: toStringValue(entry.fullName ?? entry.full_name),
          avatarUrl: toNullableString(entry.avatarUrl ?? entry.avatar_url),
          score: Math.max(0, toInteger(entry.score, 0)),
          totalMinutes: Math.max(0, toInteger(entry.totalMinutes ?? entry.total_minutes, 0)),
          totalSessions: Math.max(0, toInteger(entry.totalSessions ?? entry.total_sessions, 0)),
          currentStreak: Math.max(0, toInteger(entry.currentStreak ?? entry.current_streak, 0)),
          updatedAt:
            entry.updatedAt === null || entry.updated_at === null
              ? null
              : toIsoDateString(entry.updatedAt ?? entry.updated_at),
        };
      }),
    };
  },

  parseRealtimeJoinAck(value: unknown): StudyRoomJoinRealtimeResult {
    return parseJoinRealtimeResult(value);
  },
};
