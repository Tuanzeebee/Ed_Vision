import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, StudyStat, StudySession } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { DEFAULT_LEADERBOARD_LIMIT } from './study-room.constants';
import { BanRoomParticipantDto } from './dto/ban-room-participant.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatedRoomResponseDto } from './dto/created-room-response.dto';
import { CreateStudyRoomDto } from './dto/create-study-room.dto';
import { JoinStudyRoomDto } from './dto/join-study-room.dto';
import { JoinPublicRoomDto } from './dto/join-public-room.dto';
import { JoinPublicRoomResponseDto } from './dto/join-public-room-response.dto';
import { KickRoomParticipantDto } from './dto/kick-room-participant.dto';
import { ListStudyRoomsDto } from './dto/list-study-rooms.dto';
import { MuteRoomParticipantDto } from './dto/mute-room-participant.dto';
import { PublicRoomResponseDto } from './dto/public-room-response.dto';
import { QueryPublicRoomsDto } from './dto/query-public-rooms.dto';
import { RoomUserListItemDto } from './dto/room-user-list-item.dto';
import { UpdateRoomParticipantStateDto } from './dto/update-room-participant-state.dto';
import { StudyRoomStateService } from './study-room-state.service';
import {
  StudyRoomDisconnectReason,
  StudyRoomParticipantLiveState,
  StudyRoomParticipantPresence,
  StudyRoomSnapshot,
} from './study-room.types';

type RoomWithHost = Prisma.RoomGetPayload<{
  include: {
    host: {
      include: {
        profile: true;
      };
    };
  };
}>;

type AccountWithProfile = Prisma.AccountGetPayload<{
  include: {
    profile: true;
  };
}>;

type StudyRoomDbClient = PrismaService | Prisma.TransactionClient;

interface CreateRoomInput {
  title: string;
  roomMode: string;
  maxParticipants?: number;
  password?: string;
  coverType?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
}

interface LeavePublicRoomResult {
  roomId: number;
  userId: number;
  users: RoomUserListItemDto[];
  participantLeft: boolean;
  newHostId: number | null;
  roomClosed: boolean;
}

type RealtimeMediaKind = 'audio' | 'video';

export interface RoomTimerState {
  roomId: number;
  startedBy: number;
  startedAt: string;
  endsAt: string;
  durationSeconds: number;
}

@Injectable()
export class StudyRoomService {
  private readonly minMinutesForStreak = Math.max(
    1,
    Number.parseInt(process.env.STUDY_STREAK_MIN_MINUTES?.trim() ?? '10', 10) ||
      10,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly studyRoomState: StudyRoomStateService,
    private readonly configService: ConfigService,
  ) {}

  async createRoom(accountId: number, dto: CreateStudyRoomDto) {
    const room = await this.createRoomRecord(accountId, {
      title: dto.title,
      roomMode: dto.roomMode,
      maxParticipants: dto.maxParticipants,
      password: dto.password,
      coverType: dto.coverType ?? null,
      coverUrl: dto.coverUrl ?? null,
      isPublic: dto.isPublic ?? true,
    });

    return this.serializeRoom(room, 0);
  }

  async createPublicRoom(
    accountId: number,
    dto: CreateRoomDto,
  ): Promise<CreatedRoomResponseDto> {
    const room = await this.createRoomRecord(accountId, {
      title: dto.title,
      roomMode: dto.room_mode,
      maxParticipants: dto.max_participants,
      password: dto.password,
      coverType: dto.cover_type,
      coverUrl: dto.cover_url,
      isPublic: true,
    });

    return this.serializeCreatedRoom(room, 0);
  }

  async getPublicRooms(
    query: QueryPublicRoomsDto,
  ): Promise<PublicRoomResponseDto[]> {
    const where: Prisma.RoomWhereInput = {
      is_public: true,
    };

    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) {
      where.title = {
        contains: trimmedSearch,
        mode: 'insensitive',
      };
    }

    if (query.room_mode) {
      where.room_mode = query.room_mode;
    }

    const rooms = await this.prisma.room.findMany({
      where,
      select: {
        room_id: true,
        title: true,
        room_mode: true,
        cover_url: true,
        cover_type: true,
        max_participants: true,
        password_hash: true,
      },
      orderBy: [{ created_at: 'desc' }],
    });

    if (rooms.length === 0) {
      return [];
    }

    const participantCounts = await this.prisma.roomParticipant.groupBy({
      by: ['room_id'],
      where: {
        room_id: {
          in: rooms.map((room) => room.room_id),
        },
        left_at: null,
      },
      _count: {
        _all: true,
      },
    });

    const participantCountMap = new Map(
      participantCounts.map(
        (entry) => [entry.room_id, entry._count._all] as const,
      ),
    );

