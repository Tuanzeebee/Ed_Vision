import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, ConnectedClient> = new Map();

  handleConnection(client: Socket) {
    const accountId = parseInt(client.handshake.query.accountId as string) || 0;
    const role = (client.handshake.query.role as string) || 'student';

    if (accountId) {
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
    let sentCount = 0;

    this.connectedClients.forEach((client) => {
      // Kiểm tra xem client có trong danh sách người nhận không
      if (recipientAccountIds.includes(client.accountId)) {
        client.socket.emit('newNotification', notification);
        sentCount++;
      }
    });

    return sentCount;
  }

  /**
   * Broadcast thông báo đến tất cả client theo role
   */
  broadcastToRole(notification: NotificationPayload, targetRoles: string[]) {
    let sentCount = 0;

    this.connectedClients.forEach((client) => {
      if (targetRoles.includes('all') || targetRoles.includes(client.role)) {
        client.socket.emit('newNotification', notification);
        sentCount++;
      }
    });

    return sentCount;
  }

  @SubscribeMessage('ping')
  handlePing(): string {
    return 'pong';
  }
}
