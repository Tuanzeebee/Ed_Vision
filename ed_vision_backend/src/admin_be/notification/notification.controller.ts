import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { NotificationService } from './notification.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import type { CreateDraftDto, UpdateDraftDto } from './notification.service';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';

interface SendNotificationDto {
  title: string;
  body: string;
  type?: string;
  target: string;
  priority?: string;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
}

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly reminderScheduler: ReminderSchedulerService,
  ) {}

  // ==================== ADMIN APIs ====================

  /**
   * Upload file đính kèm cho thông báo
   * POST /notifications/upload-attachments
   */
  @Post('upload-attachments')
  @UseGuards(DevAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/notifications',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 30 * 1024 * 1024, // 30MB max
      },
    }),
  )
  async uploadAttachments(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return { success: false, attachments: [] };
    }

    const attachments = files.map(file => ({
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      url: `/uploads/notifications/${file.filename}`,
    }));

    return { success: true, attachments };
  }

  /**
   * Admin gửi thông báo - Sử dụng kiến trúc NotificationMaster + NotificationRecipient
   * POST /notifications/send
   */
  @Post('send')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendNotification(@Body() dto: SendNotificationDto, @Req() req: any) {
    const result = await this.notificationService.createNotification({
      ...dto,
      createdBy: req.user?.account_id,
    });
    return {
      success: result.success,
      count: result.count,
      masterId: result.masterId,
      message: `Đã gửi thông báo đến ${result.count} người nhận`,
    };
  }

  // ==================== NOTIFICATION MASTER APIs ====================

  /**
   * Lấy danh sách NotificationMaster với thống kê
   * GET /notifications/masters
   */
  @Get('masters')
  @UseGuards(DevAuthGuard)
  async getNotificationMasters(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('target') target?: string,
  ) {
    return this.notificationService.getNotificationMasters({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      type,
      target,
    });
  }

  /**
   * Lấy chi tiết một NotificationMaster với danh sách người nhận
   * GET /notifications/masters/:id
   */
  @Get('masters/:id')
  @UseGuards(DevAuthGuard)
  async getNotificationMasterById(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.getNotificationMasterById(id);
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
    @Query('action') action?: string,
    @Query('type') type?: string,
    @Query('target') target?: string,
  ) {
    return this.notificationService.getNotificationHistory({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      action,
      type,
      target,
    });
  }

  /**
   * Đồng bộ read_count trong history
   * POST /notifications/sync-history
   */
  @Post('sync-history')
  @UseGuards(DevAuthGuard)
  async syncHistoryReadCounts() {
    return this.notificationService.syncHistoryReadCounts();
  }

  /**
   * Admin lấy thống kê thông báo
   * GET /notifications/stats
   */
  @Get('stats')
  @UseGuards(DevAuthGuard)
  async getStats(@Query('viewMode') viewMode?: string) {
    return this.notificationService.getDetailedStats(
      (viewMode as 'day' | 'month' | 'year' | 'all') || 'day'
    );
  }

  /**
   * Admin lấy dữ liệu chart
   * GET /notifications/chart
   */
  @Get('chart')
  @UseGuards(DevAuthGuard)
  async getChartData(@Query('viewMode') viewMode?: string) {
    return this.notificationService.getChartData(
      (viewMode as 'day' | 'month' | 'year' | 'all') || 'day'
    );
  }

  // ==================== DRAFT APIs ====================

  /**
   * Lấy danh sách draft notifications
   * GET /notifications/drafts
   */
  @Get('drafts')
  @UseGuards(DevAuthGuard)
  async getDrafts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('target') target?: string,
    @Query('priority') priority?: string,
  ) {
    return this.notificationService.getDrafts({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      type,
      target,
      priority,
    });
  }

  /**
   * Lấy một draft theo ID
   * GET /notifications/drafts/:id
   */
  @Get('drafts/:id')
  @UseGuards(DevAuthGuard)
  async getDraftById(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.getDraftById(id);
  }

  /**
   * Tạo draft notification mới
   * POST /notifications/drafts
   */
  @Post('drafts')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createDraft(@Body() dto: CreateDraftDto) {
    return this.notificationService.createDraft(dto);
  }

  /**
   * Cập nhật draft
   * PUT /notifications/drafts/:id
   */
  @Put('drafts/:id')
  @UseGuards(DevAuthGuard)
  async updateDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDraftDto,
  ) {
    return this.notificationService.updateDraft(id, dto);
  }

  /**
   * Xóa draft
   * DELETE /notifications/drafts/:id
   */
  @Delete('drafts/:id')
  @UseGuards(DevAuthGuard)
  async deleteDraft(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.deleteDraft(id);
  }

  /**
   * Xóa nhiều drafts
   * POST /notifications/drafts/delete-many
   */
  @Post('drafts/delete-many')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteDrafts(@Body() body: { ids: number[] }) {
    return this.notificationService.deleteDrafts(body.ids);
  }

  /**
   * Gửi một draft
   * POST /notifications/drafts/:id/send
   */
  @Post('drafts/:id/send')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendDraft(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.sendDraft(id);
  }

  /**
   * Gửi nhiều drafts
   * POST /notifications/drafts/send-many
   */
  @Post('drafts/send-many')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendDrafts(@Body() body: { ids: number[] }) {
    return this.notificationService.sendDrafts(body.ids);
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
   * Query param: source = 'new' | 'legacy' (optional)
   */
  @Put(':id/read')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Query('source') source: 'new' | 'legacy' | undefined,
    @Req() req: any,
  ) {
    const accountId = req.user?.account_id;
    if (!accountId) {
      return { success: false };
    }
    const success = await this.notificationService.markAsRead(id, accountId, source);
    return { success };
  }

  /**
   * Đánh dấu thông báo đã đọc bằng master_id (kiến trúc mới)
   * PUT /notifications/master/:masterId/read
   */
  @Put('master/:masterId/read')
  @UseGuards(DevAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAsReadByMasterId(
    @Param('masterId', ParseIntPipe) masterId: number,
    @Req() req: any,
  ) {
    const accountId = req.user?.account_id;
    if (!accountId) {
      return { success: false };
    }
    const success = await this.notificationService.markAsReadByMasterId(masterId, accountId);
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

  // ==================== DEBUG REMINDER APIs ====================

  /**
   * Debug: Lấy danh sách pending reminders
   * GET /notifications/debug/reminders
   */
  @Get('debug/reminders')
  async getDebugReminders() {
    return this.reminderScheduler.getPendingReminders();
  }

  /**
   * Debug: Force trigger một reminder
   * POST /notifications/debug/reminders/:id/trigger
   */
  @Post('debug/reminders/:id/trigger')
  async forceTriggerReminder(@Param('id', ParseIntPipe) id: number) {
    return this.reminderScheduler.forceTriggerReminder(id);
  }

  /**
   * Debug: Xóa tất cả pending reminders
   * DELETE /notifications/debug/reminders
   */
  @Delete('debug/reminders')
  async clearPendingReminders() {
    return this.reminderScheduler.clearPendingReminders();
  }

  /**
   * Debug: Check cron job status
   * GET /notifications/debug/cron-status
   */
  @Get('debug/cron-status')
  async getCronStatus() {
    return this.reminderScheduler.getCronStatus();
  }

  /**
   * Debug: Manually trigger cron job
   * POST /notifications/debug/run-cron
   */
  @Post('debug/run-cron')
  async runCronJob() {
    await this.reminderScheduler.handleReminderJob();
    return { success: true, message: 'Cron job executed manually' };
  }

  /**
   * Debug: Create test reminder for immediate testing
   * POST /notifications/debug/create-test-reminder
   */
  @Post('debug/create-test-reminder')
  async createTestReminder(@Body() body: { accountId: number; minutesFromNow: number }) {
    return this.reminderScheduler.createTestReminder(body.accountId, body.minutesFromNow);
  }

  /**
   * Debug: Get recent notifications for an account
   * GET /notifications/debug/recent/:accountId
   */
  @Get('debug/recent/:accountId')
  async getRecentNotifications(@Param('accountId', ParseIntPipe) accountId: number) {
    return this.notificationService.getMyNotifications(accountId, { page: 1, limit: 5 });
  }
}
