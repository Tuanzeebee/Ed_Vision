import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { buildSocketCorsOptions } from '../../common/config/network.config';

export interface StudentOnlineStats {
  totalCount: number;
  onlineCount: number;
}

@WebSocketGateway({
  cors: buildSocketCorsOptions(),
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
