import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import TeacherLayout from "./components/TeacherLayout"
import {
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle,
    Users,
    Search,
    Eye,
    MessageCircle,
    Calendar,
    ChevronRight,
    X,
    Mail,
    CheckCircle,
    GraduationCap
} from "lucide-react"

// Dữ liệu tiến độ theo lớp
const classProgressData = [
    {
        id: "IT2021A",
        name: "IT2021A",
        totalStudents: 35,
        avgGPA: 3.2,
        avgProgress: 68,
        onTrack: 25,
        atRisk: 7,
        needSupport: 3,
        completionRate: 71,
        attendanceRate: 88,
        trend: "up",
        trendValue: "+5%"
    },
    {
        id: "IT2021B",
        name: "IT2021B",
        totalStudents: 32,
        avgGPA: 2.9,
        avgProgress: 65,
        onTrack: 20,
        atRisk: 9,
        needSupport: 3,
        completionRate: 68,
        attendanceRate: 82,
        trend: "down",
        trendValue: "-3%"
    },
    {
        id: "IT2020A",
        name: "IT2020A",
        totalStudents: 30,
        avgGPA: 3.4,
        avgProgress: 85,
        onTrack: 26,
        atRisk: 3,
        needSupport: 1,
        completionRate: 87,
        attendanceRate: 92,
        trend: "up",
        trendValue: "+8%"
    },
    {
        id: "IT2020B",
        name: "IT2020B",
        totalStudents: 28,
        avgGPA: 3.1,
        avgProgress: 82,
        onTrack: 22,
        atRisk: 4,
        needSupport: 2,
        completionRate: 84,
        attendanceRate: 89,
        trend: "up",
        trendValue: "+4%"
    }
]

// Dữ liệu sinh viên chi tiết theo lớp
const studentsDetailByClass: Record<string, any[]> = {
    "IT2021A": [
        {
            id: "SV001",
            name: "Nguyễn Văn An",
            avatar: "/src/assets/teacher/Avatar_Student1.png",
            email: "nguyenvanan@student.edu",
            currentGPA: 3.8,
            previousGPA: 3.6,
            progress: 68,
            completedCredits: 95,
            totalCredits: 140,
            attendanceRate: 96,
            submissionRate: 100,
            trend: "up",
            riskLevel: "low",
            status: "Xuất sắc"
        },
        {
            id: "SV002",
            name: "Trần Thị Bình",
            avatar: "/src/assets/teacher/Avatar_Student2.png",
            email: "tranthibinh@student.edu",
            currentGPA: 2.4,
            previousGPA: 2.8,
            progress: 56,
            completedCredits: 78,
            totalCredits: 140,
            attendanceRate: 72,
            submissionRate: 65,
            trend: "down",
            riskLevel: "high",
            status: "Cần hỗ trợ"
        },
        {
            id: "SV003",
            name: "Lê Văn Cường",
            avatar: "/src/assets/teacher/Avatar_Student3.png",
            email: "levancuong@student.edu",
            currentGPA: 3.2,
            previousGPA: 3.1,
            progress: 65,
            completedCredits: 91,
            totalCredits: 140,
            attendanceRate: 85,
            submissionRate: 90,
            trend: "up",
            riskLevel: "medium",
            status: "Khá"
        }
    ],
    "IT2021B": [
        {
            id: "SV004",
            name: "Phạm Thị Dung",
            avatar: "/src/assets/teacher/Avatar_Student1.png",
            email: "phamthidung@student.edu",
            currentGPA: 3.5,
            previousGPA: 3.4,
            progress: 70,
            completedCredits: 98,
            totalCredits: 140,
            attendanceRate: 92,
            submissionRate: 95,
            trend: "up",
            riskLevel: "low",
            status: "Giỏi"
        }
    ]
}

