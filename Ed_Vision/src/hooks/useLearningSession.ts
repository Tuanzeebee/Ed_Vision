import { useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface LearningSessionOptions {
  autoExtendOnLowTime?: boolean // Tự động gia hạn khi còn ít thời gian
  warningThreshold?: number // Hiển thị cảnh báo khi còn bao nhiêu phút (default: 10)
  silentExtend?: boolean // Gia hạn thầm lặng không cần hỏi user
}

/**
 * Hook đặc biệt cho các trang học bài
 * Tự động quản lý phiên đăng nhập để không làm gián đoạn quá trình học
 */
export const useLearningSession = (options: LearningSessionOptions = {}) => {
  const {
    autoExtendOnLowTime = true,
    warningThreshold = 10,
    silentExtend = false
  } = options

  const { timeRemaining, extendSession, isAuthenticated } = useAuth()

  // Tự động gia hạn khi thời gian sắp hết
  const handleAutoExtend = useCallback(() => {
    if (autoExtendOnLowTime && timeRemaining <= warningThreshold && timeRemaining > 0) {
      if (silentExtend) {
        // Gia hạn thầm lặng
        extendSession()
        console.log('🎓 Learning session: Tự động gia hạn phiên đăng nhập cho học bài')
      } else {
        // Log để SessionTimeoutWarning component biết và hiển thị popup
        console.log('🎓 Learning session: Sắp hết hạn, cần gia hạn phiên đăng nhập')
      }
    }
  }, [timeRemaining, warningThreshold, autoExtendOnLowTime, silentExtend, extendSession])

  // Monitor thời gian và tự động xử lý
  useEffect(() => {
    if (!isAuthenticated) return

    handleAutoExtend()
  }, [isAuthenticated, handleAutoExtend])

  // Cung cấp các function cho component sử dụng
  const extendLearningSession = useCallback(() => {
    extendSession()
    return true
  }, [extendSession])

  const getLearningTimeRemaining = useCallback(() => {
    return timeRemaining
  }, [timeRemaining])

  const isLearningSessionExpiring = useCallback(() => {
    return timeRemaining <= warningThreshold && timeRemaining > 0
  }, [timeRemaining, warningThreshold])

  return {
    timeRemaining,
    extendLearningSession,
    getLearningTimeRemaining,
    isLearningSessionExpiring,
    isAuthenticated
  }
}