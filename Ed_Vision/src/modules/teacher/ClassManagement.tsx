import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Progress } from "@/components/ui/teacher/teacher_progress"
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
    Filter,
    Download,
    Eye,
    Edit3,
    Trash2,
    Search,
    ChevronDown,
    BookOpen,
    MoreHorizontal,
    MessageSquare,
    ClipboardList,
    TrendingUp,
    Settings,
    AlertTriangle
} from "lucide-react"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
// Asset imports
import imgLogo from "@/assets/teacher/Avatar_View_Dashboard.png"
import imgAvatar from "@/assets/teacher/Avatar_Teacher.png"


export default function ClassManagement() {
    const navigate = useNavigate()

    const handleNavigation = (path: string) => {
        navigate(path)
    }
    const initialData = [
        {
            id: "IT01-2024",
            name: "Lập trình Web",
            subject: "Công nghệ thông tin",
            enrollment: "35/40",
            progress: 85,
            status: "Đang hoạt động",
            statusColor: "green"
        },
        {
            id: "IT02-2024",
            name: "Cơ sở dữ liệu",
            subject: "Công nghệ thông tin",
            enrollment: "28/30",
            progress: 78,
            status: "Đang hoạt động",
            statusColor: "green"
        },
        {
            id: "IT03-2024",
            name: "Thuật toán",
            subject: "Công nghệ thông tin",
            enrollment: "32/35",
            progress: 82,
            status: "Đang hoạt động",
            statusColor: "green"
        },
        {
            id: "BT01-2024",
            name: "Quản trị kinh doanh",
            subject: "Kinh tế",
            enrollment: "45/50",
            progress: 75,
            status: "Sắp kết thúc",
            statusColor: "yellow"
        },
        {
            id: "IT04-2024",
            name: "Mạng máy tính",
            subject: "Công nghệ thông tin",
            enrollment: "25/30",
            progress: 90,
            status: "Đang hoạt động",
            statusColor: "green"
        },
        {
            id: "IT05-2024",
            name: "An toàn thông tin",
            subject: "Công nghệ thông tin",
            enrollment: "20/25",
            progress: 88,
            status: "Đang hoạt động",
            statusColor: "green"
        },
        {
            id: "BT02-2024",
            name: "Marketing số",
            subject: "Kinh tế",
            enrollment: "38/40",
            progress: 72,
            status: "Đang hoạt động",
            statusColor: "green"
        },
        {
            id: "IT06-2024",
            name: "Trí tuệ nhân tạo",
            subject: "Công nghệ thông tin",
            enrollment: "22/25",
            progress: 95,
            status: "Đang hoạt động",
            statusColor: "green"
        }
    ]

    const [classData, setClassData] = useState(initialData)
    const [selectedStatus, setSelectedStatus] = useState("Tất cả")

    // Xử lý lọc
    const handleFilter = () => {
        if (selectedStatus === "Tất cả") {
            setClassData(initialData)
        } else {
            setClassData(initialData.filter((c: any) => c.status === selectedStatus))
        }
    }

    // Xuất Excel
    const handleExport = () => {
        try {
            const worksheet = XLSX.utils.json_to_sheet(classData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách lớp")
            const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
            const data = new Blob([excelBuffer], { type: "application/octet-stream" })
            saveAs(data, "DanhSachLop.xlsx")
        } catch (error) {
            console.error("Error exporting to Excel:", error)
            alert("Có lỗi xảy ra khi xuất file Excel")
        }
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
                            <span className="text-sm text-gray-700">TS. Nguyễn Văn A</span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex pt-20">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 shadow-sm fixed left-0 top-20 bottom-0 overflow-y-auto">
                    <nav className="p-4 space-y-2">
                        <button onClick={() => handleNavigation('/teacher/dashboard')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <MoreHorizontal className="w-5 h-5" />
                            <span>Dashboard</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/class-management')} className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg w-full text-left">
                            <BookOpen className="w-5 h-5" />
                            <span>Quản lý lớp học</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/grade-management')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <ClipboardList className="w-5 h-5" />
                            <span>Quản lý điểm</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/progress-tracking')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <TrendingUp className="w-5 h-5" />
                            <span>Theo dõi tiến độ</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/reports-alerts')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Báo cáo & Cảnh báo</span>
                        </button>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <MessageSquare className="w-5 h-5" />
                            <span>Tin nhắn/Thông báo</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <Settings className="w-5 h-5" />
                            <span>Cài đặt tài khoản</span>
                        </a>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 ml-64 p-6">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Quản lý Lớp học</h2>
                        <p className="text-gray-600">Quản lý danh sách lớp học và sinh viên</p>
                    </div>

                    {/* Filter Section */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Năm học</label>
                                        <select className="bg-gray-100 border border-gray-300 rounded-lg px-5 py-2 text-sm">
                                            <option>2024-2025</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Học kỳ</label>
                                        <select className="bg-gray-100 border border-gray-300 rounded-lg px-5 py-2 text-sm">
                                            <option>Học kỳ 1</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="bg-gray-100 border border-gray-300 rounded-lg px-5 py-2 text-sm"
                                        >
                                            <option>Tất cả</option>
                                            <option>Đang hoạt động</option>
                                            <option>Sắp kết thúc</option>
                                        </select>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleFilter}
                                    variant="outline"
                                    className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    <span>Lọc</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Class List Table */}
                    <Card>
                        <CardHeader className="border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold text-gray-900">
                                    Danh sách lớp học (8 lớp)
                                </CardTitle>

                                <Button
                                    onClick={handleExport}
                                    variant="outline"
                                    className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    <span>Xuất Excel</span>
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                                            MÃ LỚP
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                                            TÊN LỚP
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                                            MÔN HỌC
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                                            SĨ SỐ
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                                            TIẾN ĐỘ
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                                            TRẠNG THÁI
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                                            THAO TÁC
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classData.map((classItem, index) => (
                                        <TableRow key={index} className="hover:bg-gray-50">
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm font-medium text-blue-600">{classItem.id}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-gray-900">{classItem.name}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-gray-500">{classItem.subject}</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-900">{classItem.enrollment}</span>
                                                    <Progress value={(parseInt(classItem.enrollment.split('/')[0]) / parseInt(classItem.enrollment.split('/')[1])) * 100} className="w-16 h-2" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <span className="text-sm text-gray-900">{classItem.progress}%</span>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <Badge
                                                    className={`text-xs ${classItem.statusColor === 'green'
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                        }`}
                                                >
                                                    {classItem.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center space-x-4">
                                                    <Button variant="ghost" size="sm" className="p-0 w-6 h-6 text-blue-600 hover:text-blue-800">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-0 w-6 h-6 text-green-600 hover:text-green-800">
                                                        <Edit3 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-0 w-6 h-6 text-red-600 hover:text-red-800">
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
                                        Hiển thị 1 đến 8 của 8 lớp học
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" disabled className="border-gray-300 text-gray-500">
                                            Trước
                                        </Button>
                                        <Button size="sm" className="bg-blue-600 text-white px-3">
                                            1
                                        </Button>
                                        <Button variant="outline" size="sm" disabled className="border-gray-300 text-gray-500">
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