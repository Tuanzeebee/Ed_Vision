import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSystemNotifications,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  fetchNotifications
} from '@/stores/notificationStore';
import type { SystemNotification } from '@/stores/notificationStore';
import { useTranslation } from 'react-i18next';

interface NotificationPageProps {
  userRole?: 'student' | 'teacher' | 'admin' | 'parent';
}

// Get API base URL
const API_BASE_URL = (import.meta.env && (import.meta.env.VITE_API_BASE_URL as string)) || 'http://localhost:3000';

// Helper function to get full URL for attachments
const getAttachmentUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
};

export default function NotificationPage({ userRole = 'student' }: NotificationPageProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [typeFilter, setTypeFilter] = useState('Tất cả');
  const [priorityFilter, setPriorityFilter] = useState('Tất cả');
  const [readFilter, setReadFilter] = useState('Tất cả');
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);

  // Load notifications
  const loadNotifications = () => {
    const all = getSystemNotifications();
    setNotifications(all);
  };

  useEffect(() => {
    // Fetch notifications from API first, then load from cache
    fetchNotifications().then(() => {
      loadNotifications();
    });
    
    const unsubscribe = subscribeToNotifications(loadNotifications);
    return unsubscribe;
  }, []);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchType = typeFilter === 'Tất cả' || n.type === typeFilter;
      const matchPriority = priorityFilter === 'Tất cả' || n.priority === priorityFilter;
      const matchRead = readFilter === 'Tất cả' || 
        (readFilter === 'Chưa đọc' && !n.isRead) ||
        (readFilter === 'Đã đọc' && n.isRead);
      return matchType && matchPriority && matchRead;
    });
  }, [notifications, typeFilter, priorityFilter, readFilter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: SystemNotification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Lịch Thi': return '📅';
      case 'Cập Nhật Hệ Thống': return '⚙️';
      case 'Cảnh Báo Học Tập': return '⚠️';
      case 'Sự Kiện Tổ Chức': return '🎉';
      case 'Vinh Danh Cá Nhân': return '🏆';
      case 'Thông Tin Chung': return '📢';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Cao': return 'bg-red-100 text-red-800';
      case 'Trung bình': return 'bg-yellow-100 text-yellow-800';
      case 'Thấp': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBackPath = () => {
    switch (userRole) {
      case 'admin': return '/admin/dashboard';
      case 'teacher': return '/teacher/dashboard';
      case 'parent': return '/parent/dashboard';
      default: return '/student/instructions';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(getBackPath())}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('notifications.title')}</h1>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 
                    ? t('notifications.page.unreadSubtitle', { count: unreadCount })
                    : t('notifications.page.allReadSubtitle')}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('notifications.markAllAsRead')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left: Notification List */}
          <div className="flex-1">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
              <div className="flex flex-wrap gap-3">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Tất cả">{t('notifications.filters.allTypes')}</option>
                  <option value="Lịch Thi">{t('notifications.types.examSchedule')}</option>
                  <option value="Cập Nhật Hệ Thống">{t('notifications.types.systemUpdate')}</option>
                  <option value="Cảnh Báo Học Tập">{t('notifications.types.academicWarning')}</option>
                  <option value="Sự Kiện Tổ Chức">{t('notifications.types.organizationEvent')}</option>
                  <option value="Vinh Danh Cá Nhân">{t('notifications.types.personalRecognition')}</option>
                  <option value="Thông Tin Chung">{t('notifications.types.generalInfo')}</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Tất cả">{t('notifications.filters.allPriorities')}</option>
                  <option value="Cao">{t('notifications.priorities.high')}</option>
                  <option value="Trung bình">{t('notifications.priorities.medium')}</option>
                  <option value="Thấp">{t('notifications.priorities.low')}</option>
                </select>
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Tất cả">{t('notifications.filters.allStatuses')}</option>
                  <option value="Chưa đọc">{t('notifications.filters.unread')}</option>
                  <option value="Đã đọc">{t('notifications.filters.read')}</option>
                </select>
              </div>
            </div>

            {/* Notification List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">{t('notifications.empty.noneTitle')}</p>
                  <p className="text-gray-400 text-sm mt-1">{t('notifications.empty.noneSubtitle')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-start gap-4 ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      } ${selectedNotification?.id === notification.id ? 'bg-blue-100' : ''}`}
                    >
                      {/* Unread indicator */}
                      <div className="flex-shrink-0 mt-2">
                        {!notification.isRead ? (
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full block"></span>
                        ) : (
                          <span className="w-2.5 h-2.5 bg-transparent rounded-full block"></span>
                        )}
                      </div>
                      
                      {/* Icon */}
                      <div className="flex-shrink-0 text-2xl mt-1">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-base font-medium text-gray-900 truncate ${
                            !notification.isRead ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">{notification.type}</span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-400">{notification.createdDate}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notification Detail */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border sticky top-24">
              {selectedNotification ? (
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-3xl">{getTypeIcon(selectedNotification.type)}</span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{selectedNotification.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(selectedNotification.priority)}`}>
                          {selectedNotification.priority}
                        </span>
                        <span className="text-xs text-gray-400">{selectedNotification.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedNotification.content}
                    </p>
                  </div>
                  
                  {selectedNotification.attachments && selectedNotification.attachments.length > 0 && (
                    <div className="border-t mt-4 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{t('notifications.detail.attachments')}</h4>
                      <div className="space-y-2">
                        {selectedNotification.attachments.map((file, idx) => (
                          <a
                            key={idx}
                            href={getAttachmentUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-lg">📎</span>
                            <span className="text-sm text-blue-600 hover:underline truncate">{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t mt-4 pt-4">
                    <p className="text-xs text-gray-400">
                      {t('notifications.detail.sentDate')}: {selectedNotification.createdDate}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <span className="text-5xl">👆</span>
                  <p className="text-gray-500 mt-4">{t('notifications.detail.selectPrompt')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
