import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import TeacherLayout from "./components/TeacherLayout"
import { useState } from "react"
import {
    ClipboardList,
    TrendingUp,
    TrendingDown,
    Minus,
    Users,
    Calendar,
    Clock,
    Search,
    ChevronDown,
    Plus,
    X,
    Send,
    Eye,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    FileText,
    Download,
    Edit,
    MessageSquare
} from "lucide-react"

// Interfaces
interface Survey {
    id: string
    title: string
    type: "beginning" | "midterm" | "final"
    semester: string
    academicYear: string
    createdDate: string
    dueDate: string
    status: "draft" | "active" | "completed" | "expired"
    totalStudents: number
    completedResponses: number
    avgCompletion: number
    faculty: string
    className: string
}

interface SurveyQuestion {
    id: string
    category: string
    question: string
    type: "scale" | "text" | "choice"
    options?: string[]
    weight: number
}

interface SurveyHistory {
    studentId: string
    studentName: string
    studentCode: string
    surveys: {
        surveyId: string
        surveyType: string
        completedDate: string
        scores: {
            financial: number
            mental: number
            academic: number
            social: number
        }
        notes: string
    }[]
    trend: "improving" | "stable" | "declining"
    riskLevel: "low" | "medium" | "high"
}

const StudentSurveyManagement = () => {
    // Filter states
    const [selectedFaculty, setSelectedFaculty] = useState("all")
    const [selectedClass, setSelectedClass] = useState("all")
    const [selectedYear, setSelectedYear] = useState("2024-2025")
    const [selectedSemester, setSelectedSemester] = useState("hk1")
    const [selectedSurveyType, setSelectedSurveyType] = useState<"all" | "beginning" | "midterm" | "final">("all")
    const [searchTerm, setSearchTerm] = useState("")

    // Tab state
    const [activeTab, setActiveTab] = useState<"active" | "history" | "create">("active")

    // Create survey states
    const [surveyTitle, setSurveyTitle] = useState("")
    const [surveyType, setSurveyType] = useState<"beginning" | "midterm" | "final">("beginning")
    const [surveyDueDate, setSurveyDueDate] = useState("")
    const [targetFaculty, setTargetFaculty] = useState("all")
    const [targetClass, setTargetClass] = useState("all")
    const [questions, setQuestions] = useState<SurveyQuestion[]>([])
    const [showPreview, setShowPreview] = useState(false)
    const [surveyDescription, setSurveyDescription] = useState("")

    // Expanded states
    const [expandedStudents, setExpandedStudents] = useState<string[]>([])

    // Edit and reminder states
    const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null)
    const [showReminderDialog, setShowReminderDialog] = useState(false)
    const [reminderSurveyId, setReminderSurveyId] = useState<string | null>(null)
    const [reminderMessage, setReminderMessage] = useState("")

    // Mock data
    const faculties = ["Khoa Công nghệ thông tin", "Khoa Kinh tế", "Khoa Ngoại ngữ"]
    const classes = ["CNTT-K19A", "CNTT-K19B", "CNTT-K20A", "CNTT-K20B"]

    const mockActiveSurveys: Survey[] = [
        {
            id: "1",
            title: "Khảo sát đầu học kỳ I - 2024-2025",
            type: "beginning",
            semester: "HK1",
            academicYear: "2024-2025",
            createdDate: "2024-09-01",
            dueDate: "2024-09-15",
            status: "active",
            totalStudents: 150,
            completedResponses: 98,
            avgCompletion: 65,
            faculty: "Khoa Công nghệ thông tin",
            className: "CNTT-K19A"
        },
        {
            id: "2",
            title: "Khảo sát giữa học kỳ I - 2024-2025",
            type: "midterm",
            semester: "HK1",
            academicYear: "2024-2025",
            createdDate: "2024-10-15",
            dueDate: "2024-10-30",
            status: "active",
            totalStudents: 150,
            completedResponses: 45,
            avgCompletion: 30,
            faculty: "Khoa Công nghệ thông tin",
            className: "CNTT-K19A"
        }
    ]

    const mockCompletedSurveys: Survey[] = [
        {
            id: "3",
            title: "Khảo sát cuối học kỳ II - 2023-2024",
            type: "final",
            semester: "HK2",
            academicYear: "2023-2024",
            createdDate: "2024-05-01",
            dueDate: "2024-05-20",
            status: "completed",
            totalStudents: 145,
            completedResponses: 145,
            avgCompletion: 100,
            faculty: "Khoa Công nghệ thông tin",
            className: "CNTT-K19A"
        }
    ]

    const mockStudentHistory: SurveyHistory[] = [
        {
            studentId: "SV001",
            studentName: "Nguyễn Văn A",
            studentCode: "19IT001",
            surveys: [
                {
                    surveyId: "1",
                    surveyType: "Đầu kỳ I - 2024",
                    completedDate: "2024-09-10",
                    scores: {
                        financial: 7,
                        mental: 6,
                        academic: 8,
                        social: 7
                    },
                    notes: "Sinh viên có tình hình tốt, cần theo dõi thêm về tâm lý"
                },
                {
                    surveyId: "2",
                    surveyType: "Giữa kỳ II - 2023",
                    completedDate: "2023-11-15",
                    scores: {
                        financial: 6,
                        mental: 5,
                        academic: 7,
                        social: 6
                    },
                    notes: "Có dấu hiệu stress kỳ thi"
                }
            ],
            trend: "improving",
            riskLevel: "low"
        },
        {
            studentId: "SV002",
            studentName: "Trần Thị B",
            studentCode: "19IT002",
            surveys: [
                {
                    surveyId: "1",
                    surveyType: "Đầu kỳ I - 2024",
                    completedDate: "2024-09-08",
                    scores: {
                        financial: 4,
                        mental: 4,
                        academic: 5,
                        social: 5
                    },
                    notes: "Cần hỗ trợ tài chính và tư vấn tâm lý"
                }
            ],
            trend: "declining",
            riskLevel: "high"
        }
    ]

    // Helper functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-500"
            case "completed": return "bg-blue-500"
            case "draft": return "bg-gray-500"
            case "expired": return "bg-red-500"
            default: return "bg-gray-500"
        }
    }

    const getTypeText = (type: string) => {
        switch (type) {
            case "beginning": return "Đầu kỳ"
            case "midterm": return "Giữa kỳ"
            case "final": return "Cuối kỳ"
            default: return type
        }
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "improving": return <TrendingUp className="w-4 h-4 text-green-600" />
            case "declining": return <TrendingDown className="w-4 h-4 text-red-600" />
            default: return <Minus className="w-4 h-4 text-gray-600" />
        }
    }

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case "high": return "text-red-600 bg-red-50"
            case "medium": return "text-yellow-600 bg-yellow-50"
            case "low": return "text-green-600 bg-green-50"
            default: return "text-gray-600 bg-gray-50"
        }
    }

    const toggleStudentExpand = (studentId: string) => {
        setExpandedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        )
    }

    const addQuestion = () => {
        const newQuestion: SurveyQuestion = {
            id: `q${questions.length + 1}`,
            category: "financial",
            question: "",
            type: "scale",
            weight: 1
        }
        setQuestions([...questions, newQuestion])
    }

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const updateQuestion = (id: string, field: keyof SurveyQuestion, value: any) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ))
    }

    const handleSendReminder = (surveyId: string) => {
        setReminderSurveyId(surveyId)
        setShowReminderDialog(true)
        // Default reminder message
        const survey = mockActiveSurveys.find(s => s.id === surveyId)
        if (survey) {
            setReminderMessage(
                `Nhắc nhở: Bạn chưa hoàn thành khảo sát "${survey.title}". ` +
                `Hạn chót: ${survey.dueDate}. Vui lòng hoàn thành khảo sát để giúp giảng viên nắm bắt tình hình học tập của bạn.`
            )
        }
    }

    const confirmSendReminder = () => {
        if (reminderSurveyId && reminderMessage) {
            // TODO: Send reminder notification to incomplete students
            console.log("Sending reminder for survey:", reminderSurveyId)
            console.log("Message:", reminderMessage)
            alert("Đã gửi nhắc nhở đến các sinh viên chưa hoàn thành khảo sát!")
            setShowReminderDialog(false)
            setReminderSurveyId(null)
            setReminderMessage("")
        }
    }

    const handleEditSurvey = (surveyId: string) => {
        const survey = mockActiveSurveys.find(s => s.id === surveyId)
        if (survey) {
            // Load survey data into create form
            setSurveyTitle(survey.title)
            setSurveyType(survey.type)
            setSurveyDueDate(survey.dueDate)
            setTargetFaculty(survey.faculty)
            setTargetClass(survey.className)
            setEditingSurveyId(surveyId)
            setActiveTab("create")
            // TODO: Load existing questions
            alert("Đã chuyển sang chế độ chỉnh sửa. Bạn có thể cập nhật thông tin khảo sát.")
        }
    }

    const handleCreateSurvey = () => {
        // Validate required fields
        if (!surveyTitle.trim()) {
            alert("Vui lòng nhập tiêu đề khảo sát!")
            return
        }
        if (!surveyDueDate) {
            alert("Vui lòng chọn hạn hoàn thành!")
            return
        }
        if (questions.length === 0) {
            alert("Vui lòng thêm ít nhất một câu hỏi!")
            return
        }
        if (targetFaculty === "all" && targetClass === "all") {
            const confirm = window.confirm(
                "Bạn đang tạo khảo sát cho TẤT CẢ sinh viên. Bạn có chắc chắn muốn tiếp tục?"
            )
            if (!confirm) return
        }

        // Create new survey object
        const newSurvey: Survey = {
            id: `survey_${Date.now()}`,
            title: surveyTitle,
            type: surveyType,
            semester: selectedSemester.toUpperCase(),
            academicYear: selectedYear,
            createdDate: new Date().toISOString().split('T')[0],
            dueDate: surveyDueDate,
            status: "active",
            totalStudents: targetClass === "all" ? 450 : 150,
            completedResponses: 0,
            avgCompletion: 0,
            faculty: targetFaculty === "all" ? "Tất cả khoa" : targetFaculty,
            className: targetClass === "all" ? "Tất cả lớp" : targetClass
        }

        // TODO: Save survey to backend
        console.log("Creating new survey:", newSurvey)
        console.log("Survey questions:", questions)

        alert(
            editingSurveyId
                ? "Đã cập nhật khảo sát thành công!"
                : `Đã tạo khảo sát thành công! Khảo sát đã được gửi đến ${newSurvey.totalStudents} sinh viên.`
        )

        // Reset form and switch to active tab
        resetSurveyForm()
        setActiveTab("active")
    }

    const resetSurveyForm = () => {
        setSurveyTitle("")
        setSurveyType("beginning")
        setSurveyDueDate("")
        setTargetFaculty("all")
        setTargetClass("all")
        setQuestions([])
        setShowPreview(false)
        setSurveyDescription("")
        setEditingSurveyId(null)
    }

    // Render functions
    const renderFilters = () => (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Khoa</label>
                        <select
                            value={selectedFaculty}
                            onChange={(e) => setSelectedFaculty(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="all">Tất cả khoa</option>
                            {faculties.map((faculty, idx) => (
                                <option key={idx} value={faculty}>{faculty}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Lớp</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="all">Tất cả lớp</option>
                            {classes.map((cls, idx) => (
                                <option key={idx} value={cls}>{cls}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Năm học</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="2024-2025">2024-2025</option>
                            <option value="2023-2024">2023-2024</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Học kỳ</label>
                        <select
                            value={selectedSemester}
                            onChange={(e) => setSelectedSemester(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="hk1">Học kỳ 1</option>
                            <option value="hk2">Học kỳ 2</option>
                            <option value="hk3">Học kỳ 3</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-2 block">Loại khảo sát</label>
                        <select
                            value={selectedSurveyType}
                            onChange={(e) => setSelectedSurveyType(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded-lg"
                        >
                            <option value="all">Tất cả</option>
                            <option value="beginning">Đầu kỳ</option>
                            <option value="midterm">Giữa kỳ</option>
                            <option value="final">Cuối kỳ</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Tìm kiếm theo tên khảo sát, sinh viên..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const renderSurveyCard = (survey: Survey, showActions: boolean = true) => (
        <Card key={survey.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(survey.status)}>
                                {survey.status === "active" ? "Đang diễn ra" :
                                    survey.status === "completed" ? "Đã hoàn thành" :
                                        survey.status === "draft" ? "Nháp" : "Hết hạn"}
                            </Badge>
                            <Badge variant="outline">{getTypeText(survey.type)}</Badge>
                        </div>
                        <CardTitle className="text-lg">{survey.title}</CardTitle>
                        <CardDescription className="mt-2">
                            {survey.faculty} - {survey.className}
                        </CardDescription>
                    </div>
                    {showActions && (
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>Tạo: {survey.createdDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>Hạn: {survey.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span>{survey.totalStudents} sinh viên</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>{survey.completedResponses} đã hoàn thành</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Tiến độ hoàn thành</span>
                            <span className="text-sm font-bold text-blue-600">{survey.avgCompletion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${survey.avgCompletion}%` }}
                            />
                        </div>
                    </div>

                    {showActions && survey.status === "active" && (
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleSendReminder(survey.id)}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Nhắc nhở
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleEditSurvey(survey.id)}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Sửa
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    const renderActiveSurveys = () => (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Tổng số khảo sát</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold">{mockActiveSurveys.length}</span>
                            <ClipboardList className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Đang diễn ra</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Tổng phản hồi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold">
                                {mockActiveSurveys.reduce((sum, s) => sum + s.completedResponses, 0)}
                            </span>
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            / {mockActiveSurveys.reduce((sum, s) => sum + s.totalStudents, 0)} sinh viên
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Trung bình hoàn thành</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold">
                                {Math.round(mockActiveSurveys.reduce((sum, s) => sum + s.avgCompletion, 0) / mockActiveSurveys.length)}%
                            </span>
                            <BarChart3 className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Tỷ lệ hoàn thành</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockActiveSurveys.map(survey => renderSurveyCard(survey))}
            </div>
        </div>
    )

    const renderHistorySurveys = () => (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Tổng khảo sát</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold">{mockCompletedSurveys.length}</span>
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Đã hoàn thành</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Tổng sinh viên</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold">{mockStudentHistory.length}</span>
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Đã tham gia khảo sát</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Cải thiện</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-green-600">
                                {mockStudentHistory.filter(s => s.trend === "improving").length}
                            </span>
                            <TrendingUp className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Đang tiến bộ</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Cần hỗ trợ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-red-600">
                                {mockStudentHistory.filter(s => s.riskLevel === "high").length}
                            </span>
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Mức độ cao</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {mockCompletedSurveys.map(survey => renderSurveyCard(survey, false))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử khảo sát sinh viên</CardTitle>
                    <CardDescription>
                        Theo dõi chi tiết kết quả khảo sát và xu hướng phát triển của từng sinh viên
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {mockStudentHistory.map(student => (
                            <div key={student.studentId} className="border rounded-lg">
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleStudentExpand(student.studentId)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div>
                                                <p className="font-medium">{student.studentName}</p>
                                                <p className="text-sm text-gray-600">{student.studentCode}</p>
                                            </div>
                                            <Badge variant="outline" className="ml-2">
                                                {student.surveys.length} lần khảo sát
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {getTrendIcon(student.trend)}
                                                <span className="text-sm text-gray-600">
                                                    {student.trend === "improving" ? "Đang cải thiện" :
                                                        student.trend === "declining" ? "Đang giảm" : "Ổn định"}
                                                </span>
                                            </div>
                                            <Badge className={getRiskColor(student.riskLevel)}>
                                                {student.riskLevel === "high" ? "Cần hỗ trợ" :
                                                    student.riskLevel === "medium" ? "Theo dõi" : "Tốt"}
                                            </Badge>
                                            <ChevronDown
                                                className={`w-5 h-5 transition-transform ${expandedStudents.includes(student.studentId) ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {expandedStudents.includes(student.studentId) && (
                                    <div className="px-4 pb-4 border-t">
                                        <div className="space-y-4 pt-4">
                                            {student.surveys.map((survey, idx) => (
                                                <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <p className="font-medium">{survey.surveyType}</p>
                                                            <p className="text-sm text-gray-600">
                                                                Hoàn thành: {survey.completedDate}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium text-gray-600">Điểm trung bình</p>
                                                            <p className="text-2xl font-bold text-blue-600">
                                                                {(
                                                                    (survey.scores.financial +
                                                                        survey.scores.mental +
                                                                        survey.scores.academic +
                                                                        survey.scores.social) / 4
                                                                ).toFixed(1)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm">💰 Tài chính</span>
                                                                <span className="text-sm font-medium">
                                                                    {survey.scores.financial}/10
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-green-600 h-2 rounded-full"
                                                                    style={{ width: `${survey.scores.financial * 10}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm">🧠 Tâm lý</span>
                                                                <span className="text-sm font-medium">
                                                                    {survey.scores.mental}/10
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full"
                                                                    style={{ width: `${survey.scores.mental * 10}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm">📚 Học tập</span>
                                                                <span className="text-sm font-medium">
                                                                    {survey.scores.academic}/10
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-purple-600 h-2 rounded-full"
                                                                    style={{ width: `${survey.scores.academic * 10}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-sm">👥 Xã hội</span>
                                                                <span className="text-sm font-medium">
                                                                    {survey.scores.social}/10
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-orange-600 h-2 rounded-full"
                                                                    style={{ width: `${survey.scores.social * 10}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {survey.notes && (
                                                        <div className="bg-white p-3 rounded border">
                                                            <div className="flex items-start gap-2">
                                                                <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-medium text-gray-600 mb-1">Ghi chú từ giảng viên:</p>
                                                                    <p className="text-sm text-gray-700">{survey.notes}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )

    const renderCreateSurvey = () => (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Câu hỏi đã tạo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold">{questions.length}</span>
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {questions.length === 0 ? "Chưa có câu hỏi" : "câu hỏi"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Đối tượng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold">
                                {targetFaculty === "all" && targetClass === "all" ? "Tất cả" :
                                    targetClass === "all" ? "1 khoa" : "1 lớp"}
                            </span>
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {targetFaculty === "all" && targetClass === "all" ? "450 sinh viên" :
                                targetClass === "all" ? "~200 sinh viên" : "~50 sinh viên"}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Trạng thái</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold">
                                {editingSurveyId ? "Chỉnh sửa" : "Mới"}
                            </span>
                            <ClipboardList className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            {editingSurveyId ? "Đang cập nhật" : "Đang tạo"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {editingSurveyId && (
                <Card className="mb-6 bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-blue-700">
                            <AlertTriangle className="w-5 h-5" />
                            <div>
                                <p className="font-medium">Đang chỉnh sửa khảo sát</p>
                                <p className="text-sm">Các thay đổi sẽ được cập nhật vào khảo sát đang diễn ra</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto"
                                onClick={resetSurveyForm}
                            >
                                Hủy chỉnh sửa
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Thông tin khảo sát</CardTitle>
                    <CardDescription>Điền thông tin cơ bản cho bản khảo sát mới</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Tiêu đề khảo sát *</label>
                            <Input
                                placeholder="VD: Khảo sát đầu học kỳ I - 2024-2025"
                                value={surveyTitle}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSurveyTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Mô tả khảo sát</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={3}
                                placeholder="Mô tả mục đích và nội dung của khảo sát..."
                                value={surveyDescription}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSurveyDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Loại khảo sát *</label>
                                <select
                                    value={surveyType}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSurveyType(e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="beginning">Đầu kỳ - Thu thập thông tin ban đầu</option>
                                    <option value="midterm">Giữa kỳ - Đánh giá tiến độ học tập</option>
                                    <option value="final">Cuối kỳ - Tổng kết và đánh giá</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Hạn hoàn thành *</label>
                                <Input
                                    type="date"
                                    value={surveyDueDate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSurveyDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Khoa *</label>
                                <select
                                    value={targetFaculty}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetFaculty(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="all">Tất cả khoa (~450 sinh viên)</option>
                                    {faculties.map((faculty, idx) => (
                                        <option key={idx} value={faculty}>{faculty}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Lớp</label>
                                <select
                                    value={targetClass}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetClass(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    disabled={targetFaculty === "all"}
                                >
                                    <option value="all">Tất cả lớp của khoa</option>
                                    {classes.map((cls, idx) => (
                                        <option key={idx} value={cls}>{cls}</option>
                                    ))}
                                </select>
                                {targetFaculty === "all" && (
                                    <p className="text-xs text-gray-500 mt-1">Chọn một khoa để lọc theo lớp</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Câu hỏi khảo sát</CardTitle>
                            <CardDescription>Thêm câu hỏi để thu thập thông tin từ sinh viên</CardDescription>
                        </div>
                        <Button onClick={addQuestion}>
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm câu hỏi
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {questions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="mb-2">Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu</p>
                            <p className="text-sm">Gợi ý: Thêm câu hỏi về tài chính, tâm lý, học tập và xã hội</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question, idx) => (
                                <div key={question.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="font-medium text-blue-600">Câu hỏi {idx + 1}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeQuestion(question.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Danh mục *</label>
                                            <select
                                                value={question.category}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuestion(question.id, "category", e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            >
                                                <option value="financial">💰 Tài chính - Tình hình kinh tế và chi tiêu</option>
                                                <option value="mental">🧠 Tâm lý - Tinh thần và sức khỏe</option>
                                                <option value="academic">📚 Học tập - Thành tích và khó khăn</option>
                                                <option value="social">👥 Xã hội - Quan hệ và hoạt động</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">Câu hỏi *</label>
                                            <Input
                                                placeholder="Nhập nội dung câu hỏi..."
                                                value={question.question}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(question.id, "question", e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Loại câu hỏi *</label>
                                                <select
                                                    value={question.type}
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuestion(question.id, "type", e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                >
                                                    <option value="scale">Thang điểm (1-10)</option>
                                                    <option value="text">Văn bản tự do</option>
                                                    <option value="choice">Lựa chọn</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Trọng số *</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={question.weight}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(question.id, "weight", parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                        </div>

                                        {question.type === "choice" && (
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                    Các lựa chọn * (mỗi dòng 1 lựa chọn)
                                                </label>
                                                <textarea
                                                    className="w-full px-3 py-2 border rounded-lg"
                                                    rows={3}
                                                    placeholder="Lựa chọn A&#10;Lựa chọn B&#10;Lựa chọn C"
                                                    value={question.options?.join("\n") || ""}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion(question.id, "options", e.target.value.split("\n"))}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {questions.length > 0 && (
                        <div className="flex gap-3 mt-6 pt-6 border-t">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                {showPreview ? "Ẩn" : "Xem"} trước
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleCreateSurvey}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {editingSurveyId ? "Cập nhật khảo sát" : "Tạo và gửi khảo sát"}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showPreview && questions.length > 0 && (
                <Card className="mt-6 border-2 border-blue-200">
                    <CardHeader className="bg-blue-50">
                        <CardTitle>Xem trước khảo sát</CardTitle>
                        <CardDescription>
                            {surveyTitle || "Chưa có tiêu đề"} - {getTypeText(surveyType)}
                            {surveyDueDate && ` - Hạn: ${surveyDueDate}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {surveyDescription && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">{surveyDescription}</p>
                            </div>
                        )}
                        <div className="space-y-4">
                            {questions.map((question, idx) => (
                                <div key={question.id} className="bg-white border p-4 rounded-lg">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="font-medium text-lg">{idx + 1}.</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-base">{question.question || "Chưa có câu hỏi"}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm text-gray-600">
                                                    {question.category === "financial" && "💰 Tài chính"}
                                                    {question.category === "mental" && "🧠 Tâm lý"}
                                                    {question.category === "academic" && "📚 Học tập"}
                                                    {question.category === "social" && "👥 Xã hội"}
                                                </span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <Badge variant="outline" className="text-xs">Trọng số: {question.weight}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-6">
                                        {question.type === "scale" && (
                                            <div className="flex gap-2 flex-wrap">
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                    <div key={num} className="w-10 h-10 border-2 rounded hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center text-sm font-medium cursor-pointer transition-colors">
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {question.type === "text" && (
                                            <textarea
                                                className="w-full p-3 border-2 rounded-lg bg-gray-50"
                                                rows={3}
                                                placeholder="Sinh viên sẽ nhập câu trả lời tại đây..."
                                                disabled
                                            />
                                        )}
                                        {question.type === "choice" && (
                                            <div className="space-y-2">
                                                {question.options?.filter(opt => opt.trim()).map((option, optIdx) => (
                                                    <label key={optIdx} className="flex items-center gap-3 p-2 border rounded hover:bg-gray-50 cursor-pointer transition-colors">
                                                        <input type="radio" name={question.id} className="w-4 h-4" disabled />
                                                        <span>{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )

    return (
        <TeacherLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Khảo sát sinh viên</h1>
                    <p className="text-gray-600">
                        Quản lý khảo sát định kỳ để theo dõi tình hình sinh viên và hỗ trợ dự đoán điểm
                    </p>
                </div>

                {renderFilters()}

                <div className="mb-6">
                    <div className="flex gap-2 border-b">
                        <button
                            className={`px-6 py-3 font-medium transition-colors ${activeTab === "active"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                            onClick={() => setActiveTab("active")}
                        >
                            Đang khảo sát
                        </button>
                        <button
                            className={`px-6 py-3 font-medium transition-colors ${activeTab === "history"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                            onClick={() => setActiveTab("history")}
                        >
                            Lịch sử khảo sát
                        </button>
                        <button
                            className={`px-6 py-3 font-medium transition-colors ${activeTab === "create"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                            onClick={() => setActiveTab("create")}
                        >
                            Tạo khảo sát mới
                        </button>
                    </div>
                </div>

                <div>
                    {activeTab === "active" && renderActiveSurveys()}
                    {activeTab === "history" && renderHistorySurveys()}
                    {activeTab === "create" && renderCreateSurvey()}
                </div>

                {/* Reminder Dialog */}
                {showReminderDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                            <div className="flex items-center gap-3 mb-4">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                                <h3 className="text-xl font-bold">Gửi nhắc nhở</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Nhắc nhở sẽ được gửi đến các sinh viên chưa hoàn thành khảo sát qua thông báo hệ thống và email.
                            </p>
                            <div className="mb-4">
                                <label className="text-sm font-medium mb-2 block">Nội dung nhắc nhở</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows={5}
                                    value={reminderMessage}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReminderMessage(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowReminderDialog(false)
                                        setReminderSurveyId(null)
                                        setReminderMessage("")
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={confirmSendReminder}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Gửi nhắc nhở
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TeacherLayout>
    )
}

export default StudentSurveyManagement
