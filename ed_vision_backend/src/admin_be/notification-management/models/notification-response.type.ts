export interface NotificationResponse {
  notificationId: number;
  title: string;
  message: string;
  type: string;
  target: string;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  isActive: boolean;
  link?: string;
  totalRecipients?: number;
  readCount?: number;
}

export interface NotificationListResponse {
  data: NotificationResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  readRate: number;
}

export interface UserNotification {
  notificationId: number;
  userId: number;
  isRead: boolean;
  readAt?: string;
  receivedAt: string;
}
