import { Module } from '@nestjs/common';
import { TeacherChatController } from './teacher-chat.controller';
import { ChatModule } from '../../mongodb/chat.module';

@Module({
    imports: [ChatModule],
    controllers: [TeacherChatController],
})
export class TeacherChatModule { }
