import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLocation } from 'react-router-dom'

export const SessionTimeoutWarning = () => {
  const { timeRemaining, extendSession, isAuthenticated, logout } = useAuth()
  const [showWarning, setShowWarning] = useState(false)
  const location = useLocation()
  
  // Check if user is on a learning/study page
  const isOnLearningPage = location.pathname.includes('/learning') || 
                          location.pathname.includes('/study') || 
                          location.pathname.includes('/course') ||
                          location.pathname.includes('/live-learning') ||
                          location.pathname.includes('/video-room')

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false)
      return
    }

    // Show warning when less than 5 minutes remaining OR when expired
    if (timeRemaining <= 5) {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }, [timeRemaining, isAuthenticated])

  const handleExtendSession = () => {
    extendSession()
    setShowWarning(false)
  }

  const handleLogout = () => {
    setShowWarning(false)
    logout()
  }

  if (!showWarning) return null

  const isExpired = timeRemaining <= 0
  const bgColor = isExpired ? 'bg-red-100' : 'bg-amber-100'
  const textColor = isExpired ? 'text-red-600' : 'text-amber-600'
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center mr-3`}>
            <svg className={`w-5 h-5 ${textColor}`} fill="currentColor" viewBox="0 0 20 20">
              {isExpired ? (
                // X icon for expired
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              ) : (
                // Warning icon
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              )}
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isExpired ? 'Phiên đăng nhập đã hết hạn' : 'Phiên đăng nhập sắp hết hạn'}
          </h3>
        </div>
        
        <div className="mb-6">
          {isExpired ? (
            <div>
              <p className="text-gray-600 mb-3">
                Phiên đăng nhập của bạn đã hết hạn do không có hoạt động trong 30 phút. 
                {isOnLearningPage && (
                  <span className="block mt-2 text-sm text-blue-600 font-medium">
                    🎓 Bạn đang trong quá trình học bài - đừng lo lắng, tiến trình học tập của bạn đã được lưu!
                  </span>
                )}
              </p>
              <p className="text-gray-600">
                Bạn có muốn tiếp tục sử dụng không?
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-3">
                Phiên đăng nhập của bạn sẽ hết hạn trong <span className="font-semibold text-red-600">{timeRemaining} phút</span> do không có hoạt động.
                {isOnLearningPage && (
                  <span className="block mt-2 text-sm text-blue-600 font-medium">
                    🎓 Chúng tôi nhận thấy bạn đang học bài - bạn có muốn gia hạn để tiếp tục không?
                  </span>
                )}
              </p>
              <p className="text-gray-600">
                Bạn có muốn tiếp tục sử dụng không?
              </p>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleExtendSession}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {isExpired ? 'Đăng nhập lại' : 'Tiếp tục'} (Gia hạn 30 phút)
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          {isOnLearningPage ? (
            'Trong tương lai, bạn có thể di chuyển chuột hoặc cuộn trang để tự động gia hạn phiên đăng nhập'
          ) : (
            'Phiên đăng nhập sẽ tự động gia hạn khi bạn thực hiện bất kỳ hoạt động nào trên trang web'
          )}
        </div>
      </div>
    </div>
  )
}