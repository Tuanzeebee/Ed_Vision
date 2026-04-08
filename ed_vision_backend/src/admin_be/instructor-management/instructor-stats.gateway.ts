import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InstructorOnlineStats } from './models/instructor-stats.type';
import { buildSocketCorsOptions } from '../../common/config/network.config';

@WebSocketGateway({
  cors: buildSocketCorsOptions(),
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
