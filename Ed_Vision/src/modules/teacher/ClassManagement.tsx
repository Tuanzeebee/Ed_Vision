import { useState } from "react"
import { Card, CardContent } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import TeacherLayout from "./components/TeacherLayout"
import {
    BookOpen,
    Users,
    GraduationCap,
    AlertTriangle,
    ChevronDown,
    Calendar,
    ChevronRight,
    X,
    Phone,
    Mail,
    User,
    TrendingUp,
    TrendingDown,
    Search,
    ChevronLeft,
    Eye,
    Edit,
    MoreHorizontal
} from "lucide-react"

// Dữ liệu sinh viên mẫu
const studentsData = {
    "IT2021A": [
        {
            masv: "SV001",
            name: "Nguyễn Văn An",
            avatar: "/src/assets/teacher/Avatar_Student1.png",
            email: "nguyenvanan@student.edu",
            gpa: 3.8,
            attendance: 95,
            status: "Excellent",
            riskLevel: "Low"
        },
        {
            masv: "SV002",
            name: "Trần Thị Bình",
            avatar: "/src/assets/teacher/Avatar_Student2.png",
            email: "tranthibinh@student.edu",
            gpa: 2.5,
            attendance: 70,
            status: "At Risk",
            riskLevel: "High"
        },
        {
            masv: "SV003",
            name: "Lê Văn Cường",
            avatar: "/src/assets/teacher/Avatar_Student3.png",
            email: "levancuong@student.edu",
            gpa: 3.2,
            attendance: 85,
            status: "Good",
            riskLevel: "Medium"
        }
    ],
    "KT2022A": [
        {
            masv: "SV004",
            name: "Phạm Thị Dung",
            avatar: "/src/assets/teacher/Avatar_Student1.png",
            email: "phamthidung@student.edu",
            gpa: 3.9,
            attendance: 98,
            status: "Excellent",
            riskLevel: "Low"
        }
    ]
}

