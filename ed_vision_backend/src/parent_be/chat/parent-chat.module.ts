import { Module } from '@nestjs/common';
import { ParentChatController } from './parent-chat.controller';
import { ChatModule } from '../../mongodb/chat.module';

@Module({
    imports: [ChatModule],
    controllers: [ParentChatController],
})
export class ParentChatModule { }
