/**
 * Notification Store - Quản lý thông báo toàn cục
 * Kết hợp localStorage (cho admin) và API (cho các user khác)
 */

import apiClient from '@/services/api/apiClient';
import { TokenManager } from '@/lib/tokenManager';

export interface SystemNotification {
  id: number;
  title: string;
  content: string;
  type: string;
  target: string;
  priority: string;
  createdDate: string;
  isRead: boolean;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
}

const READ_STATUS_KEY = 'notificationReadStatus';

// Cache cho thông báo từ API
let apiNotificationsCache: SystemNotification[] = [];

// Helper function để dispatch event
function dispatchNotificationChange() {
  window.dispatchEvent(new CustomEvent('notificationChange'));
}

/**
 * Kiểm tra xem user có phải admin không
 */
function isAdmin(): boolean {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    const role = user?.roleRel?.code || user?.role || '';
    return role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Lấy tất cả thông báo đã gửi từ localStorage (cho admin)
 */
function getLocalStorageNotifications(): SystemNotification[] {
  try {
    const historyStr = localStorage.getItem('notificationHistory');
    const readStatusStr = localStorage.getItem(READ_STATUS_KEY);
    
    const readStatus: Record<number, boolean> = readStatusStr ? JSON.parse(readStatusStr) : {};
    
    if (historyStr) {
      const history = JSON.parse(historyStr);
      const sentNotifications = history
        .filter((h: any) => h.action === 'sent')
        .map((h: any) => ({
          id: h.id,
          title: h.title,
          content: h.content,
          type: h.type,
          target: h.target,
          priority: h.priority,
          createdDate: h.actionDate || h.createdDate,
          isRead: readStatus[h.id] || false,
          attachments: h.attachments
        }));
      return sentNotifications;
    }
    return [];
  } catch (e) {
    console.error('Error loading system notifications:', e);
    return [];
  }
}

/**
 * Lấy tất cả thông báo - admin dùng localStorage, user khác dùng API cache
 */
export function getSystemNotifications(): SystemNotification[] {
  if (isAdmin()) {
    return getLocalStorageNotifications();
  }
  // Non-admin: trả về cache hiện tại (không gọi API ở đây để tránh loop)
  return apiNotificationsCache;
}

/**
 * Fetch thông báo từ API (gọi một lần khi component mount)
 */
export async function fetchNotifications(): Promise<void> {
  if (isAdmin()) return;
  
  try {
    const token = TokenManager.getToken();
    if (!token) return;
    
    const response = await apiClient.get('/notifications/my', {
      params: { limit: 50 }
    });
    
    const data = response.data;
    apiNotificationsCache = (data.notifications || []).map((n: any) => ({
      id: n.notification_id,
      title: n.title,
      content: n.body,
      type: n.type || 'Thông Tin Chung',
      target: '',
      priority: 'Trung bình',
      createdDate: new Date(n.created_at).toLocaleString('vi-VN'),
      isRead: n.is_read,
    }));
  } catch (e) {
    console.error('Error fetching notifications from API:', e);
  }
}

/**
 * Lấy 5 thông báo mới nhất
 */
export function getLatestNotifications(count: number = 5): SystemNotification[] {
  const notifications = getSystemNotifications();
  return notifications.slice(0, count);
}

/**
 * Đếm số thông báo chưa đọc
 */
export function getUnreadCount(): number {
  const notifications = getSystemNotifications();
  return notifications.filter(n => !n.isRead).length;
}

/**
 * Đánh dấu thông báo đã đọc
 */
export function markAsRead(notificationId: number): void {
  try {
    if (isAdmin()) {
      // Admin: lưu localStorage
      const readStatusStr = localStorage.getItem(READ_STATUS_KEY);
      const readStatus: Record<number, boolean> = readStatusStr ? JSON.parse(readStatusStr) : {};
      readStatus[notificationId] = true;
      localStorage.setItem(READ_STATUS_KEY, JSON.stringify(readStatus));
    } else {
      // Non-admin: gọi API
      apiClient.put(`/notifications/${notificationId}/read`).catch(console.error);
      // Update cache
      const notification = apiNotificationsCache.find(n => n.id === notificationId);
      if (notification) notification.isRead = true;
    }
    
    dispatchNotificationChange();
  } catch (e) {
    console.error('Error marking notification as read:', e);
  }
}

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export function markAllAsRead(): void {
  try {
    if (isAdmin()) {
      // Admin: lưu localStorage
      const notifications = getLocalStorageNotifications();
      const readStatusStr = localStorage.getItem(READ_STATUS_KEY);
      const readStatus: Record<number, boolean> = readStatusStr ? JSON.parse(readStatusStr) : {};
      
      notifications.forEach(n => {
        readStatus[n.id] = true;
      });
      
      localStorage.setItem(READ_STATUS_KEY, JSON.stringify(readStatus));
    } else {
      // Non-admin: gọi API
      apiClient.put('/notifications/read-all').catch(console.error);
      // Update cache
      apiNotificationsCache.forEach(n => n.isRead = true);
    }
    
    dispatchNotificationChange();
  } catch (e) {
    console.error('Error marking all notifications as read:', e);
  }
}

/**
 * Thêm thông báo mới (được gọi khi admin gửi thông báo)
 */
export function addNotification(_notification: Omit<SystemNotification, 'isRead'>): void {
  window.dispatchEvent(new CustomEvent('notificationChange'));
}

/**
 * Force refresh cache từ API
 */
export function invalidateCache(): void {
  apiNotificationsCache = [];
  dispatchNotificationChange();
}

/**
 * Hook để subscribe vào thay đổi thông báo
 */
export function subscribeToNotifications(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener('notificationChange', handler);
  window.addEventListener('storage', handler);
  
  return () => {
    window.removeEventListener('notificationChange', handler);
    window.removeEventListener('storage', handler);
  };
}
