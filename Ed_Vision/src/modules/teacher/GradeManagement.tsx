import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Input } from "@/components/ui/teacher/teacher_input"
import { useNavigate } from "react-router-dom"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/teacher/teacher_table"
import {
    MoreHorizontal,
    BookOpen,
    ClipboardList,
    TrendingUp,
    AlertTriangle,
    MessageSquare,
    Settings,
    Search,
    ChevronDown,
    Download,
    Eye,
    Edit3,
    Trash2,
    Users,
    TrendingUp as TrendingUpIcon,
    ChevronUp,
    User
} from "lucide-react"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Asset imports
import imgLogo from "@/assets/teacher/Avatar_View_Dashboard.png"
import imgAvatar from "@/assets/teacher/Avatar_Teacher.png"

export default function GradeManagement() {
    const navigate = useNavigate()

    const handleNavigation = (path: string) => {
        navigate(path)
    }
    const [selectedClass, setSelectedClass] = useState("Lập trình Web - K65A (IT3080)")
    const [selectedGradeType, setSelectedGradeType] = useState("Tất cả điểm")
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const studentData = [
        {
            id: 1,
            studentId: "20210001",
            name: "Nguyễn Thị Lan",
            email: "lan.nt@email.com",
            bt1: 8.5,
            bt2: 9.0,
            quiz1: 7.5,
            quiz2: 8.0,
            midterm: 7.8,
            final: 8.2,
            total: 8.1,
            grade: "Giỏi",
            gradeColor: "green"
        },
        {
            id: 2,
            studentId: "20210002",
            name: "Trần Văn Nam",
            email: "nam.tv@email.com",
            bt1: 7.0,
            bt2: 6.5,
            quiz1: 8.0,
            quiz2: 7.5,
            midterm: 6.8,
            final: 7.2,
            total: 7.1,
            grade: "Khá",
            gradeColor: "blue"
        },
        {
            id: 3,
            studentId: "20210003",
            name: "Lê Thị Hoa",
            email: "hoa.lt@email.com",
            bt1: 9.0,
            bt2: 9.5,
            quiz1: 8.5,
            quiz2: 9.0,
            midterm: 8.8,
            final: 9.2,
            total: 9.0,
            grade: "Xuất sắc",
            gradeColor: "green"
        },
        {
            id: 4,
            studentId: "20210004",
            name: "Phạm Minh Tuấn",
            email: "tuan.pm@email.com",
            bt1: 4.0,
            bt2: 3.5,
            quiz1: 5.0,
            quiz2: 4.5,
            midterm: 5.2,
            final: 4.8,
            total: 4.7,
            grade: "Yếu",
            gradeColor: "red",
            isLowPerforming: true
        },
        {
            id: 5,
            studentId: "20210005",
            name: "Hoàng Văn Đức",
            email: "duc.hv@email.com",
            bt1: 7.5,
            bt2: 8.0,
            quiz1: 6.5,
            quiz2: 7.0,
            midterm: 7.3,
            final: 7.8,
            total: 7.4,
            grade: "Khá",
            gradeColor: "blue"
        },
        {
            id: 6,
            studentId: "20210006",
            name: "Vũ Thị Mai",
            email: "mai.vt@email.com",
            bt1: 8.0,
            bt2: 7.5,
            quiz1: 8.5,
            quiz2: 8.0,
            midterm: 7.8,
            final: 8.2,
            total: 8.0,
            grade: "Giỏi",
            gradeColor: "green"
        }
    ]

    const stats = {
        totalStudents: 45,
        averageGrade: 7.8,
        highestGrade: 9.5,
        needImprovement: 3
    }

    // Xuất Excel
    const handleExport = () => {
        try {
            const exportData = studentData.map(student => ({
                "STT": student.id,
                "Mã SV": student.studentId,
                "Họ và tên": student.name,
                "Email": student.email,
                "BT1 (10%)": student.bt1,
                "BT2 (10%)": student.bt2,
                "Quiz 1 (15%)": student.quiz1,
                "Quiz 2 (15%)": student.quiz2,
                "Giữa kỳ (25%)": student.midterm,
                "Cuối kỳ (25%)": student.final,
                "Tổng kết": student.total,
                "Xếp loại": student.grade
            }))

            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng điểm")
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
            const data = new Blob([excelBuffer], { type: "application/octet-stream" })
            saveAs(data, `BangDiem_${selectedClass.replace(/\s/g, "_")}.xlsx`)
        } catch (error) {
            console.error("Error exporting to Excel:", error)
            alert("Có lỗi xảy ra khi xuất file Excel")
        }
    }

    const handleGradeChange = (studentId: number, field: string, value: string) => {
        // Logic để cập nhật điểm số
        console.log(`Updating ${field} for student ${studentId} to ${value}`)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center space-x-4">
                        <img src={imgLogo} alt="Logo" className="w-10 h-10 rounded-lg" />
                        <h1 className="text-xl font-bold text-gray-800">Giảng viên Dashboard</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                placeholder="Tìm kiếm sinh viên..."
                                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <Button variant="ghost" className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                            <img src={imgAvatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-700">TS. Nguyễn Văn A</span>
                                <span className="text-xs text-gray-500">Giảng viên</span>
                            </div>
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex pt-20">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 shadow-sm fixed left-0 top-20 bottom-0 overflow-y-auto">
                    <nav className="p-4 space-y-2">
                        <button
                            onClick={() => handleNavigation('/teacher/dashboard')}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            onClick={() => handleNavigation('/teacher/class-management')}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                        >
                            <BookOpen className="w-5 h-5" />
                            <span>Quản lý lớp học</span>
                        </button>
                        <button className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg w-full text-left">
                            <ClipboardList className="w-5 h-5" />
                            <span>Quản lý điểm</span>
                        </button>
                        <button
                            onClick={() => handleNavigation('/teacher/progress-tracking')}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                        >
                            <TrendingUp className="w-5 h-5" />
                            <span>Theo dõi tiến độ</span>
                        </button>
                        <button
                            onClick={() => handleNavigation('/teacher/reports-alerts')}
                            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                        >
                            <AlertTriangle className="w-5 h-5" />
                            <span>Báo cáo & Cảnh báo</span>
                        </button>
                        <button className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <MessageSquare className="w-5 h-5" />
                            <span>Tin nhắn/Thông báo</span>
                        </button>
                        <button className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <Settings className="w-5 h-5" />
                            <span>Cài đặt tài khoản</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-6">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Quản lý điểm</h2>
                        <p className="text-gray-600">Cập nhật và theo dõi điểm số của sinh viên</p>
                    </div>

                    {/* Filter Section */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Chọn lớp học</label>
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="bg-gray-100 border border-gray-300 rounded-lg px-5 py-2 text-sm w-64"
                                        >
                                            <option value="Lập trình Web - K65A (IT3080)">Lập trình Web - K65A (IT3080)</option>
                                            <option value="Cơ sở dữ liệu - K65A">Cơ sở dữ liệu - K65A</option>
                                            <option value="Thuật toán - K65A">Thuật toán - K65A</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Loại điểm</label>
                                        <select
                                            value={selectedGradeType}
                                            onChange={(e) => setSelectedGradeType(e.target.value)}
                                            className="bg-gray-100 border border-gray-300 rounded-lg px-5 py-2 text-sm w-48"
                                        >
                                            <option value="Tất cả điểm">Tất cả điểm</option>
                                            <option value="Bài tập">Bài tập</option>
                                            <option value="Kiểm tra">Kiểm tra</option>
                                            <option value="Thi">Thi</option>
                                        </select>
                                    </div>
                                </div>

                                <Button onClick={handleExport} variant="excel">
                                    <Download className="w-4 h-4 mr-2" />
                                    <span>Xuất Excel</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Tổng sinh viên</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                                    </div>
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Điểm trung bình</p>
                                        <p className="text-2xl font-bold text-green-600">{stats.averageGrade}</p>
                                    </div>
                                    <TrendingUpIcon className="w-5 h-5 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Điểm cao nhất</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.highestGrade}</p>
                                    </div>
                                    <ChevronUp className="w-5 h-5 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Cần cải thiện</p>
                                        <p className="text-2xl font-bold text-red-600">{stats.needImprovement}</p>
                                    </div>
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Grade Table */}
                    <Card>
                        <CardHeader className="border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                    Bảng điểm - {selectedClass}
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">Hiển thị</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span className="text-sm text-gray-500">sinh viên</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">STT</TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">MÃ SV</TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">HỌ VÀ TÊN</TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">
                                            <div>BT1</div>
                                            <div>(10%)</div>
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">
                                            <div>BT2</div>
                                            <div>(10%)</div>
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">
                                            <div>QUIZ 1</div>
                                            <div>(15%)</div>
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">
                                            <div>QUIZ 2</div>
                                            <div>(15%)</div>
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">
                                            <div>GIỮA KỲ</div>
                                            <div>(25%)</div>
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">
                                            <div>CUỐI KỲ</div>
                                            <div>(25%)</div>
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">
                                            <div>TỔNG</div>
                                            <div>KẾT</div>
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">XẾP LOẠI</TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 text-center">THAO TÁC</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentData.map((student) => (
                                        <TableRow
                                            key={student.id}
                                            className={`hover:bg-gray-50 ${student.isLowPerforming ? 'bg-red-50' : 'bg-white'}`}
                                        >
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-gray-900">{student.id}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-gray-900">{student.studentId}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                        <div className="text-sm text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Editable Grade Inputs */}
                                            {['bt1', 'bt2', 'quiz1', 'quiz2', 'midterm', 'final'].map((field) => (
                                                <TableCell key={field} className="px-6 py-4 text-center">
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="10"
                                                        value={student[field as keyof typeof student] as number}
                                                        onChange={(e) => handleGradeChange(student.id, field, e.target.value)}
                                                        className={`w-16 text-center ${student.isLowPerforming ? 'bg-red-50 border-red-300' : 'border-gray-300'}`}
                                                    />
                                                </TableCell>
                                            ))}

                                            <TableCell className="px-6 py-4 text-center">
                                                <span className={`text-lg font-bold ${student.gradeColor === 'green' ? 'text-green-600' :
                                                    student.gradeColor === 'blue' ? 'text-blue-600' :
                                                        'text-red-600'
                                                    }`}>
                                                    {student.total}
                                                </span>
                                            </TableCell>

                                            <TableCell className="px-6 py-4 text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className={`${student.gradeColor === 'green' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                        student.gradeColor === 'blue' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                                            'bg-red-100 text-red-800 hover:bg-red-100'
                                                        }`}
                                                >
                                                    {student.grade}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <Button variant="ghost" size="sm" className="p-1 w-8 h-8 text-blue-600 hover:text-blue-800">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-1 w-8 h-8 text-green-600 hover:text-green-800">
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-1 w-8 h-8 text-red-600 hover:text-red-800">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="border-t border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Hiển thị 1 đến {studentData.length} trong tổng số {stats.totalStudents} sinh viên
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" disabled className="border-gray-300 text-gray-500">
                                            Trước
                                        </Button>
                                        <Button size="sm" className="bg-blue-600 text-white px-3">
                                            1
                                        </Button>
                                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
                                            2
                                        </Button>
                                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
                                            3
                                        </Button>
                                        <Button variant="outline" size="sm" className="border-gray-300 text-gray-700">
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}