export default function ClassManagement() {
    const [selectedClass, setSelectedClass] = useState<string | null>(null)
    const [showStudentDetail, setShowStudentDetail] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterRisk, setFilterRisk] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    // Utility function để filter students
    const getFilteredStudents = () => {
        if (!selectedClass || !studentsData[selectedClass as keyof typeof studentsData]) return []

        return studentsData[selectedClass as keyof typeof studentsData].filter(student => {
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

    // Class data
    const classData = [
        {
            id: "IT2021A",
            name: "IT2021A",
            major: "Công nghệ thông tin - Khóa 2021",
            students: 42,
            teacher: "TS. Nguyễn Văn A",
            atRisk: 3,
            status: "Đang hoạt động",
            year: "Năm học 2024-2025",
            icon: BookOpen,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600"
        },
        {
            id: "IT2021B",
            name: "IT2021B",
            major: "Công nghệ thông tin - Khóa 2021",
            students: 38,
            teacher: "TS. Nguyễn Văn A",
            atRisk: 2,
            status: "Đang hoạt động",
            year: "Năm học 2024-2025",
            icon: BookOpen,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600"
        },
        {
            id: "KT2022A",
            name: "KT2022A",
            major: "Kế toán - Khóa 2022",
            students: 45,
            teacher: "TS. Nguyễn Văn A",
            atRisk: 5,
            status: "Đang hoạt động",
            year: "Năm học 2024-2025",
            icon: Users,
            iconBg: "bg-green-100",
            iconColor: "text-green-600"
        },
        {
            id: "QTKD2023A",
            name: "QTKD2023A",
            major: "Quản trị kinh doanh - Khóa 2023",
            students: 40,
            teacher: "TS. Nguyễn Văn A",
            atRisk: 0,
            status: "Đang hoạt động",
            year: "Năm học 2024-2025",
            icon: GraduationCap,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600"
        },
        {
            id: "NN2022B",
            name: "NN2022B",
            major: "Ngôn ngữ Anh - Khóa 2022",
            students: 35,
            teacher: "TS. Nguyễn Văn A",
            atRisk: 8,
            status: "Tạm dừng",
            year: "Năm học 2024-2025",
            icon: BookOpen,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600"
        },
        {
            id: "IT2024A",
            name: "IT2024A",
            major: "Công nghệ thông tin - Khóa 2024",
            students: 48,
            teacher: "TS. Nguyễn Văn A",
            atRisk: 5,
            status: "Đang hoạt động",
            year: "Năm học 2024-2025",
            icon: BookOpen,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600"
        }
    ]

    const totalClasses = classData.length
    const totalStudents = classData.reduce((sum, cls) => sum + cls.students, 0)
    const activeClasses = classData.filter(cls => cls.status === "Đang hoạt động").length
    const totalAtRisk = classData.reduce((sum, cls) => sum + cls.atRisk, 0)

    return (
        <TeacherLayout currentPage="class-management">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {showStudentDetail && selectedClass ? `Chi tiết sinh viên - Lớp ${selectedClass}` : 'Quản lý Lớp học'}
                        </h2>
                        <p className="text-gray-600">
                            {showStudentDetail && selectedClass ? 'Xem thông tin chi tiết từng sinh viên trong lớp' : 'Quản lý và theo dõi các lớp học được phân công'}
                        </p>
                    </div>
                    {showStudentDetail && (
                        <button
                            onClick={() => setShowStudentDetail(false)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
                        >
                            <X className="w-4 h-4" />
                            <span>Quay lại</span>
                        </button>
                    )}
                </div>
            </div>

            {!showStudentDetail ? (
                <>
                    {/* Statistics Section */}
                    <div className="grid grid-cols-4 gap-6 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Tổng số lớp</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Tổng sinh viên</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Users className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Lớp đang hoạt động</p>
                                        <p className="text-2xl font-bold text-gray-900">{activeClasses}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <GraduationCap className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Sinh viên At-Risk</p>
                                        <p className="text-2xl font-bold text-red-600">{totalAtRisk}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Class Cards Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        {classData.map((classItem) => {
                            const IconComponent = classItem.icon
                            return (
                                <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        {/* Header with icon and status */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-12 h-12 ${classItem.iconBg} rounded-lg flex items-center justify-center`}>
                                                <IconComponent className={`w-6 h-6 ${classItem.iconColor}`} />
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
                        })}
                    </div>
                </>
            ) : (
                /* Student Detail View - Professional Table Layout */
                <div>
                    {selectedClass && studentsData[selectedClass as keyof typeof studentsData] ? (
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
                                                    <option value="Low">Ít nguy cơ</option>
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
                                                <p className="font-bold text-gray-900">{studentsData[selectedClass as keyof typeof studentsData].length}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-500">Nguy cơ cao</p>
                                                <p className="font-bold text-red-600">
                                                    {studentsData[selectedClass as keyof typeof studentsData].filter(s => s.riskLevel === 'High').length}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-gray-500">Xuất sắc</p>
                                                <p className="font-bold text-green-600">
                                                    {studentsData[selectedClass as keyof typeof studentsData].filter(s => s.status === 'Excellent').length}
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
                                                    <TableHead className="w-32 text-center">Điểm danh</TableHead>
                                                    <TableHead className="w-36 text-center">Mức độ rủi ro</TableHead>
                                                    <TableHead className="w-32 text-center">Trạng thái</TableHead>
                                                    <TableHead className="w-32 text-center">Liên hệ</TableHead>
                                                    <TableHead className="w-24 text-center">Thao tác</TableHead>
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
                                                                    <span className={`text-lg font-bold ${student.gpa >= 3.5 ? 'text-green-600' :
                                                                        student.gpa >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                                                                        }`}>
                                                                        {student.gpa}
                                                                    </span>
                                                                    <div className="flex items-center space-x-1">
                                                                        {student.gpa >= 3.5 ? (
                                                                            <TrendingUp className="w-3 h-3 text-green-500" />
                                                                        ) : (
                                                                            <TrendingDown className="w-3 h-3 text-red-500" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <div className="flex flex-col items-center space-y-1">
                                                                    <span className={`text-lg font-bold ${student.attendance >= 90 ? 'text-green-600' :
                                                                        student.attendance >= 70 ? 'text-yellow-600' : 'text-red-600'
                                                                        }`}>
                                                                        {student.attendance}%
                                                                    </span>
                                                                    <User className="w-3 h-3 text-gray-400" />
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <Badge
                                                                    variant={student.riskLevel === 'High' ? 'destructive' :
                                                                        student.riskLevel === 'Medium' ? 'secondary' : 'default'}
                                                                    className="text-xs font-medium"
                                                                >
                                                                    {student.riskLevel === 'High' ? 'Nguy cơ cao' :
                                                                        student.riskLevel === 'Medium' ? 'Nguy cơ TB' : 'Ít nguy cơ'}
                                                                </Badge>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <Badge
                                                                    variant={student.status === 'Excellent' ? 'default' :
                                                                        student.status === 'Good' ? 'secondary' : 'destructive'}
                                                                    className="text-xs font-medium"
                                                                >
                                                                    {student.status === 'Excellent' ? 'Xuất sắc' :
                                                                        student.status === 'Good' ? 'Tốt' : 'Cần cải thiện'}
                                                                </Badge>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center space-x-2">
                                                                    <button
                                                                        className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                                                        title="Gọi điện"
                                                                    >
                                                                        <Phone className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        className="text-green-500 hover:text-green-700 p-1 rounded transition-colors"
                                                                        title="Gửi email"
                                                                    >
                                                                        <Mail className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center space-x-1">
                                                                    <button
                                                                        className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                                                        title="Xem chi tiết"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                                                                        title="Chỉnh sửa"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        className="text-gray-600 hover:text-gray-800 p-1 rounded transition-colors"
                                                                        title="Thêm"
                                                                    >
                                                                        <MoreHorizontal className="w-4 h-4" />
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
        </TeacherLayout>
    )
}