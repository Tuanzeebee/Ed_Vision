import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { VocabController } from './vocab.controller';
import { VocabService } from './vocab.service';
import { VocabTestService } from './vocab-test.service';
import { VocabLookupService } from './vocab-lookup.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [VocabController],
  providers: [VocabService, VocabTestService, VocabLookupService],
  exports: [VocabService, VocabTestService, VocabLookupService],
})
export class VocabModule {}
