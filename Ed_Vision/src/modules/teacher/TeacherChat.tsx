import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/teacher/teacher_button"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import {
    MessageCircle,
    Send,
    Search,
    Phone,
    Video,
    MoreVertical,
    Paperclip,
    Smile,
    CheckCheck,
    Circle,
    Filter,
    X,
    Users,
    Clock,
    MessageSquare,
    Zap,
    Pin,
    Archive
} from "lucide-react"
// Types
interface ChatMessage {
    id: string
    sender: 'teacher' | 'student'
    content: string
    timestamp: string
    status: 'sent' | 'delivered' | 'read'
    type: 'text' | 'image' | 'file'
}

interface StudentChat {
    id: string
    studentName: string
    studentAvatar: string
    className: string
    department: string
    semester: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    isOnline: boolean
    messages: ChatMessage[]
}

export default function TeacherChat() {
    // Chat state
    const [selectedChat, setSelectedChat] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')

    // Filter state
    const [searchTerm, setSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [quickFilter, setQuickFilter] = useState('all')
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedDepartment, setSelectedDepartment] = useState('all')
    const [selectedSemester, setSelectedSemester] = useState('all')

    // Bulk messaging state
    const [selectedChats, setSelectedChats] = useState<string[]>([])
    const [bulkMessageMode, setBulkMessageMode] = useState(false)

    // Chat management state
    const [pinnedChats, setPinnedChats] = useState<string[]>(['1', '2'])
    const [archivedChats, setArchivedChats] = useState<string[]>([])

    // Sample data
    const studentChats: StudentChat[] = [
        {
            id: '1',
            studentName: 'Nguyễn Thị Lan',
            studentAvatar: '/src/assets/teacher/Avatar_Student1.png',
            className: 'CNTT01',
            department: 'Công nghệ thông tin',
            semester: 'Kỳ 1',
            lastMessage: 'Em cần hỗ trợ về bài tập lập trình ạ',
            lastMessageTime: '10:30',
            unreadCount: 3,
            isOnline: true,
            messages: [
                {
                    id: '1',
                    sender: 'student',
                    content: 'Chào thầy, em có thể hỏi về bài tập không ạ?',
                    timestamp: '10:25',
                    status: 'read',
                    type: 'text'
                },
                {
                    id: '2',
                    sender: 'teacher',
                    content: 'Chào em, thầy sẵn sàng hỗ trợ. Em gặp khó khăn gì?',
                    timestamp: '10:27',
                    status: 'read',
                    type: 'text'
                },
                {
                    id: '3',
                    sender: 'student',
                    content: 'Em cần hỗ trợ về bài tập lập trình ạ',
                    timestamp: '10:30',
                    status: 'delivered',
                    type: 'text'
                }
            ]
        },
        {
            id: '2',
            studentName: 'Lê Thị Hoa',
            studentAvatar: '/src/assets/teacher/Avatar_Student2.png',
            className: 'KT01',
            department: 'Kế toán',
            semester: 'Kỳ 2',
            lastMessage: 'Thầy ơi, em không hiểu bài tập về nhà',
            lastMessageTime: '09:45',
            unreadCount: 1,
            isOnline: false,
            messages: [
                {
                    id: '1',
                    sender: 'student',
                    content: 'Thầy ơi, em không hiểu bài tập về nhà',
                    timestamp: '09:45',
                    status: 'sent',
                    type: 'text'
                }
            ]
        },
        {
            id: '3',
            studentName: 'Phạm Văn Đức',
            studentAvatar: '/src/assets/teacher/Avatar_Student3.png',
            className: 'CNTT02',
            department: 'Công nghệ thông tin',
            semester: 'Kỳ 2',
            lastMessage: 'Cảm ơn thầy đã giải đáp',
            lastMessageTime: '08:20',
            unreadCount: 0,
            isOnline: true,
            messages: [
                {
                    id: '1',
                    sender: 'teacher',
                    content: 'Em có hiểu bài chưa?',
                    timestamp: '08:15',
                    status: 'read',
                    type: 'text'
                },
                {
                    id: '2',
                    sender: 'student',
                    content: 'Cảm ơn thầy đã giải đáp',
                    timestamp: '08:20',
                    status: 'read',
                    type: 'text'
                }
            ]
        },
        {
            id: '4',
            studentName: 'Trần Minh Tú',
            studentAvatar: '/src/assets/teacher/Avatar_Student1.png',
            className: 'QT01',
            department: 'Quản trị kinh doanh',
            semester: 'Kỳ 1',
            lastMessage: 'Thầy có thể gửi tài liệu tham khảo không ạ?',
            lastMessageTime: 'Hôm qua',
            unreadCount: 2,
            isOnline: false,
            messages: [
                {
                    id: '1',
                    sender: 'student',
                    content: 'Thầy có thể gửi tài liệu tham khảo không ạ?',
                    timestamp: 'Hôm qua',
                    status: 'delivered',
                    type: 'text'
                }
            ]
        }
    ]

    // Filter options
    const departments = ['all', 'Công nghệ thông tin', 'Kế toán', 'Quản trị kinh doanh', 'Kinh tế']
    const classes = ['all', 'CNTT01', 'CNTT02', 'KT01', 'QT01', 'KE01']
    const semesters = ['all', 'Kỳ 1', 'Kỳ 2']

    // Computed values
    const filteredChats = useMemo(() => {
        return studentChats.filter(chat => {
            const matchesSearch = chat.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())

            let matchesQuickFilter = true
            switch (quickFilter) {
                case 'unread':
                    matchesQuickFilter = chat.unreadCount > 0
                    break
                case 'pinned':
                    matchesQuickFilter = pinnedChats.includes(chat.id)
                    break
                case 'archived':
                    matchesQuickFilter = archivedChats.includes(chat.id)
                    break
                case 'priority':
                    matchesQuickFilter = chat.unreadCount > 2 || pinnedChats.includes(chat.id)
                    break
                case 'online':
                    matchesQuickFilter = chat.isOnline
                    break
                default:
                    matchesQuickFilter = !archivedChats.includes(chat.id)
            }

            const matchesClass = selectedClass === 'all' || chat.className === selectedClass
            const matchesDepartment = selectedDepartment === 'all' || chat.department === selectedDepartment
            const matchesSemester = selectedSemester === 'all' || chat.semester === selectedSemester

            return matchesSearch && matchesQuickFilter && matchesClass && matchesDepartment && matchesSemester
        }).sort((a, b) => {
            if (pinnedChats.includes(a.id) && !pinnedChats.includes(b.id)) return -1
            if (!pinnedChats.includes(a.id) && pinnedChats.includes(b.id)) return 1
            if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount
            return 0
        })
    }, [studentChats, searchTerm, quickFilter, pinnedChats, archivedChats, selectedClass, selectedDepartment, selectedSemester])

    const selectedChatData = selectedChat ? studentChats.find(chat => chat.id === selectedChat) : null
    // Event handlers
    const togglePin = (chatId: string) => {
        setPinnedChats(prev =>
            prev.includes(chatId)
                ? prev.filter(id => id !== chatId)
                : [...prev, chatId]
        )
    }

    const toggleArchive = (chatId: string) => {
        setArchivedChats(prev =>
            prev.includes(chatId)
                ? prev.filter(id => id !== chatId)
                : [...prev, chatId]
        )
        if (selectedChat === chatId) {
            setSelectedChat(null)
        }
    }

    const toggleBulkMode = () => {
        setBulkMessageMode(!bulkMessageMode)
        setSelectedChats([])
    }

    const handleChatSelect = (chatId: string) => {
        if (bulkMessageMode) {
            setSelectedChats(prev =>
                prev.includes(chatId)
                    ? prev.filter(id => id !== chatId)
                    : [...prev, chatId]
            )
        } else {
            setSelectedChat(chatId)
        }
    }

    const handleSendMessage = () => {
        if (newMessage.trim() && selectedChat) {
            console.log('Sending message:', newMessage)
            setNewMessage('')
        }
    }

    const sendBulkMessage = () => {
        if (newMessage.trim() && selectedChats.length > 0) {
            console.log('Sending bulk message to:', selectedChats)
            setNewMessage('')
            setBulkMessageMode(false)
            setSelectedChats([])
        }
    }

    const getMessageStatus = (status: string) => {
        switch (status) {
            case 'sent':
                return <Circle className="w-3 h-3 text-gray-400" />
            case 'delivered':
                return <CheckCheck className="w-3 h-3 text-gray-400" />
            case 'read':
                return <CheckCheck className="w-3 h-3 text-blue-500" />
            default:
                return null
        }
    }

    return (
        <TeacherLayout currentPage="chat">
            <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Sidebar */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gradient-to-b from-gray-50 to-white">
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Cuộc trò chuyện</h2>
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={toggleBulkMode}
                                    variant="ghost"
                                    size="sm"
                                    className={`text-white hover:bg-blue-500 ${bulkMessageMode ? 'bg-blue-500' : ''}`}
                                >
                                    <Users className="w-4 h-4" />
                                </Button>
                                <Button
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-blue-500"
                                >
                                    <Filter className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Search bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-blue-300" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm sinh viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg focus:bg-white focus:text-gray-900 placeholder-blue-200 text-white"
                            />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                            {[
                                { key: 'all', label: 'Tất cả', icon: MessageSquare },
                                { key: 'unread', label: 'Chưa đọc', icon: MessageCircle },
                                { key: 'pinned', label: 'Ghim', icon: Pin },
                                { key: 'priority', label: 'Ưu tiên', icon: Zap }
                            ].map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setQuickFilter(key)}
                                    className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${quickFilter === key
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden lg:inline">{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Bulk mode indicator */}
                        {bulkMessageMode && (
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-blue-700">
                                        Đã chọn {selectedChats.length} cuộc trò chuyện
                                    </span>
                                    <Button
                                        onClick={() => setBulkMessageMode(false)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Lọc nâng cao</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="all">Tất cả lớp</option>
                                    {classes.filter(c => c !== 'all').map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="all">Tất cả ngành</option>
                                    {departments.filter(d => d !== 'all').map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="all">Tất cả kỳ</option>
                                    {semesters.filter(s => s !== 'all').map(sem => (
                                        <option key={sem} value={sem}>{sem}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Chat list */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredChats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleChatSelect(chat.id)}
                                className={`relative p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${selectedChat === chat.id ? 'bg-blue-50 border-blue-200 shadow-sm' : ''
                                    } ${bulkMessageMode && selectedChats.includes(chat.id) ? 'bg-blue-100 border-blue-300' : ''
                                    }`}
                            >
                                {/* Pin indicator */}
                                {pinnedChats.includes(chat.id) && (
                                    <div className="absolute top-2 right-2">
                                        <Pin className="w-3 h-3 text-blue-500" />
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    {/* Bulk selection checkbox */}
                                    {bulkMessageMode && (
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedChats.includes(chat.id)}
                                                onChange={() => { }}
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                        </div>
                                    )}

                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={chat.studentAvatar}
                                            alt={chat.studentName}
                                            className="w-12 h-12 rounded-full ring-2 ring-white shadow-sm"
                                        />
                                        {/* Online indicator */}
                                        {chat.isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold text-gray-900 truncate">{chat.studentName}</h4>
                                            <div className="flex items-center space-x-1">
                                                <span className="text-xs text-gray-500">{chat.lastMessageTime}</span>
                                                {chat.unreadCount > 0 && (
                                                    <div className="flex items-center justify-center min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full px-1.5">
                                                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 mb-2">
                                            <Badge className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300">
                                                {chat.className}
                                            </Badge>
                                            <Badge className="text-xs bg-gray-100 text-gray-600">
                                                {chat.semester}
                                            </Badge>
                                            {pinnedChats.includes(chat.id) && (
                                                <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                                    Ghim
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600 truncate leading-relaxed">
                                            {chat.lastMessage}
                                        </p>

                                        {/* Quick actions */}
                                        <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex space-x-1">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        togglePin(chat.id)
                                                    }}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 hover:bg-blue-100"
                                                >
                                                    <Pin className={`w-3 h-3 ${pinnedChats.includes(chat.id) ? 'text-blue-500' : 'text-gray-400'}`} />
                                                </Button>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleArchive(chat.id)
                                                    }}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 hover:bg-gray-100"
                                                >
                                                    <Archive className="w-3 h-3 text-gray-400" />
                                                </Button>
                                            </div>
                                            {chat.isOnline && (
                                                <div className="flex items-center text-xs text-green-600">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                                                    Đang hoạt động
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Empty state */}
                        {filteredChats.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy cuộc trò chuyện</h3>
                                <p className="text-gray-500 text-sm">Hãy thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main chat area */}
                <div className="flex-1 flex flex-col">
                    {selectedChatData ? (
                        <>
                            {/* Chat header */}
                            <div className="p-4 border-b border-gray-200 bg-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <img
                                                src={selectedChatData.studentAvatar}
                                                alt={selectedChatData.studentName}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            {selectedChatData.isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{selectedChatData.studentName}</h3>
                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <span>{selectedChatData.className}</span>
                                                <span>•</span>
                                                <span>{selectedChatData.department}</span>
                                                <span>•</span>
                                                <span>{selectedChatData.semester}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="ghost" size="sm">
                                            <Phone className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Video className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                <div className="space-y-4">
                                    {selectedChatData.messages.map(message => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender === 'teacher'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white text-gray-900 border border-gray-200'
                                                    }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <div className={`flex items-center justify-between mt-1 ${message.sender === 'teacher' ? 'text-blue-100' : 'text-gray-500'
                                                    }`}>
                                                    <span className="text-xs">{message.timestamp}</span>
                                                    {message.sender === 'teacher' && (
                                                        <div className="ml-2">
                                                            {getMessageStatus(message.status)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Message input */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="sm">
                                        <Paperclip className="w-4 h-4" />
                                    </Button>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Nhập tin nhắn..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <Smile className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={handleSendMessage}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                        disabled={!newMessage.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : bulkMessageMode && selectedChats.length > 0 ? (
                        // Bulk message interface
                        <div className="flex-1 flex flex-col">
                            {/* Bulk message header */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Gửi tin nhắn hàng loạt</h3>
                                        <p className="text-sm text-gray-600">
                                            Đang gửi đến {selectedChats.length} sinh viên
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setBulkMessageMode(false)}
                                        variant="ghost"
                                        className="text-gray-600 hover:text-gray-800"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Selected recipients */}
                            <div className="p-4 border-b border-gray-200 bg-white">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Người nhận:</h4>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {selectedChats.map(chatId => {
                                        const chat = studentChats.find(c => c.id === chatId)
                                        return chat ? (
                                            <div key={chatId} className="flex items-center space-x-2 bg-blue-100 rounded-lg px-3 py-1">
                                                <img
                                                    src={chat.studentAvatar}
                                                    alt={chat.studentName}
                                                    className="w-6 h-6 rounded-full"
                                                />
                                                <span className="text-sm text-blue-800">{chat.studentName}</span>
                                                <button
                                                    onClick={() => setSelectedChats(prev => prev.filter(id => id !== chatId))}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : null
                                    })}
                                </div>
                            </div>

                            {/* Bulk message compose */}
                            <div className="flex-1 p-4 bg-gray-50">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Nhập tin nhắn cho tất cả sinh viên đã chọn..."
                                    className="w-full h-full min-h-[200px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>

                            {/* Bulk message actions */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span>Gửi ngay lập tức</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Button
                                            onClick={() => setBulkMessageMode(false)}
                                            variant="ghost"
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            onClick={sendBulkMessage}
                                            className="bg-blue-500 hover:bg-blue-600 text-white"
                                            disabled={!newMessage.trim() || selectedChats.length === 0}
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Gửi đến {selectedChats.length} sinh viên
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // No chat selected
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                            <div className="text-center max-w-md">
                                <div className="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                    <MessageCircle className="w-12 h-12 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Chọn cuộc trò chuyện</h3>
                                <p className="text-gray-600 mb-6">Chọn một sinh viên từ danh sách bên trái để bắt đầu trò chuyện, hoặc sử dụng chế độ gửi hàng loạt để nhắn tin cho nhiều sinh viên cùng lúc.</p>

                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button
                                        onClick={toggleBulkMode}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Gửi tin nhắn hàng loạt
                                    </Button>
                                    <Button
                                        onClick={() => setShowFilters(!showFilters)}
                                        variant="ghost"
                                        className="border border-gray-300"
                                    >
                                        <Filter className="w-4 h-4 mr-2" />
                                        Mở bộ lọc
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TeacherLayout>
    )
}