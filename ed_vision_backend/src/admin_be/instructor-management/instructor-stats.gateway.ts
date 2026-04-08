import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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

  handleConnection(client: Socket) {
    // connection established (silent)
  }

  handleDisconnect(client: Socket) {
    // client disconnected (silent)
  }

  // Method to broadcast online stats to all connected clients
  broadcastOnlineStats(stats: InstructorOnlineStats) {
    this.server.emit('instructorOnlineStatsUpdated', stats);
  }
}
