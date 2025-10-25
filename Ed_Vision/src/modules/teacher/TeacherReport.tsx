import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import {
    FileText, Download, Filter, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle, Clock, Users, BarChart3, PieChart, RefreshCw,
    Search, Eye, Send, Mail, Phone, Target, Award, Activity, Share2
} from "lucide-react"

export default function TeacherReport() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPeriod, setSelectedPeriod] = useState("current_semester")
    const [selectedClass, setSelectedClass] = useState("all")
    const [selectedSubject, setSelectedSubject] = useState("all")
    const [selectedRiskLevel, setSelectedRiskLevel] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [isExportingPDF, setIsExportingPDF] = useState(false)
    const [isExportingExcel, setIsExportingExcel] = useState(false)
    const [showFilterModal, setShowFilterModal] = useState(false)
    // const [showDetailModal, setShowDetailModal] = useState(false)
    // const [selectedStudent, setSelectedStudent] = useState<any>(null)

    // Comprehensive Report Data
    const reportData = [
        {
            id: "CMU2024001",
            studentName: "Nguyễn Văn An",
            class: "CMU TPM K19.1",
            subject: "Toán học",
            riskLevel: "Cao",
            lastUpdate: "2024-10-15",
            currentGPA: 2.1,
            targetGPA: 3.0,
            attendanceRate: 65,
            submissionRate: 45,
            behaviorScore: 7.2,
            parentContact: "Cần liên hệ",
            recommendations: ["Tăng cường ôn tập", "Hỗ trợ cá nhân", "Liên hệ phụ huynh"],
            recentTrend: "declining",
            avatar: "https://via.placeholder.com/40",
            semester: "current_semester",
            status: "active"
        },
        {
            id: "CMU2024002",
            studentName: "Trần Thị Bình",
            class: "CMU TPM K19.1",
            subject: "Ngữ văn",
            riskLevel: "Thấp",
            lastUpdate: "2024-10-16",
            currentGPA: 3.7,
            targetGPA: 3.5,
            attendanceRate: 95,
            submissionRate: 98,
            behaviorScore: 9.1,
            parentContact: "Tốt",
            recommendations: ["Duy trì phong độ", "Tham gia hoạt động nâng cao"],
            recentTrend: "stable",
            avatar: "https://via.placeholder.com/40",
            semester: "current_semester",
            status: "active"
        },
        {
            id: "CMU2024003",
            studentName: "Lê Minh Châu",
            class: "CMU TPM K19.2",
            subject: "Tiếng Anh",
            riskLevel: "Trung bình",
            lastUpdate: "2024-10-17",
            currentGPA: 2.8,
            targetGPA: 3.2,
            attendanceRate: 82,
            submissionRate: 76,
            behaviorScore: 8.0,
            parentContact: "Đã liên hệ",
            recommendations: ["Cải thiện kỹ năng nghe", "Thực hành nhiều hơn"],
            recentTrend: "improving",
            avatar: "https://via.placeholder.com/40",
            semester: "current_semester",
            status: "active"
        },
        {
            id: "CMU2024004",
            studentName: "Phạm Quốc Đại",
            class: "CMU TPM K18.3",
            subject: "Vật lý",
            riskLevel: "Cao",
            lastUpdate: "2024-10-16",
            currentGPA: 1.9,
            targetGPA: 2.5,
            attendanceRate: 58,
            submissionRate: 34,
            behaviorScore: 6.8,
            parentContact: "Khẩn cấp",
            recommendations: ["Can thiệp ngay", "Họp phụ huynh", "Kế hoạch hỗ trợ đặc biệt"],
            recentTrend: "declining",
            avatar: "https://via.placeholder.com/40",
            semester: "current_semester",
            status: "at_risk"
        },
        {
            id: "CMU2024005",
            studentName: "Hoàng Thị Ên",
            class: "CMU TPM K19.2",
            subject: "Hóa học",
            riskLevel: "Thấp",
            lastUpdate: "2024-10-17",
            currentGPA: 3.9,
            targetGPA: 3.8,
            attendanceRate: 97,
            submissionRate: 100,
            behaviorScore: 9.5,
            parentContact: "Xuất sắc",
            recommendations: ["Tham gia Olympic", "Làm trợ giảng"],
            recentTrend: "improving",
            avatar: "https://via.placeholder.com/40",
            semester: "current_semester",
            status: "excellent"
        },
        {
            id: "CMU2024006",
            studentName: "Võ Thanh Hùng",
            class: "CMU TPM K20.1",
            subject: "Lập trình",
            riskLevel: "Trung bình",
            lastUpdate: "2024-10-16",
            currentGPA: 3.1,
            targetGPA: 3.3,
            attendanceRate: 88,
            submissionRate: 85,
            behaviorScore: 8.4,
            parentContact: "Tốt",
            recommendations: ["Cải thiện coding skills", "Tham gia project nhóm"],
            recentTrend: "stable",
            avatar: "https://via.placeholder.com/40",
            semester: "current_semester",
            status: "active"
        },
        {
            id: "CMU2024007",
            studentName: "Đặng Kim Liên",
            class: "CMU TPM K20.2",
            subject: "Kinh tế",
            riskLevel: "Cao",
            lastUpdate: "2024-10-15",
            currentGPA: 2.2,
            targetGPA: 2.8,
            attendanceRate: 71,
            submissionRate: 52,
            behaviorScore: 7.0,
            parentContact: "Cần liên hệ",
            recommendations: ["Tham gia lớp phụ đạo", "Cải thiện attendance"],
            recentTrend: "declining",
            avatar: "https://via.placeholder.com/40",
            semester: "current_semester",
            status: "at_risk"
        }
    ]

    // Report Analytics Stats
    const reportStats = {
        totalReports: reportData.length,
        highRiskStudents: reportData.filter(r => r.riskLevel === "Cao").length,
        mediumRiskStudents: reportData.filter(r => r.riskLevel === "Trung bình").length,
        lowRiskStudents: reportData.filter(r => r.riskLevel === "Thấp").length,
        averageGPA: Number((reportData.reduce((sum, r) => sum + r.currentGPA, 0) / reportData.length).toFixed(2)),
        averageAttendance: Math.round(reportData.reduce((sum, r) => sum + r.attendanceRate, 0) / reportData.length),
        urgentContacts: reportData.filter(r => r.parentContact === "Cần liên hệ" || r.parentContact === "Khẩn cấp").length,
        improvingTrend: reportData.filter(r => r.recentTrend === "improving").length
    }

    // Advanced Filtering Logic
    const filteredReports = reportData.filter(report => {
        const matchesSearch = report.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPeriod = selectedPeriod === "all" || report.semester === selectedPeriod
        const matchesClass = selectedClass === "all" || report.class === selectedClass
        const matchesSubject = selectedSubject === "all" || report.subject === selectedSubject
        const matchesRiskLevel = selectedRiskLevel === "all" || report.riskLevel === selectedRiskLevel
        const matchesStatus = selectedStatus === "all" || report.status === selectedStatus

        return matchesSearch && matchesPeriod && matchesClass && matchesSubject && matchesRiskLevel && matchesStatus
    })

    const handleExportPDF = () => {
        setIsExportingPDF(true)
        setTimeout(() => {
            setIsExportingPDF(false)
        }, 2000)
    }

    const handleExportExcel = () => {
        setIsExportingExcel(true)
        setTimeout(() => {
            setIsExportingExcel(false)
        }, 2000)
    }

    const getRiskBadge = (riskLevel: string) => {
        switch (riskLevel) {
            case "Cao":
                return <Badge className="bg-red-100 text-red-800">Cao</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800">{riskLevel}</Badge>
        }
    }

    return (
        <TeacherLayout currentPage="reports-alerts">
            <div className="space-y-6">
                {/* Header với Actions */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <span>Báo cáo & Phân tích Rủi ro</span>
                        </h1>
                        <p className="text-gray-600 mt-2">Theo dõi chi tiết hiệu suất học tập và đưa ra cảnh báo kịp thời</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilterModal(true)}
                            className="flex items-center space-x-2"
                        >
                            <Filter className="w-4 h-4" />
                            <span>Bộ lọc</span>
                        </Button>
                        <Button
                            onClick={handleExportPDF}
                            disabled={isExportingPDF}
                            className="bg-red-600 hover:bg-red-700 flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>{isExportingPDF ? "Đang xuất..." : "Xuất PDF"}</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            disabled={isExportingExcel}
                            className="flex items-center space-x-2"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>{isExportingExcel ? "Đang xuất..." : "Xuất Excel"}</span>
                        </Button>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-600 text-sm font-medium">Rủi ro cao</p>
                                    <p className="text-2xl font-bold text-red-700">{reportStats.highRiskStudents}</p>
                                </div>
                                <div className="p-3 bg-red-200 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                                <span className="text-red-600">Cần can thiệp ngay</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-600 text-sm font-medium">Rủi ro trung bình</p>
                                    <p className="text-2xl font-bold text-yellow-700">{reportStats.mediumRiskStudents}</p>
                                </div>
                                <div className="p-3 bg-yellow-200 rounded-full">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <Activity className="w-4 h-4 text-yellow-500 mr-1" />
                                <span className="text-yellow-600">Theo dõi sát sao</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-600 text-sm font-medium">Ổn định</p>
                                    <p className="text-2xl font-bold text-green-700">{reportStats.lowRiskStudents}</p>
                                </div>
                                <div className="p-3 bg-green-200 rounded-full">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <Award className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-green-600">Hiệu suất tốt</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-600 text-sm font-medium">GPA trung bình</p>
                                    <p className="text-2xl font-bold text-blue-700">{reportStats.averageGPA}</p>
                                </div>
                                <div className="p-3 bg-blue-200 rounded-full">
                                    <BarChart3 className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <Target className="w-4 h-4 text-blue-500 mr-1" />
                                <span className="text-blue-600">Mục tiêu: 3.2</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Risk Analysis Dashboard */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <PieChart className="w-5 h-5 text-blue-600" />
                                <span>Phân tích Rủi ro Chi tiết - Dashboard Tổng quan</span>
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                                <Badge className="bg-green-100 text-green-800">Real-time</Badge>
                                <Button variant="outline" size="sm">
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Risk Metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
                                <div className="text-xl font-bold text-red-600">
                                    {Math.round((reportStats.highRiskStudents / reportStats.totalReports) * 100)}%
                                </div>
                                <div className="text-xs text-red-700 font-medium">Tỷ lệ rủi ro cao</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                                <div className="text-xl font-bold text-blue-600">
                                    {reportStats.averageAttendance}%
                                </div>
                                <div className="text-xs text-blue-700 font-medium">Điểm danh TB</div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-200">
                                <div className="text-xl font-bold text-orange-600">
                                    {reportStats.urgentContacts}
                                </div>
                                <div className="text-xs text-orange-700 font-medium">Cần liên hệ khẩn</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                                <div className="text-xl font-bold text-green-600">
                                    {reportStats.improvingTrend}
                                </div>
                                <div className="text-xs text-green-700 font-medium">Đang cải thiện</div>
                            </div>
                        </div>

                        {/* Risk Distribution Visual */}
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-xl">
                            <h4 className="font-semibold text-gray-900 mb-4 text-sm">Phân Bố Rủi ro theo Mức độ</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-red-100 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-red-700">{reportStats.highRiskStudents}</div>
                                    <div className="text-xs text-red-600 mt-1">Rủi ro cao</div>
                                    <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{ width: `${(reportStats.highRiskStudents / reportStats.totalReports) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="bg-yellow-100 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-700">{reportStats.mediumRiskStudents}</div>
                                    <div className="text-xs text-yellow-600 mt-1">Rủi ro trung bình</div>
                                    <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-yellow-500 h-2 rounded-full"
                                            style={{ width: `${(reportStats.mediumRiskStudents / reportStats.totalReports) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="bg-green-100 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-700">{reportStats.lowRiskStudents}</div>
                                    <div className="text-xs text-green-600 mt-1">Ổn định</div>
                                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${(reportStats.lowRiskStudents / reportStats.totalReports) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Reports Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                <span>Danh sách Báo cáo Chi tiết</span>
                            </CardTitle>
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Tìm kiếm học sinh..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-64"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {/* TODO: setSendReportModal(true) */ }}
                                    className="flex items-center space-x-2"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Gửi báo cáo</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">STT</TableHead>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Mã sinh viên</TableHead>
                                    <TableHead className="w-16">Avatar</TableHead>
                                    <TableHead>Lớp</TableHead>
                                    <TableHead>GPA</TableHead>
                                    <TableHead>Điểm danh</TableHead>
                                    <TableHead>Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.map((report, index) => (
                                    <TableRow key={report.id} className="hover:bg-gray-50">
                                        {/* STT */}
                                        <TableCell className="text-center text-sm font-medium text-gray-600">
                                            {index + 1}
                                        </TableCell>

                                        {/* Tên */}
                                        <TableCell className="font-medium">
                                            <div>
                                                <p className="font-medium text-gray-900">{report.studentName}</p>
                                                <p className="text-xs text-gray-500">{report.subject}</p>
                                            </div>
                                        </TableCell>

                                        {/* Mã sinh viên */}
                                        <TableCell className="font-mono text-sm font-medium text-blue-600">
                                            {report.id}
                                        </TableCell>

                                        {/* Avatar */}
                                        <TableCell>
                                            <img src={report.avatar} alt={report.studentName} className="w-10 h-10 rounded-full mx-auto border-2 border-gray-200" />
                                        </TableCell>

                                        {/* Lớp */}
                                        <TableCell className="font-medium text-purple-700">
                                            {report.class}
                                        </TableCell>

                                        {/* GPA */}
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <span className={`font-bold text-lg ${report.currentGPA >= 3.0 ? 'text-green-600' : report.currentGPA >= 2.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {report.currentGPA}
                                                </span>
                                                <span className="text-xs text-gray-400">/ {report.targetGPA}</span>
                                            </div>
                                        </TableCell>

                                        {/* Điểm danh */}
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <span className={`font-semibold ${report.attendanceRate >= 90 ? 'text-green-600' : report.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {report.attendanceRate}%
                                                </span>
                                                {report.riskLevel === "Cao" && (
                                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getRiskBadge(report.riskLevel)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-1">
                                                {report.recentTrend === "improving" && (
                                                    <>
                                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                                        <span className="text-xs text-green-600">Cải thiện</span>
                                                    </>
                                                )}
                                                {report.recentTrend === "declining" && (
                                                    <>
                                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                                        <span className="text-xs text-red-600">Giảm sút</span>
                                                    </>
                                                )}
                                                {report.recentTrend === "stable" && (
                                                    <>
                                                        <Activity className="w-4 h-4 text-blue-500" />
                                                        <span className="text-xs text-blue-600">Ổn định</span>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        // TODO: setSelectedStudent(report)
                                                        // TODO: setShowDetailModal(true)
                                                        console.log("Chi tiết:", report.studentName)
                                                    }}
                                                    className="flex items-center space-x-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>Chi tiết</span>
                                                </Button>
                                                {report.parentContact === "Cần liên hệ" || report.parentContact === "Khẩn cấp" ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-600 hover:bg-red-700 text-xs flex items-center space-x-1"
                                                    >
                                                        <Phone className="w-4 h-4" />
                                                        <span>Liên hệ</span>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs flex items-center space-x-1"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                        <span>Email</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {filteredReports.length === 0 && (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">Không tìm thấy báo cáo nào</p>
                                <p className="text-gray-400 text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                                Bộ lọc chi tiết
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilterModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {/* Kỳ học */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kỳ học
                                </label>
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả kỳ học</option>
                                    <option value="current_semester">Kỳ học hiện tại</option>
                                    <option value="previous_semester">Kỳ học trước</option>
                                    <option value="summer_2024">Hè 2024</option>
                                </select>
                            </div>

                            {/* Lớp */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lớp
                                </label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả lớp</option>
                                    <option value="CMU TPM K19.1">CMU TPM K19.1</option>
                                    <option value="CMU TPM K19.2">CMU TPM K19.2</option>
                                    <option value="CMU TPM K18.3">CMU TPM K18.3</option>
                                    <option value="CMU TPM K20.1">CMU TPM K20.1</option>
                                    <option value="CMU TPM K20.2">CMU TPM K20.2</option>
                                </select>
                            </div>

                            {/* Môn học */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Môn học
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả môn học</option>
                                    <option value="Toán học">Toán học</option>
                                    <option value="Ngữ văn">Ngữ văn</option>
                                    <option value="Tiếng Anh">Tiếng Anh</option>
                                    <option value="Vật lý">Vật lý</option>
                                    <option value="Hóa học">Hóa học</option>
                                    <option value="Lập trình">Lập trình</option>
                                    <option value="Kinh tế">Kinh tế</option>
                                </select>
                            </div>

                            {/* Mức độ rủi ro */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mức độ rủi ro
                                </label>
                                <select
                                    value={selectedRiskLevel}
                                    onChange={(e) => setSelectedRiskLevel(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả mức độ</option>
                                    <option value="Cao">Rủi ro cao</option>
                                    <option value="Trung bình">Rủi ro trung bình</option>
                                    <option value="Thấp">Rủi ro thấp</option>
                                </select>
                            </div>

                            {/* Trạng thái */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="active">Đang học</option>
                                    <option value="excellent">Xuất sắc</option>
                                    <option value="at_risk">Cảnh báo</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedPeriod("all")
                                    setSelectedClass("all")
                                    setSelectedSubject("all")
                                    setSelectedRiskLevel("all")
                                    setSelectedStatus("all")
                                }}
                                className="text-sm"
                            >
                                Xóa bộ lọc
                            </Button>
                            <Button
                                onClick={() => setShowFilterModal(false)}
                                className="bg-blue-600 hover:bg-blue-700 text-sm"
                            >
                                Áp dụng lọc
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    )
}
