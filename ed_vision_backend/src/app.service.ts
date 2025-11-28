import { Injectable } from '@nestjs/common';
import { checkMongoConnection } from './mongodb/database.utils';

@Injectable()
export class AppService {
  async getMongoStatus() {
    const isConnected = await checkMongoConnection();
    return { mongoConnected: isConnected };
  }
}
