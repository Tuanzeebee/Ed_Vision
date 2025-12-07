import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    conversationId: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}

export class CreateConversationDto {
    @IsString()
    @IsNotEmpty()
    studentId: string;

    @IsString()
    @IsNotEmpty()
    studentName: string;

    @IsEnum(['teacher-student', 'teacher-parent'])
    @IsNotEmpty()
    conversationType: 'teacher-student' | 'teacher-parent';

    @IsOptional()
    metadata?: any;
}

export class GetMessagesDto {
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    limit?: number = 50;

    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    skip?: number = 0;
}

export class MarkAsReadDto {
    @IsString()
    @IsNotEmpty()
    conversationId: string;
}

export class EditMessageDto {
    @IsString()
    @IsNotEmpty()
    messageId: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}

export class DeleteMessageDto {
    @IsString()
    @IsNotEmpty()
    messageId: string;
}
