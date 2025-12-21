import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { databaseProviders } from './database.providers';
import { DatabaseLogger } from './database.logger';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri =
          process.env.MONGO_URI || 'mongodb://localhost:27017/ed_vision';

        return {
          uri,
          auth: process.env.MONGO_USER
            ? {
                username: process.env.MONGO_USER,
                password: process.env.MONGO_PASS,
              }
            : undefined,
        };
      },
    }),
  ],
  providers: [...databaseProviders, DatabaseLogger],
  exports: [...databaseProviders, MongooseModule],
})
export class DatabaseModule {}
