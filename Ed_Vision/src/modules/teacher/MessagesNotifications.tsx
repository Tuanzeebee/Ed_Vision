import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/teacher/teacher_card"
import { Button } from "@/components/ui/teacher/teacher_button"
import { Badge } from "@/components/ui/teacher/teacher_badge"
import TeacherLayout from "./components/TeacherLayout"
import {
    Bell,
    MessageCircle,
    Users,
    Send,
    Eye,
    Save,
    Search,
    X,
    Megaphone,
    Zap,
    AlertTriangle,
    Clock,
    FileText,
    Calendar,
    CheckCircle,
    ArrowUp
} from "lucide-react"

// Interfaces
interface Message {
    id: string
    studentName: string
    studentAvatar: string
    time: string
    content: string
    status: 'warning' | 'late' | 'permission' | 'help'
    className: string
    priority: 'high' | 'medium' | 'low'
}

interface Notification {
    id: string
    title: string
    type: 'announcement' | 'warning' | 'info'
    date: string
    recipients: string
    readRate: number
    status: 'sent' | 'draft' | 'scheduled'
}

export default function MessagesNotifications() {
    // Modal states
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false)
    const [isUrgentModalOpen, setIsUrgentModalOpen] = useState(false)
    const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false)
    const [isGroupManagementOpen, setIsGroupManagementOpen] = useState(false)
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const [isResponseTrackingOpen, setIsResponseTrackingOpen] = useState(false)

    // Form states
    const [bulkForm, setBulkForm] = useState({
        recipient: 'all',
        selectedClass: '',
        title: '',
        content: '',
        priority: 'normal',
        sendTime: 'now'
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

    // Sample data
    const messages: Message[] = [
        {
            id: '1',
            studentName: 'Nguyễn Thị Lan',
            studentAvatar: '/src/assets/teacher/Avatar_Student1.png',
            time: '10:30',
            content: 'Em gặp khó khăn trong việc học tập, cần hỗ trợ gấp về bài tập lớn...',
            status: 'warning',
            className: 'CNTT01',
            priority: 'high'
        },
        {
            id: '2',
            studentName: 'Lê Thị Hoa',
            studentAvatar: '/src/assets/teacher/Avatar_Student2.png',
            time: '09:45',
            content: 'Thầy ơi, em không hiểu bài tập về nhà, có thể giải thích thêm không ạ?',
            status: 'late',
            className: 'KT01',
            priority: 'medium'
        },
        {
            id: '3',
            studentName: 'Phạm Văn Đức',
            studentAvatar: '/src/assets/teacher/Avatar_Student3.png',
            time: '08:20',
            content: 'Em xin phép nghỉ học hôm nay do ốm, sẽ bù bài vào tuần sau...',
            status: 'permission',
            className: 'CNTT02',
            priority: 'low'
        }
    ]

    const notifications: Notification[] = [
        {
            id: '1',
            title: 'Thông báo lịch thi cuối kỳ',
            type: 'announcement',
            date: 'Hôm nay',
            recipients: 'Tất cả lớp (156 sinh viên)',
            readRate: 89,
            status: 'sent'
        },
        {
            id: '2',
            title: 'Cảnh báo điểm danh',
            type: 'warning',
            date: 'Hôm qua',
            recipients: 'Sinh viên cảnh báo (8 sinh viên)',
            readRate: 100,
            status: 'sent'
        },
        {
            id: '3',
            title: 'Lịch học bù',
            type: 'info',
            date: '2 ngày trước',
            recipients: 'Lớp CNTT01 (45 sinh viên)',
            readRate: 95,
            status: 'sent'
        }
    ]

    const messageTemplates = {
        reminder: 'Chào em,\n\nThầy nhắc nhở em về việc nộp bài tập đã được giao. Hạn nộp là ngày ... Nếu có khó khăn gì, em hãy liên hệ với thầy để được hỗ trợ.\n\nTrân trọng,\nThầy [Tên]',
        meeting: 'Chào em,\n\nThầy muốn mời em đến gặp để trao đổi về tình hình học tập. Thời gian: ... tại phòng ...\n\nEm vui lòng xác nhận lại với thầy.\n\nTrân trọng,\nThầy [Tên]',
        support: 'Chào em,\n\nThầy thấy em đang gặp một số khó khăn trong học tập. Thầy sẵn sàng hỗ trợ em. Em có thể liên hệ với thầy bất cứ lúc nào.\n\nTrân trọng,\nThầy [Tên]',
        congratulation: 'Chào em,\n\nThầy xin chúc mừng em về thành tích học tập tốt. Hãy tiếp tục phát huy và duy trì kết quả này.\n\nTrân trọng,\nThầy [Tên]',
        warning: 'Chào em,\n\nThầy cần thông báo với em về tình hình học tập hiện tại. Em cần cải thiện ... để đảm bảo kết quả học tập.\n\nEm hãy liên hệ với thầy để được tư vấn cụ thể.\n\nTrân trọng,\nThầy [Tên]'
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'warning':
                return 'bg-red-100 text-red-800'
            case 'late':
                return 'bg-orange-100 text-orange-800'
            case 'permission':
                return 'bg-blue-100 text-blue-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'warning':
                return 'Cảnh báo'
            case 'late':
                return 'Chậm tiến độ'
            case 'permission':
                return 'Xin phép'
            default:
                return 'Khác'
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'announcement':
                return <Megaphone className="w-5 h-5 text-blue-600" />
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-orange-600" />
            case 'info':
                return <Calendar className="w-5 h-5 text-green-600" />
            default:
                return <Bell className="w-5 h-5 text-gray-600" />
        }
    }

    const handleTemplateChange = (template: string) => {
        if (messageTemplates[template as keyof typeof messageTemplates]) {
            setQuickForm(prev => ({
                ...prev,
                template,
                content: messageTemplates[template as keyof typeof messageTemplates]
            }))
        }
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

    return (
        <TeacherLayout currentPage="messages">
            {/* Header với các nút thao tác quan trọng */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 lg:p-6 mb-6 rounded-xl">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-4 lg:mb-0">
                        <h2 className="text-2xl lg:text-3xl font-bold mb-2">Quản lý Tin nhắn & Thông báo</h2>
                        <p className="text-blue-100">Trung tâm quản lý giao tiếp và thông báo học tập cho sinh viên</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <Button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="bg-green-500 hover:bg-green-600 text-white shadow-lg"
                        >
                            <Megaphone className="w-4 h-4 mr-2" />
                            Thông báo hàng loạt
                        </Button>
                        <Button
                            onClick={() => setIsQuickModalOpen(true)}
                            className="bg-white hover:bg-gray-100 text-blue-600 shadow-lg"
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Tin nhắn nhanh
                        </Button>
                        <Button
                            onClick={() => setIsUrgentModalOpen(true)}
                            className="bg-red-500 hover:bg-red-600 text-white shadow-lg"
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Cảnh báo khẩn cấp
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tin nhắn chưa đọc</p>
                                <p className="text-3xl font-bold text-red-600">12</p>
                                <p className="text-xs text-red-500 mt-1 flex items-center">
                                    <ArrowUp className="w-3 h-3 mr-1" />
                                    +3 từ hôm qua
                                </p>
                            </div>
                            <div className="bg-red-100 rounded-full p-4">
                                <MessageCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">SV cần chú ý</p>
                                <p className="text-3xl font-bold text-orange-600">8</p>
                                <p className="text-xs text-orange-500 mt-1">Cảnh báo học tập</p>
                            </div>
                            <div className="bg-orange-100 rounded-full p-4">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Đã phản hồi hôm nay</p>
                                <p className="text-3xl font-bold text-green-600">23</p>
                                <p className="text-xs text-green-500 mt-1 flex items-center">
                                    <ArrowUp className="w-3 h-3 mr-1" />
                                    Tăng 15%
                                </p>
                            </div>
                            <div className="bg-green-100 rounded-full p-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Thông báo tuần này</p>
                                <p className="text-3xl font-bold text-blue-600">5</p>
                                <p className="text-xs text-blue-500 mt-1">Tỷ lệ đọc 89%</p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-4">
                                <Megaphone className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tin nhắn ưu tiên và Thông báo gần đây */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Tin nhắn ưu tiên cao */}
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Tin nhắn ưu tiên cao</h3>
                            <Badge className="bg-white bg-opacity-20 text-white">8 tin nhắn</Badge>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {messages.map((message) => (
                            <div key={message.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                                <div className="flex items-start space-x-3">
                                    <img
                                        src={message.studentAvatar}
                                        alt={message.studentName}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900">{message.studentName}</h4>
                                            <span className="text-xs text-gray-500">{message.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Badge className={`text-xs font-medium ${getStatusBadge(message.status)}`}>
                                                {getStatusText(message.status)}
                                            </Badge>
                                            <span className="text-xs text-gray-500">{message.className}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                            Xem tất cả tin nhắn ưu tiên
                        </Button>
                    </div>
                </Card>

                {/* Thông báo gần đây */}
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Thông báo gần đây</h3>
                            <Button className="bg-white bg-opacity-20 text-white text-sm hover:bg-opacity-30 transition-colors">
                                Tạo mới
                            </Button>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                            <div key={notification.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                                            <span className="text-xs text-gray-500">{notification.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">Gửi đến: {notification.recipients}</p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <Badge className={`text-xs font-medium ${notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                                                notification.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {notification.status === 'sent' ? 'Đã gửi' :
                                                    notification.status === 'draft' ? 'Nháp' : 'Đã lên lịch'}
                                            </Badge>
                                            <span className="text-xs text-gray-500">Tỷ lệ đọc: {notification.readRate}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                            Xem lịch sử thông báo
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Công cụ hỗ trợ */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Công cụ hỗ trợ giao tiếp</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Thư viện mẫu */}
                    <Button
                        onClick={() => setIsTemplateLibraryOpen(true)}
                        className="group bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg h-auto p-6"
                    >
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 transition-colors shadow-md">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Thư viện mẫu</h4>
                            <p className="text-xs text-gray-500">50+ mẫu tin nhắn</p>
                        </div>
                    </Button>

                    {/* Quản lý nhóm */}
                    <Button
                        onClick={() => setIsGroupManagementOpen(true)}
                        className="group bg-gradient-to-br from-green-50 to-green-100 border border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg h-auto p-6"
                    >
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors shadow-md">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Nhóm sinh viên</h4>
                            <p className="text-xs text-gray-500">Tạo & quản lý nhóm</p>
                        </div>
                    </Button>

                    {/* Lên lịch gửi */}
                    <Button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="group bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg h-auto p-6"
                    >
                        <div className="text-center">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-600 transition-colors shadow-md">
                                <Clock className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Lên lịch gửi</h4>
                            <p className="text-xs text-gray-500">Tự động hóa thông báo</p>
                        </div>
                    </Button>

                    {/* Theo dõi phản hồi */}
                    <Button
                        onClick={() => setIsResponseTrackingOpen(true)}
                        className="group bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg h-auto p-6"
                    >
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600 transition-colors shadow-md">
                                <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Theo dõi phản hồi</h4>
                            <p className="text-xs text-gray-500">Trạng thái đã đọc/chưa đọc</p>
                        </div>
                    </Button>
                </div>
            </Card>

            {/* Modal Thông báo hàng loạt */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                                    {/* Chọn đối tượng */}
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

                                    {/* Chọn lớp */}
                                    {bulkForm.recipient === 'class' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn lớp</label>
                                            <select
                                                value={bulkForm.selectedClass}
                                                onChange={(e) => setBulkForm(prev => ({ ...prev, selectedClass: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="">Chọn lớp...</option>
                                                <option value="CNTT01">CNTT01 - Công nghệ thông tin (45 SV)</option>
                                                <option value="CNTT02">CNTT02 - Công nghệ thông tin (42 SV)</option>
                                                <option value="KT01">KT01 - Kế toán (38 SV)</option>
                                                <option value="QT01">QT01 - Quản trị kinh doanh (31 SV)</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Tiêu đề */}
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

                                    {/* Nội dung */}
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

                                    {/* Tùy chọn */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
                                            <select
                                                value={bulkForm.priority}
                                                onChange={(e) => setBulkForm(prev => ({ ...prev, priority: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="normal">Bình thường</option>
                                                <option value="high">Cao</option>
                                                <option value="urgent">Khẩn cấp</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian gửi</label>
                                            <select
                                                value={bulkForm.sendTime}
                                                onChange={(e) => setBulkForm(prev => ({ ...prev, sendTime: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="now">Gửi ngay</option>
                                                <option value="schedule">Lên lịch gửi</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Nút hành động */}
                                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                                        <Button type="button" variant="secondary" className="flex-1">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Xem trước
                                        </Button>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                                    {/* Chọn sinh viên */}
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

                                    {/* Mẫu tin nhắn nhanh */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mẫu tin nhắn</label>
                                        <select
                                            value={quickForm.template}
                                            onChange={(e) => handleTemplateChange(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Chọn mẫu tin nhắn...</option>
                                            <option value="reminder">Nhắc nhở nộp bài tập</option>
                                            <option value="meeting">Mời họp/tư vấn</option>
                                            <option value="support">Hỗ trợ học tập</option>
                                            <option value="congratulation">Chúc mừng/khen ngợi</option>
                                            <option value="warning">Cảnh báo học tập</option>
                                        </select>
                                    </div>

                                    {/* Nội dung tin nhắn */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung tin nhắn</label>
                                        <textarea
                                            rows={4}
                                            value={quickForm.content}
                                            onChange={(e) => setQuickForm(prev => ({ ...prev, content: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Nhập nội dung tin nhắn..."
                                            required
                                        />
                                    </div>

                                    {/* Nút hành động */}
                                    <div className="flex space-x-3 pt-4">
                                        <Button type="button" variant="secondary" className="flex-1">
                                            <Save className="w-4 h-4 mr-2" />
                                            Lưu nháp
                                        </Button>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                                    {/* Loại cảnh báo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Loại cảnh báo</label>
                                        <select
                                            value={urgentForm.type}
                                            onChange={(e) => setUrgentForm(prev => ({ ...prev, type: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        >
                                            <option value="academic">Cảnh báo học tập</option>
                                            <option value="attendance">Cảnh báo điểm danh</option>
                                            <option value="discipline">Cảnh báo kỷ luật</option>
                                            <option value="urgent">Thông báo khẩn cấp</option>
                                            <option value="meeting">Yêu cầu gặp mặt</option>
                                        </select>
                                    </div>

                                    {/* Chọn sinh viên */}
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

                                    {/* Nội dung cảnh báo */}
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

                                    {/* Yêu cầu xác nhận */}
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

                                    {/* Nút hành động */}
                                    <div className="flex space-x-3 pt-4">
                                        <Button type="button" variant="secondary" className="flex-1">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Xem trước
                                        </Button>
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

            {/* Modal Thư viện mẫu */}
            {isTemplateLibraryOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center">
                                    <FileText className="w-5 h-5 mr-3" />
                                    Thư viện mẫu tin nhắn
                                </h3>
                                <Button
                                    onClick={() => setIsTemplateLibraryOpen(false)}
                                    className="text-white hover:text-gray-200 p-1"
                                    variant="ghost"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                            <p className="text-blue-100 mt-2">Chọn và sử dụng các mẫu tin nhắn có sẵn</p>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(messageTemplates).map(([key, template]) => (
                                    <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            {key === 'reminder' && 'Nhắc nhở nộp bài tập'}
                                            {key === 'meeting' && 'Mời họp/tư vấn'}
                                            {key === 'support' && 'Hỗ trợ học tập'}
                                            {key === 'congratulation' && 'Chúc mừng/khen ngợi'}
                                            {key === 'warning' && 'Cảnh báo học tập'}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                                            {template.substring(0, 100)}...
                                        </p>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    setQuickForm(prev => ({ ...prev, template: key, content: template }));
                                                    setIsTemplateLibraryOpen(false);
                                                    setIsQuickModalOpen(true);
                                                }}
                                            >
                                                Sử dụng
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                Xem trước
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Quản lý nhóm sinh viên */}
            {isGroupManagementOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center">
                                    <Users className="w-5 h-5 mr-3" />
                                    Quản lý nhóm sinh viên
                                </h3>
                                <Button
                                    onClick={() => setIsGroupManagementOpen(false)}
                                    className="text-white hover:text-gray-200 p-1"
                                    variant="ghost"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <Button className="bg-green-500 hover:bg-green-600 text-white">
                                    <Users className="w-4 h-4 mr-2" />
                                    Tạo nhóm mới
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nhóm có sẵn */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Sinh viên cảnh báo</h4>
                                    <p className="text-sm text-gray-600 mb-3">8 sinh viên</p>
                                    <div className="flex space-x-2">
                                        <Button variant="secondary" size="sm">Xem danh sách</Button>
                                        <Button variant="ghost" size="sm">Gửi tin nhắn</Button>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Lớp CNTT01</h4>
                                    <p className="text-sm text-gray-600 mb-3">45 sinh viên</p>
                                    <div className="flex space-x-2">
                                        <Button variant="secondary" size="sm">Xem danh sách</Button>
                                        <Button variant="ghost" size="sm">Gửi tin nhắn</Button>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Lớp CNTT02</h4>
                                    <p className="text-sm text-gray-600 mb-3">42 sinh viên</p>
                                    <div className="flex space-x-2">
                                        <Button variant="secondary" size="sm">Xem danh sách</Button>
                                        <Button variant="ghost" size="sm">Gửi tin nhắn</Button>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Sinh viên xuất sắc</h4>
                                    <p className="text-sm text-gray-600 mb-3">12 sinh viên</p>
                                    <div className="flex space-x-2">
                                        <Button variant="secondary" size="sm">Xem danh sách</Button>
                                        <Button variant="ghost" size="sm">Gửi tin nhắn</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Lên lịch gửi */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center">
                                    <Clock className="w-5 h-5 mr-3" />
                                    Lên lịch gửi thông báo
                                </h3>
                                <Button
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="text-white hover:text-gray-200 p-1"
                                    variant="ghost"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại lịch trình</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option>Nhắc nhở nộp bài tập hàng tuần</option>
                                        <option>Thông báo lịch thi</option>
                                        <option>Cập nhật điểm số</option>
                                        <option>Tùy chỉnh</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                                        <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian</label>
                                        <input type="time" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tần suất</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option>Một lần</option>
                                        <option>Hàng ngày</option>
                                        <option>Hàng tuần</option>
                                        <option>Hàng tháng</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung thông báo</label>
                                    <textarea
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Nhập nội dung thông báo tự động..."
                                    ></textarea>
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <Button variant="secondary" className="flex-1">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Xem trước
                                    </Button>
                                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Lên lịch
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Theo dõi phản hồi */}
            {isResponseTrackingOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-3" />
                                    Theo dõi phản hồi tin nhắn
                                </h3>
                                <Button
                                    onClick={() => setIsResponseTrackingOpen(false)}
                                    className="text-white hover:text-gray-200 p-1"
                                    variant="ghost"
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-6">
                            {/* Thống kê tổng quan */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">89%</div>
                                    <div className="text-sm text-green-700">Đã đọc</div>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-orange-600">8%</div>
                                    <div className="text-sm text-orange-700">Chưa đọc</div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">67%</div>
                                    <div className="text-sm text-blue-700">Đã phản hồi</div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-600">3%</div>
                                    <div className="text-sm text-gray-700">Không phản hồi</div>
                                </div>
                            </div>

                            {/* Danh sách tin nhắn */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Tin nhắn gần đây</h4>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-medium">Thông báo lịch thi cuối kỳ</h5>
                                        <Badge className="bg-green-100 text-green-800">Đã gửi</Badge>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Đã gửi:</span>
                                            <div className="font-medium">156 sinh viên</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Đã đọc:</span>
                                            <div className="font-medium text-green-600">139 (89%)</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Đã phản hồi:</span>
                                            <div className="font-medium text-blue-600">104 (67%)</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Chưa đọc:</span>
                                            <div className="font-medium text-orange-600">17 (11%)</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-medium">Cảnh báo điểm danh</h5>
                                        <Badge className="bg-green-100 text-green-800">Đã gửi</Badge>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Đã gửi:</span>
                                            <div className="font-medium">8 sinh viên</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Đã đọc:</span>
                                            <div className="font-medium text-green-600">8 (100%)</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Đã phản hồi:</span>
                                            <div className="font-medium text-blue-600">6 (75%)</div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Chưa đọc:</span>
                                            <div className="font-medium text-green-600">0 (0%)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </TeacherLayout>
    )
}