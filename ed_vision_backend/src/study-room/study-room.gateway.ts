import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { buildSocketCorsOptions } from '../common/config/network.config';
import { BanUserSocketDto } from './dto/ban-user-socket.dto';
import { BanRoomParticipantDto } from './dto/ban-room-participant.dto';
import { EndRoomSocketDto } from './dto/end-room-socket.dto';
import { JoinStudyRoomDto } from './dto/join-study-room.dto';
import { JoinRoomSocketDto } from './dto/join-room-socket.dto';
import { KickRoomParticipantDto } from './dto/kick-room-participant.dto';
import { KickUserSocketDto } from './dto/kick-user-socket.dto';
import { LeaveRoomSocketDto } from './dto/leave-room-socket.dto';
import { MuteRoomParticipantDto } from './dto/mute-room-participant.dto';
import { StartRoomTimerDto } from './dto/start-room-timer.dto';
import { SyncRoomTimerDto } from './dto/sync-room-timer.dto';
import { ToggleMediaStateDto } from './dto/toggle-media-state.dto';
import { UpdateRoomParticipantStateDto } from './dto/update-room-participant-state.dto';
import {
  STUDY_ROOM_CHANNEL_PREFIX,
  STUDY_ROOM_SOCKET_NAMESPACE,
  STUDY_ROOM_USER_ROOM_PREFIX,
} from './study-room.constants';
import { StudyRoomAuthService } from './study-room-auth.service';
import { StudyRoomService } from './study-room.service';
import { StudyRoomSocketUser } from './study-room.types';
import { OnlineStatusManagerService } from './services/online-status-manager.service';

