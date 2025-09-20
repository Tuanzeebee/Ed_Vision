import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/teacher/teacher_table"
import { Progress } from "@/components/ui/teacher/teacher_progress"
import { useNavigate } from "react-router-dom"
// Asset imports
import imgChart from "@/assets/teacher/Chart_Teacher_Dashboard.png"
import imgStudent from "@/assets/teacher/Avatar_Student1.png"
import imgStudent1 from "@/assets/teacher/Avatar_Student2.png"
import imgStudent2 from "@/assets/teacher/Avatar_Student3.png"
import imgLogo from "@/assets/teacher/Avatar_View_Dashboard.png"
import imgAvatar from "@/assets/teacher/Avatar_Teacher.png"

export default function TeacherDashboard() {
    const navigate = useNavigate()

    const handleNavigation = (path: string) => {
        navigate(path)
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
                            <Input
                                placeholder="Tìm kiếm sinh viên..."
                                className="pl-10 w-80"
                            />
                        </div>

                        <button className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
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
                        <button onClick={() => handleNavigation('/teacher/dashboard')} className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg w-full text-left">
                            <i className="fas fa-ellipsis-h w-5 h-5"></i>
                            <span>Dashboard</span>
                        </button>
                        <button onClick={() => handleNavigation('/teacher/class-management')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
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
                            <i className="fas fa-chart-bar w-5 h-5"></i>
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
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tổng quan Dashboard</h2>
                        <p className="text-gray-600">Theo dõi tình hình học tập và quản lý sinh viên</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Tổng số sinh viên</p>
                                        <p className="text-3xl font-bold text-gray-900">248</p>
                                        <p className="text-sm text-green-600 mt-2">+12 từ kỳ trước</p>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <i className="fas fa-users w-6 h-6 text-blue-600"></i>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Số lớp đang dạy</p>
                                        <p className="text-3xl font-bold text-gray-900">8</p>
                                        <p className="text-sm text-blue-600 mt-2">3 lớp mới</p>
                                    </div>
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <i className="fas fa-book-open w-6 h-6 text-green-600"></i>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">% sinh viên At-Risk</p>
                                        <p className="text-3xl font-bold text-red-600">12%</p>
                                        <p className="text-sm text-red-600 mt-2">30 sinh viên</p>
                                    </div>
                                    <div className="bg-red-100 p-3 rounded-lg">
                                        <i className="fas fa-exclamation-triangle w-6 h-6 text-red-600"></i>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Trung bình điểm lớp</p>
                                        <p className="text-3xl font-bold text-gray-900">7.8</p>
                                        <p className="text-sm text-green-600 mt-2">+0.3 từ kỳ trước</p>
                                    </div>
                                    <div className="bg-yellow-100 p-3 rounded-lg">
                                        <i className="fas fa-chart-line w-6 h-6 text-yellow-600"></i>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Chart and At-Risk Students */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Progress Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Tiến độ học tập theo tuần</CardTitle>
                                    <div className="flex space-x-2">
                                        <select className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm">
                                            <option>Năm học 2023-2024</option>
                                        </select>
                                        <select className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm">
                                            <option>Học kỳ 1</option>
                                        </select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 w-full">
                                    <img src={imgChart} alt="Progress Chart" className="w-full h-full object-cover rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* At-Risk Students */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Sinh viên cần chú ý</CardTitle>
                                                                        <Badge className="text-xs bg-red-100 text-red-800">30 sinh viên</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <img src={imgStudent} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Nguyễn Thị B</p>
                                            <p className="text-sm text-gray-600">SV001234 - Lớp CNTT01</p>
                                            <p className="text-xs text-red-600">Điểm TB: 4.2 - Vắng 8 buổi</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <img src={imgStudent} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Trần Văn C</p>
                                            <p className="text-sm text-gray-600">SV001235 - Lớp CNTT02</p>
                                            <p className="text-xs text-orange-600">Điểm TB: 5.1 - Chậm tiến độ</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <img src={imgStudent1} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Lê Thị D</p>
                                            <p className="text-sm text-gray-600">SV001236 - Lớp CNTT01</p>
                                            <p className="text-xs text-red-600">Điểm TB: 3.8 - Vắng 12 buổi</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <div className="flex items-center space-x-3">
                                        <img src={imgStudent2} alt="Student" className="w-10 h-10 rounded-full flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">Phạm Văn E</p>
                                            <p className="text-sm text-gray-600">SV001237 - Lớp CNTT03</p>
                                            <p className="text-xs text-orange-600">Điểm TB: 5.5 - Thiếu bài tập</p>
                                        </div>
                                    </div>
                                </div>

                                <Button className="w-full bg-red-600 hover:bg-red-700">
                                    Xem tất cả sinh viên At-Risk
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Class Management Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Lớp học đang giảng dạy</CardTitle>
                                <Button>Xem tất cả lớp</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tên lớp</TableHead>
                                        <TableHead>Môn học</TableHead>
                                        <TableHead>Sĩ số</TableHead>
                                        <TableHead>Tiến độ TB</TableHead>
                                        <TableHead>At-Risk</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">CNTT01</TableCell>
                                        <TableCell>Lập trình Web</TableCell>
                                        <TableCell>35</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Progress value={78} className="w-16" />
                                                <span className="text-sm text-gray-600">78%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                                                                        <Badge className="text-xs bg-red-100 text-red-800">4 SV</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-800">Đang học</Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">CNTT02</TableCell>
                                        <TableCell>Cơ sở dữ liệu</TableCell>
                                        <TableCell>32</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Progress value={65} className="w-16" />
                                                <span className="text-sm text-gray-600">65%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                                                                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">7 SV</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-800">Đang học</Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">CNTT03</TableCell>
                                        <TableCell>Mạng máy tính</TableCell>
                                        <TableCell>28</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Progress value={82} className="w-16" />
                                                <span className="text-sm text-gray-600">82%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-800">2 SV</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-green-100 text-green-800">Đang học</Badge>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    )
}