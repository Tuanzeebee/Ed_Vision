import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TokenManager } from '@/lib/tokenManager';
import { fetchNotifications } from '@/stores/notificationStore';
import { buildSocketUrl } from '@/services/api/config';

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
    const wsFlag = import.meta.env.VITE_ENABLE_WEBSOCKET;
    const shouldConnect = wsFlag === 'true' || (wsFlag == null && !import.meta.env.DEV);
    if (!shouldConnect) return;
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
    const socket = io(buildSocketUrl('/notifications'), {
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
      
      // Phát âm thanh thông báo - với fallback
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5; // 50% volume
        
        audio.play()
          .catch(err => {
            // Fallback: Tạo beep sound bằng Web Audio API nếu file không tồn tại
            try {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              const audioContext = new AudioContext();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.value = 800;
              oscillator.type = 'sine';
              
              gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.3);
            } catch (beepError) {
              // ignore audio fallback errors
            }
          });
      } catch (error) {
        // ignore audio init errors
      }
      
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
