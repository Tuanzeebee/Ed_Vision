import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class MongodbService implements OnModuleInit {
  private client: MongoClient;
  private db: Db;

  async onModuleInit() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ed_vision';
    
    this.client = new MongoClient(uri, {
      auth: process.env.MONGO_USER
        ? {
            username: process.env.MONGO_USER,
            password: process.env.MONGO_PASS,
          }
        : undefined,
    });

    await this.client.connect();
    
    // Extract database name from URI or use default
    const dbName = process.env.MONGO_DB_NAME || 'ed_vision';
    this.db = this.client.db(dbName);
    
    console.log('[MongodbService] Connected to MongoDB');
  }

  getDb(): Db {
    return this.db;
  }

  getClient(): MongoClient {
    return this.client;
  }
}
