import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient } from 'redis';

type GenericRedisClient = ReturnType<typeof createClient>;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisUrl = process.env.REDIS_URL?.trim();
  private readonly redisRequired = process.env.REDIS_REQUIRED === 'true';
  private readonly keyPrefix =
    process.env.REDIS_KEY_PREFIX?.trim() || 'edvision';
  private client: GenericRedisClient | null = null;
  private readonly memorySets = new Map<string, Set<string>>();

  async onModuleInit() {
    if (!this.redisUrl) {
      this.logger.log('Redis is disabled because REDIS_URL is not configured.');
      return;
    }

    const client = createClient({
      url: this.redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    });

    client.on('error', (error) => {
      this.logger.error(`Redis client error: ${error.message}`);
    });

    try {
      await client.connect();
      this.client = client;
      this.logger.log('Connected to Redis.');
    } catch (error) {
      this.client = null;
      const message =
        error instanceof Error ? error.message : 'Unknown Redis connection error';

      if (this.redisRequired) {
        throw error;
      }

      this.logger.error(
        `Redis unavailable, falling back to in-memory mode: ${message}`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client?.isOpen) {
      await this.client.quit();
    }
  }

  isReady(): boolean {
    return Boolean(this.client?.isOpen);
  }

  getClient(): GenericRedisClient | null {
    return this.client;
  }

  getKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<boolean> {
    if (!this.client?.isOpen) {
      return false;
    }

    const payload = JSON.stringify(value);
    const namespacedKey = this.getKey(key);

    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(namespacedKey, payload, { EX: ttlSeconds });
      return true;
    }

    await this.client.set(namespacedKey, payload);
    return true;
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client?.isOpen) {
      return null;
    }

    const payload = await this.client.get(this.getKey(key));
    if (!payload) {
      return null;
    }

    return JSON.parse(payload) as T;
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client?.isOpen) {
      this.memorySets.delete(this.getKey(key));
      return false;
    }

    await this.client.del(this.getKey(key));
    return true;
  }

  async addToSet(key: string, member: string): Promise<number> {
    const namespacedKey = this.getKey(key);
    if (!this.client?.isOpen) {
      const existing = this.memorySets.get(namespacedKey) ?? new Set<string>();
      existing.add(member);
      this.memorySets.set(namespacedKey, existing);
      return existing.size;
    }

    return this.client.sAdd(namespacedKey, member);
  }

  async removeFromSet(key: string, member: string): Promise<number> {
    const namespacedKey = this.getKey(key);
    if (!this.client?.isOpen) {
      const existing = this.memorySets.get(namespacedKey);
      if (!existing) {
        return 0;
      }

      const deleted = existing.delete(member);
      if (existing.size === 0) {
        this.memorySets.delete(namespacedKey);
      }

      return deleted ? 1 : 0;
    }

    return this.client.sRem(namespacedKey, member);
  }

  async getSetMembers(key: string): Promise<string[]> {
    const namespacedKey = this.getKey(key);
    if (!this.client?.isOpen) {
      return Array.from(this.memorySets.get(namespacedKey) ?? []);
    }

    return this.client.sMembers(namespacedKey);
  }
}
