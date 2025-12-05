import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

export interface CreateNotificationDto {
  title: string;
  body: string;
  type?: string;
  target: string; // 'Sinh viên' | 'Giảng viên' | 'Phụ huynh' | 'Lãnh đạo' | 'Tất cả'
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  /**
   * Lấy danh sách account_id theo target
   */
  private async getAccountIdsByTarget(target: string): Promise<number[]> {
    let accountIds: number[] = [];

    switch (target) {
      case 'Sinh viên':
        const students = await this.prisma.student.findMany({
          select: { account_id: true },
        });
        accountIds = students.map(s => s.account_id);
        break;

      case 'Giảng viên':
        const instructors = await this.prisma.instructor.findMany({
          select: { account_id: true },
        });
        accountIds = instructors.map(i => i.account_id);
        break;

      case 'Phụ huynh':
        const parents = await this.prisma.parent.findMany({
          select: { account_id: true },
        });
        accountIds = parents.map(p => p.account_id);
        break;

      case 'Lãnh đạo':
        const leaders = await this.prisma.account.findMany({
          where: {
            roleRel: {
              code: { in: ['leadership', 'leader', 'admin'] },
            },
          },
          select: { account_id: true },
        });
        accountIds = leaders.map(l => l.account_id);
        break;

      case 'Tất cả':
      default:
        const allAccounts = await this.prisma.account.findMany({
          where: { status: 'active' },
          select: { account_id: true },
        });
        accountIds = allAccounts.map(a => a.account_id);
        break;
    }

    return accountIds;
  }

  /**
   * Tạo thông báo cho nhiều người nhận - Lưu vào bảng Notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<{
    success: boolean;
    count: number;
  }> {
    const accountIds = await this.getAccountIdsByTarget(dto.target);

    if (accountIds.length === 0) {
      return { success: true, count: 0 };
    }

    try {
      // Tạo notification cho từng account trong bảng Notification
      const result = await this.prisma.notification.createMany({
        data: accountIds.map(account_id => ({
          account_id,
          title: dto.title,
          body: dto.body,
          type: dto.type || 'general',
          is_read: false,
        })),
      });

      // Broadcast qua WebSocket để real-time
      const payload = {
        title: dto.title,
        body: dto.body,
        type: dto.type || 'general',
        target: dto.target,
        createdAt: new Date().toISOString(),
      };
      this.notificationGateway.broadcastNotification(payload, accountIds);

      return {
        success: true,
        count: result.count,
      };
    } catch (error) {
      console.error('[NotificationService] Error creating notifications:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử thông báo đã gửi (grouped)
   */
  async getSentHistory(options: {
    page?: number;
    limit?: number;
    type?: string;
    target?: string;
  }) {
    const { page = 1, limit = 50, type, target } = options;

    // Group notifications by title, type, and created_at (rounded to minute)
    // We'll get distinct notifications based on title and type
    const notifications = await this.prisma.notification.findMany({
      where: {
        ...(type && type !== 'Tất cả loại' ? { type } : {}),
      },
      orderBy: { created_at: 'desc' },
      distinct: ['title', 'type'],
      take: limit,
      skip: (page - 1) * limit,
    });

    // For each distinct notification, get counts
    const historyWithStats = await Promise.all(
      notifications.map(async (n) => {
        const [total, readCount] = await Promise.all([
          this.prisma.notification.count({
            where: { title: n.title, type: n.type },
          }),
          this.prisma.notification.count({
            where: { title: n.title, type: n.type, is_read: true },
          }),
        ]);

        return {
          id: n.notification_id,
          title: n.title,
          content: n.body,
          type: n.type || 'general',
          createdAt: n.created_at,
          totalRecipients: total,
          readCount,
        };
      })
    );

    return {
      history: historyWithStats,
      page,
      limit,
    };
  }

  /**
   * Lấy thống kê thông báo
   */
  async getStats() {
    const [total, readCount, unreadCount] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { is_read: true } }),
      this.prisma.notification.count({ where: { is_read: false } }),
    ]);

    return {
      total,
      read: readCount,
      unread: unreadCount,
      readPercent: total > 0 ? Math.round((readCount / total) * 100) : 0,
    };
  }

  /**
   * Lấy thông báo của một user từ bảng Notification
   */
  async getMyNotifications(accountId: number, options?: {
    page?: number;
    limit?: number;
    onlyUnread?: boolean;
  }) {
    const { page = 1, limit = 20, onlyUnread = false } = options || {};
    const skip = (page - 1) * limit;

    const where = {
      account_id: accountId,
      ...(onlyUnread ? { is_read: false } : {}),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
    };
  }

  /**
   * Đếm số thông báo chưa đọc
   */
  async getUnreadCount(accountId: number): Promise<number> {
    return this.prisma.notification.count({
      where: {
        account_id: accountId,
        is_read: false,
      },
    });
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  async markAsRead(notificationId: number, accountId: number): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: {
        notification_id: notificationId,
        account_id: accountId,
      },
      data: { is_read: true },
    });
    return result.count > 0;
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  async markAllAsRead(accountId: number): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        account_id: accountId,
        is_read: false,
      },
      data: { is_read: true },
    });
    return result.count;
  }
}
