import {
  Controller,
  Get,
  Post,
  Put,
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
  GetMessagesDto,
  MarkAsReadDto,
} from '../../teacher_be/chat/dto/chat.dto';

@Controller('parent/chat')
@UseGuards(DevAuthGuard)
export class ParentChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Lấy danh sách cuộc hội thoại của parent
   */
  @Get('conversations')
  async getConversations(@Request() req) {
    // Get parent from account_id
    const parent = await this.chatService.getParentByAccountId(
      req.user.account_id,
    );
    if (!parent) {
      throw new Error('Parent not found');
    }
    const parentId = parent.parent_id.toString();
    return this.chatService.getConversations(parentId, 'parent');
  }

  /**
   * Lấy danh sách teachers của parent (teachers của students con)
   */
  @Get('teachers')
  async getTeachers(@Request() req) {
    // Get parent from account_id
    const parent = await this.chatService.getParentByAccountId(
      req.user.account_id,
    );
    if (!parent) {
      throw new Error('Parent not found');
    }
    return this.chatService.getParentTeachers(parent.parent_id);
  }

  /**
   * Lấy tin nhắn của một cuộc hội thoại
   */
  @Get('messages/:conversationId')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.chatService.getMessages(
      conversationId,
      query.limit,
      query.skip,
    );
  }

  /**
   * Gửi tin nhắn mới
   */
  @Post('send')
  async sendMessage(@Body() dto: SendMessageDto, @Request() req) {
    // Get parent from account_id
    const parent = await this.chatService.getParentByAccountId(
      req.user.account_id,
    );
    if (!parent) {
      throw new Error('Parent not found');
    }
    const senderId = parent.parent_id.toString();
    return this.chatService.sendMessage(
      dto.conversationId,
      senderId,
      'parent',
      dto.content,
    );
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  @Put('mark-read')
  async markAsRead(@Body() dto: MarkAsReadDto, @Request() req) {
    // Get parent from account_id
    const parent = await this.chatService.getParentByAccountId(
      req.user.account_id,
    );
    if (!parent) {
      throw new Error('Parent not found');
    }
    const userId = parent.parent_id.toString();
    return this.chatService.markAsRead(dto.conversationId, userId);
  }

  /**
   * Lấy số lượng tin nhắn chưa đọc
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    // Get parent from account_id
    const parent = await this.chatService.getParentByAccountId(
      req.user.account_id,
    );
    if (!parent) {
      throw new Error('Parent not found');
    }
    const parentId = parent.parent_id.toString();
    return this.chatService.getUnreadCount(parentId);
  }

  /**
   * Tạo cuộc hội thoại mới với teacher
   */
  @Post('conversation')
  async createConversation(@Body() dto: { teacherId: string }, @Request() req) {
    // Get parent from account_id
    const parent = await this.chatService.getParentByAccountId(
      req.user.account_id,
    );
    if (!parent) {
      throw new Error('Parent not found');
    }
    const parentId = parent.parent_id.toString();
    return this.chatService.findOrCreateConversation(
      dto.teacherId,
      parentId,
      'teacher-parent',
    );
  }
}
