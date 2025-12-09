import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

export interface CreateNotificationDto {
  title: string;
  body: string;
  type?: string;
  target: string; // 'Sinh viên' | 'Giảng viên' | 'Phụ huynh' | 'Lãnh đạo' | 'Tất cả'
  priority?: string; // 'Cao' | 'Trung bình' | 'Thấp'
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  createdBy?: number; // Account ID of admin creating the notification
}

export interface CreateDraftDto {
  title: string;
  content: string;
  type: string;
  target: string;
  priority: string;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  createdBy?: number;
}

export interface UpdateDraftDto extends Partial<CreateDraftDto> {}

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
   * Tạo thông báo cho nhiều người nhận - Sử dụng kiến trúc NotificationMaster + NotificationRecipient
   * 1 row trong NotificationMaster = 1 broadcast
   * N rows trong NotificationRecipient = N người nhận
   * 
   * LƯU Ý: Chỉ ghi vào NotificationMaster + NotificationRecipient
   * Bảng Notification cũ được giữ lại cho dữ liệu legacy, không ghi mới
   */
  async createNotification(dto: CreateNotificationDto): Promise<{
    success: boolean;
    count: number;
    masterId?: number;
  }> {
    const accountIds = await this.getAccountIdsByTarget(dto.target);

    if (accountIds.length === 0) {
      return { success: true, count: 0 };
    }

    try {
      // 1. Tạo NotificationMaster - 1 row duy nhất cho broadcast này
      const master = await this.prisma.notificationMaster.create({
        data: {
          title: dto.title,
          body: dto.body,
          type: dto.type || 'general',
          priority: dto.priority || 'Trung bình',
          target: dto.target,
          channel: 'in_app',
          attachments: dto.attachments ? JSON.parse(JSON.stringify(dto.attachments)) : undefined,
          created_by: dto.createdBy || 1, // Default to admin account 1 if not provided
        },
      });

      // 2. Tạo NotificationRecipient cho từng người nhận
      // Chỉ lưu master_id, account_id, is_read, delivered_at
      // KHÔNG lưu title, body, attachments... (đã có trong NotificationMaster)
      const now = new Date();
      await this.prisma.notificationRecipient.createMany({
        data: accountIds.map(account_id => ({
          master_id: master.id,
          account_id,
          is_read: false,
          delivered_at: now,
        })),
      });

      // KHÔNG ghi vào bảng Notification cũ nữa - tránh dư thừa dữ liệu
      // Bảng Notification chỉ giữ lại cho dữ liệu legacy đã có

      // 3. Broadcast qua WebSocket để real-time
      const payload = {
        masterId: master.id,
        title: dto.title,
        body: dto.body,
        type: dto.type || 'general',
        target: dto.target,
        attachments: dto.attachments,
        createdAt: now.toISOString(),
      };
      this.notificationGateway.broadcastNotification(payload, accountIds);

      return {
        success: true,
        count: accountIds.length,
        masterId: master.id,
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
   * Lấy thống kê thông báo - kết hợp cả 2 bảng
   */
  async getStats() {
    // Đếm từ bảng mới
    const [newTotal, newRead, newUnread] = await Promise.all([
      this.prisma.notificationRecipient.count(),
      this.prisma.notificationRecipient.count({ where: { is_read: true } }),
      this.prisma.notificationRecipient.count({ where: { is_read: false } }),
    ]);

    // Đếm từ bảng legacy
    const [legacyTotal, legacyRead, legacyUnread] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count({ where: { is_read: true } }),
      this.prisma.notification.count({ where: { is_read: false } }),
    ]);

    // Tổng hợp
    const total = newTotal + legacyTotal;
    const read = newRead + legacyRead;
    const unread = newUnread + legacyUnread;

    return {
      total,
      read,
      unread,
      readPercent: total > 0 ? Math.round((read / total) * 100) : 0,
      // Chi tiết theo nguồn (optional, để debug)
      breakdown: {
        new: { total: newTotal, read: newRead, unread: newUnread },
        legacy: { total: legacyTotal, read: legacyRead, unread: legacyUnread },
      },
    };
  }

  /**
   * Lấy thông báo của một user - sử dụng NotificationRecipient với join NotificationMaster
   * Kết hợp cả dữ liệu mới (NotificationRecipient) và legacy (Notification)
   */
  async getMyNotifications(accountId: number, options?: {
    page?: number;
    limit?: number;
    onlyUnread?: boolean;
  }) {
    const { page = 1, limit = 20, onlyUnread = false } = options || {};
    const skip = (page - 1) * limit;

    // Lấy từ bảng mới NotificationRecipient
    const newWhere = {
      account_id: accountId,
      ...(onlyUnread ? { is_read: false } : {}),
    };

    const [recipients, totalNew] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where: newWhere,
        include: {
          master: true,
        },
        orderBy: { master: { created_at: 'desc' } },
        take: limit,
        skip,
      }),
      this.prisma.notificationRecipient.count({ where: newWhere }),
    ]);

    // Lấy từ bảng legacy Notification
    const legacyWhere = {
      account_id: accountId,
      ...(onlyUnread ? { is_read: false } : {}),
    };

    const [legacyNotifications, totalLegacy] = await Promise.all([
      this.prisma.notification.findMany({
        where: legacyWhere,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notification.count({ where: legacyWhere }),
    ]);

    // Chuyển đổi recipients thành format chung
    const newNotifications = recipients.map(r => ({
      notification_id: r.id,
      account_id: r.account_id,
      title: r.master.title,
      body: r.master.body,
      type: r.master.type,
      priority: r.master.priority,
      attachments: r.master.attachments,
      is_read: r.is_read,
      created_at: r.master.created_at,
      read_at: r.read_at,
      master_id: r.master_id,
      source: 'new' as const, // Đánh dấu nguồn
    }));

    // Format legacy notifications
    const formattedLegacy = legacyNotifications.map(n => ({
      notification_id: n.notification_id,
      account_id: n.account_id,
      title: n.title,
      body: n.body,
      type: n.type,
      priority: n.priority,
      attachments: n.attachments,
      is_read: n.is_read,
      created_at: n.created_at,
      read_at: null,
      master_id: null,
      source: 'legacy' as const,
    }));

    // Gộp và sắp xếp theo thời gian
    const allNotifications = [...newNotifications, ...formattedLegacy]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return {
      notifications: allNotifications,
      total: totalNew + totalLegacy,
      page,
      limit,
    };
  }

  /**
   * Đếm số thông báo chưa đọc - sử dụng NotificationRecipient
   */
  /**
   * Đếm số thông báo chưa đọc - kết hợp cả 2 bảng
   */
  async getUnreadCount(accountId: number): Promise<number> {
    const [newCount, legacyCount] = await Promise.all([
      this.prisma.notificationRecipient.count({
        where: {
          account_id: accountId,
          is_read: false,
        },
      }),
      this.prisma.notification.count({
        where: {
          account_id: accountId,
          is_read: false,
        },
      }),
    ]);

    return newCount + legacyCount;
  }

  /**
   * Đánh dấu thông báo đã đọc
   * Xác định nguồn dựa vào source được truyền từ frontend hoặc thử cả 2 bảng
   */
  async markAsRead(notificationId: number, accountId: number, source?: 'new' | 'legacy'): Promise<boolean> {
    const now = new Date();

    if (source === 'new' || !source) {
      // Thử update trong bảng mới
      const newResult = await this.prisma.notificationRecipient.updateMany({
        where: {
          id: notificationId,
          account_id: accountId,
        },
        data: { is_read: true, read_at: now },
      });
      if (newResult.count > 0) return true;
    }

    if (source === 'legacy' || !source) {
      // Thử update trong bảng legacy
      const legacyResult = await this.prisma.notification.updateMany({
        where: {
          notification_id: notificationId,
          account_id: accountId,
        },
        data: { is_read: true },
      });
      if (legacyResult.count > 0) return true;
    }

    return false;
  }

  /**
   * Đánh dấu thông báo đã đọc bằng master_id (cho kiến trúc mới)
   */
  async markAsReadByMasterId(masterId: number, accountId: number): Promise<boolean> {
    const now = new Date();
    const result = await this.prisma.notificationRecipient.updateMany({
      where: {
        master_id: masterId,
        account_id: accountId,
      },
      data: { is_read: true, read_at: now },
    });
    return result.count > 0;
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc - cập nhật cả 2 bảng
   */
  async markAllAsRead(accountId: number): Promise<number> {
    const now = new Date();

    // Update trong bảng mới
    const newResult = await this.prisma.notificationRecipient.updateMany({
      where: {
        account_id: accountId,
        is_read: false,
      },
      data: { is_read: true, read_at: now },
    });

    // Update trong bảng legacy
    const legacyResult = await this.prisma.notification.updateMany({
      where: {
        account_id: accountId,
        is_read: false,
      },
      data: { is_read: true },
    });

    return newResult.count + legacyResult.count;
  }
  // ==================== NOTIFICATION MASTER APIs ====================

  /**
   * Lấy danh sách NotificationMaster với thống kê người nhận
   */
  async getNotificationMasters(options?: {
    page?: number;
    limit?: number;
    type?: string;
    target?: string;
  }) {
    const { page = 1, limit = 20, type, target } = options || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type && type !== 'Tất cả loại') where.type = type;
    if (target && target !== 'Tất cả đối tượng' && target !== 'Tất cả') where.target = target;

    const [masters, total] = await Promise.all([
      this.prisma.notificationMaster.findMany({
        where,
        include: {
          creator: {
            include: { profile: true },
          },
          _count: {
            select: { recipients: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notificationMaster.count({ where }),
    ]);

    // Get read counts for each master
    const mastersWithStats = await Promise.all(
      masters.map(async (master) => {
        const readCount = await this.prisma.notificationRecipient.count({
          where: { master_id: master.id, is_read: true },
        });

        return {
          id: master.id,
          title: master.title,
          body: master.body,
          type: master.type,
          priority: master.priority,
          target: master.target,
          attachments: master.attachments,
          createdAt: master.created_at,
          createdBy: master.creator?.profile?.full_name || master.creator?.email || 'Admin',
          totalRecipients: master._count.recipients,
          readCount,
          readPercent: master._count.recipients > 0 
            ? Math.round((readCount / master._count.recipients) * 100) 
            : 0,
        };
      })
    );

    return { masters: mastersWithStats, total, page, limit };
  }

  /**
   * Lấy chi tiết một NotificationMaster với danh sách người nhận
   */
  async getNotificationMasterById(id: number) {
    const master = await this.prisma.notificationMaster.findUnique({
      where: { id },
      include: {
        creator: {
          include: { profile: true },
        },
        recipients: {
          include: {
            account: {
              include: { profile: true },
            },
          },
          orderBy: { is_read: 'asc' },
        },
      },
    });

    if (!master) return null;

    return {
      id: master.id,
      title: master.title,
      body: master.body,
      type: master.type,
      priority: master.priority,
      target: master.target,
      attachments: master.attachments,
      createdAt: master.created_at,
      createdBy: master.creator?.profile?.full_name || master.creator?.email || 'Admin',
      recipients: master.recipients.map(r => ({
        id: r.id,
        accountId: r.account_id,
        name: r.account?.profile?.full_name || r.account?.email || 'Unknown',
        isRead: r.is_read,
        readAt: r.read_at,
        deliveredAt: r.delivered_at,
      })),
    };
  }

  // ==================== DRAFT APIs ====================

  /**
   * Tạo draft notification mới
   */
  async createDraft(dto: CreateDraftDto) {
    return this.prisma.notificationDraft.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        target: dto.target,
        priority: dto.priority,
        attachments: dto.attachments ? JSON.parse(JSON.stringify(dto.attachments)) : undefined,
        created_by: dto.createdBy,
      },
    });
  }

  /**
   * Lấy danh sách drafts với filters và pagination
   */
  async getDrafts(options?: {
    page?: number;
    limit?: number;
    type?: string;
    target?: string;
    priority?: string;
  }) {
    const { page = 1, limit = 20, type, target, priority } = options || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type && type !== 'Tất cả loại') where.type = type;
    if (target && target !== 'Tất cả đối tượng') where.target = target;
    if (priority && priority !== 'Tất cả mức độ') where.priority = priority;

    const [drafts, total] = await Promise.all([
      this.prisma.notificationDraft.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notificationDraft.count({ where }),
    ]);

    return { drafts, total, page, limit };
  }

  /**
   * Lấy một draft theo ID
   */
  async getDraftById(id: number) {
    return this.prisma.notificationDraft.findUnique({
      where: { draft_id: id },
    });
  }

  /**
   * Cập nhật draft
   */
  async updateDraft(id: number, dto: UpdateDraftDto) {
    return this.prisma.notificationDraft.update({
      where: { draft_id: id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.type && { type: dto.type }),
        ...(dto.target && { target: dto.target }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.attachments !== undefined && { 
          attachments: dto.attachments ? JSON.parse(JSON.stringify(dto.attachments)) : null 
        }),
      },
    });
  }

  /**
   * Xóa draft và lưu vào history
   */
  async deleteDraft(id: number) {
    const draft = await this.prisma.notificationDraft.findUnique({
      where: { draft_id: id },
    });

    if (!draft) {
      return { success: false, message: 'Draft not found' };
    }

    // Lưu vào history
    await this.prisma.notificationHistory.create({
      data: {
        action: 'deleted',
        title: draft.title,
        content: draft.content,
        type: draft.type,
        target: draft.target,
        priority: draft.priority,
        attachments: draft.attachments ?? undefined,
        total_recipients: 0,
        read_count: 0,
        created_date: draft.created_at,
      },
    });

    // Xóa draft
    await this.prisma.notificationDraft.delete({
      where: { draft_id: id },
    });

    return { success: true };
  }

  /**
   * Xóa nhiều drafts
   */
  async deleteDrafts(ids: number[]) {
    const drafts = await this.prisma.notificationDraft.findMany({
      where: { draft_id: { in: ids } },
    });

    // Lưu tất cả vào history
    await this.prisma.notificationHistory.createMany({
      data: drafts.map(draft => ({
        action: 'deleted',
        title: draft.title,
        content: draft.content,
        type: draft.type,
        target: draft.target,
        priority: draft.priority,
        attachments: draft.attachments ?? undefined,
        total_recipients: 0,
        read_count: 0,
        created_date: draft.created_at,
      })),
    });

    // Xóa drafts
    await this.prisma.notificationDraft.deleteMany({
      where: { draft_id: { in: ids } },
    });

    return { success: true, count: drafts.length };
  }

  /**
   * Gửi draft và lưu vào history
   */
  async sendDraft(id: number) {
    const draft = await this.prisma.notificationDraft.findUnique({
      where: { draft_id: id },
    });

    if (!draft) {
      return { success: false, message: 'Draft not found', count: 0 };
    }

    // Gửi notification
    const result = await this.createNotification({
      title: draft.title,
      body: draft.content,
      type: draft.type,
      target: draft.target,
      priority: draft.priority,
      attachments: draft.attachments as any,
      createdBy: draft.created_by || undefined,
    });

    // Lưu vào history với master_id để liên kết
    await this.prisma.notificationHistory.create({
      data: {
        action: 'sent',
        title: draft.title,
        content: draft.content,
        type: draft.type,
        target: draft.target,
        priority: draft.priority,
        attachments: draft.attachments ?? undefined,
        total_recipients: result.count,
        read_count: 0,
        created_date: draft.created_at,
        master_id: result.masterId,
      },
    });

    // Xóa draft sau khi gửi
    await this.prisma.notificationDraft.delete({
      where: { draft_id: id },
    });

    return { success: true, count: result.count };
  }

  /**
   * Gửi nhiều drafts
   */
  async sendDrafts(ids: number[]) {
    const results = await Promise.all(ids.map(id => this.sendDraft(id)));
    const totalSent = results.reduce((sum, r) => sum + (r.count || 0), 0);
    const successCount = results.filter(r => r.success).length;
    return { success: true, successCount, totalRecipients: totalSent };
  }

  // ==================== HISTORY APIs ====================

  /**
   * Lấy notification history với filters và pagination
   */
  async getNotificationHistory(options?: {
    page?: number;
    limit?: number;
    action?: string;
    type?: string;
    target?: string;
  }) {
    const { page = 1, limit = 20, action, type, target } = options || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (action && action !== 'Tất cả hành động') {
      where.action = action === 'Đã gửi' ? 'sent' : 'deleted';
    }
    if (type && type !== 'Tất cả loại') where.type = type;
    if (target && target !== 'Tất cả đối tượng' && target !== 'Tất cả') where.target = target;

    const [historyRaw, total] = await Promise.all([
      this.prisma.notificationHistory.findMany({
        where,
        orderBy: { action_date: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notificationHistory.count({ where }),
    ]);

    // Tính read_count real-time từ NotificationRecipient
    const history = await Promise.all(
      historyRaw.map(async (h) => {
        if (h.master_id && h.action === 'sent') {
          const realTimeReadCount = await this.prisma.notificationRecipient.count({
            where: {
              master_id: h.master_id,
              is_read: true,
            },
          });
          return { ...h, read_count: realTimeReadCount };
        }
        return h;
      })
    );

    return { history, total, page, limit };
  }

  /**
   * Cập nhật read_count trong history dựa trên NotificationRecipient
   */
  async syncHistoryReadCounts() {
    const histories = await this.prisma.notificationHistory.findMany({
      where: { action: 'sent' },
    });

    for (const history of histories) {
      let readCount = 0;

      // Prefer using master_id if available (new architecture)
      if (history.master_id) {
        readCount = await this.prisma.notificationRecipient.count({
          where: {
            master_id: history.master_id,
            is_read: true,
          },
        });
      } else {
        // Fallback to old Notification table
        readCount = await this.prisma.notification.count({
          where: {
            title: history.title,
            type: history.type,
            is_read: true,
          },
        });
      }

      await this.prisma.notificationHistory.update({
        where: { history_id: history.history_id },
        data: { read_count: readCount },
      });
    }

    return { success: true };
  }

  // ==================== CHART & STATISTICS APIs ====================

  /**
   * Lấy thống kê chi tiết với comparison
   */
  async getDetailedStats(viewMode: 'day' | 'month' | 'year' | 'all' = 'day') {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (viewMode) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        previousEndDate = startDate;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = startDate;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = startDate;
        break;
      default:
        // all: no date filter
        startDate = new Date(0);
        previousStartDate = new Date(0);
        previousEndDate = new Date(0);
    }

    // Current period stats
    const [total, read, unread] = await Promise.all([
      this.prisma.notification.count({
        where: viewMode !== 'all' ? { created_at: { gte: startDate } } : {},
      }),
      this.prisma.notification.count({
        where: {
          ...(viewMode !== 'all' ? { created_at: { gte: startDate } } : {}),
          is_read: true,
        },
      }),
      this.prisma.notification.count({
        where: {
          ...(viewMode !== 'all' ? { created_at: { gte: startDate } } : {}),
          is_read: false,
        },
      }),
    ]);

    // Previous period stats for comparison
    const [prevTotal, prevRead, prevUnread] = await Promise.all([
      this.prisma.notification.count({
        where: viewMode !== 'all' ? { 
          created_at: { gte: previousStartDate, lt: previousEndDate } 
        } : {},
      }),
      this.prisma.notification.count({
        where: {
          ...(viewMode !== 'all' ? { 
            created_at: { gte: previousStartDate, lt: previousEndDate } 
          } : {}),
          is_read: true,
        },
      }),
      this.prisma.notification.count({
        where: {
          ...(viewMode !== 'all' ? { 
            created_at: { gte: previousStartDate, lt: previousEndDate } 
          } : {}),
          is_read: false,
        },
      }),
    ]);

    return {
      total,
      read,
      unread,
      readPercent: total > 0 ? Math.round((read / total) * 100) : 0,
      unreadPercent: total > 0 ? Math.round((unread / total) * 100) : 0,
      totalDiff: total - prevTotal,
      readDiff: read - prevRead,
      unreadDiff: unread - prevUnread,
    };
  }

  /**
   * Lấy dữ liệu chart theo viewMode
   */
  async getChartData(viewMode: 'day' | 'month' | 'year' | 'all' = 'day') {
    const now = new Date();
    let labels: string[] = [];
    let sentData: number[] = [];
    let readData: number[] = [];
    let unreadData: number[] = [];

    switch (viewMode) {
      case 'day': {
        // Last 6 hours
        labels = [];
        for (let i = 5; i >= 0; i--) {
          const hour = new Date(now);
          hour.setHours(hour.getHours() - i, 0, 0, 0);
          labels.push(`${hour.getHours()}:00`);
        }

        for (let i = 5; i >= 0; i--) {
          const startHour = new Date(now);
          startHour.setHours(startHour.getHours() - i, 0, 0, 0);
          const endHour = new Date(startHour);
          endHour.setHours(endHour.getHours() + 1);

          const [sent, read, unread] = await Promise.all([
            this.prisma.notification.count({
              where: { created_at: { gte: startHour, lt: endHour } },
            }),
            this.prisma.notification.count({
              where: { created_at: { gte: startHour, lt: endHour }, is_read: true },
            }),
            this.prisma.notification.count({
              where: { created_at: { gte: startHour, lt: endHour }, is_read: false },
            }),
          ]);

          sentData.push(sent);
          readData.push(read);
          unreadData.push(unread);
        }
        break;
      }

      case 'month': {
        // Last 6 weeks
        labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6'];

        for (let i = 5; i >= 0; i--) {
          const startWeek = new Date(now);
          startWeek.setDate(startWeek.getDate() - (i * 7));
          startWeek.setHours(0, 0, 0, 0);
          const endWeek = new Date(startWeek);
          endWeek.setDate(endWeek.getDate() + 7);

          const [sent, read, unread] = await Promise.all([
            this.prisma.notification.count({
              where: { created_at: { gte: startWeek, lt: endWeek } },
            }),
            this.prisma.notification.count({
              where: { created_at: { gte: startWeek, lt: endWeek }, is_read: true },
            }),
            this.prisma.notification.count({
              where: { created_at: { gte: startWeek, lt: endWeek }, is_read: false },
            }),
          ]);

          sentData.push(sent);
          readData.push(read);
          unreadData.push(unread);
        }
        break;
      }

      case 'year': {
        // Last 6 months
        const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

        for (let i = 5; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(monthNames[month.getMonth()]);

          const startMonth = new Date(month.getFullYear(), month.getMonth(), 1);
          const endMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);

          const [sent, read, unread] = await Promise.all([
            this.prisma.notification.count({
              where: { created_at: { gte: startMonth, lt: endMonth } },
            }),
            this.prisma.notification.count({
              where: { created_at: { gte: startMonth, lt: endMonth }, is_read: true },
            }),
            this.prisma.notification.count({
              where: { created_at: { gte: startMonth, lt: endMonth }, is_read: false },
            }),
          ]);

          sentData.push(sent);
          readData.push(read);
          unreadData.push(unread);
        }
        break;
      }

      case 'all': {
        // Last 6 semesters/quarters
        labels = ['HK1/23', 'HK2/23', 'HK1/24', 'HK2/24', 'HK1/25', 'HK2/25'];

        // Simplified: just return total counts divided into 6 parts
        const total = await this.prisma.notification.count();
        const read = await this.prisma.notification.count({ where: { is_read: true } });
        const unread = await this.prisma.notification.count({ where: { is_read: false } });

        // Distribute data across labels (this is simplified, real implementation would use actual date ranges)
        const avgSent = Math.round(total / 6);
        const avgRead = Math.round(read / 6);
        const avgUnread = Math.round(unread / 6);

        sentData = Array(6).fill(avgSent);
        readData = Array(6).fill(avgRead);
        unreadData = Array(6).fill(avgUnread);
        break;
      }
    }

    return {
      labels,
      datasets: {
        sent: sentData,
        read: readData,
        unread: unreadData,
      },
    };
  }
}
