import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VocabController } from './vocab.controller';
import { VocabService } from './vocab.service';
import { VocabTestService } from './vocab-test.service';

@Module({
  imports: [PrismaModule],
  controllers: [VocabController],
  providers: [VocabService, VocabTestService],
  exports: [VocabService, VocabTestService],
})
export class VocabModule {}
