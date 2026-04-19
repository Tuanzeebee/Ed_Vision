import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
  SendMessageDto,
  SendTemplateMessageDto,
  CreateTemplateDto,
} from './dto/message.dto';

type AuthRequest = {
  user?: {
    instructorId?: number | string;
  };
};

@Controller('teacher/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  private resolveInstructorId(req: AuthRequest): number {
    const raw = req.user?.instructorId;
    const parsed = typeof raw === 'string' ? Number(raw) : raw;
    return Number.isFinite(parsed) && typeof parsed === 'number' ? parsed : 1;
  }

  /**
   * POST /teacher/messages/send
   * Gửi tin nhắn cho sinh viên/phụ huynh
   */
  @Post('send')
  async sendMessage(@Req() req: AuthRequest, @Body() dto: SendMessageDto) {
    const instructorId = this.resolveInstructorId(req);
    return this.messagesService.sendMessage(instructorId, dto);
  }

  /**
   * POST /teacher/messages/send-template
   * Gửi tin nhắn bằng template
   */
  @Post('send-template')
  async sendTemplateMessage(
    @Req() req: AuthRequest,
    @Body() dto: SendTemplateMessageDto,
  ) {
    const instructorId = this.resolveInstructorId(req);
    return this.messagesService.sendTemplateMessage(instructorId, dto);
  }

  /**
   * GET /teacher/messages/templates
   * Lấy danh sách templates
   */
  @Get('templates')
  getTemplates() {
    return this.messagesService.getTemplates();
  }

  /**
   * POST /teacher/messages/templates
   * Tạo template mới
   */
  @Post('templates')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.messagesService.createTemplate(dto);
  }

  /**
   * GET /teacher/messages/history
   * Lấy lịch sử tin nhắn
   */
  @Get('history')
  getMessageHistory(@Req() req: AuthRequest) {
    const instructorId = this.resolveInstructorId(req);
    return this.messagesService.getMessageHistory(instructorId);
  }

  /**
   * GET /teacher/messages/stats
   * Lấy thống kê tin nhắn
   */
  @Get('stats')
  getMessageStats(@Req() req: AuthRequest) {
    const instructorId = this.resolveInstructorId(req);
    return this.messagesService.getMessageStats(instructorId);
  }
}
