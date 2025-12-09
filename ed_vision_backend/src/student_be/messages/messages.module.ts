import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { DatabaseModule } from '../../mongodb/database.module';
import { messageProviders } from '../../mongodb/message.providers';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    imports: [DatabaseModule],
    controllers: [MessagesController],
    providers: [MessagesService, ...messageProviders, PrismaService],
    exports: [MessagesService],
})
export class MessagesModule { }
