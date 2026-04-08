import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import attendanceApi, { type AttendanceAttempt } from '@/services/attendanceApi'

type TimeSlot = {
  id: string
  startTime: string
  endTime: string
  duration: number
  bookedSlots: number
}

interface QRSessionContextType {
  // Session state
  activeSession: string | null
  currentSessionSlot: TimeSlot | null
  sessionDate: string | null // YYYY-MM-DD format
  isSessionActive: boolean
  currentQRData: string
  attendanceAttempts: AttendanceAttempt[]
  sessionStartTime: Date | null
  sessionDuration: number
  isMinimized: boolean
  
  // Actions
  startSession: (slot: TimeSlot, sessionId: string, date?: string) => void
  endSession: () => Promise<void>
  setMinimized: (minimized: boolean) => void
  fetchQRCode: (sessionId: string) => Promise<void>
  fetchSessionStatus: (sessionId: string) => Promise<void>
}

const QRSessionContext = createContext<QRSessionContextType | undefined>(undefined)

export function QRSessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [currentSessionSlot, setCurrentSessionSlot] = useState<TimeSlot | null>(null)
  const [sessionDate, setSessionDate] = useState<string | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [currentQRData, setCurrentQRData] = useState<string>('')
  const [attendanceAttempts, setAttendanceAttempts] = useState<AttendanceAttempt[]>([])
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionDuration, setSessionDuration] = useState<number>(0)
  const [isMinimized, setIsMinimized] = useState(false)

  const qrIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchQRCode = async (sessionId: string) => {
    if (!sessionId) return
    
    try {
      const qrResponse = await attendanceApi.getQRCode(sessionId)
      if (qrResponse.qrData) {
        setCurrentQRData(qrResponse.qrData)
      }
    } catch (error) {
      // Silent fail - QR will retry
    }
  }

  const fetchSessionStatus = async (sessionId: string) => {
    try {
      const statusResponse = await attendanceApi.getSessionStatus(sessionId)
      const attempts = statusResponse.attempts || []
      setAttendanceAttempts(attempts)
    } catch (error) {
      // Silent fail
    }
  }

  const endSession = useCallback(async () => {
    if (!activeSession) return

    // Clear all intervals
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current)
      qrIntervalRef.current = null
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }

    try {
      await attendanceApi.endSession(activeSession)
    } catch (error) {
      // Handle error silently
    }

    setIsSessionActive(false)
    setActiveSession(null)
    setCurrentQRData('')
    setCurrentSessionSlot(null)
    setSessionDate(null)
    setSessionStartTime(null)
    setSessionDuration(0)
    setIsMinimized(false)
  }, [activeSession])

  const startSession = useCallback((slot: TimeSlot, sessionId: string, date?: string) => {
    setActiveSession(sessionId)
    setCurrentSessionSlot(slot)
    setSessionDate(date || null)
    setIsSessionActive(true)
    setAttendanceAttempts([])
    setSessionStartTime(new Date())
    setSessionDuration(0)
    setIsMinimized(false)

    // Start duration timer
    durationTimerRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1)
    }, 1000)

    // Start QR refresh (7 seconds)
    qrIntervalRef.current = setInterval(async () => {
      await fetchQRCode(sessionId)
    }, 7000)

    // Start status polling (2 seconds)
    statusIntervalRef.current = setInterval(async () => {
      await fetchSessionStatus(sessionId)
    }, 2000)

    // Fetch initial QR
    fetchQRCode(sessionId)
  }, [])

  // Separate effect for auto-end logic only (when time is up)
  useEffect(() => {
    if (!isSessionActive || !currentSessionSlot || !sessionStartTime) return

    // Auto end session when time is up
    const slotDuration = currentSessionSlot.duration * 60
    const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000)
    if (elapsed >= slotDuration) {
      // Use setTimeout to avoid calling endSession directly in render cycle
      const timer = setTimeout(() => {
        endSession()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [currentSessionSlot, sessionStartTime, isSessionActive, endSession])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current)
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current)
      if (durationTimerRef.current) clearInterval(durationTimerRef.current)
    }
  }, [])

  const value: QRSessionContextType = {
    activeSession,
    currentSessionSlot,
    sessionDate,
    isSessionActive,
    currentQRData,
    attendanceAttempts,
    sessionStartTime,
    sessionDuration,
    isMinimized,
    startSession,
    endSession,
    setMinimized: setIsMinimized,
    fetchQRCode,
    fetchSessionStatus
  }

  return (
    <QRSessionContext.Provider value={value}>
      {children}
    </QRSessionContext.Provider>
  )
}

export function useQRSession() {
  const context = useContext(QRSessionContext)
  if (context === undefined) {
    throw new Error('useQRSession must be used within QRSessionProvider')
  }
  return context
}
