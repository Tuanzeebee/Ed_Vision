import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';
import { buildSocketCorsOptions } from '../common/config/network.config';

@WebSocketGateway({
  cors: buildSocketCorsOptions(),
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove from userSockets
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  handleRegister(
    @MessageBody() data: { userId: string; userType: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.userSockets.set(data.userId, client.id);
    this.logger.log(
      ` User registered: ${data.userId} (${data.userType}) - Socket: ${client.id}`,
    );

    // Join user to their personal room
    client.join(`user:${data.userId}`);

    return { success: true };
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} joined conversation ${data.conversationId}`,
    );
    return { success: true };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(
      `Client ${client.id} left conversation ${data.conversationId}`,
    );
    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      senderType: 'teacher' | 'student' | 'parent';
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      ` Received message from ${data.senderId} in conversation ${data.conversationId}`,
    );

    try {
      // Save message to database
      const message = await this.chatService.sendMessage(
        data.conversationId,
        data.senderId,
        data.senderType,
        data.content,
      );

      this.logger.log(` Message saved to DB: ${message._id}`);

      // Broadcast to all users in conversation (including sender)
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('newMessage', message);

      this.logger.log(
        ` Broadcasting to room: conversation:${data.conversationId}`,
      );

      // Also send to each participant's personal room (for notification badge)
      // CRITICAL: Send to ALL participants (including sender) for conversation list updates
      const conversation = await this.chatService.getConversationById(
        data.conversationId,
      );
      conversation.participants.forEach((participant) => {
        this.server
          .to(`user:${participant.userId}`)
          .emit('conversationUpdated', {
            conversationId: data.conversationId,
            lastMessage: {
              content: data.content,
              senderId: data.senderId,
              senderName: message.senderName,
              timestamp: message.createdAt,
            },
          });
        this.logger.log(
          ` Notified user: ${participant.userId} (sender: ${participant.userId === data.senderId ? 'YES' : 'NO'})`,
        );
      });

      return { success: true, message };
    } catch (error) {
      this.logger.error(' Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody()
    data: {
      conversationId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast typing status to others in conversation (not sender)
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    try {
      await this.chatService.markAsRead(data.conversationId, data.userId);

      // Notify other participants that messages were read
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('messagesRead', {
          conversationId: data.conversationId,
          userId: data.userId,
        });

      return { success: true };
    } catch (error) {
      this.logger.error('Error marking as read:', error);
      return { success: false, error: error.message };
    }
  }
}
