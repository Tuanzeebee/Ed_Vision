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
} from '../../teacher_be/chat/dto/chat.dto';

@Controller('student/chat')
@UseGuards(DevAuthGuard)
export class StudentChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Lấy danh sách cuộc hội thoại của student
   */
  @Get('conversations')
  async getConversations(@Request() req) {
    // Get student from account_id
    const student = await this.chatService.getStudentByAccountId(
      req.user.account_id,
    );
    if (!student) {
      throw new Error('Student not found');
    }
    const studentId = student.student_id.toString();
    return this.chatService.getConversations(studentId, 'student');
  }

  /**
   * Lấy danh sách advisors (teachers) của student
   */
  @Get('advisors')
  async getAdvisors(@Request() req) {
    // Get student from account_id
    const student = await this.chatService.getStudentByAccountId(
      req.user.account_id,
    );
    if (!student) {
      throw new Error('Student not found');
    }
    return this.chatService.getStudentAdvisors(student.student_id);
  }

  /**
   * Tạo hoặc tìm cuộc hội thoại với teacher
   */
  @Post('conversations')
  async createConversation(@Request() req, @Body() dto: CreateConversationDto) {
    // Get student from account_id
    const student = await this.chatService.getStudentByAccountId(
      req.user.account_id,
    );
    if (!student) {
      throw new Error('Student not found');
    }
    const studentId = student.student_id.toString();

    // Student tạo conversation với teacher (đảo ngược thứ tự)
    return this.chatService.findOrCreateConversation(
      dto.studentId, // teacherId
      studentId,
      'teacher-student',
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
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    // Get student from account_id
    const student = await this.chatService.getStudentByAccountId(
      req.user.account_id,
    );
    if (!student) {
      throw new Error('Student not found');
    }
    const studentId = student.student_id.toString();

    return this.chatService.sendMessage(
      dto.conversationId,
      studentId,
      'student',
      dto.content,
    );
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  @Put('messages/read')
  async markAsRead(@Request() req, @Body() dto: MarkAsReadDto) {
    // Get student from account_id
    const student = await this.chatService.getStudentByAccountId(
      req.user.account_id,
    );
    if (!student) {
      throw new Error('Student not found');
    }
    const studentId = student.student_id.toString();
    await this.chatService.markAsRead(dto.conversationId, studentId);
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
    // Get student from account_id
    const student = await this.chatService.getStudentByAccountId(
      req.user.account_id,
    );
    if (!student) {
      throw new Error('Student not found');
    }
    const studentId = student.student_id.toString();
    return this.chatService.editMessage(messageId, studentId, dto.content);
  }

  /**
   * Xóa tin nhắn
   */
  @Delete('messages/:messageId')
  async deleteMessage(@Request() req, @Param('messageId') messageId: string) {
    // Get student from account_id
    const student = await this.chatService.getStudentByAccountId(
      req.user.account_id,
    );
    if (!student) {
      throw new Error('Student not found');
    }
    const studentId = student.student_id.toString();
    await this.chatService.deleteMessage(messageId, studentId);
    return { success: true };
  }

  /**
   * Lấy số tin nhắn chưa đọc
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    // Get student from account_id
    const student = await this.chatService.getStudentByAccountId(
      req.user.account_id,
    );
    if (!student) {
      throw new Error('Student not found');
    }
    const studentId = student.student_id.toString();
    const count = await this.chatService.getUnreadCount(studentId);
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
