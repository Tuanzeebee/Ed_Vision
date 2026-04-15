import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/teacher/teacher_card"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Input } from "@/components/ui/teacher/teacher_input"
import TeacherLayout from "./components/TeacherLayout"
import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
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
    type?: "beginning" | "midterm" | "final"
    semester?: string
    academicYear?: string
    createdDate?: string
    dueDate?: string
    status: "draft" | "active" | "completed" | "expired" | "closed"
    totalStudents?: number
    completedResponses?: number
    avgCompletion?: number
    faculty?: string
    className?: string
    description?: string
    reminders?: number
    lastReminderDate?: string
    averageScore?: number
    riskStudents?: number
    completedStudents?: StudentResponse[]
    incompleteStudents?: IncompleteStudent[]
    // API response fields
    startDate?: string
    endDate?: string
    createdAt?: string
    updatedAt?: string
    totalResponses?: number
    responseRate?: number
    targetClasses?: string[]
    questions?: any[]
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
    const [showIncompleteModal, setShowIncompleteModal] = useState(false)
    const [selectedIncompleteStudents, setSelectedIncompleteStudents] = useState<IncompleteStudent[]>([])
    const [bulkReminderMessage, setBulkReminderMessage] = useState("")
    const [showQuestionBank, setShowQuestionBank] = useState(false)
    const [questionBankCategory, setQuestionBankCategory] = useState<string>("all")

    // Statistics states
    const [historyStats, setHistoryStats] = useState({
        totalCompletedSurveys: 0,
        totalResponses: 0,
        improvingStudents: 0,
        needSupportStudents: 0,
    })
    const [targetStudentCount, setTargetStudentCount] = useState(0)

    // Toast notifications
    const toast = useToast()
    const { t } = useTranslation('teacher')

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
        getSurveyDetail,
        getSurveyAnalytics,
        getIncompleteStudents,
        getHistoryStatistics,
        getTargetStudentCount,
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
    }, [activeTab, fetchDashboard, fetchSurveys])

    // Load available questions from database on mount
    const loadAvailableQuestions = useCallback(async () => {
        setLoadingQuestions(true)
        try {
            const questions = await apiGetAvailableQuestions()
            setAvailableQuestions(questions || [])
        } catch (error) {
            console.error('Error loading questions:', error)
        } finally {
            setLoadingQuestions(false)
        }
    }, [apiGetAvailableQuestions])

    useEffect(() => {
        loadAvailableQuestions()
    }, [loadAvailableQuestions])

    // Load history statistics when on history tab
    const loadHistoryStats = useCallback(async () => {
        if (activeTab === 'history') {
            try {
                const stats = await getHistoryStatistics()
                if (stats) {
                    setHistoryStats(stats)
                }
            } catch (error) {
                console.error('Error loading history statistics:', error)
            }
        }
    }, [activeTab, getHistoryStatistics])

    useEffect(() => {
        loadHistoryStats()
    }, [loadHistoryStats])

    // Load target student count when filters change or on create survey tab
    const loadStudentCount = useCallback(async () => {
        if (activeTab === 'create') {
            try {
                const count = await getTargetStudentCount(targetFaculty, targetClass)
                setTargetStudentCount(count)
            } catch (error) {
                console.error('Error loading student count:', error)
            }
        }
    }, [activeTab, targetFaculty, targetClass, getTargetStudentCount])

    useEffect(() => {
        loadStudentCount()
    }, [loadStudentCount])

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
            createdDate: s.createdAt ? s.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            dueDate: s.endDate ? s.endDate.split('T')[0] : new Date().toISOString().split('T')[0],
            status: mapStatusToFrontend(s.status),
            totalStudents: 150,
            completedResponses: s.totalResponses || 0,
            avgCompletion: Math.round(s.responseRate || 0),
            faculty: t('surveyManagement.faculty') || "Faculty of Information Technology",
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
        createdDate: s.createdAt ? s.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: s.endDate ? s.endDate.split('T')[0] : new Date().toISOString().split('T')[0],
        status: mapStatusToFrontend(s.status),
        totalStudents: 145,
        completedResponses: s.totalResponses || 0,
        avgCompletion: 100,
            faculty: t('surveyManagement.faculty') || "Faculty of Information Technology",
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
                const facultyMatch = survey.faculty?.toLowerCase().includes(searchLower) || false
                const classMatch = survey.className?.toLowerCase().includes(searchLower) || false

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

    const viewSurveyDetails = async (survey: Survey) => {
        try {
            setSelectedSurvey(survey)
            setShowDetailView(true)
            
            // Fetch full survey details with all questions
            const fullDetails = await getSurveyDetail(survey.id)
            
            // Fetch analytics to get student response information
            const analytics = await getSurveyAnalytics(survey.id)
            
            if (fullDetails) {
                // Merge API response with local survey data and analytics
                setSelectedSurvey({
                    ...survey,
                    ...fullDetails,
                    ...(analytics && {
                        totalResponses: analytics.totalResponses,
                        responseRate: analytics.responseRate,
                        completedStudents: analytics.responses?.map((r: any) => ({
                            studentId: r.student?.id || '',
                            studentName: r.student?.name || 'Unknown',
                            studentCode: r.student?.code || '',
                            completedDate: r.submittedAt || '',
                            responses: []
                        })) || []
                    })
                } as Survey)
            }
        } catch (error) {
            console.error('Error loading survey details:', error)
            toast.error(t('surveyManagement.loadSurveyDetailFailed'))
        }
    }

    const viewIncompleteStudents = async (survey: Survey) => {
        try {
            // Fetch incomplete students from API
            const incompleteStudents = await getIncompleteStudents(survey.id)
            
            if (!incompleteStudents || incompleteStudents.length === 0) {
                toast.info(t('surveyManagement.allStudentsCompleted'))
                return
            }
            
            setSelectedIncompleteStudents(incompleteStudents)
            setShowIncompleteModal(true)
            setBulkReminderMessage(
                t('surveyManagement.reminderNotification', { 
                    title: survey.title, 
                    dueDate: survey.dueDate 
                })
            )
        } catch (error) {
            console.error('Error loading incomplete students:', error)
            toast.error(t('surveyManagement.loadIncompleteStudentsFailed'))
        }
    }

    const sendBulkReminder = () => {
        if (selectedIncompleteStudents.length > 0 && bulkReminderMessage.trim()) {
            // Bulk reminder API integration point
            toast.success(t('surveyManagement.reminderSentToStudents', { count: selectedIncompleteStudents.length }))
            setShowIncompleteModal(false)
            setSelectedIncompleteStudents([])
            setBulkReminderMessage("")
        }
    }

    const getTypeText = (type: string) => {
        switch (type) {
            case "beginning": return t('surveyManagement.beginning')
            case "midterm": return t('surveyManagement.midterm')
            case "final": return t('surveyManagement.final')
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
                t('surveyManagement.reminderDefault', { 
                    title: survey.title, 
                    dueDate: survey.dueDate 
                })
            )
        }
    }

    const confirmSendReminder = () => {
        if (reminderSurveyId && reminderMessage) {
            // Reminder notification API integration point
            toast.success(t('surveyManagement.reminderSent'))
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
            setSurveyType(survey.type || "beginning")
            setSurveyDueDate(survey.dueDate || "")
            setTargetFaculty(survey.faculty || "all")
            setTargetClass(survey.className || "all")
            setEditingSurveyId(surveyId)
            setActiveTab("create")
            // Survey edit mode - questions loaded from API
            toast.info(t('surveyManagement.editMode'))
        }
    }

    const handleCreateSurvey = async () => {
        // Validate required fields
        if (!surveyTitle.trim()) {
            toast.warning(t('surveyManagement.titleRequired'))
            return
        }
        if (!surveyDueDate) {
            toast.warning(t('surveyManagement.dueDateRequired'))
            return
        }
        if (questions.length === 0) {
            toast.warning(t('surveyManagement.noQuestionsAdded'))
            return
        }

        //  VALIDATE: Check for duplicate questions BEFORE submitting
        const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ')
        const questionTexts = new Map<string, number>() // normalized text -> count
        
        for (const q of questions) {
            if (!q.question || !q.question.trim()) {
                toast.error(t('surveyManagement.questionEmpty', { index: questions.indexOf(q) + 1 }))
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
                t('surveyManagement.duplicateQuestionDesc', { question: firstDuplicate?.question })
            )
            return
        }

        if (targetFaculty === "all" && targetClass === "all") {
            const confirm = window.confirm(
                t('surveyManagement.confirmAllStudents')
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
            const errorMessage = error.response?.data?.message || error.message || t('surveyManagement.createFailed')
            
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
            toast.info(t('surveyManagement.filtersCleared'))
        }

        return (
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{t('surveyManagement.filters')}</h3>
                        {activeFilterCount > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                    {activeFilterCount} {t('surveyManagement.filtersActive')}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="text-sm"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    {t('surveyManagement.clearFilters')}
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">{t('surveyManagement.faculty')}</label>
                            <select
                                value={selectedFaculty}
                                onChange={(e) => setSelectedFaculty(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                disabled={loadingFilters}
                            >
                                <option value="all">{t('surveyManagement.allFaculties')}</option>
                                {filterOptions.faculties.map((faculty, idx) => (
                                    <option key={idx} value={faculty}>{faculty}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">{t('surveyManagement.class')}</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                disabled={loadingFilters}
                            >
                                <option value="all">{t('surveyManagement.allClasses')}</option>
                                {filterOptions.classes.map((cls, idx) => (
                                    <option key={idx} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">{t('surveyManagement.academicYear')}</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                disabled={loadingFilters}
                            >
                                <option value="all">{t('surveyManagement.allYears')}</option>
                                {filterOptions.academicYears.map((year, idx) => (
                                    <option key={idx} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">{t('surveyManagement.semester')}</label>
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg"
                                disabled={loadingFilters}
                            >
                                <option value="all">{t('surveyManagement.allSemesters')}</option>
                                {filterOptions.semesters.map((semester, idx) => (
                                    <option key={idx} value={semester.toLowerCase()}>{`${t('common.semester')} ${semester.replace('HK', '')}`}</option>
                                ))}
                            </select>
                        </div>                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm font-medium mb-2 block">{t('surveyManagement.surveyType')}</label>
                            <select
                                value={selectedSurveyType}
                                onChange={(e) => setSelectedSurveyType(e.target.value as any)}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="all">{t('surveyManagement.allTypes')}</option>
                                <option value="beginning">{t('surveyManagement.beginning')}</option>
                                <option value="midterm">{t('surveyManagement.midterm')}</option>
                                <option value="final">{t('surveyManagement.final')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder={t('surveyManagement.searchPlaceholder')}
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
                                {survey.status === "active" ? t('surveyManagement.statusActive') :
                                    survey.status === "completed" || survey.status === "closed" ? t('surveyManagement.statusCompleted') :
                                        survey.status === "draft" ? t('surveyManagement.statusDraft') : t('surveyManagement.statusExpired')}
                            </Badge>
                            {survey.type && <Badge variant="outline">{getTypeText(survey.type)}</Badge>}
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
                                title={t('surveyManagement.viewDetails')}
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewIncompleteStudents(survey)}
                                title={t('surveyManagement.incompleteStudentsTitle')}
                            >
                                <Users className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={async () => {
                                const success = await apiExportResponses(survey.id)
                                if (success) toast.success(t('surveyManagement.downloaded'))
                            }}>
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                    // Enhanced confirmation for active surveys
                                    let confirmMessage = t('surveyManagement.confirmDelete', { title: survey.title })

                                    if (survey.status === 'active') {
                                        confirmMessage = t('surveyManagement.deleteActiveWarning', { title: survey.title })
                                    }

                                    if (confirm(confirmMessage)) {
                                        const success = await apiDeleteSurvey(survey.id)
                                        if (success) {
                                            toast.success(t('surveyManagement.deleted'))
                                            // Refetch based on current tab
                                            await Promise.all([
                                                fetchSurveys({ status: activeTab === 'active' ? 'all' : 'closed' }),
                                                fetchDashboard()
                                            ])
                                        }
                                    }
                                }}
                                title={t('surveyManagement.deleteQuestion')}
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
        const totalResponses = apiDashboard?.totalResponses || surveysToCount.reduce((sum, s) => sum + (s.completedResponses || 0), 0)
        const avgResponseRate = apiDashboard?.averageResponseRate ||
            (surveysToCount.length > 0 ? Math.round(surveysToCount.reduce((sum, s) => sum + (s.avgCompletion || 0), 0) / surveysToCount.length) : 0)

        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.totalSurveys')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-blue-900">{activeSurveysCount}</span>
                                <ClipboardList className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{t('surveyManagement.statusActive')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.totalResponses')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-green-900">{totalResponses}</span>
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{t('surveyManagement.studentResponses')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.avgResponseRate')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-purple-900">{avgResponseRate}%</span>
                                <BarChart3 className="w-8 h-8 text-purple-600" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{t('surveyManagement.responseRate')}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredActiveSurveys.length === 0 ? (
                        <div className="col-span-2 text-center py-12 bg-white rounded-lg shadow">
                            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 mb-4">
                                {mockActiveSurveys.length === 0
                                    ? t('surveyManagement.noActiveSurveys')
                                    : t('surveyManagement.noActiveSurveysDesc')}
                            </p>
                            {mockActiveSurveys.length === 0 && (
                                <Button onClick={() => setActiveTab("create")}>
                                    {t('surveyManagement.createNewSurvey')}
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
        const totalCompletedResponses = surveysToCount.reduce((sum, s) => sum + (s.completedResponses || 0), 0)

        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.totalSurveys')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-green-900">{surveysToCount.length}</span>
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{t('surveyManagement.statusCompleted')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.totalResponses')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-blue-900">{totalCompletedResponses}</span>
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{t('surveyManagement.participatedInSurvey')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.improving')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-green-900">{historyStats.improvingStudents}</span>
                                <TrendingUp className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{t('surveyManagement.progressing')}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.needSupport')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-bold text-red-900">{historyStats.needSupportStudents}</span>
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{t('surveyManagement.highPriority')}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {filteredCompletedSurveys.length === 0 ? (
                        <div className="col-span-2 text-center py-12 bg-white rounded-lg shadow">
                            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 mb-4">
                                {mockCompletedSurveys.length === 0
                                    ? t('surveyManagement.noCompletedSurveys')
                                    : t('surveyManagement.noSurveysMatchFilter')}
                            </p>
                        </div>
                    ) : (
                        filteredCompletedSurveys.map(survey => renderSurveyCard(survey, false))
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('surveyManagement.studentSurveyHistory')}</CardTitle>
                        <CardDescription>
                            {t('surveyManagement.studentSurveyHistoryDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12 text-gray-500">
                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium mb-2">{t('surveyManagement.noHistoryData')}</p>
                            <p className="text-sm">{t('surveyManagement.noHistoryDataDesc')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderCreateSurvey = () => (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.questionsCreated')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-blue-900">{questions.length}</span>
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {questions.length === 0 ? t('surveyManagement.noQuestionsYet') : t('surveyManagement.questionsLabel')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.target')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-green-900">
                                {targetFaculty === "all" && targetClass === "all" ? t('surveyManagement.allTargets') :
                                    targetClass === "all" ? t('surveyManagement.oneFaculty') : t('surveyManagement.oneClass')}
                            </span>
                            <Users className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {targetStudentCount} {t('surveyManagement.studentsCount')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-700">{t('surveyManagement.surveyStatus')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-purple-900">
                                {editingSurveyId ? t('surveyManagement.editing') : t('surveyManagement.new')}
                            </span>
                            <ClipboardList className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {editingSurveyId ? t('surveyManagement.updating') : t('surveyManagement.creating')}
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
                                <p className="font-medium">{t('surveyManagement.editingSurvey')}</p>
                                <p className="text-sm">{t('surveyManagement.editingWarning')}</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto"
                                onClick={resetSurveyForm}
                            >
                                {t('surveyManagement.cancelEditing')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t('surveyManagement.surveyInfo')}</CardTitle>
                    <CardDescription>{t('surveyManagement.surveyInfoDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('surveyManagement.surveyTitleLabel')}</label>
                            <Input
                                placeholder={t('surveyManagement.surveyTitlePlaceholderFull')}
                                value={surveyTitle}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSurveyTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('surveyManagement.surveyDescriptionLabel')}</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={3}
                                placeholder={t('surveyManagement.surveyDescPlaceholderFull')}
                                value={surveyDescription}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSurveyDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">{t('surveyManagement.surveyTypeLabel')}</label>
                                <select
                                    value={surveyType}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSurveyType(e.target.value as any)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="beginning">{t('surveyManagement.beginningOption')}</option>
                                    <option value="midterm">{t('surveyManagement.midtermOption')}</option>
                                    <option value="final">{t('surveyManagement.finalOption')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">{t('surveyManagement.dueDateLabel')}</label>
                                <Input
                                    type="date"
                                    value={surveyDueDate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSurveyDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">{t('surveyManagement.facultyLabel')}</label>
                                <select
                                    value={targetFaculty}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetFaculty(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    disabled={loadingFilters}
                                >
                                    <option value="all">{t('surveyManagement.allFacultiesOption')}</option>
                                    {filterOptions.faculties.map((faculty, idx) => (
                                        <option key={idx} value={faculty}>{faculty}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">{t('surveyManagement.classLabel')}</label>
                                <select
                                    value={targetClass}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetClass(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    disabled={loadingFilters || targetFaculty === "all"}
                                >
                                    <option value="all">{t('surveyManagement.allClassesOption')}</option>
                                    {filterOptions.classes.map((cls, idx) => (
                                        <option key={idx} value={cls}>{cls}</option>
                                    ))}
                                </select>
                                {targetFaculty === "all" && (
                                    <p className="text-xs text-gray-500 mt-1">{t('surveyManagement.selectFacultyHint')}</p>
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
                            <CardTitle>{t('surveyManagement.surveyQuestions')}</CardTitle>
                            <CardDescription>
                                {t('surveyManagement.surveyQuestionsDesc')}
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
                            <p className="mb-2">{t('surveyManagement.noQuestionsDesc')}</p>
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
                                                <option value="financial"> Tài chính - Tình hình kinh tế và chi tiêu</option>
                                                <option value="mental"> Tâm lý - Tinh thần và sức khỏe</option>
                                                <option value="academic"> Học tập - Thành tích và khó khăn</option>
                                                <option value="social"> Xã hội - Quan hệ và hoạt động</option>
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
                            {(surveyTitle && surveyTitle.length > 0 ? surveyTitle : t('surveyManagement.noTitle')) + ' - ' + getTypeText(surveyType)}
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
                                            <p className="font-medium text-base">{question.question || t('surveyManagement.noQuestions')}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm text-gray-600">
                                                    {question.category === "financial" && " Tài chính"}
                                                    {question.category === "mental" && " Tâm lý"}
                                                    {question.category === "academic" && " Học tập"}
                                                    {question.category === "social" && " Xã hội"}
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
            <TeacherLayout currentPage="survey-management">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">{t('common.loading')}</p>
                    </div>
                </div>
            </TeacherLayout>
        )
    }

    // Error state
    if (error) {
        return (
            <TeacherLayout currentPage="survey-management">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="text-red-600 mb-4">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                            <p className="font-semibold">{t('common.error')}</p>
                        </div>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => fetchSurveys()}>
                            {t('surveyManagement.tryAgain')}
                        </Button>
                    </div>
                </div>
            </TeacherLayout>
        )
    }

    return (
        <TeacherLayout currentPage="survey-management">
            <div className="p-6">
                <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-6 rounded-xl shadow-lg mb-6">
                    <h1 className="text-3xl font-bold mb-2">{t('surveyManagement.title')}</h1>
                    <p className="text-pink-100">
                        {t('surveyManagement.subtitle')}
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
                            {t('surveyManagement.activeTab')}
                        </button>
                        <button
                            className={`px-6 py-3 font-medium transition-colors ${activeTab === "history"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                            onClick={() => setActiveTab("history")}
                        >
                            {t('surveyManagement.historyTab')}
                        </button>
                        <button
                            className={`px-6 py-3 font-medium transition-colors ${activeTab === "create"
                                ? "border-b-2 border-blue-600 text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                            onClick={() => setActiveTab("create")}
                        >
                            {t('surveyManagement.createTab')}
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
                    <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                                <h3 className="text-xl font-bold">{t('surveyManagement.reminderDialog')}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                {t('surveyManagement.reminderDescription')}
                            </p>
                            <div className="mb-4">
                                <label className="text-sm font-medium mb-2 block">{t('surveyManagement.reminderMessage')}</label>
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
                                    {t('common.cancel')}
                                </Button>
                                <Button className="flex-1" onClick={confirmSendReminder}>
                                    {t('surveyManagement.sendReminder')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Question Bank Modal */}
                {showQuestionBank && (
                    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-green-600" />
                                    <h3 className="text-xl font-bold">{t('surveyManagement.questionBank')}</h3>
                                    <Badge variant="outline">{availableQuestions.length} {t('surveyManagement.questions')}</Badge>
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
                                    <option value="all">{t('surveyManagement.allCategories')}</option>
                                    <option value="financial"> {t('surveyManagement.financial')}</option>
                                    <option value="mental"> {t('surveyManagement.mental')}</option>
                                    <option value="academic"> {t('surveyManagement.academic')}</option>
                                    <option value="social"> {t('surveyManagement.social')}</option>
                                    <option value="teaching_quality"> {t('surveyManagement.teachingQuality')}</option>
                                    <option value="facilities"> {t('surveyManagement.facilities')}</option>
                                    <option value="extracurricular"> {t('surveyManagement.extracurricular')}</option>
                                    <option value="academic_advising"> {t('surveyManagement.academicAdvising')}</option>
                                </select>
                                <Badge variant="secondary">
                                    {availableQuestions
                                        .filter(q => questionBankCategory === 'all' || q.category === questionBankCategory)
                                        .filter(q => {
                                            const isAlreadyAdded = questions.some(existingQ => 
                                                existingQ.question.toLowerCase().trim() === q.question.toLowerCase().trim()
                                            );
                                            return !isAlreadyAdded;
                                        }).length} {t('surveyManagement.questionsRemaining')}
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
                                                                {q.category === 'financial' && ' Tài chính'}
                                                                {q.category === 'mental' && ' Tâm lý'}
                                                                {q.category === 'academic' && ' Học tập'}
                                                                {q.category === 'social' && ' Xã hội'}
                                                                {q.category === 'teaching_quality' && ' Chất lượng GD'}
                                                                {q.category === 'facilities' && ' Cơ sở vật chất'}
                                                                {q.category === 'extracurricular' && ' Ngoại khóa'}
                                                                {q.category === 'academic_advising' && ' Tư vấn'}
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
                                                                {q.options.length} {t('surveyManagement.choices')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            const newQuestion = convertApiQuestionToComponent(q)
                                                            setQuestions([...questions, newQuestion])
                                                            toast.success(t('surveyManagement.addedQuestion'))
                                                        }}
                                                    >
                                                        <Plus className="w-4 h-4 mr-1" />
                                                        {t('surveyManagement.add')}
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
                                    {t('surveyManagement.close')}
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
                                            toast.success(t('surveyManagement.questionsAdded', { count: selectedQuestions.length }))
                                        } else {
                                            toast.info(t('surveyManagement.allQuestionsAlreadyAdded'))
                                        }
                                    }}
                                >
                                    {t('surveyManagement.addRandomQuestions')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Incomplete Students Modal */}
                {showIncompleteModal && (
                    <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Users className="w-6 h-6 text-orange-600" />
                                    <h3 className="text-xl font-bold">{t('surveyManagement.incompleteStudentsTitle')}</h3>
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
                                                    <p className="text-sm text-gray-600">{t('surveyManagement.studentCode')}: {student.studentCode}</p>
                                                    <p className="text-sm text-gray-500">{t('surveyManagement.lastAccess')}: {student.lastAccess}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                                                        {student.remindersSent} {t('surveyManagement.remindersSent')}
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
                                    <label className="text-sm font-medium mb-2 block">{t('surveyManagement.bulkReminderContent')}</label>
                                    <textarea
                                        className="w-full px-3 py-2 border rounded-lg"
                                        rows={4}
                                        value={bulkReminderMessage}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkReminderMessage(e.target.value)}
                                        placeholder={t('surveyManagement.reminderPlaceholder')}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowIncompleteModal(false)}>
                                        {t('common.close')}
                                    </Button>
                                    <Button className="flex-1" onClick={sendBulkReminder}>
                                        {t('surveyManagement.sendReminderToStudents', { count: selectedIncompleteStudents.length })}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Survey Detail View Modal */}
                {showDetailView && selectedSurvey && (
                    <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Eye className="w-6 h-6 text-blue-600" />
                                    <h3 className="text-xl font-bold">{t('surveyManagement.surveyDetailTitle')}</h3>
                                </div>
                                <Button variant="ghost" onClick={() => setShowDetailView(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-2">{t('surveyManagement.basicInformation')}</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>{t('surveyManagement.title')}:</strong> {selectedSurvey.title}</p>
                                            {selectedSurvey.description && (
                                                <p><strong>{t('surveyManagement.description')}:</strong> {selectedSurvey.description}</p>
                                            )}
                                            {selectedSurvey.type && (
                                                <p><strong>{t('surveyManagement.typeLabel')}:</strong> {getTypeText(selectedSurvey.type)}</p>
                                            )}
                                            {selectedSurvey.targetClasses && selectedSurvey.targetClasses.length > 0 && (
                                                <p><strong>{t('surveyManagement.targetClasses')}:</strong> {selectedSurvey.targetClasses.join(', ')}</p>
                                            )}
                                            <p><strong>{t('surveyManagement.status')}:</strong>
                                                <Badge className={`ml-2 ${getStatusColor(selectedSurvey.status)}`}>
                                                    {selectedSurvey.status === "active" ? t('surveyManagement.statusActive') :
                                                        selectedSurvey.status === "completed" || selectedSurvey.status === "closed" ? t('surveyManagement.statusCompleted') :
                                                            selectedSurvey.status === "draft" ? t('surveyManagement.statusDraft') : t('surveyManagement.statusExpired')}
                                                </Badge>
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">{t('surveyManagement.statisticsAndTime')}</h4>
                                        <div className="space-y-2 text-sm">
                                            {selectedSurvey.totalResponses !== undefined && (
                                                <p><strong>{t('surveyManagement.totalResponsesLabel')}:</strong> {selectedSurvey.totalResponses}</p>
                                            )}
                                            {selectedSurvey.responseRate !== undefined && (
                                                <p><strong>{t('surveyManagement.responseRateLabel')}:</strong> {selectedSurvey.responseRate.toFixed(1)}%</p>
                                            )}
                                            {selectedSurvey.startDate && (
                                                <p><strong>{t('surveyManagement.startDate')}:</strong> {new Date(selectedSurvey.startDate).toLocaleDateString('vi-VN')}</p>
                                            )}
                                            {selectedSurvey.endDate && (
                                                <p><strong>{t('surveyManagement.endDate')}:</strong> {new Date(selectedSurvey.endDate).toLocaleDateString('vi-VN')}</p>
                                            )}
                                            {selectedSurvey.createdAt && (
                                                <p><strong>{t('surveyManagement.createdDate')}:</strong> {new Date(selectedSurvey.createdAt).toLocaleDateString('vi-VN')}</p>
                                            )}
                                            {selectedSurvey.createdDate && !selectedSurvey.createdAt && (
                                                <p><strong>{t('surveyManagement.createdDate')}:</strong> {new Date(selectedSurvey.createdDate).toLocaleDateString('vi-VN')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-3">{t('surveyManagement.questionsList')} {t('surveyManagement.questionsCount', { count: selectedSurvey.questions?.length || 0 })}</h4>
                                    <div className="space-y-3">
                                        {selectedSurvey.questions && selectedSurvey.questions.length > 0 ? (
                                            selectedSurvey.questions.map((question: any, idx: number) => (
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
                                                                        {question.category === "financial" ? ` ${t('surveyManagement.financial')}` :
                                                                            question.category === "mental" ? ` ${t('surveyManagement.mental')}` :
                                                                                question.category === "academic" ? ` ${t('surveyManagement.academic')}` : ` ${t('surveyManagement.social')}`}
                                                                    </Badge>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {question.type === "scale" ? t('surveyManagement.rating') : question.type === "choice" ? t('surveyManagement.multipleChoice') : t('surveyManagement.textType')}
                                                                    </Badge>
                                                                    {question.required && (
                                                                        <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                                                            {t('surveyManagement.requiredQuestion')}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {question.options && question.options.length > 0 && (
                                                                    <div className="mt-2 text-sm text-gray-600">
                                                                        <p className="font-medium mb-1">{t('surveyManagement.questionOptions')}:</p>
                                                                        <ul className="list-disc list-inside space-y-1">
                                                                            {question.options.map((opt: string, i: number) => (
                                                                                <li key={i}>{opt}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center py-4">{t('surveyManagement.noQuestions')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Danh sách sinh viên đã hoàn thành */}
                                {selectedSurvey.completedStudents && selectedSurvey.completedStudents.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-3">
                                            {t('surveyManagement.completedStudentsList')} {t('surveyManagement.completedCount', { count: selectedSurvey.completedStudents.length })}
                                        </h4>
                                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                                            {selectedSurvey.completedStudents.map((student) => (
                                                <Card key={student.studentId}>
                                                    <CardContent className="pt-3 pb-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                                <div>
                                                                    <p className="font-medium text-sm">{student.studentName}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {t('surveyManagement.studentCode')}: {student.studentCode}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                                                    {t('surveyManagement.completedStatus')}
                                                                </Badge>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {student.completedDate ? new Date(student.completedDate).toLocaleString('vi-VN') : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Thông báo nếu chưa có sinh viên nào hoàn thành */}
                                {(!selectedSurvey.completedStudents || selectedSurvey.completedStudents.length === 0) && (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                        <p className="text-gray-600 text-sm">{t('surveyManagement.noStudentsCompleted')}</p>
                                    </div>
                                )}
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
                                
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </TeacherLayout>
    )
}

export default StudentSurveyManagement
