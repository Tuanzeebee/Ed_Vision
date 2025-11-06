import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { InstructorOnlineStats } from './models/instructor-stats.type';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for development, restrict in production
    credentials: true,
  },
  namespace: '/instructor-stats', // Namespace for instructor stats
})
export class InstructorStatsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InstructorStatsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Method to broadcast online stats to all connected clients
  broadcastOnlineStats(stats: InstructorOnlineStats) {
    this.logger.log(
      `Broadcasting instructor online stats: ${JSON.stringify(stats)}`,
    );
    this.server.emit('instructorOnlineStatsUpdated', stats);
  }
}
