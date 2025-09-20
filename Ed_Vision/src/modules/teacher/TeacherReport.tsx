import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { useNavigate } from "react-router-dom"
// Import assets
import imgLogo from "@/assets/teacher/Avatar_View_Dashboard.png"
import imgStudent from "@/assets/teacher/Avatar_Student2.png"
import imgStudent1 from "@/assets/teacher/Avatar_Student3.png"
import imgStudent2 from "@/assets/teacher/Avatar_Student3.png"
import imgStudent3 from "@/assets/teacher/Avatar_Student2.png"
import imgStudent4 from "@/assets/teacher/Avatar_Student1.png"
import imgStudent5 from "@/assets/teacher/Avatar_Student1.png"
import imgStudent6 from "@/assets/teacher/Avatar_Student2.png"
import imgStudent7 from "@/assets/teacher/Avatar_Student3.png"
import imgChart from "@/assets/teacher/Report_Teacher.png"

export default function TeacherReport() {
    const navigate = useNavigate()

    const handleNavigation = (path: string) => {
        navigate(path)
    }
    const [searchTerm, setSearchTerm] = useState("")
    const [isExportingPDF, setIsExportingPDF] = useState(false)
    const [isExportingExcel, setIsExportingExcel] = useState(false)
    const [isExportingDetail, setIsExportingDetail] = useState(false)

    // Sample data for risk statistics
    const riskStats = [
        {
            title: "Tổng sinh viên At-Risk",
            value: "15",
            percentage: "6.0%",
            subtitle: "tổng số sinh viên",
            icon: "fas fa-exclamation-triangle",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            textColor: "text-red-600"
        },
        {
            title: "Rủi ro cao",
            value: "8",
            subtitle: "Điểm < 5.0",
            icon: "fas fa-chart-line-down",
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            textColor: "text-red-600"
        },
        {
            title: "Rủi ro trung bình",
            value: "7",
            subtitle: "Điểm 5.0-6.5",
            icon: "fas fa-chart-line-down",
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            textColor: "text-orange-600"
        },
        {
            title: "Cần theo dõi",
            value: "12",
            subtitle: "Vắng nhiều",
            icon: "fas fa-clock",
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-600",
            textColor: "text-yellow-600"
        }
    ]

    // Sample student data
    const students = [
        {
            id: "1",
            name: "Nguyễn Thị B",
            studentId: "SV001234",
            avatar: null,
            class: "CNTT01",
            gpa: 4.2,
            absences: 8,
            riskLevel: "Cao",
            riskColor: "red",
            lastUpdate: "2 giờ trước"
        },
        {
            id: "2",
            name: "Trần Văn C",
            studentId: "SV001235",
            avatar: imgStudent,
            class: "CNTT02",
            gpa: 5.8,
            absences: 5,
            riskLevel: "Trung bình",
            riskColor: "orange",
            lastUpdate: "5 giờ trước"
        },
        {
            id: "3",
            name: "Lê Thị D",
            studentId: "SV001236",
            avatar: imgStudent1,
            class: "CNTT01",
            gpa: 3.9,
            absences: 12,
            riskLevel: "Cao",
            riskColor: "red",
            lastUpdate: "1 ngày trước"
        },
        {
            id: "4",
            name: "Phạm Văn E",
            studentId: "SV001237",
            avatar: imgStudent2,
            class: "CNTT03",
            gpa: 6.1,
            absences: 4,
            riskLevel: "Trung bình",
            riskColor: "orange",
            lastUpdate: "2 ngày trước"
        },
        {
            id: "5",
            name: "Hoàng Minh F",
            studentId: "SV001238",
            avatar: imgStudent3,
            class: "CNTT02",
            gpa: 4.7,
            absences: 9,
            riskLevel: "Cao",
            riskColor: "red",
            lastUpdate: "3 ngày trước"
        },
        {
            id: "6",
            name: "Vũ Thị G",
            studentId: "SV001239",
            avatar: imgStudent4,
            class: "CNTT01",
            gpa: 6.8,
            absences: 15,
            riskLevel: "Cần theo dõi",
            riskColor: "yellow",
            lastUpdate: "4 ngày trước"
        },
        {
            id: "7",
            name: "Đặng Văn H",
            studentId: "SV001240",
            avatar: imgStudent5,
            class: "CNTT03",
            gpa: 5.5,
            absences: 7,
            riskLevel: "Trung bình",
            riskColor: "orange",
            lastUpdate: "5 ngày trước"
        },
        {
            id: "8",
            name: "Bùi Thị I",
            studentId: "SV001241",
            avatar: imgStudent6,
            class: "CNTT02",
            gpa: 4.1,
            absences: 11,
            riskLevel: "Cao",
            riskColor: "red",
            lastUpdate: "6 ngày trước"
        },
        {
            id: "9",
            name: "Ngô Văn J",
            studentId: "SV001242",
            avatar: imgStudent7,
            class: "CNTT01",
            gpa: 7.2,
            absences: 18,
            riskLevel: "Cần theo dõi",
            riskColor: "yellow",
            lastUpdate: "1 tuần trước"
        }
    ]

    const handleExportPDF = async () => {
        setIsExportingPDF(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Simulate file download
            const element = document.createElement('a')
            element.href = 'data:application/pdf;base64,JVBERi0xLjMKJcTl8uXrp...'
            element.download = 'bao-cao-giang-vien.pdf'
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)

            alert('Xuất báo cáo PDF thành công!')
        } catch {
            alert('Có lỗi xảy ra khi xuất báo cáo PDF')
        } finally {
            setIsExportingPDF(false)
        }
    }

    const handleExportExcel = async () => {
        setIsExportingExcel(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Simulate file download
            const element = document.createElement('a')
            element.href = 'data:application/vnd.ms-excel;base64,UEsDBBQABgAIAAAAIQA...'
            element.download = 'bao-cao-giang-vien.xlsx'
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)

            alert('Xuất báo cáo Excel thành công!')
        } catch {
            alert('Có lỗi xảy ra khi xuất báo cáo Excel')
        } finally {
            setIsExportingExcel(false)
        }
    }

    const handleExportDetail = async () => {
        setIsExportingDetail(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1200))

            // Simulate file download
            const element = document.createElement('a')
            element.href = 'data:application/vnd.ms-excel;base64,UEsDBBQABgAIAAAAIQA...'
            element.download = 'bao-cao-chi-tiet.xlsx'
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)

            alert('Xuất báo cáo chi tiết thành công!')
        } catch {
            alert('Có lỗi xảy ra khi xuất báo cáo chi tiết')
        } finally {
            setIsExportingDetail(false)
        }
    }

    const getRiskBadgeColor = (color: string) => {
        const colors = {
            red: "bg-red-100 text-red-800",
            orange: "bg-orange-100 text-orange-800",
            yellow: "bg-yellow-100 text-yellow-800"
        }
        return colors[color as keyof typeof colors] || "bg-gray-100 text-gray-800"
    }

    const getGpaColor = (gpa: number) => {
        if (gpa < 5.0) return "text-red-600"
        if (gpa < 6.5) return "text-orange-600"
        return "text-yellow-600"
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center space-x-3">
                        <img src={imgLogo} alt="Logo" className="w-10 h-10 rounded-lg" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Giảng viên Dashboard</h1>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md mx-8">
                        <div className="relative">
                            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                            <Input
                                placeholder="Tìm kiếm sinh viên..."
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button className="p-2 relative">
                            <i className="fas fa-bell w-5 h-5 text-gray-600"></i>
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                        </button>

                        <button className="flex items-center space-x-2 px-2 py-1">
                            <img src={imgStudent} alt="Avatar" className="w-8 h-8 rounded-full" />
                            <div className="text-left">
                                <p className="text-sm font-medium text-gray-800">TS. Nguyễn Văn A</p>
                                <p className="text-xs text-gray-500">Giảng viên</p>
                            </div>
                            <i className="fas fa-chevron-down w-4 h-4 text-gray-400"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex pt-16">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-gray-200 shadow-sm fixed left-0 top-16 bottom-0 overflow-y-auto">
                    <nav className="p-4 space-y-2">
                        <button onClick={() => handleNavigation('/teacher/dashboard')} className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
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
                        <button onClick={() => handleNavigation('/teacher/reports-alerts')} className="flex items-center space-x-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg w-full text-left">
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
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Báo cáo & Cảnh báo</h1>
                        <p className="text-gray-600">Theo dõi và quản lý sinh viên có nguy cơ At-Risk</p>
                    </div>

                    {/* Filter Section */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-end justify-between">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Năm học</label>
                                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                                            <option>2024</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Kỳ học</label>
                                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                                            <option>Kỳ 1</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Lớp học</label>
                                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                                            <option>Tất cả lớp</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Mức độ rủi ro</label>
                                        <select className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100">
                                            <option>Tất cả</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white">
                                        <i className="fas fa-filter w-4 h-4 mr-2"></i>
                                        Lọc
                                    </button>
                                    <button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                                        <i className="fas fa-undo w-4 h-4 mr-2"></i>
                                        Đặt lại
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Risk Statistics */}
                    <div className="grid grid-cols-4 gap-6 mb-6">
                        {riskStats.map((stat, index) => {
                            return (
                                <Card key={index}>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                                            </div>
                                            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                                                <i className={`${stat.icon} w-5 h-5 ${stat.iconColor}`}></i>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {stat.percentage && (
                                                <span className={`text-sm font-medium ${stat.textColor}`}>
                                                    {stat.percentage}
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-500">{stat.subtitle}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Charts and Export Section */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* Chart */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Phân bố mức độ rủi ro</CardTitle>
                                    <div className="flex bg-gray-100 rounded-lg p-1">
                                        <button className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm">
                                            Theo lớp
                                        </button>
                                        <button className="text-gray-600 px-3 py-1 rounded text-sm">
                                            Theo tháng
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-96 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <img src={imgChart} alt="Risk Distribution Chart" className="max-w-full max-h-full object-contain" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Export Panel */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Xuất báo cáo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    className="w-full bg-red-600 hover:bg-red-700"
                                    onClick={handleExportPDF}
                                    disabled={isExportingPDF}
                                >
                                    {isExportingPDF ? (
                                        <i className="fas fa-sync w-4 h-4 mr-2 animate-spin"></i>
                                    ) : (
                                        <i className="fas fa-file-alt w-4 h-4 mr-2"></i>
                                    )}
                                    {isExportingPDF ? 'Đang xuất PDF...' : 'Xuất PDF'}
                                </Button>
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={handleExportExcel}
                                    disabled={isExportingExcel}
                                >
                                    {isExportingExcel ? (
                                        <i className="fas fa-sync w-4 h-4 mr-2 animate-spin"></i>
                                    ) : (
                                        <i className="fas fa-download w-4 h-4 mr-2"></i>
                                    )}
                                    {isExportingExcel ? 'Đang xuất Excel...' : 'Xuất Excel'}
                                </Button>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    onClick={handleExportDetail}
                                    disabled={isExportingDetail}
                                >
                                    {isExportingDetail ? (
                                        <i className="fas fa-sync w-4 h-4 mr-2 animate-spin"></i>
                                    ) : (
                                        <i className="fas fa-file-alt w-4 h-4 mr-2"></i>
                                    )}
                                    {isExportingDetail ? 'Đang xuất báo cáo...' : 'Báo cáo chi tiết'}
                                </Button>

                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Tùy chọn báo cáo</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" checked className="w-3 h-3 rounded" />
                                            <span className="text-sm text-gray-600">Thông tin sinh viên</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" checked className="w-3 h-3 rounded" />
                                            <span className="text-sm text-gray-600">Điểm số</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" className="w-3 h-3 rounded border border-gray-400" />
                                            <span className="text-sm text-gray-600">Lịch sử vắng mặt</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input type="checkbox" className="w-3 h-3 rounded border border-gray-400" />
                                            <span className="text-sm text-gray-600">Ghi chú giảng viên</span>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Students Table */}
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>Danh sách sinh viên At-Risk</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative">
                                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                                        <Input
                                            placeholder="Tìm kiếm sinh viên..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 w-64"
                                        />
                                    </div>
                                    <Button className="bg-blue-600 hover:bg-blue-700">
                                        <i className="fas fa-plus w-4 h-4 mr-2"></i>
                                        Thêm ghi chú
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-12">
                                            <input type="checkbox" className="w-3 h-3 rounded border border-gray-400" />
                                        </TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">SINH VIÊN</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">LỚP</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">ĐIỂM TB</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">SỐ BUỔI VẮNG</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">MỨC ĐỘ RỦI RO</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">CẬP NHẬT CUỐI</TableHead>
                                        <TableHead className="font-medium text-gray-500 uppercase text-xs tracking-wider">THAO TÁC</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id} className="border-t">
                                            <TableCell>
                                                <input type="checkbox" className="w-3 h-3 rounded border border-gray-400" />
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center">
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full mr-3" />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{student.name}</p>
                                                        <p className="text-sm text-gray-500">{student.studentId}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-900">{student.class}</TableCell>
                                            <TableCell className={`font-medium ${getGpaColor(student.gpa)}`}>
                                                {student.gpa}
                                            </TableCell>
                                            <TableCell className="text-gray-900">{student.absences}</TableCell>
                                            <TableCell>
                                                <Badge className={`${getRiskBadgeColor(student.riskColor)} border-0 font-semibold`}>
                                                    {student.riskLevel}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500">{student.lastUpdate}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <button className="p-1 h-auto">
                                                        <i className="fas fa-eye w-4 h-4 text-blue-600"></i>
                                                    </button>
                                                    <button className="p-1 h-auto">
                                                        <i className="fas fa-comment w-4 h-4 text-green-600"></i>
                                                    </button>
                                                    <button className="p-1 h-auto">
                                                        <i className="fas fa-edit w-4 h-4 text-orange-600"></i>
                                                    </button>
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
                                <p className="text-sm text-gray-700">
                                    Hiển thị 1 đến 10 trong tổng số 15 sinh viên
                                </p>
                                <div className="flex items-center space-x-2">
                                    <button disabled className="border border-gray-300 px-3 py-1 rounded text-sm opacity-50">
                                        <i className="fas fa-chevron-left w-4 h-4 mr-1"></i>
                                        Trước
                                    </button>
                                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">1</button>
                                    <button className="border border-gray-300 px-3 py-1 rounded text-sm">2</button>
                                    <button className="border border-gray-300 px-3 py-1 rounded text-sm">
                                        Sau
                                        <i className="fas fa-chevron-right w-4 h-4 ml-1"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </main>
            </div>
        </div>
    )
}