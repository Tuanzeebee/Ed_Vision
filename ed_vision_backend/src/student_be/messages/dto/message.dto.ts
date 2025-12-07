import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

/**
 * DTO để gửi tin nhắn
 */
export class SendMessageDto {
    @IsNotEmpty()
    @IsString()
    recipientId: string; // ID người nhận (teacher_id, student_id, parent_id)

    @IsNotEmpty()
    @IsEnum(['teacher', 'student', 'parent'])
    recipientType: 'teacher' | 'student' | 'parent';

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(['text', 'file', 'image'])
    messageType?: 'text' | 'file' | 'image';

    @IsOptional()
    @IsArray()
    attachments?: {
        fileName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
    }[];

    @IsOptional()
    conversationId?: string; // Nếu đã có conversation
}

/**
 * DTO để đánh dấu tin nhắn đã đọc
 */
export class MarkAsReadDto {
    @IsNotEmpty()
    @IsString()
    conversationId: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    messageIds?: string[]; // Nếu không có thì đánh dấu tất cả
}

/**
 * DTO để lấy tin nhắn (pagination)
 */
export class GetMessagesDto {
    @IsNotEmpty()
    @IsString()
    conversationId: string;

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;

    @IsOptional()
    before?: string; // messageId để load tin nhắn trước đó
}

/**
 * DTO để tìm kiếm tin nhắn
 */
export class SearchMessagesDto {
    @IsNotEmpty()
    @IsString()
    query: string;

    @IsOptional()
    @IsString()
    conversationId?: string; // Tìm trong conversation cụ thể

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}

/**
 * DTO để chỉnh sửa tin nhắn
 */
export class EditMessageDto {
    @IsNotEmpty()
    @IsString()
    messageId: string;

    @IsNotEmpty()
    @IsString()
    content: string;
}

/**
 * DTO để xóa tin nhắn
 */
export class DeleteMessageDto {
    @IsNotEmpty()
    @IsString()
    messageId: string;
}

/**
 * DTO để tạo/cập nhật conversation
 */
export class UpdateConversationDto {
    @IsNotEmpty()
    @IsString()
    conversationId: string;

    @IsOptional()
    isPinned?: boolean;

    @IsOptional()
    isMuted?: boolean;

    @IsOptional()
    isArchived?: boolean;
}
