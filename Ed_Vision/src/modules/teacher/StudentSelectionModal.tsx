import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import { Search, X, Loader2 } from "lucide-react"
import { 
  getStudentsByTimeSlot, 
  type StudentInSlot 
} from "@/services/teacher/api/meetingLogs"
export type Student = {
  id: string
  name: string
  studentCode: string
  className: string
  studentId?: number      // ID thực từ database
  accountId?: number      // Account ID từ database
}

type Props = {
  isOpen: boolean
  onClose: () =>void
  timeSlot: string
  onConfirm: (students: Student[]) =>void
  students?: Student[]
  // Thông tin để auto-load students từ API
  instructorId?: number
  date?: string           // Format: YYYY-MM-DD
  startTime?: string      // Format: HH:mm
  endTime?: string        // Format: HH:mm
}

export default function StudentSelectionModal({
  isOpen,
  onClose,
  timeSlot,
  onConfirm,
  students,
  instructorId,
  date,
  startTime,
  endTime
}: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [studentsList, setStudentsList] = useState<Student[]>(students || [])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Auto-load students từ API khi có đủ thông tin
  useEffect(() => {
    const fetchStudents = async () => {
      // Nếu đã có students prop hoặc không có đủ thông tin API, skip
      if (students || !instructorId || !date || !startTime || !endTime || !isOpen) {
        if (students) {
          setStudentsList(students)
        }
        return
      }

      setIsLoading(true)
      setLoadError(null)

      try {
        console.log('Fetching students from API:', {
          instructorId,
          date,
          startTime,
          endTime
        })

        const response = await getStudentsByTimeSlot(
          instructorId,
          date,
          startTime,
          endTime
        )

        console.log('Students loaded from API:', response)

        // Convert API response sang Student type
        const apiStudents: Student[] = response.students.map((s: StudentInSlot) =>({
          id: s.student_code,           // Dùng student_code làm ID cho UI
          name: s.name,
          studentCode: s.student_code,
          className: s.class_name,
          studentId: s.student_id,      // Lưu student_id thực từ DB
          accountId: s.account_id       // Lưu account_id từ DB
        }))

        setStudentsList(apiStudents)
        console.log(` Loaded ${apiStudents.length} students from database`)

        if (apiStudents.length === 0) {
          setLoadError('Không có sinh viên nào đăng ký trong khung giờ này')
        }

      } catch (error) {
        console.error('Error loading students:', error)
        setLoadError('Không thể tải danh sách sinh viên. Vui lòng thử lại.')
        setStudentsList([]) // Clear list on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [isOpen, instructorId, date, startTime, endTime, students])

  // Filter students dựa trên search term
  useEffect(() => {
    const filtered = studentsList.filter(
      (student) =>student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.className.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [searchTerm, studentsList])

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleConfirm = () => {
    const selected = studentsList.filter((s) =>selectedStudents.has(s.id))
    console.log('Selected students with IDs:', selected.map(s =>({
      name: s.name,
      studentId: s.studentId,
      accountId: s.accountId
    })))
    onConfirm(selected)
    setSelectedStudents(new Set())
    setSearchTerm("")
  }

  const handleClose = () => {
    setSelectedStudents(new Set())
    setSearchTerm("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} zIndex="z-[60]">
      <DialogContent className="w-[90vw] max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">Chọn sinh viên tham gia
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Khung giờ: <span className="font-medium">{timeSlot}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6"/>
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Input
              type="text"placeholder="Tìm kiếm sinh viên..."value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>setSearchTerm(e.target.value)}
              className="pl-10"disabled={isLoading}
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin"/>
              <p className="text-sm text-gray-600">Đang tải danh sách sinh viên...</p>
            </div>)}

          {/* Error State */}
          {!isLoading && loadError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">{loadError}</p>
            </div>)}

          {/* Student List */}
          {!isLoading && !loadError && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredStudents.map((student) =>(
              <label
                key={student.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"className="mr-3 h-4 w-4 rounded border-gray-300"checked={selectedStudents.has(student.id)}
                  onChange={() =>handleToggleStudent(student.id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-600">MSSV: {student.studentCode} - Lớp {student.className}
                  </div>
                  {/* Debug info - có thể xóa sau */}
                  {student.studentId && (
                    <div className="text-xs text-gray-400 mt-1">ID: {student.studentId} | Account: {student.accountId}
                    </div>)}
                </div>
              </label>))}

            {filteredStudents.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">Không tìm thấy sinh viên nào
              </div>)}
            </div>)}

          {/* Selected Count */}
          {!isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">Đã chọn: <span className="font-medium">{selectedStudents.size}</span>sinh viên
              </p>
            </div>)}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleClose}
            variant="outline"className="flex-1 !text-gray-700">Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700 !text-white">Xác nhận
          </Button>
        </div>
      </DialogContent>
    </Dialog>)
}
