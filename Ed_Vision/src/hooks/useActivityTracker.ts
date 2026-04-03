import { useEffect, useCallback } from 'react'
import { TokenManager } from '@/lib/tokenManager'/**
 * Hook để đảm bảo sessionStorage được đánh dấu khi tab đang mở
 * Không cần track activity thường xuyên vì logic mới dựa trên tab open/close
 */
export const useActivityTracker = (isAuthenticated: boolean, _timeRemaining?: number) => {
  const updateActivity = useCallback(() => {
    if (isAuthenticated) {
      TokenManager.updateActivity()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    // Đảm bảo sessionStorage được set khi component mount
    // Điều này xảy ra khi user mở tab mới hoặc refresh
    updateActivity()

    // Setup tab close listener để track khi user đóng tab
    TokenManager.updateActivity() // This calls setupTabCloseListener internally
    
    // Không cần track user activity events nữa
    // Chỉ cần đảm bảo sessionStorage tồn tại khi tab đang mở
  }, [isAuthenticated, updateActivity])

  // Track navigation changes để đảm bảo session vẫn active
  useEffect(() => {
    if (isAuthenticated) {
      updateActivity()
    }
  }, [isAuthenticated, updateActivity, window.location.pathname])
}