import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Clock, 
  Monitor, 
  MapPin, 
  Globe, 
  Users, 
  X, 
  FileText, 
  Plus,
  ArrowLeft,
  ChevronRight,
  Info,
  CheckCircle,
  Link as LinkIcon,
  MapPinned,
  Loader2,
  Play,
  Square,
  QrCode,
  Minimize2,
  Maximize2
} from "lucide-react"
import { QRCodeSVG } from 'qrcode.react'
import StudentSelectionModal, { type Student } from "./StudentSelectionModal"
import WordEditorModal from "./WordEditorModal"
import TeacherLayout from "./components/TeacherLayout"
import { useInstructorProfile } from "./hooks/useInstructorProfile"
import { instructorAvailabilityApi } from "@/services/teacher/api"
import attendanceApi, { type AttendanceAttempt, type SessionStatusResponse } from "@/services/attendanceApi"
import { useTranslation } from 'react-i18next'
import { useQRSession } from './contexts/QRSessionContext'

type MeetingType = "online" | "offline" | "both"

type TimeSlot = {
  id: string // slotId from database
  startTime: string
  endTime: string
  duration: number
  meetingType: MeetingType
  totalSlots: number
  bookedSlots: number
  colorScheme: "blue" | "orange" | "teal" | "purple"
  meetingLink?: string
  meetingLocation?: string
  isOpen?: boolean
  autoAccept?: boolean
  note?: string
}

type Props = {
  date?: string
  weekday?: string
  timeSlots?: TimeSlot[]
  onBack?: () => void
}

const meetingTypeConfig = {
  online: {
    icon: Monitor,
    label: "Online",
    bgColor: "bg-green-100",
    textColor: "text-green-800"
  },
  offline: {
    icon: MapPin,
    label: "Offline",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800"
  },
  both: {
    icon: Globe,
    label: "Both",
    bgColor: "bg-teal-100",
    textColor: "text-teal-800"
  }
}

const colorSchemeConfig = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" }
}

// Main exported component - wraps content with TeacherLayout
export default function MeetingDetailView({ 
  date: propDate,
  weekday: propWeekday,
  onBack
}: Props) {
  return (
    <TeacherLayout currentPage="appointment">
      <MeetingDetailViewContent
        date={propDate}
        weekday={propWeekday}
        onBack={onBack}
      />
    </TeacherLayout>
  )
}

