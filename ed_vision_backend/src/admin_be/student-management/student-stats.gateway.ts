import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface StudentOnlineStats {
  totalCount: number;
  onlineCount: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/student-stats',
})
export class StudentStatsGateway
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

  broadcastOnlineStats(stats: StudentOnlineStats) {
    this.server.emit('studentOnlineStatsUpdated', stats);
  }
}
