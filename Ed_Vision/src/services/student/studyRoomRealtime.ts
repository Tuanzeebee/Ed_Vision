import { io, type Socket } from 'socket.io-client';
import { buildSocketUrl } from '@/services/api/config';
import {
  getStudyRoomErrorMessage,
  parseStudyRoomSocketAck,
  type StudyRoomJoinRealtimeResult,
  type StudyRoomParticipantStateUpdate,
  type StudyRoomTimerState,
} from './studyRoomService';

interface AckBase {
  success?: boolean;
  message?: string;
}

export interface RoomSocketUserItem {
  userId: number;
  fullName: string | null;
  avatarUrl: string | null;
  isHost: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

export interface RoomSocketUserListPayload {
  roomId: number;
  userId: number;
  users: RoomSocketUserItem[];
  newHostId?: number | null;
  roomClosed?: boolean;
  banned_until?: string | null;
}

export interface StudyRoomRealtimeConnectedPayload {
  accountId: number;
  role: string | null;
  displayName: string | null;
}

export interface StudyRoomParticipantJoinedPayload {
  roomId: number;
  participant: StudyRoomParticipantStateUpdate['participant'];
}

export interface StudyRoomParticipantLeftPayload {
  roomId: number;
  participant: StudyRoomParticipantStateUpdate['participant'];
  reason: 'left' | 'disconnected' | 'kicked' | 'banned';
  durationMinutes?: number;
}

export interface StudyRoomTimerSyncPayload {
  roomId: number;
  timer: StudyRoomTimerState | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseAckError(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string' && item.trim()) as
      | string
      | undefined;
    if (first) {
      return first;
    }
  }

  if (isRecord(value)) {
    const message = value.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

const DEFAULT_ACK_TIMEOUT_MS = 15000;
const CONNECT_WAIT_TIMEOUT_MS = 20000;

function isRetriableRealtimeError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('operation has timed out') ||
    normalized.includes('socket has been disconnected') ||
    normalized.includes('is not connected') ||
    normalized.includes('timeout')
  );
}

export class StudyRoomRealtimeClient {
  private socket: Socket | null = null;
  private connectPromise: Promise<Socket> | null = null;
  private authToken: string | null = null;

  async connect(token: string): Promise<Socket> {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      throw new Error('Missing auth token for study room realtime connection');
    }

    this.authToken = normalizedToken;

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (this.socket) {
      this.socket.auth = {
        ...this.socket.auth,
        token: normalizedToken,
      };

      this.connectPromise = this.waitForConnection(this.socket);
      return this.connectPromise;
    }

    const socket = io(buildSocketUrl('study-rooms'), {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1200,
      auth: {
        token: normalizedToken,
      },
    });

    this.socket = socket;
    this.connectPromise = this.waitForConnection(socket);

    return this.connectPromise;
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectPromise = null;
    this.authToken = null;
  }

  on<TPayload>(event: string, listener: (payload: TPayload) => void): void {
    this.socket?.on(event, listener as (...args: unknown[]) => void);
  }

  off(event: string, listener?: (...args: unknown[]) => void): void {
    if (listener) {
      this.socket?.off(event, listener);
      return;
    }

    this.socket?.off(event);
  }

  async joinRoom(payload: {
    roomId: number;
    password?: string;
    micOn?: boolean;
    cameraOn?: boolean;
  }): Promise<StudyRoomJoinRealtimeResult> {
    const ack = await this.emitWithAck<unknown>('room.join', payload);
    return parseStudyRoomSocketAck(ack);
  }

  async joinLegacyRoom(payload: {
    roomId: number;
    userId: number;
  }): Promise<AckBase & { roomId: number; users: RoomSocketUserItem[] }> {
    return this.emitWithAck('join_room', payload);
  }

  async leaveRoom(roomId: number): Promise<AckBase & { roomId: number }> {
    return this.emitWithAck('room.leave', { roomId });
  }

  async leaveLegacyRoom(payload: {
    roomId: number;
    userId: number;
  }): Promise<AckBase & { roomId: number; users: RoomSocketUserItem[] }> {
    return this.emitWithAck('leave_room', payload);
  }

  async heartbeat(roomIds?: number[]): Promise<{ refreshedRooms: number[] }> {
    return this.emitWithAck('room.heartbeat', { roomIds });
  }

  async updateParticipantState(payload: {
    roomId: number;
    micOn?: boolean;
    cameraOn?: boolean;
    handRaised?: boolean;
  }): Promise<AckBase & StudyRoomParticipantStateUpdate> {
    return this.emitWithAck('room.participant.update', payload);
  }

  async toggleMic(payload: {
    roomId: number;
    enabled: boolean;
  }): Promise<AckBase & { roomId: number; userId: number; enabled: boolean }> {
    return this.emitWithAck('toggle_mic', payload);
  }

