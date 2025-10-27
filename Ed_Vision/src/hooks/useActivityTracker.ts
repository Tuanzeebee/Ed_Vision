import { useEffect, useCallback } from 'react'
import { TokenManager } from '@/lib/tokenManager'

/**
 * Hook để theo dõi hoạt động của người dùng và cập nhật token expiry
 * Sẽ track các events: mouse movement, clicks, keyboard, scroll, etc.
 */
export const useActivityTracker = (isAuthenticated: boolean) => {
  const updateActivity = useCallback(() => {
    if (isAuthenticated) {
      TokenManager.updateActivity()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    // Các events để track hoạt động người dùng
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Throttle để không gọi quá nhiều lần
    let throttleTimer: NodeJS.Timeout | null = null
    const throttledUpdateActivity = () => {
      if (throttleTimer) return
      
      throttleTimer = setTimeout(() => {
        updateActivity()
        throttleTimer = null
      }, 10000) // Cập nhật tối đa 1 lần mỗi 10 giây
    }

    // Thêm event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, true)
    })

    // Cleanup
    return () => {
      if (throttleTimer) {
        clearTimeout(throttleTimer)
      }
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity, true)
      })
    }
  }, [isAuthenticated, updateActivity])

  // Cũng track navigation changes
  useEffect(() => {
    if (isAuthenticated) {
      updateActivity()
    }
  }, [isAuthenticated, updateActivity, window.location.pathname])
}