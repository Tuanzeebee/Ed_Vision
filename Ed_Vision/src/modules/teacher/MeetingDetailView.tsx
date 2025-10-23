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
  CheckCircle
} from "lucide-react"
import StudentSelectionModal, { type Student } from "./StudentSelectionModal"
import WordEditorModal from "./WordEditorModal"
import TeacherLayout from "./components/TeacherLayout"

type MeetingType = "online" | "offline" | "both"

type TimeSlot = {
  id: string
  startTime: string
  endTime: string
  duration: number
  meetingType: MeetingType
  totalSlots: number
  bookedSlots: number
  colorScheme: "blue" | "orange" | "teal" | "purple"
}

type Props = {
  date?: string
  weekday?: string
  timeSlots?: TimeSlot[]
  onBack?: () => void
}

const defaultTimeSlots: TimeSlot[] = [
  {
    id: "1",
    startTime: "09:00",
    endTime: "10:00",
    duration: 60,
    meetingType: "online",
    totalSlots: 10,
    bookedSlots: 3,
    colorScheme: "blue"
  },
  {
    id: "2",
    startTime: "14:00",
    endTime: "15:00",
    duration: 60,
    meetingType: "offline",
    totalSlots: 5,
    bookedSlots: 5,
    colorScheme: "orange"
  },
  {
    id: "3",
    startTime: "16:00",
    endTime: "17:00",
    duration: 60,
    meetingType: "both",
    totalSlots: 15,
    bookedSlots: 8,
    colorScheme: "teal"
  },
  {
    id: "4",
    startTime: "19:00",
    endTime: "20:00",
    duration: 60,
    meetingType: "both",
    totalSlots: 8,
    bookedSlots: 2,
    colorScheme: "purple"
  }
]

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
  timeSlots: initialTimeSlots = defaultTimeSlots,
  onBack
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get data from navigation state or use props/defaults
  const navigationState = location.state as { date?: string; timeSlots?: any[] } | null
  
  // Convert backend time slots to frontend format
  const convertToFrontendTimeSlots = (backendSlots: any[]): TimeSlot[] => {
    return backendSlots.map((slot, index) => ({
      id: slot.slotId?.toString() || index.toString(),
      startTime: slot.start || slot.startTime,
      endTime: slot.end || slot.endTime,
      duration: 60, // Default duration
      meetingType: slot.meetingType || 'both',
      totalSlots: slot.capacity || 10,
      bookedSlots: slot.bookedCount || 0,
      colorScheme: (['blue', 'orange', 'teal', 'purple'][index % 4]) as any
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
  
  const initialSlotsData = navigationState?.timeSlots 
    ? convertToFrontendTimeSlots(navigationState.timeSlots) 
    : initialTimeSlots
  
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [currentEditingSlot, setCurrentEditingSlot] = useState<TimeSlot | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialSlotsData)
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null)
  
  // Update timeSlots when navigation state changes
  useEffect(() => {
    if (navigationState?.timeSlots) {
      setTimeSlots(convertToFrontendTimeSlots(navigationState.timeSlots))
    }
  }, [navigationState])
  
  // Add time modal state
  const [timeModalOpen, setTimeModalOpen] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [meetingType, setMeetingType] = useState<'online' | 'offline' | 'both'>('both')
  const [capacity, setCapacity] = useState('10')

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

  const handleRemoveSlot = (slotId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khung giờ này?")) {
      setTimeSlots(timeSlots.filter(slot => slot.id !== slotId))
      showToast('Đã xóa khung giờ thành công!', 'warning')
    }
  }

  const handleOpenTimeModal = () => {
    setTimeModalOpen(true)
    setStartTime('')
    setEndTime('')
    setMeetingType('both')
    setCapacity('10')
  }

  const handleAddTimeSlot = () => {
    if (!startTime || !endTime) {
      showToast('Vui lòng nhập đầy đủ thời gian!', 'error')
      return
    }
    if (startTime >= endTime) {
      showToast('Giờ bắt đầu phải nhỏ hơn giờ kết thúc!', 'error')
      return
    }

    const start = new Date(`2000-01-01T${startTime}`)
    const end = new Date(`2000-01-01T${endTime}`)
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime,
      endTime,
      duration,
      meetingType,
      totalSlots: parseInt(capacity) || 10,
      bookedSlots: 0,
      colorScheme: ['blue', 'orange', 'teal', 'purple'][Math.floor(Math.random() * 4)] as any
    }

    setTimeSlots([...timeSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)))
    setTimeModalOpen(false)
    showToast(`Đã thêm khung giờ ${startTime} - ${endTime} thành công!`, 'success')
  }

  return (
    <TeacherLayout currentPage="appointment">
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
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm khung giờ
            </Button>
          </div>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {timeSlots.map((slot) => {
          const meetingConfig = meetingTypeConfig[slot.meetingType]
          const colorConfig = colorSchemeConfig[slot.colorScheme]
          const MeetingIcon = meetingConfig.icon

          return (
            <Card key={slot.id} className="hover:shadow-md transition-shadow">
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
