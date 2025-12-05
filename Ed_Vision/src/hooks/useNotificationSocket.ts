import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TokenManager } from '@/lib/tokenManager';
import { fetchNotifications } from '@/stores/notificationStore';

interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  target: string;
  createdAt: string;
}

/**
 * Hook để kết nối WebSocket nhận thông báo real-time
 */
export function useNotificationSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<NotificationPayload | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userStr = localStorage.getItem('user');
    const token = TokenManager.getToken();
    
    if (!userStr || !token) {
      return;
    }

    const user = JSON.parse(userStr);
    const accountId = user?.account_id || user?.id;
    const role = user?.roleRel?.code || user?.role || 'student';

    if (!accountId) {
      return;
    }

    // Kết nối WebSocket
    const socket = io('http://localhost:3000/notifications', {
      transports: ['websocket', 'polling'],
      query: {
        accountId: accountId.toString(),
        role: role,
      },
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('newNotification', (notification: NotificationPayload) => {
      setNewNotification(notification);
      
      // Fetch lại notifications từ API để cập nhật cache
      fetchNotifications().then(() => {
        // Dispatch event để các component khác cập nhật UI
        window.dispatchEvent(new CustomEvent('notificationChange'));
      });
    });

    socket.on('connect_error', () => {
      // Silent error
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  return {
    isConnected,
    newNotification,
    clearNewNotification,
  };
}

export default useNotificationSocket;
