import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
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
        type ClassItem = {
            id: string;
            name: string;
            subject: string;
            enrollment: string;
            progress: number;
            status: string;
            statusColor: string;
        };
        
        if (selectedStatus === "Tất cả") {
            setClassData(initialData)
        } else {
            setClassData(initialData.filter((c: ClassItem) => c.status === selectedStatus))
        }
    }

    // Xuất Excel
    const handleExport = () => {
        try {
            // Convert data to CSV format
            const headers = "Mã lớp,Tên lớp,Môn học,Sĩ số,Tiến độ,Trạng thái\n";
            const csvData = classData.map(item => 
                `${item.id},${item.name},${item.subject},${item.enrollment},${item.progress}%,${item.status}`
            ).join("\n");
            
            const csvContent = headers + csvData;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "DanhSachLop.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting to CSV:", error)
            alert("Có lỗi xảy ra khi xuất file CSV")
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
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                            <input
                                placeholder="Tìm kiếm sinh viên..."
                                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <button className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200">
                            <img src={imgAvatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                            <span className="text-sm text-gray-700">TS. Nguyễn Văn A</span>
                            <i className="fas fa-chevron-down w-3 h-3 text-gray-500"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex pt-20">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 shadow-sm fixed left-0 top-20 bottom-0 overflow-y-auto">
                    <nav className="p-4 space-y-2">
                        <button onClick={() => handleNavigation('/teacher/dashboard')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <i className="fas fa-ellipsis-h w-5 h-5"></i>
                            <span>Dashboard</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/class-management')} className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg w-full text-left">
                            <i className="fas fa-book-open w-5 h-5"></i>
                            <span>Quản lý lớp học</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/grade-management')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <i className="fas fa-clipboard-list w-5 h-5"></i>
                            <span>Quản lý điểm</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/progress-tracking')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <i className="fas fa-chart-line w-5 h-5"></i>
                            <span>Theo dõi tiến độ</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/reports-alerts')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                            <i className="fas fa-exclamation-triangle w-5 h-5"></i>
                            <span>Báo cáo & Cảnh báo</span>
                        </button>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <i className="fas fa-comment w-5 h-5"></i>
                            <span>Tin nhắn/Thông báo</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
                            <i className="fas fa-cog w-5 h-5"></i>
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

                                <button
                                    onClick={handleFilter}
                                    className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-lg flex items-center"
                                >
                                    <i className="fas fa-filter w-4 h-4 mr-2"></i>
                                    <span>Lọc</span>
                                </button>
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

                                <button
                                    onClick={handleExport}
                                    className="bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 px-4 py-2 rounded-lg flex items-center"
                                >
                                    <i className="fas fa-download w-4 h-4 mr-2"></i>
                                    <span>Xuất Excel</span>
                                </button>
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
                                                    <button className="p-0 w-6 h-6 text-blue-600 hover:text-blue-800">
                                                        <i className="fas fa-eye w-4 h-4"></i>
                                                    </button>
                                                    <button className="p-0 w-6 h-6 text-green-600 hover:text-green-800">
                                                        <i className="fas fa-edit w-4 h-4"></i>
                                                    </button>
                                                    <button className="p-0 w-6 h-6 text-red-600 hover:text-red-800">
                                                        <i className="fas fa-trash w-4 h-4"></i>
                                                    </button>
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
                                        <button disabled className="border border-gray-300 text-gray-500 px-3 py-1 rounded text-sm">
                                            Trước
                                        </button>
                                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                            1
                                        </button>
                                        <button disabled className="border border-gray-300 text-gray-500 px-3 py-1 rounded text-sm">
                                            Sau
                                        </button>
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