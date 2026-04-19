import { Logger, type INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { ServerOptions } from 'socket.io';
import { buildSocketCorsOptions } from '../common/config/network.config';

type GenericRedisClient = ReturnType<typeof createClient>;

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private pubClient?: GenericRedisClient;
  private subClient?: GenericRedisClient;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
      this.logger.log(
        'Socket.IO Redis adapter is disabled because REDIS_URL is not configured.',
      );
      return;
    }

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.pubClient = pubClient;
      this.subClient = subClient;
      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log('Socket.IO Redis adapter enabled.');
    } catch (error) {
      this.logger.error(
        `Failed to enable Socket.IO Redis adapter: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      await this.closeConnections();
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: options?.cors ?? buildSocketCorsOptions(),
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }

  async closeConnections(): Promise<void> {
    if (this.pubClient?.isOpen) {
      await this.pubClient.quit();
    }

    if (this.subClient?.isOpen) {
      await this.subClient.quit();
    }
  }
}
