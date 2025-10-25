import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import { Search, X } from "lucide-react"

export type Student = {
  id: string
  name: string
  studentCode: string
  className: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  timeSlot: string
  onConfirm: (students: Student[]) => void
  students?: Student[]
}

const defaultStudents: Student[] = [
  {
    id: "SV001",
    name: "Nguyễn Văn An",
    studentCode: "SV001",
    className: "K28 CMU TPM 1"
  },
  {
    id: "SV002",
    name: "Trần Thị Bình",
    studentCode: "SV002",
    className: "K28 CMU TPM 1"
  },
  {
    id: "SV003",
    name: "Lê Văn Cường",
    studentCode: "SV003",
    className: "K29 CMU TPM 2"
  },
  {
    id: "SV004",
    name: "Phạm Thị Dung",
    studentCode: "SV004",
    className: "K29 CMU TPM 2"
  },
  {
    id: "SV005",
    name: "Hoàng Văn Em",
    studentCode: "SV005",
    className: "K30 CMU TPM 3"
  },
  {
    id: "SV006",
    name: "Vũ Thị Phương",
    studentCode: "SV006",
    className: "K30 CMU TPM 3"
  }
]

export default function StudentSelectionModal({
  isOpen,
  onClose,
  timeSlot,
  onConfirm,
  students = defaultStudents
}: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [filteredStudents, setFilteredStudents] = useState(students)

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.className.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [searchTerm, students])

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
    const selected = students.filter((s) => selectedStudents.has(s.id))
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
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Chọn sinh viên tham gia
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Khung giờ: <span className="font-medium">{timeSlot}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Tìm kiếm sinh viên..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>

          {/* Student List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredStudents.map((student) => (
              <label
                key={student.id}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4 rounded border-gray-300"
                  checked={selectedStudents.has(student.id)}
                  onChange={() => handleToggleStudent(student.id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-600">
                    MSSV: {student.studentCode} - Lớp {student.className}
                  </div>
                </div>
              </label>
            ))}

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy sinh viên nào
              </div>
            )}
          </div>

          {/* Selected Count */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Đã chọn: <span className="font-medium">{selectedStudents.size}</span> sinh viên
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Xác nhận
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
