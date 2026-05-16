import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RagEmbeddingService } from './rag-embedding.service';
import { RagIngestionService } from './rag-ingestion.service';
import { RagRetrievalService } from './rag-retrieval.service';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RagController],
  providers: [
    RagEmbeddingService,
    RagIngestionService,
    RagRetrievalService,
    RagService,
  ],
  exports: [RagService, RagRetrievalService],
})
export class RagModule {}
