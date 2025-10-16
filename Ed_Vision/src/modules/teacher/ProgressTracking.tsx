import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/teacher/teacher_table"
import TeacherLayout from "./components/TeacherLayout"
import {
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle,
    Users,
    BarChart3,
    Search,
    Download,
    Eye,
    MessageCircle,
    Star,
    Award,
    Activity,
    CheckCircle,
    RefreshCw,
    X,
    Send,
    FileText,
} from "lucide-react"

// Sample data for students progress
const studentsProgress = [
    {
        id: "SV001",
        name: "Nguyễn Văn An",
        avatar: "/src/assets/teacher/Avatar_Student1.png",
        class: "IT2021A",
        currentGPA: 3.8,
        previousGPA: 3.6,
        targetGPA: 3.9,
        completedCredits: 95,
        totalCredits: 140,
        currentSemesterGPA: 3.9,
        attendanceRate: 96,
        submissionRate: 100,
        lateSubmissions: 0,
        missedDeadlines: 0,
        trend: "up",
        riskLevel: "low",
        lastUpdate: "2024-10-15",
        achievements: ["Xuất sắc học kỳ I", "Không vi phạm nội quy"],
        concerns: [],
        subjects: [
            { name: "Cơ sở dữ liệu", grade: 9.2, status: "completed" },
            { name: "Lập trình Web", grade: 8.8, status: "in-progress" },
            { name: "Mạng máy tính", grade: 9.0, status: "completed" },
            { name: "Phân tích thiết kế HT", grade: null, status: "upcoming" }
        ]
    },
    {
        id: "SV002",
        name: "Trần Thị Bình",
        avatar: "/src/assets/teacher/Avatar_Student2.png",
        class: "IT2021A",
        currentGPA: 2.4,
        previousGPA: 2.8,
        targetGPA: 3.0,
        completedCredits: 78,
        totalCredits: 140,
        currentSemesterGPA: 2.1,
        attendanceRate: 72,
        submissionRate: 65,
        lateSubmissions: 8,
        missedDeadlines: 3,
        trend: "down",
        riskLevel: "high",
        lastUpdate: "2024-10-15",
        achievements: [],
        concerns: ["Vắng học nhiều", "Nộp bài trễ thường xuyên", "Điểm giảm liên tục"],
        subjects: [
            { name: "Cơ sở dữ liệu", grade: 4.5, status: "completed" },
            { name: "Lập trình Web", grade: 3.2, status: "in-progress" },
            { name: "Mạng máy tính", grade: 5.0, status: "completed" },
            { name: "Phân tích thiết kế HT", grade: null, status: "upcoming" }
        ]
    },
    {
        id: "SV003",
        name: "Lê Văn Cường",
        avatar: "/src/assets/teacher/Avatar_Student3.png",
        class: "IT2021B",
        currentGPA: 3.2,
        previousGPA: 3.0,
        targetGPA: 3.5,
        completedCredits: 88,
        totalCredits: 140,
        currentSemesterGPA: 3.4,
        attendanceRate: 85,
        submissionRate: 90,
        lateSubmissions: 2,
        missedDeadlines: 1,
        trend: "up",
        riskLevel: "medium",
        lastUpdate: "2024-10-14",
        achievements: ["Cải thiện điểm số"],
        concerns: ["Cần tăng tốc để đạt mục tiêu"],
        subjects: [
            { name: "Cơ sở dữ liệu", grade: 7.5, status: "completed" },
            { name: "Lập trình Web", grade: 6.8, status: "in-progress" },
            { name: "Mạng máy tính", grade: 7.2, status: "completed" },
            { name: "Phân tích thiết kế HT", grade: null, status: "upcoming" }
        ]
    }
]

// Sample weekly progress data
const weeklyProgressData = [
    { week: "Tuần 1", totalSubmissions: 45, onTimeSubmissions: 42, averageGrade: 7.8, attendanceRate: 94 },
    { week: "Tuần 2", totalSubmissions: 48, onTimeSubmissions: 45, averageGrade: 8.1, attendanceRate: 96 },
    { week: "Tuần 3", totalSubmissions: 47, onTimeSubmissions: 43, averageGrade: 7.9, attendanceRate: 92 },
    { week: "Tuần 4", totalSubmissions: 50, onTimeSubmissions: 48, averageGrade: 8.3, attendanceRate: 95 },
    { week: "Tuần 5", totalSubmissions: 49, onTimeSubmissions: 47, averageGrade: 8.0, attendanceRate: 94 },
    { week: "Tuần 6", totalSubmissions: 52, onTimeSubmissions: 50, averageGrade: 8.2, attendanceRate: 97 }
]

