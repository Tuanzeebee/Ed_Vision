import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { chatService } from '@/services/chatService'
import { socketService } from '@/services/socketService'
import type { Conversation, ChatMessage } from '@/services/chatService'

type Props = {}

// Interface for teacher/advisor info
interface TeacherInfo {
  id: string
  name: string
  avatar?: string
  email?: string
  department?: string
  isOnline: boolean
}

export default function ChatStudent({}: Props) {
  // Sidebar state
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [navWidth, setNavWidth] = useState<number>(240)
  const [chatListWidth, setChatListWidth] = useState<number>(360)

  // Chat mode: only 'advisor' for now (students and groups later)
  const [chatMode, setChatMode] = useState<'advisor' | 'students' | 'groups'>('advisor')

  // FAQ state
  const [faqExpanded, setFaqExpanded] = useState(false)
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null)

  // Advisor info dialog state
  const [advisorInfoOpen, setAdvisorInfoOpen] = useState(false)

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [_settingsTab, _setSettingsTab] = useState<'general' | 'notifications' | 'privacy' | 'appearance'>('general')

  // Notifications state (readonly - just for display)
  const [notifications] = useState<Array<{
    id: string
    type: 'success' | 'info' | 'warning' | 'error'
    title: string
    message: string
    timestamp: Date
    read: boolean
  }>>([])
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [toastNotifications, setToastNotifications] = useState<Array<{
    id: string
    type: 'success' | 'info' | 'warning' | 'error'
    title: string
    message: string
  }>>([])

  // Real chat data states
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Teacher/Advisor info (from conversation metadata)
  const [advisorInfo, setAdvisorInfo] = useState<TeacherInfo | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  // Resize refs
  const navResizingRef = useRef(false)
  const chatListResizingRef = useRef(false)
  const navStartXRef = useRef(0)
  const navStartWidthRef = useRef(0)
  const chatListStartXRef = useRef(0)
  const chatListStartWidthRef = useRef(0)

  // Load conversations on mount để có unread count ngay từ đầu
  useEffect(() => {
    loadConversations()
  }, [])

  // Setup Socket.IO connection
  useEffect(() => {
    // Get student userId from first conversation participant
    if (conversations.length === 0) return

    const firstConversation = conversations[0]
    const studentParticipant = firstConversation.participants.find(p => p.userType === 'student')
    
    if (!studentParticipant) return

    const setupSocket = async () => {
      // Connect socket only once
      if (!socketService.isConnected()) {
        try {
          await socketService.connect(studentParticipant.userId, 'student')
          console.log('✅ Student socket ready')
        } catch (error) {
          console.error('Failed to connect student socket:', error)
          return
        }
      }

      // Define handlers inline to have access to latest state
      const handleNewMessage = (message: ChatMessage) => {
        if (currentConversation && message.conversationId === currentConversation._id) {
          setMessages(prev => {
            if (prev.some(m => m._id === message._id)) return prev
            return [...prev, message]
          })
          setTimeout(scrollToBottom, 100)
        }
      }

      const handleConversationUpdated = (data: any) => {
        setConversations(prev => prev.map(conv => {
          if (conv._id === data.conversationId) {
            // Chỉ tăng unreadCount nếu KHÔNG đang mở conversation này
            const isCurrentlyViewing = currentConversation?._id === data.conversationId
            return {
              ...conv,
              lastMessage: data.lastMessage,
              unreadCount: isCurrentlyViewing ? 0 : (conv.unreadCount || 0) + 1
            }
          }
          return conv
        }))
      }

      // Register listeners
      socketService.onNewMessage(handleNewMessage)
      socketService.onConversationUpdated(handleConversationUpdated)
    }

    setupSocket()

    // Cleanup only listeners, NOT disconnect socket
    return () => {
      // Note: Listeners will be removed when new ones are registered
    }
  }, [conversations.length, currentConversation])

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      socketService.disconnect()
    }
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 128) + 'px'
  }, [chatInput])

  // Resize handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (navResizingRef.current) {
        const deltaX = e.clientX - navStartXRef.current
        const newWidth = navStartWidthRef.current + deltaX
        const minWidth = navCollapsed ? 64 : 64
        const maxWidth = 280
        if (newWidth >= minWidth && newWidth <= maxWidth) setNavWidth(newWidth)
      }
      if (chatListResizingRef.current) {
        const deltaX = e.clientX - chatListStartXRef.current
        const newWidth = chatListStartWidthRef.current + deltaX
        const minWidth = 280
        const maxWidth = 460
        if (newWidth >= minWidth && newWidth <= maxWidth) setChatListWidth(newWidth)
      }
    }

    function onMouseUp() {
      navResizingRef.current = false
      chatListResizingRef.current = false
      document.body.classList.remove('no-select')
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [navCollapsed])

  // Functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await chatService.getStudentConversations()
      setConversations(data)
      
      // KHÔNG auto-select conversation nữa - để user tự click
      // Badge unread sẽ hiện đúng số tin nhắn chưa đọc
    } catch (error) {
      console.error('Error loading conversations:', error)
      showToast('error', 'Lỗi', 'Không thể tải danh sách cuộc trò chuyện')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    try {
      // Leave previous conversation room
      if (currentConversation) {
        socketService.leaveConversation(currentConversation._id)
      }

      setCurrentConversation(conversation)
      setLoadingMessages(true)
      
      // Join new conversation room
      socketService.joinConversation(conversation._id)
      
      // Load messages - use student-specific method
      const msgs = await chatService.getStudentConversationMessages(conversation._id)
      setMessages(msgs.reverse()) // Reverse to show oldest first
      
      // Extract advisor info from participants
      const advisor = conversation.participants.find(p => p.userType === 'teacher')
      if (advisor) {
        setAdvisorInfo({
          id: advisor.userId,
          name: advisor.userName,
          avatar: advisor.userAvatar,
          email: undefined,
          department: undefined,
          isOnline: false // TODO: implement online status
        })
      }
      
      // Mark as read
      await chatService.markStudentAsRead(conversation._id)
      
      // Update local unread count to 0
      setConversations(prev => prev.map(conv => 
        conv._id === conversation._id 
          ? { ...conv, unreadCount: 0 }
          : conv
      ))
    } catch (error) {
      console.error('Error selecting conversation:', error)
      showToast('error', 'Lỗi', 'Không thể tải tin nhắn')
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || !currentConversation) return

    // Get student userId from current conversation participants
    const studentParticipant = currentConversation.participants.find(p => p.userType === 'student')
    if (!studentParticipant) {
      showToast('error', 'Lỗi', 'Không tìm thấy thông tin người dùng')
      return
    }

    const messageText = chatInput.trim()
    setChatInput('') // Clear input immediately for better UX

    try {
      // Send via Socket.IO for real-time delivery
      await socketService.sendMessage(
        currentConversation._id,
        studentParticipant.userId,
        'student',
        messageText
      )
      
      // Message will be received via socket listener and added to UI
      // No need to manually add it here
      
      // Update conversation's lastMessage locally
      setConversations(prev => prev.map(conv => 
        conv._id === currentConversation._id
          ? { 
              ...conv, 
              lastMessage: {
                content: messageText,
                senderId: studentParticipant.userId,
                senderName: studentParticipant.userName,
                timestamp: new Date()
              }
            }
          : conv
      ))
    } catch (error) {
      console.error('Error sending message:', error)
      showToast('error', 'Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại!')
      setChatInput(messageText) // Restore input on error
    }
  }

  function startNavResize(e: React.MouseEvent) {
    navResizingRef.current = true
    navStartXRef.current = e.clientX
    navStartWidthRef.current = navWidth
    document.body.classList.add('no-select')
    e.preventDefault()
  }

  function startChatListResize(e: React.MouseEvent) {
    chatListResizingRef.current = true
    chatListStartXRef.current = e.clientX
    chatListStartWidthRef.current = chatListWidth
    document.body.classList.add('no-select')
    e.preventDefault()
  }

  function toggleFaq() {
    setFaqExpanded(v => !v)
    setActiveFaqId(null)
  }

  function toggleFaqItem(id: string) {
    setActiveFaqId(prev => (prev === id ? null : id))
  }

  function insertQuestion(q: string) {
    setChatInput(q)
  }

  function switchChatMode(mode: 'advisor' | 'students' | 'groups') {
    setChatMode(mode)
    setFaqExpanded(false)
    setActiveFaqId(null)
    // Không cần reload conversations nữa - đã load sẵn từ đầu
  }

  // Show toast notification
  function showToast(type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) {
    const id = 'toast-' + Date.now()
    const newToast = { id, type, title, message }
    setToastNotifications(prev => [...prev, newToast])
    
    // Auto remove after 15 seconds
    setTimeout(() => {
      setToastNotifications(prev => prev.filter(t => t.id !== id))
    }, 15000)
  }

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length
  const totalUnreadMessages = conversations.reduce((sum, conv) => {
    const unreadForMe = typeof conv.unreadCount === 'number' 
      ? conv.unreadCount 
      : 0
    return sum + unreadForMe
  }, 0)

  return (
    <Card className="h-screen w-screen overflow-hidden">
      <CardContent className="p-0 h-full">
        {/* Custom scrollbar styles */}
        <style>{`
          .scrollbar-hide { scrollbar-width: thin; scrollbar-color: white transparent; }
          .scrollbar-hide::-webkit-scrollbar { width: 10px; height: 10px; }
          .scrollbar-hide::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-hide::-webkit-scrollbar-thumb { background: white; border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          .scrollbar-hide::-webkit-scrollbar-thumb:hover { background: white; }
          .no-select { user-select: none; }
        `}</style>

        <div className="flex h-full">
          {/* NAV SIDEBAR */}
          <aside
            className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-200 ${navCollapsed ? 'sidebar-collapsed' : ''}`}
            style={{ width: navWidth, minWidth: 64, maxWidth: 280 }}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {!navCollapsed && (
                  <button
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
                    onClick={() => navigate(-1)}
                    title="Back"
                  >
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                      <i className="fas fa-arrow-left text-sm text-gray-700" />
                    </span>
                    <span className="font-medium">Quay lại</span>
                  </button>
                )}
              </div>
              <button
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => {
                  setNavCollapsed((v) => {
                    const next = !v
                    setNavWidth(next ? 64 : 240)
                    return next
                  })
                }}
                title={navCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              >
                <i className={`fas ${navCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'} text-sm`} />
              </button>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto scrollbar-hide">
              <div className="space-y-1">
                <button 
                  onClick={() => switchChatMode('advisor')}
                  className={`${navCollapsed ? 'w-full flex items-center justify-center py-3' : 'w-full flex items-center space-x-3 px-3 py-3'} ${chatMode === 'advisor' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                >
                  <i className="fas fa-user-tie text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="font-medium text-sm">Cố vấn</span>}
                  {!navCollapsed && totalUnreadMessages > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {totalUnreadMessages}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => switchChatMode('students')}
                  className={`${navCollapsed ? 'w-full flex items-center justify-center py-3' : 'w-full flex items-center space-x-3 px-3 py-3'} ${chatMode === 'students' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} rounded-lg opacity-50 cursor-not-allowed`}
                  disabled
                >
                  <i className="fas fa-users text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="font-medium text-sm">Sinh viên</span>}
                  {!navCollapsed && <span className="ml-auto text-xs text-gray-400">(Sắp có)</span>}
                </button>

                <button 
                  onClick={() => switchChatMode('groups')}
                  className={`${navCollapsed ? 'w-full flex items-center justify-center py-3' : 'w-full flex items-center space-x-3 px-3 py-3'} ${chatMode === 'groups' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} rounded-lg opacity-50 cursor-not-allowed`}
                  disabled
                >
                  <i className="fas fa-user-friends text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="font-medium text-sm">Nhóm học tập</span>}
                  {!navCollapsed && <span className="ml-auto text-xs text-gray-400">(Sắp có)</span>}
                </button>

                <button 
                  onClick={() => setNotificationPanelOpen(true)}
                  className={`${navCollapsed ? 'w-full flex items-center justify-center py-3 relative' : 'w-full flex items-center space-x-3 px-3 py-3'} text-gray-600 hover:bg-gray-50 rounded-lg`}
                >
                  <i className="fas fa-bell text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="font-medium text-sm">Thông báo</span>}
                  {unreadCount > 0 && (
                    <span className={navCollapsed ? 'absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full' : 'ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full'}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-auto pt-6 space-y-1">
                <button 
                  onClick={() => setSettingsOpen(true)}
                  className={navCollapsed ? 'w-full flex items-center justify-center py-3 text-gray-500 hover:bg-gray-50 rounded-lg' : 'w-full flex items-center space-x-3 px-3 py-3 text-gray-500 hover:bg-gray-50 rounded-lg'}
                >
                  <i className="fas fa-cog text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="font-medium text-sm">Cài đặt</span>}
                </button>
                <button className={navCollapsed ? 'w-full flex items-center justify-center py-3 text-gray-500 hover:bg-gray-50 rounded-lg' : 'w-full flex items-center space-x-3 px-3 py-3 text-gray-500 hover:bg-gray-50 rounded-lg'}>
                  <i className="fas fa-question-circle text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="font-medium text-sm">Trợ giúp</span>}
                </button>
              </div>
            </nav>
          </aside>

          {/* nav resize handle */}
          <div
            className="resize-handle"
            onMouseDown={startNavResize}
            style={{ width: 4, cursor: 'col-resize', background: 'transparent' }}
          />

          {/* CHAT LIST SIDEBAR */}
          <aside className="bg-white border-r border-gray-200 flex flex-col" style={{ width: chatListWidth, minWidth: 280, maxWidth: 460 }}>
            <div className="p-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">
                {chatMode === 'advisor' ? 'Cố vấn học tập' : chatMode === 'students' ? 'Sinh viên' : 'Nhóm học tập'}
              </h2>
              <div className="relative mb-4">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {chatMode === 'advisor' && (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => navigate('/student/booking/scheduler')}
                    className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                  >
                    <i className="fas fa-calendar-plus" />
                    <span>Đặt lịch tư vấn</span>
                  </button>
                  <button 
                    onClick={toggleFaq}
                    className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <i className="fas fa-question-circle" />
                    <span>FAQ</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {chatMode === 'advisor' && !faqExpanded && (
                <div className="border-b border-gray-100">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      <i className="fas fa-comments text-4xl text-gray-300 mb-3" />
                      <p>Chưa có cuộc trò chuyện nào</p>
                      <p className="text-xs mt-1">Hãy bắt đầu chat với cố vấn của bạn!</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const advisor = conv.participants.find(p => p.userType === 'teacher')
                      const isActive = currentConversation?._id === conv._id
                      const myUnread = typeof conv.unreadCount === 'number' ? conv.unreadCount : 0
                      
                      return (
                        <div 
                          key={conv._id} 
                          onClick={() => selectConversation(conv)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${isActive ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <img
                              src={advisor?.userAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(advisor?.userName || 'CV')}
                              alt={advisor?.userName}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm text-gray-900 truncate">
                                  {advisor?.userName || 'Cố vấn'}
                                </div>
                                <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                  {conv.lastMessage?.timestamp 
                                    ? new Date(conv.lastMessage.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                    : ''}
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-gray-600 line-clamp-1 flex-1">
                                  {conv.lastMessage?.content || 'Chưa có tin nhắn'}
                                </p>
                                {myUnread > 0 && (
                                  <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    {myUnread}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* FAQ expanded - only for advisor mode */}
              {chatMode === 'advisor' && faqExpanded && (
                <div className="p-4 bg-gray-50">
                  {/* FAQ content - kept as is for now */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-gray-900">Tất cả FAQ cho sinh viên</h5>
                      <button onClick={toggleFaq} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times text-lg" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Chọn câu hỏi để thêm vào tin nhắn</p>
                  </div>
                  
                  {/* FAQ Topics - simplified */}
                  <div className="space-y-2 mb-4">
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => toggleFaqItem('faq1')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">📘</span>
                          <span className="text-sm font-medium text-gray-700">Đăng ký môn học</span>
                        </div>
                        <i className="fas fa-chevron-down text-gray-400 text-xs" />
                      </button>
                      {activeFaqId === 'faq1' && (
                        <div className="px-3 pb-3 space-y-1">
                          <button onClick={() => insertQuestion('Em không đăng ký được vì trùng lịch thì làm sao?')} className="w-full text-left p-2 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded">
                            Em không đăng ký được vì trùng lịch thì làm sao?
                          </button>
                          <button onClick={() => insertQuestion('Thời gian mở đăng ký bổ sung là khi nào?')} className="w-full text-left p-2 text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded">
                            Thời gian mở đăng ký bổ sung là khi nào?
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button onClick={toggleFaq} className="w-full py-2.5 text-xs text-gray-600 hover:text-gray-800 font-medium bg-white border border-gray-200 hover:bg-gray-50 rounded-lg">
                    <i className="fas fa-chevron-up mr-1" /> Thu gọn FAQ
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* chat list resize handle */}
          <div className="resize-handle" onMouseDown={startChatListResize} style={{ width: 4, cursor: 'col-resize', background: 'transparent' }} />

          {/* MAIN CHAT WINDOW */}
          <main className="flex-1 flex flex-col bg-white">
            {currentConversation && advisorInfo ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={advisorInfo.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(advisorInfo.name)} 
                        alt={advisorInfo.name} 
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                      <div>
                        <div className="font-medium text-gray-900">{advisorInfo.name}</div>
                        <div className="text-xs text-gray-500">Cố vấn học tập</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setAdvisorInfoOpen(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <i className="fas fa-info-circle text-lg" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <i className="fas fa-comments text-5xl text-gray-300 mb-4" />
                        <p className="text-gray-500">Chưa có tin nhắn</p>
                        <p className="text-sm text-gray-400 mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center mb-4">
                        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Hôm nay</span>
                      </div>

                      {messages.map((msg) => {
                        const isFromMe = msg.senderType === 'student'
                        const timestamp = new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        
                        return (
                          <div key={msg._id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                            {!isFromMe && (
                              <img
                                src={msg.senderAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(msg.senderName)}
                                alt={msg.senderName}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            <div className={`max-w-[70%] ${isFromMe ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-2xl px-4 py-2`}>
                              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                              <div className={`text-xs mt-1 ${isFromMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                {timestamp}
                                {isFromMe && msg.isRead && <i className="fas fa-check-double ml-1" />}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Chat Input */}
                <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-end space-x-3">
                    <div className="flex-1 relative">
                      <textarea
                        ref={textareaRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Nhập tin nhắn..."
                        rows={1}
                        className="w-full resize-none overflow-hidden border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
                      />
                    </div>
                    <button 
                      onClick={sendMessage}
                      disabled={!chatInput.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-paper-plane" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <i className="fas fa-comment-dots text-6xl text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn cố vấn để bắt đầu</h3>
                  <p className="text-gray-500">Chọn cuộc trò chuyện từ danh sách bên trái</p>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-3" style={{ maxWidth: '400px' }}>
          {toastNotifications.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start space-x-3 p-4 rounded-lg shadow-lg border ${
                toast.type === 'success' ? 'bg-green-50 border-green-200' :
                toast.type === 'error' ? 'bg-red-50 border-red-200' :
                toast.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              } animate-slideIn`}
            >
              <i className={`fas ${
                toast.type === 'success' ? 'fa-check-circle text-green-500' :
                toast.type === 'error' ? 'fa-exclamation-circle text-red-500' :
                toast.type === 'warning' ? 'fa-exclamation-triangle text-yellow-500' :
                'fa-info-circle text-blue-500'
              } text-xl flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 mb-1">{toast.title}</div>
                <div className="text-sm text-gray-600">{toast.message}</div>
              </div>
              <button
                onClick={() => setToastNotifications(prev => prev.filter(t => t.id !== toast.id))}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          ))}
        </div>

        {/* Advisor Info Dialog - Simplified for now */}
        <Dialog open={advisorInfoOpen} onOpenChange={setAdvisorInfoOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thông tin cố vấn</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {advisorInfo && (
                <div className="flex flex-col items-center text-center">
                  <img
                    src={advisorInfo.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(advisorInfo.name)}
                    alt={advisorInfo.name}
                    className="w-20 h-20 rounded-full object-cover mb-3"
                  />
                  <h3 className="text-lg font-semibold text-gray-900">{advisorInfo.name}</h3>
                  <p className="text-sm text-gray-600">Cố vấn học tập</p>
                  {advisorInfo.email && (
                    <p className="text-sm text-gray-500 mt-2">{advisorInfo.email}</p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog - Placeholder */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cài đặt</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-gray-600">Tính năng đang được phát triển...</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Panel - Placeholder */}
        <Dialog open={notificationPanelOpen} onOpenChange={setNotificationPanelOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thông báo</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500">Chưa có thông báo nào</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`p-3 rounded-lg border ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                      <div className="font-medium text-sm">{notif.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{notif.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
