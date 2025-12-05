import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import TeacherLayout from "./components/TeacherLayout"
import { useState, useEffect } from "react"
import { useSurveys } from "../../hooks/useSurveys"
import { useToast } from "../../lib/useToast"
import { useFilterOptions } from "../../hooks/useFilterOptions"
import {
    ClipboardList,
    TrendingUp,
    Users,
    Calendar,
    Clock,
    Search,
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
    status: "draft" | "active" | "completed" | "expired" | "closed"
    totalStudents: number
    completedResponses: number
    avgCompletion: number
    faculty: string
    className: string
    description?: string
    reminders: number
    lastReminderDate?: string
    averageScore?: number
    riskStudents: number
    completedStudents: StudentResponse[]
    incompleteStudents: IncompleteStudent[]
}

interface SurveyQuestion {
    id: string
    category: string
    question: string
    type: "scale" | "text" | "choice"
    options?: string[]
    weight: number
    isRequired: boolean
    helpText?: string
}

interface StudentResponse {
    studentId: string
    studentName: string
    studentCode: string
    completedDate: string
    responses: QuestionResponse[]
    overallScore: number
    categoryScores: {
        financial: number
        mental: number
        academic: number
        social: number
    }
    riskLevel: "low" | "medium" | "high"
    flags: string[]
    notes?: string
}

interface QuestionResponse {
    questionId: string
    answer: string | number
    category: string
}

interface IncompleteStudent {
    studentId: string
    studentName: string
    studentCode: string
    lastAccess?: string
    remindersSent: number
    email: string
    phoneNumber?: string
}

