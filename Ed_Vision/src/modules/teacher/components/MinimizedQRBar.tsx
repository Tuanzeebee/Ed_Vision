import { useNavigate, useLocation } from 'react-router-dom'
import { QrCode, Clock, Users, Maximize2, X } from 'lucide-react'
import { useQRSession } from '../contexts/QRSessionContext'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
export default function MinimizedQRBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isSessionActive,
    isMinimized,
    currentSessionSlot,
    sessionDate,
    sessionDuration,
    attendanceAttempts,
    endSession,
    setMinimized
  } = useQRSession()

  const [showConfirm, setShowConfirm] = useState(false)

  if (!isSessionActive || !isMinimized || !currentSessionSlot) {
    return null
  }

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMaximize = () => {
    // Navigate to meeting detail page with correct date if not already there
    if (!location.pathname.includes('/teacher/meeting-detail')) {
      navigate('/teacher/meeting-detail', { state: { date: sessionDate } })
    }
    setMinimized(false)
  }

  const handleClose = () => {
    setShowConfirm(true)
  }

  const handleConfirmClose = async () => {
    setShowConfirm(false)
    await endSession()
  }

  return (
    <>
      {/* Minimized Bar - 25% smaller than before */}
      <div className="fixed bottom-0.5 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg px-1.5 py-px flex items-center gap-1">
          <QrCode className="w-2 h-2 flex-shrink-0"/>
          <span className="font-semibold text-[8px]">{currentSessionSlot.startTime}-{currentSessionSlot.endTime}</span>
          
          {/* Timer */}
          <div className="flex items-center gap-px bg-white/20 rounded-full px-0.5 py-px">
            <Clock className="w-1.5 h-1.5"/>
            <span className="font-mono text-[7px] font-bold">{formatTimer(sessionDuration)}</span>
          </div>
          
          {/* Verified count */}
          <div className="flex items-center gap-px bg-white/20 rounded-full px-0.5 py-px">
            <Users className="w-1.5 h-1.5"/>
            <span className="text-[7px] font-semibold">
              {attendanceAttempts.filter(a =>a.status === 'verified').length}/{currentSessionSlot.bookedSlots}
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center">
            <button
              onClick={handleMaximize}
              className="p-px hover:bg-white/20 rounded-full transition-colors"title={t('meetingDetail.qr.expand')}
            >
              <Maximize2 className="w-2 h-2"/>
            </button>
            <button
              onClick={handleClose}
              className="p-px hover:bg-white/20 rounded-full transition-colors"title={t('meetingDetail.qr.end')}
            >
              <X className="w-2 h-2"/>
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {t('meetingDetail.qr.confirmEnd')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('meetingDetail.qr.confirmMessage')}
              <br/>
              <span className="font-semibold text-blue-600">
                {t('meetingDetail.qr.currentDuration')}: {formatTimer(sessionDuration)}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                {t('meetingDetail.qr.end')}
              </button>
            </div>
          </div>
        </div>)}
    </>)
}
