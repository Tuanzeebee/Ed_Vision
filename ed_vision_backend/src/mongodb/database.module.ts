import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { DatabaseLogger } from './database.logger';

@Module({
  providers: [...databaseProviders, DatabaseLogger],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
