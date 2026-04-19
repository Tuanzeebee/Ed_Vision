import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { buildSocketCorsOptions } from '../../common/config/network.config';

interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  target: string;
  createdAt: string;
}

interface ConnectedClient {
  socket: Socket;
  accountId: number;
  role: string;
}

@WebSocketGateway({
  cors: buildSocketCorsOptions(),
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, ConnectedClient> = new Map();

  private getAccountRoom(accountId: number): string {
    return `account:${accountId}`;
  }

  private getRoleRoom(role: string): string {
    return `role:${role}`;
  }

  handleConnection(client: Socket) {
    const accountId = parseInt(client.handshake.query.accountId as string) || 0;
    const role = (client.handshake.query.role as string) || 'student';

    if (accountId) {
      client.join(this.getAccountRoom(accountId));
      client.join(this.getRoleRoom(role));
      this.connectedClients.set(client.id, {
        socket: client,
        accountId,
        role,
      });
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  /**
   * Broadcast thông báo đến các client theo target
   */
  broadcastNotification(
    notification: NotificationPayload,
    recipientAccountIds: number[],
  ) {
    recipientAccountIds.forEach((accountId) => {
      this.server
        .to(this.getAccountRoom(accountId))
        .emit('newNotification', notification);
    });

    return recipientAccountIds.length;
  }

  /**
   * Broadcast thông báo đến tất cả client theo role
   */
  broadcastToRole(notification: NotificationPayload, targetRoles: string[]) {
    if (targetRoles.includes('all')) {
      this.server.emit('newNotification', notification);
      return this.connectedClients.size;
    }

    targetRoles.forEach((role) => {
      this.server.to(this.getRoleRoom(role)).emit('newNotification', notification);
    });

    return targetRoles.length;
  }

  @SubscribeMessage('ping')
  handlePing(): string {
    return 'pong';
  }
}
