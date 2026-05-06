import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { STUDY_ROOM_PRESENCE_TTL_SECONDS } from './study-room.constants';
import { StudyRoomParticipantLiveState } from './study-room.types';

interface AddConnectionInput {
  roomId: number;
  accountId: number;
  socketId: string;
  isHost: boolean;
  micOn: boolean;
  cameraOn: boolean;
  participantRecordId: number | null;
  sessionStartedAt: string;
}

interface RemoveConnectionResult {
  state: StudyRoomParticipantLiveState | null;
  wasLastConnection: boolean;
}

interface UpdateStatePatch {
  micOn?: boolean;
  cameraOn?: boolean;
  handRaised?: boolean;
}

@Injectable()
export class StudyRoomStateService {
  private readonly ttlSeconds = STUDY_ROOM_PRESENCE_TTL_SECONDS;
  private readonly memoryRooms = new Map<
    number,
    Map<number, StudyRoomParticipantLiveState>
  >();

  constructor(private readonly redisService: RedisService) {}

  async addParticipantConnection(input: AddConnectionInput): Promise<{
    state: StudyRoomParticipantLiveState;
    isFirstConnection: boolean;
  }> {
    await this.pruneRoom(input.roomId);

    const existing = await this.getParticipantState(
      input.roomId,
      input.accountId,
    );
    const now = new Date().toISOString();

    const state: StudyRoomParticipantLiveState = existing
      ? {
          ...existing,
          isHost: input.isHost || existing.isHost,
          micOn: input.micOn,
          cameraOn: input.cameraOn,
          lastSeenAt: now,
          socketIds: this.uniqueSocketIds([
            ...existing.socketIds,
            input.socketId,
          ]),
        }
      : {
          roomId: input.roomId,
          accountId: input.accountId,
          isHost: input.isHost,
          micOn: input.micOn,
          cameraOn: input.cameraOn,
          handRaised: false,
          joinedAt: now,
          lastSeenAt: now,
          sessionStartedAt: input.sessionStartedAt,
          participantRecordId: input.participantRecordId,
          socketIds: [input.socketId],
        };

    if (!state.participantRecordId && input.participantRecordId) {
      state.participantRecordId = input.participantRecordId;
    }

    if (!state.sessionStartedAt) {
      state.sessionStartedAt = input.sessionStartedAt;
    }

    await this.persistParticipantState(state);

    return {
      state,
      isFirstConnection: !existing,
    };
  }

  async getParticipantState(
    roomId: number,
    accountId: number,
  ): Promise<StudyRoomParticipantLiveState | null> {
    const client = this.redisService.getClient();
    if (!client?.isOpen) {
      return this.cloneState(
        this.memoryRooms.get(roomId)?.get(accountId) ?? null,
      );
    }

    const raw = await client.get(this.getParticipantKey(roomId, accountId));
    if (!raw) {
      await client.zRem(this.getRoomIndexKey(roomId), String(accountId));
      return null;
    }

    return JSON.parse(raw) as StudyRoomParticipantLiveState;
  }

  async listRoomParticipants(
    roomId: number,
  ): Promise<StudyRoomParticipantLiveState[]> {
    await this.pruneRoom(roomId);

    const client = this.redisService.getClient();
    if (!client?.isOpen) {
      const room = this.memoryRooms.get(roomId);
      if (!room) {
        return [];
      }

      return Array.from(room.values())
        .map((state) => this.cloneState(state))
        .filter((state): state is StudyRoomParticipantLiveState =>
          Boolean(state),
        )
        .sort((left, right) => left.joinedAt.localeCompare(right.joinedAt));
    }

    const memberIds = await client.zRangeByScore(
      this.getRoomIndexKey(roomId),
      Date.now(),
      '+inf',
    );

    if (memberIds.length === 0) {
      return [];
    }

    const payloads = await client.mGet(
      memberIds.map((memberId) =>
        this.getParticipantKey(roomId, Number(memberId)),
      ),
    );
    const staleMembers: string[] = [];
    const participants: StudyRoomParticipantLiveState[] = [];

    payloads.forEach((payload, index) => {
      if (!payload) {
        staleMembers.push(memberIds[index]);
        return;
      }

      participants.push(JSON.parse(payload) as StudyRoomParticipantLiveState);
    });

    if (staleMembers.length > 0) {
      await client.zRem(this.getRoomIndexKey(roomId), staleMembers);
    }

    participants.sort((left, right) =>
      left.joinedAt.localeCompare(right.joinedAt),
    );
    return participants;
  }

  async countRoomParticipants(roomId: number): Promise<number> {
    const participants = await this.listRoomParticipants(roomId);
    return participants.length;
  }

