import { useLearningSession } from '@/hooks/useLearningSession'

interface LearningSessionIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showAlways?: boolean // Hiển thị luôn hay chỉ khi sắp hết hạn
  autoExtend?: boolean // Tự động gia hạn thầm lặng
}

export const LearningSessionIndicator = ({ 
  position = 'top-right', 
  showAlways = false,
  autoExtend = false 
}: LearningSessionIndicatorProps) => {
  const { timeRemaining, extendLearningSession, isLearningSessionExpiring } = useLearningSession({
    autoExtendOnLowTime: true,
    warningThreshold: 10,
    silentExtend: autoExtend
  })

  // Chỉ hiển thị khi cần thiết
  if (!showAlways && !isLearningSessionExpiring()) {
    return null
  }

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4', 
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  const handleQuickExtend = () => {
    extendLearningSession()
  }

  const isUrgent = timeRemaining <= 5
  const bgColor = isUrgent ? 'bg-red-500' : timeRemaining <= 10 ? 'bg-amber-500' : 'bg-blue-500'

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <div className={`${bgColor} text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">
          {timeRemaining > 0 ? `${timeRemaining}p` : 'Hết hạn'}
        </span>
        {isLearningSessionExpiring() && !autoExtend && (
          <button
            onClick={handleQuickExtend}
            className="ml-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded text-xs transition-colors"
            title="Gia hạn 30 phút"
          >
            +30p
          </button>
        )}
      </div>
      
      {isLearningSessionExpiring() && (
        <div className="mt-1 text-xs text-gray-600 bg-white bg-opacity-90 px-2 py-1 rounded text-center">
           Phiên học sắp hết hạn
        </div>
      )}
    </div>
  )
}