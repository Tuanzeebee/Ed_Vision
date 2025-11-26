import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  Users,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  CheckCircle,
  XCircle,
} from "lucide-react"

type BookerType = "student" | "parent"

type MeetingType = "online" | "offline"

type Booking = {
  id: number
  date: string // ISO format YYYY-MM-DD
  time: string // e.g., "08:00 - 09:00"
  name: string
  bookerType: BookerType
  class?: string
  studentName?: string
  type: MeetingType
  avatar: string
}

type AvailableSlot = {
  date: string // ISO format YYYY-MM-DD
  time: string
}

type SlotInfo = {
  totalBookings: number
  studentCount: number
  parentCount: number
  bookings: Booking[]
}

type Props = {
  // Có thể thêm props để fetch data từ API
  instructorId?: number
}

export default function CalendarOverview({}: Props) {
  const [slotDetailsModal, setSlotDetailsModal] = useState(false)
  const [selectedSlotInfo, setSelectedSlotInfo] = useState("")
  const [selectedSlotBookings, setSelectedSlotBookings] = useState<Booking[] | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success")

  // Time slots configuration
  const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
  ]

  // Helper: Get Monday of current week
  const getMonday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  // Helper: Get date in ISO format
  const getDateISO = (dayOffset: number) => {
    const monday = getMonday()
    const date = new Date(monday)
    date.setDate(monday.getDate() + dayOffset)
    return date.toISOString().split("T")[0]
  }

  // Mock bookings data (trong production sẽ fetch từ API)
  const bookings: Booking[] = useMemo(() => {
    const monday = getDateISO(0)
    const tuesday = getDateISO(1)
    const wednesday = getDateISO(2)
    const thursday = getDateISO(3)
    const friday = getDateISO(4)

    return [
      // Thứ 2 - 08:00-09:00: 10 sinh viên
      { id: 1, date: monday, time: "08:00 - 09:00", name: "Nguyễn Văn An", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { id: 2, date: monday, time: "08:00 - 09:00", name: "Trần Thị Bình", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { id: 3, date: monday, time: "08:00 - 09:00", name: "Lê Văn Cường", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
      { id: 4, date: monday, time: "08:00 - 09:00", name: "Phạm Thị Dung", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
      { id: 5, date: monday, time: "08:00 - 09:00", name: "Hoàng Văn Em", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
      { id: 6, date: monday, time: "08:00 - 09:00", name: "Vũ Thị Phương", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop" },
      { id: 7, date: monday, time: "08:00 - 09:00", name: "Đỗ Văn Giang", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop" },
      { id: 8, date: monday, time: "08:00 - 09:00", name: "Ngô Thị Hà", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
      { id: 9, date: monday, time: "08:00 - 09:00", name: "Bùi Văn Hùng", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop" },
      { id: 10, date: monday, time: "08:00 - 09:00", name: "Lý Thị Lan", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop" },
      
      // Thứ 2 - 09:00-10:00: 5 sinh viên, 2 phụ huynh
      { id: 11, date: monday, time: "09:00 - 10:00", name: "Đinh Văn Minh", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop" },
      { id: 12, date: monday, time: "09:00 - 10:00", name: "Trương Thị Nga", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop" },
      { id: 13, date: monday, time: "09:00 - 10:00", name: "Phan Văn Oanh", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop" },
      { id: 14, date: monday, time: "09:00 - 10:00", name: "Mai Thị Phương", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
      { id: 15, date: monday, time: "09:00 - 10:00", name: "Cao Văn Quân", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { id: 16, date: monday, time: "09:00 - 10:00", name: "Bà Nguyễn Thị Hoa", bookerType: "parent", studentName: "Nguyễn Văn Sơn", type: "offline", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
      { id: 17, date: monday, time: "09:00 - 10:00", name: "Ông Trần Văn Tâm", bookerType: "parent", studentName: "Trần Thị Uyên", type: "online", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
      
      // Thứ 3 - 10:00-11:00: 10 sinh viên, 1 phụ huynh
      { id: 18, date: tuesday, time: "10:00 - 11:00", name: "Đặng Văn Việt", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
      { id: 19, date: tuesday, time: "10:00 - 11:00", name: "Tô Thị Xuân", bookerType: "student", class: "10A2", type: "offline", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop" },
      { id: 20, date: tuesday, time: "10:00 - 11:00", name: "Lương Văn Yên", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop" },
      { id: 21, date: tuesday, time: "10:00 - 11:00", name: "Hồ Thị Ánh", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
      { id: 22, date: tuesday, time: "10:00 - 11:00", name: "Dương Văn Bảo", bookerType: "student", class: "10A2", type: "offline", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop" },
      { id: 23, date: tuesday, time: "10:00 - 11:00", name: "Võ Thị Chi", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop" },
      { id: 24, date: tuesday, time: "10:00 - 11:00", name: "Trịnh Văn Đạt", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop" },
      { id: 25, date: tuesday, time: "10:00 - 11:00", name: "Lê Thị Hương", bookerType: "student", class: "10A2", type: "offline", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop" },
      { id: 26, date: tuesday, time: "10:00 - 11:00", name: "Nguyễn Văn Khoa", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop" },
      { id: 27, date: tuesday, time: "10:00 - 11:00", name: "Phạm Thị Linh", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
      { id: 28, date: tuesday, time: "10:00 - 11:00", name: "Bà Hoàng Thị Mai", bookerType: "parent", studentName: "Hoàng Văn Nam", type: "offline", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      
      // Thứ 4 - 13:00-14:00: 6 sinh viên, 4 phụ huynh
      { id: 47, date: wednesday, time: "13:00 - 14:00", name: "Nguyễn Thị Vân", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop" },
      { id: 48, date: wednesday, time: "13:00 - 14:00", name: "Phạm Văn Xuân", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop" },
      { id: 49, date: wednesday, time: "13:00 - 14:00", name: "Hoàng Thị Yến", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
      { id: 50, date: wednesday, time: "13:00 - 14:00", name: "Vũ Văn Ánh", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop" },
      { id: 51, date: wednesday, time: "13:00 - 14:00", name: "Đỗ Thị Bảo", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop" },
      { id: 52, date: wednesday, time: "13:00 - 14:00", name: "Ngô Văn Chi", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop" },
      { id: 53, date: wednesday, time: "13:00 - 14:00", name: "Bà Bùi Thị Hoa", bookerType: "parent", studentName: "Bùi Văn Đạt", type: "offline", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop" },
      { id: 54, date: wednesday, time: "13:00 - 14:00", name: "Ông Lý Văn Hùng", bookerType: "parent", studentName: "Lý Thị Lan", type: "online", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop" },
      { id: 55, date: wednesday, time: "13:00 - 14:00", name: "Bà Đinh Thị Mai", bookerType: "parent", studentName: "Đinh Văn Nam", type: "offline", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
      { id: 56, date: wednesday, time: "13:00 - 14:00", name: "Ông Trương Văn Phúc", bookerType: "parent", studentName: "Trương Thị Quỳnh", type: "online", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      
      // Thứ 5 - 09:00-10:00: 12 sinh viên
      { id: 57, date: thursday, time: "09:00 - 10:00", name: "Phan Thị Hà", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { id: 58, date: thursday, time: "09:00 - 10:00", name: "Mai Văn Hùng", bookerType: "student", class: "10A2", type: "offline", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
      { id: 59, date: thursday, time: "09:00 - 10:00", name: "Cao Thị Lan", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
      { id: 60, date: thursday, time: "09:00 - 10:00", name: "Đặng Văn Minh", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
      { id: 61, date: thursday, time: "09:00 - 10:00", name: "Tô Thị Nga", bookerType: "student", class: "10A2", type: "offline", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop" },
      { id: 62, date: thursday, time: "09:00 - 10:00", name: "Lương Văn Phong", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop" },
      { id: 63, date: thursday, time: "09:00 - 10:00", name: "Hồ Thị Quỳnh", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
      { id: 64, date: thursday, time: "09:00 - 10:00", name: "Dương Văn Sơn", bookerType: "student", class: "10A2", type: "offline", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop" },
      { id: 65, date: thursday, time: "09:00 - 10:00", name: "Võ Thị Tâm", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop" },
      { id: 66, date: thursday, time: "09:00 - 10:00", name: "Trịnh Văn Uyên", bookerType: "student", class: "10A1", type: "online", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop" },
      { id: 67, date: thursday, time: "09:00 - 10:00", name: "Lê Thị Vân", bookerType: "student", class: "10A2", type: "offline", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop" },
      { id: 68, date: thursday, time: "09:00 - 10:00", name: "Nguyễn Văn Xuân", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop" },
      
      // Thứ 6 - 09:00-10:00: 9 sinh viên, 5 phụ huynh
      { id: 75, date: friday, time: "09:00 - 10:00", name: "Lý Thị Mai", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop" },
      { id: 76, date: friday, time: "09:00 - 10:00", name: "Đinh Văn Nam", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop" },
      { id: 77, date: friday, time: "09:00 - 10:00", name: "Trương Thị Phương", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
      { id: 78, date: friday, time: "09:00 - 10:00", name: "Phan Văn Quân", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop" },
      { id: 79, date: friday, time: "09:00 - 10:00", name: "Mai Thị Sơn", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop" },
      { id: 80, date: friday, time: "09:00 - 10:00", name: "Cao Văn Tâm", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop" },
      { id: 81, date: friday, time: "09:00 - 10:00", name: "Đặng Thị Uyên", bookerType: "student", class: "10A2", type: "online", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop" },
      { id: 82, date: friday, time: "09:00 - 10:00", name: "Tô Văn Vân", bookerType: "student", class: "10A1", type: "offline", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop" },
      { id: 83, date: friday, time: "09:00 - 10:00", name: "Lương Thị Xuân", bookerType: "student", class: "10A3", type: "online", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
      { id: 84, date: friday, time: "09:00 - 10:00", name: "Bà Hồ Thị Yến", bookerType: "parent", studentName: "Hồ Văn Ánh", type: "offline", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
      { id: 85, date: friday, time: "09:00 - 10:00", name: "Ông Dương Văn Bảo", bookerType: "parent", studentName: "Dương Thị Chi", type: "online", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
      { id: 86, date: friday, time: "09:00 - 10:00", name: "Bà Võ Thị Hoa", bookerType: "parent", studentName: "Võ Văn Đạt", type: "offline", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
      { id: 87, date: friday, time: "09:00 - 10:00", name: "Ông Trịnh Văn Hùng", bookerType: "parent", studentName: "Trịnh Thị Lan", type: "online", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
      { id: 88, date: friday, time: "09:00 - 10:00", name: "Bà Lê Thị Mai", bookerType: "parent", studentName: "Lê Văn Nam", type: "offline", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" },
    ]
  }, [])

  // Mock available slots (trong production sẽ fetch từ API)
  const availableSlots: AvailableSlot[] = useMemo(() => {
    const monday = getDateISO(0)
    const tuesday = getDateISO(1)
    const wednesday = getDateISO(2)
    const thursday = getDateISO(3)
    const friday = getDateISO(4)

    return [
      { date: monday, time: "08:00 - 09:00" },
      { date: monday, time: "09:00 - 10:00" },
      { date: tuesday, time: "10:00 - 11:00" },
      { date: wednesday, time: "13:00 - 14:00" },
      { date: thursday, time: "09:00 - 10:00" },
      { date: friday, time: "09:00 - 10:00" },
    ]
  }, [])

  // Computed: Current week label
  const currentWeekLabel = useMemo(() => {
    const start = getMonday()
    const end = new Date(start)
    end.setDate(end.getDate() + 6)

    const formatDate = (date: Date) => {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    }

    return `Tuần ${formatDate(start)} - ${formatDate(end)}`
  }, [])

  // Computed: Week days
  const weekDays = useMemo(() => {
    const days = []
    const start = getMonday()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)

      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}`
      const dateISO = date.toISOString().split("T")[0]

      const isToday = date.getTime() === today.getTime()

      days.push({
        dayName: dayNames[date.getDay()],
        dateStr: dateStr,
        date: dateISO,
        isToday: isToday,
      })
    }

    return days
  }, [])

  // Computed: Statistics
  const totalBookings = bookings.length
  const totalStudents = bookings.filter((b) => b.bookerType === "student").length
  const totalParents = bookings.filter((b) => b.bookerType === "parent").length

  // Get slot info
  const getSlotInfo = (date: string, time: string): SlotInfo | null => {
    const hasSlot = availableSlots.some((s) => s.date === date && s.time === time)
    if (!hasSlot) return null

    const slotBookings = bookings.filter((b) => b.date === date && b.time === time)
    const studentCount = slotBookings.filter((b) => b.bookerType === "student").length
    const parentCount = slotBookings.filter((b) => b.bookerType === "parent").length

    return {
      totalBookings: slotBookings.length,
      studentCount: studentCount,
      parentCount: parentCount,
      bookings: slotBookings,
    }
  }

  // Show slot details
  const showSlotDetails = (date: string, time: string) => {
    const slotInfo = getSlotInfo(date, time)
    if (slotInfo && slotInfo.totalBookings > 0) {
      const dateObj = new Date(date)
      const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
      setSelectedSlotInfo(
        `${dayNames[dateObj.getDay()]}, ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} - ${time}`
      )
      setSelectedSlotBookings(slotInfo.bookings)
      setSlotDetailsModal(true)
    } else {
      displayToast("Không có lịch hẹn nào trong khung giờ này", "error")
    }
  }

  // Display toast
  const displayToast = (message: string, type: "success" | "error" | "info") => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📅 Xem lịch tổng quan</h1>
        <p className="text-gray-600">Xem thống kê lịch rảnh và số lượng người đặt lịch trong tuần này</p>
      </div>

      {/* Week Label */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <h2 className="text-xl font-bold text-gray-900">{currentWeekLabel}</h2>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Tổng lượt đặt</p>
              <p className="text-3xl font-bold">{totalBookings}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Sinh viên</p>
              <p className="text-3xl font-bold">{totalStudents}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Phụ huynh</p>
              <p className="text-3xl font-bold">{totalParents}</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Week Calendar View */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-32">Thời gian</th>
                {weekDays.map((day) => (
                  <th key={day.date} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[140px]">
                    <div>{day.dayName}</div>
                    <div className="text-xs font-normal text-gray-500">{day.dateStr}</div>
                    {day.isToday && (
                      <div className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 bg-blue-600 text-white">
                        Hôm nay
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">{timeSlot}</td>
                  {weekDays.map((day) => {
                    const slotInfo = getSlotInfo(day.date, timeSlot)
                    return (
                      <td key={`${day.date}-${timeSlot}`} className="px-2 py-2 text-center">
                        {slotInfo ? (
                          <div
                            className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 hover:bg-blue-100 cursor-pointer transition-all hover:shadow-md"
                            onClick={() => showSlotDetails(day.date, timeSlot)}
                          >
                            <div className="flex items-center justify-center gap-1 text-blue-700 text-xs font-semibold mb-2">
                              <CalendarCheck className="w-3 h-3" />
                              <span>Ngày rảnh</span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-center gap-1.5 text-gray-700">
                                <Users className="w-4 h-4 text-blue-600" />
                                <span className="text-lg font-bold">{slotInfo.totalBookings}</span>
                                <span className="text-xs text-gray-600">người</span>
                              </div>

                              <div className="flex items-center justify-center gap-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3 text-green-600" />
                                  <span className="font-semibold text-green-700">{slotInfo.studentCount}</span>
                                  <span className="text-gray-600">SV</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-purple-600" />
                                  <span className="font-semibold text-purple-700">{slotInfo.parentCount}</span>
                                  <span className="text-gray-600">PH</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-400">
                            <XCircle className="w-5 h-5 mx-auto" />
                            <div className="text-xs mt-1">Không có lịch</div>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Chú thích:</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Tổng số người đặt lịch</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Sinh viên (SV)</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700">Phụ huynh (PH)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slot Details Modal */}
      <Dialog open={slotDetailsModal} onOpenChange={setSlotDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">{selectedSlotInfo}</p>
          </DialogHeader>

          {selectedSlotBookings && (
            <div>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{selectedSlotBookings.length}</p>
                  <p className="text-xs text-gray-600">Tổng số</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <GraduationCap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">
                    {selectedSlotBookings.filter((b) => b.bookerType === "student").length}
                  </p>
                  <p className="text-xs text-gray-600">Sinh viên</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <UserCheck className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">
                    {selectedSlotBookings.filter((b) => b.bookerType === "parent").length}
                  </p>
                  <p className="text-xs text-gray-600">Phụ huynh</p>
                </div>
              </div>

              {/* Bookings List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Danh sách đặt lịch:</h4>
                {selectedSlotBookings.map((booking, index) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <img src={booking.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{booking.name}</p>
                      <p className="text-xs text-gray-600">
                        {booking.bookerType === "student"
                          ? `Sinh viên - ${booking.class}`
                          : `Phụ huynh của ${booking.studentName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.bookerType === "student"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {booking.bookerType === "student" ? (
                          <>
                            <GraduationCap className="inline w-3 h-3 mr-1" />
                            SV
                          </>
                        ) : (
                          <>
                            <UserCheck className="inline w-3 h-3 mr-1" />
                            PH
                          </>
                        )}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${
                          booking.type === "online" ? "bg-blue-500" : "bg-orange-500"
                        }`}
                      >
                        {booking.type === "online" ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setSlotDetailsModal(false)} className="bg-blue-600 hover:bg-blue-700">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`${
              toastType === "success"
                ? "bg-green-500"
                : toastType === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            } text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2`}
          >
            {toastType === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : toastType === "error" ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <Calendar className="w-5 h-5" />
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}