const StudentSurveyManagement = () => {
    // Filter states
    const [selectedFaculty, setSelectedFaculty] = useState("all")
    const [selectedClass, setSelectedClass] = useState("all")
    const [selectedYear, setSelectedYear] = useState("all")
    const [selectedSemester, setSelectedSemester] = useState("all")
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

    // Additional states for enhanced features
    const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null)
    const [showReminderDialog, setShowReminderDialog] = useState(false)
    const [reminderSurveyId, setReminderSurveyId] = useState<string | null>(null)
    const [reminderMessage, setReminderMessage] = useState("")
    const [showDetailView, setShowDetailView] = useState(false)
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
    const [showAnalytics, setShowAnalytics] = useState(false)
    const [showIncompleteModal, setShowIncompleteModal] = useState(false)
    const [selectedIncompleteStudents, setSelectedIncompleteStudents] = useState<IncompleteStudent[]>([])
    const [bulkReminderMessage, setBulkReminderMessage] = useState("")
    const [showQuestionBank, setShowQuestionBank] = useState(false)
    const [questionBankCategory, setQuestionBankCategory] = useState<string>("all")

    // Toast notifications
    const toast = useToast()

    // API Hook - Replace mock data
    const {
        surveys: apiSurveys,
        dashboard: apiDashboard,
        loading,
        error,
        fetchDashboard,
        fetchSurveys,
        createSurvey: apiCreateSurvey,
        deleteSurvey: apiDeleteSurvey,
        exportResponses: apiExportResponses,
        getAvailableQuestions: apiGetAvailableQuestions,
        // These will be used later for detail views and analytics
        // getSurveyDetail,
        // getSurveyAnalytics,
        // sendReminder,
    } = useSurveys()

    // State for available questions from database
    const [availableQuestions, setAvailableQuestions] = useState<any[]>([])
    const [loadingQuestions, setLoadingQuestions] = useState(false)

    // Use shared filter options hook
    const { filterOptions, loading: loadingFilters } = useFilterOptions()

    // Helper function to map question type from API to component format
    const mapQuestionTypeToComponent = (apiType: string): "scale" | "text" | "choice" => {
        switch (apiType) {
            case 'multiple-choice':
                return 'choice'
            case 'scale':
            case 'rating':
                return 'scale'
            case 'text':
            default:
                return 'text'
        }
    }

    // Helper function to convert API question to component format
    const convertApiQuestionToComponent = (apiQuestion: any): SurveyQuestion => {
        return {
            id: apiQuestion.id?.toString() || `q${Date.now()}`,
            category: apiQuestion.category || 'academic',
            question: apiQuestion.question || '',
            type: mapQuestionTypeToComponent(apiQuestion.type),
            options: apiQuestion.options || undefined,
            weight: 1,
            isRequired: true,
            helpText: undefined
        }
    }

    // Load data on mount and when filters change
    useEffect(() => {
        fetchDashboard()
        // For active tab, fetch all to include both draft and active
        // For history tab, fetch only closed
        if (activeTab === 'active') {
            fetchSurveys({ status: 'all' }) // Get both draft and active
        } else {
            fetchSurveys({ status: 'closed' }) // Get only closed
        }
    }, [activeTab])

    // Load available questions from database on mount
    useEffect(() => {
        const loadAvailableQuestions = async () => {
            setLoadingQuestions(true)
            try {
                const questions = await apiGetAvailableQuestions()
                setAvailableQuestions(questions || [])
            } catch (error) {
                console.error('Error loading questions:', error)
            } finally {
                setLoadingQuestions(false)
            }
        }
        loadAvailableQuestions()
    }, [])

    // Helper function to map backend status to frontend status
    const mapStatusToFrontend = (backendStatus: string): "draft" | "active" | "completed" | "expired" => {
        switch (backendStatus) {
            case 'active':
                return 'active'
            case 'closed':
                return 'completed'
            case 'draft':
                return 'draft'
            default:
                return 'expired'
        }
    }

    // Mock data for compatibility (will be gradually replaced)
    // Active tab shows: draft and active surveys
    const mockActiveSurveys: Survey[] = apiSurveys
        .filter(s => s.status === 'active' || s.status === 'draft')
        .map(s => ({
            id: s.id,
            title: s.title,
            type: "beginning" as const,
            semester: "HK1",
            academicYear: "2024-2025",
            createdDate: s.createdAt || new Date().toISOString().split('T')[0],
            dueDate: s.endDate || new Date().toISOString().split('T')[0],
            status: mapStatusToFrontend(s.status),
            totalStudents: 150,
            completedResponses: s.totalResponses || 0,
            avgCompletion: Math.round(s.responseRate || 0),
            faculty: "Khoa Công nghệ thông tin",
            className: "CNTT-K19A",
            description: s.description,
            reminders: 0,
            averageScore: 7.2,
            riskStudents: 0,
            completedStudents: [],
            incompleteStudents: []
        }))

    const mockCompletedSurveys: Survey[] = apiSurveys.filter(s => s.status === 'closed').map(s => ({
        id: s.id,
        title: s.title,
        type: "final" as const,
        semester: "HK2",
        academicYear: "2023-2024",
        createdDate: s.createdAt || new Date().toISOString().split('T')[0],
        dueDate: s.endDate || new Date().toISOString().split('T')[0],
        status: mapStatusToFrontend(s.status),
        totalStudents: 145,
        completedResponses: s.totalResponses || 0,
        avgCompletion: 100,
        faculty: "Khoa Công nghệ thông tin",
        className: "CNTT-K19A",
        description: s.description,
        reminders: 3,
        lastReminderDate: "2024-05-18",
        averageScore: 7.8,
        riskStudents: 8,
        completedStudents: [],
        incompleteStudents: []
    }))

    // Filter function to apply all filters
    const applyFilters = (surveys: Survey[]): Survey[] => {
        return surveys.filter(survey => {
            // Filter by faculty
            if (selectedFaculty !== 'all' && survey.faculty !== selectedFaculty) {
                return false
            }

            // Filter by class
            if (selectedClass !== 'all' && survey.className !== selectedClass) {
                return false
            }

            // Filter by academic year
            if (selectedYear !== 'all' && survey.academicYear !== selectedYear) {
                return false
            }

            // Filter by semester
            if (selectedSemester !== 'all') {
                const semesterMap: Record<string, string> = {
                    'hk1': 'HK1',
                    'hk2': 'HK2',
                    'hk3': 'HK3'
                }
                if (survey.semester !== semesterMap[selectedSemester]) {
                    return false
                }
            }

            // Filter by survey type
            if (selectedSurveyType !== 'all' && survey.type !== selectedSurveyType) {
                return false
            }

            // Filter by search term
            if (searchTerm.trim() !== '') {
                const searchLower = searchTerm.toLowerCase()
                const titleMatch = survey.title.toLowerCase().includes(searchLower)
                const facultyMatch = survey.faculty.toLowerCase().includes(searchLower)
                const classMatch = survey.className.toLowerCase().includes(searchLower)

                if (!titleMatch && !facultyMatch && !classMatch) {
                    return false
                }
            }

            return true
        })
    }

    // Apply filters to surveys
    const filteredActiveSurveys = applyFilters(mockActiveSurveys)
    const filteredCompletedSurveys = applyFilters(mockCompletedSurveys)

    // Enhanced helper functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-500"
            case "completed":
            case "closed": return "bg-blue-500"
            case "draft": return "bg-gray-500"
            case "expired": return "bg-red-500"
            default: return "bg-gray-500"
        }
    }

    const viewSurveyDetails = (survey: Survey) => {
        setSelectedSurvey(survey)
        setShowDetailView(true)
    }

    const viewSurveyAnalytics = (survey: Survey) => {
        setSelectedSurvey(survey)
        setShowAnalytics(true)
    }

    const viewIncompleteStudents = (survey: Survey) => {
        // Mock incomplete students data
        const mockIncomplete: IncompleteStudent[] = [
            {
                studentId: "SV003",
                studentName: "Lê Văn C",
                studentCode: "19IT003",
                lastAccess: "2024-09-10",
                remindersSent: 2,
                email: "levanc@student.edu.vn",
                phoneNumber: "0123456789"
            },
            {
                studentId: "SV004",
                studentName: "Phạm Thị D",
                studentCode: "19IT004",
                lastAccess: "2024-09-08",
                remindersSent: 1,
                email: "phamthid@student.edu.vn",
                phoneNumber: "0987654321"
            }
        ]
        setSelectedIncompleteStudents(mockIncomplete)
        setShowIncompleteModal(true)
        setBulkReminderMessage(
            `Thông báo quan trọng: Khảo sát "${survey.title}" sẽ hết hạn vào ${survey.dueDate}. ` +
            `Vui lòng hoàn thành khảo sát để giúp giảng viên nắm bắt tình hình học tập và hỗ trợ bạn tốt hơn. ` +
            `Truy cập hệ thống học tập để thực hiện khảo sát.`
        )
    }

    const sendBulkReminder = () => {
        if (selectedIncompleteStudents.length > 0 && bulkReminderMessage.trim()) {
            // Bulk reminder API integration point
            toast.success(`Đã gửi nhắc nhở đến ${selectedIncompleteStudents.length} sinh viên`)
            setShowIncompleteModal(false)
            setSelectedIncompleteStudents([])
            setBulkReminderMessage("")
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

    const addQuestion = () => {
        const newQuestion: SurveyQuestion = {
            id: `q${questions.length + 1}`,
            category: "financial",
            question: "",
            type: "scale",
            weight: 1,
            isRequired: true
        }
        setQuestions([...questions, newQuestion])
    }

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id))
    }

    const updateQuestion = (id: string, field: keyof SurveyQuestion, value: any) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                // If changing category, reset question text to empty
                if (field === 'category') {
                    return { ...q, category: value, question: '' };
                }
                return { ...q, [field]: value };
            }
            return q;
        }))
    }

    // Check for duplicate or similar questions
    const checkDuplicateQuestion = (newQuestion: string, currentQuestionId: string): boolean => {
        // Normalize strings for comparison
        const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ')
        const normalizedNew = normalize(newQuestion)

        // Check exact duplicates (EXCLUDE current question being edited)
        const exactDuplicate = questions.find(q => 
            q.id !== currentQuestionId && // Skip current question
            normalize(q.question) === normalizedNew
        )
        if (exactDuplicate) {
            toast.error("Câu hỏi đã tồn tại")
            return true
        }

        // Simple similarity check (can be improved)
        const calculateSimilarity = (str1: string, str2: string): number => {
            const s1 = normalize(str1)
            const s2 = normalize(str2)
            
            if (s1 === s2) return 1
            if (s1.length === 0 || s2.length === 0) return 0
            
            // Count matching words
            const words1 = s1.split(' ')
            const words2 = s2.split(' ')
            const commonWords = words1.filter(w => words2.includes(w) && w.length > 2)
            
            const similarity = (2 * commonWords.length) / (words1.length + words2.length)
            return similarity
        }

        // Check for high similarity (>70%) - EXCLUDE current question
        for (const q of questions) {
            if (q.id !== currentQuestionId && q.question && newQuestion) {
                const similarity = calculateSimilarity(q.question, newQuestion)
                if (similarity > 0.7 && similarity < 1.0) {
                    toast.warning(
                        `Câu hỏi này có vẻ tương tự với: "${q.question}". ` +
                        `Vui lòng kiểm tra lại để tránh trùng lặp.`
                    )
                    return false // Warning, but allow to proceed
                }
            }
        }

        return false
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
            // Reminder notification API integration point
            toast.success("Đã gửi nhắc nhở")
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
            // Survey edit mode - questions loaded from API
            toast.info("Chế độ chỉnh sửa")
        }
    }

    const handleCreateSurvey = async () => {
        // Validate required fields
        if (!surveyTitle.trim()) {
            toast.warning("Chưa nhập tiêu đề")
            return
        }
        if (!surveyDueDate) {
            toast.warning("Chưa chọn hạn hoàn thành")
            return
        }
        if (questions.length === 0) {
            toast.warning("Chưa có câu hỏi nào")
            return
        }

        // ✅ VALIDATE: Check for duplicate questions BEFORE submitting
        const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ')
        const questionTexts = new Map<string, number>() // normalized text -> count
        
        for (const q of questions) {
            if (!q.question || !q.question.trim()) {
                toast.error(`Câu hỏi ${questions.indexOf(q) + 1} chưa có nội dung`)
                return
            }
            
            const normalized = normalize(q.question)
            const count = questionTexts.get(normalized) || 0
            questionTexts.set(normalized, count + 1)
        }

        // Find duplicates
        const duplicates = Array.from(questionTexts.entries())
            .filter(([_, count]) => count > 1)
            .map(([text]) => text)

        if (duplicates.length > 0) {
            // Find the original question text for better error message
            const firstDuplicate = questions.find(q => 
                normalize(q.question) === duplicates[0]
            )
            toast.error(
                `Phát hiện câu hỏi trùng lặp: "${firstDuplicate?.question}". ` +
                `Vui lòng xóa hoặc chỉnh sửa các câu hỏi trùng lặp trước khi tạo khảo sát.`
            )
            return
        }

        if (targetFaculty === "all" && targetClass === "all") {
            const confirm = window.confirm(
                "Bạn đang tạo khảo sát cho TẤT CẢ sinh viên. Bạn có chắc chắn muốn tiếp tục?"
            )
            if (!confirm) return
        }

        try {
            // Map frontend question types to backend format
            const mapTypeToBackend = (type: string): string => {
                switch (type) {
                    case 'choice':
                        return 'multiple-choice'
                    case 'scale':
                        return 'scale'
                    case 'text':
                        return 'text'
                    default:
                        return 'text'
                }
            }

            // Call API to create survey
            const surveyData = {
                title: surveyTitle,
                description: surveyDescription,
                startDate: new Date().toISOString().split('T')[0],
                endDate: surveyDueDate,
                questions: questions.map(q => ({
                    question: q.question,
                    type: mapTypeToBackend(q.type),
                    category: q.category,
                    options: q.options,
                    required: q.isRequired
                })),
                targetClasses: targetClass === "all" ? [] : [targetClass]
            }

            await apiCreateSurvey(surveyData)

            toast.success(
                editingSurveyId
                    ? "Đã cập nhật khảo sát"
                    : "Đã tạo khảo sát thành công"
            )

            // Reset form and reload data
            resetSurveyForm()
            setActiveTab("active")
            fetchSurveys({ status: 'active' })
        } catch (error: any) {
            console.error('Error creating survey:', error)
            const errorMessage = error.response?.data?.message || error.message || "Không thể tạo khảo sát. Vui lòng thử lại!"
            
            // Show detailed error message
            toast.error(errorMessage)
        }
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
    const renderFilters = () => {
        // Count active filters
        const activeFilterCount =
            (selectedFaculty !== 'all' ? 1 : 0) +
            (selectedClass !== 'all' ? 1 : 0) +
            (selectedYear !== 'all' ? 1 : 0) +
            (selectedSemester !== 'all' ? 1 : 0) +
            (selectedSurveyType !== 'all' ? 1 : 0) +
            (searchTerm.trim() !== '' ? 1 : 0)

        const resetFilters = () => {
            setSelectedFaculty('all')
            setSelectedClass('all')
            setSelectedYear('all')
            setSelectedSemester('all')
            setSelectedSurveyType('all')
            setSearchTerm('')
            toast.info('Đã xóa bộ lọc')
        }

        return (
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Bộ lọc</h3>
                        {activeFilterCount > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                    {activeFilterCount} bộ lọc đang áp dụng
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="text-sm"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Xóa bộ lọc
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Khoa</label>
                            <select
                                value={selectedFaculty}
                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                disabled={loadingFilters}
                            >
                                <option value="all">Tất cả khoa</option>
                                {filterOptions.faculties.map((faculty, idx) => (
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
                                disabled={loadingFilters}
                            >
                                <option value="all">Tất cả lớp</option>
                                {filterOptions.classes.map((cls, idx) => (
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
                                disabled={loadingFilters}
                            >
                                <option value="all">Tất cả năm học</option>
                                {filterOptions.academicYears.map((year, idx) => (
                                    <option key={idx} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">Học kỳ</label>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                disabled={loadingFilters}
                            >
                                <option value="all">Tất cả học kỳ</option>
                                {filterOptions.semesters.map((semester, idx) => (
                                    <option key={idx} value={semester.toLowerCase()}>{`Học kỳ ${semester.replace('HK', '')}`}</option>
                                ))}
                            </select>
                        </div>                        <div className="flex-1 min-w-[200px]">
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
    }

    const renderSurveyCard = (survey: Survey, showActions: boolean = true) => (
        <Card key={survey.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(survey.status)}>
                                {survey.status === "active" ? "Đang diễn ra" :
                                    survey.status === "completed" || survey.status === "closed" ? "Đã hoàn thành" :
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
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewSurveyDetails(survey)}
                                title="Xem chi tiết"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewSurveyAnalytics(survey)}
                                title="Xem phân tích"
                            >
                                <BarChart3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewIncompleteStudents(survey)}
                                title="Sinh viên chưa làm"
                            >
                                <Users className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={async () => {
                                const success = await apiExportResponses(survey.id)
                                if (success) toast.success("Đã tải xuống")
                            }}>
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                    // Enhanced confirmation for active surveys
                                    let confirmMessage = `Bạn có chắc muốn xóa khảo sát "${survey.title}"?`
                                    
                                    if (survey.status === 'active') {
                                        confirmMessage = `⚠️ CẢNH BÁO: Khảo sát "${survey.title}" đang HOẠT ĐỘNG!\n\n` +
                                            `Việc xóa sẽ:\n` +
                                            `- Khiến sinh viên không thể truy cập khảo sát này nữa\n` +
                                            `- Xóa vĩnh viễn nếu chưa có phản hồi nào\n\n` +
                                            `Bạn có chắc chắn muốn XÓA không?\n` +
                                            `(Gợi ý: Nên ĐÓNG khảo sát thay vì xóa)`
                                    }
                                    
                                    if (confirm(confirmMessage)) {
                                        const success = await apiDeleteSurvey(survey.id)
                                        if (success) {
                                            toast.success("Đã xóa khảo sát")
                                            // Refetch based on current tab
                                            await Promise.all([
                                                fetchSurveys({ status: activeTab === 'active' ? 'all' : 'closed' }),
                                                fetchDashboard()
                                            ])
                                        }
                                    }
                                }}
                                title="Xóa khảo sát"
                                className={survey.status === 'active' ? 'hover:bg-red-50' : ''}
                            >
                                <X className="w-4 h-4 text-red-600" />
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

    const renderActiveSurveys = () => {
        // Use filtered data for statistics if filters are active
        const hasActiveFilters = selectedFaculty !== 'all' || selectedClass !== 'all' ||
            selectedYear !== '2024-2025' || selectedSemester !== 'hk1' ||
            selectedSurveyType !== 'all' || searchTerm.trim() !== ''

        const surveysToCount = hasActiveFilters ? filteredActiveSurveys : mockActiveSurveys

        const activeSurveysCount = apiDashboard?.activeSurveys || surveysToCount.length
        const totalResponses = apiDashboard?.totalResponses || surveysToCount.reduce((sum, s) => sum + s.completedResponses, 0)
        const avgResponseRate = apiDashboard?.averageResponseRate ||
            (surveysToCount.length > 0 ? Math.round(surveysToCount.reduce((sum, s) => sum + s.avgCompletion, 0) / surveysToCount.length) : 0)

        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600">Tổng số khảo sát</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold">{activeSurveysCount}</span>
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
                                <span className="text-3xl font-bold">{totalResponses}</span>
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Phản hồi đã nhận</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600">Trung bình hoàn thành</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold">{avgResponseRate}%</span>
                                <BarChart3 className="w-8 h-8 text-purple-600" />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Tỷ lệ hoàn thành</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredActiveSurveys.length === 0 ? (
                        <div className="col-span-2 text-center py-12 bg-white rounded-lg shadow">
                            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 mb-4">
                                {mockActiveSurveys.length === 0
                                    ? "Chưa có khảo sát nào đang hoạt động"
                                    : "Không tìm thấy khảo sát phù hợp với bộ lọc"}
                            </p>
                            {mockActiveSurveys.length === 0 && (
                                <Button onClick={() => setActiveTab("create")}>
                                    Tạo khảo sát mới
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredActiveSurveys.map(survey => renderSurveyCard(survey))
                    )}
                </div>
            </div>
        )
    }

    const renderHistorySurveys = () => {
        // Use filtered data for statistics if filters are active
        const hasActiveFilters = selectedFaculty !== 'all' || selectedClass !== 'all' ||
            selectedYear !== '2024-2025' || selectedSemester !== 'hk1' ||
            selectedSurveyType !== 'all' || searchTerm.trim() !== ''

        const surveysToCount = hasActiveFilters ? filteredCompletedSurveys : mockCompletedSurveys
        const totalCompletedResponses = surveysToCount.reduce((sum, s) => sum + s.completedResponses, 0)

        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600">Tổng khảo sát</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold">{surveysToCount.length}</span>
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
                                <span className="text-3xl font-bold">{totalCompletedResponses}</span>
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
                                <span className="text-3xl font-bold text-green-600">0</span>
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
                                <span className="text-3xl font-bold text-red-600">0</span>
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">Mức độ cao</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {filteredCompletedSurveys.length === 0 ? (
                        <div className="col-span-2 text-center py-12 bg-white rounded-lg shadow">
                            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 mb-4">
                                {mockCompletedSurveys.length === 0
                                    ? "Chưa có khảo sát hoàn thành nào"
                                    : "Không tìm thấy khảo sát phù hợp với bộ lọc"}
                            </p>
                        </div>
                    ) : (
                        filteredCompletedSurveys.map(survey => renderSurveyCard(survey, false))
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lịch sử khảo sát sinh viên</CardTitle>
                        <CardDescription>
                            Theo dõi chi tiết kết quả khảo sát và xu hướng phát triển của từng sinh viên
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-gray-500">
                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium mb-2">Chưa có dữ liệu lịch sử khảo sát</p>
                            <p className="text-sm">Dữ liệu sẽ được hiển thị sau khi sinh viên hoàn thành khảo sát</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

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
                                    disabled={loadingFilters}
                                >
                                    <option value="all">Tất cả khoa</option>
                                    {filterOptions.faculties.map((faculty, idx) => (
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
                                    disabled={loadingFilters || targetFaculty === "all"}
                                >
                                    <option value="all">Tất cả lớp của khoa</option>
                                    {filterOptions.classes.map((cls, idx) => (
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
                            <CardDescription>
                                Thêm câu hỏi để thu thập thông tin từ sinh viên
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowQuestionBank(true)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                disabled={loadingQuestions}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {loadingQuestions ? 'Đang tải...' : 'Từ ngân hàng'}
                            </Button>
                            <Button onClick={addQuestion}>
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm câu hỏi
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {questions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="mb-2">Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" hoặc "Từ ngân hàng" để bắt đầu</p>
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
                                                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                    if (e.target.value.trim()) {
                                                        checkDuplicateQuestion(e.target.value.trim(), question.id)
                                                    }
                                                }}
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

    // Loading state
    if (loading) {
        return (
            <TeacherLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </TeacherLayout>
        )
    }

    // Error state
    if (error) {
        return (
            <TeacherLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="text-red-600 mb-4">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                            <p className="font-semibold">Có lỗi xảy ra</p>
                        </div>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => fetchSurveys()}>
                            Thử lại
                        </Button>
                    </div>
                </div>
            </TeacherLayout>
        )
    }

    return (
        <TeacherLayout>
            <div className="p-6">
                <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-6 rounded-xl shadow-lg mb-6">
                    <h1 className="text-3xl font-bold mb-2">Khảo sát sinh viên</h1>
                    <p className="text-pink-100">
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
                                <Button className="flex-1" onClick={confirmSendReminder}>
                                    Gửi nhắc nhở
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Question Bank Modal */}
                {showQuestionBank && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-green-600" />
                                    <h3 className="text-xl font-bold">Ngân hàng câu hỏi</h3>
                                    <Badge variant="outline">{availableQuestions.length} câu hỏi</Badge>
                                </div>
                                <Button variant="ghost" onClick={() => setShowQuestionBank(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Filter by category */}
                            <div className="mb-4 flex gap-4 items-center">
                                <select
                                    value={questionBankCategory}
                                    onChange={(e) => setQuestionBankCategory(e.target.value)}
                                    className="w-full md:w-64 px-3 py-2 border rounded-lg bg-white"
                                >
                                    <option value="all">Tất cả danh mục</option>
                                    <option value="financial">💰 Tài chính</option>
                                    <option value="mental">🧠 Tâm lý</option>
                                    <option value="academic">📚 Học tập</option>
                                    <option value="social">👥 Xã hội</option>
                                    <option value="teaching_quality">👨‍🏫 Chất lượng giảng dạy</option>
                                    <option value="facilities">🏢 Cơ sở vật chất</option>
                                    <option value="extracurricular">🎭 Ngoại khóa</option>
                                    <option value="academic_advising">📋 Tư vấn học tập</option>
                                </select>
                                <Badge variant="secondary">
                                    {availableQuestions
                                        .filter(q => questionBankCategory === 'all' || q.category === questionBankCategory)
                                        .filter(q => {
                                            const isAlreadyAdded = questions.some(existingQ => 
                                                existingQ.question.toLowerCase().trim() === q.question.toLowerCase().trim()
                                            );
                                            return !isAlreadyAdded;
                                        }).length} câu hỏi còn lại
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
                                {availableQuestions
                                    .filter(q => questionBankCategory === 'all' || q.category === questionBankCategory)
                                    .filter(q => {
                                        // Filter out questions that are already in the survey
                                        const isAlreadyAdded = questions.some(existingQ => 
                                            existingQ.question.toLowerCase().trim() === q.question.toLowerCase().trim()
                                        );
                                        return !isAlreadyAdded;
                                    })
                                    .map((q) => (
                                        <Card key={q.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                            <CardContent className="pt-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {q.category === 'financial' && '💰 Tài chính'}
                                                                {q.category === 'mental' && '🧠 Tâm lý'}
                                                                {q.category === 'academic' && '📚 Học tập'}
                                                                {q.category === 'social' && '👥 Xã hội'}
                                                                {q.category === 'teaching_quality' && '👨‍🏫 Chất lượng GD'}
                                                                {q.category === 'facilities' && '🏢 Cơ sở vật chất'}
                                                                {q.category === 'extracurricular' && '🎭 Ngoại khóa'}
                                                                {q.category === 'academic_advising' && '📋 Tư vấn'}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {q.type === 'multiple-choice' && 'Trắc nghiệm'}
                                                                {q.type === 'scale' && 'Thang điểm'}
                                                                {q.type === 'rating' && 'Đánh giá'}
                                                                {q.type === 'text' && 'Văn bản'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm font-medium mb-1">{q.question}</p>
                                                        {q.options && q.options.length > 0 && (
                                                            <p className="text-xs text-gray-500">
                                                                {q.options.length} lựa chọn
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            const newQuestion = convertApiQuestionToComponent(q)
                                                            setQuestions([...questions, newQuestion])
                                                            toast.success('Đã thêm câu hỏi')
                                                        }}
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        Thêm
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>

                            {availableQuestions
                                .filter(q => questionBankCategory === 'all' || q.category === questionBankCategory)
                                .filter(q => {
                                    const isAlreadyAdded = questions.some(existingQ => 
                                        existingQ.question.toLowerCase().trim() === q.question.toLowerCase().trim()
                                    );
                                    return !isAlreadyAdded;
                                }).length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>
                                        {availableQuestions.filter(q => questionBankCategory === 'all' || q.category === questionBankCategory).length === 0 
                                            ? 'Không có câu hỏi nào trong danh mục này'
                                            : 'Tất cả câu hỏi đã được thêm vào khảo sát'}
                                    </p>
                                </div>
                            )}

                            <div className="mt-6 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowQuestionBank(false)}>
                                    Đóng
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        // Filter out questions already in survey
                                        const filtered = availableQuestions
                                            .filter(q => questionBankCategory === 'all' || q.category === questionBankCategory)
                                            .filter(q => {
                                                const isAlreadyAdded = questions.some(existingQ => 
                                                    existingQ.question.toLowerCase().trim() === q.question.toLowerCase().trim()
                                                );
                                                return !isAlreadyAdded;
                                            });
                                        
                                        const selectedQuestions = filtered
                                            .sort(() => Math.random() - 0.5)
                                            .slice(0, 5)
                                            .map(convertApiQuestionToComponent)

                                        if (selectedQuestions.length > 0) {
                                            setQuestions([...questions, ...selectedQuestions])
                                            setShowQuestionBank(false)
                                            toast.success(`Đã thêm ${selectedQuestions.length} câu hỏi`)
                                        } else {
                                            toast.info('Tất cả câu hỏi đã được thêm')
                                        }
                                    }}
                                >
                                    Thêm 5 câu ngẫu nhiên
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Incomplete Students Modal */}
                {showIncompleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Users className="w-6 h-6 text-orange-600" />
                                    <h3 className="text-xl font-bold">Sinh viên chưa hoàn thành</h3>
                                </div>
                                <Button variant="ghost" onClick={() => setShowIncompleteModal(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {selectedIncompleteStudents.map((student) => (
                                    <Card key={student.studentId}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">{student.studentName}</h4>
                                                    <p className="text-sm text-gray-600">Mã SV: {student.studentCode}</p>
                                                    <p className="text-sm text-gray-500">Truy cập cuối: {student.lastAccess}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                                                        {student.remindersSent} nhắc nhở đã gửi
                                                    </Badge>
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        <p>{student.email}</p>
                                                        <p>{student.phoneNumber}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Nội dung nhắc nhở hàng loạt</label>
                                    <textarea
                                        className="w-full px-3 py-2 border rounded-lg"
                                        rows={4}
                                        value={bulkReminderMessage}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkReminderMessage(e.target.value)}
                                        placeholder="Nhập nội dung nhắc nhở..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowIncompleteModal(false)}>
                                        Đóng
                                    </Button>
                                    <Button className="flex-1" onClick={sendBulkReminder}>
                                        Gửi nhắc nhở ({selectedIncompleteStudents.length} sinh viên)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Survey Detail View Modal */}
                {showDetailView && selectedSurvey && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Eye className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-bold">Chi tiết khảo sát</h3>
                                </div>
                                <Button variant="ghost" onClick={() => setShowDetailView(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Thông tin cơ bản</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Tiêu đề:</strong> {selectedSurvey.title}</p>
                                            <p><strong>Loại:</strong> {getTypeText(selectedSurvey.type)}</p>
                                            <p><strong>Khoa:</strong> {selectedSurvey.faculty}</p>
                                            <p><strong>Lớp:</strong> {selectedSurvey.className}</p>
                                            <p><strong>Trạng thái:</strong>
                                                <Badge className={`ml-2 ${getStatusColor(selectedSurvey.status)}`}>
                                                    {selectedSurvey.status === "active" ? "Đang diễn ra" :
                                                        selectedSurvey.status === "completed" || selectedSurvey.status === "closed" ? "Đã hoàn thành" :
                                                            selectedSurvey.status === "draft" ? "Nháp" : "Hết hạn"}
                                                </Badge>
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Thống kê</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Tổng sinh viên:</strong> {selectedSurvey.totalStudents}</p>
                                            <p><strong>Đã hoàn thành:</strong> {selectedSurvey.completedResponses}</p>
                                            <p><strong>Tỷ lệ hoàn thành:</strong> {selectedSurvey.avgCompletion}%</p>
                                            <p><strong>Ngày tạo:</strong> {selectedSurvey.createdDate}</p>
                                            <p><strong>Hạn chót:</strong> {selectedSurvey.dueDate}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">Danh sách câu hỏi</h4>
                                    <div className="space-y-3">
                                        {questions.map((question, idx) => (
                                            <Card key={question.id}>
                                                <CardContent className="pt-4">
                                                    <div className="flex items-start gap-3">
                                                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-sm font-medium">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{question.question}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {question.category === "financial" ? "💰 Tài chính" :
                                                                        question.category === "mental" ? "🧠 Tâm lý" :
                                                                            question.category === "academic" ? "📚 Học tập" : "👥 Xã hội"}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {question.type === "scale" ? "Đánh giá" : question.type === "choice" ? "Trắc nghiệm" : "Văn bản"}
                                                                </Badge>
                                                                {question.isRequired && (
                                                                    <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                                                        Bắt buộc
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Survey Analytics Modal */}
                {showAnalytics && selectedSurvey && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                    <h3 className="text-xl font-bold">Phân tích khảo sát</h3>
                                </div>
                                <Button variant="ghost" onClick={() => setShowAnalytics(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Response Rate Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Tỷ lệ phản hồi</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64 flex items-center justify-center text-gray-500">
                                            [Biểu đồ tỷ lệ phản hồi]
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Category Analysis */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Phân tích theo danh mục</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">💰 Tài chính</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-200 rounded">
                                                        <div className="w-3/4 h-2 bg-yellow-500 rounded"></div>
                                                    </div>
                                                    <span className="text-sm font-medium">3.2/5</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">🧠 Tâm lý</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-200 rounded">
                                                        <div className="w-4/5 h-2 bg-green-500 rounded"></div>
                                                    </div>
                                                    <span className="text-sm font-medium">4.1/5</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">📚 Học tập</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-200 rounded">
                                                        <div className="w-3/5 h-2 bg-blue-500 rounded"></div>
                                                    </div>
                                                    <span className="text-sm font-medium">2.8/5</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">👥 Xã hội</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-2 bg-gray-200 rounded">
                                                        <div className="w-4/5 h-2 bg-purple-500 rounded"></div>
                                                    </div>
                                                    <span className="text-sm font-medium">3.9/5</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Risk Assessment */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Đánh giá nguy cơ</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                                                <span className="text-sm font-medium text-red-700">Nguy cơ cao</span>
                                                <span className="text-lg font-bold text-red-700">12 sinh viên</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                                                <span className="text-sm font-medium text-yellow-700">Cần theo dõi</span>
                                                <span className="text-lg font-bold text-yellow-700">8 sinh viên</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                                                <span className="text-sm font-medium text-green-700">Ổn định</span>
                                                <span className="text-lg font-bold text-green-700">25 sinh viên</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Improvement Suggestions */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Đề xuất cải thiện</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                <p>Tăng cường hỗ trợ tài chính cho sinh viên có điểm tài chính thấp</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                <p>Tổ chức các buổi tư vấn tâm lý định kỳ</p>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                                <p>Cải thiện phương pháp giảng dạy để nâng cao hiệu quả học tập</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast Notifications */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-md">
                {toast.toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
                            px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out
                            ${t.type === 'success' ? 'bg-green-500 text-white' : ''}
                            ${t.type === 'error' ? 'bg-red-500 text-white' : ''}
                            ${t.type === 'warning' ? 'bg-yellow-500 text-white' : ''}
                            ${t.type === 'info' ? 'bg-blue-500 text-white' : ''}
                            animate-slideInRight
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <p className="font-medium">{t.message}</p>
                            </div>
                            <button
                                onClick={() => toast.hideToast(t.id)}
                                className="text-white hover:opacity-75 transition-opacity"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </TeacherLayout>
    )
}

export default StudentSurveyManagement
