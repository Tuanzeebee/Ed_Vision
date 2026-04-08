import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import mongoose from 'mongoose';

@Injectable()
export class DatabaseLogger implements OnModuleInit {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly connection: typeof mongoose,
  ) {}

  onModuleInit() {
    const conn = this.connection.connection; // chính xác là connection.connection

    conn.on('connected', () => {
      console.log('[MongoDB] Connected successfully');
    });

    conn.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err);
    });

    conn.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected');
    });

    // Nếu đã kết nối rồi thì in luôn
    if (conn.readyState === 1) {
      // MongoDB already connected (silent)
    }
  }
}
