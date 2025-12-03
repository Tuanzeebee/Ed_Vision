import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';

interface SendNotificationDto {
  title: string;
  body: string;
  type?: string;
  target: string;
  priority?: string;
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ==================== ADMIN APIs ====================

  /**
   * Admin gửi thông báo - Lưu vào bảng Notification
   * POST /notifications/send
   */
  @Post('send')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendNotification(@Body() dto: SendNotificationDto) {
    const result = await this.notificationService.createNotification(dto);
    return {
      success: result.success,
      count: result.count,
      message: `Đã gửi thông báo đến ${result.count} người nhận`,
    };
  }

  /**
   * Admin lấy lịch sử thông báo đã gửi (grouped by title+type+created time)
   * GET /notifications/history
   */
  @Get('history')
  @UseGuards(DevAuthGuard)
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('target') target?: string,
  ) {
    return this.notificationService.getSentHistory({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      type,
      target,
    });
  }

  /**
   * Admin lấy thống kê thông báo
   * GET /notifications/stats
   */
  @Get('stats')
  @UseGuards(DevAuthGuard)
  async getStats() {
    return this.notificationService.getStats();
  }

  // ==================== USER APIs ====================

  /**
   * Lấy thông báo của user đang đăng nhập
   * GET /notifications/my
   */
  @Get('my')
  @UseGuards(DevAuthGuard)
  async getMyNotifications(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('onlyUnread') onlyUnread?: string,
  ) {
    const accountId = req.user?.account_id;
    if (!accountId) {
      return { notifications: [], total: 0, page: 1, limit: 20 };
    }

    return this.notificationService.getMyNotifications(accountId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      onlyUnread: onlyUnread === 'true',
    });
  }

  /**
   * Lấy số thông báo chưa đọc
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  @UseGuards(DevAuthGuard)
  async getUnreadCount(@Req() req: any) {
    const accountId = req.user?.account_id;
    if (!accountId) {
      return { count: 0 };
    }
    const count = await this.notificationService.getUnreadCount(accountId);
    return { count };
  }

  /**
   * Đánh dấu thông báo đã đọc
   * PUT /notifications/:id/read
   */
  @Put(':id/read')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const accountId = req.user?.account_id;
    if (!accountId) {
      return { success: false };
    }
    const success = await this.notificationService.markAsRead(id, accountId);
    return { success };
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   * PUT /notifications/read-all
   */
  @Put('read-all')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Req() req: any) {
    const accountId = req.user?.account_id;
    if (!accountId) {
      return { success: false, count: 0 };
    }
    const count = await this.notificationService.markAllAsRead(accountId);
    return { success: true, count };
  }
}
