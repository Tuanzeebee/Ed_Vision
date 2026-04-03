import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
    Megaphone,
    Zap,
    AlertTriangle,
    CheckCheck,
    Clock,
    ChevronDown,
    Users,
    UserCheck,
    ArrowLeft,
    BookOpen,
    Calendar,
    FileText,
    TrendingUp,
    X
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

// Development logging helper
const isDev = import.meta.env.DEV
const debugLog = (...args: any[]) => {
    if (isDev) console.log(...args)
}

export default function MessagesNotifications() {
    const { t } = useTranslation('teacher')
    // Get studentId from URL params
    const [searchParams] = useSearchParams()
    const studentIdFromUrl = searchParams.get('studentId')
    const { filterOptions, loading: _loadingFilters } = useFilterOptions()

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

    // Pagination state for student/parent list
    const [studentsPerPage] = useState(12) // 12 items per page for better UX
    const [currentStudentPage, setCurrentStudentPage] = useState(1)

    // Filter states
    const [selectedClass, setSelectedClass] = useState<string>('all')
    const [sortBy] = useState<'name' | 'unread' | 'recent'>('unread') // Sort options (no UI to change yet)
    const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set()) // Track collapsed classes

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
    const [parents, setParents] = useState<Parent[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
    const [_loading, setLoading] = useState(false)
    const [_loadingStudents, setLoadingStudents] = useState(false)
    const [_loadingParents, setLoadingParents] = useState(false)
    const [classes, setClasses] = useState<Array<{ id: number; code: string; name: string; studentCount: number }>>([])
    const [_loadingClasses, setLoadingClasses] = useState(false)

    // Load students và parents từ backend
    useEffect(() => {
        loadStudents()
        loadParents()
        loadConversations()
        loadClasses()
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

    const loadParents = async () => {
        try {
            setLoadingParents(true)
            const data = await chatService.getTeacherParents()
            
            // Transform data từ backend sang format Parent
            const transformedParents: Parent[] = data.map((parent: any) => {
                // Lấy student đầu tiên để hiển thị
                const firstStudent = parent.students?.[0]
                return {
                    id: parent.id,
                    name: parent.name,
                    avatar: parent.avatar || '/src/assets/teacher/Avatar_Parent.png',
                    studentName: firstStudent?.studentName || 'Unknown',
                    className: firstStudent?.className || 'Unknown',
                    lastMessage: '',
                    lastMessageTime: '',
                    unreadCount: 0,
                    isOnline: false,
                    totalConversations: 0,
                }
            })
            
            setParents(transformedParents)
        } catch (error) {
            console.error('Error loading parents:', error)
        } finally {
            setLoadingParents(false)
        }
    }

    const loadClasses = async () => {
        try {
            setLoadingClasses(true)
            const data = await chatService.getTeacherClasses()
            setClasses(data)
        } catch (error) {
            console.error('Error loading classes:', error)
        } finally {
            setLoadingClasses(false)
        }
    }

    const loadConversations = useCallback(async () => {
        try {
            setLoading(true)
            const data = await chatService.getTeacherConversations()
            setConversations(data)
            
            // No need to update students/parents arrays - useMemo will handle it automatically
        } catch (error) {
            console.error(' Error loading conversations:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            setLoading(true)
            const data = await chatService.getConversationMessages(conversationId)
            setMessages(data.reverse()) // Reverse để hiển thị từ cũ đến mới
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Remove mock parents data
    // const parents: Parent[] = []

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
        try {
            debugLog(' Received newMessage event:', {
                messageId: message._id,
                conversationId: message.conversationId,
                content: message.content.substring(0, 50),
                isCurrentConv: currentConversationId === message.conversationId
            })

            // Update messages if viewing this conversation
            if (currentConversationId && message.conversationId === currentConversationId) {
                setMessages(prev => {
                    // Check duplicate
                    if (prev.some(m => m._id === message._id)) {
                        debugLog(' Duplicate message detected, skipping')
                        return prev
                    }
                    debugLog(' Adding message to chat window')
                    return [...prev, message]
                })
            }

            // ALWAYS update conversation list for ALL messages (not just current)
            setConversations(prev => {
                const updatedConvs = prev.map(conv => {
                    if (conv._id === message.conversationId) {
                        const isCurrentlyViewing = currentConversationId === message.conversationId
                        debugLog(' Updating conversation in list:', conv._id)
                        return {
                            ...conv,
                            lastMessage: {
                                content: message.content,
                                senderId: message.senderId,
                                senderName: message.senderName,
                                timestamp: message.createdAt
                            },
                            unreadCount: isCurrentlyViewing ? 0 : (conv.unreadCount || 0) + 1,
                            updatedAt: message.createdAt // Update sort order
                        }
                    }
                    return conv
                })
                
                //  ĐẨY CONVERSATION MỚI NHẤT LÊN ĐẦU (real-time)
                const sorted = updatedConvs.sort((a, b) => {
                    const aTime = a.lastMessage?.timestamp || a.updatedAt
                    const bTime = b.lastMessage?.timestamp || b.updatedAt
                    return new Date(bTime).getTime() - new Date(aTime).getTime()
                })
                debugLog(' Conversations sorted, top 3:', sorted.slice(0, 3).map(c => ({
                    id: c._id,
                    lastMsg: c.lastMessage?.content.substring(0, 30)
                })))
                return sorted
            })
        } catch (error) {
            console.error(' Error handling new message:', error)
        }
    }, [currentConversationId])

    const handleConversationUpdated = useCallback((data: any) => {
        try {
            debugLog(' Received conversationUpdated event:', {
                conversationId: data.conversationId,
                lastMessage: data.lastMessage?.content.substring(0, 50),
                isCurrentConv: currentConversationId === data.conversationId
            })

            setConversations(prev => {
                // Find and update the conversation
                const updatedConvs = prev.map(conv => {
                    if (conv._id === data.conversationId) {
                        const isCurrentlyViewing = currentConversationId === data.conversationId
                        debugLog(' Updating conversation in list from conversationUpdated:', conv._id)
                        return {
                            ...conv,
                            lastMessage: data.lastMessage,
                            unreadCount: isCurrentlyViewing ? 0 : (conv.unreadCount || 0) + 1,
                            updatedAt: new Date() // Ensure sort order updates
                        }
                    }
                    return conv
                })
                
                //  ĐẨY CONVERSATION MỚI NHẤT LÊN ĐẦU (real-time)
                const sorted = updatedConvs.sort((a, b) => {
                    const aTime = a.lastMessage?.timestamp || a.updatedAt
                    const bTime = b.lastMessage?.timestamp || b.updatedAt
                    return new Date(bTime).getTime() - new Date(aTime).getTime()
                })
                debugLog(' Conversations sorted from conversationUpdated, top 3:', sorted.slice(0, 3).map(c => ({
                    id: c._id,
                    lastMsg: c.lastMessage?.content.substring(0, 30)
                })))
                return sorted
            })
        } catch (error) {
            console.error(' Error handling conversation updated:', error)
        }
    }, [currentConversationId])

    // Setup Socket.IO for teacher
    useEffect(() => {
        if (conversations.length === 0) return

        // Get teacher userId from first conversation's teacher participant
        const firstConv = conversations[0]
        const teacherParticipant = firstConv?.participants.find(p => p.userType === 'teacher')
        
        if (!teacherParticipant) {
            console.warn('No teacher participant found in conversations')
            return
        }

        // Convert to string to ensure compatibility
        const teacherUserId = String(teacherParticipant.userId)

        const setupSocket = async () => {
            try {
                if (!socketService.isConnected()) {
                    await socketService.connect(teacherUserId, 'teacher')
                    debugLog(' Teacher socket ready:', teacherUserId)
                }

                socketService.onNewMessage(handleNewMessage)
                socketService.onConversationUpdated(handleConversationUpdated)
            } catch (error) {
                console.error(' Failed to setup teacher socket:', error)
            }
        }

        setupSocket()

        return () => {
            socketService.off('newMessage', handleNewMessage)
            socketService.off('conversationUpdated', handleConversationUpdated)
        }
    }, [
        conversations[0]?.participants.find(p => p.userType === 'teacher')?.userId, // Better dependency
        handleNewMessage, 
        handleConversationUpdated
    ])

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
            
            // Lấy tin nhắn cuối cùng làm summary thay vì gộp tất cả
            const summary = lastMsg.content.length > 100 
                ? lastMsg.content.substring(0, 100) + '...'
                : lastMsg.content

            // Xác định sentiment đơn giản
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
                summary,
                tags: ['Tư vấn'],
                sentiment
            }
        }).reverse()
    }, [currentConversationId, messages])

    // Câu hỏi gợi ý cho giảng viên
    const suggestedQuestions: SuggestedQuestion[] = [
        {
            id: '1',
            category: 'Học tập',
            question: 'Em có gặp khó khăn gì trong việc học tập không?',
            icon: ''
        },
        {
            id: '2',
            category: 'Học tập',
            question: 'Em cần hỗ trợ thêm về phần nào của môn học?',
            icon: ''
        },
        {
            id: '3',
            category: 'Tâm lý',
            question: 'Em có cảm thấy áp lực trong học tập không?',
            icon: ''
        },
        {
            id: '4',
            category: 'Tâm lý',
            question: 'Em có điều gì muốn chia sẻ với thầy không?',
            icon: ''
        },
        {
            id: '5',
            category: 'Tài chính',
            question: 'Em có khó khăn về tài chính không?',
            icon: ''
        },
        {
            id: '6',
            category: 'Xã hội',
            question: 'Em có hòa đồng với bạn bè trong lớp không?',
            icon: ''
        },
        {
            id: '7',
            category: 'Chung',
            question: 'Thầy có thể giúp gì cho em?',
            icon: ''
        },
        {
            id: '8',
            category: 'Chung',
            question: 'Em có kế hoạch gì cho học kỳ này chưa?',
            icon: ''
        }
    ]

    // Functions
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !currentConversationId) return

        // Get teacher userId from conversations - find teacher participant
        const currentConv = conversations.find(c => c._id === currentConversationId)
        if (!currentConv) {
            console.error(' Conversation not found:', currentConversationId)
            return
        }

        const teacherParticipant = currentConv.participants.find(p => p.userType === 'teacher')
        if (!teacherParticipant) {
            console.error(' Teacher participant not found in conversation')
            return
        }

        const messageText = messageInput.trim()
        setMessageInput('')

        try {
            // Gửi qua Socket.IO cho real-time (convert userId to string)
            await socketService.sendMessage(
                currentConversationId,
                String(teacherParticipant.userId),
                'teacher',
                messageText
            )
            
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
            console.error(' Error sending message:', error)
            // Restore message input on error
            setMessageInput(messageText)
        }
    }

    const handleSelectStudent = useCallback(async (student: Student | Parent) => {
        // Leave previous conversation room
        if (currentConversationId) {
            socketService.leaveConversation(currentConversationId)
        }

        setSelectedStudent(student)
        setLoading(true)
        
        try {
            // Xác định conversation type dựa trên student hay parent
            const isParent = 'studentName' in student // Parent có studentName field
            const conversationType: 'teacher-student' | 'teacher-parent' = isParent ? 'teacher-parent' : 'teacher-student'
            
            // Tạo hoặc tìm conversation
            const conversation = await chatService.createTeacherConversation(
                student.id,
                student.name,
                conversationType,
                isParent 
                    ? {
                        parentInfo: {
                            parentId: student.id,
                            parentName: student.name,
                            studentName: (student as Parent).studentName,
                            className: student.className,
                        }
                    }
                    : {
                        studentInfo: {
                            studentId: student.id,
                            studentCode: (student as Student).studentCode || '',
                            studentName: student.name,
                            className: student.className,
                            riskLevel: (student as Student).riskLevel,
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
            console.error('Error selecting student/parent:', error)
        } finally {
            setLoading(false)
        }
    }, [currentConversationId, loadMessages, loadConversations])

    const handleUseSuggestion = (question: string) => {
        setMessageInput(question)
        setShowSuggestions(false)
    }

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)

            // Prepare data
            const data: any = {
                recipientType: bulkForm.recipient === 'all' ? 'both' : 
                              bulkForm.recipient === 'students' ? 'students' : 'parents',
                message: bulkForm.content,
                title: bulkForm.title,
            }

            // Add class filter if selected
            if (bulkForm.selectedClass && bulkForm.selectedClass !== 'all') {
                data.classIds = [parseInt(bulkForm.selectedClass)]
            }

            // Send bulk message
            const result = await chatService.sendBulkMessage(data)

            alert(t('messagesNotifications.bulkNotificationModal.sendingSuccess') + `\n- ${t('messagesNotifications.students')}: ${result.sentToStudents}\n- ${t('messagesNotifications.parents')}: ${result.sentToParents}`)
            setIsBulkModalOpen(false)
            setBulkForm({ recipient: 'all', selectedClass: '', title: '', content: '' })
            
            // Refresh conversations
            await loadConversations()
        } catch (error) {
            console.error('Error sending bulk message:', error)
            alert(' Gửi tin nhắn thất bại. Vui lòng thử lại!')
        } finally {
            setLoading(false)
        }
    }

    const handleQuickSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)

            const data = {
                recipientIds: [quickForm.selectedStudent],
                recipientType: 'student' as 'student' | 'parent',
                template: quickForm.template as 'reminder' | 'encouragement' | 'concern' | 'custom',
                customMessage: quickForm.template === 'custom' ? quickForm.content : undefined,
            }

            const result = await chatService.sendQuickMessage(data)

            alert(t('messagesNotifications.quickMessageModal.sendingSuccess') + `\n${result.sent}`)
            setIsQuickModalOpen(false)
            setQuickForm({ selectedStudent: '', template: '', content: '' })
            
            // Refresh conversations
            await loadConversations()
        } catch (error) {
            console.error('Error sending quick message:', error)
            alert(t('messagesNotifications.quickMessageModal.sendingError'))
        } finally {
            setLoading(false)
        }
    }

    const handleUrgentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!urgentForm.confirmed) {
            alert(t('messagesNotifications.urgentAlertModal.enterMessageError'))
            return
        }
        try {
            setLoading(true)

            // Get student IDs based on recipient filter
            let studentIds: string[] = []
            if (urgentForm.recipient === 'atrisk') {
                studentIds = atRiskStudents.map(s => s.id)
            } else if (urgentForm.recipient === 'normal') {
                studentIds = normalStudents.map(s => s.id)
            } else {
                studentIds = students.map(s => s.id)
            }

            if (studentIds.length === 0) {
                alert(t('messagesNotifications.bulkNotificationModal.noStudentsSelected'))
                return
            }

            const data = {
                studentIds,
                alertType: urgentForm.type as 'academic' | 'attendance' | 'behavior' | 'other',
                severity: 'high' as 'high' | 'medium',
                message: urgentForm.content,
                requireConfirmation: urgentForm.confirmed,
                notifyParents: true, // Always notify parents for urgent alerts
            }

            const result = await chatService.sendUrgentAlert(data)

            alert(t('messagesNotifications.urgentAlertModal.sendingSuccess') + `\n- ${t('messagesNotifications.students')}: ${result.sentToStudents}\n- ${t('messagesNotifications.parents')}: ${result.sentToParents}`)
            setIsUrgentModalOpen(false)
            setUrgentForm({ type: 'academic', recipient: 'atrisk', content: '', confirmed: false })
            
            // Refresh conversations
            await loadConversations()
        } catch (error) {
            console.error('Error sending urgent alert:', error)
            alert(t('messagesNotifications.urgentAlertModal.sendingError'))
        } finally {
            setLoading(false)
        }
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

    //  MERGE students với conversations để có real-time data
    const studentsWithConversations = React.useMemo(() => {
        return students.map(student => {
            const conv = conversations.find((c: Conversation) => 
                c.participants.some(p => p.userId === student.id && p.userType === 'student')
            )
            if (conv) {
                return {
                    ...student,
                    lastMessage: conv.lastMessage?.content || '',
                    lastMessageTime: conv.lastMessage?.timestamp 
                        ? new Date(conv.lastMessage.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '',
                    unreadCount: conv.unreadCount || 0,
                    totalConversations: 1,
                }
            }
            return student
        })
    }, [students, conversations])

    //  MERGE parents với conversations
    const parentsWithConversations = React.useMemo(() => {
        return parents.map(parent => {
            const conv = conversations.find((c: Conversation) => 
                c.participants.some(p => p.userId === parent.id && p.userType === 'parent')
            )
            if (conv) {
                return {
                    ...parent,
                    lastMessage: conv.lastMessage?.content || '',
                    lastMessageTime: conv.lastMessage?.timestamp 
                        ? new Date(conv.lastMessage.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '',
                    unreadCount: conv.unreadCount || 0,
                    totalConversations: 1,
                }
            }
            return parent
        })
    }, [parents, conversations])

    // Chia sinh viên thành 2 nhóm (use merged data)
    const atRiskStudents = studentsWithConversations.filter(s => s.riskLevel === 'high' || s.riskLevel === 'medium')
    const normalStudents = studentsWithConversations.filter(s => s.riskLevel === 'low' || !s.riskLevel)

    // Lọc theo nhóm hiện tại
    const currentGroupStudents: Student[] = activeGroup === 'atrisk' 
        ? atRiskStudents 
        : activeGroup === 'normal' 
        ? normalStudents 
        : []

    const currentGroupParents: Parent[] = activeGroup === 'parents' ? parentsWithConversations : []

    // Filter và sort students
    const filteredAndSortedStudents = currentGroupStudents
        .filter(student => {
            const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (student.studentCode && student.studentCode.toLowerCase().includes(searchTerm.toLowerCase()))
            const matchClass = selectedClass === 'all' || student.className === selectedClass
            return matchSearch && matchClass
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'unread':
                    return (b.unreadCount || 0) - (a.unreadCount || 0)
                case 'recent':
                    if (!a.lastMessageTime) return 1
                    if (!b.lastMessageTime) return -1
                    return b.lastMessageTime.localeCompare(a.lastMessageTime)
                case 'name':
                default:
                    return a.name.localeCompare(b.name, 'vi')
            }
        })

    // Filter và sort parents
    const filteredAndSortedParents = currentGroupParents
        .filter(parent => {
            const matchSearch = parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                parent.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                parent.className.toLowerCase().includes(searchTerm.toLowerCase())
            const matchClass = selectedClass === 'all' || parent.className === selectedClass
            return matchSearch && matchClass
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'unread':
                    return (b.unreadCount || 0) - (a.unreadCount || 0)
                case 'recent':
                    if (!a.lastMessageTime) return 1
                    if (!b.lastMessageTime) return -1
                    return b.lastMessageTime.localeCompare(a.lastMessageTime)
                case 'name':
                default:
                    return a.name.localeCompare(b.name, 'vi')
            }
        })

    // Pagination for students
    const totalStudents = filteredAndSortedStudents.length
    const _totalStudentPages = Math.ceil(totalStudents / studentsPerPage)
    const startStudentIndex = (currentStudentPage - 1) * studentsPerPage
    const endStudentIndex = startStudentIndex + studentsPerPage
    const _paginatedStudents = filteredAndSortedStudents.slice(startStudentIndex, endStudentIndex)

    // Pagination for parents
    const totalParents = filteredAndSortedParents.length
    const totalParentPages = Math.ceil(totalParents / studentsPerPage)
    const startParentIndex = (currentStudentPage - 1) * studentsPerPage
    const endParentIndex = startParentIndex + studentsPerPage
    const paginatedParents = filteredAndSortedParents.slice(startParentIndex, endParentIndex)

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

    // Reset student page when switching groups or searching
    useEffect(() => {
        setCurrentStudentPage(1)
    }, [activeGroup, searchTerm])

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
                return ''
            case 'negative':
                return ''
            default:
                return ''
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
                                <h2 className="text-3xl font-bold mb-2">{t('messagesNotifications.title')}</h2>
                                <p className="text-blue-100">{t('messagesNotifications.subtitle')}</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {/* Quick Actions */}
                                <Button
                                    onClick={() => setIsBulkModalOpen(true)}
                                    className="bg-white/20 hover:bg-white/30 text-white shadow-lg border border-white/30 transition-all duration-200 hover:scale-105"
                                            size="sm"
                                        >
                                            <Megaphone className="w-4 h-4 mr-2" />
                                            {t('messagesNotifications.bulkNotification')}
                                        </Button>
                                        <Button
                                            onClick={() => setIsQuickModalOpen(true)}
                                            className="bg-white/20 hover:bg-white/30 text-white shadow-lg border border-white/30 transition-all duration-200 hover:scale-105"
                                            size="sm"
                                        >
                                            <Zap className="w-4 h-4 mr-2" />
                                            {t('messagesNotifications.quickMessage')}
                                        </Button>
                                        <Button
                                            onClick={() => setIsUrgentModalOpen(true)}
                                            className="bg-red-500 hover:bg-red-600 text-white shadow-lg border border-red-600 transition-all duration-200 hover:scale-105"
                                            size="sm"
                                        >
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            {t('messagesNotifications.urgentAlert')}
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
                                        <span>{t('messagesNotifications.atRiskTab')}</span>
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
                                        <span>{t('messagesNotifications.normalTab')}</span>
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
                                        <span>{t('messagesNotifications.parentsTab')}</span>
                                        <Badge className="bg-purple-500 text-white ml-2 transition-all">
                                            {parentsWithConversations.length}
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
                                            {activeGroup === 'atrisk' ? t('messagesNotifications.atRiskStudents') : activeGroup === 'normal' ? t('messagesNotifications.normalStudents') : t('messagesNotifications.parents')}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {activeGroup === 'parents' ? parentsWithConversations.length : currentGroupStudents.length}
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-xs text-blue-100">{t('messagesNotifications.unread')}</span>
                                    </div>
                                    <div className="text-2xl font-bold text-yellow-300">
                                        {activeGroup === 'parents' 
                                            ? parentsWithConversations.filter(p => p.unreadCount > 0).length
                                            : currentGroupStudents.filter(s => s.unreadCount > 0).length
                                        }
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs text-blue-100">{t('messagesNotifications.conversations')}</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {activeGroup === 'parents'
                                            ? parentsWithConversations.reduce((sum, p) => sum + (p.totalConversations || 0), 0)
                                            : currentGroupStudents.reduce((sum, s) => sum + (s.totalConversations || 0), 0)
                                        }
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MessageCircle className="w-4 h-4" />
                                        <span className="text-xs text-blue-100">
                                            {activeGroup === 'parents' ? t('messagesNotifications.avgPerParent') : t('messagesNotifications.avgPerStudent')}
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-300">
                                        {activeGroup === 'parents'
                                            ? (parentsWithConversations.length > 0 
                                                ? Math.round(parentsWithConversations.reduce((sum, p) => sum + (p.totalConversations || 0), 0) / parentsWithConversations.length)
                                                : 0)
                                            : (currentGroupStudents.length > 0
                                                ? Math.round(currentGroupStudents.reduce((sum, s) => sum + (s.totalConversations || 0), 0) / currentGroupStudents.length)
                                                : 0)
                                        }
                                    </div>
                                </div>
                            </div>
                </div>

                {/* Main Content - Full Width Layout */}
                <div className="flex-1 pb-6">
                    {/* Full Width - Danh sách sinh viên grouped by class - Ẩn khi đã chọn */}
                    {!selectedStudent && (
                        <div className="bg-white rounded-xl shadow-sm">
                            <div className="p-6 border-b space-y-4">
                            {/* Filter và Search */}
                            <div className="flex gap-4">
                                {/* Combobox lọc lớp - Cho cả students và parents */}
                                <div className="w-64">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        {t('messagesNotifications.filterByClass')}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white text-gray-900 cursor-pointer appearance-none pr-10"
                                        >
                                            <option value="all">
                                                {t('messagesNotifications.allClasses')} ({classes.length})
                                            </option>
                                            {classes.map((cls) => (
                                                <option key={cls.id} value={cls.name}>
                                                    {cls.name} ({cls.studentCount} {t('messagesNotifications.students')})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                
                                {/* Search bar tìm sinh viên/phụ huynh */}
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {activeGroup === 'parents' ? t('messagesNotifications.searchParent') : t('messagesNotifications.searchStudent')}
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={activeGroup === 'parents' ? t('messagesNotifications.searchParentPlaceholder') : t('messagesNotifications.searchPlaceholder')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách grouped by class */}
                        <div className="p-6 space-y-4">
                            {/* Show students grouped by class */}
                            {activeGroup !== 'parents' && filteredAndSortedStudents.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Users className="w-16 h-16 text-gray-300 mb-4" />
                                    <p className="text-lg text-gray-500 font-medium">{t('messagesNotifications.noResults')}</p>
                                    <p className="text-sm text-gray-400 mt-2">{t('messagesNotifications.tryOtherKeywords')}</p>
                                </div>
                            )}

                            {activeGroup !== 'parents' && (() => {
                                // Group students by class
                                const studentsByClass = filteredAndSortedStudents.reduce((acc, student) => {
                                    const className = student.className || t('messagesNotifications.unclassified')
                                    if (!acc[className]) {
                                        acc[className] = []
                                    }
                                    acc[className].push(student)
                                    return acc
                                }, {} as Record<string, Student[]>)

                                const classNames = Object.keys(studentsByClass).sort()

                                return classNames.map((className) => {
                                    const studentsInClass = studentsByClass[className]
                                    const isCollapsed = collapsedClasses.has(className)
                                    const unreadCount = studentsInClass.filter(s => s.unreadCount > 0).length

                                    const toggleCollapse = () => {
                                        setCollapsedClasses(prev => {
                                            const newSet = new Set(prev)
                                            if (newSet.has(className)) {
                                                newSet.delete(className)
                                            } else {
                                                newSet.add(className)
                                            }
                                            return newSet
                                        })
                                    }

                                    return (
                                        <div key={className} className="border rounded-lg overflow-hidden bg-gray-50">
                                            {/* Class Header - Clickable */}
                                            <button
                                                onClick={toggleCollapse}
                                                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors border-b"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ChevronDown 
                                                        className={`w-5 h-5 text-blue-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} 
                                                    />
                                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                                    <div className="text-left">
                                                        <h3 className="font-semibold text-gray-900">{className}</h3>
                                                        <p className="text-xs text-gray-600 mt-0.5">
                                                                {studentsInClass.length} {t('messagesNotifications.students')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {unreadCount > 0 && (
                                                        <Badge className="bg-orange-500 text-white animate-pulse">
                                                            {unreadCount} {t('messagesNotifications.unreadBadge')}
                                                        </Badge>
                                                    )}
                                                    <Badge className="bg-blue-100 text-blue-700">
                                                        {studentsInClass.length} SV
                                                    </Badge>
                                                </div>
                                            </button>

                                            {/* Students in Class - Collapsible */}
                                            {!isCollapsed && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4 bg-white">
                                                    {studentsInClass.map((student) => {
                                                        const isSelected = selectedStudent !== null && (selectedStudent as Student | Parent).id === student.id
                                                        return (
                                                            <div
                                                                key={student.id}
                                                                onClick={() => handleSelectStudent(student)}
                                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                                                                    isSelected 
                                                                        ? 'bg-blue-50 border-blue-500 shadow-lg' 
                                                                        : 'bg-white border-gray-200 hover:border-blue-300'
                                                                }`}
                                                            >
                                                                <div className="flex flex-col items-center text-center">
                                                                    {/* Avatar */}
                                                                    <div className="relative mb-3">
                                                                        <img
                                                                            src={student.avatar}
                                                                            alt={student.name}
                                                                            className="w-16 h-16 rounded-full object-cover ring-2 ring-offset-2 ring-gray-200"
                                                                        />
                                                                        {student.isOnline && (
                                                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                                                        )}
                                                                        {student.unreadCount > 0 && (
                                                                            <div className="absolute -top-1 -right-1">
                                                                                <Badge className="bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0">
                                                                                    {student.unreadCount}
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Name & Info */}
                                                                    <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate w-full">
                                                                        {student.name}
                                                                    </h4>
                                                                    {student.studentCode && (
                                                                        <p className="text-xs text-gray-500 mb-2">{student.studentCode}</p>
                                                                    )}

                                                                    {/* Risk Level Badge */}
                                                                    {student.riskLevel && student.riskLevel !== 'low' && (
                                                                        <Badge className={`text-xs mb-2 ${getRiskBadge(student.riskLevel)}`}>
                                                                            {student.riskLevel === 'high' ? ` ${t('messagesNotifications.needAttention')}` : ` ${t('messagesNotifications.monitoring')}`}
                                                                        </Badge>
                                                                    )}

                                                                    {/* Last Message Preview */}
                                                                    {student.lastMessage && (
                                                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2 w-full">
                                                                            {student.lastMessage}
                                                                        </p>
                                                                    )}

                                                                    {/* Stats */}
                                                                    <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t w-full text-xs text-gray-500">
                                                                        <div className="flex items-center gap-1">
                                                                            <MessageCircle className="w-3 h-3" />
                                                                            <span>{student.totalConversations || 0}</span>
                                                                        </div>
                                                                        {student.lastMessageTime && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="w-3 h-3" />
                                                                                <span className="truncate">{student.lastMessageTime}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            })()}
                                
                            {/* Show parents (ungrouped, grid layout) */}
                            {activeGroup === 'parents' && paginatedParents.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <UserCheck className="w-16 h-16 text-gray-300 mb-4" />
                                    <p className="text-lg text-gray-500 font-medium">{t('messagesNotifications.noParentsFound')}</p>
                                    <p className="text-sm text-gray-400 mt-2">{t('messagesNotifications.tryDifferentKeywords')}</p>
                                </div>
                            )}

                            {activeGroup === 'parents' && paginatedParents.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {paginatedParents.map((parent) => {
                                        const isSelected = selectedStudent !== null && (selectedStudent as Student | Parent).id === parent.id
                                        return (
                                            <div
                                                key={parent.id}
                                                onClick={() => handleSelectStudent(parent)}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                                                    isSelected 
                                                        ? 'bg-purple-50 border-purple-500 shadow-lg' 
                                                        : 'bg-white border-gray-200 hover:border-purple-300'
                                                }`}
                                            >
                                                <div className="flex flex-col items-center text-center">
                                                    {/* Avatar */}
                                                    <div className="relative mb-3">
                                                        <img
                                                            src={parent.avatar}
                                                            alt={parent.name}
                                                            className="w-16 h-16 rounded-full object-cover ring-2 ring-offset-2 ring-purple-200"
                                                        />
                                                        {parent.isOnline && (
                                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                                                        )}
                                                        {parent.unreadCount > 0 && (
                                                            <div className="absolute -top-1 -right-1">
                                                                <Badge className="bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0 animate-pulse">
                                                                    {parent.unreadCount}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Name & Info */}
                                                    <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate w-full">
                                                        {parent.name}
                                                    </h4>
                                                    <p className="text-xs text-purple-600 mb-1">
                                                        {t('messagesNotifications.parentOf')}: {parent.studentName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mb-2">{parent.className}</p>

                                                    {/* Last Message Preview */}
                                                    {parent.lastMessage && (
                                                        <p className="text-xs text-gray-600 line-clamp-2 mb-2 w-full">
                                                            {parent.lastMessage}
                                                        </p>
                                                    )}

                                                    {/* Stats */}
                                                    <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t w-full text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <MessageCircle className="w-3 h-3" />
                                                            <span>{parent.totalConversations || 0}</span>
                                                        </div>
                                                        {parent.lastMessageTime && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                <span className="truncate">{parent.lastMessageTime}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Pagination for Parents */}
                            {activeGroup === 'parents' && totalParentPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentStudentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentStudentPage === 1}
                                    >
                                        <ChevronDown className="w-4 h-4 rotate-90 mr-1" />
                                        {t('messagesNotifications.previous')}
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalParentPages)].map((_, i) => {
                                            const page = i + 1
                                            if (
                                                page === 1 || 
                                                page === totalParentPages || 
                                                Math.abs(page - currentStudentPage) <= 1
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentStudentPage(page)}
                                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                                            currentStudentPage === page
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                )
                                            } else if (Math.abs(page - currentStudentPage) === 2) {
                                                return <span key={page} className="text-gray-400 px-2">...</span>
                                            }
                                            return null
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentStudentPage(prev => Math.min(totalParentPages, prev + 1))}
                                        disabled={currentStudentPage === totalParentPages}
                                    >
                                        {t('messagesNotifications.next')}
                                        <ChevronDown className="w-4 h-4 -rotate-90 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Chat Area - Show when student selected */}
                    <div className={`bg-white rounded-xl shadow-sm ${
                        selectedStudent ? 'block' : 'hidden'
                    }`}>
                        {selectedStudent && (
                            <div className="flex flex-col h-[calc(100vh-200px)]">
                                {/* Chat Header */}
                                <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Back Button */}
                                            <button
                                                onClick={() => setSelectedStudent(null)}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                                title={t('messagesNotifications.backToList')}
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
                                                        <span className="text-xs text-green-600">● {t('messagesNotifications.activeNow')}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {'riskLevel' in selectedStudent && selectedStudent.riskLevel && selectedStudent.riskLevel !== 'low' && (
                                                <Badge className={getRiskBadge(selectedStudent.riskLevel)}>
                                                    {selectedStudent.riskLevel === 'high' ? ' Cần chú ý' : ' Theo dõi'}
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
                                                {t('messagesNotifications.conversationHistory')} ({selectedStudent.totalConversations || 0})
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Messages - Full height với flex-1 */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth">
                                    {/* Empty state khi chưa có tin nhắn */}
                                    {displayedMessages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                            <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
                                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                                {t('messagesNotifications.noMessages')}
                                            </h3>
                                            <p className="text-gray-500 max-w-md">
                                                {t('messagesNotifications.startConversation')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Nút tải thêm tin nhắn cũ hơn */}
                                    {displayedMessages.length > 0 && hasMoreMessages && (
                                        <div className="flex justify-center mb-4">
                                            <Button
                                                onClick={loadMoreMessages}
                                                variant="ghost"
                                                size="sm"
                                                className="bg-white hover:bg-gray-100 shadow-sm transition-all duration-200"
                                            >
                                                <ChevronDown className="w-4 h-4 mr-2 rotate-180" />
                                                {t('messagesNotifications.loadMoreMessages')} ({totalMessages - displayedMessages.length} {t('messagesNotifications.messagesCount')})
                                            </Button>
                                        </div>
                                    )}
                                    
                                    {/* Hiển thị messages với date separator */}
                                    {displayedMessages.map((msg, index) => {
                                        const isTeacher = msg.senderType === 'teacher'
                                        const timestamp = new Date(msg.createdAt).toLocaleTimeString('vi-VN', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })
                                        
                                        // Check nếu đổi ngày so với tin nhắn trước
                                        const showDateSeparator = index === 0 || 
                                            new Date(msg.createdAt).toLocaleDateString('vi-VN') !== 
                                            new Date(displayedMessages[index - 1].createdAt).toLocaleDateString('vi-VN')
                                        
                                        return (
                                            <React.Fragment key={msg._id}>
                                                {/* Date Separator */}
                                                {showDateSeparator && (
                                                    <div className="flex items-center justify-center my-4">
                                                        <div className="bg-gray-200 text-gray-600 text-xs px-4 py-1.5 rounded-full font-medium">
                                                            {new Date(msg.createdAt).toLocaleDateString('vi-VN', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Message Bubble */}
                                                <div
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
                                            </React.Fragment>
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
                                                placeholder={t('messagesNotifications.typingPlaceholder')}
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
                                            {showSuggestions ? t('messagesNotifications.hideSuggestions') : t('messagesNotifications.suggestedQuestions')}
                                        </Button>
                                        <span className="text-xs text-gray-400">{t('messagesNotifications.enterShiftEnterInfo')}</span>
                                    </div>
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
                                        {t('messagesNotifications.consultingHistory')}
                                    </CardTitle>
                                    {selectedStudent && (
                                        <div className="mt-2 flex items-center gap-2 text-sm">
                                            <Badge className="bg-indigo-100 text-indigo-700">
                                                {conversationHistories.length} {t('messagesNotifications.sessionsCount')}
                                            </Badge>
                                            {conversationHistories.length > 0 && (
                                                <span className="text-gray-500">
                                                    {t('messagesNotifications.mostRecent')}: {new Date(conversationHistories[0].date).toLocaleDateString('vi-VN')}
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
                                                                    {conv.messageCount} {t('messagesNotifications.messages')}
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
                                                        <p className="text-sm text-gray-500">{t('messagesNotifications.noConsultingHistory')}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full p-8 text-center">
                                            <div>
                                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm text-gray-500">{t('messagesNotifications.selectStudentToViewHistory')}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {t('messagesNotifications.historyHelpTracking')}
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
                                                    <span className="text-xs text-gray-600">{t('messagesNotifications.positive')}</span>
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
                                    {t('messagesNotifications.suggestedQuestionsTitle')}
                                </CardTitle>
                                <p className="text-xs text-gray-600 mt-1">{t('messagesNotifications.suggestedQuestionsSubtitle')}</p>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[800px] overflow-y-auto">
                                {/* Tự mở rộng theo nội dung */}
                                <div>
                                    {[t('messagesNotifications.learning'), t('messagesNotifications.psychology'), t('messagesNotifications.finance'), t('messagesNotifications.social'), t('messagesNotifications.general')].map((category) => (
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
                                    {t('messagesNotifications.bulkNotificationModal.title')}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-3">{t('messagesNotifications.bulkNotificationModal.selectRecipients')}</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {
[
                                                { value: 'all', label: t('messagesNotifications.bulkNotificationModal.allStudents'), count: `${students.length} ${t('messagesNotifications.students')}` },
                                                { value: 'class', label: t('messagesNotifications.bulkNotificationModal.byClass'), count: t('messagesNotifications.bulkNotificationModal.selectClass') },
                                                { value: 'students', label: t('messagesNotifications.bulkNotificationModal.atRiskStudents'), count: `${students.length} ${t('messagesNotifications.students')}` },
                                                { value: 'parents', label: t('messagesNotifications.parentsTab'), count: `${parents.length} ${t('messagesNotifications.parents')}` }
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
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('messagesNotifications.class')}</label>
                                            <select
                                                value={bulkForm.selectedClass}
                                                onChange={(e) => setBulkForm({ ...bulkForm, selectedClass: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                required
                                            >
                                                <option value="">{t('messagesNotifications.bulkNotificationModal.selectClassOption')}</option>
                                                {classes.length > 0 ? (
                                                    classes.map((cls) => (
                                                        <option key={cls.id} value={cls.id}>
                                                            {cls.code} ({cls.studentCount} {t('messagesNotifications.students')})
                                                        </option>
                                                    ))
                                                ) : (
                                                    filterOptions.classes.map((className) => (
                                                        <option key={className} value={className}>
                                                            {className}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('messagesNotifications.bulkNotificationModal.messageTitle')}</label>
                                        <input
                                            type="text"
                                            value={bulkForm.title}
                                            onChange={(e) => setBulkForm(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder={t('messagesNotifications.bulkNotificationModal.titlePlaceholder')}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('messagesNotifications.bulkNotificationModal.messageContent')}</label>
                                        <textarea
                                            rows={5}
                                            value={bulkForm.content}
                                            onChange={(e) => setBulkForm(prev => ({ ...prev, content: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            placeholder={t('messagesNotifications.bulkNotificationModal.messagePlaceholder')}
                                            required
                                        />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600">
                                            <Send className="w-4 h-4 mr-2" />
                                            {t('messagesNotifications.bulkNotificationModal.send')}
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
                                    {t('messagesNotifications.quickMessageModal.title')}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('messagesNotifications.studentName')}</label>
                                        <select
                                            value={quickForm.selectedStudent}
                                            onChange={(e) => setQuickForm({ ...quickForm, selectedStudent: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        >
                                            <option value="">{t('messagesNotifications.bulkNotificationModal.selectStudentOption')}</option>
                                            {students.map((student) => (
                                                <option key={student.id} value={student.id}>
                                                    {student.name} - {student.className}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('messagesNotifications.bulkNotificationModal.messageContent')}</label>
                                        <textarea
                                            rows={8}
                                            value={quickForm.content}
                                            onChange={(e) => setQuickForm(prev => ({ ...prev, content: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder={t('messagesNotifications.bulkNotificationModal.messagePlaceholder')}
                                            required
                                        />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600">
                                            <Send className="w-4 h-4 mr-2" />
                                            {t('messagesNotifications.quickMessageModal.send')}
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
                                    {t('messagesNotifications.urgentAlertModal.title')}
                                </h3>
                                <Button
                                    onClick={() => setIsUrgentModalOpen(false)}
                                    className="text-white hover:text-gray-200 p-1"
                                    variant="ghost"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                            <p className="text-red-100 mt-2">{t('messagesNotifications.urgentAlertModal.subtitle')}</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUrgentSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('messagesNotifications.urgentAlertModal.alertType')}</label>
                                        <select
                                            value={urgentForm.type}
                                            onChange={(e) => setUrgentForm({ ...urgentForm, type: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            required
                                        >
                                            <option value="academic"> {t('messagesNotifications.urgentAlertModal.academicWarning')}</option>
                                            <option value="attendance"> {t('messagesNotifications.urgentAlertModal.attendanceWarning')}</option>
                                            <option value="behavior"> {t('messagesNotifications.urgentAlertModal.behaviorIssue')}</option>
                                            <option value="other"> {t('messagesNotifications.urgentAlertModal.other')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('messagesNotifications.bulkNotificationModal.selectRecipients')}</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="urgentRecipient"
                                                    value="atrisk"
                                                    checked={urgentForm.recipient === 'atrisk'}
                                                    onChange={(e) => setUrgentForm({ ...urgentForm, recipient: e.target.value })}
                                                    className="mr-2"
                                                />
                                                <span>{t('messagesNotifications.atRiskTab')} ({atRiskStudents.length} {t('messagesNotifications.students')})</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="urgentRecipient"
                                                    value="normal"
                                                    checked={urgentForm.recipient === 'normal'}
                                                    onChange={(e) => setUrgentForm({ ...urgentForm, recipient: e.target.value })}
                                                    className="mr-2"
                                                />
                                                <span>{t('messagesNotifications.normalTab')} ({normalStudents.length} {t('messagesNotifications.students')})</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="urgentRecipient"
                                                    value="all"
                                                    checked={urgentForm.recipient === 'all'}
                                                    onChange={(e) => setUrgentForm({ ...urgentForm, recipient: e.target.value })}
                                                    className="mr-2"
                                                />
                                                <span>{t('messagesNotifications.bulkNotificationModal.allStudents')} ({students.length} {t('messagesNotifications.students')})</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('messagesNotifications.urgentAlertModal.messageContent')}</label>
                                        <textarea
                                            rows={4}
                                            value={urgentForm.content}
                                            onChange={(e) => setUrgentForm(prev => ({ ...prev, content: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder={t('messagesNotifications.urgentAlertModal.messagePlaceholder')}
                                            required
                                        />
                                    </div>

                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <AlertTriangle className="w-5 h-5 text-red-500 mt-1 mr-3" />
                                            <div>
                                                <h4 className="text-sm font-medium text-red-800">{t('messagesNotifications.urgentAlertModal.confirmSend')}</h4>
                                                <p className="text-sm text-red-700 mt-1">{t('messagesNotifications.urgentAlertModal.confirmMessage')}</p>
                                                <label className="flex items-center mt-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={urgentForm.confirmed}
                                                        onChange={(e) => setUrgentForm(prev => ({ ...prev, confirmed: e.target.checked }))}
                                                        className="mr-2"
                                                        required
                                                    />
                                                    <span className="text-sm text-red-700">{t('messagesNotifications.urgentAlertModal.confirmCheckbox')}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <Button type="submit" className="flex-1 bg-red-500 hover:bg-red-600">
                                            <AlertTriangle className="w-4 h-4 mr-2" />
                                            {t('messagesNotifications.urgentAlertModal.send')}
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
