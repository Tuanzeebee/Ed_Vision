import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import predictionService from "@/services/predictionService"
import {
    Download,
    Upload,
    FileText,
    X,
    Check,
    Loader2,
    RefreshCcw
} from "lucide-react"

// Types
interface GradeColumn {
    id: string
    name: string
    maxScore: number
    weight: number
}

interface Student {
    id: string
    studentId: string
    name: string
    grades: { [key: string]: number }
    // MongoDB data fields
    weekly_study_hours_by_course?: number | null
    part_time_hours_by_course?: number | null
    financial_support_by_course?: number | null
    emotional_support_by_course?: number | null
    final_pred?: number | null
    confidence?: 'high' | 'medium' | 'low' | null
}

export default function GradeManagement() {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedDepartment, setSelectedDepartment] = useState("")
    const [selectedCourse, setSelectedCourse] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("")
    const [selectedClass, setSelectedClass] = useState("")

    // Grade table states
    const [gradeColumns, setGradeColumns] = useState<GradeColumn[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [classListLoaded, setClassListLoaded] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // MongoDB data states
    const [uploadHistory, setUploadHistory] = useState<any[]>([])
    const [selectedUploadId, setSelectedUploadId] = useState<string>('')
    const [loadingData, setLoadingData] = useState(false)
    const [mongoDataLoaded, setMongoDataLoaded] = useState(false)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [studentsPerPage] = useState(10)

    // Notification state
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info'
        message: string
        show: boolean
    }>({
        type: 'info',
        message: '',
        show: false
    })

    // Load upload history on mount
    useEffect(() => {
        loadUploadHistory()
    }, [])

    // Load upload history from MongoDB
    const loadUploadHistory = useCallback(async () => {
        try {
            const response = await predictionService.getUploadList()
            if (response.success && response.data) {
                setUploadHistory(response.data)
            }
        } catch (error) {
            console.error('Failed to load upload history:', error)
        }
    }, [])

    // Load students from MongoDB by upload_id
    const loadStudentsFromMongo = useCallback(async (uploadId: string) => {
        setLoadingData(true)
        setCurrentPage(1) // Reset to first page when loading new data
        try {
            const response = await predictionService.getStudentsByUploadId(uploadId)
            
            if (response.success && response.data) {
                // Map MongoDB data to Student interface asynchronously
                const mappedStudents: Student[] = await Promise.all(
                    response.data.students.map(async (student: any, index: number) => ({
                        id: student.student_id || `student-${index}`,
                        studentId: student.student_id,
                        name: student.student_name || `Sinh viên ${index + 1}`,
                        grades: student.grades || {},
                        weekly_study_hours_by_course: student.weekly_study_hours_by_course,
                        part_time_hours_by_course: student.part_time_hours_by_course,
                        financial_support_by_course: student.financial_support_by_course,
                        emotional_support_by_course: student.emotional_support_by_course,
                        final_pred: student.final_pred,
                        confidence: student.confidence
                    }))
                )

                setStudents(mappedStudents)
                setSelectedUploadId(uploadId)
                setMongoDataLoaded(true)
                setClassListLoaded(true)
                
                // Auto-detect grade columns from first student
                if (mappedStudents.length > 0) {
                    const firstStudent = mappedStudents[0]
                    const detectedColumns = Object.keys(firstStudent.grades).map((key) => ({
                        id: key,
                        name: key.charAt(0).toUpperCase() + key.slice(1),
                        maxScore: 10,
                        weight: 100 / Object.keys(firstStudent.grades).length
                    }))
                    setGradeColumns(detectedColumns)
                }

                showNotification('success', `Đã tải ${mappedStudents.length} sinh viên từ MongoDB`)
            }
        } catch (error: any) {
            showNotification('error', 'Không thể tải dữ liệu từ MongoDB')
        } finally {
            setLoadingData(false)
        }
    }, [])

    // Pagination calculations with useMemo
    const { currentStudents, totalPages, indexOfFirstStudent, indexOfLastStudent } = useMemo(() => {
        const indexOfLast = currentPage * studentsPerPage
        const indexOfFirst = indexOfLast - studentsPerPage
        const current = students.slice(indexOfFirst, indexOfLast)
        const total = Math.ceil(students.length / studentsPerPage)
        
        return {
            currentStudents: current,
            totalPages: total,
            indexOfFirstStudent: indexOfFirst,
            indexOfLastStudent: indexOfLast
        }
    }, [students, currentPage, studentsPerPage])

    const handlePageChange = useCallback((pageNumber: number) => {
        setCurrentPage(pageNumber)
    }, [])

    // Utility functions
    const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message, show: true })
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }))
        }, 3000)
    }

    const generateSampleStudents = () => {
        const sampleStudents: Student[] = [
            { id: '1', studentId: '2024001', name: 'Nguyễn Văn An', grades: {} },
            { id: '2', studentId: '2024002', name: 'Trần Thị Bình', grades: {} },
            { id: '3', studentId: '2024003', name: 'Lê Văn Cường', grades: {} },
            { id: '4', studentId: '2024004', name: 'Phạm Thị Dung', grades: {} },
            { id: '5', studentId: '2024005', name: 'Hoàng Văn Em', grades: {} },
            { id: '6', studentId: '2024006', name: 'Vũ Thị Giang', grades: {} },
            { id: '7', studentId: '2024007', name: 'Đặng Văn Hải', grades: {} },
            { id: '8', studentId: '2024008', name: 'Bùi Thị Linh', grades: {} },
            { id: '9', studentId: '2024009', name: 'Trương Văn Minh', grades: {} },
            { id: '10', studentId: '2024010', name: 'Phan Thị Nga', grades: {} }
        ]
        setStudents(sampleStudents)
    }

    const handleLoadClassList = () => {
        if (!selectedClass) {
            showNotification('error', 'Vui lòng chọn lớp học trước!')
            return
        }

        setClassListLoaded(true)
        generateSampleStudents()
        showNotification('success', `Đã tải danh sách lớp ${selectedClass} thành công!`)
    }

    const handleSelectExcel = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            showNotification('success', `Đã chọn file: ${file.name}`)
        }
    }

    const handleUploadGrades = () => {
        if (!selectedFile) {
            showNotification('error', 'Vui lòng chọn file Excel trước!')
            return
        }

        if (!classListLoaded) {
            showNotification('error', 'Vui lòng tải danh sách lớp trước!')
            return
        }

        // Simulate upload process
        showNotification('info', 'Đang upload điểm...')
        setTimeout(() => {
            showNotification('success', 'Upload điểm thành công!')
        }, 2000)
    }

    const handleExportExcel = () => {
        if (gradeColumns.length === 0) {
            showNotification('error', 'Chưa có cấu trúc bảng điểm để xuất!')
            return
        }

        // Generate CSV content
        const headers = ['STT', 'Mã SV', 'Họ và tên', ...gradeColumns.map(col => col.name), 'Tổng điểm']
        const csvContent = [
            headers.join(','),
            ...students.map((student, index) => [
                index + 1,
                student.studentId,
                student.name,
                ...gradeColumns.map(col => student.grades[col.id] || ''),
                ''
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `BangDiem_${selectedClass || 'Template'}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showNotification('success', 'Xuất file Excel thành công!')
    }

    const handleDownloadTemplate = () => {
        const templateHeaders = ['STT', 'Mã SV', 'Họ và tên', 'Điểm 1', 'Điểm 2', 'Điểm 3']
        const templateData = [
            templateHeaders.join(','),
            '1,SV001,Nguyễn Văn A,8.5,9.0,7.5',
            '2,SV002,Trần Thị B,7.0,8.5,8.0',
            '3,SV003,Lê Văn C,9.0,8.0,9.5'
        ].join('\n')

        const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', 'Template_BangDiem.csv')
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        showNotification('success', 'Tải template thành công!')
    }

    return (
        <TeacherLayout currentPage="grade-management">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
            />

            {/* Notification Toast */}
            {notification.show && (
                <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500 text-white' :
                    notification.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                    }`}>
                    <div className="flex items-center space-x-2">
                        {notification.type === 'success' && <Check className="w-5 h-5" />}
                        {notification.type === 'error' && <X className="w-5 h-5" />}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-6">
                <h2 className="text-3xl font-bold mb-2">Quản Lý Điểm</h2>
                <p className="text-indigo-100">Tạo bảng điểm tùy chỉnh và upload dữ liệu từ Excel</p>
            </div>

            {/* Class Information Form */}
            <Card className="mb-6 border border-gray-100 rounded-xl">
                <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin lớp học và môn học</h3>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">Ngành học</label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-5 py-2.5 text-slate-900"
                            >
                                <option value="">Chọn ngành</option>
                                <option value="cntt">Công nghệ thông tin</option>
                                <option value="dtvt">Điện tử viễn thông</option>
                                <option value="ktoan">Kế toán</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">Khóa học</label>
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-5 py-2.5 text-slate-900"
                            >
                                <option value="">Chọn khóa</option>
                                <option value="k67">Khóa 67 (2022-2026)</option>
                                <option value="k68">Khóa 68 (2023-2027)</option>
                                <option value="k69">Khóa 69 (2024-2028)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">Môn học</label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-5 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Chọn môn học</option>
                                <option value="IT3080">IT3080 - Lập trình Web (3 TC)</option>
                                <option value="IT3090">IT3090 - Cơ sở dữ liệu (3 TC)</option>
                                <option value="IT3070">IT3070 - Cấu trúc dữ liệu và giải thuật (3 TC)</option>
                                <option value="IT3060">IT3060 - Lập trình hướng đối tượng (3 TC)</option>
                                <option value="IT4100">IT4100 - Học máy (3 TC)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-700 font-medium">Lớp học</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-5 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Chọn lớp</option>
                                <option value="IT3080.1">IT3080.1 (45 sinh viên)</option>
                                <option value="IT3080.2">IT3080.2 (42 sinh viên)</option>
                                <option value="IT3080.3">IT3080.3 (38 sinh viên)</option>
                                <option value="IT3090.1">IT3090.1 (50 sinh viên)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleLoadClassList}
                                disabled={!selectedClass}
                                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${selectedClass
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <Download className="w-4 h-4" />
                                <span>Tải danh sách lớp</span>
                                {classListLoaded && <Check className="w-4 h-4 text-green-400" />}
                            </button>
                            <span className={`text-sm transition-colors ${classListLoaded ? 'text-green-600 font-medium' : 'text-gray-600'
                                }`}>
                                {classListLoaded
                                    ? `✓ Đã tải lớp ${selectedClass}`
                                    : selectedClass ? `Sẵn sàng tải lớp ${selectedClass}` : 'Chưa chọn lớp học'
                                }
                            </span>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleSelectExcel}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 relative"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Chọn file Excel</span>
                                {selectedFile && <Check className="w-4 h-4 text-green-200" />}
                            </button>

                            <button
                                onClick={handleUploadGrades}
                                disabled={!selectedFile || !classListLoaded}
                                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${selectedFile && classListLoaded
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <Upload className="w-4 h-4" />
                                <span>Upload điểm</span>
                            </button>

                            <button
                                onClick={handleExportExcel}
                                disabled={gradeColumns.length === 0}
                                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${gradeColumns.length > 0
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <Download className="w-4 h-4" />
                                <span>Xuất Excel</span>
                            </button>

                            <button
                                onClick={handleDownloadTemplate}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Tải mẫu</span>
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* MongoDB Data Section */}
            <Card className="mb-6 border border-gray-100 rounded-xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Dữ liệu từ MongoDB</h3>
                            <p className="text-sm text-gray-600">Chọn một lần upload để xem danh sách sinh viên và điểm</p>
                        </div>
                        <button
                            onClick={loadUploadHistory}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            <span>Làm mới</span>
                        </button>
                    </div>

                    {/* Upload History List */}
                    {uploadHistory.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {uploadHistory.slice(0, 6).map((upload: any) => (
                                <div
                                    key={upload._id}
                                    onClick={() => loadStudentsFromMongo(upload._id)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        selectedUploadId === upload._id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{upload.course_code}</h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(upload.upload_date).toLocaleDateString('vi-VN', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {selectedUploadId === upload._id && (
                                            <Check className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-3">
                                        <span className="text-gray-600">{upload.total_students} sinh viên</span>
                                        {upload.students_with_prediction > 0 && (
                                            <Badge className="bg-green-100 text-green-800 text-xs">
                                                {upload.students_with_prediction} đã dự đoán
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {loadingData && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                            <span className="text-gray-600">Đang tải dữ liệu...</span>
                        </div>
                    )}

                    {/* Student List from MongoDB */}
                    {mongoDataLoaded && students.length > 0 && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-bold text-gray-900">
                                    Danh sách sinh viên ({students.length})
                                </h4>
                                <div className="flex items-center space-x-3">
                                    <Badge className="bg-blue-100 text-blue-800">
                                        Đã tải từ MongoDB
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">STT</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã SV</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Họ tên</th>
                                            {gradeColumns.map(col => (
                                                <th key={col.id} className="px-4 py-3 text-left font-semibold text-gray-700">
                                                    {col.name}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái Behavior</th>
                                            {students.some(s => s.final_pred !== null) && (
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700">Dự đoán</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentStudents.map((student, index) => (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-700">{indexOfFirstStudent + index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{student.studentId}</td>
                                                <td className="px-4 py-3 text-gray-700">{student.name}</td>
                                                {gradeColumns.map(col => (
                                                    <td key={col.id} className="px-4 py-3 text-gray-700">
                                                        {student.grades[col.id] || '-'}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3">
                                                    <Badge className={
                                                        student.weekly_study_hours_by_course !== null
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }>
                                                        {student.weekly_study_hours_by_course !== null 
                                                            ? 'Đã khảo sát' 
                                                            : 'Chưa khảo sát'}
                                                    </Badge>
                                                </td>
                                                {students.some(s => s.final_pred !== null) && (
                                                    <td className="px-4 py-3">
                                                        {student.final_pred !== null && student.final_pred !== undefined ? (
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-bold text-blue-600">
                                                                    {student.final_pred.toFixed(2)}
                                                                </span>
                                                                <Badge className={
                                                                    student.confidence === 'high' ? 'bg-green-100 text-green-800' :
                                                                    student.confidence === 'medium' ? 'bg-amber-100 text-amber-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }>
                                                                    {student.confidence}
                                                                </Badge>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Hiển thị {indexOfFirstStudent + 1} - {Math.min(indexOfLastStudent, students.length)} trong tổng số {students.length} sinh viên
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 rounded-lg border transition-colors ${
                                                currentPage === 1
                                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            Trước
                                        </button>
                                        
                                        <div className="flex items-center space-x-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                                // Show first page, last page, current page, and pages around current
                                                if (
                                                    pageNum === 1 ||
                                                    pageNum === totalPages ||
                                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className={`px-3 py-1 rounded-lg transition-colors ${
                                                                currentPage === pageNum
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    )
                                                } else if (
                                                    pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return <span key={pageNum} className="px-2 text-gray-400">...</span>
                                                }
                                                return null
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`px-3 py-1 rounded-lg border transition-colors ${
                                                currentPage === totalPages
                                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            Sau
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Grade Structure Design */}
        </TeacherLayout>
    )
}