// Content component - can use QRSession context here
function MeetingDetailViewContent({
  date: propDate,
  weekday: propWeekday,
  onBack
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('teacher')
  
  // Get instructor profile
  const { instructorId, loading: profileLoading } = useInstructorProfile()
  
  // Get data from navigation state or use props/defaults
  const navigationState = location.state as { date?: string; timeSlots?: any[] } | null
  
  // Convert backend time slots to frontend format
  const convertToFrontendTimeSlots = (backendSlots: any[]): TimeSlot[] => {
    return backendSlots.map((slot, index) => ({
      id: slot.slotId?.toString() || slot.id?.toString() || index.toString(),
      startTime: slot.start || slot.startTime,
      endTime: slot.end || slot.endTime,
      duration: 60, // Default duration
      meetingType: slot.meetingType || 'both',
      totalSlots: slot.capacity || 10,
      bookedSlots: slot.bookedCount || 0,
      colorScheme: (['blue', 'orange', 'teal', 'purple'][index % 4]) as any,
      meetingLink: slot.meetingLink,
      meetingLocation: slot.meetingLocation,
      isOpen: slot.isOpen,
      autoAccept: slot.autoAccept,
      note: slot.note
    }))
  }
  
  // Format date string from YYYY-MM-DD to DD/MM/YYYY
  const formatDisplayDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
  }
  
  // Get weekday name from date string (YYYY-MM-DD)
  const getWeekdayName = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return t(`scheduleManagement.detail.${dayKeys[date.getDay()]}`)
  }
  
  // Use navigation state if available, otherwise use props
  const currentDate = navigationState?.date 
    ? formatDisplayDate(navigationState.date) 
    : (propDate || "17/01/2024")
  
  const currentWeekday = navigationState?.date 
    ? getWeekdayName(navigationState.date) 
    : (propWeekday || "Thứ 4")
  
  // Get the YYYY-MM-DD format date for API calls
  const apiDate = navigationState?.date || (propDate ? convertToApiDate(propDate) : null)
  
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [currentEditingSlot, setCurrentEditingSlot] = useState<TimeSlot | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Use QR Session Context instead of local state
  const {
    activeSession,
    currentQRData,
    attendanceAttempts,
    isSessionActive,
    currentSessionSlot,
    sessionDuration,
    isMinimized,
    startSession: startQRSession,
    endSession: endQRSession,
    setMinimized,
    fetchQRCode
  } = useQRSession()
  
  // Local UI states only
  const [showQRModal, setShowQRModal] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [qrRefreshInterval] = useState<number>(7000)
  
  // Helper function to convert DD/MM/YYYY back to YYYY-MM-DD
  function convertToApiDate(displayDate: string): string {
    const [day, month, year] = displayDate.split('/')
    return `${year}-${month}-${day}`
  }

  // Helper function to check if a date is in the past
  function isDateInPast(dateString: string): boolean {
    // dateString is in YYYY-MM-DD format
    const [year, month, day] = dateString.split('-').map(Number)
    const dateToCheck = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dateToCheck < today
  }

  // Helper function to check if a date is today
  function isDateToday(dateString: string): boolean {
    // dateString is in YYYY-MM-DD format
    const [year, month, day] = dateString.split('-').map(Number)
    const dateToCheck = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dateToCheck.setHours(0, 0, 0, 0)
    return dateToCheck.getTime() === today.getTime()
  }
  
  // Fetch time slots from API when component mounts or date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!instructorId || !apiDate || profileLoading) {
        return
      }
      
      try {
        setLoading(true)
        
        // Fetch availability for the specific date
        const response = await instructorAvailabilityApi.getAvailability(
          instructorId,
          apiDate,
          apiDate,
          true // skip cache to get fresh data
        )
        
        // Find the availability for this specific date
        const dateAvailability = response.availabilities.find(
          (avail: any) => avail.date === apiDate
        )
        
        if (dateAvailability && dateAvailability.timeSlots) {
          const convertedSlots = convertToFrontendTimeSlots(dateAvailability.timeSlots)
          setTimeSlots(convertedSlots)
        } else {
          // If no slots found from navigation state, check if there are initial slots
          if (navigationState?.timeSlots) {
            setTimeSlots(convertToFrontendTimeSlots(navigationState.timeSlots))
          } else {
            setTimeSlots([])
          }
        }
      } catch (error) {
        console.error('Error fetching time slots:', error)
        showToast(t('scheduleManagement.detail.toastLoadError'), 'error')
        
        // Fallback to navigation state if available
        if (navigationState?.timeSlots) {
          setTimeSlots(convertToFrontendTimeSlots(navigationState.timeSlots))
        } else {
          setTimeSlots([])
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchTimeSlots()
  }, [instructorId, apiDate, profileLoading, navigationState])
  
  // Update timeSlots when navigation state changes
  useEffect(() => {
    if (navigationState?.timeSlots && !loading) {
      setTimeSlots(convertToFrontendTimeSlots(navigationState.timeSlots))
    }
  }, [navigationState])
  
  const [timeModalOpen, setTimeModalOpen] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [meetingType, setMeetingType] = useState<'online' | 'offline' | 'both'>('both')
  const [capacity, setCapacity] = useState('10')
  
  // Link/Location modal states
  const [linkLocationModalOpen, setLinkLocationModalOpen] = useState(false)
  const [currentEditingSlotForLink, setCurrentEditingSlotForLink] = useState<TimeSlot | null>(null)
  const [meetingLinkInput, setMeetingLinkInput] = useState('')
  const [meetingLocationInput, setMeetingLocationInput] = useState('')
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 })

  const totalSlots = timeSlots.reduce((sum, slot) => sum + slot.totalSlots, 0)
  const totalBooked = timeSlots.reduce((sum, slot) => sum + slot.bookedSlots, 0)
  const bookingRate = totalSlots > 0 ? Math.round((totalBooked / totalSlots) * 100) : 0

  const showToast = (message: string, type: string) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleBackToSchedule = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/teacher/appointments')
    }
  }

  const handleOpenEditor = (slot: TimeSlot) => {
    setCurrentEditingSlot(slot)
    
    // If there's an active session for this slot, convert attendance to students
    if (currentSessionSlot?.id === slot.id && attendanceAttempts.length > 0) {
      const verifiedStudents = attendanceAttempts
        .filter(attempt => attempt.status === 'verified')
        .map(attempt => ({
          id: attempt.accountId.toString(),
          name: `${attempt.accountName} (${attempt.accountType === 'student' ? 'SV' : 'PH'})`,
          studentCode: '', // We don't have student code from attendance
          className: '', // We don't have class info from attendance
          attendanceCount: 0
        }))
      setSelectedStudents(verifiedStudents)
    }
    
    setIsEditorOpen(true)
  }

  const handleRemoveSlot = async (slotId: string) => {
    if (!instructorId) {
      showToast('Không tìm thấy thông tin giảng viên', 'error')
      return
    }

    // Check if the date is in the past
    if (apiDate && isDateInPast(apiDate)) {
      showToast(t('scheduleManagement.detail.toastPastDateDelete'), 'error')
      return
    }

    if (confirm("Bạn có chắc chắn muốn xóa khung giờ này?")) {
      try {
        // Call API to delete slot from database
        await instructorAvailabilityApi.deleteTimeSlot(instructorId, parseInt(slotId))
        
        // Update local state
        setTimeSlots(timeSlots.filter(slot => slot.id !== slotId))
        showToast(t('scheduleManagement.detail.toastSlotDeleted'), 'success')
      } catch (error) {
        console.error('Error deleting slot:', error)
        showToast(t('scheduleManagement.detail.toastDeleteFailed'), 'error')
      }
    }
  }

  const handleOpenTimeModal = () => {
    // Check if the date is in the past
    if (apiDate && isDateInPast(apiDate)) {
      showToast('Không thể thêm khung giờ vào ngày đã qua!', 'error')
      return
    }

    setTimeModalOpen(true)
    setStartTime('')
    setEndTime('')
    setMeetingType('both')
    setCapacity('10')
  }

  const handleAddTimeSlot = async () => {
    if (!instructorId) {
      showToast(t('scheduleManagement.detail.toastNoInstructor'), 'error')
      return
    }

    if (!apiDate) {
      showToast(t('scheduleManagement.detail.toastNoDate'), 'error')
      return
    }

    // Check if the date is in the past (double-check)
    if (isDateInPast(apiDate)) {
      showToast(t('scheduleManagement.detail.toastPastDateAdd'), 'error')
      setTimeModalOpen(false)
      return
    }

    if (!startTime || !endTime) {
      showToast(t('scheduleManagement.detail.toastMissingTime'), 'error')
      return
    }
    if (startTime >= endTime) {
      showToast(t('scheduleManagement.detail.toastInvalidTimeRange'), 'error')
      return
    }

    try {
      // Call API to add time slot to database
      const response = await instructorAvailabilityApi.addTimeSlot(
        instructorId,
        apiDate,
        {
          startTime,
          endTime,
          meetingType,
          capacity: parseInt(capacity) || 10,
          note: ''
        }
      )

      // Convert response to frontend format and add to local state
      const start = new Date(`2000-01-01T${startTime}`)
      const end = new Date(`2000-01-01T${endTime}`)
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

      const newSlot: TimeSlot = {
        id: response.slotId?.toString() || Date.now().toString(),
        startTime,
        endTime,
        duration,
        meetingType,
        totalSlots: parseInt(capacity) || 10,
        bookedSlots: 0,
        colorScheme: ['blue', 'orange', 'teal', 'purple'][Math.floor(Math.random() * 4)] as any,
        meetingLink: response.meetingLink,
        meetingLocation: response.meetingLocation,
        isOpen: response.isOpen,
        autoAccept: response.autoAccept,
        note: response.note
      }

      setTimeSlots([...timeSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)))
      setTimeModalOpen(false)
      showToast(t('scheduleManagement.detail.toastSlotAdded', { startTime, endTime }), 'success')
    } catch (error) {
      console.error('Error adding time slot:', error)
      showToast(t('scheduleManagement.detail.toastAddFailed'), 'error')
    }
  }

  const handleOpenLinkLocationModal = (slot: TimeSlot, event: React.MouseEvent) => {
    const card = (event.currentTarget as HTMLElement).closest('.slot-card')
    if (card) {
      const rect = card.getBoundingClientRect()
      const panelWidth = 384 // w-96 = 24rem = 384px
      const gap = 16
      
      let left = rect.right + gap
      let top = rect.top
      
      // Check if panel would overflow right side of screen
      if (left + panelWidth > window.innerWidth) {
        // Position to the left of card instead
        left = rect.left - panelWidth - gap
        
        // If still overflows, center it
        if (left < 0) {
          left = (window.innerWidth - panelWidth) / 2
        }
      }
      
      // Check if panel would overflow bottom of screen
      const maxPanelHeight = window.innerHeight * 0.8 // 80vh
      if (top + maxPanelHeight > window.innerHeight) {
        top = Math.max(10, window.innerHeight - maxPanelHeight - 10)
      }
      
      setPanelPosition({ top, left })
    }
    setCurrentEditingSlotForLink(slot)
    setMeetingLinkInput(slot.meetingLink || '')
    setMeetingLocationInput(slot.meetingLocation || '')
    setLinkLocationModalOpen(true)
  }

  const handleSaveLinkLocation = async () => {
    if (!currentEditingSlotForLink || !instructorId) {
      showToast(t('scheduleManagement.detail.toastCannotSave'), 'error')
      return
    }

    try {
      // Call API to update slot in database
      const response = await instructorAvailabilityApi.updateTimeSlot(
        instructorId,
        parseInt(currentEditingSlotForLink.id),
        {
          meetingLink: meetingLinkInput || undefined,
          meetingLocation: meetingLocationInput || undefined
        }
      )

      // Update local state
      const updatedSlots = timeSlots.map(slot => {
        if (slot.id === currentEditingSlotForLink.id) {
          return {
            ...slot,
            meetingLink: meetingLinkInput || slot.meetingLink,
            meetingLocation: meetingLocationInput || slot.meetingLocation
          }
        }
        return slot
      })

      setTimeSlots(updatedSlots)
      setLinkLocationModalOpen(false)
      showToast(t('scheduleManagement.detail.toastSaveSuccess'), 'success')
    } catch (error) {
      console.error('Error updating slot:', error)
      showToast(t('scheduleManagement.detail.toastSaveFailed', { error: error instanceof Error ? error.message : t('scheduleManagement.detail.unknownError') }), 'error')
    }
  }

  // QR Session Management Functions
  const startAttendanceSession = async (slot: TimeSlot) => {
    if (!instructorId) {
      showToast(t('scheduleManagement.detail.toastNoInstructor'), 'error')
      return
    }

    try {
      // Create attendance session using slotId (not appointmentId)
      const response = await attendanceApi.createSession({
        slotId: parseInt(slot.id), // Pass slotId for walk-in sessions
        qrRefreshInterval: qrRefreshInterval,
        qrExpirySeconds: 15
      })

      // Check if session_id exists
      if (!response.session_id) {
        showToast(t('scheduleManagement.detail.toastNoSessionId'), 'error')
        return
      }

      // Use context to start session with date for navigation
      startQRSession(slot, response.session_id, apiDate || undefined)
      setShowQRModal(true)
      showToast(t('scheduleManagement.detail.toastSessionStarted'), 'success')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Không thể bắt đầu buổi cố vấn'
      showToast(errorMessage, 'error')
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    try {
      // Format duration for display
      const minutes = Math.floor(sessionDuration / 60)
      const seconds = sessionDuration % 60
      
      // Use context to end session
      await endQRSession()
      
      setShowQRModal(false)
      showToast(t('scheduleManagement.detail.toastSessionEnded', { minutes, seconds }), 'success')
    } catch (error) {
      showToast('Có lỗi khi kết thúc buổi cố vấn', 'error')
    }
  }

  const stopAttendanceSession = () => {
    setShowConfirmClose(true)
  }

  // Format timer display
  const formatTimer = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="dark:bg-white dark:text-gray-900">
      {/* Loading State */}
      {profileLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-600">{t('scheduleManagement.detail.loadingInfo')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!profileLoading && !instructorId && (
        <div className="bg-red-50 dark:bg-red-50 border border-red-200 dark:border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-800 dark:text-red-800">
            {t('scheduleManagement.detail.errorLoadProfile')}
          </p>
        </div>
      )}

      {/* Main Content */}
      {!profileLoading && instructorId && (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-600 mb-6">
            <button 
              onClick={handleBackToSchedule}
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('scheduleManagement.detail.breadcrumbSetup')}</span>
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-gray-900 font-medium">{t('scheduleManagement.detail.breadcrumbDetail')} {currentDate}</span>
          </div>

          {/* Page Header */}
          <div className="mb-6">
            {/* Warning for past dates */}
            {apiDate && isDateInPast(apiDate) && (
              <div className="bg-yellow-50 dark:bg-yellow-50 border border-yellow-200 dark:border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-800 mb-1">
                    {t('scheduleManagement.detail.pastDateWarningTitle')}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-700">
                    {t('scheduleManagement.detail.pastDateWarningDesc')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-900 mb-2">{t('scheduleManagement.detail.pageTitle')}</h1>
                <p className="text-gray-600 dark:text-gray-600">{currentWeekday}, {currentDate}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-100 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-800">
                    {timeSlots.length} {t('scheduleManagement.detail.slotsSetup')}
                  </span>
                </div>
                <Button 
                  onClick={handleOpenTimeModal}
                  className={`${
                    apiDate && isDateInPast(apiDate)
                      ? 'bg-gray-400 dark:bg-gray-400 cursor-not-allowed !text-white'
                      : 'bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 !text-white'
                  }`}
                  disabled={loading || (apiDate ? isDateInPast(apiDate) : false)}
                  title={
                    apiDate && isDateInPast(apiDate)
                      ? t('scheduleManagement.detail.pastDateTooltipAdd')
                      : t('scheduleManagement.detail.addSlotTooltip')
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('scheduleManagement.detail.addTimeSlot')}
                </Button>
              </div>
            </div>
          </div>

          {/* Time Slots Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {timeSlots.map((slot) => {
          const meetingConfig = meetingTypeConfig[slot.meetingType]
          const colorConfig = colorSchemeConfig[slot.colorScheme]
          const MeetingIcon = meetingConfig.icon

          return (
            <Card key={slot.id} className="slot-card hover:shadow-md transition-shadow relative dark:bg-white dark:border-gray-300">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`${colorConfig.bg} p-3 rounded-lg`}>
                      <Clock className={`w-6 h-6 ${colorConfig.text}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900">
                        {slot.startTime} - {slot.endTime}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-600">{slot.duration} {t('scheduleManagement.detail.minutes')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    disabled={apiDate ? isDateInPast(apiDate) : false}
                    className={`transition-colors ${
                      apiDate && isDateInPast(apiDate)
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                    title={
                      apiDate && isDateInPast(apiDate)
                        ? t('scheduleManagement.detail.pastDateTooltipDelete')
                        : t('common.delete')
                    }
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('scheduleManagement.detail.meetingType')}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${meetingConfig.bgColor} ${meetingConfig.textColor}`}>
                      <MeetingIcon className="w-3 h-3 mr-1" />
                      {meetingConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('scheduleManagement.detail.slots')}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Users className="w-3 h-3 mr-1" />
                      {slot.totalSlots} slots
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-600">{t('scheduleManagement.detail.booked')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-900">
                      {slot.bookedSlots}/{slot.totalSlots}
                    </span>
                  </div>
                  
                  {/* Meeting Link for Online/Both */}
                  {(slot.meetingType === 'online' || slot.meetingType === 'both') && (
                    <div className="border-t border-gray-100 dark:border-gray-300 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-600">{t('scheduleManagement.detail.meetingLink')}</span>
                        {slot.meetingLink ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={slot.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-600 hover:underline truncate max-w-[100px]"
                              title={slot.meetingLink}
                            >
                              {slot.meetingLink}
                            </a>
                            <button
                              onClick={(e) => handleOpenLinkLocationModal(slot, e)}
                              className="text-xs text-gray-500 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-600 transition-colors"
                              title={t('scheduleManagement.detail.editLink')}
                            >
                              
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleOpenLinkLocationModal(slot, e)}
                            className="text-xs text-blue-600 dark:text-blue-600 hover:text-blue-700 dark:hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            {t('scheduleManagement.detail.addLink')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Meeting Location for Offline */}
                  {slot.meetingType === 'offline' && (
                    <div className="border-t border-gray-100 dark:border-gray-300 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-600">{t('scheduleManagement.detail.location')}</span>
                        {slot.meetingLocation ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-700 dark:text-gray-700 truncate max-w-[100px]" title={slot.meetingLocation}>
                              {slot.meetingLocation}
                            </span>
                            <button
                              onClick={(e) => handleOpenLinkLocationModal(slot, e)}
                              className="text-xs text-gray-500 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-600 transition-colors"
                              title={t('scheduleManagement.detail.editLink')}
                            >
                              
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleOpenLinkLocationModal(slot, e)}
                            className="text-xs text-orange-600 dark:text-orange-600 hover:text-orange-700 dark:hover:text-orange-700 font-medium flex items-center gap-1"
                          >
                            <MapPinned className="w-3 h-3" />
                            {t('scheduleManagement.detail.addLocation')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  {/* Start Session button only shows on today's date */}
                  {apiDate && isDateToday(apiDate) && (!isSessionActive || currentSessionSlot?.id !== slot.id) && (
                    <Button
                      onClick={() => startAttendanceSession(slot)}
                      className="w-full bg-green-600 hover:bg-green-700 !text-white dark:!text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {t('scheduleManagement.detail.startSession')}
                    </Button>
                  )}
                  
                  {/* End Session button shows when session is active for this slot */}
                  {isSessionActive && currentSessionSlot?.id === slot.id && (
                    <Button
                      onClick={stopAttendanceSession}
                      className="w-full bg-red-600 hover:bg-red-700 !text-white dark:!text-white"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      {t('scheduleManagement.detail.endSession')}
                    </Button>
                  )}
                  
                  {/* Create Log button always shows */}
                  <Button
                    onClick={() => handleOpenEditor(slot)}
                    className="w-full bg-blue-600 hover:bg-blue-700 !text-white dark:!text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {t('scheduleManagement.detail.createLog')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
            </div>
          )}

          {/* Summary Section */}
          <Card className="dark:bg-white dark:border-gray-300">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-4">
                {t('scheduleManagement.detail.summaryTitle')} {currentDate}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-blue-50 dark:bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-600 mb-1">
                {timeSlots.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-600">{t('scheduleManagement.detail.totalSlots')}</div>
            </div>
            <div className="text-center bg-green-50 dark:bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-600 mb-1">
                {totalSlots}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-600">{t('scheduleManagement.detail.totalCapacity')}</div>
            </div>
            <div className="text-center bg-orange-50 dark:bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-600 mb-1">
                {totalBooked}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-600">{t('scheduleManagement.detail.totalBooked')}</div>
            </div>
            <div className="text-center bg-purple-50 dark:bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-600 mb-1">
                {bookingRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-600">{t('scheduleManagement.detail.bookingRate')}</div>
            </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modals */}
      {currentEditingSlot && (
        <>
          <WordEditorModal
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            timeSlot={currentEditingSlot}
            date={currentDate}
            weekday={currentWeekday}
            onSelectStudents={() => {
              setIsStudentModalOpen(true)
            }}
            selectedStudents={selectedStudents}
          />

          <StudentSelectionModal
            isOpen={isStudentModalOpen}
            onClose={() => setIsStudentModalOpen(false)}
            timeSlot={`${currentEditingSlot.startTime} - ${currentEditingSlot.endTime}`}
            onConfirm={(students: Student[]) => {
              setSelectedStudents(students)
              setIsStudentModalOpen(false)
            }}
            instructorId={instructorId ?? undefined}
            date={apiDate || undefined}
            startTime={currentEditingSlot.startTime}
            endTime={currentEditingSlot.endTime}
          />
        </>
      )}

      {/* Add Time Slot Modal */}
      {timeModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTimeModalOpen(false)
            }
          }}
        >
          <div className="bg-white dark:bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{t('scheduleManagement.detail.addTimeModalTitle')}</h3>
                <button
                  onClick={() => setTimeModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {currentWeekday}, {currentDate}
              </p>

              {/* Quick Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('scheduleManagement.detail.quickSelectTitle')}
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { start: '08:00', end: '09:00', label: '8:00 - 9:00 (1h)' },
                    { start: '09:00', end: '10:00', label: '9:00 - 10:00 (1h)' },
                    { start: '14:00', end: '15:00', label: '14:00 - 15:00 (1h)' },
                    { start: '16:00', end: '17:00', label: '16:00 - 17:00 (1h)' },
                    { start: '19:00', end: '20:00', label: '19:00 - 20:00 (1h)' },
                    { start: '20:00', end: '21:00', label: '20:00 - 21:00 (1h)' },
                  ].map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setStartTime(slot.start)
                        setEndTime(slot.end)
                      }}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 text-sm transition-colors"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Time */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('scheduleManagement.detail.customTimeTitle')}
                </label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="startTime" className="block text-xs font-medium text-gray-600 mb-2">
                      {t('scheduleManagement.detail.startTimeLabel')}
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="block text-xs font-medium text-gray-600 mb-2">
                      {t('scheduleManagement.detail.endTimeLabel')}
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Meeting Type and Capacity */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('scheduleManagement.detail.infoLabel')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="meetingType" className="block text-xs font-medium text-gray-600 mb-2">
                      {t('scheduleManagement.detail.meetingTypeSelect')}
                    </label>
                    <select
                      id="meetingType"
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value as 'online' | 'offline' | 'both')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="both">{t('scheduleManagement.detail.bothType')}</option>
                      <option value="online">{t('scheduleManagement.detail.onlineType')}</option>
                      <option value="offline">{t('scheduleManagement.detail.offlineType')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="capacity" className="block text-xs font-medium text-gray-600 mb-2">
                      {t('scheduleManagement.detail.capacityLabel')}
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {t('scheduleManagement.detail.capacityHelp')}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setTimeModalOpen(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 !text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('scheduleManagement.detail.cancel')}
                </button>
                <button
                  onClick={handleAddTimeSlot}
                  className="flex-1 bg-green-600 hover:bg-green-700 !text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('scheduleManagement.detail.addButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link/Location Fixed Floating Panel */}
      {linkLocationModalOpen && currentEditingSlotForLink && (
        <div 
          className="fixed w-96 bg-white dark:bg-white rounded-xl shadow-2xl border border-gray-200 dark:border-gray-300 z-50 animate-in slide-in-from-right-5 duration-300"
          style={{
            top: `${panelPosition.top}px`,
            left: `${panelPosition.left}px`,
            maxHeight: '80vh'
          }}
        >
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                {currentEditingSlotForLink.meetingType === 'offline' ? (
                  <>
                    <MapPinned className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{t('scheduleManagement.detail.addLocationTitle')}</h3>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{t('scheduleManagement.detail.addLinkTitle')}</h3>
                  </>
                )}
              </div>
              <button
                onClick={() => setLinkLocationModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              {t('scheduleManagement.detail.timeSlotLabel')}: {currentEditingSlotForLink.startTime} - {currentEditingSlotForLink.endTime}
            </p>
          </div>

          {/* Panel Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* Meeting Link Input (for online/both) */}
            {(currentEditingSlotForLink.meetingType === 'online' || currentEditingSlotForLink.meetingType === 'both') && (
              <div className="mb-4">
                <label htmlFor="meetingLink" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  {t('scheduleManagement.detail.onlineLinkLabel')}
                </label>
                <input
                  type="url"
                  id="meetingLink"
                  value={meetingLinkInput}
                  onChange={(e) => setMeetingLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/xxx"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs text-blue-700 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{t('scheduleManagement.detail.onlineLinkHint')}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Meeting Location Input (for offline) */}
            {currentEditingSlotForLink.meetingType === 'offline' && (
              <div className="mb-4">
                <label htmlFor="meetingLocation" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  {t('scheduleManagement.detail.offlineLinkLabel')}
                </label>
                <input
                  type="text"
                  id="meetingLocation"
                  value={meetingLocationInput}
                  onChange={(e) => setMeetingLocationInput(e.target.value)}
                  placeholder={t('scheduleManagement.detail.locationPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                <div className="mt-2 bg-orange-50 border border-orange-100 rounded-lg p-3">
                  <p className="text-xs text-orange-700 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{t('scheduleManagement.detail.offlineLocationHint')}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Both type: Show both inputs */}
            {currentEditingSlotForLink.meetingType === 'both' && (
              <div className="mb-4 border-t border-gray-200 pt-4">
                <label htmlFor="meetingLocation" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  {t('scheduleManagement.detail.offlineLocationOptional')}
                </label>
                <input
                  type="text"
                  id="meetingLocation"
                  value={meetingLocationInput}
                  onChange={(e) => setMeetingLocationInput(e.target.value)}
                  placeholder={t('scheduleManagement.detail.locationPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="px-5 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setLinkLocationModalOpen(false)}
              className="flex-1 bg-gray-400 hover:bg-gray-500 !text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              {t('scheduleManagement.detail.cancel')}
            </button>
            <button
              onClick={handleSaveLinkLocation}
              className="flex-1 bg-blue-600 hover:bg-blue-700 !text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {t('scheduleManagement.detail.save')}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white ${
            toast.type === 'success'
              ? 'bg-green-500'
              : toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'warning'
              ? 'bg-yellow-500'
              : 'bg-blue-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && currentSessionSlot && (
        <>
          {isMinimized ? (
            /* Minimized horizontal bar */
            <div className="fixed bottom-4 right-4 left-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-4 flex-1">
                  <QrCode className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">{t('scheduleManagement.detail.qrModalTitle')}</h3>
                    <p className="text-sm text-blue-100">
                      {t('scheduleManagement.detail.sessionLabel')}: {currentSessionSlot.startTime} - {currentSessionSlot.endTime}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Timer */}
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-mono text-xl font-bold">{formatTimer(sessionDuration)}</span>
                  </div>
                  
                  {/* Verified count */}
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">
                      {attendanceAttempts.filter(a => a.status === 'verified').length}/{currentSessionSlot.bookedSlots}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMinimized(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title={t('scheduleManagement.detail.maximize')}
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={stopAttendanceSession}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title={t('scheduleManagement.detail.endSession')}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Full modal */
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {t('scheduleManagement.detail.qrModalTitle')}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('scheduleManagement.detail.sessionLabel')}: {currentSessionSlot.startTime} - {currentSessionSlot.endTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Timer in header */}
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-mono text-sm font-semibold text-blue-600">
                        {formatTimer(sessionDuration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMinimized(true)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                        title={t('scheduleManagement.detail.minimize')}
                      >
                        <Minimize2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={stopAttendanceSession}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code Display */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-6">
                  <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center">
                    {currentQRData ? (
                      <>
                        <QRCodeSVG
                          value={currentQRData}
                          size={280}
                          level="H"
                          includeMargin={true}
                        />
                        <p className="text-xs text-gray-500 mt-4 text-center">
                          {t('scheduleManagement.detail.qrRefreshMessage', { seconds: qrRefreshInterval / 1000 })}
                        </p>
                      </>
                    ) : (
                      <div className="w-[280px] h-[280px] flex items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Attendance Log */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {t('scheduleManagement.detail.qrAttendanceLog')} ({attendanceAttempts.filter(a => a.status === 'verified').length}/{attendanceAttempts.length})
              </h3>
              
              {attendanceAttempts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t('scheduleManagement.detail.noAttendanceYet')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {attendanceAttempts.map((attempt) => (
                    <div
                      key={attempt.attemptId}
                      className={`p-4 rounded-lg border-2 ${
                        attempt.status === 'verified'
                          ? 'bg-green-50 border-green-200'
                          : attempt.status === 'pending'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {attempt.accountName} ({attempt.accountType === 'student' ? t('scheduleManagement.detail.studentShort') : t('scheduleManagement.detail.parentShort')})
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {new Date(attempt.timestamp).toLocaleTimeString('vi-VN')}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              attempt.status === 'verified'
                                ? 'bg-green-100 text-green-700'
                                : attempt.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {attempt.status === 'verified' ? t('scheduleManagement.detail.qrVerified') : 
                               attempt.status === 'pending' ? t('scheduleManagement.detail.qrPending') : t('scheduleManagement.detail.qrRejected')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {attempt.trustScore}
                          </div>
                          <div className="text-xs text-gray-500">{t('scheduleManagement.detail.trustScore')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Button
                onClick={stopAttendanceSession}
                className="flex-1 bg-red-600 hover:bg-red-700 !text-white"
              >
                <Square className="w-4 h-4 mr-2" />
                {t('scheduleManagement.detail.endSession')}
              </Button>
            </div>
          </div>
        </div>
          )}
        </>
      )}

      {/* Confirm Close Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('scheduleManagement.detail.confirmEndTitle')}</h3>
            <p className="text-gray-600 mb-6">
              {t('scheduleManagement.detail.confirmEndMessage')}
              <br/>
              <span className="font-semibold text-blue-600">
                {t('scheduleManagement.detail.currentDuration')}: {formatTimer(sessionDuration)}
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                {t('scheduleManagement.detail.cancel')}
              </button>
              <button
                onClick={async () => {
                  setShowConfirmClose(false)
                  await handleEndSession()
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('scheduleManagement.detail.endSession')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
