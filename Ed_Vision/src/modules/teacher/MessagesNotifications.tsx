import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CardContent, CardHeader, CardTitle } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import { useFilterOptions } from "@/hooks/useFilterOptions"
import { chatService } from "@/services/chatService"
import { socketService } from "@/services/socketService"
import type { Conversation, ChatMessage } from "@/services/chatService"
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
    UserCheck,
    SlidersHorizontal,
    ArrowLeft
} from "lucide-react"

// Interfaces
interface Student {
    id: string
    name: string
    avatar: string
    className: string
    studentCode?: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    isOnline: boolean
    riskLevel?: 'high' | 'medium' | 'low'
    totalConversations?: number
    lastConversationDate?: string
}

interface Parent {
    id: string
    name: string
    avatar: string
    studentName: string
    className: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    isOnline: boolean
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

type StudentGroup = 'atrisk' | 'normal' | 'parents'

export default function MessagesNotifications() {
    // Get studentId from URL params
    const [searchParams] = useSearchParams()
    const studentIdFromUrl = searchParams.get('studentId')
    const { filterOptions, loading: loadingFilters } = useFilterOptions()

    // Tab state cho 2 nhóm sinh viên
    const [activeGroup, setActiveGroup] = useState<StudentGroup>('atrisk')

    // States
    const [selectedStudent, setSelectedStudent] = useState<Student | Parent | null>(null)
    const [messageInput, setMessageInput] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    // Pagination state for chat messages
    const [messagesPerPage] = useState(20) // Hiển thị 20 tin nhắn mỗi lần
    const [currentMessagePage, setCurrentMessagePage] = useState(1)

    // Filter states
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const [showFilters, setShowFilters] = useState(false)

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

    // Real data states
    const [students, setStudents] = useState<Student[]>([])
    const [_conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [_loading, setLoading] = useState(false)
    const [_loadingStudents, setLoadingStudents] = useState(false)

    // Load students từ backend
    useEffect(() => {
        loadStudents()
        loadConversations()
    }, [])

    const loadStudents = async () => {
        try {
            setLoadingStudents(true)
            const data = await chatService.getTeacherStudents()
            
            // Transform data từ backend sang format Student
            const transformedStudents: Student[] = data.map((student: any) => ({
                id: student.id,
                name: student.name,
                avatar: student.avatar || '/src/assets/teacher/Avatar_Student1.png',
                className: student.className,
                studentCode: student.studentCode,
                lastMessage: '',
                lastMessageTime: '',
                unreadCount: 0,
                isOnline: false,
                riskLevel: 'low',
                totalConversations: 0,
            }))
            
            setStudents(transformedStudents)
        } catch (error) {
            console.error('Error loading students:', error)
        } finally {
            setLoadingStudents(false)
        }
    }

    const loadConversations = async () => {
        try {
            setLoading(true)
            const data = await chatService.getTeacherConversations()
            setConversations(data)
            
            // Update students với conversation info
            setStudents(prev => prev.map(student => {
                const conv = data.find((c: Conversation) => 
                    c.participants.some(p => p.userId === student.id)
                )
                if (conv) {
                    const unreadForUser = typeof conv.unreadCount === 'object' 
                        ? (conv.unreadCount as any)[student.id] || 0
                        : conv.unreadCount || 0
                        
                    return {
                        ...student,
                        lastMessage: conv.lastMessage?.content || '',
                        lastMessageTime: conv.lastMessage?.timestamp 
                            ? new Date(conv.lastMessage.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            : '',
                        unreadCount: unreadForUser,
                        totalConversations: 1,
                    }
                }
                return student
            }))
        } catch (error) {
            console.error('Error loading conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (conversationId: string) => {
        try {
            setLoading(true)
            const data = await chatService.getConversationMessages(conversationId)
            setMessages(data.reverse()) // Reverse để hiển thị từ cũ đến mới
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setLoading(false)
        }
    }

    // Parents mock data (giữ tạm thời)
    const parents: Parent[] = []

    // Auto-select student if studentId is provided in URL
    useEffect(() => {
        if (studentIdFromUrl && students.length > 0) {
            const student = students.find(s => s.id === studentIdFromUrl)
            if (student) {
                setSelectedStudent(student)
                // Tự động chọn nhóm phù hợp
                if (student.riskLevel === 'high' || student.riskLevel === 'medium') {
                    setActiveGroup('atrisk')
                } else {
                    setActiveGroup('normal')
                }
            }
        }
    }, [studentIdFromUrl])

    // Define stable socket callbacks
    const handleNewMessage = useCallback((message: ChatMessage) => {
        if (currentConversationId && message.conversationId === currentConversationId) {
            setMessages(prev => {
                // Check duplicate
                if (prev.some(m => m._id === message._id)) {
                    return prev
                }
                return [...prev, message]
            })
        }
    }, [currentConversationId])

    const handleConversationUpdated = useCallback((data: any) => {
        setConversations(prev => prev.map(conv => {
            if (conv._id === data.conversationId) {
                // Chỉ tăng unreadCount nếu KHÔNG đang mở conversation này
                const isCurrentlyViewing = currentConversationId === data.conversationId
                return {
                    ...conv,
                    lastMessage: data.lastMessage,
                    unreadCount: isCurrentlyViewing ? 0 : (conv.unreadCount || 0) + 1
                }
            }
            return conv
        }))
    }, [currentConversationId])

    // Setup Socket.IO for teacher
    useEffect(() => {
        if (_conversations.length === 0) return

        // Get teacher userId from first conversation's teacher participant
        const firstConv = _conversations[0]
        const teacherParticipant = firstConv?.participants.find(p => p.userType === 'teacher')
        
        if (!teacherParticipant) {
            console.warn('No teacher participant found in conversations')
            return
        }

        const setupSocket = async () => {
            if (!socketService.isConnected()) {
                try {
                    await socketService.connect(teacherParticipant.userId, 'teacher')
                    console.log('✅ Teacher socket ready')
                } catch (error) {
                    console.error('Failed to connect teacher socket:', error)
                    return
                }
            }

            socketService.onNewMessage(handleNewMessage)
            socketService.onConversationUpdated(handleConversationUpdated)
        }

        setupSocket()

        return () => {
            socketService.off('newMessage', handleNewMessage)
            socketService.off('conversationUpdated', handleConversationUpdated)
        }
    }, [_conversations.length, handleNewMessage, handleConversationUpdated])

    // Cleanup socket on unmount
    useEffect(() => {
        return () => socketService.disconnect()
    }, [])

    // Tạo lịch sử cuộc trò chuyện từ messages thực tế
    const conversationHistories: ConversationHistory[] = React.useMemo(() => {
        if (!currentConversationId || messages.length === 0) return []

        // Nhóm messages theo ngày
        const messagesByDate: { [key: string]: ChatMessage[] } = {}
        messages.forEach(msg => {
            const date = new Date(msg.createdAt).toLocaleDateString('vi-VN')
            if (!messagesByDate[date]) {
                messagesByDate[date] = []
            }
            messagesByDate[date].push(msg)
        })

        // Tạo conversation history cho mỗi ngày
        return Object.entries(messagesByDate).map(([date, msgs], index) => {
            const firstMsg = msgs[0]
            const lastMsg = msgs[msgs.length - 1]
            const duration = Math.ceil((new Date(lastMsg.createdAt).getTime() - new Date(firstMsg.createdAt).getTime()) / 60000)
            
            // Tạo summary từ nội dung messages
            const summary = msgs.length > 3 
                ? `Trao đổi ${msgs.length} tin nhắn về: ${msgs[0].content.substring(0, 50)}...`
                : msgs.map(m => m.content).join('. ')

            // Xác định sentiment đơn giản (có thể cải tiến sau)
            const sentiment: 'positive' | 'neutral' | 'negative' = msgs.some(m => 
                m.content.toLowerCase().includes('cảm ơn') || 
                m.content.toLowerCase().includes('tốt') ||
                m.content.toLowerCase().includes('hiểu rồi')
            ) ? 'positive' : 'neutral'

            return {
                id: `conv-${date}-${index}`,
                date: new Date(firstMsg.createdAt).toLocaleString('vi-VN'),
                duration: duration > 0 ? `${duration} phút` : '< 1 phút',
                messageCount: msgs.length,
                topic: `Tư vấn ngày ${date}`,
                summary: summary.substring(0, 150),
                tags: ['Tư vấn'],
                sentiment
            }
        }).reverse() // Mới nhất lên đầu
    }, [currentConversationId, messages])

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
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !currentConversationId) return

        // Get teacher userId from conversations - find teacher participant
        const currentConv = _conversations.find(c => c._id === currentConversationId)
        if (!currentConv) {
            alert('Không tìm thấy cuộc trò chuyện')
            return
        }

        const teacherParticipant = currentConv.participants.find(p => p.userType === 'teacher')
        if (!teacherParticipant) {
            alert('Không tìm thấy thông tin giáo viên trong cuộc trò chuyện')
            return
        }

        const messageText = messageInput.trim()
        setMessageInput('') // Clear immediately

        try {
            // Gửi qua Socket.IO cho real-time
            await socketService.sendMessage(
                currentConversationId,
                teacherParticipant.userId,
                'teacher',
                messageText
            )
            
            // Message sẽ được nhận qua socket listener
            // Update local conversation lastMessage
            setConversations(prev => prev.map(conv => 
                conv._id === currentConversationId
                    ? { 
                        ...conv, 
                        lastMessage: {
                            content: messageText,
                            senderId: teacherParticipant.userId,
                            senderName: teacherParticipant.userName,
                            timestamp: new Date()
                        }
                    }
                    : conv
            ))
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Có lỗi khi gửi tin nhắn. Vui lòng thử lại!')
            setMessageInput(messageText) // Restore on error
        }
    }

    const handleSelectStudent = async (student: Student) => {
        // Leave previous conversation room
        if (currentConversationId) {
            socketService.leaveConversation(currentConversationId)
        }

        setSelectedStudent(student)
        setLoading(true)
        
        try {
            // Tạo hoặc tìm conversation
            const conversation = await chatService.createTeacherConversation(
                student.id,
                student.name,
                'teacher-student',
                {
                    studentInfo: {
                        studentId: student.id,
                        studentCode: student.studentCode || '',
                        studentName: student.name,
                        className: student.className,
                        riskLevel: student.riskLevel,
                    }
                }
            )
            
            // Lưu conversation ID
            setCurrentConversationId(conversation._id)
            
            // Join conversation room
            socketService.joinConversation(conversation._id)
            
            // Load messages của conversation
            await loadMessages(conversation._id)
            
            // Mark as read
            await chatService.markAsRead(conversation._id)
            
            // Refresh conversations để update unread count
            await loadConversations()
        } catch (error) {
            console.error('Error selecting student:', error)
        } finally {
            setLoading(false)
        }
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

    // Lọc theo nhóm hiện tại
    const currentGroupStudents: Student[] = activeGroup === 'atrisk' 
        ? atRiskStudents 
        : activeGroup === 'normal' 
        ? normalStudents 
        : []

    const currentGroupParents: Parent[] = activeGroup === 'parents' ? parents : []

    const filteredStudents = currentGroupStudents.filter(student => {
        const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.className.toLowerCase().includes(searchTerm.toLowerCase())
        const matchClass = selectedClass === 'all' || student.className === selectedClass

        return matchSearch && matchClass
    })

    const filteredParents = currentGroupParents.filter(parent => {
        const matchSearch = parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parent.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            parent.className.toLowerCase().includes(searchTerm.toLowerCase())
        const matchClass = selectedClass === 'all' || parent.className === selectedClass

        return matchSearch && matchClass
    })

    // Lọc lịch sử cuộc trò chuyện theo sinh viên được chọn
    const filteredConversationHistory = selectedStudent
        ? conversationHistories
        : []

    // Pagination for chat messages - Chỉ load tin nhắn gần nhất
    const totalMessages = messages.length
    const displayedMessages = messages.slice(-currentMessagePage * messagesPerPage) // Lấy từ cuối lên
    const hasMoreMessages = totalMessages > displayedMessages.length

    const loadMoreMessages = () => {
        setCurrentMessagePage(prev => prev + 1)
    }

    // Reset pagination khi chọn student mới
    useEffect(() => {
        setCurrentMessagePage(1)
    }, [selectedStudent?.id])

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
            {/* Smooth scroll cho toàn bộ trang */}
            <div className="flex flex-col scroll-smooth">
                {/* Header với tabs */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg mb-4 transition-all duration-300">
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
                                    className="bg-white/20 hover:bg-white/30 text-white shadow-lg border border-white/30 transition-all duration-200 hover:scale-105"
                                            size="sm"
                                        >
                                            <Megaphone className="w-4 h-4 mr-2" />
                                            Thông báo hàng loạt
                                        </Button>
                                        <Button
                                            onClick={() => setIsQuickModalOpen(true)}
                                            className="bg-white/20 hover:bg-white/30 text-white shadow-lg border border-white/30 transition-all duration-200 hover:scale-105"
                                            size="sm"
                                        >
                                            <Zap className="w-4 h-4 mr-2" />
                                            Tin nhắn nhanh
                                        </Button>
                                        <Button
                                            onClick={() => setIsUrgentModalOpen(true)}
                                            className="bg-red-500 hover:bg-red-600 text-white shadow-lg border border-red-600 transition-all duration-200 hover:scale-105"
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
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${activeGroup === 'atrisk'
                                            ? 'bg-white text-blue-600 shadow-lg scale-105'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        <AlertTriangle className="w-5 h-5" />
                                        <span>Sinh viên cảnh báo</span>
                                        <Badge className="bg-red-500 text-white ml-2 transition-all">
                                            {atRiskStudents.length}
                                        </Badge>
                                    </button>
                                    <button
                                        onClick={() => setActiveGroup('normal')}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${activeGroup === 'normal'
                                            ? 'bg-white text-blue-600 shadow-lg scale-105'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        <Users className="w-5 h-5" />
                                        <span>Sinh viên bình thường</span>
                                        <Badge className="bg-green-500 text-white ml-2 transition-all">
                                            {normalStudents.length}
                                        </Badge>
                                    </button>
                                    <button
                                        onClick={() => setActiveGroup('parents')}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${activeGroup === 'parents'
                                            ? 'bg-white text-blue-600 shadow-lg scale-105'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        <UserCheck className="w-5 h-5" />
                                        <span>Phụ huynh</span>
                                        <Badge className="bg-purple-500 text-white ml-2 transition-all">
                                            {parents.length}
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
                                            {activeGroup === 'atrisk' ? 'SV cảnh báo' : activeGroup === 'normal' ? 'SV bình thường' : 'Phụ huynh'}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {activeGroup === 'parents' ? parents.length : currentGroupStudents.length}
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-xs text-blue-100">Chưa đọc</span>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-300">
                                        {activeGroup === 'parents' 
                                            ? parents.filter(p => p.unreadCount > 0).length
                                            : currentGroupStudents.filter(s => s.unreadCount > 0).length
                                        }
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs text-blue-100">Cuộc trò chuyện</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {activeGroup === 'parents'
                                            ? parents.reduce((sum, p) => sum + (p.totalConversations || 0), 0)
                                            : currentGroupStudents.reduce((sum, s) => sum + (s.totalConversations || 0), 0)
                                        }
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="text-xs text-blue-100">
                                            {activeGroup === 'parents' ? 'Trung bình/PH' : 'Trung bình/SV'}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-300">
                                        {activeGroup === 'parents'
                                            ? (parents.length > 0 
                                                ? Math.round(parents.reduce((sum, p) => sum + (p.totalConversations || 0), 0) / parents.length)
                                                : 0)
                                            : (currentGroupStudents.length > 0
                                                ? Math.round(currentGroupStudents.reduce((sum, s) => sum + (s.totalConversations || 0), 0) / currentGroupStudents.length)
                                                : 0)
                                        }
                                    </div>
                                </div>
                            </div>
                </div>

                {/* Main Content - 3 Columns Layout */}
                <div className="flex-1 grid grid-cols-12 gap-4 pb-6">
                    {/* Column 1 - Danh sách sinh viên - Ẩn khi đã chọn */}
                    {!selectedStudent && (
                        <div className="col-span-12 lg:col-span-3 flex flex-col bg-white rounded-xl shadow-sm">
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
                                            disabled={loadingFilters}
                                        >
                                            <option value="all">Tất cả lớp</option>
                                            {filterOptions.classes.map(className => (
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
                                <span className="text-gray-600">
                                    {activeGroup === 'parents' 
                                        ? `${filteredParents.length} phụ huynh` 
                                        : `${filteredStudents.length} sinh viên`
                                    }
                                </span>
                                <Badge className="bg-red-100 text-red-700 text-xs">
                                    {activeGroup === 'parents'
                                        ? `${parents.filter(p => p.unreadCount > 0).length} chưa đọc`
                                        : `${students.filter(s => s.unreadCount > 0).length} chưa đọc`
                                    }
                                </Badge>
                            </div>
                        </div>

                        {/* Danh sách sinh viên/phụ huynh - Cho phép scroll tự nhiên */}
                        <div>
                            {/* Hiển thị sinh viên */}
                            {activeGroup !== 'parents' && filteredStudents.map((student) => {
                                const isSelected = selectedStudent !== null && (selectedStudent as Student | Parent).id === student.id
                                return (
                                    <div
                                        key={student.id}
                                        onClick={() => handleSelectStudent(student)}
                                        className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600 shadow-md' : ''
                                            }`}
                                    >
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            <img
                                                src={student.avatar}
                                                alt={student.name}
                                                className="w-12 h-12 rounded-full object-cover transition-transform duration-200 hover:scale-110"
                                            />
                                            {student.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
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
                                )
                            })}
                            
                            {/* Hiển thị phụ huynh */}
                            {activeGroup === 'parents' && filteredParents.map((parent) => {
                                const isSelected = selectedStudent !== null && (selectedStudent as Student | Parent).id === parent.id
                                return (
                                    <div
                                        key={parent.id}
                                        onClick={() => setSelectedStudent(parent as any)}
                                        className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-purple-50 hover:shadow-md hover:scale-[1.01] ${isSelected ? 'bg-purple-50 border-l-4 border-l-purple-600 shadow-md' : ''
                                            }`}
                                    >
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            <img
                                                src={parent.avatar}
                                                alt={parent.name}
                                                className="w-12 h-12 rounded-full object-cover transition-transform duration-200 hover:scale-110"
                                            />
                                            {parent.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 truncate">{parent.name}</h4>
                                                    <p className="text-xs text-purple-600">PH: {parent.studentName}</p>
                                                </div>
                                                {parent.unreadCount > 0 && (
                                                    <Badge className="bg-purple-600 text-white text-xs animate-pulse">{parent.unreadCount}</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-1">{parent.className}</p>
                                            <p className="text-sm text-gray-600 truncate">{parent.lastMessage}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-400">{parent.lastMessageTime}</span>
                                            </div>
                                            {/* Thêm thông tin số lần trao đổi */}
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                                <div className="flex items-center gap-1 text-xs text-purple-600">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="font-medium">{parent.totalConversations} cuộc trao đổi</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    </div>
                    )}

                    {/* Column 2 - Main Chat Area */}
                    <div className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
                        selectedStudent 
                            ? (showHistory 
                                ? 'col-span-9'  // Danh sách ẩn, history hiện (9 + 3 = 12)
                                : (showSuggestions 
                                    ? 'col-span-9'  // Danh sách ẩn, suggestions hiện (9 + 3 = 12)
                                    : 'col-span-12'))  // Danh sách ẩn, full width
                            : 'hidden'  // Hoàn toàn ẩn khi không có student
                    }`}>
                        {selectedStudent ? (
                            <div className="flex flex-col min-h-[500px] max-h-[800px]">
                                {/* Chat Header */}
                                <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Back Button */}
                                            <button
                                                onClick={() => setSelectedStudent(null)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                                title="Quay lại danh sách"
                                            >
                                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                                            </button>
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
                                            {'riskLevel' in selectedStudent && selectedStudent.riskLevel && selectedStudent.riskLevel !== 'low' && (
                                                <Badge className={getRiskBadge(selectedStudent.riskLevel)}>
                                                    {selectedStudent.riskLevel === 'high' ? '⚠️ Cần chú ý' : '👀 Theo dõi'}
                                                </Badge>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setShowHistory(!showHistory)
                                                    if (!showHistory) {
                                                        setShowSuggestions(false) // Đóng suggestions khi mở history
                                                    }
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                <Clock className="w-4 h-4" />
                                                Lịch sử ({selectedStudent.totalConversations || 0})
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Messages - Tự động mở rộng theo nội dung */}
                                <div className="overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth max-h-[500px]">
                                    {/* Nút tải thêm tin nhắn cũ hơn */}
                                    {hasMoreMessages && (
                                        <div className="flex justify-center mb-4">
                                            <Button
                                                onClick={loadMoreMessages}
                                                variant="ghost"
                                                size="sm"
                                                className="bg-white hover:bg-gray-100 shadow-sm transition-all duration-200"
                                            >
                                                <ChevronDown className="w-4 h-4 mr-2 rotate-180" />
                                                Tải thêm tin nhắn cũ ({totalMessages - displayedMessages.length} tin)
                                            </Button>
                                        </div>
                                    )}
                                    
                                    {/* Hiển thị messages theo pagination */}
                                    {displayedMessages.map((msg, index) => {
                                        const isTeacher = msg.senderType === 'teacher'
                                        const timestamp = new Date(msg.createdAt).toLocaleTimeString('vi-VN', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })
                                        
                                        return (
                                            <div
                                                key={msg._id}
                                                className={`flex ${isTeacher ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                                                style={{ animationDelay: `${index * 0.05}s` }}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${isTeacher
                                                        ? 'bg-blue-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-900 border rounded-bl-none'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                                    <div className="flex items-center gap-1 mt-1 justify-end">
                                                        <span
                                                            className={`text-xs ${isTeacher ? 'text-blue-100' : 'text-gray-400'
                                                                }`}
                                                        >
                                                            {timestamp}
                                                        </span>
                                                        {isTeacher && (
                                                            <CheckCheck className={`w-3 h-3 transition-colors ${msg.isRead ? 'text-blue-200' : 'text-blue-300'}`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Input Area - Không co lại */}
                                <div className="p-4 border-t bg-white flex-shrink-0">
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
                                            onClick={() => {
                                                setShowSuggestions(!showSuggestions)
                                                if (!showSuggestions) {
                                                    setShowHistory(false) // Đóng history khi mở suggestions
                                                }
                                            }}
                                            className="text-blue-600 hover:text-blue-700"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            {showSuggestions ? 'Ẩn gợi ý' : 'Câu hỏi gợi ý'}
                                        </Button>
                                        <span className="text-xs text-gray-400">Nhấn Enter để gửi, Shift + Enter để xuống dòng</span>
                                    </div>
                                </div>
                            </div>
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
                                                {conversationHistories.length} phiên tư vấn
                                            </Badge>
                                            {conversationHistories.length > 0 && (
                                                <span className="text-gray-500">
                                                    Gần nhất: {new Date(conversationHistories[0].date).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
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
                                                    </div>
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
                        </>
                    )}

                    {/* Column 3/4 - Câu hỏi gợi ý - Chỉ hiện khi bấm nút */}
                    {showSuggestions && !showHistory && selectedStudent && (
                        <div className="col-span-3 bg-white rounded-xl shadow-sm overflow-hidden">
                            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-purple-600" />
                                    Câu hỏi gợi ý
                                </CardTitle>
                                <p className="text-xs text-gray-600 mt-1">Mẫu câu hỏi tư vấn</p>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[800px] overflow-y-auto">
                                {/* Tự mở rộng theo nội dung */}
                                <div>
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
                    )}
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