  async toggleCamera(payload: {
    roomId: number;
    enabled: boolean;
  }): Promise<AckBase & { roomId: number; userId: number; enabled: boolean }> {
    return this.emitWithAck('toggle_camera', payload);
  }

  async startTimer(payload: {
    roomId: number;
    durationSeconds: number;
  }): Promise<AckBase & { roomId: number; timer: StudyRoomTimerState }> {
    return this.emitWithAck('start_timer', payload);
  }

  async syncTimer(payload: {
    roomId: number;
  }): Promise<AckBase & { roomId: number; timer: StudyRoomTimerState | null }> {
    return this.emitWithAck('sync_timer', payload);
  }

  async muteParticipant(payload: {
    roomId: number;
    targetAccountId: number;
  }): Promise<AckBase & StudyRoomParticipantStateUpdate> {
    return this.emitWithAck('room.moderation.mute', payload);
  }

  async kickParticipant(payload: {
    roomId: number;
    targetAccountId: number;
  }): Promise<AckBase & { roomId: number; targetAccountId: number }> {
    return this.emitWithAck('room.moderation.kick', payload);
  }

  async banParticipant(payload: {
    roomId: number;
    targetAccountId: number;
    bannedUntil?: string;
    durationMinutes?: number;
  }): Promise<AckBase & { roomId: number; targetAccountId: number; bannedUntil?: string | null }> {
    return this.emitWithAck('room.moderation.ban', payload);
  }

  async unbanParticipant(payload: {
    roomId: number;
    targetAccountId: number;
  }): Promise<AckBase & { roomId: number; targetAccountId: number; removedBans?: number }> {
    return this.emitWithAck('room.moderation.unban', payload);
  }

  async endRoom(payload: {
    roomId: number;
  }): Promise<
    AckBase & {
      roomId: number;
      endedBy: number;
      closedAt: string;
      disconnectedAccountIds: number[];
    }
  > {
    return this.emitWithAck('room.moderation.end', payload);
  }

  private async emitWithAck<TResponse = unknown>(
    event: string,
    payload: unknown,
    timeoutMs = DEFAULT_ACK_TIMEOUT_MS,
  ): Promise<TResponse> {
    return this.emitWithAckInternal(event, payload, timeoutMs, 1);
  }

  private async emitWithAckInternal<TResponse = unknown>(
    event: string,
    payload: unknown,
    timeoutMs: number,
    retriesLeft: number,
  ): Promise<TResponse> {
    const socket = await this.ensureConnected();
    if (!socket.connected) {
      throw new Error('Study room realtime socket is not connected');
    }

    try {
      const response = await socket.timeout(timeoutMs).emitWithAck(event, payload);
      this.assertAckSuccess(response, event);
      return response as TResponse;
    } catch (error) {
      const fallback = parseAckError(error, `Study room socket event failed: ${event}`);
      const message = getStudyRoomErrorMessage(error, fallback);

      if (retriesLeft > 0 && isRetriableRealtimeError(message)) {
        await this.tryReconnect();
        return this.emitWithAckInternal(event, payload, timeoutMs, retriesLeft - 1);
      }

      throw new Error(message);
    }
  }

  private async ensureConnected(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (!this.authToken) {
      throw new Error('Study room realtime socket is not connected');
    }

    return this.connect(this.authToken);
  }

  private waitForConnection(
    socket: Socket,
    timeoutMs = CONNECT_WAIT_TIMEOUT_MS,
  ): Promise<Socket> {
    if (socket.connected) {
      this.connectPromise = null;
      return Promise.resolve(socket);
    }

    return new Promise<Socket>((resolve, reject) => {
      let lastError = 'Unable to connect to study room socket';

      const cleanup = () => {
        clearTimeout(timeoutHandle);
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleConnectError);
      };

      const timeoutHandle = setTimeout(() => {
        cleanup();
        this.connectPromise = null;
        reject(new Error(lastError));
      }, timeoutMs);

      const handleConnect = () => {
        cleanup();
        this.connectPromise = null;
        resolve(socket);
      };

      const handleConnectError = (error: unknown) => {
        lastError = parseAckError(error, lastError);
      };

      socket.on('connect', handleConnect);
      socket.on('connect_error', handleConnectError);
      socket.connect();
    });
  }

  private async tryReconnect(): Promise<void> {
    if (!this.authToken) {
      return;
    }

    this.connectPromise = null;

    if (this.socket && !this.socket.connected) {
      this.socket.auth = {
        ...this.socket.auth,
        token: this.authToken,
      };
      this.socket.connect();
    }

    try {
      await this.connect(this.authToken);
    } catch {
      // Retry path is best-effort; caller still receives final error if reconnect fails.
    }
  }

  private assertAckSuccess(response: unknown, event: string): void {
    if (!isRecord(response)) {
      return;
    }

    if (response.success === false) {
      const message = parseAckError(response, `Study room socket event rejected: ${event}`);
      throw new Error(message);
    }
  }
}

export const studyRoomRealtime = new StudyRoomRealtimeClient();
