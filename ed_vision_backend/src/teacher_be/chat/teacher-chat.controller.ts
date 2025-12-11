import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';
import { ChatService } from '../../mongodb/chat.service';
import {
    SendMessageDto,
    CreateConversationDto,
    GetMessagesDto,
    MarkAsReadDto,
    EditMessageDto,
    DeleteMessageDto,
} from './dto/chat.dto';

@Controller('teacher/chat')
@UseGuards(DevAuthGuard)
export class TeacherChatController {
    constructor(private readonly chatService: ChatService) { }

    /**
     * Lấy danh sách cuộc hội thoại của teacher
     */
    @Get('conversations')
    async getConversations(@Request() req) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        const teacherId = instructor.instructor_id.toString();
        return this.chatService.getConversations(teacherId, 'teacher');
    }

    /**
     * Lấy danh sách students của teacher từ PostgreSQL
     */
    @Get('students')
    async getStudents(@Request() req) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        return this.chatService.getTeacherStudents(instructor.instructor_id);
    }

    /**
     * Lấy danh sách parents của teacher (parents của students)
     */
    @Get('parents')
    async getParents(@Request() req) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        return this.chatService.getTeacherParents(instructor.instructor_id);
    }

    /**
     * Lấy danh sách lớp của teacher để filter
     */
    @Get('classes')
    async getClasses(@Request() req) {
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        return this.chatService.getTeacherClasses(instructor.instructor_id);
    }

    /**
     * Gửi tin nhắn hàng loạt đến nhiều sinh viên/phụ huynh
     */
    @Post('bulk-message')
    async sendBulkMessage(@Request() req, @Body() body: {
        recipientType: 'students' | 'parents' | 'both';
        classIds?: number[];
        riskLevels?: string[];
        message: string;
        title?: string;
    }) {
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        return this.chatService.sendBulkMessage({
            instructorId: instructor.instructor_id,
            ...body,
        });
    }

    /**
     * Gửi tin nhắn nhanh với template
     */
    @Post('quick-message')
    async sendQuickMessage(@Request() req, @Body() body: {
        recipientIds: string[];
        recipientType: 'student' | 'parent';
        template: 'reminder' | 'encouragement' | 'concern' | 'custom';
        customMessage?: string;
        subject?: string;
    }) {
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        return this.chatService.sendQuickMessage({
            instructorId: instructor.instructor_id,
            ...body,
        });
    }

    /**
     * Gửi cảnh báo khẩn cấp
     */
    @Post('urgent-alert')
    async sendUrgentAlert(@Request() req, @Body() body: {
        studentIds: string[];
        alertType: 'academic' | 'attendance' | 'behavior' | 'other';
        severity: 'high' | 'medium';
        message: string;
        requireConfirmation: boolean;
        notifyParents: boolean;
    }) {
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        return this.chatService.sendUrgentAlert({
            instructorId: instructor.instructor_id,
            ...body,
        });
    }

    /**
     * Tạo hoặc tìm cuộc hội thoại với student/parent
     */
    @Post('conversations')
    async createConversation(
        @Request() req,
        @Body() dto: CreateConversationDto,
    ) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        const teacherId = instructor.instructor_id.toString();

        return this.chatService.findOrCreateConversation(
            teacherId,
            dto.studentId,
            dto.conversationType,
        );
    }

    /**
     * Lấy tin nhắn của cuộc hội thoại
     */
    @Get('conversations/:conversationId/messages')
    async getMessages(
        @Param('conversationId') conversationId: string,
        @Query() query: GetMessagesDto,
    ) {
        return this.chatService.getMessages(
            conversationId,
            query.limit || 50,
            query.skip || 0,
        );
    }

    /**
     * Gửi tin nhắn
     */
    @Post('messages')
    async sendMessage(
        @Request() req,
        @Body() dto: SendMessageDto,
    ) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        const teacherId = instructor.instructor_id.toString();

        return this.chatService.sendMessage(
            dto.conversationId,
            teacherId,
            'teacher',
            dto.content,
        );
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     */
    @Put('messages/read')
    async markAsRead(
        @Request() req,
        @Body() dto: MarkAsReadDto,
    ) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        const teacherId = instructor.instructor_id.toString();
        await this.chatService.markAsRead(dto.conversationId, teacherId);
        return { success: true };
    }

    /**
     * Chỉnh sửa tin nhắn
     */
    @Put('messages/:messageId')
    async editMessage(
        @Request() req,
        @Param('messageId') messageId: string,
        @Body() dto: { content: string },
    ) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        const teacherId = instructor.instructor_id.toString();
        return this.chatService.editMessage(messageId, teacherId, dto.content);
    }

    /**
     * Xóa tin nhắn
     */
    @Delete('messages/:messageId')
    async deleteMessage(
        @Request() req,
        @Param('messageId') messageId: string,
    ) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        const teacherId = instructor.instructor_id.toString();
        await this.chatService.deleteMessage(messageId, teacherId);
        return { success: true };
    }

    /**
     * Lấy số tin nhắn chưa đọc
     */
    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        // Get instructor from account_id
        const instructor = await this.chatService.getInstructorByAccountId(req.user.account_id);
        if (!instructor) {
            throw new Error('Instructor not found');
        }
        const teacherId = instructor.instructor_id.toString();
        const count = await this.chatService.getUnreadCount(teacherId);
        return { count };
    }

    /**
     * Lấy chi tiết conversation
     */
    @Get('conversations/:conversationId')
    async getConversation(@Param('conversationId') conversationId: string) {
        return this.chatService.findConversationById(conversationId);
    }
}