@WebSocketGateway({
  cors: buildSocketCorsOptions(),
  namespace: STUDY_ROOM_SOCKET_NAMESPACE,
})
export class StudyRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly studyRoomAuthService: StudyRoomAuthService,
    private readonly studyRoomService: StudyRoomService,
    private readonly onlineStatusManager: OnlineStatusManagerService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.studyRoomAuthService.authenticateSocket(client);
      client.data.user = user;
      client.data.joinedRooms = new Set<number>();
      client.join(this.getUserRoom(user.accountId));

      client.emit('room.connected', {
        accountId: user.accountId,
        role: user.role,
        displayName: user.displayName,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to authenticate socket';
      client.emit('room.error', { message });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as StudyRoomSocketUser | undefined;
    if (!user) {
      return;
    }

    // Set user as offline
    await this.onlineStatusManager.setOffline(user.accountId);

    const joinedRooms = this.getJoinedRooms(client);
    for (const roomId of joinedRooms) {
      try {
        await this.studyRoomService.clearRealtimeMediaState(
          roomId,
          user.accountId,
        );
        const users = await this.studyRoomService.removeUserFromRoomSocketList(
          roomId,
          user.accountId,
        );
        this.server.to(this.getRoomChannel(roomId)).emit('user_left', {
          roomId,
          userId: user.accountId,
          users,
        });

        const result = await this.studyRoomService.leaveRoom(
          user.accountId,
          client.id,
          roomId,
          'disconnected',
        );

        if (result.participantLeft && result.participant) {
          this.server
            .to(this.getRoomChannel(roomId))
            .emit('room.participant.left', {
              roomId,
              participant: result.participant,
              reason: 'disconnected',
              durationMinutes: result.durationMinutes ?? 0,
            });
        }
      } catch {
        // Ignore disconnect cleanup errors so a single bad room does not block the socket teardown.
      }
    }
  }

  @SubscribeMessage('join_room')
  async joinRoomSocket(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomSocketDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      if (payload.userId !== user.accountId) {
        throw new WsException('Socket user does not match payload userId');
      }

      const users = await this.studyRoomService.addUserToRoomSocketList(
        payload.roomId,
        payload.userId,
      );

      // Set user as online when joining a room
      await this.onlineStatusManager.setOnline(user.accountId);

      client.join(this.getRoomChannel(payload.roomId));
      this.getJoinedRooms(client).add(payload.roomId);

      this.server.to(this.getRoomChannel(payload.roomId)).emit('user_joined', {
        roomId: payload.roomId,
        userId: payload.userId,
        users,
      });

      return {
        success: true,
        roomId: payload.roomId,
        users,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('toggle_mic')
  async toggleMic(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ToggleMediaStateDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      await this.studyRoomService.toggleRealtimeMediaState(
        payload.roomId,
        user.accountId,
        'audio',
        payload.enabled,
      );

      this.server.to(this.getRoomChannel(payload.roomId)).emit(
        'user_mic_updated',
        {
          roomId: payload.roomId,
          userId: user.accountId,
          enabled: payload.enabled,
        },
      );

      return {
        success: true,
        roomId: payload.roomId,
        userId: user.accountId,
        enabled: payload.enabled,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('toggle_camera')
  async toggleCamera(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ToggleMediaStateDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      await this.studyRoomService.toggleRealtimeMediaState(
        payload.roomId,
        user.accountId,
        'video',
        payload.enabled,
      );

      this.server.to(this.getRoomChannel(payload.roomId)).emit(
        'user_camera_updated',
        {
          roomId: payload.roomId,
          userId: user.accountId,
          enabled: payload.enabled,
        },
      );

      return {
        success: true,
        roomId: payload.roomId,
        userId: user.accountId,
        enabled: payload.enabled,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('leave_room')
  async leaveRoomSocket(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomSocketDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      if (payload.userId !== user.accountId) {
        throw new WsException('Socket user does not match payload userId');
      }

      const result = await this.studyRoomService.leavePublicRoom(
        payload.userId,
        payload.roomId,
      );

      // Set user as offline when leaving a room
      await this.onlineStatusManager.setOffline(user.accountId);

      this.getJoinedRooms(client).delete(payload.roomId);
      client.leave(this.getRoomChannel(payload.roomId));

      this.server.to(this.getRoomChannel(payload.roomId)).emit('user_left', {
        roomId: payload.roomId,
        userId: payload.userId,
        users: result.users,
        newHostId: result.newHostId,
        roomClosed: result.roomClosed,
      });

      client.emit('room.left', {
        roomId: payload.roomId,
        roomClosed: result.roomClosed,
      });

      return {
        success: true,
        roomId: payload.roomId,
        users: result.users,
        newHostId: result.newHostId,
        roomClosed: result.roomClosed,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('kick_user')
  async kickUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: KickUserSocketDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const result = await this.studyRoomService.kickUserFromRoom(
        user.accountId,
        payload.roomId,
        payload.targetUserId,
      );

      this.server
        .in(this.getUserRoom(payload.targetUserId))
        .socketsLeave(this.getRoomChannel(payload.roomId));

      this.server.to(this.getUserRoom(payload.targetUserId)).emit('force_leave', {
        roomId: payload.roomId,
        reason: 'kicked',
      });

      this.server.to(this.getRoomChannel(payload.roomId)).emit('user_left', {
        roomId: payload.roomId,
        userId: payload.targetUserId,
        users: result.users,
      });

      return {
        success: true,
        roomId: payload.roomId,
        targetUserId: payload.targetUserId,
        users: result.users,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('ban_user')
  async banUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: BanUserSocketDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const result = await this.studyRoomService.banUserFromRoom(
        user.accountId,
        payload.roomId,
        payload.targetUserId,
        payload.banned_until,
      );

      this.server
        .in(this.getUserRoom(payload.targetUserId))
        .socketsLeave(this.getRoomChannel(payload.roomId));

      if (result.forcedLeave) {
        this.server.to(this.getUserRoom(payload.targetUserId)).emit('force_leave', {
          roomId: payload.roomId,
          reason: 'banned',
          banned_until: result.bannedUntil,
        });
      }

      this.server.to(this.getRoomChannel(payload.roomId)).emit('user_left', {
        roomId: payload.roomId,
        userId: payload.targetUserId,
        users: result.users,
        banned_until: result.bannedUntil,
      });

      return {
        success: true,
        roomId: payload.roomId,
        targetUserId: payload.targetUserId,
        banned_until: result.bannedUntil,
        users: result.users,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('start_timer')
  async startTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartRoomTimerDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const timer = await this.studyRoomService.startRoomTimer(
        user.accountId,
        payload.roomId,
        payload.durationSeconds,
      );

      this.server.to(this.getRoomChannel(payload.roomId)).emit('timer_sync', {
        roomId: payload.roomId,
        timer,
      });

      return {
        success: true,
        roomId: payload.roomId,
        timer,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('sync_timer')
  async syncTimer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SyncRoomTimerDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const timer = await this.studyRoomService.getRoomTimer(
        payload.roomId,
        user.accountId,
      );

      this.server.to(this.getRoomChannel(payload.roomId)).emit('timer_sync', {
        roomId: payload.roomId,
        timer,
      });

      return {
        success: true,
        roomId: payload.roomId,
        timer,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.join')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinStudyRoomDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const result = await this.studyRoomService.joinRoom(
        user.accountId,
        client.id,
        payload,
      );

      // Set user as online when joining a room
      await this.onlineStatusManager.setOnline(user.accountId);

      client.join(this.getRoomChannel(payload.roomId));
      this.getJoinedRooms(client).add(payload.roomId);

      client.emit('room.joined', {
        roomId: payload.roomId,
        room: result.room,
        participant: result.participant,
      });

      if (result.isFirstConnection && result.participant) {
        client
          .to(this.getRoomChannel(payload.roomId))
          .emit('room.participant.joined', {
            roomId: payload.roomId,
            participant: result.participant,
          });
      }

      return {
        success: true,
        room: result.room,
        participant: result.participant,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.leave')
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: number },
  ) {
    const user = this.getSocketUser(client);
      try {
        const result = await this.studyRoomService.leaveRoom(
          user.accountId,
          client.id,
          payload.roomId,
          'left',
        );
        await this.studyRoomService.clearRealtimeMediaState(
          payload.roomId,
          user.accountId,
        );

        // Set user as offline when leaving a room
        await this.onlineStatusManager.setOffline(user.accountId);

        this.getJoinedRooms(client).delete(payload.roomId);
        client.leave(this.getRoomChannel(payload.roomId));
        const users = await this.studyRoomService.removeUserFromRoomSocketList(
          payload.roomId,
        user.accountId,
      );

      this.server.to(this.getRoomChannel(payload.roomId)).emit('user_left', {
        roomId: payload.roomId,
        userId: user.accountId,
        users,
      });

      if (result.participantLeft && result.participant) {
        client
          .to(this.getRoomChannel(payload.roomId))
          .emit('room.participant.left', {
            roomId: payload.roomId,
            participant: result.participant,
            reason: 'left',
            durationMinutes: result.durationMinutes ?? 0,
          });
      }

      client.emit('room.left', {
        roomId: payload.roomId,
      });

      return {
        success: true,
        roomId: payload.roomId,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.heartbeat')
  async heartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload?: { roomIds?: number[] },
  ) {
    const user = this.getSocketUser(client);
    try {
      const joinedRooms = Array.from(this.getJoinedRooms(client));
      const roomIds =
        payload?.roomIds && payload.roomIds.length > 0
          ? payload.roomIds
          : joinedRooms;

      return this.studyRoomService.refreshPresence(
        user.accountId,
        client.id,
        roomIds,
      );
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.participant.update')
  async updateParticipantState(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdateRoomParticipantStateDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const result = await this.studyRoomService.updateParticipantState(
        user.accountId,
        client.id,
        payload,
      );

      this.server
        .to(this.getRoomChannel(payload.roomId))
        .emit('room.participant.updated', result);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.moderation.mute')
  async muteParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MuteRoomParticipantDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const result = await this.studyRoomService.muteParticipant(
        user.accountId,
        payload,
      );

      this.server
        .to(this.getRoomChannel(payload.roomId))
        .emit('room.participant.updated', result);
      this.server
        .to(this.getUserRoom(payload.targetAccountId))
        .emit('room.participant.muted', result);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.moderation.kick')
  async kickParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: KickRoomParticipantDto,
  ) {
    const user = this.getSocketUser(client);
      try {
        const result = await this.studyRoomService.kickParticipant(
          user.accountId,
          payload,
        );
        await this.studyRoomService.clearRealtimeMediaState(
          payload.roomId,
          payload.targetAccountId,
        );
        const users = await this.studyRoomService.removeUserFromRoomSocketList(
          payload.roomId,
          payload.targetAccountId,
        );

        for (const socketId of result.socketIds) {
          this.server.in(socketId).socketsLeave(this.getRoomChannel(payload.roomId));
        }

        this.server
          .to(this.getUserRoom(payload.targetAccountId))
          .emit('room.participant.kicked', {
            roomId: payload.roomId,
            targetAccountId: payload.targetAccountId,
          });

        this.server.to(this.getRoomChannel(payload.roomId)).emit('user_left', {
          roomId: payload.roomId,
          userId: payload.targetAccountId,
          users,
        });

        this.server
          .to(this.getRoomChannel(payload.roomId))
          .emit('room.participant.left', {
          roomId: payload.roomId,
          participant: result.participant,
          reason: 'kicked',
          durationMinutes: result.durationMinutes,
        });

      return {
        success: true,
        roomId: payload.roomId,
        targetAccountId: payload.targetAccountId,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.moderation.ban')
  async banParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: BanRoomParticipantDto,
  ) {
    const user = this.getSocketUser(client);
      try {
        const result = await this.studyRoomService.banParticipant(
          user.accountId,
          payload,
        );
        await this.studyRoomService.clearRealtimeMediaState(
          payload.roomId,
          payload.targetAccountId,
        );
        const users = await this.studyRoomService.removeUserFromRoomSocketList(
          payload.roomId,
          payload.targetAccountId,
        );

        for (const socketId of result.socketIds) {
          this.server.in(socketId).socketsLeave(this.getRoomChannel(payload.roomId));
        }

        this.server
          .to(this.getUserRoom(payload.targetAccountId))
          .emit('room.participant.banned', {
            roomId: payload.roomId,
            targetAccountId: payload.targetAccountId,
            bannedUntil: result.bannedUntil,
          });

        this.server.to(this.getRoomChannel(payload.roomId)).emit('user_left', {
          roomId: payload.roomId,
          userId: payload.targetAccountId,
          users,
        });

        if (result.participant) {
          this.server
          .to(this.getRoomChannel(payload.roomId))
          .emit('room.participant.left', {
            roomId: payload.roomId,
            participant: result.participant,
            reason: 'banned',
            durationMinutes: result.durationMinutes,
          });
      }

      return {
        success: true,
        roomId: payload.roomId,
        targetAccountId: payload.targetAccountId,
        bannedUntil: result.bannedUntil,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.moderation.unban')
  async unbanParticipant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: KickRoomParticipantDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const result = await this.studyRoomService.unbanParticipant(
        user.accountId,
        payload,
      );

      this.server
        .to(this.getUserRoom(payload.targetAccountId))
        .emit('room.participant.unbanned', {
          roomId: payload.roomId,
          targetAccountId: payload.targetAccountId,
        });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('room.moderation.end')
  async endRoomByHost(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: EndRoomSocketDto,
  ) {
    const user = this.getSocketUser(client);
    try {
      const result = await this.studyRoomService.endRoomByHost(
        user.accountId,
        payload.roomId,
      );
      const roomClosedPayload = {
        roomId: payload.roomId,
        endedBy: user.accountId,
        closedAt: result.closedAt,
      };

      this.server
        .to(this.getRoomChannel(payload.roomId))
        .emit('room.closed', roomClosedPayload);

      for (const accountId of result.disconnectedAccountIds) {
        this.server
          .to(this.getUserRoom(accountId))
          .emit('room.closed', roomClosedPayload);
      }

      this.server
        .in(this.getRoomChannel(payload.roomId))
        .socketsLeave(this.getRoomChannel(payload.roomId));
      this.getJoinedRooms(client).delete(payload.roomId);

      return {
        success: true,
        ...roomClosedPayload,
        disconnectedAccountIds: result.disconnectedAccountIds,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  private getSocketUser(client: Socket): StudyRoomSocketUser {
    const user = client.data.user as StudyRoomSocketUser | undefined;
    if (!user) {
      throw new WsException('Unauthenticated study room socket');
    }

    return user;
  }

  private getJoinedRooms(client: Socket): Set<number> {
    if (!(client.data.joinedRooms instanceof Set)) {
      client.data.joinedRooms = new Set<number>();
    }

    return client.data.joinedRooms as Set<number>;
  }

  private getUserRoom(accountId: number): string {
    return `${STUDY_ROOM_USER_ROOM_PREFIX}${accountId}`;
  }

  private getRoomChannel(roomId: number): string {
    return `${STUDY_ROOM_CHANNEL_PREFIX}${roomId}`;
  }

  private toWsException(error: unknown): WsException {
    if (error instanceof WsException) {
      return error;
    }

    if (error instanceof Error) {
      return new WsException(error.message);
    }

    return new WsException('Unexpected study room error');
  }
}
