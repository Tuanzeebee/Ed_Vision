import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import TeacherLayout from "./components/TeacherLayout"
import { classManagementAPI } from "@/services/teacher/api"
import toast, { Toaster } from 'react-hot-toast'
import {
    BookOpen,
    Users,
    GraduationCap,
    AlertTriangle,
    ChevronDown,
    Calendar,
    ChevronRight,
    X,
    Mail,
    User,
    TrendingUp,
    TrendingDown,
    Search,
    ChevronLeft,
    Upload,
    CheckCircle,
    RefreshCw
} from "lucide-react"

export default function ClassManagement() {
    const [selectedClass, setSelectedClass] = useState<string | null>(null)
    const [showStudentDetail, setShowStudentDetail] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterRisk, setFilterRisk] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null)
    const [quickMessage, setQuickMessage] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState('')

    // Upload Class List states
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadClassCode, setUploadClassCode] = useState('')

    // State for API data
    const [classData, setClassData] = useState<any[]>([])
    const [studentsData, setStudentsData] = useState<any[]>([])
    const [statistics, setStatistics] = useState({
        totalClasses: 0,
        totalStudents: 0,
        activeClasses: 0,
        totalAtRisk: 0
    })
    const [loading, setLoading] = useState(false)

    // Fetch classes on mount
    useEffect(() => {
        fetchClasses()
        fetchStatistics()
    }, [])

    // Fetch students when class is selected
    useEffect(() => {
        if (selectedClass) {
            fetchStudents(selectedClass)
        }
    }, [selectedClass])

    const fetchClasses = async () => {
        try {
            setLoading(true)
            const data = await classManagementAPI.getClasses()
            setClassData(data)
        } catch (error) {
            console.error('Error fetching classes:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchStatistics = async () => {
        try {
            const data = await classManagementAPI.getStatistics()
            setStatistics(data)
        } catch (error) {
            console.error('Error fetching statistics:', error)
        }
    }

    const fetchStudents = async (classCode: string) => {
        try {
            setLoading(true)
            const data = await classManagementAPI.getStudentsByClass(classCode)
            setStudentsData(data)
        } catch (error) {
            console.error('Error fetching students:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        try {
            setLoading(true)
            console.log('🔄 Refreshing data...')
            
            // Clear cache
            classManagementAPI.clearCache()
            
            // Refetch all data
            await Promise.all([
                fetchClasses(),
                fetchStatistics()
            ])
            
            // Refetch students if a class is selected
            if (selectedClass) {
                await fetchStudents(selectedClass)
            }
            
            toast.success('Data refreshed successfully!')
        } catch (error) {
            console.error('Error refreshing:', error)
            toast.error('Failed to refresh data')
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploadFile(file)
        }
    }

    const handleUploadSubmit = async () => {
        if (!uploadFile || !uploadClassCode) {
            toast.error('Please select file and enter class code')
            return
        }

        try {
            setLoading(true)
            const formData = new FormData()
            formData.append('file', uploadFile)
            formData.append('class_code', uploadClassCode)

            console.log('Uploading:', { class_code: uploadClassCode, file: uploadFile.name })
            const result = await classManagementAPI.uploadClassList(formData)
            console.log('Upload result:', result)

            if (result.success) {
                toast.success(result.message || 'Upload successful!')
                // Auto close modal after 1.5 seconds and refresh
                setTimeout(() => {
                    resetUploadModal()
                }, 1500)
                await fetchClasses()
                await fetchStatistics()
            } else {
                toast.error(result.message || 'Upload failed')
            }
        } catch (error: any) {
            console.error('Upload error:', error)
            console.error('Error response:', error.response?.data)
            const errorMessage = error.response?.data?.message || error.message || 'Upload failed'
            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const resetUploadModal = () => {
        setShowUploadModal(false)
        setUploadFile(null)
        setUploadClassCode('')
    }

    // Mẫu tin nhắn nhanh
    const messageTemplates = [
        { id: 'concern', label: '😟 Quan tâm', message: 'Thầy nhận thấy em đang gặp khó khăn. Em có thể chia sẻ với thầy không?' },
        { id: 'encourage', label: '💪 Động viên', message: 'Thầy tin em có thể vượt qua! Cố gắng lên nhé!' },
        { id: 'appointment', label: '📅 Mời gặp', message: 'Thầy muốn gặp em để trao đổi về học tập. Em sắp xếp được không?' },
        { id: 'support', label: '🤝 Hỗ trợ', message: 'Nếu cần hỗ trợ, đừng ngại liên hệ thầy nhé!' }
    ]

    // Utility function để filter students
    const getFilteredStudents = () => {
        if (!studentsData || studentsData.length === 0) return []

        return studentsData.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.masv.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesRisk = filterRisk === 'all' || student.riskLevel === filterRisk
            return matchesSearch && matchesRisk
        })
    }

    // Reset page khi filter hoặc search thay đổi
    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

    const handleFilterChange = (value: string) => {
        setFilterRisk(value)
        setCurrentPage(1)
    }

    const totalClasses = statistics.totalClasses
    const totalStudents = statistics.totalStudents
    const activeClasses = statistics.activeClasses
    const totalAtRisk = statistics.totalAtRisk

    return (
        <TeacherLayout currentPage="class-management">
            <Toaster position="top-right" />
            {/* Page Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-xl shadow-lg mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">
                            {showStudentDetail && selectedClass ? `Chi tiết sinh viên - Lớp ${selectedClass}` : 'Quản lý Lớp Cố Vấn'}
                        </h2>
                        <p className="text-green-100">
                            {showStudentDetail && selectedClass ? 'Xem thông tin chi tiết từng sinh viên trong lớp' : 'Quản lý và theo dõi các lớp học được phân công'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {!showStudentDetail && (
                            <>
                                <button
                                    onClick={handleRefresh}
                                    disabled={loading}
                                    className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Refresh data and clear cache"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                    <span>Refresh</span>
                                </button>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="bg-white text-green-600 hover:bg-green-50 px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-all shadow-md hover:shadow-lg font-semibold"
                                >
                                    <Upload className="w-5 h-5" />
                                    <span>Upload danh sách lớp</span>
                                </button>
                            </>
                        )}
                        {showStudentDetail && (
                            <button
                                onClick={() => setShowStudentDetail(false)}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all border border-white/30"
                            >
                                <X className="w-4 h-4" />
                                <span>Quay lại</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {!showStudentDetail ? (
                <>
                    {/* Class Cards Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-3 text-center py-12">
                                <p className="text-gray-500">Đang tải dữ liệu...</p>
                            </div>
                        ) : classData.length === 0 ? (
                            <div className="col-span-3 text-center py-12">
                                <p className="text-gray-500">Không có dữ liệu lớp học</p>
                            </div>
                        ) : (
                            classData.map((classItem) => {
                                const IconComponent = BookOpen
                                const iconBg = "bg-blue-100"
                                const iconColor = "text-blue-600"
                                return (
                                    <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                                        <CardContent className="p-6">
                                            {/* Header with icon and status */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
                                                    <IconComponent className={`w-6 h-6 ${iconColor}`} />
                                                </div>
                                                <Badge
                                                    className={
                                                        classItem.status === "Đang hoạt động"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }
                                                >
                                                    {classItem.status}
                                                </Badge>
                                            </div>

                                            {/* Class name */}
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{classItem.name}</h3>

                                            {/* Major */}
                                            <p className="text-sm text-gray-600 mb-4">{classItem.major}</p>

                                            {/* Details */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Sĩ số:</span>
                                                    <span className="text-sm text-slate-900">{classItem.students} sinh viên</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">GVCV:</span>
                                                    <span className="text-sm text-slate-900">{classItem.teacher}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">At-Risk:</span>
                                                    <span className={`text-sm ${classItem.atRisk > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {classItem.atRisk} sinh viên
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {classItem.year}
                                                </div>
                                                <button
                                                    className="flex items-center text-sm text-blue-500 hover:text-blue-600"
                                                    onClick={() => {
                                                        setSelectedClass(classItem.id)
                                                        setShowStudentDetail(true)
                                                    }}
                                                >
                                                    Xem chi tiết
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </div>
                </>
            ) : (
                /* Student Detail View - Professional Table Layout */
                <div>
                    {selectedClass && studentsData.length > 0 ? (
                        <div className="space-y-6">
                            {/* Search and Filter Bar */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-x-4">
                                        <div className="flex-1 flex items-center space-x-4">
                                            {/* Search */}
                                            <div className="relative flex-1 max-w-md">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm theo tên, mã SV..."
                                                    value={searchTerm}
                                                    onChange={(e) => handleSearchChange(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            {/* Risk Filter */}
                                            <div className="relative">
                                                <select
                                                    value={filterRisk}
                                                    onChange={(e) => handleFilterChange(e.target.value)}
                                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="all">Tất cả mức độ</option>
                                                    <option value="None">Không có rủi ro</option>
                                                    <option value="Monitor">Cần theo dõi</option>
                                                    <option value="Medium">Nguy cơ trung bình</option>
                                                    <option value="High">Nguy cơ cao</option>
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Stats Summary */}
                                        <div className="flex items-center space-x-6 text-sm">
                                            <div className="text-center">
                                                <p className="text-gray-500">Tổng SV</p>
                                                <p className="font-bold text-gray-900">{studentsData.length}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-500">Không rủi ro</p>
                                                <p className="font-bold text-green-600">
                                                    {studentsData.filter((s: any) => s.riskLevel === 'None').length}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-500">Nguy cơ cao</p>
                                                <p className="font-bold text-red-600">
                                                    {studentsData.filter((s: any) => s.riskLevel === 'High').length}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-500">Giỏi (≥3.2)</p>
                                                <p className="font-bold text-green-600">
                                                    {studentsData.filter((s: any) => s.gpa !== null && s.gpa >= 3.2).length}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-500">Chưa có điểm</p>
                                                <p className="font-bold text-gray-600">
                                                    {studentsData.filter((s: any) => s.gpa === null).length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Students Table */}
                            <Card>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50">
                                                    <TableHead className="w-16 text-center">STT</TableHead>
                                                    <TableHead className="w-20 text-center">Avatar</TableHead>
                                                    <TableHead className="min-w-[200px]">Thông tin sinh viên</TableHead>
                                                    <TableHead className="w-32 text-center">GPA</TableHead>
                                                    <TableHead className="w-32 text-center">GPA Dự đoán</TableHead>
                                                    <TableHead className="w-32 text-center">Điểm danh</TableHead>
                                                    <TableHead className="w-36 text-center">Mức độ rủi ro</TableHead>
                                                    <TableHead className="w-32 text-center">Hành động</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(() => {
                                                    const filteredStudents = getFilteredStudents()
                                                    const startIndex = (currentPage - 1) * itemsPerPage
                                                    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage)

                                                    return paginatedStudents.map((student, index) => (
                                                        <TableRow key={student.masv} className="hover:bg-gray-50 transition-colors">
                                                            <TableCell className="text-center font-medium">
                                                                {startIndex + index + 1}
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <img
                                                                    src={student.avatar}
                                                                    alt={student.name}
                                                                    className="w-10 h-10 rounded-full object-cover mx-auto"
                                                                />
                                                            </TableCell>

                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">{student.name}</p>
                                                                    <p className="text-sm text-gray-500">MASV: {student.masv}</p>
                                                                    <div className="flex items-center space-x-2 mt-1">
                                                                        <Mail className="w-3 h-3 text-gray-400" />
                                                                        <span className="text-xs text-gray-500">{student.email}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <div className="flex flex-col items-center space-y-1">
                                                                    {student.gpa !== null ? (
                                                                        <>
                                                                            <span className={`text-lg font-bold ${student.gpa >= 3.2 ? 'text-green-600' :
                                                                                student.gpa >= 2.68 ? 'text-yellow-600' : 'text-red-600'
                                                                                }`}>
                                                                                {student.gpa}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">
                                                                                {student.gpa >= 3.2 ? 'Giỏi' : student.gpa >= 2.68 ? 'Khá' : 'Yếu'}
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-sm">N/A</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <div className="flex flex-col items-center space-y-1">
                                                                    {student.predictedGpa !== null ? (
                                                                        <>
                                                                            <span className={`text-lg font-bold ${student.predictedGpa >= 3.2 ? 'text-green-600' :
                                                                                student.predictedGpa >= 2.68 ? 'text-yellow-600' : 'text-red-600'
                                                                                }`}>
                                                                                {student.predictedGpa}
                                                                            </span>
                                                                            <div className="flex items-center space-x-1">
                                                                                {student.predictedGpa > student.gpa ? (
                                                                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                                                                ) : student.predictedGpa < student.gpa ? (
                                                                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                                                                ) : (
                                                                                    <span className="text-xs text-gray-500">—</span>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-sm">N/A</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <div className="flex flex-col items-center space-y-1">
                                                                    {student.attendance !== null ? (
                                                                        <>
                                                                            <span className={`text-lg font-bold ${student.attendance >= 90 ? 'text-green-600' :
                                                                                student.attendance >= 70 ? 'text-yellow-600' : 'text-red-600'
                                                                                }`}>
                                                                                {student.attendance}%
                                                                            </span>
                                                                            <User className="w-3 h-3 text-gray-400" />
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-gray-400 text-sm">N/A</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                {student.riskLevel !== null ? (
                                                                    <Badge
                                                                        className={`text-xs font-medium ${student.riskLevel === 'High' ? 'bg-red-100 text-red-700 border-red-300' :
                                                                            student.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                                                                student.riskLevel === 'Monitor' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                                                    'bg-green-100 text-green-700 border-green-300'
                                                                            }`}
                                                                    >
                                                                        {student.riskLevel === 'High' ? '🔴 Nguy cơ cao' :
                                                                            student.riskLevel === 'Medium' ? '🟠 Nguy cơ TB' :
                                                                                student.riskLevel === 'Monitor' ? '🟡 Cần theo dõi' :
                                                                                    '🟢 Không rủi ro'}
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="text-xs font-medium bg-gray-100 text-gray-600 border-gray-300">
                                                                        ⚪ Chưa có dữ liệu
                                                                    </Badge>
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center space-x-1">

                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedStudentDetail(student)
                                                                            setShowDetailModal(true)
                                                                        }}
                                                                        className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-all"
                                                                        title="Nhắn tin"
                                                                    >
                                                                        <Mail className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        className="text-orange-600 hover:text-orange-800 p-1.5 hover:bg-orange-50 rounded transition-all"
                                                                        title="Đặt lịch tư vấn"
                                                                    >
                                                                        <Calendar className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                })()}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-500">
                                                {(() => {
                                                    const filteredStudents = getFilteredStudents()
                                                    return `Hiển thị ${Math.min(currentPage * itemsPerPage, filteredStudents.length)} / ${filteredStudents.length} sinh viên`
                                                })()}
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                    disabled={currentPage === 1}
                                                    className={`px-3 py-1 rounded-md text-sm ${currentPage === 1
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>

                                                {(() => {
                                                    const filteredStudents = getFilteredStudents()
                                                    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
                                                    const pages = []
                                                    for (let i = 1; i <= totalPages; i++) {
                                                        pages.push(
                                                            <button
                                                                key={i}
                                                                onClick={() => setCurrentPage(i)}
                                                                className={`px-3 py-1 rounded-md text-sm ${currentPage === i
                                                                    ? 'bg-blue-500 text-white'
                                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {i}
                                                            </button>
                                                        )
                                                    }
                                                    return pages
                                                })()}

                                                <button
                                                    onClick={() => {
                                                        const filteredStudents = getFilteredStudents()
                                                        setCurrentPage(Math.min(
                                                            Math.ceil(filteredStudents.length / itemsPerPage),
                                                            currentPage + 1
                                                        ))
                                                    }}
                                                    disabled={(() => {
                                                        const filteredStudents = getFilteredStudents()
                                                        return currentPage >= Math.ceil(filteredStudents.length / itemsPerPage)
                                                    })()}
                                                    className={`px-3 py-1 rounded-md text-sm ${(() => {
                                                        const filteredStudents = getFilteredStudents()
                                                        return currentPage >= Math.ceil(filteredStudents.length / itemsPerPage)
                                                    })()
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Không có dữ liệu sinh viên cho lớp này</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Chi tiết Sinh viên */}
            {showDetailModal && selectedStudentDetail && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={selectedStudentDetail.avatar}
                                        alt={selectedStudentDetail.name}
                                        className="w-16 h-16 rounded-full border-4 border-white object-cover"
                                    />
                                    <div>
                                        <h3 className="text-2xl font-bold">{selectedStudentDetail.name}</h3>
                                        <p className="text-blue-100">MASV: {selectedStudentDetail.masv}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false)
                                        setSelectedStudentDetail(null)
                                        setQuickMessage('')
                                        setSelectedTemplate('')
                                    }}
                                    className="text-white hover:text-gray-200 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Thông tin cơ bản */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <User className="w-5 h-5 text-indigo-600 mr-2" />
                                    Thông tin cơ bản
                                </h4>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-start">
                                        <Mail className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedStudentDetail.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs text-gray-500">Số điện thoại</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedStudentDetail.phone || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs text-gray-500">Địa chỉ</p>
                                            <p className="text-sm font-medium text-gray-900">{selectedStudentDetail.address || 'Chưa cập nhật'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin học tập */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <GraduationCap className="w-5 h-5 text-blue-600 mr-2" />
                                    Thông tin học tập
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600 mb-1">GPA Hiện tại</p>
                                        <p className={`text-2xl font-bold ${selectedStudentDetail.gpa >= 3.2 ? 'text-green-600' : selectedStudentDetail.gpa >= 2.68 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {selectedStudentDetail.gpa}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600 mb-1">GPA Dự đoán</p>
                                        <p className={`text-2xl font-bold ${selectedStudentDetail.predictedGpa >= 3.2 ? 'text-green-600' : selectedStudentDetail.predictedGpa >= 2.68 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {selectedStudentDetail.predictedGpa}
                                        </p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600 mb-1">Điểm danh</p>
                                        <p className={`text-2xl font-bold ${selectedStudentDetail.attendance >= 90 ? 'text-green-600' : selectedStudentDetail.attendance >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {selectedStudentDetail.attendance}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tin nhắn nhanh */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Mail className="w-5 h-5 text-green-600" />
                                    <h5 className="text-lg font-semibold text-green-900">Gửi tin nhắn nhanh</h5>
                                </div>

                                {/* Mẫu tin nhắn */}
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Chọn mẫu tin nhắn:</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {messageTemplates.map((template) => (
                                            <button
                                                key={template.id}
                                                onClick={() => {
                                                    setSelectedTemplate(template.id)
                                                    setQuickMessage(template.message)
                                                }}
                                                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${selectedTemplate === template.id
                                                    ? 'bg-green-600 text-white shadow-lg transform scale-105'
                                                    : 'bg-white text-gray-700 hover:bg-green-100 hover:shadow-md border-2 border-gray-200'
                                                    }`}
                                            >
                                                {template.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Hộp nhập tin nhắn */}
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Nội dung tin nhắn:</label>
                                    <textarea
                                        value={quickMessage}
                                        onChange={(e) => setQuickMessage(e.target.value)}
                                        placeholder="Nhập tin nhắn hoặc chọn mẫu ở trên..."
                                        rows={5}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    />
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-500">
                                            {quickMessage.length} ký tự
                                        </span>
                                        {quickMessage.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setQuickMessage('')
                                                    setSelectedTemplate('')
                                                }}
                                                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                            >
                                                <X className="w-3 h-3" />
                                                Xóa nội dung
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Nút gửi */}
                                <button
                                    onClick={() => {
                                        if (quickMessage.trim()) {
                                            alert(`✅ Đã gửi tin nhắn đến ${selectedStudentDetail.name}:\n\n"${quickMessage}"`)
                                            setQuickMessage('')
                                            setSelectedTemplate('')
                                        }
                                    }}
                                    disabled={!quickMessage.trim()}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                    <Mail className="w-5 h-5" />
                                    Gửi tin nhắn ngay
                                </button>
                            </div>

                            {/* Các hành động */}
                            <div className="pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false)
                                            // Navigate to messages page
                                            window.location.href = `/teacher/messages?studentId=${selectedStudentDetail.masv}`
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                    >
                                        <Mail className="w-5 h-5" />
                                        Nhắn tin
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailModal(false)
                                            // Navigate to appointments page
                                            window.location.href = `/teacher/appointments?action=book&studentId=${selectedStudentDetail.masv}`
                                        }}
                                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                    >
                                        <Calendar className="w-5 h-5" />
                                        Đặt lịch tư vấn
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Upload Modal - Simplified like PredictionViewV2 */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Upload className="w-10 h-10 bg-white/20 rounded-lg p-2" />
                                    <h3 className="text-xl font-bold">Upload Class List</h3>
                                </div>
                                <button onClick={resetUploadModal} className="text-white hover:text-gray-200">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Class Code Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Class Code <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={uploadClassCode} 
                                    onChange={(e) => setUploadClassCode(e.target.value.toUpperCase())} 
                                    placeholder="e.g. CMU-TPM7" 
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                                    required 
                                />
                            </div>

                            {/* File Upload Dropzone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Excel/CSV File <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="file" 
                                    accept=".xls,.xlsx,.csv" 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    id="file-upload" 
                                />
                                <label 
                                    htmlFor="file-upload" 
                                    className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                        uploadFile 
                                            ? 'border-green-500 bg-green-50' 
                                            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                                    }`}
                                >
                                    {uploadFile ? (
                                        <div className="text-center">
                                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                            <p className="font-semibold text-gray-800">{uploadFile.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {(uploadFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-600 font-medium">Click to select file</p>
                                            <p className="text-sm text-gray-400 mt-1">Supports Excel (.xlsx, .xls) or CSV</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={handleUploadSubmit}
                                disabled={loading || !uploadClassCode || !uploadFile}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                                    loading || !uploadClassCode || !uploadFile
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                                }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Uploading...
                                    </span>
                                ) : (
                                    'Upload Class List'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    )
}

