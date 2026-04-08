import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Users,
  Save,
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table,
  Image as ImageIcon,
  Undo,
  Redo,
  Printer,
  Download
} from "lucide-react"
import type { Student } from "./StudentSelectionModal"
import {
  getInstructorInfo,
  getStudentsByTimeSlot,
  createMeetingLog,
  type InstructorInfo,
} from "@/services/teacher/api/meetingLogs"

type TimeSlot = {
  startTime: string
  endTime: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  timeSlot: TimeSlot
  date: string
  weekday: string
  onSelectStudents: () => void
  selectedStudents?: Student[]
}

export default function WordEditorModal({
  isOpen,
  onClose,
  timeSlot,
  date,
  weekday,
  onSelectStudents,
  selectedStudents = []
}: Props) {
  const [fontFamily, setFontFamily] = useState("Times New Roman")
  const [fontSize, setFontSize] = useState("14")
  const editorRef = useRef<HTMLDivElement>(null)

  // State cho instructor info
  const [instructorInfo, setInstructorInfo] = useState<InstructorInfo | null>(null)
  const [isLoadingInstructor, setIsLoadingInstructor] = useState(false)
  
  // State cho students
  const [autoLoadedStudents, setAutoLoadedStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  
  // State cho saving
  const [isSaving, setIsSaving] = useState(false)

  // Lấy thông tin instructor khi component mount
  useEffect(() => {
    const fetchInstructorInfo = async () => {
      if (!isOpen) return
      
      // Get user from localStorage (already logged in)
      const userDataStr = localStorage.getItem('user')
      if (!userDataStr) {
        console.error('⚠️ User not found in localStorage')
        alert('Vui lòng đăng nhập để tiếp tục')
        return
      }

      try {
        const userData = JSON.parse(userDataStr)
        const accountId = userData.account_id
        
        if (!accountId) {
          console.error('⚠️ account_id not found in user data:', userData)
          alert('Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.')
          return
        }

        console.log('🔍 Fetching instructor info for account_id:', accountId)
        setIsLoadingInstructor(true)
        
        const info = await getInstructorInfo(accountId)
        setInstructorInfo(info)
        console.log('✅ Instructor info loaded from database:', info)
        
      } catch (error) {
        console.error('❌ Error fetching instructor info:', error)
        alert('Không thể tải thông tin giảng viên. Vui lòng kiểm tra kết nối.')
      } finally {
        setIsLoadingInstructor(false)
      }
    }

    fetchInstructorInfo()
  }, [isOpen])

  // Lấy danh sách sinh viên khi có đủ thông tin
  useEffect(() => {
    const fetchStudents = async () => {
      if (!isOpen || !instructorInfo || !date || !timeSlot.startTime || !timeSlot.endTime) return
      
      setIsLoadingStudents(true)
      try {
        console.log('🔍 Fetching students with:', {
          instructor_id: instructorInfo.instructor_id,
          date,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime
        })
        
        const data = await getStudentsByTimeSlot(
          instructorInfo.instructor_id,
          date, // format: YYYY-MM-DD
          timeSlot.startTime, // format: HH:mm (e.g., "09:00")
          timeSlot.endTime // format: HH:mm (e.g., "10:00")
        )
        
        // Map sang định dạng Student để tương thích với component
        const students: Student[] = data.students.map(s => ({
          id: s.id.toString(),
          studentCode: s.student_code,
          name: s.name,
          className: s.class_name,
          email: s.email,
        }))
        
        setAutoLoadedStudents(students)
        console.log('✅ Auto-loaded students from API:', students)
        
        if (students.length === 0) {
          console.log('⚠️ No students found for this time slot')
        }
      } catch (error) {
        console.error('❌ Error fetching students:', error)
        setAutoLoadedStudents([])
      } finally {
        setIsLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [isOpen, instructorInfo, date, timeSlot.startTime, timeSlot.endTime])

  // Sử dụng selectedStudents từ props nếu có, nếu không dùng autoLoadedStudents
  const displayStudents = selectedStudents.length > 0 ? selectedStudents : autoLoadedStudents

  // Tự động lấy danh sách lớp từ sinh viên đã CHỌN (không phải auto-load)
  // Chỉ hiển thị lớp khi giảng viên đã pick từ StudentSelectionModal
  const getClassGroups = () => {
    // CHỈ lấy từ selectedStudents (đã pick), KHÔNG lấy từ autoLoadedStudents
    if (selectedStudents.length === 0) return []
    
    // Group students by class
    const classMap = new Map<string, number>()
    selectedStudents.forEach(student => {
      const className = student.className
      classMap.set(className, (classMap.get(className) || 0) + 1)
    })
    
    // Convert to array and sort by student count descending
    return Array.from(classMap.entries()).map(([className, count]) => ({
      className,
      count
    })).sort((a, b) => b.count - a.count)
  }

  const classGroups = getClassGroups()

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFontFamily(value)
    formatText("fontName", value)
  }

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setFontSize(value)
    formatText("fontSize", value)
  }

  const insertTable = () => {
    const rows = prompt("Số hàng:", "3")
    const cols = prompt("Số cột:", "3")

    if (rows && cols) {
      let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #000;">'
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += "<tr>"
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="border: 1px solid #000; padding: 8px; min-width: 50px;"> </td>'
        }
        tableHTML += "</tr>"
      }
      tableHTML += "</table>"

      formatText("insertHTML", tableHTML)
    }
  }

  const insertImage = () => {
    const url = prompt("Nhập URL hình ảnh:")
    if (url) {
      formatText("insertImage", url)
    }
  }

  const saveDocument = async () => {
    if (!instructorInfo) {
      alert('Chưa có thông tin giảng viên. Vui lòng thử lại.')
      return
    }

    const content = editorRef.current?.innerHTML
    if (!content) {
      alert('Nội dung nhật ký không được để trống')
      return
    }

    setIsSaving(true)
    try {
      await createMeetingLog({
        instructor_id: instructorInfo.instructor_id,
        date: date, // format: YYYY-MM-DD
        start_time: timeSlot.startTime, // format: HH:mm
        end_time: timeSlot.endTime, // format: HH:mm
        content: content,
        student_ids: displayStudents.map(s => parseInt(s.id)),
        location: '', // Có thể lấy từ form nếu cần
      })
      
      alert('Đã lưu nhật ký thành công!')
    } catch (error) {
      console.error('Error saving meeting log:', error)
      alert('Lỗi khi lưu nhật ký. Vui lòng thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  const saveAndClose = () => {
    saveDocument()
    setTimeout(() => {
      onClose()
    }, 500)
  }

  const printDocument = () => {
    const content = editorRef.current?.innerHTML
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Nhật ký cố vấn học tập - ${timeSlot.startTime} - ${timeSlot.endTime}</title>
            <style>
              body { font-family: 'Times New Roman', serif; margin: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportToPDF = () => {
    alert("Tính năng xuất PDF sẽ được triển khai trong phiên bản tiếp theo.")
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b":
            e.preventDefault()
            formatText("bold")
            break
          case "i":
            e.preventDefault()
            formatText("italic")
            break
          case "u":
            e.preventDefault()
            formatText("underline")
            break
          case "s":
            e.preventDefault()
            saveDocument()
            break
        }
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-none h-[95vh] p-0 flex flex-col gap-0">
        {/* Editor Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Nhật ký cố vấn học tập, họp lớp
              </h3>
              <p className="text-sm text-gray-600">
                Khung giờ: {timeSlot.startTime} - {timeSlot.endTime} - {weekday}, {date}
              </p>
              {isLoadingInstructor && (
                <p className="text-xs text-blue-600 mt-1">
                  Đang tải thông tin giảng viên từ database...
                </p>
              )}
              {!isLoadingInstructor && !instructorInfo && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Không thể tải thông tin giảng viên. Vui lòng kiểm tra kết nối.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onSelectStudents}
              className="bg-green-600 hover:bg-green-700 !text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Chọn sinh viên
            </Button>
            <Button
              onClick={saveDocument}
              className="bg-blue-600 hover:bg-blue-700 !text-white"
              disabled={isSaving || isLoadingInstructor}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Font and Size */}
            <select
              value={fontFamily}
              onChange={handleFontChange}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Calibri">Calibri</option>
              <option value="Helvetica">Helvetica</option>
            </select>

            <select
              value={fontSize}
              onChange={handleFontSizeChange}
              className="px-4 py-2 border border-gray-300 rounded text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="15">15</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="20">20</option>
              <option value="24">24</option>
            </select>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Text Formatting */}
            <button
              onClick={() => formatText("bold")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Bold"
            >
              <Bold className="w-5 h-5" />
            </button>
            <button
              onClick={() => formatText("italic")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Italic"
            >
              <Italic className="w-5 h-5" />
            </button>
            <button
              onClick={() => formatText("underline")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Underline"
            >
              <Underline className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Alignment */}
            <button
              onClick={() => formatText("justifyLeft")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Align Left"
            >
              <AlignLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => formatText("justifyCenter")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Align Center"
            >
              <AlignCenter className="w-5 h-5" />
            </button>
            <button
              onClick={() => formatText("justifyRight")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Align Right"
            >
              <AlignRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => formatText("justifyFull")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Justify"
            >
              <AlignJustify className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Lists */}
            <button
              onClick={() => formatText("insertUnorderedList")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Bullet List"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => formatText("insertOrderedList")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Table & Image */}
            <button
              onClick={insertTable}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Insert Table"
            >
              <Table className="w-5 h-5" />
            </button>
            <button
              onClick={insertImage}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Insert Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Undo/Redo */}
            <button
              onClick={() => formatText("undo")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Undo"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={() => formatText("redo")}
              className="p-2.5 hover:bg-gray-100 rounded transition-colors"
              title="Redo"
            >
              <Redo className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-8 bg-gray-50">
            <div className="max-w-[1600px] mx-auto bg-white shadow-sm min-h-full">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="p-12 min-h-full focus:outline-none"
                style={{
                  fontFamily: "Times New Roman",
                  fontSize: "15px",
                  lineHeight: "1.8"
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                  <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>
                    BỘ GIÁO DỤC VÀ ĐÀO TẠO
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>
                    ĐẠI HỌC DUY TÂN
                  </p>
                  <p style={{ fontSize: "14px", marginBottom: "20px" }}>───────────</p>

                  <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "5px" }}>
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "20px" }}>
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  <p style={{ fontSize: "14px", marginBottom: "30px" }}>───────────</p>

                  <h1 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
                    NHẬT KÝ CÓ VẤN HỌC TẬP, HỌP LỚP
                  </h1>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <p>
                    <strong>Họ và tên người thực hiện:</strong>{' '}
                    {isLoadingInstructor 
                      ? 'Đang tải...' 
                      : instructorInfo?.full_name || '_______________'}
                  </p>
                  <p>
                    <strong>Khoa:</strong>{' '}
                    {isLoadingInstructor 
                      ? 'Đang tải...'
                      : instructorInfo?.department.name || '_______________'}
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <p>
                    <strong>Trường:</strong> Đại học Duy Tân
                  </p>
                  <p>
                    <strong>Bộ môn:</strong>{' '}
                    {isLoadingInstructor
                      ? 'Đang tải...'
                      : instructorInfo?.position || '_______________'}
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      border: "1px solid #000"
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            textAlign: "center",
                            fontWeight: "bold"
                          }}
                        >
                          TT
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            textAlign: "center",
                            fontWeight: "bold"
                          }}
                        >
                          Tên Sinh viên/Phụ huynh
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            textAlign: "center",
                            fontWeight: "bold"
                          }}
                        >
                          Số lượng Sinh viên/Phụ huynh
                        </th>
                        <th
                          style={{
                            border: "1px solid #000",
                            padding: "8px",
                            textAlign: "center",
                            fontWeight: "bold"
                          }}
                        >
                          Thời gian: từ {timeSlot.startTime}h đến {timeSlot.endTime}h ngày {date}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {classGroups.length > 0 ? (
                        classGroups.map((group, index) => (
                          <tr key={group.className}>
                            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                              {index + 1}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "8px" }}>
                              {group.className}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                              {group.count}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                          </tr>
                        ))
                      ) : (
                        // Hiển thị dòng mặc định nếu chưa có sinh viên
                        <>
                          <tr>
                            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                              1
                            </td>
                            <td style={{ border: "1px solid #000", padding: "8px" }}>
                              {isLoadingStudents ? 'Đang tải...' : '_______________'}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                              {isLoadingStudents ? '...' : '0'}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                          </tr>
                          {[2, 3, 4, 5].map((num) => (
                            <tr key={num}>
                              <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                                {num}
                              </td>
                              <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                              <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}></td>
                              <td style={{ border: "1px solid #000", padding: "8px" }}></td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <p>
                    <strong>Địa điểm:</strong> _______________________________________________
                  </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <p>
                    <strong>Danh sách sinh viên tham gia:</strong>
                  </p>
                  <div style={{ marginLeft: "20px", marginTop: "10px" }}>
                    {isLoadingStudents ? (
                      <p style={{ fontStyle: "italic", color: "#666" }}>
                        Đang tải danh sách sinh viên...
                      </p>
                    ) : displayStudents.length === 0 ? (
                      <p style={{ fontStyle: "italic", color: "#666" }}>
                        Chưa có sinh viên nào đặt lịch cho khung giờ này.
                      </p>
                    ) : (
                      <ol style={{ marginLeft: "20px" }}>
                        {displayStudents.map((student) => (
                          <li key={student.id} style={{ marginBottom: "5px" }}>
                            {student.name} - MSSV: {student.studentCode} - Lớp {student.className}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <p>
                    <strong>Đại diện SV ký và ghi họ tên:</strong>
                  </p>
                  <div style={{ marginTop: "15px" }}>
                    <p>1. _______________________________________________</p>
                    <p>2. _______________________________________________</p>
                    <p>3. _______________________________________________</p>
                    <p>4. _______________________________________________</p>
                    <p>5. _______________________________________________</p>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <p>
                    <strong>Nội dung cuộc họp:</strong>
                  </p>
                  <div
                    style={{
                      marginTop: "10px",
                      minHeight: "200px",
                      border: "1px solid #ccc",
                      padding: "10px"
                    }}
                  >
                    <p>Ghi chú nội dung cuộc họp tại đây...</p>
                  </div>
                </div>

                <div style={{ marginTop: "40px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ width: "50%", textAlign: "center", padding: "20px" }}>
                          <p>
                            <strong>BAN PHÁP CHẾ VÀ KIỂM TRA NỘI BỘ</strong>
                          </p>
                          <p style={{ marginTop: "60px", fontStyle: "italic" }}>
                            (Ký, ghi rõ họ & tên)
                          </p>
                          <p style={{ marginTop: "10px" }}>_______________</p>
                        </td>
                        <td style={{ width: "50%", textAlign: "center", padding: "20px" }}>
                          <p>
                            <strong>NGƯỜI THỰC HIỆN</strong>
                          </p>
                          <p style={{ marginTop: "60px", fontStyle: "italic" }}>
                            (Ký, ghi rõ họ & tên)
                          </p>
                          <p style={{ marginTop: "10px" }}>
                            {instructorInfo?.full_name || '_______________'}
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">
              Tự động lưu: <span className="text-green-600">Đã lưu</span>
            </span>
            <button
              onClick={printDocument}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 font-medium"
            >
              <Printer className="w-4 h-4" />
              In tài liệu
            </button>
            <button
              onClick={exportToPDF}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 font-medium"
            >
              <Download className="w-4 h-4" />
              Xuất PDF
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="outline" disabled={isSaving} className="!text-gray-700">
              Đóng
            </Button>
            <Button 
              onClick={saveAndClose} 
              className="bg-blue-600 hover:bg-blue-700 !text-white"
              disabled={isSaving || isLoadingInstructor}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu & Đóng'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