export default function ProgressTracking() {
    const [selectedClass, setSelectedClass] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterRisk, setFilterRisk] = useState("all")
    const [filterTrend, setFilterTrend] = useState("all")

    // Thống kê tổng quan
    const totalStudents = classProgressData.reduce((sum, c) => sum + c.totalStudents, 0)
    const totalOnTrack = classProgressData.reduce((sum, c) => sum + c.onTrack, 0)
    const totalAtRisk = classProgressData.reduce((sum, c) => sum + c.atRisk, 0)
    const avgGPAAllClasses = (classProgressData.reduce((sum, c) => sum + c.avgGPA, 0) / classProgressData.length).toFixed(2)

    // Lọc sinh viên
    const getFilteredStudents = () => {
        if (!selectedClass || !studentsDetailByClass[selectedClass]) return []

        let students = studentsDetailByClass[selectedClass]

        if (searchTerm) {
            students = students.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.id.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (filterRisk !== "all") {
            students = students.filter(s => s.riskLevel === filterRisk)
        }

        if (filterTrend !== "all") {
            students = students.filter(s => s.trend === filterTrend)
        }

        return students
    }

    const filteredStudents = getFilteredStudents()

    return (
        <TeacherLayout currentPage="progress-tracking">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">
                                {selectedClass ? `Theo dõi tiến độ - Lớp ${selectedClass}` : 'Theo dõi Tiến độ Học tập'}
                            </h2>
                            <p className="text-purple-100">
                                {selectedClass ? 'Xem chi tiết tiến độ từng sinh viên' : 'Tổng quan tiến độ tất cả các lớp'}
                            </p>
                        </div>
                        {selectedClass && (
                            <button
                                onClick={() => setSelectedClass(null)}
                                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                            >
                                <X className="w-4 h-4" />
                                Quay lại
                            </button>
                        )}
                    </div>
                </div>

                {!selectedClass ? (
                    <>
                        {/* Thống kê tổng quan */}
                        <div className="grid grid-cols-4 gap-6">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Tổng sinh viên</p>
                                            <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
                                            <p className="text-xs text-gray-500 mt-1">Trên {classProgressData.length} lớp</p>
                                        </div>
                                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <Users className="w-7 h-7 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">GPA trung bình</p>
                                            <p className="text-3xl font-bold text-green-600">{avgGPAAllClasses}</p>
                                            <p className="text-xs text-gray-500 mt-1">Tất cả các lớp</p>
                                        </div>
                                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                                            <GraduationCap className="w-7 h-7 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Đúng tiến độ</p>
                                            <p className="text-3xl font-bold text-emerald-600">{totalOnTrack}</p>
                                            <p className="text-xs text-emerald-600 mt-1">
                                                {((totalOnTrack / totalStudents) * 100).toFixed(0)}% tổng số
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <CheckCircle className="w-7 h-7 text-emerald-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Cần chú ý</p>
                                            <p className="text-3xl font-bold text-red-600">{totalAtRisk}</p>
                                            <p className="text-xs text-red-600 mt-1">
                                                {((totalAtRisk / totalStudents) * 100).toFixed(0)}% tổng số
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                                            <AlertTriangle className="w-7 h-7 text-red-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Danh sách các lớp */}
                        <div className="grid grid-cols-2 gap-6">
                            {classProgressData.map((classItem) => (
                                <Card key={classItem.id} className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-purple-300">
                                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl font-bold text-gray-900">
                                                    Lớp {classItem.name}
                                                </CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">{classItem.totalStudents} sinh viên</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${classItem.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {classItem.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                {classItem.trendValue}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {/* Thống kê nhanh */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">GPA TB</p>
                                                <p className="text-2xl font-bold text-blue-600">{classItem.avgGPA}</p>
                                            </div>
                                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                                                <p className="text-xs text-gray-600 mb-1">Tiến độ TB</p>
                                                <p className="text-2xl font-bold text-purple-600">{classItem.avgProgress}%</p>
                                            </div>
                                        </div>

                                        {/* Progress bars */}
                                        <div className="space-y-3 mb-4">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600">Đúng tiến độ</span>
                                                    <span className="font-semibold text-green-600">{classItem.onTrack}/{classItem.totalStudents}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${(classItem.onTrack / classItem.totalStudents) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600">Nguy cơ</span>
                                                    <span className="font-semibold text-red-600">{classItem.atRisk}/{classItem.totalStudents}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-red-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${(classItem.atRisk / classItem.totalStudents) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics */}
                                        <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Hoàn thành</p>
                                                    <p className="text-sm font-semibold">{classItem.completionRate}%</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-purple-500" />
                                                <div>
                                                    <p className="text-xs text-gray-500">Điểm danh</p>
                                                    <p className="text-sm font-semibold">{classItem.attendanceRate}%</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action button */}
                                        <button
                                            onClick={() => setSelectedClass(classItem.id)}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                        >
                                            <Eye className="w-5 h-5" />
                                            Xem chi tiết lớp
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Chi tiết lớp đã chọn */}
                        <Card>
                            <CardHeader className="border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">Danh sách sinh viên</CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {filteredStudents.length} / {studentsDetailByClass[selectedClass]?.length || 0} sinh viên
                                        </p>
                                    </div>

                                    {/* Filters */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Tìm kiếm sinh viên..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>

                                        <select
                                            value={filterRisk}
                                            onChange={(e) => setFilterRisk(e.target.value)}
                                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="all">Tất cả mức độ</option>
                                            <option value="low">Tốt</option>
                                            <option value="medium">Trung bình</option>
                                            <option value="high">Cần chú ý</option>
                                        </select>

                                        <select
                                            value={filterTrend}
                                            onChange={(e) => setFilterTrend(e.target.value)}
                                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="all">Tất cả xu hướng</option>
                                            <option value="up">Tiến bộ</option>
                                            <option value="down">Thoái lui</option>
                                        </select>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="text-center w-16">STT</TableHead>
                                            <TableHead className="text-center w-20">Avatar</TableHead>
                                            <TableHead>Thông tin SV</TableHead>
                                            <TableHead className="text-center">GPA</TableHead>
                                            <TableHead className="text-center">Tiến độ</TableHead>
                                            <TableHead className="text-center">Xu hướng</TableHead>
                                            <TableHead className="text-center">Điểm danh</TableHead>
                                            <TableHead className="text-center">Tình trạng</TableHead>
                                            <TableHead className="text-center">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.map((student, index) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50">
                                                <TableCell className="text-center font-medium">{index + 1}</TableCell>
                                                <TableCell className="text-center">
                                                    <img
                                                        src={student.avatar}
                                                        alt={student.name}
                                                        className="w-10 h-10 rounded-full mx-auto object-cover"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{student.name}</p>
                                                        <p className="text-sm text-gray-500">MASV: {student.id}</p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                            <Mail className="w-3 h-3" />
                                                            {student.email}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div>
                                                        <p className={`text-xl font-bold ${student.currentGPA >= 3.2 ? 'text-green-600' :
                                                            student.currentGPA >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                            {student.currentGPA}
                                                        </p>
                                                        <p className="text-xs text-gray-500">Trước: {student.previousGPA}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                                            <div
                                                                className={`h-2 rounded-full ${student.progress >= 70 ? 'bg-green-500' :
                                                                    student.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${student.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <p className="text-sm font-semibold">{student.progress}%</p>
                                                        <p className="text-xs text-gray-500">{student.completedCredits}/{student.totalCredits} TC</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${student.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {student.trend === 'up' ? (
                                                            <TrendingUp className="w-4 h-4" />
                                                        ) : (
                                                            <TrendingDown className="w-4 h-4" />
                                                        )}
                                                        {student.trend === 'up' ? 'Tiến bộ' : 'Thoái lui'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <p className={`text-lg font-bold ${student.attendanceRate >= 90 ? 'text-green-600' :
                                                        student.attendanceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        {student.attendanceRate}%
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={`${student.riskLevel === 'low' ? 'bg-green-100 text-green-700 border-green-300' :
                                                        student.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                                            'bg-red-100 text-red-700 border-red-300'
                                                        }`}>
                                                        {student.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-all"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-all"
                                                            title="Nhắn tin"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className="text-orange-600 hover:text-orange-800 p-1.5 hover:bg-orange-50 rounded transition-all"
                                                            title="Đặt lịch"
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {filteredStudents.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">Không tìm thấy sinh viên phù hợp</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </TeacherLayout>
    )
}
