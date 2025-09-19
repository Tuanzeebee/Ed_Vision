import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/teacher/teacher_input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { useNavigate } from "react-router-dom"
import {
    RefreshCw,
    FileText,
    TrendingUp,
    UserCheck,
    UserX,
    AlertTriangle,
    BarChart3,
    Search,
    Filter,
    Eye,
    MessageSquare,
    User,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    BookOpen,
    ClipboardList,
    Settings,
    ChevronDown,
    FileBarChart
} from "lucide-react"

import imgLogo from "@/assets/teacher/Avatar_View_Dashboard.png"
import imgAvatar from "@/assets/teacher/Avatar_Teacher.png"

export default function ProgressTracking() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const handleNavigation = (path: string) => {
        navigate(path)
    }

    // Sample data
    const stats = [
        {
            title: "Tiến độ trung bình",
            value: "78%",
            icon: TrendingUp,
            color: "blue",
            progress: 78
        },
        {
            title: "SV hoàn thành",
            value: "24/32",
            icon: UserCheck,
            color: "green",
            subtitle: "75% tỷ lệ hoàn thành"
        },
        {
            title: "SV chậm tiến độ",
            value: "5/32",
            icon: UserX,
            color: "orange",
            subtitle: "16% cần hỗ trợ"
        },
        {
            title: "SV at-risk",
            value: "3/32",
            icon: AlertTriangle,
            color: "red",
            subtitle: "9% nguy cơ cao"
        }
    ]

    const students = [
        {
            name: "Nguyễn Thị An",
            studentId: "SV001234",
            progress: 92,
            assignments: "11/12",
            lastAccess: "2 giờ trước",
            status: "Tốt",
            statusColor: "green"
        },
        {
            name: "Trần Văn Bình",
            studentId: "SV001235",
            progress: 78,
            assignments: "9/12",
            lastAccess: "1 ngày trước",
            status: "Bình thường",
            statusColor: "blue"
        },
        {
            name: "Lê Thị Cúc",
            studentId: "SV001236",
            progress: 45,
            assignments: "5/12",
            lastAccess: "3 ngày trước",
            status: "Chậm",
            statusColor: "orange"
        },
        {
            name: "Phạm Văn Dũng",
            studentId: "SV001237",
            progress: 28,
            assignments: "3/12",
            lastAccess: "1 tuần trước",
            status: "At-risk",
            statusColor: "red"
        },
        {
            name: "Hoàng Thị Ế",
            studentId: "SV001238",
            progress: 85,
            assignments: "10/12",
            lastAccess: "5 giờ trước",
            status: "Tốt",
            statusColor: "green"
        }
    ]

    const getProgressColor = (progress: number) => {
        if (progress >= 80) return "bg-green-600"
        if (progress >= 60) return "bg-blue-600"
        if (progress >= 40) return "bg-orange-600"
        return "bg-red-600"
    }

    const getStatusBadgeColor = (color: string) => {
        const colors = {
            green: "bg-green-100 text-green-800",
            blue: "bg-blue-100 text-blue-800",
            orange: "bg-orange-100 text-orange-800",
            red: "bg-red-100 text-red-800"
        }
        return colors[color as keyof typeof colors] || "bg-gray-100 text-gray-800"
    }

    const getIconBgColor = (color: string) => {
        const colors = {
            blue: "bg-blue-100 text-blue-600",
            green: "bg-green-100 text-green-600",
            orange: "bg-orange-100 text-orange-600",
            red: "bg-red-100 text-red-600"
        }
        return colors[color as keyof typeof colors] || "bg-gray-100 text-gray-600"
    }

    const handleUpdateData = async () => {
        setIsUpdating(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))
            // Show success message or update UI
            alert("Dữ liệu đã được cập nhật thành công!")
        } catch (error) {
            alert("Có lỗi xảy ra khi cập nhật dữ liệu!")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleExportReport = async () => {
        setIsExporting(true)
        try {
            // Simulate export process
            await new Promise(resolve => setTimeout(resolve, 2000))
            // Create and download a mock file
            const blob = new Blob(['Báo cáo tiến độ học tập sinh viên'], { type: 'text/plain' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'bao-cao-tien-do.txt'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            alert("Báo cáo đã được xuất thành công!")
        } catch (error) {
            alert("Có lỗi xảy ra khi xuất báo cáo!")
        } finally {
            setIsExporting(false)
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
                        <button onClick={() => handleNavigation('/teacher/class-management')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <BookOpen className="w-5 h-5" />
                            <span>Quản lý lớp học</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/grade-management')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <ClipboardList className="w-5 h-5" />
                            <span>Quản lý điểm</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/progress-tracking')} className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg w-full text-left">
                            <TrendingUp className="w-5 h-5" />
                            <span>Theo dõi tiến độ</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/reports-alerts')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <FileBarChart className="w-5 h-5" />
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
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Theo dõi Tiến độ</h1>
                        <p className="text-gray-600">Theo dõi tiến độ học tập của sinh viên theo lớp và thời gian</p>
                    </div>

                    {/* Filters Card */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Chọn lớp</label>
                                    <div className="relative">
                                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900">
                                            <option>IT101 - Lập trình cơ bản</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Năm học</label>
                                    <div className="relative">
                                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900">
                                            <option>2024</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Học kỳ</label>
                                    <div className="relative">
                                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900">
                                            <option>Học kỳ 1</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Xem theo</label>
                                    <div className="relative">
                                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900">
                                            <option>Theo tuần</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={handleUpdateData}
                                    disabled={isUpdating}
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                                    {isUpdating ? 'Đang cập nhật...' : 'Cập nhật dữ liệu'}
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={handleExportReport}
                                    disabled={isExporting}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-6 mb-6">
                        {stats.map((stat, index) => {
                            const IconComponent = stat.icon
                            return (
                                <Card key={index}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                                <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${getIconBgColor(stat.color)}`}>
                                                <IconComponent className="w-5 h-5" />
                                            </div>
                                        </div>
                                        {stat.progress && (
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${getProgressColor(stat.progress)}`}
                                                    style={{ width: `${stat.progress}%` }}
                                                ></div>
                                            </div>
                                        )}
                                        {stat.subtitle && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                <span className={`text-${stat.color}-600 font-medium`}>
                                                    {stat.value.includes('/') ? Math.round((parseInt(stat.value.split('/')[0]) / parseInt(stat.value.split('/')[1])) * 100) + '%' : stat.value}
                                                </span>{' '}
                                                {stat.subtitle.split('%')[1]}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Weekly Progress Chart */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Tiến độ trung bình theo tuần</h3>
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                                        <span className="text-sm text-gray-500">Lớp IT101</span>
                                    </div>
                                </div>
                                <div className="h-80 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                                    <BarChart3 className="w-9 h-9 text-gray-400 mb-4" />
                                    <p className="text-gray-500 text-center mb-2">Biểu đồ tiến độ theo tuần</p>
                                    <p className="text-gray-400 text-sm text-center">Hiển thị xu hướng tiến độ học tập</p>

                                    {/* Simple Bar Chart Mockup */}
                                    <div className="flex items-end justify-center mt-8 space-x-4">
                                        {[
                                            { week: 'T1', height: 32, color: 'bg-blue-300' },
                                            { week: 'T2', height: 48, color: 'bg-blue-400' },
                                            { week: 'T3', height: 64, color: 'bg-blue-500' },
                                            { week: 'T4', height: 80, color: 'bg-blue-600' },
                                            { week: 'T5', height: 96, color: 'bg-blue-700' }
                                        ].map((bar, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <div className={`w-2 ${bar.color} rounded`} style={{ height: `${bar.height}px` }}></div>
                                                <span className="text-xs text-gray-400 mt-1">{bar.week}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Class Comparison Chart */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">So sánh tiến độ các lớp</h3>
                                    <span className="text-sm text-gray-500">Tuần hiện tại</span>
                                </div>
                                <div className="h-80 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                                    <BarChart3 className="w-9 h-9 text-gray-400 mb-4" />
                                    <p className="text-gray-500 text-center mb-2">So sánh tiến độ các lớp</p>
                                    <p className="text-gray-400 text-sm text-center">Hiển thị tiến độ trung bình từng lớp</p>

                                    {/* Class Comparison Bars */}
                                    <div className="flex items-end justify-center mt-8 space-x-3">
                                        {[
                                            { class: 'IT101', percentage: '78%', height: 64, color: 'bg-blue-500' },
                                            { class: 'IT102', percentage: '82%', height: 80, color: 'bg-green-500' },
                                            { class: 'IT103', percentage: '75%', height: 56, color: 'bg-orange-500' },
                                            { class: 'IT104', percentage: '88%', height: 96, color: 'bg-purple-500' }
                                        ].map((bar, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <div className={`w-8 ${bar.color} rounded-t`} style={{ height: `${bar.height}px` }}></div>
                                                <span className="text-xs text-gray-400 mt-1">{bar.class}</span>
                                                <span className="text-xs text-gray-600 font-medium">{bar.percentage}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Students Table */}
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Chi tiết tiến độ sinh viên - Lớp IT101</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Tìm kiếm sinh viên..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 w-64"
                                        />
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Filter className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">SINH VIÊN</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">MÃ SỐ</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">TIẾN ĐỘ</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">BÀI TẬP HOÀN THÀNH</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">LẦN TRUY CẬP CUỐI</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">TRẠNG THÁI</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">THAO TÁC</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student, index) => (
                                        <TableRow key={index} className="border-t">
                                            <TableCell className="py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{student.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500">{student.studentId}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <div className="w-16 mr-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                                                                style={{ width: `${student.progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-medium ${student.progress >= 80 ? 'text-green-600' :
                                                        student.progress >= 60 ? 'text-blue-600' :
                                                            student.progress >= 40 ? 'text-orange-600' : 'text-red-600'
                                                        }`}>
                                                        {student.progress}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500">{student.assignments}</TableCell>
                                            <TableCell className="text-gray-500">{student.lastAccess}</TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusBadgeColor(student.statusColor)} border-0 font-semibold`}>
                                                    {student.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-3">
                                                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                                                        <Eye className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                                                        <MessageSquare className="w-4 h-4 text-green-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>

                        {/* Pagination */}
                        <div className="bg-gray-50 px-6 py-3 border-t">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Hiển thị 1-5 trong tổng số 32 sinh viên
                                </p>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" disabled className="opacity-50">
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Trước
                                    </Button>
                                    <Button size="sm" className="bg-blue-600 text-white">1</Button>
                                    <Button variant="outline" size="sm">2</Button>
                                    <Button variant="outline" size="sm">
                                        Sau
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </main>
            </div>
        </div>
    )
}