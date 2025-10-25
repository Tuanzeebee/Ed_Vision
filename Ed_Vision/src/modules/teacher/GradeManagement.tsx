import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import TeacherLayout from "./components/TeacherLayout"
import {
    Download,
    Upload,
    FileText,
    Plus,
    Eye,
    Save,
    RotateCcw,
    X,
    Check,
    Edit3,
    Trash2,
    Users,
    Target,
    Award,
    Brain,
    Clock,
    Heart,
    DollarSign,
    Sparkles,
    ClipboardList,
    TrendingUp,
    AlertTriangle
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
}

interface PredictionData {
    workTime: number // thời gian đi làm (giờ/tuần)
    mentalSupport: number // mức hỗ trợ tinh thần (1-10)
    financialSupport: number // mức hỗ trợ tài chính (1-10)
}

interface StudentPrediction {
    studentId: string
    currentAverage: number
    predictedGrade: number
    recommendation: string
    riskLevel: 'low' | 'medium' | 'high'
}

export default function GradeManagement() {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedDepartment, setSelectedDepartment] = useState("")
    const [selectedCourse, setSelectedCourse] = useState("")
    const [selectedSubject, setSelectedSubject] = useState("")
    const [selectedClass, setSelectedClass] = useState("")

    // Grade table states
    const [showGradeTable, setShowGradeTable] = useState(false)
    const [showTablePreview, setShowTablePreview] = useState(false)
    const [gradeColumns, setGradeColumns] = useState<GradeColumn[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [isSpinning, setIsSpinning] = useState(false)
    const [showColumnForm, setShowColumnForm] = useState(false)
    const [classListLoaded, setClassListLoaded] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // Prediction states
    const [showPredictionForm, setShowPredictionForm] = useState(false)
    const [showPredictionResults, setShowPredictionResults] = useState(false)
    const [predictionData, setPredictionData] = useState<PredictionData>({
        workTime: 0,
        mentalSupport: 5,
        financialSupport: 5
    })
    const [predictions, setPredictions] = useState<StudentPrediction[]>([])

    const [newColumn, setNewColumn] = useState({
        name: "",
        maxScore: 10,
        weight: 0
    })

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

    const handleViewTable = () => {
        if (gradeColumns.length === 0) {
            showNotification('error', 'Chưa có cột điểm nào để xem!')
            return
        }

        if (!classListLoaded) {
            generateSampleStudents()
            setClassListLoaded(true)
        }

        setShowTablePreview(true)
        showNotification('success', 'Đang hiển thị xem trước bảng điểm!')
    }

    const handleSaveTemplate = () => {
        if (gradeColumns.length === 0) {
            showNotification('error', 'Chưa có cấu trúc bảng điểm để lưu!')
            return
        }

        const template = {
            name: `Template_${selectedSubject}_${Date.now()}`,
            columns: gradeColumns,
            createdAt: new Date().toISOString()
        }

        localStorage.setItem('gradeTemplate', JSON.stringify(template))
        showNotification('success', 'Lưu mẫu bảng điểm thành công!')
    }

    const handleReset = () => {
        setGradeColumns([])
        setShowGradeTable(false)
        setShowTablePreview(false)
        setStudents([])
        setClassListLoaded(false)
        setSelectedFile(null)
        showNotification('info', 'Đã đặt lại toàn bộ cấu trúc bảng điểm!')
    }

    // Prediction handlers
    const handleShowPrediction = () => {
        if (gradeColumns.length === 0) {
            showNotification('error', 'Vui lòng tạo cấu trúc bảng điểm trước!')
            return
        }
        if (students.length === 0) {
            showNotification('error', 'Vui lòng tải danh sách lớp trước!')
            return
        }

        setShowPredictionForm(true)
    }

    const handleRunPrediction = () => {
        // Tính toán dự đoán cho từng sinh viên
        const newPredictions: StudentPrediction[] = students.map(student => {
            const currentAverage = calculateTotalScore(student)

            // Thuật toán dự đoán đơn giản dựa trên các yếu tố
            let predictedGrade = currentAverage

            // Ảnh hưởng của thời gian làm việc (càng nhiều thì điểm càng giảm)
            const workImpact = predictionData.workTime > 20 ? -0.5 : predictionData.workTime > 10 ? -0.2 : 0

            // Ảnh hưởng của hỗ trợ tinh thần (càng cao thì điểm càng tăng)
            const mentalImpact = (predictionData.mentalSupport - 5) * 0.1

            // Ảnh hưởng của hỗ trợ tài chính (càng cao thì điểm càng tăng)
            const financialImpact = (predictionData.financialSupport - 5) * 0.15

            predictedGrade += workImpact + mentalImpact + financialImpact

            // Đảm bảo điểm trong khoảng 0-10
            predictedGrade = Math.max(0, Math.min(10, predictedGrade))

            // Xác định mức độ rủi ro và đề xuất
            let riskLevel: 'low' | 'medium' | 'high' = 'low'
            let recommendation = ''

            if (predictedGrade < 4) {
                riskLevel = 'high'
                recommendation = 'Cần hỗ trợ khẩn cấp về học tập và tài chính'
            } else if (predictedGrade < 6.5) {
                riskLevel = 'medium'
                recommendation = 'Cần tăng cường hỗ trợ tinh thần và giảm thời gian làm việc'
            } else {
                riskLevel = 'low'
                recommendation = 'Duy trì hiện trạng, có thể tăng thêm thử thách'
            }

            return {
                studentId: student.studentId,
                currentAverage,
                predictedGrade: Math.round(predictedGrade * 100) / 100,
                recommendation,
                riskLevel
            }
        })

        setPredictions(newPredictions)
        setShowPredictionForm(false)
        setShowPredictionResults(true)
        showNotification('success', 'Dự đoán hoàn thành cho tất cả sinh viên!')
    }

    const handleClosePrediction = () => {
        setShowPredictionForm(false)
        setShowPredictionResults(false)
    }

    const handleAddColumn = () => {
        setIsSpinning(true)

        setTimeout(() => {
            setIsSpinning(false)
            setShowGradeTable(true)
        }, 600)
    }

    const handleAddNewColumn = () => {
        console.log('Nút Thêm cột được nhấn!')
        console.log('showColumnForm trước khi set:', showColumnForm)
        setShowColumnForm(true)
        console.log('Đã set showColumnForm = true')
    }

    const handleSaveColumn = () => {
        if (newColumn.name.trim()) {
            const column: GradeColumn = {
                id: Date.now().toString(),
                name: newColumn.name,
                maxScore: newColumn.maxScore,
                weight: newColumn.weight
            }
            setGradeColumns([...gradeColumns, column])
            setNewColumn({ name: "", maxScore: 10, weight: 0 })
            setShowColumnForm(false)
            showNotification('success', `Đã thêm cột "${column.name}" thành công!`)
        } else {
            showNotification('error', 'Vui lòng nhập tên cột!')
        }
    }

    const handleDeleteColumn = (columnId: string) => {
        const columnName = gradeColumns.find(col => col.id === columnId)?.name
        setGradeColumns(gradeColumns.filter(col => col.id !== columnId))
        showNotification('success', `Đã xóa cột "${columnName}" thành công!`)
    }

    const handleCancelColumnForm = () => {
        setShowColumnForm(false)
        setNewColumn({ name: "", maxScore: 10, weight: 0 })
    }

    const handleGradeChange = (studentId: string, columnId: string, value: string) => {
        const numValue = parseFloat(value) || 0
        setStudents(prev => prev.map(student =>
            student.id === studentId
                ? { ...student, grades: { ...student.grades, [columnId]: numValue } }
                : student
        ))
    }

    const calculateTotalScore = (student: Student) => {
        const totalWeight = gradeColumns.reduce((sum, col) => sum + col.weight, 0)
        if (totalWeight === 0) return 0

        const weightedSum = gradeColumns.reduce((sum, col) => {
            const grade = student.grades[col.id] || 0
            const normalizedGrade = (grade / col.maxScore) * 10 // Normalize to 10-point scale
            return sum + (normalizedGrade * col.weight / 100)
        }, 0)

        return Math.round(weightedSum * 100) / 100
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
                        {notification.type === 'info' && <Target className="w-5 h-5" />}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quản Lý Điểm</h2>
                <p className="text-gray-600">Tạo bảng điểm tùy chỉnh và upload dữ liệu từ Excel</p>
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

            {/* Grade Structure Design */}
            <Card className="border border-gray-100 rounded-xl min-h-[600px]">
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Thiết kế cấu trúc bảng điểm</h3>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleViewTable}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                            >
                                <Eye className="w-4 h-4" />
                                <span>Xem bảng</span>
                            </button>
                            {gradeColumns.length > 0 && classListLoaded && (
                                <button
                                    onClick={handleShowPrediction}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                                >
                                    <Brain className="w-4 h-4" />
                                    <span>Dự đoán</span>
                                </button>
                            )}
                            <button
                                onClick={handleSaveTemplate}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>Lưu mẫu</span>
                            </button>
                            <button
                                onClick={handleReset}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Đặt lại</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Empty State, Grade Structure or Full Table */}
                {!showGradeTable && gradeColumns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                                <ClipboardList className="w-10 h-10 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-gray-700 mb-3">Chưa có cấu trúc bảng điểm</h4>
                                <p className="text-gray-500 text-center max-w-md text-lg leading-relaxed">
                                    Bắt đầu thiết kế bảng điểm bằng cách thêm các cột điểm theo
                                    <br />
                                    nhu cầu môn học của bạn
                                </p>
                            </div>
                            <button
                                onClick={handleAddColumn}
                                className={`bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-600 transform hover:scale-105 mx-auto ${isSpinning ? 'animate-spin' : ''
                                    }`}
                            >
                                <Plus className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                ) : showGradeTable && !showTablePreview ? (
                    <div className="p-6">
                        {/* Column Creation Interface */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                                    <Target className="w-5 h-5 text-blue-600" />
                                    <span>Thiết kế cấu trúc cột điểm</span>
                                </h4>
                                <div className="flex items-center space-x-3">

                                    <button
                                        onClick={handleAddNewColumn}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all hover:shadow-md transform hover:scale-105"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Thêm cột</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {gradeColumns.map((column, index) => (
                                    <div key={column.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all relative group">
                                        <div className="flex flex-col space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                                                    </div>
                                                    <h5 className="font-semibold text-gray-800">{column.name}</h5>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteColumn(column.id)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600">
                                                    <span className="flex items-center space-x-1">
                                                        <Target className="w-3 h-3" />
                                                        <span>Max: <strong>{column.maxScore}</strong></span>
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <span className="flex items-center space-x-1">
                                                        <Award className="w-3 h-3" />
                                                        <span><strong>{column.weight}%</strong></span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {gradeColumns.length === 0 && (
                                <div className="text-center text-gray-500 py-12">
                                    <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <h5 className="text-lg font-medium text-gray-600 mb-2">Chưa có cột điểm nào</h5>
                                    <p className="text-gray-500">Nhấn "Thêm cột" để bắt đầu thiết kế cấu trúc bảng điểm</p>
                                </div>
                            )}

                            {gradeColumns.length > 0 && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-blue-800">
                                            <strong>Tổng số cột:</strong> {gradeColumns.length}
                                        </span>
                                        <span className="text-blue-800">
                                            <strong>Tổng trọng số:</strong> {gradeColumns.reduce((sum, col) => sum + col.weight, 0)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : showTablePreview ? (
                    <div className="p-6">
                        <div>
                            {/* Back to Structure Button */}
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowTablePreview(false)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Quay lại thiết kế</span>
                                </button>
                            </div>

                            {/* Statistics Summary */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">Tổng học sinh</p>
                                            <p className="text-2xl font-bold">{students.length}</p>
                                        </div>
                                        <Users className="w-8 h-8 text-blue-200" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">Cột điểm</p>
                                            <p className="text-2xl font-bold">{gradeColumns.length}</p>
                                        </div>
                                        <Target className="w-8 h-8 text-green-200" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-purple-100 text-sm">Tổng trọng số</p>
                                            <p className="text-2xl font-bold">{gradeColumns.reduce((sum, col) => sum + col.weight, 0)}%</p>
                                        </div>
                                        <Award className="w-8 h-8 text-purple-200" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-100 text-sm">Điểm trung bình</p>
                                            <p className="text-2xl font-bold">
                                                {students.length > 0 ?
                                                    (students.reduce((sum, student) => sum + calculateTotalScore(student), 0) / students.length).toFixed(1)
                                                    : '0.0'
                                                }
                                            </p>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-orange-200" />
                                    </div>
                                </div>
                            </div>

                            {/* Grade Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center space-x-2">
                                        <Target className="w-5 h-5 text-gray-600" />
                                        <span>Bảng điểm chi tiết - {selectedClass}</span>
                                    </h4>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">STT</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Mã SV</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Họ và tên</th>

                                                {gradeColumns.map((column) => (
                                                    <th key={column.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-semibold">{column.name}</span>
                                                            <span className="text-gray-400 text-xs">
                                                                Max: {column.maxScore} | {column.weight}%
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}

                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                                    Tổng điểm
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {students.map((student, index) => (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{index + 1}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.studentId}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>

                                                    {gradeColumns.map((column) => (
                                                        <td key={column.id} className="px-4 py-3 text-center">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={column.maxScore}
                                                                step="0.1"
                                                                value={student.grades[column.id] || ''}
                                                                onChange={(e) => handleGradeChange(student.id, column.id, e.target.value)}
                                                                placeholder="0"
                                                                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </td>
                                                    ))}

                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {calculateTotalScore(student).toFixed(1)}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center space-x-1">
                                                            <button className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button className="text-green-600 hover:text-green-800 p-1 rounded transition-colors">
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button className="text-red-600 hover:text-red-800 p-1 rounded transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}

                                            {students.length === 0 && (
                                                <tr>
                                                    <td colSpan={5 + gradeColumns.length} className="px-4 py-12 text-center">
                                                        <div className="flex flex-col items-center space-y-3">
                                                            <Users className="w-12 h-12 text-gray-300" />
                                                            <p className="text-gray-500 text-lg">Chưa có dữ liệu sinh viên</p>
                                                            <p className="text-gray-400 text-sm">Vui lòng tải danh sách lớp để bắt đầu</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Column Form Modal - Moved outside conditional rendering */}
                {showColumnForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-[90vw] transform transition-all animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                                    <Plus className="w-5 h-5 text-blue-500" />
                                    <span>Thêm cột điểm mới</span>
                                </h3>
                                <button
                                    onClick={handleCancelColumnForm}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên cột điểm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newColumn.name}
                                        onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                                        placeholder="Ví dụ: Điểm giữa kỳ, Điểm thực hành..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Điểm tối đa
                                        </label>
                                        <input
                                            type="number"
                                            value={newColumn.maxScore}
                                            onChange={(e) => setNewColumn({ ...newColumn, maxScore: Number(e.target.value) })}
                                            min="1"
                                            max="100"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trọng số (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={newColumn.weight}
                                            onChange={(e) => setNewColumn({ ...newColumn, weight: Number(e.target.value) })}
                                            min="0"
                                            max="100"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">
                                        <strong>Tổng trọng số hiện tại:</strong> {gradeColumns.reduce((sum, col) => sum + col.weight, 0) + newColumn.weight}%
                                    </p>
                                    {gradeColumns.reduce((sum, col) => sum + col.weight, 0) + newColumn.weight > 100 && (
                                        <p className="text-red-500 text-sm flex items-center space-x-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Tổng trọng số vượt quá 100%</span>
                                        </p>
                                    )}
                                    {gradeColumns.reduce((sum, col) => sum + col.weight, 0) + newColumn.weight === 100 && (
                                        <p className="text-green-500 text-sm flex items-center space-x-1">
                                            <Check className="w-4 h-4" />
                                            <span>Tổng trọng số đạt 100% - Hoàn hảo!</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-8">
                                <button
                                    onClick={handleCancelColumnForm}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveColumn}
                                    disabled={!newColumn.name.trim()}
                                    className={`flex-1 px-4 py-3 rounded-lg transition-colors ${newColumn.name.trim()
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    Thêm cột
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prediction Form Modal */}
                {showPredictionForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] max-w-[90vw] transform transition-all animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                                    <Brain className="w-5 h-5 text-purple-500" />
                                    <span>Cài đặt dự đoán</span>
                                </h3>
                                <button
                                    onClick={handleClosePrediction}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                                    <p className="text-sm text-purple-800 mb-2 font-medium">
                                        <Sparkles className="w-4 h-4 inline mr-1" />
                                        Hệ thống dự đoán kết quả học tập
                                    </p>
                                    <p className="text-xs text-purple-600">
                                        Dựa trên điểm số hiện tại và các yếu tố hỗ trợ để dự đoán kết quả cuối kỳ
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span>Thời gian làm việc trung bình (giờ/tuần)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={predictionData.workTime}
                                            onChange={(e) => setPredictionData({ ...predictionData, workTime: Number(e.target.value) })}
                                            min="0"
                                            max="60"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">giờ</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Nhiều giờ làm việc có thể ảnh hưởng tiêu cực đến học tập</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <Heart className="w-4 h-4 text-red-500" />
                                        <span>Mức hỗ trợ tinh thần (1-10)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            value={predictionData.mentalSupport}
                                            onChange={(e) => setPredictionData({ ...predictionData, mentalSupport: Number(e.target.value) })}
                                            min="1"
                                            max="10"
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Thấp</span>
                                            <span className="font-medium text-red-600">{predictionData.mentalSupport}</span>
                                            <span>Cao</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Hỗ trợ từ gia đình, bạn bè, tư vấn tâm lý</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                                        <DollarSign className="w-4 h-4 text-green-500" />
                                        <span>Mức hỗ trợ tài chính (1-10)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            value={predictionData.financialSupport}
                                            onChange={(e) => setPredictionData({ ...predictionData, financialSupport: Number(e.target.value) })}
                                            min="1"
                                            max="10"
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Thấp</span>
                                            <span className="font-medium text-green-600">{predictionData.financialSupport}</span>
                                            <span>Cao</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Học bổng, hỗ trợ từ gia đình, thu nhập</p>
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-8">
                                <button
                                    onClick={handleClosePrediction}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRunPrediction}
                                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <Brain className="w-4 h-4" />
                                    <span>Chạy dự đoán</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prediction Results Modal */}
                {showPredictionResults && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto transform transition-all animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    <span>Kết quả dự đoán học tập</span>
                                </h3>
                                <button
                                    onClick={handleClosePrediction}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Summary Statistics */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">Rủi ro thấp</p>
                                            <p className="text-2xl font-bold">
                                                {predictions.filter(p => p.riskLevel === 'low').length}
                                            </p>
                                        </div>
                                        <Check className="w-8 h-8 text-green-200" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-yellow-100 text-sm">Rủi ro trung bình</p>
                                            <p className="text-2xl font-bold">
                                                {predictions.filter(p => p.riskLevel === 'medium').length}
                                            </p>
                                        </div>
                                        <AlertTriangle className="w-8 h-8 text-yellow-200" />
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-red-100 text-sm">Rủi ro cao</p>
                                            <p className="text-2xl font-bold">
                                                {predictions.filter(p => p.riskLevel === 'high').length}
                                            </p>
                                        </div>
                                        <X className="w-8 h-8 text-red-200" />
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Results Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-4">
                                    <h4 className="font-semibold text-gray-800">Chi tiết dự đoán từng sinh viên</h4>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã SV</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm hiện tại</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Dự đoán</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Mức rủi ro</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đề xuất</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {predictions.map((prediction) => {
                                                const student = students.find(s => s.studentId === prediction.studentId)
                                                return (
                                                    <tr key={prediction.studentId} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{prediction.studentId}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{student?.name}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {prediction.currentAverage.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prediction.predictedGrade >= 8 ? 'bg-green-100 text-green-800' :
                                                                prediction.predictedGrade >= 6.5 ? 'bg-yellow-100 text-yellow-800' :
                                                                    prediction.predictedGrade >= 4 ? 'bg-orange-100 text-orange-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}>
                                                                {prediction.predictedGrade.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prediction.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                                                prediction.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                {prediction.riskLevel === 'low' ? 'Thấp' :
                                                                    prediction.riskLevel === 'medium' ? 'Trung bình' : 'Cao'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                                            {prediction.recommendation}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={handleClosePrediction}
                                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </TeacherLayout>
    )
}