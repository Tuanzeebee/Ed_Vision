import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { DatabaseModule } from './database.module';
import { messageProviders } from './message.providers';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [DatabaseModule, PrismaModule],
  providers: [ChatService, ChatGateway, ...messageProviders],
  exports: [ChatService],
})
export class ChatModule {}
