import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getLatestNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  fetchNotifications
} from '@/stores/notificationStore';
import type { SystemNotification } from '@/stores/notificationStore';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';

interface NotificationDropdownProps {
  isAdminMode?: boolean;
  isTeacherMode?: boolean;
}

export default function NotificationDropdown({ isAdminMode, isTeacherMode }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // WebSocket để nhận thông báo real-time
  const { newNotification } = useNotificationSocket();

  // Load notifications
  const loadNotifications = () => {
    const latest = getLatestNotifications(5);
    setNotifications(latest);
    setUnreadCount(getUnreadCount());
  };

  useEffect(() => {
    // Fetch lần đầu từ API (cho non-admin)
    fetchNotifications().then(() => {
      loadNotifications();
    });
    
    // Subscribe to changes
    const unsubscribe = subscribeToNotifications(loadNotifications);
    
    return unsubscribe;
  }, []);
  
  // Khi nhận được notification mới từ WebSocket
  useEffect(() => {
    if (newNotification) {
      loadNotifications();
    }
  }, [newNotification]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: SystemNotification) => {
    markAsRead(notification.id);
    loadNotifications();
    setIsOpen(false);
    
    // Navigate to notification page
    if (isAdminMode) {
      navigate('/admin/my-notifications');
    } else if (isTeacherMode) {
      navigate('/teacher/notifications');
    } else {
      navigate('/student/notifications');
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (isAdminMode) {
      navigate('/admin/my-notifications');
    } else if (isTeacherMode) {
      navigate('/teacher/notifications');
    } else {
      navigate('/student/notifications');
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Cao':
        return 'bg-red-500';
      case 'Trung bình':
        return 'bg-yellow-500';
      case 'Thấp':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'Lịch Thi':
        return { bg: 'bg-blue-500', icon: 'fas fa-calendar-alt' };
      case 'Cập Nhật Hệ Thống':
        return { bg: 'bg-indigo-500', icon: 'fas fa-cog' };
      case 'Cảnh Báo Học Tập':
        return { bg: 'bg-yellow-500', icon: 'fas fa-exclamation-triangle' };
      case 'Sự Kiện Tổ Chức':
        return { bg: 'bg-green-500', icon: 'fas fa-calendar-check' };
      case 'Vinh Danh Cá Nhân':
        return { bg: 'bg-purple-500', icon: 'fas fa-trophy' };
      case 'Thông Tin Chung':
        return { bg: 'bg-blue-600', icon: 'fas fa-info-circle' };
      default:
        return { bg: 'bg-gray-500', icon: 'fas fa-bell' };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      if (dateStr.includes(',')) {
        return dateStr.split(',')[0];
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="Thông báo"
      >
        <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
          </div>

          {/* Mark all read button */}
          {unreadCount > 0 && (
            <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Đánh dấu tất cả đã đọc
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">Không có thông báo mới</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => {
                  const typeStyles = getTypeStyles(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`border-b border-gray-100 hover:bg-purple-50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {/* Icon circle */}
                          <div className={`flex-shrink-0 w-10 h-10 ${typeStyles.bg} rounded-full flex items-center justify-center`}>
                            <i className={`${typeStyles.icon} text-white text-sm`}></i>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm text-gray-900 truncate pr-2 ${
                                !notification.isRead ? 'font-semibold' : 'font-medium'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <span className={`w-2 h-2 ${getPriorityBadge(notification.priority)} rounded-full flex-shrink-0`}></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {notification.content}
                            </p>
                            <span className="text-xs text-gray-500">
                              <i className="far fa-clock mr-1"></i>
                              {formatDate(notification.createdDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <button
              onClick={handleViewAll}
              className="w-full text-center text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              Xem tất cả thông báo
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