export default function ProgressTracking() {
    const [selectedView, setSelectedView] = useState<"overview" | "detailed">("overview")
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
    const [filterClass, setFilterClass] = useState("all")
    const [filterRisk, setFilterRisk] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("name")

    // Modal states
    const [showContactModal, setShowContactModal] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [showNotificationModal, setShowNotificationModal] = useState(false)

    // Form states
    const [contactForm, setContactForm] = useState({
        type: "email",
        recipient: "",
        subject: "",
        message: "",
        priority: "normal"
    })

    const [notificationForm, setNotificationForm] = useState({
        title: "",
        message: "",
        targetClass: "all",
        type: "info"
    })    // Filter and sort students
    const filteredStudents = studentsProgress.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesClass = filterClass === "all" || student.class === filterClass
        const matchesRisk = filterRisk === "all" || student.riskLevel === filterRisk
        return matchesSearch && matchesClass && matchesRisk
    }).sort((a, b) => {
        switch (sortBy) {
            case "gpa":
                return b.currentGPA - a.currentGPA
            case "progress":
                return b.completedCredits - a.completedCredits
            case "attendance":
                return b.attendanceRate - a.attendanceRate
            default:
                return a.name.localeCompare(b.name)
        }
    })

    // Calculate statistics - More realistic for database context
    const totalStudents = studentsProgress.length
    const highRiskStudents = studentsProgress.filter(s => s.riskLevel === "high").length
    const improvingStudents = studentsProgress.filter(s => s.trend === "up").length

    // Realistic GPA calculation - would come from database aggregation
    const currentSemesterGPAs = studentsProgress.map(s => s.currentSemesterGPA)
    const semesterGPAAverage = currentSemesterGPAs.reduce((sum, gpa) => sum + gpa, 0) / totalStudents

    // Database-style statistics that would typically be pre-calculated
    const classStats = {
        totalStudents,
        averageCurrentGPA: Number((studentsProgress.reduce((sum, s) => sum + s.currentGPA, 0) / totalStudents).toFixed(2)),
        averageSemesterGPA: Number(semesterGPAAverage.toFixed(2)),
        averageAttendance: Math.round(studentsProgress.reduce((sum, s) => sum + s.attendanceRate, 0) / totalStudents),
        averageSubmission: Math.round(studentsProgress.reduce((sum, s) => sum + s.submissionRate, 0) / totalStudents),
        averageProgress: Math.round(studentsProgress.reduce((sum, s) => sum + (s.completedCredits / s.totalCredits) * 100, 0) / totalStudents),
        studentsOnTrack: studentsProgress.filter(s => s.currentGPA >= s.targetGPA - 0.2).length
    }

    const getRiskBadgeColor = (risk: string) => {
        switch (risk) {
            case "high": return "bg-red-100 text-red-800"
            case "medium": return "bg-yellow-100 text-yellow-800"
            case "low": return "bg-green-100 text-green-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getTrendIcon = (trend: string) => {
        return trend === "up" ?
            <TrendingUp className="w-4 h-4 text-green-500" /> :
            <TrendingDown className="w-4 h-4 text-red-500" />
    }

    return (
        <TeacherLayout currentPage="progress-tracking">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Theo dõi Tiến độ Học tập</h2>
                        <p className="text-gray-600">Giám sát và đánh giá tiến độ học tập của sinh viên theo thời gian thực</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button
                            onClick={() => setSelectedView(selectedView === "overview" ? "detailed" : "overview")}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {selectedView === "overview" ? <Eye className="w-4 h-4 mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                            {selectedView === "overview" ? "Xem chi tiết" : "Xem tổng quan"}
                        </Button>
                        <Button variant="outline" className="border-gray-300">
                            <Download className="w-4 h-4 mr-2" />
                            Xuất báo cáo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Advanced Overview Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Students Card */}
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-blue-100 text-sm font-medium">Tổng sinh viên</p>
                                <p className="text-4xl font-bold">{totalStudents}</p>
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-xs font-medium">Đang theo dõi</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Mini Progress Indicators */}
                        <div className="mt-4 flex justify-between text-xs">
                            <div className="text-center">
                                <div className="text-blue-100">Hoạt động</div>
                                <div className="font-bold">{totalStudents - highRiskStudents}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-blue-100">Cần hỗ trợ</div>
                                <div className="font-bold">{highRiskStudents}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Average GPA Card */}
                <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-green-100 text-sm font-medium">GPA học kỳ TB</p>
                                <p className="text-4xl font-bold">{classStats.averageSemesterGPA}</p>
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-xs font-medium">Học kỳ hiện tại</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Award className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* GPA Distribution Mini Chart */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-green-100 mb-1">
                                <span>Phân bố GPA</span>
                                <span>3.0+: {studentsProgress.filter(s => s.currentGPA >= 3.0).length}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-white h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(studentsProgress.filter(s => s.currentGPA >= 3.0).length / totalStudents) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* High Risk Students Card */}
                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-red-100 text-sm font-medium">Nguy cơ cao</p>
                                <p className="text-4xl font-bold">{highRiskStudents}</p>
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="text-xs font-medium">Cần can thiệp</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <AlertTriangle className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Risk Level Breakdown */}
                        <div className="mt-4 space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-red-100">Cao</span>
                                <span className="font-bold">{studentsProgress.filter(s => s.riskLevel === "high").length}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-red-100">Trung bình</span>
                                <span className="font-bold">{studentsProgress.filter(s => s.riskLevel === "medium").length}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Improvement Trend Card */}
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-purple-100 text-sm font-medium">Tiến bộ tích cực</p>
                                <p className="text-4xl font-bold">{improvingStudents}</p>
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        <TrendingUp className="w-3 h-3" />
                                        <span className="text-xs font-medium">Xu hướng tăng</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        {/* Performance Distribution */}
                        <div className="mt-4">
                            <div className="text-xs text-purple-100 mb-2">Tỷ lệ cải thiện: {Math.round((improvingStudents / totalStudents) * 100)}%</div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                    className="bg-white h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(improvingStudents / totalStudents) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Timeline - Moved to Top */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            <span>Analytics Dashboard - Hiệu suất Học tập</span>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-800">Live</Badge>
                            <Button variant="outline" size="sm">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Compact Key Metrics */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-blue-600">
                                {Math.round((studentsProgress.reduce((sum, s) => sum + s.attendanceRate, 0) / totalStudents))}%
                            </div>
                            <div className="text-xs text-blue-700 font-medium">Điểm danh</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-green-600">
                                {Math.round((studentsProgress.reduce((sum, s) => sum + s.submissionRate, 0) / totalStudents))}%
                            </div>
                            <div className="text-xs text-green-700 font-medium">Nộp bài</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-purple-600">
                                {Math.round((studentsProgress.reduce((sum, s) => sum + (s.completedCredits / s.totalCredits) * 100, 0) / totalStudents))}%
                            </div>
                            <div className="text-xs text-purple-700 font-medium">Tiến độ</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg text-center">
                            <div className="text-xl font-bold text-orange-600">
                                {studentsProgress.filter(s => s.currentGPA >= s.targetGPA - 0.1).length}
                            </div>
                            <div className="text-xs text-orange-700 font-medium">Đạt mục tiêu</div>
                        </div>
                    </div>

                    {/* Simple Progress Summary */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Phân Bố Hiệu Suất</h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <div className="text-lg font-bold text-green-700">
                                    {studentsProgress.filter(s => s.currentGPA >= 3.5 && s.attendanceRate >= 90).length}
                                </div>
                                <div className="text-xs text-green-600">Xuất sắc</div>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <div className="text-lg font-bold text-yellow-700">
                                    {studentsProgress.filter(s => s.currentGPA >= 2.5 && s.currentGPA < 3.5).length}
                                </div>
                                <div className="text-xs text-yellow-600">Khá</div>
                            </div>
                            <div className="bg-red-100 p-3 rounded-lg">
                                <div className="text-lg font-bold text-red-700">
                                    {studentsProgress.filter(s => s.currentGPA < 2.5 || s.attendanceRate < 75).length}
                                </div>
                                <div className="text-xs text-red-600">Cần hỗ trợ</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Real-time Notifications & Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-orange-600" />
                        <span>Cảnh báo & Hành động</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Urgent Alerts */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-red-600 text-sm">🚨 Cảnh báo khẩn cấp</h4>

                        {studentsProgress.filter(s => s.riskLevel === "high").slice(0, 2).map((student) => (
                            <div key={student.id} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-900">{student.name}</p>
                                        <p className="text-xs text-red-700">GPA: {student.currentGPA} - Vắng: {100 - student.attendanceRate}%</p>
                                        <Button
                                            size="sm"
                                            className="mt-2 bg-red-600 hover:bg-red-700 text-xs"
                                            onClick={() => {
                                                setContactForm({
                                                    ...contactForm,
                                                    recipient: student.id,
                                                    subject: `KHẨN CẤP: Can thiệp cho sinh viên ${student.name}`,
                                                    message: `Sinh viên ${student.name} (${student.id}) đang có nguy cơ học tập cao:\n- GPA hiện tại: ${student.currentGPA}\n- Tỷ lệ vắng học: ${100 - student.attendanceRate}%\n\nCần hỗ trợ và can thiệp kịp thời.`,
                                                    priority: "urgent"
                                                })
                                                setShowContactModal(true)
                                            }}
                                        >
                                            <MessageCircle className="w-3 h-3 mr-1" />
                                            Can thiệp ngay
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Positive Updates */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-green-600 text-sm">✅ Cập nhật tích cực</h4>

                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-900">3 sinh viên cải thiện GPA</p>
                                    <p className="text-xs text-green-700">Tuần này có xu hướng tích cực</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Tỷ lệ nộp bài tăng 5%</p>
                                    <p className="text-xs text-blue-700">So với tuần trước</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-sm">Hành động nhanh</h4>

                        <Button
                            size="sm"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
                            onClick={() => setShowNotificationModal(true)}
                        >
                            <Users className="w-3 h-3 mr-2" />
                            Gửi thông báo tới lớp
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => setShowReportModal(true)}
                        >
                            <Download className="w-3 h-3 mr-2" />
                            Xuất báo cáo tuần
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs border-orange-300 text-orange-600"
                            onClick={() => setShowContactModal(true)}
                        >
                            <MessageCircle className="w-3 h-3 mr-2" />
                            Liên hệ phụ huynh
                        </Button>
                    </div>

                    {/* Performance Summary */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 text-sm mb-3">Tóm tắt hiệu suất</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Lớp hoạt động tốt</span>
                                <span className="font-bold text-green-600">85%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Cần theo dõi</span>
                                <span className="font-bold text-yellow-600">12%</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-600">Can thiệp khẩn</span>
                                <span className="font-bold text-red-600">3%</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Weekly Timeline - Moved to Top */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            <span>Timeline Tiến độ 6 Tuần - Học kỳ I 2024-2025</span>
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <select className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                <option>Học kỳ I 2024-2025</option>
                                <option>Học kỳ II 2023-2024</option>
                            </select>
                            <Button variant="outline" size="sm">
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Simplified Timeline Bars */}
                    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 mb-4">
                        <div className="grid grid-cols-6 gap-4">
                            {weeklyProgressData.map((week, index) => {
                                const performance = (week.averageGrade / 10) * 100
                                const attendanceHeight = week.attendanceRate

                                return (
                                    <div key={index} className="text-center">
                                        {/* Week Bar Chart */}
                                        <div className="h-24 flex items-end justify-center space-x-1 mb-2">
                                            {/* Grade Bar */}
                                            <div
                                                className="w-4 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t transition-all duration-300 hover:scale-110"
                                                style={{ height: `${performance}%` }}
                                                title={`Điểm TB: ${week.averageGrade}`}
                                            ></div>
                                            {/* Attendance Bar */}
                                            <div
                                                className="w-4 bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all duration-300 hover:scale-110"
                                                style={{ height: `${attendanceHeight}%` }}
                                                title={`Điểm danh: ${week.attendanceRate}%`}
                                            ></div>
                                        </div>

                                        {/* Week Label */}
                                        <div className="text-xs font-medium text-gray-700">{week.week}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            <div className="font-semibold text-blue-600">{week.averageGrade}</div>
                                            <div className="text-green-600">{week.attendanceRate}%</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex justify-center space-x-6 mt-4 text-xs">
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span className="text-gray-600">Điểm TB</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="text-gray-600">Điểm danh</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Weekly Summary */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-sm font-medium text-blue-800">Điểm TB tuần này</div>
                            <div className="text-xl font-bold text-blue-600">8.2</div>
                            <div className="text-xs text-green-600">+0.2 từ tuần trước</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-sm font-medium text-green-800">Điểm danh</div>
                            <div className="text-xl font-bold text-green-600">97%</div>
                            <div className="text-xs text-green-600">Cao nhất 6 tuần</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <div className="text-sm font-medium text-purple-800">Xu hướng</div>
                            <div className="text-xl font-bold text-purple-600 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 mr-1" />
                                Tích cực
                            </div>
                            <div className="text-xs text-purple-600">3 tuần liên tiếp tăng</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {selectedView === "overview" ? (
                <>
                    {/* Simplified Class Performance Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Class Performance Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    <span>Thống kê Hiệu suất Lớp</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Simple Performance Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-600">{classStats.averageSemesterGPA}</div>
                                        <div className="text-sm text-blue-700">GPA Trung Bình</div>
                                        <div className="text-xs text-gray-600 mt-1">Học kỳ hiện tại</div>
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">{classStats.averageAttendance}%</div>
                                        <div className="text-sm text-green-700">Điểm Danh TB</div>
                                        <div className="text-xs text-gray-600 mt-1">6 tuần qua</div>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-purple-600">{classStats.averageSubmission}%</div>
                                        <div className="text-sm text-purple-700">Nộp Bài TB</div>
                                        <div className="text-xs text-gray-600 mt-1">Đúng thời hạn</div>
                                    </div>

                                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-orange-600">{classStats.studentsOnTrack}</div>
                                        <div className="text-sm text-orange-700">Đạt Mục Tiêu</div>
                                        <div className="text-xs text-gray-600 mt-1">Sinh viên</div>
                                    </div>
                                </div>

                                {/* Simple Performance Distribution */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Phân Loại Hiệu Suất</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 bg-green-100 rounded">
                                            <div className="flex items-center space-x-2">
                                                <Star className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-green-800">Xuất sắc (GPA ≥ 3.5)</span>
                                            </div>
                                            <Badge className="bg-green-200 text-green-800">
                                                {studentsProgress.filter(s => s.currentGPA >= 3.5).length} sinh viên
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between p-2 bg-yellow-100 rounded">
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="w-4 h-4 text-yellow-600" />
                                                <span className="text-sm font-medium text-yellow-800">Khá (GPA 2.5-3.5)</span>
                                            </div>
                                            <Badge className="bg-yellow-200 text-yellow-800">
                                                {studentsProgress.filter(s => s.currentGPA >= 2.5 && s.currentGPA < 3.5).length} sinh viên
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between p-2 bg-red-100 rounded">
                                            <div className="flex items-center space-x-2">
                                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                                <span className="text-sm font-medium text-red-800">Cần hỗ trợ (GPA &lt; 2.5)</span>
                                            </div>
                                            <Badge className="bg-red-200 text-red-800">
                                                {studentsProgress.filter(s => s.currentGPA < 2.5).length} sinh viên
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Weekly Summary & Alerts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Activity className="w-5 h-5 text-orange-600" />
                                    <span>Phân tích Tuần này</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Current Week Summary */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="font-semibold text-gray-900 mb-3">Tuần 6 - Hiện tại</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Điểm trung bình</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-green-600">8.2</span>
                                                <TrendingUp className="w-3 h-3 text-green-500" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Tỷ lệ điểm danh</span>
                                            <span className="font-bold text-green-600">97%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Nộp đúng hạn</span>
                                            <span className="font-bold text-green-600">96%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Weekly Insights */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">Thông tin chi tiết</h4>

                                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-green-800">Xu hướng tích cực</p>
                                                <p className="text-xs text-green-600">Điểm trung bình tăng 0.2 so với tuần trước</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <Users className="w-4 h-4 text-blue-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">Tham gia tích cực</p>
                                                <p className="text-xs text-blue-600">Tỷ lệ điểm danh cao nhất trong 6 tuần</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <Clock className="w-4 h-4 text-orange-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-orange-800">Cần theo dõi</p>
                                                <p className="text-xs text-orange-600">2 sinh viên có xu hướng giảm điểm</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-gray-900">Hành động nhanh</h4>
                                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                                        <Eye className="w-3 h-3 mr-2" />
                                        Xem báo cáo chi tiết
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-full">
                                        <Download className="w-3 h-3 mr-2" />
                                        Xuất dữ liệu tuần
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Progress Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* High Risk Students */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-red-600">Sinh viên cần can thiệp khẩn cấp</CardTitle>
                                    <Badge className="bg-red-100 text-red-800">{highRiskStudents}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {studentsProgress
                                    .filter(s => s.riskLevel === "high")
                                    .slice(0, 3)
                                    .map((student) => (
                                        <div key={student.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div className="flex items-center space-x-3">
                                                <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{student.name}</p>
                                                    <p className="text-sm text-gray-600">{student.id} - {student.class}</p>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <span className="text-xs text-red-600">GPA: {student.currentGPA}</span>
                                                        <span className="text-xs text-red-600">Điểm danh: {student.attendanceRate}%</span>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={() => {
                                                            setContactForm({
                                                                ...contactForm,
                                                                recipient: student.id,
                                                                subject: `Liên hệ về sinh viên ${student.name}`,
                                                                priority: "high"
                                                            })
                                                            setShowContactModal(true)
                                                        }}
                                                    >
                                                        <MessageCircle className="w-3 h-3 mr-1" />
                                                        Liên hệ
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {highRiskStudents > 3 && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => setSelectedView("detailed")}
                                    >
                                        Xem tất cả {highRiskStudents} sinh viên nguy cơ cao
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Performers */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-green-600">Sinh viên xuất sắc</CardTitle>
                                    <Badge className="bg-green-100 text-green-800">{studentsProgress.filter(s => s.currentGPA >= 3.5).length}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {studentsProgress
                                    .filter(s => s.currentGPA >= 3.5)
                                    .sort((a, b) => b.currentGPA - a.currentGPA)
                                    .slice(0, 3)
                                    .map((student, index) => (
                                        <div key={student.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full" />
                                                    {index === 0 && <Star className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-current" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">{student.name}</p>
                                                    <p className="text-sm text-gray-600">{student.id} - {student.class}</p>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <span className="text-xs text-green-600 font-medium">GPA: {student.currentGPA}</span>
                                                        <span className="text-xs text-green-600">Tiến độ: {Math.round((student.completedCredits / student.totalCredits) * 100)}%</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {getTrendIcon(student.trend)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                /* Detailed View */
                <div className="space-y-6">
                    {/* Filters and Search */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-x-4">
                                <div className="flex items-center space-x-4 flex-1">
                                    {/* Search */}
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm sinh viên..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Class Filter */}
                                    <select
                                        value={filterClass}
                                        onChange={(e) => setFilterClass(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">Tất cả lớp</option>
                                        <option value="IT2021A">IT2021A</option>
                                        <option value="IT2021B">IT2021B</option>
                                        <option value="KT2022A">KT2022A</option>
                                    </select>

                                    {/* Risk Filter */}
                                    <select
                                        value={filterRisk}
                                        onChange={(e) => setFilterRisk(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">Tất cả mức độ</option>
                                        <option value="high">Nguy cơ cao</option>
                                        <option value="medium">Nguy cơ trung bình</option>
                                        <option value="low">Ít nguy cơ</option>
                                    </select>
                                </div>

                                {/* Sort */}
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Sắp xếp:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="name">Tên A-Z</option>
                                        <option value="gpa">GPA cao nhất</option>
                                        <option value="progress">Tiến độ cao nhất</option>
                                        <option value="attendance">Điểm danh cao nhất</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Students Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="w-16 text-center">STT</TableHead>
                                            <TableHead className="min-w-[250px]">Thông tin sinh viên</TableHead>
                                            <TableHead className="w-32 text-center">GPA hiện tại</TableHead>
                                            <TableHead className="w-32 text-center">Tiến độ</TableHead>
                                            <TableHead className="w-32 text-center">Điểm danh</TableHead>
                                            <TableHead className="w-32 text-center">Xu hướng</TableHead>
                                            <TableHead className="w-36 text-center">Mức độ rủi ro</TableHead>
                                            <TableHead className="w-32 text-center">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStudents.map((student, index) => (
                                            <TableRow key={student.id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="text-center font-medium">{index + 1}</TableCell>

                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{student.name}</p>
                                                            <p className="text-sm text-gray-500">{student.id} - {student.class}</p>
                                                            <p className="text-xs text-gray-400">Cập nhật: {student.lastUpdate}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="space-y-1">
                                                        <span className={`text-lg font-bold ${student.currentGPA >= 3.5 ? 'text-green-600' :
                                                            student.currentGPA >= 2.5 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                            {student.currentGPA}
                                                        </span>
                                                        <div className="text-xs text-gray-500">
                                                            Mục tiêu: {student.targetGPA}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="space-y-1">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-500 h-2 rounded-full"
                                                                style={{ width: `${(student.completedCredits / student.totalCredits) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-gray-600">
                                                            {student.completedCredits}/{student.totalCredits} TC
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="space-y-1">
                                                        <span className={`font-bold ${student.attendanceRate >= 90 ? 'text-green-600' :
                                                            student.attendanceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                                                            }`}>
                                                            {student.attendanceRate}%
                                                        </span>
                                                        <div className="text-xs text-gray-500">
                                                            Nộp bài: {student.submissionRate}%
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center space-y-1">
                                                        {getTrendIcon(student.trend)}
                                                        <span className={`text-xs font-medium ${student.trend === "up" ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {student.previousGPA} → {student.currentGPA}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <Badge className={getRiskBadgeColor(student.riskLevel)}>
                                                        {student.riskLevel === "high" ? "Nguy cơ cao" :
                                                            student.riskLevel === "medium" ? "Nguy cơ TB" : "Ít nguy cơ"}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center space-x-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs"
                                                            onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                                                        >
                                                            <Eye className="w-3 h-3 mr-1" />
                                                            Chi tiết
                                                        </Button>
                                                        {student.riskLevel === "high" && (
                                                            <Button
                                                                size="sm"
                                                                className="text-xs bg-red-600 hover:bg-red-700"
                                                                onClick={() => {
                                                                    setContactForm({
                                                                        ...contactForm,
                                                                        recipient: student.id,
                                                                        subject: `Cần can thiệp cho sinh viên ${student.name}`,
                                                                        priority: "urgent"
                                                                    })
                                                                    setShowContactModal(true)
                                                                }}
                                                            >
                                                                <MessageCircle className="w-3 h-3 mr-1" />
                                                                Can thiệp
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student Detail Expandable */}
                    {selectedStudent && (() => {
                        const student = studentsProgress.find(s => s.id === selectedStudent)
                        if (!student) return null

                        return (
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center space-x-3">
                                            <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full" />
                                            <div>
                                                <span>Chi tiết tiến độ - {student.name}</span>
                                                <p className="text-sm text-gray-500 font-normal">{student.id} - {student.class}</p>
                                            </div>
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedStudent(null)}
                                        >
                                            Đóng
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Performance Metrics */}
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-900">Các chỉ số học tập</h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-600">GPA hiện tại</p>
                                                    <p className="text-xl font-bold text-blue-600">{student.currentGPA}</p>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-600">GPA học kỳ</p>
                                                    <p className="text-xl font-bold text-green-600">{student.currentSemesterGPA}</p>
                                                </div>
                                                <div className="bg-purple-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-600">Điểm danh</p>
                                                    <p className="text-xl font-bold text-purple-600">{student.attendanceRate}%</p>
                                                </div>
                                                <div className="bg-orange-50 p-3 rounded-lg">
                                                    <p className="text-xs text-gray-600">Nộp bài đúng hạn</p>
                                                    <p className="text-xl font-bold text-orange-600">{student.submissionRate}%</p>
                                                </div>
                                            </div>

                                            {/* Achievements */}
                                            {student.achievements.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-green-600 mb-2">Thành tích đạt được</h5>
                                                    <div className="space-y-1">
                                                        {student.achievements.map((achievement, index) => (
                                                            <div key={index} className="flex items-center space-x-2">
                                                                <Award className="w-4 h-4 text-green-500" />
                                                                <span className="text-sm text-green-700">{achievement}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Concerns */}
                                            {student.concerns.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-red-600 mb-2">Vấn đề cần chú ý</h5>
                                                    <div className="space-y-1">
                                                        {student.concerns.map((concern, index) => (
                                                            <div key={index} className="flex items-center space-x-2">
                                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                                                <span className="text-sm text-red-700">{concern}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Subject Progress */}
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-gray-900">Tiến độ môn học</h4>
                                            <div className="space-y-3">
                                                {student.subjects.map((subject, index) => (
                                                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-gray-900">{subject.name}</span>
                                                            {subject.status === "completed" && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                            {subject.status === "in-progress" && <Activity className="w-4 h-4 text-blue-500" />}
                                                            {subject.status === "upcoming" && <Clock className="w-4 h-4 text-gray-400" />}
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-sm ${subject.status === "completed" ? "text-green-600" :
                                                                subject.status === "in-progress" ? "text-blue-600" : "text-gray-500"
                                                                }`}>
                                                                {subject.status === "completed" ? "Hoàn thành" :
                                                                    subject.status === "in-progress" ? "Đang học" : "Sắp học"}
                                                            </span>
                                                            {subject.grade !== null && (
                                                                <span className={`font-bold ${subject.grade >= 8 ? "text-green-600" :
                                                                    subject.grade >= 6.5 ? "text-yellow-600" : "text-red-600"
                                                                    }`}>
                                                                    {subject.grade}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })()}
                </div>
            )}

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Liên hệ Phụ huynh</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowContactModal(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại liên hệ</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={contactForm.type}
                                    onChange={(e) => setContactForm({ ...contactForm, type: e.target.value })}
                                >
                                    <option value="email">Email</option>
                                    <option value="phone">Điện thoại</option>
                                    <option value="meeting">Cuộc họp</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phụ huynh sinh viên</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={contactForm.recipient}
                                    onChange={(e) => setContactForm({ ...contactForm, recipient: e.target.value })}
                                >
                                    <option value="">Chọn sinh viên</option>
                                    {studentsProgress.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} - {student.id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Nhập tiêu đề liên hệ"
                                    value={contactForm.subject}
                                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                                    placeholder="Nhập nội dung tin nhắn"
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={contactForm.priority}
                                    onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                                >
                                    <option value="low">Thấp</option>
                                    <option value="normal">Bình thường</option>
                                    <option value="high">Cao</option>
                                    <option value="urgent">Khẩn cấp</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowContactModal(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                    // Handle send contact
                                    alert('Tin nhắn đã được gửi thành công!')
                                    setShowContactModal(false)
                                    setContactForm({ type: "email", recipient: "", subject: "", message: "", priority: "normal" })
                                }}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Gửi
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {showNotificationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Gửi Thông báo</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowNotificationModal(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gửi tới</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={notificationForm.targetClass}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, targetClass: e.target.value })}
                                >
                                    <option value="all">Tất cả sinh viên</option>
                                    <option value="IT2021A">Lớp IT2021A</option>
                                    <option value="IT2021B">Lớp IT2021B</option>
                                    <option value="high-risk">Sinh viên nguy cơ cao</option>
                                    <option value="excellent">Sinh viên xuất sắc</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại thông báo</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={notificationForm.type}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                                >
                                    <option value="info">Thông tin</option>
                                    <option value="warning">Cảnh báo</option>
                                    <option value="success">Chúc mừng</option>
                                    <option value="urgent">Khẩn cấp</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Nhập tiêu đề thông báo"
                                    value={notificationForm.title}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung thông báo</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32"
                                    placeholder="Nhập nội dung thông báo"
                                    value={notificationForm.message}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowNotificationModal(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                    // Handle send notification
                                    alert('Thông báo đã được gửi thành công!')
                                    setShowNotificationModal(false)
                                    setNotificationForm({ title: "", message: "", targetClass: "all", type: "info" })
                                }}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Gửi thông báo
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Export Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Xuất Báo cáo</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowReportModal(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại báo cáo</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                    <option value="weekly">Báo cáo tuần</option>
                                    <option value="monthly">Báo cáo tháng</option>
                                    <option value="semester">Báo cáo học kỳ</option>
                                    <option value="custom">Tùy chỉnh</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phạm vi dữ liệu</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                    <option value="all">Tất cả sinh viên</option>
                                    <option value="class">Theo lớp</option>
                                    <option value="risk">Theo mức độ rủi ro</option>
                                    <option value="performance">Theo hiệu suất</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Định dạng file</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                    <option value="excel">Excel (.xlsx)</option>
                                    <option value="pdf">PDF (.pdf)</option>
                                    <option value="csv">CSV (.csv)</option>
                                </select>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                    <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">Nội dung báo cáo</p>
                                        <p className="text-xs text-blue-700">Tiến độ học tập, điểm danh, GPA, xu hướng cải thiện</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowReportModal(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    // Handle export report
                                    alert('Báo cáo đang được tạo và sẽ được gửi về email của bạn!')
                                    setShowReportModal(false)
                                }}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Xuất báo cáo
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    )
}
