import { Module } from '@nestjs/common';
import { StudentChatController } from './student-chat.controller';
import { ChatModule } from '../../mongodb/chat.module';

@Module({
    imports: [ChatModule],
    controllers: [StudentChatController],
})
export class StudentChatModule { }
