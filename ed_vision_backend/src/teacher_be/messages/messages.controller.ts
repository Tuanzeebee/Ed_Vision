import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
    SendMessageDto,
    SendTemplateMessageDto,
    CreateTemplateDto,
} from './dto/message.dto';

@Controller('teacher/messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    /**
     * POST /teacher/messages/send
     * Gửi tin nhắn cho sinh viên/phụ huynh
     */
    @Post('send')
    async sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
        const instructorId = req.user?.instructorId || 1;
        return this.messagesService.sendMessage(instructorId, dto);
    }

    /**
     * POST /teacher/messages/send-template
     * Gửi tin nhắn bằng template
     */
    @Post('send-template')
    async sendTemplateMessage(
        @Req() req: any,
        @Body() dto: SendTemplateMessageDto,
    ) {
        const instructorId = req.user?.instructorId || 1;
        return this.messagesService.sendTemplateMessage(instructorId, dto);
    }

    /**
     * GET /teacher/messages/templates
     * Lấy danh sách templates
     */
    @Get('templates')
    async getTemplates() {
        return this.messagesService.getTemplates();
    }

    /**
     * POST /teacher/messages/templates
     * Tạo template mới
     */
    @Post('templates')
    async createTemplate(@Body() dto: CreateTemplateDto) {
        return this.messagesService.createTemplate(dto);
    }

    /**
     * GET /teacher/messages/history
     * Lấy lịch sử tin nhắn
     */
    @Get('history')
    async getMessageHistory(@Req() req: any) {
        const instructorId = req.user?.instructorId || 1;
        return this.messagesService.getMessageHistory(instructorId);
    }

    /**
     * GET /teacher/messages/stats
     * Lấy thống kê tin nhắn
     */
    @Get('stats')
    async getMessageStats(@Req() req: any) {
        const instructorId = req.user?.instructorId || 1;
        return this.messagesService.getMessageStats(instructorId);
    }
}
