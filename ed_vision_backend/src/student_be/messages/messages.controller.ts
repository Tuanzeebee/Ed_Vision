import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Patch,
    Body,
    Param,
    Query,
    Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
    SendMessageDto,
    MarkAsReadDto,
    GetMessagesDto,
    SearchMessagesDto,
    EditMessageDto,
    DeleteMessageDto,
    UpdateConversationDto,
} from './dto/message.dto';

@Controller('student/messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    /**
     * POST /student/messages/send
     * Gửi tin nhắn mới
     */
    @Post('send')
    async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
        const studentId = req.user.student_id || req.user.sub;
        return this.messagesService.sendMessage(studentId, dto);
    }

    /**
     * GET /student/messages/conversations
     * Lấy danh sách hội thoại
     */
    @Get('conversations')
    async getConversations(@Req() req: any) {
        const studentId = req.user.student_id || req.user.sub;
        return this.messagesService.getConversations(studentId);
    }

    /**
     * GET /student/messages/conversations/:id
     * Lấy tin nhắn trong hội thoại
     */
    @Get('conversations/:id')
    async getMessages(
        @Req() req: any,
        @Param('id') conversationId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('before') before?: string,
    ) {
        const studentId = req.user.student_id || req.user.sub;
        const dto: GetMessagesDto = {
            conversationId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            before,
        };
        return this.messagesService.getMessages(studentId, dto);
    }

    /**
     * POST /student/messages/mark-read
     * Đánh dấu tin nhắn đã đọc
     */
    @Post('mark-read')
    async markAsRead(@Req() req: any, @Body() dto: MarkAsReadDto) {
        const studentId = req.user.student_id || req.user.sub;
        return this.messagesService.markAsRead(studentId, dto);
    }

    /**
     * GET /student/messages/search
     * Tìm kiếm tin nhắn
     */
    @Get('search')
    async searchMessages(
        @Req() req: any,
        @Query('query') query: string,
        @Query('conversationId') conversationId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const studentId = req.user.student_id || req.user.sub;
        const dto: SearchMessagesDto = {
            query,
            conversationId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        };
        return this.messagesService.searchMessages(studentId, dto);
    }

    /**
     * PUT /student/messages/:id
     * Chỉnh sửa tin nhắn
     */
    @Put(':id')
    async editMessage(
        @Req() req: any,
        @Param('id') messageId: string,
        @Body() body: { content: string },
    ) {
        const studentId = req.user.student_id || req.user.sub;
        const dto: EditMessageDto = { messageId, content: body.content };
        return this.messagesService.editMessage(studentId, dto);
    }

    /**
     * DELETE /student/messages/:id
     * Xóa tin nhắn
     */
    @Delete(':id')
    async deleteMessage(@Req() req: any, @Param('id') messageId: string) {
        const studentId = req.user.student_id || req.user.sub;
        const dto: DeleteMessageDto = { messageId };
        return this.messagesService.deleteMessage(studentId, dto);
    }

    /**
     * PATCH /student/messages/conversations/:id
     * Cập nhật cài đặt hội thoại
     */
    @Patch('conversations/:id')
    async updateConversation(
        @Req() req: any,
        @Param('id') conversationId: string,
        @Body() body: { isPinned?: boolean; isMuted?: boolean; isArchived?: boolean },
    ) {
        const studentId = req.user.student_id || req.user.sub;
        const dto: UpdateConversationDto = {
            conversationId,
            ...body,
        };
        return this.messagesService.updateConversation(studentId, dto);
    }

    /**
     * GET /student/messages/unread-count
     * Lấy số tin nhắn chưa đọc
     */
    @Get('unread-count')
    async getUnreadCount(@Req() req: any) {
        const studentId = req.user.student_id || req.user.sub;
        return this.messagesService.getUnreadCount(studentId);
    }
}
