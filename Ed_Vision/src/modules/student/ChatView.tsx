import { useState, useEffect } from 'react'
import { 
  ChevronLeft, 
  Search, 
  Calendar, 
  HelpCircle, 
  ChevronDown,
  MessageCircle as MessageCircleIcon,
  Phone,
  Video,
  Settings,
  X,
  Paperclip,
  Smile,
  Send,
  Book,
  FileText,
  GraduationCap
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/student/Student_button"

interface Contact {
  id: string
  name: string
  avatar?: string
  initials?: string
  status: 'online' | 'offline' | 'away'
  lastMessage?: string
  time?: string
  unreadCount?: number
  gradient?: string
  isAdvisor?: boolean
  department?: string
}

interface Message {
  id: string
  text: string
  time: string
  sent: boolean
  avatar?: string
}

interface FAQCard {
  id: string
  title: string
  description: string
  template: string
  color: string
  icon: 'book' | 'file' | 'graduation' | 'calendar'
}

const faqCards: FAQCard[] = [
  {
    id: '1',
    title: 'Hướng dẫn đăng ký môn học',
    description: 'Quy trình, thời hạn, điều kiện tiên quyết, cách xử lý lỗi đăng ký.',
    template: 'Em cần được tư vấn về đăng ký môn học: ',
    color: 'blue',
    icon: 'book'
  },
  {
    id: '2',
    title: 'Thủ tục xin nghỉ học',
    description: 'Điều kiện, mẫu đơn, quy trình nộp và thời gian phản hồi.',
    template: 'Em muốn hỏi về thủ tục xin nghỉ học: ',
    color: 'green',
    icon: 'file'
  },
  {
    id: '3',
    title: 'Điều kiện tốt nghiệp',
    description: 'Số tín chỉ, GPA, học phần bắt buộc, chứng chỉ kèm theo.',
    template: 'Em cần biết điều kiện tốt nghiệp: ',
    color: 'purple',
    icon: 'graduation'
  }
]

export default function ChatView() {
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [isAdvisorCollapsed, setIsAdvisorCollapsed] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false)
  const [showFAQPanel, setShowFAQPanel] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isAdvisorChat, setIsAdvisorChat] = useState(false)

  const advisors: Contact[] = [
    {
      id: 'advisor-1',
      name: 'Dr. Nguyen Van A',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      status: 'online',
      isAdvisor: true,
      department: 'Khoa Công nghệ thông tin'
    }
  ]

  const groups: Contact[] = [
    {
      id: 'group-1',
      name: 'Computer Science 2024',
      initials: 'CS',
      gradient: 'from-blue-400 to-purple-500',
      status: 'online',
      lastMessage: 'Minh: Assignment due tomorrow!',
      time: '2:15 PM',
      unreadCount: 3
    },
    {
      id: 'group-2',
      name: 'Study Together',
      initials: 'ST',
      gradient: 'from-green-400 to-teal-500',
      status: 'online',
      lastMessage: 'Lan: Library meeting at 3 PM',
      time: '1:45 PM'
    }
  ]

  const people: Contact[] = [
    {
      id: 'person-1',
      name: 'Mai Nguyen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      status: 'online',
      lastMessage: 'Thanks for the chemistry notes!',
      time: '2:08 PM'
    },
    {
      id: 'person-2',
      name: 'Duc Tran',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      status: 'away',
      lastMessage: 'See you in class tomorrow',
      time: '1:55 PM'
    },
    {
      id: 'person-3',
      name: 'Linh Vo',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      status: 'offline',
      lastMessage: 'Can you send me the lecture slides?',
      time: '12:30 PM'
    }
  ]

  const messages: Message[] = [
    {
      id: '1',
      text: "Hey! I just finished reviewing the chemistry notes you shared. They're really comprehensive!",
      time: '2:05 PM',
      sent: false,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '2',
      text: 'Glad you found them helpful! I spent quite a bit of time organizing them by topic.',
      time: '2:06 PM',
      sent: true
    },
    {
      id: '3',
      text: "Thanks for the chemistry notes! Really helpful for tomorrow's exam. Do you have any practice questions too?",
      time: '2:08 PM',
      sent: false,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: '4',
      text: 'Yes! I have a set of practice problems from last year. Let me send them over.',
      time: '2:09 PM',
      sent: true
    }
  ]

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setShowSidebar(true)
        setShowChatPanel(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Set initial contact
  useEffect(() => {
    if (!selectedContact && people.length > 0) {
      setSelectedContact(people[0])
    }
  }, [])

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact)
    setIsAdvisorChat(contact.isAdvisor || false)
    setShowFAQPanel(contact.isAdvisor || false)
    
    if (isMobile) {
      setShowSidebar(false)
      setShowChatPanel(true)
    }
  }

  const handleBackClick = () => {
    if (isMobile) {
      setShowSidebar(true)
      setShowChatPanel(false)
    }
  }

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Sending message:', messageInput)
      setMessageInput('')
      setShowFAQPanel(false)
    }
  }

  const handleFAQCardClick = (template: string) => {
    setMessageInput(template)
    setShowFAQPanel(false)
  }

  const getIconForFAQ = (icon: string) => {
    switch (icon) {
      case 'book':
        return <Book className="w-5 h-5" />
      case 'file':
        return <FileText className="w-5 h-5" />
      case 'graduation':
        return <GraduationCap className="w-5 h-5" />
      case 'calendar':
        return <Calendar className="w-4 h-4" />
      default:
        return <Book className="w-5 h-5" />
    }
  }

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        hover: 'hover:text-blue-700',
        chipBg: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
        ring: 'focus:ring-blue-300'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        hover: 'hover:text-green-700',
        chipBg: 'bg-green-100 hover:bg-green-200 text-green-700',
        ring: 'focus:ring-green-300'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        hover: 'hover:text-purple-700',
        chipBg: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
        ring: 'focus:ring-purple-300'
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="bg-[#FFF9E6] min-h-screen flex">
      {/* Sidebar */}
      <div 
        className={`${
          isMobile 
            ? `fixed inset-0 z-50 ${showSidebar ? '' : 'hidden'}` 
            : 'relative'
        } w-full lg:w-96 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 flex flex-col`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-sm border-b border-gray-200/30 p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBackClick}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/60 transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-lg">EV</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">Ed_Vision Chat</h1>
                <p className="text-sm text-gray-600">Student Messages</p>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Tìm kiếm cố vấn…"
              className="w-full px-4 py-3 pr-12 bg-white/80 border border-gray-200/50 rounded-2xl text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/15 text-blue-600 rounded-2xl transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Đặt lịch</span>
            </button>
            <button
              onClick={() => setIsFAQModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 hover:bg-green-500/15 text-green-600 rounded-2xl transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm font-medium">FAQ</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Advisors */}
          <div className="p-4 border-b border-gray-200/20">
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => setIsAdvisorCollapsed(!isAdvisorCollapsed)}
            >
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Cố vấn</h3>
              <ChevronDown 
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isAdvisorCollapsed ? '-rotate-90' : ''
                }`}
              />
            </div>
            
            {!isAdvisorCollapsed && (
              <div className="space-y-3">
                {advisors.map((advisor) => (
                  <div 
                    key={advisor.id}
                    className="bg-white/70 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <img 
                          src={advisor.avatar} 
                          alt={advisor.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm">{advisor.name}</h4>
                        <p className="text-xs text-gray-600">{advisor.department}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleContactClick(advisor)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      >
                        <MessageCircleIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-xs font-medium text-gray-700">Chat</span>
                      </button>
                      <button
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/15 text-blue-600 rounded-xl transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">Đặt lịch</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Groups */}
          <div className="p-4 border-b border-gray-200/20">
            <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Groups</h3>
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => handleContactClick(group)}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    selectedContact?.id === group.id
                      ? 'bg-blue-500/8 border-l-4 border-blue-500'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 bg-gradient-to-br ${group.gradient} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-semibold text-sm">{group.initials}</span>
                    </div>
                    {group.unreadCount && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{group.unreadCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800 text-sm truncate">{group.name}</h4>
                      <span className="text-xs text-gray-500">{group.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{group.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* People */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">People</h3>
            <div className="space-y-2">
              {people.map((person) => (
                <div
                  key={person.id}
                  onClick={() => handleContactClick(person)}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    selectedContact?.id === person.id
                      ? 'bg-blue-500/8 border-l-4 border-blue-500'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={person.avatar} 
                      alt={person.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      person.status === 'online' ? 'bg-green-500' :
                      person.status === 'away' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800 text-sm">{person.name}</h4>
                      <span className="text-xs text-gray-500">{person.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{person.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div 
        className={`${
          isMobile 
            ? `fixed inset-0 z-50 ${showChatPanel ? 'flex' : 'hidden'}` 
            : 'flex-1 flex'
        } flex-col bg-white/30`}
      >
        {selectedContact && (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white/70 backdrop-blur-sm border-b border-gray-200/30 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedContact.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'} 
                  alt={selectedContact.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h2 className="font-semibold text-gray-800">{selectedContact.name}</h2>
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Online
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isAdvisorChat && (
                  <button
                    onClick={() => setShowFAQPanel(!showFAQPanel)}
                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                  >
                    <HelpCircle className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <button className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              {/* FAQ Panel */}
              {showFAQPanel && isAdvisorChat && (
                <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-gray-200/30 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Câu hỏi thường gặp</h3>
                    <button
                      onClick={() => setShowFAQPanel(false)}
                      className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-3">
                    {faqCards.map((card) => {
                      const colors = getColorClasses(card.color)
                      return (
                        <div
                          key={card.id}
                          onClick={() => handleFAQCardClick(card.template)}
                          className="bg-white/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                              <div className={colors.text}>
                                {getIconForFAQ(card.icon)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 text-sm mb-1">{card.title}</h4>
                              <p className="text-xs text-gray-600 mb-3">{card.description}</p>
                              <button className={`text-xs font-medium ${colors.text} ${colors.hover} transition-colors`}>
                                Dùng mẫu
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex items-start gap-3 ${message.sent ? 'justify-end' : ''}`}
                  >
                    {!message.sent && message.avatar && (
                      <img 
                        src={message.avatar} 
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div className={`flex flex-col ${message.sent ? 'items-end' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 max-w-xs lg:max-w-md shadow-sm ${
                        message.sent 
                          ? 'bg-[#C4D79B] rounded-tr-md' 
                          : 'bg-gray-100 rounded-tl-md'
                      }`}>
                        <p className="text-gray-800 text-sm">{message.text}</p>
                      </div>
                      <span className={`text-xs text-gray-500 mt-1 ${message.sent ? 'mr-2' : 'ml-2'}`}>
                        {message.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white/70 backdrop-blur-sm border-t border-gray-200/30">
              <div className="flex items-center gap-3">
                <button className="p-3 hover:bg-white/50 rounded-xl transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type your message here…"
                    className="w-full px-4 py-3 pr-12 bg-white/80 border border-gray-200/50 rounded-2xl text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <Smile className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-2xl transition-all duration-200"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Schedule Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Đặt lịch hẹn</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn giờ</label>
                <div className="grid grid-cols-3 gap-2">
                  {['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time) => (
                    <button
                      key={time}
                      className="px-3 py-2 border border-gray-200 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors text-sm"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                <textarea
                  placeholder="Nội dung cần tư vấn..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsScheduleModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Modal */}
      <Dialog open={isFAQModalOpen} onOpenChange={setIsFAQModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Câu hỏi thường gặp</h3>
              <button
                onClick={() => setIsFAQModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-800 mb-2">Làm thế nào để đặt lịch hẹn với cố vấn?</h4>
                <p className="text-sm text-gray-600">
                  Bạn có thể nhấn vào nút "Đặt lịch" ở đầu trang hoặc trong thông tin cố vấn để chọn ngày giờ phù hợp.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-800 mb-2">Tôi có thể nhắn tin với cố vấn bất cứ lúc nào không?</h4>
                <p className="text-sm text-gray-600">
                  Có, bạn có thể gửi tin nhắn bất cứ lúc nào. Cố vấn sẽ phản hồi trong giờ làm việc hoặc khi có thời gian rảnh.
                </p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-800 mb-2">Làm sao để tham gia nhóm chat lớp học?</h4>
                <p className="text-sm text-gray-600">
                  Nhóm chat sẽ được tạo tự động khi bạn đăng ký môn học. Kiểm tra mục "Groups" để xem các nhóm bạn đã tham gia.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Tôi không thể gửi tin nhắn được, phải làm sao?</h4>
                <p className="text-sm text-gray-600">
                  Hãy kiểm tra kết nối internet và thử làm mới trang. Nếu vẫn gặp lỗi, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