  async updateParticipantState(
    roomId: number,
    accountId: number,
    patch: UpdateStatePatch,
    socketId?: string,
  ): Promise<StudyRoomParticipantLiveState | null> {
    const existing = await this.getParticipantState(roomId, accountId);
    if (!existing) {
      return null;
    }

    if (socketId && !existing.socketIds.includes(socketId)) {
      return null;
    }

    const normalizedPatch: Partial<StudyRoomParticipantLiveState> = {};
    if (typeof patch.micOn === 'boolean') {
      normalizedPatch.micOn = patch.micOn;
    }

    if (typeof patch.cameraOn === 'boolean') {
      normalizedPatch.cameraOn = patch.cameraOn;
    }

    if (typeof patch.handRaised === 'boolean') {
      normalizedPatch.handRaised = patch.handRaised;
    }

    const nextState: StudyRoomParticipantLiveState = {
      ...existing,
      ...normalizedPatch,
      lastSeenAt: new Date().toISOString(),
    };

    await this.persistParticipantState(nextState);
    return nextState;
  }

  async refreshParticipantPresence(
    roomId: number,
    accountId: number,
    socketId?: string,
  ): Promise<StudyRoomParticipantLiveState | null> {
    return this.updateParticipantState(roomId, accountId, {}, socketId);
  }

  async removeParticipantConnection(
    roomId: number,
    accountId: number,
    socketId: string,
  ): Promise<RemoveConnectionResult> {
    const existing = await this.getParticipantState(roomId, accountId);
    if (!existing) {
      return { state: null, wasLastConnection: false };
    }

    const remainingSocketIds = existing.socketIds.filter(
      (currentSocketId) => currentSocketId !== socketId,
    );

    if (remainingSocketIds.length === 0) {
      await this.deleteParticipantState(roomId, accountId);
      return { state: existing, wasLastConnection: true };
    }

    const nextState: StudyRoomParticipantLiveState = {
      ...existing,
      socketIds: remainingSocketIds,
      lastSeenAt: new Date().toISOString(),
    };

    await this.persistParticipantState(nextState);
    return { state: nextState, wasLastConnection: false };
  }

  async forceRemoveParticipant(
    roomId: number,
    accountId: number,
  ): Promise<RemoveConnectionResult> {
    const existing = await this.getParticipantState(roomId, accountId);
    if (!existing) {
      return { state: null, wasLastConnection: false };
    }

    await this.deleteParticipantState(roomId, accountId);
    return { state: existing, wasLastConnection: true };
  }

  private async persistParticipantState(
    state: StudyRoomParticipantLiveState,
  ): Promise<void> {
    const client = this.redisService.getClient();
    if (!client?.isOpen) {
      const room = this.getOrCreateMemoryRoom(state.roomId);
      room.set(state.accountId, this.cloneState(state)!);
      return;
    }

    const expiresAtScore = Date.now() + this.ttlSeconds * 1000;
    await client.set(
      this.getParticipantKey(state.roomId, state.accountId),
      JSON.stringify(state),
      {
        EX: this.ttlSeconds,
      },
    );
    await client.zAdd(this.getRoomIndexKey(state.roomId), {
      score: expiresAtScore,
      value: String(state.accountId),
    });
  }

  private async deleteParticipantState(
    roomId: number,
    accountId: number,
  ): Promise<void> {
    const client = this.redisService.getClient();
    if (!client?.isOpen) {
      const room = this.memoryRooms.get(roomId);
      room?.delete(accountId);
      if (room && room.size === 0) {
        this.memoryRooms.delete(roomId);
      }
      return;
    }

    await client.del(this.getParticipantKey(roomId, accountId));
    await client.zRem(this.getRoomIndexKey(roomId), String(accountId));
  }

  private async pruneRoom(roomId: number): Promise<void> {
    const client = this.redisService.getClient();
    if (!client?.isOpen) {
      const room = this.memoryRooms.get(roomId);
      if (!room) {
        return;
      }

      const now = Date.now();
      for (const [accountId, state] of room.entries()) {
        const lastSeenAt = Date.parse(state.lastSeenAt);
        if (
          !Number.isNaN(lastSeenAt) &&
          lastSeenAt + this.ttlSeconds * 1000 < now
        ) {
          room.delete(accountId);
        }
      }

      if (room.size === 0) {
        this.memoryRooms.delete(roomId);
      }

      return;
    }

    const expiredMembers = await client.zRangeByScore(
      this.getRoomIndexKey(roomId),
      0,
      Date.now() - 1,
    );

    if (expiredMembers.length > 0) {
      await client.zRem(this.getRoomIndexKey(roomId), expiredMembers);
    }
  }

  private getParticipantKey(roomId: number, accountId: number): string {
    return this.redisService.getKey(
      `study-room:room:${roomId}:participant:${accountId}`,
    );
  }

  private getRoomIndexKey(roomId: number): string {
    return this.redisService.getKey(`study-room:room:${roomId}:online`);
  }

  private getOrCreateMemoryRoom(
    roomId: number,
  ): Map<number, StudyRoomParticipantLiveState> {
    const existing = this.memoryRooms.get(roomId);
    if (existing) {
      return existing;
    }

    const created = new Map<number, StudyRoomParticipantLiveState>();
    this.memoryRooms.set(roomId, created);
    return created;
  }

  private uniqueSocketIds(socketIds: string[]): string[] {
    return Array.from(new Set(socketIds));
  }

  private cloneState(
    state: StudyRoomParticipantLiveState | null,
  ): StudyRoomParticipantLiveState | null {
    if (!state) {
      return null;
    }

    return {
      ...state,
      socketIds: [...state.socketIds],
    };
  }
}
