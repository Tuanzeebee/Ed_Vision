import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import {
    MessageCircle,
    Send,
    Search,
    X,
    Megaphone,
    Zap,
    AlertTriangle,
    CheckCheck,
    Clock,
    Calendar,
    FileText,
    TrendingUp,
    ChevronDown,
    Users,
    SlidersHorizontal
} from "lucide-react"

// Interfaces
interface ChatMessage {
    id: string
    sender: 'teacher' | 'student'
    content: string
    timestamp: string
    isRead: boolean
    studentId?: string
}

interface Student {
    id: string
    name: string
    avatar: string
    className: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    isOnline: boolean
    riskLevel?: 'high' | 'medium' | 'low'
    totalConversations?: number
    lastConversationDate?: string
}

interface SuggestedQuestion {
    id: string
    category: string
    question: string
    icon: string
}

interface ConversationHistory {
    id: string
    date: string
    duration: string
    messageCount: number
    topic: string
    summary: string
    tags: string[]
    sentiment: 'positive' | 'neutral' | 'negative'
}

type StudentGroup = 'atrisk' | 'normal'

export default function MessagesNotifications() {
    // Get studentId from URL params
    const [searchParams] = useSearchParams()
    const studentIdFromUrl = searchParams.get('studentId')

<<<<<<< Updated upstream
    // Tab state cho 2 nhóm sinh viên
    const [activeGroup, setActiveGroup] = useState<StudentGroup>('atrisk')

=======
>>>>>>> Stashed changes
    // States
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [messageInput, setMessageInput] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
<<<<<<< Updated upstream

    // Filter states
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const [showFilters, setShowFilters] = useState(false)
=======
>>>>>>> Stashed changes

    // Modal states cho 3 actions quan trọng
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false)
    const [isUrgentModalOpen, setIsUrgentModalOpen] = useState(false)

    // Form states
    const [bulkForm, setBulkForm] = useState({
        recipient: 'all',
        selectedClass: '',
        title: '',
        content: ''
    })

    const [quickForm, setQuickForm] = useState({
        selectedStudent: '',
        template: '',
        content: ''
    })

    const [urgentForm, setUrgentForm] = useState({
        type: 'academic',
        recipient: 'atrisk',
        content: '',
        confirmed: false
    })

    // Mock data - Danh sách sinh viên
    const students: Student[] = [
        {
            id: '1',
            name: 'Nguyễn Văn An',
            avatar: '/src/assets/teacher/Avatar_Student1.png',
            className: 'CNTT-K19A',
            lastMessage: 'Em cảm ơn thầy đã giúp đỡ ạ',
            lastMessageTime: '10:30',
            unreadCount: 0,
            isOnline: true,
            riskLevel: 'low',
            totalConversations: 15,
            lastConversationDate: '2024-10-25'
        },
        {
            id: '2',
            name: 'Trần Thị Bình',
            avatar: '/src/assets/teacher/Avatar_Student2.png',
            className: 'CNTT-K19A',
            lastMessage: 'Thầy ơi, em có thể hỏi về bài tập không ạ?',
            lastMessageTime: '09:45',
            unreadCount: 2,
            isOnline: true,
            riskLevel: 'medium',
            totalConversations: 23,
            lastConversationDate: '2024-10-25'
        },
        {
            id: '3',
            name: 'Lê Văn Cường',
            avatar: '/src/assets/teacher/Avatar_Student3.png',
            className: 'CNTT-K19B',
            lastMessage: 'Em xin phép nghỉ học hôm nay do ốm',
            lastMessageTime: '08:20',
            unreadCount: 0,
            isOnline: false,
            riskLevel: 'high',
            totalConversations: 8,
            lastConversationDate: '2024-10-25'
        },
        {
            id: '4',
            name: 'Phạm Thị Dung',
            avatar: '/src/assets/teacher/Avatar_Student1.png',
            className: 'CNTT-K20A',
            lastMessage: 'Dạ em hiểu rồi ạ, cảm ơn thầy',
            lastMessageTime: 'Hôm qua',
            unreadCount: 0,
            isOnline: false,
            riskLevel: 'low',
            totalConversations: 12,
            lastConversationDate: '2024-10-24'
        },
        {
            id: '5',
            name: 'Hoàng Văn Em',
            avatar: '/src/assets/teacher/Avatar_Student2.png',
            className: 'CNTT-K20A',
            lastMessage: 'Em cần hỗ trợ về bài tập lớn gấp ạ',
            lastMessageTime: '2 ngày',
            unreadCount: 1,
            isOnline: false,
            riskLevel: 'high',
            totalConversations: 6,
            lastConversationDate: '2024-10-23'
        }
    ]

    // Auto-select student if studentId is provided in URL
    useEffect(() => {
        if (studentIdFromUrl && students.length > 0) {
            const student = students.find(s => s.id === studentIdFromUrl)
            if (student) {
                setSelectedStudent(student)
<<<<<<< Updated upstream
                // Tự động chọn nhóm phù hợp
                if (student.riskLevel === 'high' || student.riskLevel === 'medium') {
                    setActiveGroup('atrisk')
                } else {
                    setActiveGroup('normal')
                }
=======
>>>>>>> Stashed changes
            }
        }
    }, [studentIdFromUrl])

    // Mock data - Lịch sử cuộc trò chuyện
    const conversationHistories: ConversationHistory[] = [
        {
            id: 'conv1',
            date: '2024-10-25 10:00',
            duration: '15 phút',
            messageCount: 12,
            topic: 'Tư vấn học tập - Lập trình OOP',
            summary: 'Sinh viên hỏi về kế thừa và đa hình trong OOP. Đã giải thích chi tiết và gửi tài liệu tham khảo.',
            tags: ['Học tập', 'Lập trình', 'OOP'],
            sentiment: 'positive'
        },
        {
            id: 'conv2',
            date: '2024-10-23 14:30',
            duration: '20 phút',
            messageCount: 18,
            topic: 'Hỗ trợ bài tập lớn',
            summary: 'Sinh viên gặp khó khăn trong việc thiết kế database. Đã hướng dẫn về normalization và ERD.',
            tags: ['Bài tập', 'Database', 'Thiết kế'],
            sentiment: 'positive'
        },
        {
            id: 'conv3',
            date: '2024-10-20 09:15',
            duration: '25 phút',
            messageCount: 22,
            topic: 'Tư vấn tâm lý - Áp lực học tập',
            summary: 'Sinh viên chia sẻ về áp lực học tập và kỳ thi sắp tới. Đã động viên và đưa ra lời khuyên về quản lý thời gian.',
            tags: ['Tâm lý', 'Áp lực', 'Động viên'],
            sentiment: 'neutral'
        },
        {
            id: 'conv4',
            date: '2024-10-18 16:45',
            duration: '10 phút',
            messageCount: 8,
            topic: 'Xin phép nghỉ học',
            summary: 'Sinh viên xin phép nghỉ học do ốm. Đã đồng ý và nhắc nhở bù bài khi khỏe.',
            tags: ['Hành chính', 'Nghỉ học'],
            sentiment: 'neutral'
        },
        {
            id: 'conv5',
            date: '2024-10-15 11:00',
            duration: '30 phút',
            messageCount: 25,
            topic: 'Tư vấn định hướng nghề nghiệp',
            summary: 'Trao đổi về định hướng nghề nghiệp sau khi tốt nghiệp. Đã tư vấn về các vị trí phù hợp với năng lực.',
            tags: ['Nghề nghiệp', 'Tương lai', 'Định hướng'],
            sentiment: 'positive'
        }
    ]

    // Mock data - Tin nhắn chat với sinh viên được chọn
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            sender: 'student',
            content: 'Thầy ơi, em có thể hỏi về bài tập tuần này không ạ?',
            timestamp: '10:20',
            isRead: true,
            studentId: '2'
        },
        {
            id: '2',
            sender: 'teacher',
            content: 'Chào em! Được chứ, em cứ hỏi đi.',
            timestamp: '10:22',
            isRead: true
        },
        {
            id: '3',
            sender: 'student',
            content: 'Dạ, em không hiểu phần lập trình hướng đối tượng ạ',
            timestamp: '10:25',
            isRead: true,
            studentId: '2'
        },
        {
            id: '4',
            sender: 'teacher',
            content: 'À, phần đó khá quan trọng đấy. Em đang gặp khó khăn ở chỗ nào cụ thể?',
            timestamp: '10:27',
            isRead: true
        },
        {
            id: '5',
            sender: 'student',
            content: 'Em không hiểu về kế thừa và đa hình lắm ạ',
            timestamp: '10:28',
            isRead: true,
            studentId: '2'
        }
    ])

    // Câu hỏi gợi ý cho giảng viên
    const suggestedQuestions: SuggestedQuestion[] = [
        {
            id: '1',
            category: 'Học tập',
            question: 'Em có gặp khó khăn gì trong việc học tập không?',
            icon: '📚'
        },
        {
            id: '2',
            category: 'Học tập',
            question: 'Em cần hỗ trợ thêm về phần nào của môn học?',
            icon: '📝'
        },
        {
            id: '3',
            category: 'Tâm lý',
            question: 'Em có cảm thấy áp lực trong học tập không?',
            icon: '🧠'
        },
        {
            id: '4',
            category: 'Tâm lý',
            question: 'Em có điều gì muốn chia sẻ với thầy không?',
            icon: '💬'
        },
        {
            id: '5',
            category: 'Tài chính',
            question: 'Em có khó khăn về tài chính không?',
            icon: '💰'
        },
        {
            id: '6',
            category: 'Xã hội',
            question: 'Em có hòa đồng với bạn bè trong lớp không?',
            icon: '👥'
        },
        {
            id: '7',
            category: 'Chung',
            question: 'Thầy có thể giúp gì cho em?',
            icon: '🤝'
        },
        {
            id: '8',
            category: 'Chung',
            question: 'Em có kế hoạch gì cho học kỳ này chưa?',
            icon: '🎯'
        }
    ]

    // Functions
    const handleSendMessage = () => {
        if (!messageInput.trim() || !selectedStudent) return

        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            sender: 'teacher',
            content: messageInput,
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isRead: false
        }

        setChatMessages([...chatMessages, newMessage])
        setMessageInput('')
    }

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student)
        // TODO: Load tin nhắn của sinh viên này
    }

    const handleUseSuggestion = (question: string) => {
        setMessageInput(question)
        setShowSuggestions(false)
    }

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert('Thông báo hàng loạt đã được gửi thành công!')
        setIsBulkModalOpen(false)
    }

    const handleQuickSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert('Tin nhắn nhanh đã được gửi thành công!')
        setIsQuickModalOpen(false)
    }

    const handleUrgentSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!urgentForm.confirmed) {
            alert('Vui lòng xác nhận để gửi cảnh báo!')
            return
        }
        alert('Cảnh báo khẩn cấp đã được gửi thành công!')
        setIsUrgentModalOpen(false)
    }

    const getRiskBadge = (level?: string) => {
        switch (level) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'low':
                return 'bg-green-100 text-green-700 border-green-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    // Chia sinh viên thành 2 nhóm
    const atRiskStudents = students.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium')
    const normalStudents = students.filter(s => s.riskLevel === 'low' || !s.riskLevel)

    // Lọc sinh viên theo nhóm hiện tại và các tiêu chí
    const currentGroupStudents = activeGroup === 'atrisk' ? atRiskStudents : normalStudents

    const filteredStudents = currentGroupStudents.filter(student => {
        const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.className.toLowerCase().includes(searchTerm.toLowerCase())
        const matchClass = selectedClass === 'all' || student.className === selectedClass

        return matchSearch && matchClass
    })

    // Lấy danh sách các lớp unique
    const classList = ['all', ...Array.from(new Set(students.map(s => s.className)))]

    // Lọc lịch sử cuộc trò chuyện theo sinh viên được chọn
    const filteredConversationHistory = selectedStudent
        ? conversationHistories
        : []

    const getSentimentBadge = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'negative':
                return 'bg-red-100 text-red-700 border-red-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'positive':
                return '😊'
            case 'negative':
                return '😟'
            default:
                return '😐'
        }
    }

    return (
        <TeacherLayout currentPage="messages">
            <div className="h-[calc(100vh-120px)] flex flex-col">
                {/* Header với tabs */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg mb-4">
                    <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">Truyền thông & Tư vấn</h2>
                                <p className="text-blue-100">Quản lý tin nhắn và thông báo đến sinh viên</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {/* Quick Actions */}
                                <Button
                                    onClick={() => setIsBulkModalOpen(true)}
                                    className="bg-white/20 hover:bg-white/30 text-white shadow-lg border border-white/30"
                                    size="sm"
                                >
                                    <Megaphone className="w-4 h-4 mr-2" />
                                    Thông báo hàng loạt
                                </Button>
                                <Button
                                    onClick={() => setIsQuickModalOpen(true)}
                                    className="bg-white/20 hover:bg-white/30 text-white shadow-lg border border-white/30"
                                    size="sm"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Tin nhắn nhanh
                                </Button>
                                <Button
                                    onClick={() => setIsUrgentModalOpen(true)}
                                    className="bg-red-500 hover:bg-red-600 text-white shadow-lg border border-red-600"
                                    size="sm"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Cảnh báo khẩn cấp
                                </Button>
                            </div>
                        </div>

                        {/* Tabs cho 2 nhóm sinh viên */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveGroup('atrisk')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeGroup === 'atrisk'
                                    ? 'bg-white text-blue-600 shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                <AlertTriangle className="w-5 h-5" />
                                <span>Sinh viên cảnh báo</span>
                                <Badge className="bg-red-500 text-white ml-2">
                                    {atRiskStudents.length}
                                </Badge>
                            </button>
                            <button
                                onClick={() => setActiveGroup('normal')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeGroup === 'normal'
                                    ? 'bg-white text-blue-600 shadow-lg'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                <span>Sinh viên bình thường</span>
                                <Badge className="bg-green-500 text-white ml-2">
                                    {normalStudents.length}
                                </Badge>
                            </button>
                        </div>
                    </div>

                    {/* Thống kê theo nhóm */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pb-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-4 h-4" />
                                <span className="text-xs text-blue-100">
                                    {activeGroup === 'atrisk' ? 'SV cảnh báo' : 'SV bình thường'}
                                </span>
                            </div>
                            <div className="text-2xl font-bold">{currentGroupStudents.length}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-xs text-blue-100">Chưa đọc</span>
                            </div>
                            <div className="text-2xl font-bold text-yellow-300">
                                {currentGroupStudents.filter(s => s.unreadCount > 0).length}
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs text-blue-100">Cuộc trò chuyện</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {currentGroupStudents.reduce((sum, s) => sum + (s.totalConversations || 0), 0)}
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-xs text-blue-100">Trung bình/SV</span>
                            </div>
                            <div className="text-2xl font-bold text-green-300">
                                {currentGroupStudents.length > 0
                                    ? Math.round(currentGroupStudents.reduce((sum, s) => sum + (s.totalConversations || 0), 0) / currentGroupStudents.length)
                                    : 0}
                            </div>
                        </div>
                    </div>
                </div>

<<<<<<< Updated upstream
                {/* Main Content - 3 Columns Layout */}
=======
                {/* Main Chat Interface - 3 Columns Layout */}
>>>>>>> Stashed changes
                <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
                    {/* Column 1 - Danh sách sinh viên */}
                    <div className="col-span-12 lg:col-span-3 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b space-y-3">
                            {/* Search bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên, lớp..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                            </div>

                            {/* Filter button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                            >
                                <div className="flex items-center gap-2 text-gray-700">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    <span>Bộ lọc</span>
                                    {selectedClass !== 'all' && (
                                        <Badge className="bg-blue-100 text-blue-700 text-xs">1</Badge>
                                    )}
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Filters dropdown */}
                            {showFilters && (
                                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                                    {/* Filter by class */}
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 mb-1 block">Lọc theo lớp</label>
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="w-full text-sm border rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">Tất cả lớp</option>
                                            {classList.filter(c => c !== 'all').map(className => (
                                                <option key={className} value={className}>{className}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Reset filters */}
                                    {selectedClass !== 'all' && (
                                        <button
                                            onClick={() => setSelectedClass('all')}
                                            className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                </div>
                            )}                                {/* Count */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{filteredStudents.length} sinh viên</span>
                                <Badge className="bg-red-100 text-red-700 text-xs">
                                    {students.filter(s => s.unreadCount > 0).length} chưa đọc
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredStudents.map((student) => (
                                <div
                                    key={student.id}
                                    onClick={() => handleSelectStudent(student)}
                                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-50 ${selectedStudent?.id === student.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            <img
                                                src={student.avatar}
                                                alt={student.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            {student.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-medium text-gray-900 truncate">{student.name}</h4>
                                                {student.unreadCount > 0 && (
                                                    <Badge className="bg-blue-600 text-white text-xs">{student.unreadCount}</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1">{student.className}</p>
                                            <p className="text-sm text-gray-600 truncate">{student.lastMessage}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-400">{student.lastMessageTime}</span>
                                                {student.riskLevel && student.riskLevel !== 'low' && (
                                                    <Badge className={`text-xs ${getRiskBadge(student.riskLevel)}`}>
                                                        {student.riskLevel === 'high' ? 'Cần chú ý' : 'Theo dõi'}
                                                    </Badge>
                                                )}
                                            </div>
                                            {/* Thêm thông tin số lần tư vấn */}
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                                <div className="flex items-center gap-1 text-xs text-indigo-600">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="font-medium">{student.totalConversations} cuộc trò chuyện</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 2 - Main Chat Area */}
                    <div className={`col-span-12 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden ${showHistory ? 'lg:col-span-5' : 'lg:col-span-6'}`}>
                        {selectedStudent ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={selectedStudent.avatar}
                                                    alt={selectedStudent.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                {selectedStudent.isOnline && (
                                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{selectedStudent.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-gray-500">{selectedStudent.className}</p>
                                                    {selectedStudent.isOnline && (
                                                        <span className="text-xs text-green-600">● Đang hoạt động</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedStudent.riskLevel && selectedStudent.riskLevel !== 'low' && (
                                                <Badge className={getRiskBadge(selectedStudent.riskLevel)}>
                                                    {selectedStudent.riskLevel === 'high' ? '⚠️ Cần chú ý' : '👀 Theo dõi'}
                                                </Badge>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="flex items-center gap-2"
                                            >
                                                <Clock className="w-4 h-4" />
                                                Lịch sử ({selectedStudent.totalConversations || 0})
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                    {chatMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender === 'teacher'
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-900 border rounded-bl-none'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                <div className="flex items-center gap-1 mt-1 justify-end">
                                                    <span
                                                        className={`text-xs ${msg.sender === 'teacher' ? 'text-blue-100' : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {msg.timestamp}
                                                    </span>
                                                    {msg.sender === 'teacher' && (
                                                        <CheckCheck className={`w-3 h-3 ${msg.isRead ? 'text-blue-200' : 'text-blue-300'}`} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t bg-white">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <textarea
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault()
                                                        handleSendMessage()
                                                    }
                                                }}
                                                placeholder="Nhập tin nhắn..."
                                                rows={2}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                            />
                                        </div>
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim()}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 h-auto"
                                        >
                                            <Send className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowSuggestions(!showSuggestions)}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            {showSuggestions ? 'Ẩn gợi ý' : 'Câu hỏi gợi ý'}
                                        </Button>
                                        <span className="text-xs text-gray-400">Nhấn Enter để gửi, Shift + Enter để xuống dòng</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center p-8">
                                <div>
                                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn sinh viên để bắt đầu trao đổi</h3>
                                    <p className="text-gray-500">
                                        Chọn một sinh viên từ danh sách bên trái để bắt đầu cuộc trò chuyện
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Column 3 - Lịch sử cuộc trò chuyện (Conditional) */}
                    {showHistory && selectedStudent && (
<<<<<<< Updated upstream
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                                onClick={() => setShowHistory(false)}
                            />
                            {/* History Panel */}
                            <div className="fixed top-0 right-0 w-[500px] h-screen bg-white shadow-2xl flex flex-col z-50 overflow-hidden">
                                <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-indigo-600" />
                                        Lịch sử tư vấn
                                    </CardTitle>
                                    {selectedStudent && (
                                        <div className="mt-2 flex items-center gap-2 text-sm">
                                            <Badge className="bg-indigo-100 text-indigo-700">
                                                {selectedStudent.totalConversations} cuộc trò chuyện
                                            </Badge>
                                            <span className="text-gray-500">
                                                Gần nhất: {new Date(selectedStudent.lastConversationDate || '').toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0 flex-1 overflow-hidden">
                                    {selectedStudent ? (
                                        <div className="h-full overflow-y-auto">
                                            {filteredConversationHistory.length > 0 ? (
                                                <div className="divide-y">
                                                    {filteredConversationHistory.map((conv) => (
                                                        <div key={conv.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-sm text-gray-600">
                                                                        {new Date(conv.date).toLocaleDateString('vi-VN', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                                <Badge className={`text-xs ${getSentimentBadge(conv.sentiment)}`}>
                                                                    {getSentimentIcon(conv.sentiment)}
                                                                </Badge>
                                                            </div>

                                                            <h4 className="font-medium text-gray-900 mb-2 flex items-start gap-2">
                                                                <FileText className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                                                <span className="text-sm">{conv.topic}</span>
                                                            </h4>

                                                            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                                {conv.summary}
                                                            </p>

                                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {conv.duration}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MessageCircle className="w-3 h-3" />
                                                                    {conv.messageCount} tin nhắn
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-wrap gap-1">
                                                                {conv.tags.map((tag, idx) => (
                                                                    <Badge key={idx} className="text-xs bg-gray-100 text-gray-600">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full p-8 text-center">
                                                    <div>
                                                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                        <p className="text-sm text-gray-500">Chưa có lịch sử tư vấn</p>
=======
                        <div className="col-span-12 lg:col-span-4 flex flex-col bg-white rounded-xl shadow-sm overflow-hidden">
                            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-blue-50">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-600" />
                                    Lịch sử tư vấn
                                </CardTitle>
                                {selectedStudent && (
                                    <div className="mt-2 flex items-center gap-2 text-sm">
                                        <Badge className="bg-indigo-100 text-indigo-700">
                                            {selectedStudent.totalConversations} cuộc trò chuyện
                                        </Badge>
                                        <span className="text-gray-500">
                                            Gần nhất: {new Date(selectedStudent.lastConversationDate || '').toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                                {selectedStudent ? (
                                    <div className="h-full overflow-y-auto">
                                        {filteredConversationHistory.length > 0 ? (
                                            <div className="divide-y">
                                                {filteredConversationHistory.map((conv) => (
                                                    <div key={conv.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                                <span className="text-sm text-gray-600">
                                                                    {new Date(conv.date).toLocaleDateString('vi-VN', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <Badge className={`text-xs ${getSentimentBadge(conv.sentiment)}`}>
                                                                {getSentimentIcon(conv.sentiment)}
                                                            </Badge>
                                                        </div>

                                                        <h4 className="font-medium text-gray-900 mb-2 flex items-start gap-2">
                                                            <FileText className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                                            <span className="text-sm">{conv.topic}</span>
                                                        </h4>

                                                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                                            {conv.summary}
                                                        </p>

                                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {conv.duration}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageCircle className="w-3 h-3" />
                                                                {conv.messageCount} tin nhắn
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap gap-1">
                                                            {conv.tags.map((tag, idx) => (
                                                                <Badge key={idx} className="text-xs bg-gray-100 text-gray-600">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
>>>>>>> Stashed changes
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full p-8 text-center">
                                                <div>
                                                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-sm text-gray-500">Chưa có lịch sử tư vấn</p>
                                                </div>
<<<<<<< Updated upstream
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full p-8 text-center">
                                            <div>
                                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm text-gray-500">Chọn sinh viên để xem lịch sử</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Lịch sử giúp theo dõi quá trình tư vấn
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>

                                {/* Thống kê nhanh */}
                                {selectedStudent && filteredConversationHistory.length > 0 && (
                                    <div className="border-t p-4 bg-gray-50">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center p-2 bg-white rounded-lg border">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                    <span className="text-xs text-gray-600">Tích cực</span>
                                                </div>
                                                <div className="text-lg font-bold text-green-600">
                                                    {filteredConversationHistory.filter(c => c.sentiment === 'positive').length}
                                                </div>
                                            </div>
                                            <div className="text-center p-2 bg-white rounded-lg border">
                                                <div className="flex items-center justify-center gap-1 mb-1">
                                                    <MessageCircle className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs text-gray-600">Tổng số</span>
                                                </div>
                                                <div className="text-lg font-bold text-blue-600">
                                                    {filteredConversationHistory.reduce((sum, c) => sum + c.messageCount, 0)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

=======
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full p-8 text-center">
                                        <div>
                                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm text-gray-500">Chọn sinh viên để xem lịch sử</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Lịch sử giúp theo dõi quá trình tư vấn
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            {/* Thống kê nhanh */}
                            {selectedStudent && filteredConversationHistory.length > 0 && (
                                <div className="border-t p-4 bg-gray-50">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center p-2 bg-white rounded-lg border">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="text-xs text-gray-600">Tích cực</span>
                                            </div>
                                            <div className="text-lg font-bold text-green-600">
                                                {filteredConversationHistory.filter(c => c.sentiment === 'positive').length}
                                            </div>
                                        </div>
                                        <div className="text-center p-2 bg-white rounded-lg border">
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <MessageCircle className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs text-gray-600">Tổng số</span>
                                            </div>
                                            <div className="text-lg font-bold text-blue-600">
                                                {filteredConversationHistory.reduce((sum, c) => sum + c.messageCount, 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

>>>>>>> Stashed changes
                    {/* Column 3/4 - Câu hỏi gợi ý */}
                    <div className={`col-span-12 bg-white rounded-xl shadow-sm overflow-hidden ${showHistory ? 'hidden' : 'lg:col-span-3 lg:block'}`}>
                        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-purple-600" />
                                Câu hỏi gợi ý
                            </CardTitle>
                            <p className="text-xs text-gray-600 mt-1">Mẫu câu hỏi tư vấn</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
                                {['Học tập', 'Tâm lý', 'Tài chính', 'Xã hội', 'Chung'].map((category) => (
                                    <div key={category} className="border-b last:border-b-0">
                                        <div className="px-3 py-2 bg-gray-50 font-medium text-xs text-gray-700">
                                            {category}
                                        </div>
                                        <div className="divide-y">
                                            {suggestedQuestions
                                                .filter((q) => q.category === category)
                                                .map((suggestion) => (
                                                    <button
                                                        key={suggestion.id}
                                                        onClick={() => handleUseSuggestion(suggestion.question)}
                                                        className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors group"
                                                        disabled={!selectedStudent}
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-base mt-0.5">{suggestion.icon}</span>
                                                            <p className="text-xs text-gray-700 group-hover:text-blue-700 flex-1">
                                                                {suggestion.question}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </div>
                </div>
            </div>

            {/* Modal Thông báo hàng loạt */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center">
                                    <Megaphone className="w-5 h-5 mr-3" />
                                    Thông báo hàng loạt
                                </h3>
                                <Button
                                    onClick={() => setIsBulkModalOpen(false)}
                                    className="text-white hover:text-gray-200 p-1"
                                    variant="ghost"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleBulkSubmit}>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Gửi đến</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {[
                                                { value: 'all', label: 'Tất cả sinh viên', count: '156 sinh viên' },
                                                { value: 'class', label: 'Theo lớp', count: 'Chọn lớp cụ thể' },
                                                { value: 'atrisk', label: 'Sinh viên cảnh báo', count: '8 sinh viên' },
                                                { value: 'custom', label: 'Tùy chọn', count: 'Chọn thủ công' }
                                            ].map((option) => (
                                                <label key={option.value} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input
                                                        type="radio"
                                                        name="recipient"
                                                        value={option.value}
                                                        checked={bulkForm.recipient === option.value}
                                                        onChange={(e) => setBulkForm(prev => ({ ...prev, recipient: e.target.value }))}
                                                        className="mr-3"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{option.label}</div>
                                                        <div className="text-sm text-gray-500">{option.count}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {bulkForm.recipient === 'class' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tên lớp</label>
                                            <input
                                                type="text"
                                                value={bulkForm.selectedClass}
                                                onChange={(e) => setBulkForm(prev => ({ ...prev, selectedClass: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                placeholder="Nhập tên lớp (VD: CNTT-K19A)..."
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề thông báo</label>
                                        <input
                                            type="text"
                                            value={bulkForm.title}
                                            onChange={(e) => setBulkForm(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Nhập tiêu đề thông báo..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung thông báo</label>
                                        <textarea
                                            rows={5}
                                            value={bulkForm.content}
                                            onChange={(e) => setBulkForm(prev => ({ ...prev, content: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder="Nhập nội dung thông báo..."
                                            required
                                        />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600">
                                            <Send className="w-4 h-4 mr-2" />
                                            Gửi thông báo
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tin nhắn nhanh */}
            {isQuickModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center">
                                    <Zap className="w-5 h-5 mr-3" />
                                    Tin nhắn nhanh
                                </h3>
                                <Button
                                    onClick={() => setIsQuickModalOpen(false)}
                                    className="text-white hover:text-gray-200 p-1"
                                    variant="ghost"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleQuickSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gửi đến sinh viên</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={quickForm.selectedStudent}
                                                onChange={(e) => setQuickForm(prev => ({ ...prev, selectedStudent: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Tìm kiếm sinh viên..."
                                            />
                                            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tin nhắn</label>
                                        <textarea
                                            rows={8}
                                            value={quickForm.content}
                                            onChange={(e) => setQuickForm(prev => ({ ...prev, content: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Nhập nội dung tin nhắn..."
                                            required
                                        />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                                            <Send className="w-4 h-4 mr-2" />
                                            Gửi ngay
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Cảnh báo khẩn cấp */}
            {isUrgentModalOpen && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-3" />
                                    Cảnh báo khẩn cấp
                                </h3>
                                <Button
                                    onClick={() => setIsUrgentModalOpen(false)}
                                    className="text-white hover:text-gray-200 p-1"
                                    variant="ghost"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                            <p className="text-red-100 mt-2">Gửi cảnh báo ưu tiên cao đến sinh viên</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUrgentSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Loại cảnh báo</label>
                                        <input
                                            type="text"
                                            value={urgentForm.type}
                                            onChange={(e) => setUrgentForm(prev => ({ ...prev, type: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="VD: Cảnh báo học tập, Cảnh báo điểm danh..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Gửi đến</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="urgentRecipient"
                                                    value="atrisk"
                                                    checked={urgentForm.recipient === 'atrisk'}
                                                    onChange={(e) => setUrgentForm(prev => ({ ...prev, recipient: e.target.value }))}
                                                    className="mr-2"
                                                />
                                                <span>Sinh viên cảnh báo (8 sinh viên)</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="urgentRecipient"
                                                    value="specific"
                                                    checked={urgentForm.recipient === 'specific'}
                                                    onChange={(e) => setUrgentForm(prev => ({ ...prev, recipient: e.target.value }))}
                                                    className="mr-2"
                                                />
                                                <span>Sinh viên cụ thể</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung cảnh báo</label>
                                        <textarea
                                            rows={4}
                                            value={urgentForm.content}
                                            onChange={(e) => setUrgentForm(prev => ({ ...prev, content: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="Nhập nội dung cảnh báo khẩn cấp..."
                                            required
                                        />
                                    </div>

                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <AlertTriangle className="w-5 h-5 text-red-500 mt-1 mr-3" />
                                            <div>
                                                <h4 className="text-sm font-medium text-red-800">Xác nhận gửi cảnh báo</h4>
                                                <p className="text-sm text-red-700 mt-1">Cảnh báo khẩn cấp sẽ được gửi ngay lập tức và có mức độ ưu tiên cao.</p>
                                                <label className="flex items-center mt-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={urgentForm.confirmed}
                                                        onChange={(e) => setUrgentForm(prev => ({ ...prev, confirmed: e.target.checked }))}
                                                        className="mr-2"
                                                        required
                                                    />
                                                    <span className="text-sm text-red-700">Tôi xác nhận muốn gửi cảnh báo này</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button type="submit" className="flex-1 bg-red-500 hover:bg-red-600">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            Gửi cảnh báo
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    )
}
