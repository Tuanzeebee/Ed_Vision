import { useState, useEffect } from "react"
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
  Loader2
} from "lucide-react"
import StudentSelectionModal, { type Student } from "./StudentSelectionModal"
import WordEditorModal from "./WordEditorModal"
import TeacherLayout from "./components/TeacherLayout"
import { useInstructorProfile } from "./hooks/useInstructorProfile"
import { instructorAvailabilityApi } from "@/services/teacher/api"

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

export default function MeetingDetailView({ 
  date: propDate,
  weekday: propWeekday,
  onBack
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  
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
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    return days[date.getDay()]
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
  
  // Helper function to convert DD/MM/YYYY back to YYYY-MM-DD
  function convertToApiDate(displayDate: string): string {
    const [day, month, year] = displayDate.split('/')
    return `${year}-${month}-${day}`
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
        showToast('Không thể tải dữ liệu khung giờ', 'error')
        
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
    setIsEditorOpen(true)
  }

  const handleRemoveSlot = async (slotId: string) => {
    if (!instructorId) {
      showToast('Không tìm thấy thông tin giảng viên', 'error')
      return
    }

    if (confirm("Bạn có chắc chắn muốn xóa khung giờ này?")) {
      try {
        // Call API to delete slot from database
        await instructorAvailabilityApi.deleteTimeSlot(instructorId, parseInt(slotId))
        
        // Update local state
        setTimeSlots(timeSlots.filter(slot => slot.id !== slotId))
        showToast('Đã xóa khung giờ thành công!', 'success')
      } catch (error) {
        console.error('Error deleting slot:', error)
        showToast('Không thể xóa khung giờ. Vui lòng thử lại!', 'error')
      }
    }
  }

  const handleOpenTimeModal = () => {
    setTimeModalOpen(true)
    setStartTime('')
    setEndTime('')
    setMeetingType('both')
    setCapacity('10')
  }

  const handleAddTimeSlot = async () => {
    if (!instructorId) {
      showToast('Không tìm thấy thông tin giảng viên', 'error')
      return
    }

    if (!apiDate) {
      showToast('Không xác định được ngày', 'error')
      return
    }

    if (!startTime || !endTime) {
      showToast('Vui lòng nhập đầy đủ thời gian!', 'error')
      return
    }
    if (startTime >= endTime) {
      showToast('Giờ bắt đầu phải nhỏ hơn giờ kết thúc!', 'error')
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
      showToast(`Đã thêm khung giờ ${startTime} - ${endTime} thành công!`, 'success')
    } catch (error) {
      console.error('Error adding time slot:', error)
      showToast('Không thể thêm khung giờ. Vui lòng thử lại!', 'error')
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
      showToast('Không thể lưu thông tin', 'error')
      console.error('Missing data:', { currentEditingSlotForLink, instructorId })
      return
    }

    console.log('Saving link/location:', {
      slotId: currentEditingSlotForLink.id,
      instructorId,
      meetingLink: meetingLinkInput,
      meetingLocation: meetingLocationInput
    })

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

      console.log('API response:', response)

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
      showToast('Đã lưu thông tin thành công!', 'success')
    } catch (error) {
      console.error('Error updating slot:', error)
      showToast(`Không thể lưu thông tin: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`, 'error')
    }
  }

  return (
    <TeacherLayout currentPage="appointment">
      {/* Loading State */}
      {profileLoading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!profileLoading && !instructorId && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-800">
            Không thể tải thông tin giảng viên. Vui lòng đăng nhập lại.
          </p>
        </div>
      )}

      {/* Main Content */}
      {!profileLoading && instructorId && (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <button 
              onClick={handleBackToSchedule}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Thiết lập lịch rảnh</span>
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Chi tiết ngày {currentDate}</span>
          </div>

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">📅 Chi tiết cuộc họp</h1>
                <p className="text-gray-600">{currentWeekday}, {currentDate}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-blue-800">
                    {timeSlots.length} khung giờ đã thiết lập
                  </span>
                </div>
                <Button 
                  onClick={handleOpenTimeModal}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm khung giờ
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
            <Card key={slot.id} className="slot-card hover:shadow-md transition-shadow relative">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`${colorConfig.bg} p-3 rounded-lg`}>
                      <Clock className={`w-6 h-6 ${colorConfig.text}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {slot.startTime} - {slot.endTime}
                      </h3>
                      <p className="text-sm text-gray-600">{slot.duration} phút</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Loại cuộc họp:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${meetingConfig.bgColor} ${meetingConfig.textColor}`}>
                      <MeetingIcon className="w-3 h-3 mr-1" />
                      {meetingConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Số slot:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Users className="w-3 h-3 mr-1" />
                      {slot.totalSlots} slots
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Đã đặt:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {slot.bookedSlots}/{slot.totalSlots}
                    </span>
                  </div>
                  
                  {/* Meeting Link for Online/Both */}
                  {(slot.meetingType === 'online' || slot.meetingType === 'both') && (
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Link họp:</span>
                        {slot.meetingLink ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={slot.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline truncate max-w-[100px]"
                              title={slot.meetingLink}
                            >
                              {slot.meetingLink}
                            </a>
                            <button
                              onClick={(e) => handleOpenLinkLocationModal(slot, e)}
                              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                              title="Chỉnh sửa"
                            >
                              ✏️
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleOpenLinkLocationModal(slot, e)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            Thêm link
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Meeting Location for Offline */}
                  {slot.meetingType === 'offline' && (
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Địa điểm:</span>
                        {slot.meetingLocation ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-700 truncate max-w-[100px]" title={slot.meetingLocation}>
                              {slot.meetingLocation}
                            </span>
                            <button
                              onClick={(e) => handleOpenLinkLocationModal(slot, e)}
                              className="text-xs text-gray-500 hover:text-orange-600 transition-colors"
                              title="Chỉnh sửa"
                            >
                              ✏️
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleOpenLinkLocationModal(slot, e)}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                          >
                            <MapPinned className="w-3 h-3" />
                            Thêm địa điểm
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="border-t border-gray-200 pt-4">
                  <Button
                    onClick={() => handleOpenEditor(slot)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Tạo nhật ký cố vấn
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
            </div>
          )}

          {/* Summary Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 Tổng quan ngày {currentDate}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {timeSlots.length}
              </div>
              <div className="text-sm text-gray-600">Khung giờ</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {totalSlots}
              </div>
              <div className="text-sm text-gray-600">Tổng slots</div>
            </div>
            <div className="text-center bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {totalBooked}
              </div>
              <div className="text-sm text-gray-600">Đã đặt</div>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {bookingRate}%
              </div>
              <div className="text-sm text-gray-600">Tỷ lệ đặt</div>
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
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Thêm khung giờ rảnh</h3>
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
                  Chọn nhanh khung giờ phổ biến
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
                  Hoặc tùy chỉnh thời gian
                </label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="startTime" className="block text-xs font-medium text-gray-600 mb-2">
                      Giờ bắt đầu
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
                      Giờ kết thúc
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
                  Thông tin bổ sung
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="meetingType" className="block text-xs font-medium text-gray-600 mb-2">
                      Loại cuộc họp
                    </label>
                    <select
                      id="meetingType"
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value as 'online' | 'offline' | 'both')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="both">🌍 Both (Cả hai)</option>
                      <option value="online">🌐 Online</option>
                      <option value="offline">🏫 Offline (Trực tiếp)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="capacity" className="block text-xs font-medium text-gray-600 mb-2">
                      Số lượng slot
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
                  Số lượng slot là số phụ huynh tối đa có thể đặt lịch trong khung giờ này
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setTimeModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddTimeSlot}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm giờ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link/Location Fixed Floating Panel */}
      {linkLocationModalOpen && currentEditingSlotForLink && (
        <div 
          className="fixed w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in slide-in-from-right-5 duration-300"
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
                    <h3 className="text-lg font-semibold">Thêm địa điểm họp</h3>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Thêm link họp</h3>
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
              Khung giờ: {currentEditingSlotForLink.startTime} - {currentEditingSlotForLink.endTime}
            </p>
          </div>

          {/* Panel Content */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* Meeting Link Input (for online/both) */}
            {(currentEditingSlotForLink.meetingType === 'online' || currentEditingSlotForLink.meetingType === 'both') && (
              <div className="mb-4">
                <label htmlFor="meetingLink" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  Link cuộc họp online
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
                    <span>Hỗ trợ: Google Meet, Zoom, Microsoft Teams, hoặc bất kỳ nền tảng họp online nào</span>
                  </p>
                </div>
              </div>
            )}

            {/* Meeting Location Input (for offline) */}
            {currentEditingSlotForLink.meetingType === 'offline' && (
              <div className="mb-4">
                <label htmlFor="meetingLocation" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  Địa điểm họp trực tiếp
                </label>
                <input
                  type="text"
                  id="meetingLocation"
                  value={meetingLocationInput}
                  onChange={(e) => setMeetingLocationInput(e.target.value)}
                  placeholder="Phòng 301, Tòa A1, Trường ĐH XYZ"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                <div className="mt-2 bg-orange-50 border border-orange-100 rounded-lg p-3">
                  <p className="text-xs text-orange-700 flex items-start gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Nhập địa chỉ cụ thể để phụ huynh dễ dàng tìm đến địa điểm họp</span>
                  </p>
                </div>
              </div>
            )}

            {/* Both type: Show both inputs */}
            {currentEditingSlotForLink.meetingType === 'both' && (
              <div className="mb-4 border-t border-gray-200 pt-4">
                <label htmlFor="meetingLocation" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  Địa điểm họp trực tiếp (tùy chọn)
                </label>
                <input
                  type="text"
                  id="meetingLocation"
                  value={meetingLocationInput}
                  onChange={(e) => setMeetingLocationInput(e.target.value)}
                  placeholder="Phòng 301, Tòa A1, Trường ĐH XYZ"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            )}
          </div>

          {/* Panel Footer */}
          <div className="px-5 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200 flex gap-3">
            <button
              onClick={() => setLinkLocationModalOpen(false)}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-300"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveLinkLocation}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Lưu
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
    </TeacherLayout>
  )
}