    return rooms.map((room) => ({
      room_id: room.room_id,
      title: room.title,
      room_mode: room.room_mode,
      cover_url: room.cover_url,
      cover_type: room.cover_type,
      max_participants: room.max_participants,
      current_participants_count: participantCountMap.get(room.room_id) ?? 0,
      has_password: Boolean(room.password_hash),
    }));
  }

  async joinPublicRoom(
    accountId: number,
    roomId: number,
    dto: JoinPublicRoomDto,
  ): Promise<JoinPublicRoomResponseDto> {
    const room = await this.ensureRoomAccess(accountId, roomId, dto.password);
    const joinedAt = new Date();
    const participant = await this.prisma.$transaction(async (tx) => {
      const existingParticipant = await tx.roomParticipant.findFirst({
        where: {
          room_id: roomId,
          account_id: accountId,
          left_at: null,
        },
        orderBy: {
          joined_at: 'desc',
        },
      });

      if (existingParticipant) {
        await this.ensureActiveStudySession(
          tx,
          accountId,
          roomId,
          existingParticipant.joined_at,
        );
        return existingParticipant;
      }

      const currentParticipantsCount = await tx.roomParticipant.count({
        where: {
          room_id: roomId,
          left_at: null,
        },
      });

      if (currentParticipantsCount >= room.max_participants) {
        throw new ConflictException('This study room is full');
      }

      const createdParticipant = await tx.roomParticipant.create({
        data: {
          room_id: roomId,
          account_id: accountId,
          is_host: room.host_id === accountId,
          camera_on: false,
          mic_on: false,
          joined_at: joinedAt,
        },
      });

      await this.ensureActiveStudySession(tx, accountId, roomId, joinedAt);
      return createdParticipant;
    });

    return {
      success: true,
      room_id: roomId,
      participant_id: participant.id,
      livekit_token: await this.buildLiveKitAccessToken(roomId, accountId),
      livekit_url: this.resolveLiveKitWsUrl(),
    };
  }

  async kickUserFromRoom(
    actorAccountId: number,
    roomId: number,
    targetUserId: number,
  ): Promise<{
    roomId: number;
    targetUserId: number;
    users: RoomUserListItemDto[];
  }> {
    const room = await this.getRoomOrThrow(roomId);
    this.ensureHostPrivileges(room, actorAccountId, targetUserId);

    const activeParticipant = await this.prisma.roomParticipant.findFirst({
      where: {
        room_id: roomId,
        account_id: targetUserId,
        left_at: null,
      },
      select: {
        id: true,
        joined_at: true,
      },
      orderBy: {
        joined_at: 'desc',
      },
    });

    if (!activeParticipant) {
      throw new NotFoundException('Target user is not currently in the room');
    }

    const leftAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.roomParticipant.updateMany({
        where: {
          room_id: roomId,
          account_id: targetUserId,
          left_at: null,
        },
        data: {
          left_at: leftAt,
        },
      });

      await tx.roomAction.create({
        data: {
          room_id: roomId,
          target_account_id: targetUserId,
          action_type: 'kick',
        },
      });

      await this.completeActiveStudySession(
        tx,
        targetUserId,
        roomId,
        leftAt,
        activeParticipant.joined_at,
      );
    });

    await this.studyRoomState.forceRemoveParticipant(roomId, targetUserId);
    await this.clearRealtimeMediaState(roomId, targetUserId);

    return {
      roomId,
      targetUserId,
      users: await this.removeUserFromRoomSocketList(roomId, targetUserId),
    };
  }

  async banUserFromRoom(
    actorAccountId: number,
    roomId: number,
    targetUserId: number,
    bannedUntilInput?: string,
  ): Promise<{
    roomId: number;
    targetUserId: number;
    bannedUntil: string | null;
    users: RoomUserListItemDto[];
    forcedLeave: boolean;
  }> {
    const room = await this.getRoomOrThrow(roomId);
    this.ensureHostPrivileges(room, actorAccountId, targetUserId);

    const bannedUntil = this.resolveExplicitBannedUntil(bannedUntilInput);
    const leftAt = new Date();

    const activeParticipant = await this.prisma.roomParticipant.findFirst({
      where: {
        room_id: roomId,
        account_id: targetUserId,
        left_at: null,
      },
      select: {
        id: true,
        joined_at: true,
      },
      orderBy: {
        joined_at: 'desc',
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.roomBan.create({
        data: {
          room_id: roomId,
          account_id: targetUserId,
          banned_until: bannedUntil,
        },
      });

      if (activeParticipant) {
        await tx.roomParticipant.updateMany({
          where: {
            room_id: roomId,
            account_id: targetUserId,
            left_at: null,
          },
          data: {
            left_at: leftAt,
          },
        });

        await this.completeActiveStudySession(
          tx,
          targetUserId,
          roomId,
          leftAt,
          activeParticipant.joined_at,
        );
      }
    });

    await this.studyRoomState.forceRemoveParticipant(roomId, targetUserId);
    await this.clearRealtimeMediaState(roomId, targetUserId);

    return {
      roomId,
      targetUserId,
      bannedUntil: bannedUntil?.toISOString() ?? null,
      users: await this.removeUserFromRoomSocketList(roomId, targetUserId),
      forcedLeave: Boolean(activeParticipant),
    };
  }

  async startRoomTimer(
    actorAccountId: number,
    roomId: number,
    durationSeconds: number,
  ): Promise<RoomTimerState> {
    const room = await this.getRoomOrThrow(roomId);
    this.ensureRoomHostAccess(room, actorAccountId);
    await this.assertActiveRoomParticipant(roomId, actorAccountId);

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + durationSeconds * 1000);
    const timerState: RoomTimerState = {
      roomId,
      startedBy: actorAccountId,
      startedAt: startedAt.toISOString(),
      endsAt: endsAt.toISOString(),
      durationSeconds,
    };

    await this.redisService.setJson(this.getRoomTimerKey(roomId), timerState);
    return timerState;
  }

  async getRoomTimer(
    roomId: number,
    accountId: number,
  ): Promise<RoomTimerState | null> {
    await this.getRoomOrThrow(roomId);
    await this.assertActiveRoomParticipant(roomId, accountId);
    return this.redisService.getJson<RoomTimerState>(
      this.getRoomTimerKey(roomId),
    );
  }

  async clearRoomTimer(roomId: number): Promise<void> {
    await this.redisService.delete(this.getRoomTimerKey(roomId));
  }

  async leavePublicRoom(
    accountId: number,
    roomId: number,
  ): Promise<LeavePublicRoomResult> {
    await this.getRoomOrThrow(roomId);
    const leftAt = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { room_id: roomId },
        select: {
          room_id: true,
          host_id: true,
        },
      });

      if (!room) {
        throw new NotFoundException('Study room not found');
      }

      const activeParticipant = await tx.roomParticipant.findFirst({
        where: {
          room_id: roomId,
          account_id: accountId,
          left_at: null,
        },
        orderBy: {
          joined_at: 'desc',
        },
      });

      if (activeParticipant) {
        await tx.roomParticipant.updateMany({
          where: {
            room_id: roomId,
            account_id: accountId,
            left_at: null,
          },
          data: {
            left_at: leftAt,
          },
        });

        await this.completeActiveStudySession(
          tx,
          accountId,
          roomId,
          leftAt,
          activeParticipant.joined_at,
        );
      }

      const hostResult = await this.handleHostDepartureTransaction(
        tx,
        roomId,
        accountId,
        room.host_id === accountId,
      );

      return {
        participantLeft: Boolean(activeParticipant),
        ...hostResult,
      };
    });

    await this.redisService.removeFromSet(
      this.getRoomUsersKey(roomId),
      String(accountId),
    );
    await this.clearRealtimeMediaState(roomId, accountId);
    if (result.roomClosed) {
      await this.clearRoomTimer(roomId);
    }

    return {
      roomId,
      userId: accountId,
      users: await this.getRoomSocketUsers(roomId),
      participantLeft: result.participantLeft,
      newHostId: result.newHostId,
      roomClosed: result.roomClosed,
    };
  }

  async toggleRealtimeMediaState(
    roomId: number,
    accountId: number,
    kind: RealtimeMediaKind,
    enabled: boolean,
  ): Promise<void> {
    await this.getRoomOrThrow(roomId);

    const activeParticipant = await this.prisma.roomParticipant.findFirst({
      where: {
        room_id: roomId,
        account_id: accountId,
        left_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!activeParticipant) {
      throw new ForbiddenException(
        'User must be an active room participant to toggle media state',
      );
    }

    const key =
      kind === 'audio'
        ? this.getRoomAudioPublishersKey(roomId)
        : this.getRoomVideoPublishersKey(roomId);

    if (enabled) {
      await this.redisService.addToSet(key, String(accountId));
      return;
    }

    await this.redisService.removeFromSet(key, String(accountId));
  }

  async clearRealtimeMediaState(
    roomId: number,
    accountId: number,
  ): Promise<void> {
    await Promise.all([
      this.redisService.removeFromSet(
        this.getRoomAudioPublishersKey(roomId),
        String(accountId),
      ),
      this.redisService.removeFromSet(
        this.getRoomVideoPublishersKey(roomId),
        String(accountId),
      ),
    ]);
  }

  async listRooms(accountId: number, query: ListStudyRoomsDto) {
    const where = this.buildRoomWhere(accountId, query);
    const skip = (query.page - 1) * query.limit;

    const [rooms, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        where,
        include: {
          host: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: [{ created_at: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.room.count({ where }),
    ]);

    const items = await Promise.all(
      rooms.map(async (room) => {
        const onlineCount = await this.studyRoomState.countRoomParticipants(
          room.room_id,
        );

        return this.serializeRoom(room, onlineCount);
      }),
    );

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getRoomById(accountId: number, roomId: number) {
    const room = await this.getRoomOrThrow(roomId);
    const snapshot = await this.buildRoomSnapshot(roomId);

    return {
      ...this.serializeRoom(room, snapshot.onlineCount),
      participants: snapshot.participants,
      viewerCanModerate: room.host_id === accountId,
      joined: snapshot.participants.some(
        (participant) => participant.accountId === accountId,
      ),
    };
  }

  async verifyRoomAccess(accountId: number, roomId: number, password?: string) {
    const room = await this.ensureRoomAccess(accountId, roomId, password);
    const snapshot = await this.buildRoomSnapshot(roomId);

    return {
      accessGranted: true,
      room: {
        ...this.serializeRoom(room, snapshot.onlineCount),
        participants: snapshot.participants,
      },
    };
  }

  async joinRoom(accountId: number, socketId: string, dto: JoinStudyRoomDto) {
    const room = await this.ensureRoomAccess(
      accountId,
      dto.roomId,
      dto.password,
    );
    const existingState = await this.studyRoomState.getParticipantState(
      room.room_id,
      accountId,
    );
    const currentOnlineCount = await this.studyRoomState.countRoomParticipants(
      room.room_id,
    );

    if (!existingState && currentOnlineCount >= room.max_participants) {
      throw new ConflictException('This study room is full');
    }

    const now = new Date();
    const createdParticipantRecord = existingState
      ? null
      : await this.createParticipantRecord(
          room,
          accountId,
          dto.cameraOn ?? false,
          dto.micOn ?? false,
          now,
        );

    const connection = await this.studyRoomState.addParticipantConnection({
      roomId: room.room_id,
      accountId,
      socketId,
      isHost: room.host_id === accountId,
      micOn: dto.micOn ?? existingState?.micOn ?? false,
      cameraOn: dto.cameraOn ?? existingState?.cameraOn ?? false,
      participantRecordId: createdParticipantRecord?.id ?? null,
      sessionStartedAt: existingState?.sessionStartedAt ?? now.toISOString(),
    });

    if (
      createdParticipantRecord &&
      connection.state.participantRecordId !== createdParticipantRecord.id
    ) {
      await this.closeParticipantRecord(
        createdParticipantRecord.id,
        dto.cameraOn ?? false,
        dto.micOn ?? false,
        now,
      );
    }

    await this.ensureActiveStudySession(
      this.prisma,
      accountId,
      room.room_id,
      this.parseStudySessionDate(
        connection.state.sessionStartedAt,
        createdParticipantRecord?.joined_at ?? now,
      ) ??
        createdParticipantRecord?.joined_at ??
        now,
    );

    const snapshot = await this.buildRoomSnapshot(room.room_id);
    const participant = snapshot.participants.find(
      (currentParticipant) => currentParticipant.accountId === accountId,
    );

    return {
      room: {
        ...this.serializeRoom(room, snapshot.onlineCount),
        participants: snapshot.participants,
        viewerCanModerate: room.host_id === accountId,
      },
      participant: participant ?? null,
      isFirstConnection: connection.isFirstConnection,
    };
  }

  async leaveRoom(
    accountId: number,
    socketId: string,
    roomId: number,
    reason: StudyRoomDisconnectReason,
  ) {
    const removed = await this.studyRoomState.removeParticipantConnection(
      roomId,
      accountId,
      socketId,
    );

    if (!removed.state) {
      return {
        roomId,
        participant: null,
        participantLeft: false,
        reason,
      };
    }

    const participant = await this.buildParticipantPresence(removed.state);

    if (!removed.wasLastConnection) {
      return {
        roomId,
        participant,
        participantLeft: false,
        reason,
      };
    }

    const endedAt = new Date();
    const durationMinutes = await this.persistCompletedSession(
      removed.state,
      endedAt,
      roomId,
    );

    return {
      roomId,
      participant,
      participantLeft: true,
      durationMinutes,
      reason,
    };
  }

  async addUserToRoomSocketList(
    roomId: number,
    userId: number,
  ): Promise<RoomUserListItemDto[]> {
    await this.getRoomOrThrow(roomId);
    const activeParticipant = await this.prisma.roomParticipant.findFirst({
      where: {
        room_id: roomId,
        account_id: userId,
        left_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!activeParticipant) {
      throw new ForbiddenException(
        'User must join the room through REST before opening realtime presence',
      );
    }

    await this.redisService.addToSet(
      this.getRoomUsersKey(roomId),
      String(userId),
    );
    return this.getRoomSocketUsers(roomId);
  }

  async removeUserFromRoomSocketList(
    roomId: number,
    userId: number,
  ): Promise<RoomUserListItemDto[]> {
    await this.redisService.removeFromSet(
      this.getRoomUsersKey(roomId),
      String(userId),
    );
    return this.getRoomSocketUsers(roomId);
  }

  async getRoomSocketUsers(roomId: number): Promise<RoomUserListItemDto[]> {
    const members = await this.redisService.getSetMembers(
      this.getRoomUsersKey(roomId),
    );

    const userIds = members
      .map((member) => Number.parseInt(member, 10))
      .filter((userId) => !Number.isNaN(userId))
      .sort((left, right) => left - right);

    if (userIds.length === 0) {
      return [];
    }

    const [room, accounts, audioPublishers, videoPublishers] =
      await Promise.all([
        this.prisma.room.findUnique({
          where: { room_id: roomId },
          select: {
            host_id: true,
          },
        }),
        this.prisma.account.findMany({
          where: {
            account_id: {
              in: userIds,
            },
          },
          include: {
            profile: true,
          },
        }),
        this.redisService.getSetMembers(this.getRoomAudioPublishersKey(roomId)),
        this.redisService.getSetMembers(this.getRoomVideoPublishersKey(roomId)),
      ]);

    const accountMap = new Map(
      accounts.map((account) => [account.account_id, account] as const),
    );
    const audioPublisherSet = new Set(
      audioPublishers
        .map((member) => Number.parseInt(member, 10))
        .filter((userId) => !Number.isNaN(userId)),
    );
    const videoPublisherSet = new Set(
      videoPublishers
        .map((member) => Number.parseInt(member, 10))
        .filter((userId) => !Number.isNaN(userId)),
    );

    return userIds.map((userId) => {
      const account = accountMap.get(userId);

      return {
        userId,
        fullName: account?.profile?.full_name ?? account?.email ?? null,
        avatarUrl: account?.profile?.avatar_url ?? null,
        isHost: room?.host_id === userId,
        micEnabled: audioPublisherSet.has(userId),
        cameraEnabled: videoPublisherSet.has(userId),
      };
    });
  }

  async refreshPresence(
    accountId: number,
    socketId: string,
    roomIds: number[],
  ) {
    const refreshedRooms: number[] = [];

    for (const roomId of roomIds) {
      const state = await this.studyRoomState.refreshParticipantPresence(
        roomId,
        accountId,
        socketId,
      );

      if (state) {
        refreshedRooms.push(roomId);
      }
    }

    return { refreshedRooms };
  }

  async updateParticipantState(
    accountId: number,
    socketId: string,
    dto: UpdateRoomParticipantStateDto,
  ) {
    if (
      dto.micOn === undefined &&
      dto.cameraOn === undefined &&
      dto.handRaised === undefined
    ) {
      throw new BadRequestException(
        'No participant state changes were provided',
      );
    }

    const state = await this.studyRoomState.updateParticipantState(
      dto.roomId,
      accountId,
      {
        micOn: dto.micOn,
        cameraOn: dto.cameraOn,
        handRaised: dto.handRaised,
      },
      socketId,
    );

    if (!state) {
      throw new NotFoundException('Participant is not currently in the room');
    }

    return {
      roomId: dto.roomId,
      participant: await this.buildParticipantPresence(state),
    };
  }

  async muteParticipant(actorAccountId: number, dto: MuteRoomParticipantDto) {
    const room = await this.getRoomOrThrow(dto.roomId);
    this.ensureHostPrivileges(room, actorAccountId, dto.targetAccountId);

    const state = await this.studyRoomState.updateParticipantState(
      dto.roomId,
      dto.targetAccountId,
      { micOn: false },
    );

    if (!state) {
      throw new NotFoundException(
        'Target participant is not currently in the room',
      );
    }

    await this.prisma.roomAction.create({
      data: {
        room_id: dto.roomId,
        target_account_id: dto.targetAccountId,
        action_type: 'mute',
      },
    });

    return {
      roomId: dto.roomId,
      participant: await this.buildParticipantPresence(state),
    };
  }

  async kickParticipant(actorAccountId: number, dto: KickRoomParticipantDto) {
    const room = await this.getRoomOrThrow(dto.roomId);
    this.ensureHostPrivileges(room, actorAccountId, dto.targetAccountId);

    const removed = await this.studyRoomState.forceRemoveParticipant(
      dto.roomId,
      dto.targetAccountId,
    );

    if (!removed.state) {
      throw new NotFoundException(
        'Target participant is not currently in the room',
      );
    }

    await this.prisma.roomAction.create({
      data: {
        room_id: dto.roomId,
        target_account_id: dto.targetAccountId,
        action_type: 'kick',
      },
    });

    const removedAt = new Date();
    const durationMinutes = await this.persistCompletedSession(
      removed.state,
      removedAt,
      dto.roomId,
    );

    return {
      roomId: dto.roomId,
      targetAccountId: dto.targetAccountId,
      participant: await this.buildParticipantPresence(removed.state),
      socketIds: removed.state.socketIds,
      durationMinutes,
      removedAt: removedAt.toISOString(),
    };
  }

  async banParticipant(actorAccountId: number, dto: BanRoomParticipantDto) {
    const room = await this.getRoomOrThrow(dto.roomId);
    this.ensureHostPrivileges(room, actorAccountId, dto.targetAccountId);

    const bannedUntil = this.resolveBannedUntil(dto);
    const now = new Date();
    const activeBan = await this.findActiveBan(
      dto.roomId,
      dto.targetAccountId,
      now,
    );

    if (activeBan) {
      await this.prisma.roomBan.update({
        where: { id: activeBan.id },
        data: { banned_until: bannedUntil },
      });
    } else {
      await this.prisma.roomBan.create({
        data: {
          room_id: dto.roomId,
          account_id: dto.targetAccountId,
          banned_until: bannedUntil,
        },
      });
    }

    const removed = await this.studyRoomState.forceRemoveParticipant(
      dto.roomId,
      dto.targetAccountId,
    );

    let participant: StudyRoomParticipantPresence | null = null;
    let durationMinutes = 0;
    let socketIds: string[] = [];

    if (removed.state) {
      participant = await this.buildParticipantPresence(removed.state);
      socketIds = removed.state.socketIds;
      durationMinutes = await this.persistCompletedSession(
        removed.state,
        now,
        dto.roomId,
      );
    }

    return {
      roomId: dto.roomId,
      targetAccountId: dto.targetAccountId,
      bannedUntil: bannedUntil?.toISOString() ?? null,
      participant,
      socketIds,
      durationMinutes,
    };
  }

  async unbanParticipant(actorAccountId: number, dto: KickRoomParticipantDto) {
    const room = await this.getRoomOrThrow(dto.roomId);
    this.ensureHostPrivileges(room, actorAccountId, dto.targetAccountId);

    const result = await this.prisma.roomBan.deleteMany({
      where: {
        room_id: dto.roomId,
        account_id: dto.targetAccountId,
      },
    });

    return {
      roomId: dto.roomId,
      targetAccountId: dto.targetAccountId,
      removedBans: result.count,
    };
  }

  async endRoomByHost(actorAccountId: number, roomId: number) {
    const room = await this.getRoomOrThrow(roomId);
    this.ensureRoomHostAccess(room, actorAccountId);

    const closedAt = new Date();
    const liveParticipants =
      await this.studyRoomState.listRoomParticipants(roomId);
    const realtimeAccountIds = liveParticipants.map(
      (participant) => participant.accountId,
    );

    const activeParticipants = await this.prisma.roomParticipant.findMany({
      where: {
        room_id: roomId,
        left_at: null,
      },
      select: {
        account_id: true,
        joined_at: true,
      },
    });

    const latestJoinByAccount = new Map<number, Date>();
    for (const participant of activeParticipants) {
      const previousJoinedAt = latestJoinByAccount.get(participant.account_id);
      if (!previousJoinedAt || participant.joined_at > previousJoinedAt) {
        latestJoinByAccount.set(participant.account_id, participant.joined_at);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.roomParticipant.updateMany({
        where: {
          room_id: roomId,
          left_at: null,
        },
        data: {
          left_at: closedAt,
          is_host: false,
        },
      });

      for (const [accountId, joinedAt] of latestJoinByAccount) {
        await this.completeActiveStudySession(
          tx,
          accountId,
          roomId,
          closedAt,
          joinedAt,
        );
      }

      await tx.room.delete({
        where: {
          room_id: roomId,
        },
      });
    });

    const disconnectedAccountIds = Array.from(
      new Set([...latestJoinByAccount.keys(), ...realtimeAccountIds]),
    );

    await Promise.all([
      ...disconnectedAccountIds.map((accountId) =>
        this.studyRoomState.forceRemoveParticipant(roomId, accountId),
      ),
      this.redisService.delete(this.getRoomUsersKey(roomId)),
      this.redisService.delete(this.getRoomAudioPublishersKey(roomId)),
      this.redisService.delete(this.getRoomVideoPublishersKey(roomId)),
      this.clearRoomTimer(roomId),
    ]);

    return {
      roomId,
      closedAt: closedAt.toISOString(),
      disconnectedAccountIds,
    };
  }

  async getMyStudyStats(accountId: number) {
    const [stats, streak, recentSessions] = await Promise.all([
      this.prisma.studyStat.findUnique({
        where: { account_id: accountId },
      }),
      this.prisma.dailyStreak.findUnique({
        where: { account_id: accountId },
      }),
      this.prisma.studySession.findMany({
        where: {
          account_id: accountId,
          ended_at: {
            not: null,
          },
        },
        orderBy: { ended_at: 'desc' },
        take: 10,
        include: {
          room: true,
        },
      }),
    ]);

    const totalMinutes = stats?.total_minutes ?? 0;
    const rank =
      totalMinutes > 0
        ? (await this.prisma.studyStat.count({
            where: {
              total_minutes: {
                gt: totalMinutes,
              },
            },
          })) + 1
        : null;

    return {
      totals: {
        totalMinutes,
        totalSessions: stats?.total_sessions ?? 0,
        updatedAt: stats?.updated_at ?? null,
      },
      streak: {
        current: streak?.current_streak ?? 0,
        longest: streak?.longest_streak ?? 0,
        lastStudyDate: streak?.last_study_date ?? null,
      },
      leaderboard: {
        score: totalMinutes,
        rank,
      },
      recentSessions: recentSessions.map((session) => ({
        id: session.id,
        roomId: session.room_id,
        roomTitle: session.room?.title ?? null,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        durationMinutes: session.duration_minutes,
      })),
    };
  }

  async getLeaderboard(limit = DEFAULT_LEADERBOARD_LIMIT) {
    const take = Math.max(1, Math.min(limit, 50));

    const stats = await this.prisma.studyStat.findMany({
      orderBy: [{ total_minutes: 'desc' }, { updated_at: 'asc' }],
      take,
      include: {
        account: {
          include: {
            profile: true,
            dailyStreak: true,
          },
        },
      },
    });

    return {
      items: stats.map((entry, index) => ({
        rank: index + 1,
        accountId: entry.account_id,
        fullName: entry.account.profile?.full_name ?? entry.account.email,
        avatarUrl: entry.account.profile?.avatar_url ?? null,
        score: entry.total_minutes,
        totalMinutes: entry.total_minutes,
        totalSessions: entry.total_sessions,
        currentStreak: entry.account.dailyStreak?.current_streak ?? 0,
        updatedAt: entry.updated_at,
      })),
    };
  }

  private buildRoomWhere(
    accountId: number,
    query: ListStudyRoomsDto,
  ): Prisma.RoomWhereInput {
    const where: Prisma.RoomWhereInput = {};

    if (query.search?.trim()) {
      where.title = {
        contains: query.search.trim(),
        mode: 'insensitive',
      };
    }

    if (query.roomMode) {
      where.room_mode = query.roomMode;
    }

    if (query.isPublic !== undefined) {
      where.is_public = query.isPublic;
      if (query.isPublic === false) {
        where.host_id = accountId;
      }
      return where;
    }

    where.OR = [{ is_public: true }, { host_id: accountId }];
    return where;
  }

  private async buildRoomSnapshot(roomId: number): Promise<StudyRoomSnapshot> {
    const liveStates = await this.studyRoomState.listRoomParticipants(roomId);
    if (liveStates.length === 0) {
      return {
        onlineCount: 0,
        participants: [],
      };
    }

    const accounts = await this.prisma.account.findMany({
      where: {
        account_id: {
          in: liveStates.map((state) => state.accountId),
        },
      },
      include: {
        profile: true,
      },
    });

    const accountMap = new Map(
      accounts.map((account) => [account.account_id, account] as const),
    );
    const participants = liveStates.map((state) =>
      this.mapParticipantPresence(state, accountMap.get(state.accountId)),
    );

    return {
      onlineCount: participants.length,
      participants,
    };
  }

  private async buildParticipantPresence(
    state: StudyRoomParticipantLiveState,
  ): Promise<StudyRoomParticipantPresence> {
    const account = await this.prisma.account.findUnique({
      where: { account_id: state.accountId },
      include: {
        profile: true,
      },
    });

    return this.mapParticipantPresence(state, account);
  }

  private serializeRoom(room: RoomWithHost, onlineCount: number) {
    return {
      roomId: room.room_id,
      title: room.title,
      roomMode: room.room_mode,
      coverType: room.cover_type,
      coverUrl: room.cover_url,
      isPublic: room.is_public,
      maxParticipants: room.max_participants,
      requiresPassword: Boolean(room.password_hash),
      createdAt: room.created_at,
      onlineCount,
      availableSlots: Math.max(room.max_participants - onlineCount, 0),
      host: room.host
        ? {
            accountId: room.host.account_id,
            fullName: room.host.profile?.full_name ?? room.host.email,
            avatarUrl: room.host.profile?.avatar_url ?? null,
          }
        : null,
    };
  }

  private serializeCreatedRoom(
    room: RoomWithHost,
    currentParticipantsCount: number,
  ): CreatedRoomResponseDto {
    return {
      room_id: room.room_id,
      host_id: room.host_id,
      title: room.title,
      room_mode: room.room_mode,
      cover_url: room.cover_url,
      cover_type: room.cover_type,
      max_participants: room.max_participants,
      current_participants_count: currentParticipantsCount,
      has_password: Boolean(room.password_hash),
      created_at: room.created_at,
    };
  }

  private async getRoomOrThrow(roomId: number): Promise<RoomWithHost> {
    const room = await this.prisma.room.findUnique({
      where: { room_id: roomId },
      include: {
        host: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Study room not found');
    }

    return room;
  }

  private async createRoomRecord(
    accountId: number,
    input: CreateRoomInput,
  ): Promise<RoomWithHost> {
    const title = input.title.trim();
    if (!title) {
      throw new BadRequestException('Room title is required');
    }

    const passwordHash = input.password
      ? await bcrypt.hash(input.password, 10)
      : null;
    const coverUrl = input.coverUrl?.trim() || null;

    return this.prisma.room.create({
      data: {
        host_id: accountId,
        title,
        room_mode: input.roomMode,
        password_hash: passwordHash,
        cover_type: input.coverType ?? null,
        cover_url: coverUrl,
        is_public: input.isPublic ?? true,
        max_participants: input.maxParticipants ?? 12,
      },
      include: {
        host: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  private async handleHostDepartureTransaction(
    tx: Prisma.TransactionClient,
    roomId: number,
    departingAccountId: number,
    isHostLeaving: boolean,
  ): Promise<{ newHostId: number | null; roomClosed: boolean }> {
    if (!isHostLeaving) {
      return {
        newHostId: null,
        roomClosed: false,
      };
    }

    const nextHostParticipant = await tx.roomParticipant.findFirst({
      where: {
        room_id: roomId,
        left_at: null,
        account_id: {
          not: departingAccountId,
        },
      },
      orderBy: [{ joined_at: 'asc' }],
    });

    if (!nextHostParticipant) {
      await tx.room.update({
        where: { room_id: roomId },
        data: {
          host_id: null,
          is_public: false,
        },
      });

      return {
        newHostId: null,
        roomClosed: true,
      };
    }

    await tx.roomParticipant.updateMany({
      where: {
        room_id: roomId,
        left_at: null,
      },
      data: {
        is_host: false,
      },
    });

    await tx.roomParticipant.update({
      where: { id: nextHostParticipant.id },
      data: {
        is_host: true,
      },
    });

    await tx.room.update({
      where: { room_id: roomId },
      data: {
        host_id: nextHostParticipant.account_id,
      },
    });

    return {
      newHostId: nextHostParticipant.account_id,
      roomClosed: false,
    };
  }

  private async ensureRoomAccess(
    accountId: number,
    roomId: number,
    password?: string,
  ): Promise<RoomWithHost> {
    const room = await this.getRoomOrThrow(roomId);
    const now = new Date();
    const activeBan = await this.findActiveBan(roomId, accountId, now);

    if (activeBan) {
      throw new ForbiddenException('You are banned from this study room');
    }

    if (room.password_hash && room.host_id !== accountId) {
      if (!password?.trim()) {
        throw new UnauthorizedException('Room password is required');
      }

      const matches = await bcrypt.compare(password, room.password_hash);
      if (!matches) {
        throw new UnauthorizedException('Incorrect room password');
      }
    }

    return room;
  }

  private ensureHostPrivileges(
    room: RoomWithHost,
    actorAccountId: number,
    targetAccountId: number,
  ) {
    if (room.host_id !== actorAccountId) {
      throw new ForbiddenException(
        'Only the room host can moderate participants',
      );
    }

    if (actorAccountId === targetAccountId) {
      throw new ForbiddenException('Room hosts cannot moderate themselves');
    }
  }

  private ensureRoomHostAccess(room: RoomWithHost, actorAccountId: number) {
    if (room.host_id !== actorAccountId) {
      throw new ForbiddenException(
        'Only the room host can perform this action',
      );
    }
  }

  private async createParticipantRecord(
    room: RoomWithHost,
    accountId: number,
    cameraOn: boolean,
    micOn: boolean,
    joinedAt: Date,
  ) {
    await this.prisma.roomParticipant.updateMany({
      where: {
        room_id: room.room_id,
        account_id: accountId,
        left_at: null,
      },
      data: {
        left_at: joinedAt,
      },
    });

    return this.prisma.roomParticipant.create({
      data: {
        room_id: room.room_id,
        account_id: accountId,
        is_host: room.host_id === accountId,
        camera_on: cameraOn,
        mic_on: micOn,
        joined_at: joinedAt,
      },
    });
  }

  private async assertActiveRoomParticipant(
    roomId: number,
    accountId: number,
  ): Promise<void> {
    const activeParticipant = await this.prisma.roomParticipant.findFirst({
      where: {
        room_id: roomId,
        account_id: accountId,
        left_at: null,
      },
      select: {
        id: true,
      },
    });

    if (!activeParticipant) {
      throw new ForbiddenException(
        'User is not an active participant in this room',
      );
    }
  }

  private async closeParticipantRecord(
    participantRecordId: number,
    cameraOn: boolean,
    micOn: boolean,
    leftAt: Date,
  ) {
    await this.prisma.roomParticipant.updateMany({
      where: {
        id: participantRecordId,
        left_at: null,
      },
      data: {
        left_at: leftAt,
        camera_on: cameraOn,
        mic_on: micOn,
      },
    });
  }

  private async persistCompletedSession(
    state: StudyRoomParticipantLiveState,
    endedAt: Date,
    roomId: number,
  ): Promise<number> {
    if (state.participantRecordId) {
      await this.closeParticipantRecord(
        state.participantRecordId,
        state.cameraOn,
        state.micOn,
        endedAt,
      );
    }

    return this.completeActiveStudySession(
      this.prisma,
      state.accountId,
      roomId,
      endedAt,
      this.parseStudySessionDate(state.sessionStartedAt),
    );
  }

  private async ensureActiveStudySession(
    client: StudyRoomDbClient,
    accountId: number,
    roomId: number,
    startedAt: Date,
  ): Promise<StudySession> {
    const existingSession = await client.studySession.findFirst({
      where: {
        account_id: accountId,
        room_id: roomId,
        ended_at: null,
      },
      orderBy: [{ started_at: 'desc' }, { id: 'desc' }],
    });

    if (existingSession) {
      return existingSession;
    }

    const normalizedStartedAt = this.normalizeStudySessionDate(
      startedAt,
      new Date(),
    );

    try {
      return await client.studySession.create({
        data: {
          account_id: accountId,
          room_id: roomId,
          started_at: normalizedStartedAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const concurrentSession = await client.studySession.findFirst({
          where: {
            account_id: accountId,
            room_id: roomId,
            ended_at: null,
          },
          orderBy: [{ started_at: 'desc' }, { id: 'desc' }],
        });

        if (concurrentSession) {
          return concurrentSession;
        }
      }

      throw error;
    }
  }

  private async completeActiveStudySession(
    client: StudyRoomDbClient,
    accountId: number,
    roomId: number,
    endedAt: Date,
    fallbackStartedAt?: Date | null,
  ): Promise<number> {
    let activeSession = await client.studySession.findFirst({
      where: {
        account_id: accountId,
        room_id: roomId,
        ended_at: null,
      },
      orderBy: [{ started_at: 'desc' }, { id: 'desc' }],
    });

    if (!activeSession && fallbackStartedAt) {
      activeSession = await this.ensureActiveStudySession(
        client,
        accountId,
        roomId,
        fallbackStartedAt,
      );
    }

    if (!activeSession) {
      return 0;
    }

    const safeEndedAt =
      endedAt > activeSession.started_at ? endedAt : activeSession.started_at;
    const rawDurationMinutes = Math.ceil(
      (safeEndedAt.getTime() - activeSession.started_at.getTime()) / 60000,
    );
    const durationMinutes = Math.max(rawDurationMinutes, 1);

    await client.studySession.update({
      where: { id: activeSession.id },
      data: {
        ended_at: safeEndedAt,
        duration_minutes: durationMinutes,
      },
    });

    const stats = await client.studyStat.upsert({
      where: { account_id: accountId },
      create: {
        account_id: accountId,
        total_minutes: durationMinutes,
        total_sessions: 1,
        updated_at: safeEndedAt,
      },
      update: {
        total_minutes: {
          increment: durationMinutes,
        },
        total_sessions: {
          increment: 1,
        },
        updated_at: safeEndedAt,
      },
    });

    if (durationMinutes >= this.minMinutesForStreak) {
      await this.updateDailyStreak(client, accountId, safeEndedAt);
    }

    await this.updateLeaderboard(client, accountId, stats, safeEndedAt);

    return durationMinutes;
  }

  private parseStudySessionDate(
    value?: string | null,
    fallback: Date | null = null,
  ): Date | null {
    if (!value) {
      return fallback;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return fallback;
    }

    return parsed;
  }

  private normalizeStudySessionDate(input: Date, fallback: Date): Date {
    return Number.isNaN(input.getTime()) ? fallback : input;
  }

  private async updateDailyStreak(
    client: StudyRoomDbClient,
    accountId: number,
    studyDate: Date,
  ) {
    const normalizedStudyDate = this.toDateOnly(studyDate);
    const existing = await client.dailyStreak.findUnique({
      where: { account_id: accountId },
    });

    if (!existing) {
      await client.dailyStreak.create({
        data: {
          account_id: accountId,
          current_streak: 1,
          longest_streak: 1,
          last_study_date: normalizedStudyDate,
        },
      });
      return;
    }

    const previousStudyDate = existing.last_study_date
      ? this.toDateOnly(existing.last_study_date)
      : null;

    if (
      previousStudyDate &&
      previousStudyDate.getTime() === normalizedStudyDate.getTime()
    ) {
      return;
    }

    const nextCurrentStreak =
      previousStudyDate &&
      this.diffCalendarDays(previousStudyDate, normalizedStudyDate) === 1
        ? existing.current_streak + 1
        : 1;

    await client.dailyStreak.update({
      where: { account_id: accountId },
      data: {
        current_streak: nextCurrentStreak,
        longest_streak: Math.max(existing.longest_streak, nextCurrentStreak),
        last_study_date: normalizedStudyDate,
      },
    });
  }

  private async updateLeaderboard(
    client: StudyRoomDbClient,
    accountId: number,
    stats: StudyStat,
    updatedAt: Date,
  ) {
    const higherScoreCount = await client.studyStat.count({
      where: {
        total_minutes: {
          gt: stats.total_minutes,
        },
      },
    });

    await client.leaderboard.upsert({
      where: { account_id: accountId },
      create: {
        account_id: accountId,
        score: stats.total_minutes,
        rank: higherScoreCount + 1,
        updated_at: updatedAt,
      },
      update: {
        score: stats.total_minutes,
        rank: higherScoreCount + 1,
        updated_at: updatedAt,
      },
    });
  }

  private async findActiveBan(roomId: number, accountId: number, now: Date) {
    return this.prisma.roomBan.findFirst({
      where: {
        room_id: roomId,
        account_id: accountId,
        OR: [{ banned_until: null }, { banned_until: { gt: now } }],
      },
      orderBy: { id: 'desc' },
    });
  }

  private resolveBannedUntil(dto: BanRoomParticipantDto): Date | null {
    if (dto.bannedUntil) {
      const bannedUntil = new Date(dto.bannedUntil);
      if (Number.isNaN(bannedUntil.getTime())) {
        throw new BadRequestException('Invalid ban expiry value');
      }

      return bannedUntil;
    }

    if (dto.durationMinutes) {
      const bannedUntil = new Date();
      bannedUntil.setMinutes(bannedUntil.getMinutes() + dto.durationMinutes);
      return bannedUntil;
    }

    return null;
  }

  private resolveExplicitBannedUntil(bannedUntilInput?: string): Date | null {
    if (!bannedUntilInput) {
      return null;
    }

    const bannedUntil = new Date(bannedUntilInput);
    if (Number.isNaN(bannedUntil.getTime())) {
      throw new BadRequestException('Invalid banned_until value');
    }

    return bannedUntil;
  }

  private toDateOnly(input: Date): Date {
    return new Date(input.getFullYear(), input.getMonth(), input.getDate());
  }

  private diffCalendarDays(previous: Date, current: Date): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.round(
      (current.getTime() - previous.getTime()) / millisecondsPerDay,
    );
  }

  private mapParticipantPresence(
    state: StudyRoomParticipantLiveState,
    account?: AccountWithProfile | null,
  ): StudyRoomParticipantPresence {
    return {
      accountId: state.accountId,
      fullName: account?.profile?.full_name ?? account?.email ?? null,
      avatarUrl: account?.profile?.avatar_url ?? null,
      email: account?.email ?? null,
      isHost: state.isHost,
      micOn: state.micOn,
      cameraOn: state.cameraOn,
      handRaised: state.handRaised,
      joinedAt: state.joinedAt,
      lastSeenAt: state.lastSeenAt,
    };
  }

  private async buildLiveKitAccessToken(
    roomId: number,
    accountId: number,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY')?.trim();
    const apiSecret = this.configService
      .get<string>('LIVEKIT_API_SECRET')
      ?.trim();

    if (!apiKey || !apiSecret) {
      throw new BadRequestException(
        'LiveKit is not configured. Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET',
      );
    }

    const identity = `acc-${accountId}-${Date.now()}-${Math.floor(
      Math.random() * 1_000_000,
    )}`;
    const roomName = this.buildLiveKitRoomName(roomId);
    const ttl =
      this.configService.get<string>('LIVEKIT_TOKEN_TTL')?.trim() || '2h';

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: `account-${accountId}`,
      metadata: JSON.stringify({
        accountId,
        roomId,
      }),
      ttl,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return token.toJwt();
  }

  private buildLiveKitRoomName(roomId: number): string {
    return `study-room-${roomId}`;
  }

  private resolveLiveKitWsUrl(): string {
    const configured = this.configService.get<string>('LIVEKIT_URL')?.trim();
    if (configured) {
      return configured;
    }

    return 'ws://localhost:7880';
  }

  private getRoomUsersKey(roomId: number): string {
    return `room:${roomId}:users`;
  }

  private getRoomTimerKey(roomId: number): string {
    return `room:${roomId}:timer`;
  }

  private getRoomAudioPublishersKey(roomId: number): string {
    return `room:${roomId}:audio_publishers`;
  }

  private getRoomVideoPublishersKey(roomId: number): string {
    return `room:${roomId}:video_publishers`;
  }
}
