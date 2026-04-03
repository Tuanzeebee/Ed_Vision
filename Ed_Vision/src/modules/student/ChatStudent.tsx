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
  const [settingsTab, setSettingsTab] = useState<'general' | 'notifications' | 'privacy' | 'appearance'>('general')

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

  // Active chat (for students mode)
  const [activeStudentChat, setActiveStudentChat] = useState<number | null>(null)

  // Active group chat
  const [activeGroupChat, setActiveGroupChat] = useState<number | null>(null)

  // Student chats (mock data for students mode)
  const [studentMessages, setStudentMessages] = useState<Record<number, Array<{ id: string; from: 'me' | 'other'; text: string }>>>({
    1: [
      { id: 's1', from: 'other', text: 'Chào bạn! Mình có thắc mắc về bài tập môn Toán.' },
      { id: 's2', from: 'me', text: 'Chào bạn, bạn cần giúp gì?' }
    ],
    2: [
      { id: 's3', from: 'other', text: 'Bạn ơi, nhóm học tập ngày mai vẫn họp nhé?' },
      { id: 's4', from: 'me', text: 'Ừ, vẫn họp như bình thường nhé!' }
    ],
    3: [
      { id: 's5', from: 'other', text: 'Bạn có tài liệu ôn thi môn Lý không?' }
    ]
  })

  // Group chats (mock data for groups mode)
  const [groupMessages, setGroupMessages] = useState<Record<number, Array<{ id: string; from: 'me' | 'other'; sender: string; text: string; isTeacher?: boolean }>>>({
    1: [
      { id: 'g1', from: 'other', sender: 'TS. Nguyễn Văn D', text: 'Chào cả nhóm! Hôm nay chúng ta sẽ thảo luận về đề tài nghiên cứu.', isTeacher: true },
      { id: 'g2', from: 'other', sender: 'Trần Văn E', text: 'Thưa thầy, em đã chuẩn bị tài liệu rồi ạ.' },
      { id: 'g3', from: 'me', sender: 'Tôi', text: 'Em cũng đã hoàn thành phần của mình rồi ạ.' }
    ],
    2: [
      { id: 'g4', from: 'other', sender: 'Phạm Thị F', text: 'Mọi người ơi, buổi thuyết trình vào thứ 5 tuần này nhé!' },
      { id: 'g5', from: 'me', sender: 'Tôi', text: 'Ok, mình sẽ chuẩn bị slides.' }
    ],
    3: [
      { id: 'g6', from: 'other', sender: 'ThS. Lê Thị G', text: 'Nhóm nào chưa nộp báo cáo thì nộp trước thứ 6 nhé!', isTeacher: true },
      { id: 'g7', from: 'other', sender: 'Hoàng Văn H', text: 'Dạ, nhóm em sẽ nộp đúng hạn ạ.' }
    ]
  })

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
          console.log(' Student socket ready')
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
    if (!chatInput.trim()) return

    const messageText = chatInput.trim()
    const id = 'm' + Date.now()

    // Handle different chat modes
    if (chatMode === 'advisor') {
      if (!currentConversation) return

      // Get student userId from current conversation participants
      const studentParticipant = currentConversation.participants.find(p => p.userType === 'student')
      if (!studentParticipant) {
        showToast('error', 'Lỗi', 'Không tìm thấy thông tin người dùng')
        return
      }

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
    } else if (chatMode === 'students' && activeStudentChat !== null) {
      setStudentMessages(prev => ({
        ...prev,
        [activeStudentChat]: [
          ...(prev[activeStudentChat] || []),
          { id, from: 'me', text: messageText }
        ]
      }))
      setChatInput('')
    } else if (chatMode === 'groups' && activeGroupChat !== null) {
      setGroupMessages(prev => ({
        ...prev,
        [activeGroupChat]: [
          ...(prev[activeGroupChat] || []),
          { id, from: 'me', sender: 'Tôi', text: messageText }
        ]
      }))
      setChatInput('')
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
    if (mode === 'students' && activeStudentChat === null) {
      setActiveStudentChat(1) // Select first student by default
    }
    if (mode === 'groups' && activeGroupChat === null) {
      setActiveGroupChat(1) // Select first group by default
    }
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
                  className={`${navCollapsed ? 'w-full flex items-center justify-center py-3' : 'w-full flex items-center space-x-3 px-3 py-3'} ${chatMode === 'students' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                >
                  <i className="fas fa-users text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="font-medium text-sm">Sinh viên</span>}
                </button>

                <button 
                  onClick={() => switchChatMode('groups')}
                  className={`${navCollapsed ? 'w-full flex items-center justify-center py-3' : 'w-full flex items-center space-x-3 px-3 py-3'} ${chatMode === 'groups' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                >
                  <i className="fas fa-user-friends text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="font-medium text-sm">Nhóm học tập</span>}
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

              {/* Students chat list */}
              {chatMode === 'students' && (
                <div className="border-b border-gray-100">
                  {[
                    { id: 1, name: 'Nguyễn Văn A', lastMsg: 'Chào bạn! Mình có thắc mắc về bài tập môn Toán.', time: '10 phút', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', unread: 2 },
                    { id: 2, name: 'Trần Thị B', lastMsg: 'Bạn ơi, nhóm học tập ngày mai vẫn họp nhé?', time: '1h trước', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face', unread: 0 },
                    { id: 3, name: 'Lê Văn C', lastMsg: 'Bạn có tài liệu ôn thi môn Lý không?', time: '3h trước', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', unread: 1 }
                  ].map((student) => (
                    <div 
                      key={student.id} 
                      onClick={() => setActiveStudentChat(student.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${activeStudentChat === student.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-400">{student.time}</div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 line-clamp-1 flex-1">{student.lastMsg}</p>
                            {student.unread > 0 && (
                              <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">{student.unread}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Groups chat list */}
              {chatMode === 'groups' && (
                <div className="border-b border-gray-100">
                  {[
                    { id: 1, name: 'Nhóm Nghiên cứu Khoa học', lastMsg: 'Chào cả nhóm! Hôm nay chúng ta sẽ thảo luận về đề tài nghiên cứu.', time: '5 phút', members: 8, unread: 3 },
                    { id: 2, name: 'Nhóm Thuyết trình CNTT', lastMsg: 'Mọi người ơi, buổi thuyết trình vào thứ 5 tuần này nhé!', time: '30 phút', members: 5, unread: 0 },
                    { id: 3, name: 'Nhóm Đồ án Tốt nghiệp', lastMsg: 'Nhóm nào chưa nộp báo cáo thì nộp trước thứ 6 nhé!', time: '2h trước', members: 6, unread: 1 }
                  ].map((group) => (
                    <div 
                      key={group.id} 
                      onClick={() => setActiveGroupChat(group.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${activeGroupChat === group.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-users text-white text-sm" />
                          </div>
                          {group.unread > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">{group.unread}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-gray-900">{group.name}</div>
                            <div className="text-xs text-gray-400">{group.time}</div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1 mt-1">{group.lastMsg}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <i className="fas fa-user text-xs mr-1" />
                            <span>{group.members} thành viên</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FAQ expanded - only for advisor mode */}
              {chatMode === 'advisor' && faqExpanded && (
                <div className="p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Câu hỏi thường gặp</h3>
                    <button onClick={toggleFaq} className="text-gray-400 hover:text-gray-600">
                      <i className="fas fa-times" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'faq1',
                        category: 'Học tập',
                        question: 'Làm thế nào để cải thiện điểm số?',
                        answer: 'Bạn nên tham gia đầy đủ các buổi học, hoàn thành bài tập đúng hạn, và chủ động trao đổi với giảng viên khi gặp khó khăn.'
                      },
                      {
                        id: 'faq2',
                        category: 'Học tập',
                        question: 'Khi nào thì đăng ký học phần cho học kỳ mới?',
                        answer: 'Thời gian đăng ký học phần thường diễn ra trước 2-3 tuần so với ngày khai giảng. Hãy theo dõi thông báo từ phòng Đào tạo.'
                      },
                      {
                        id: 'faq3',
                        category: 'Tư vấn',
                        question: 'Tôi có thể đặt lịch hẹn với cố vấn như thế nào?',
                        answer: 'Nhấn vào nút "Đặt lịch hẹn" phía trên để chọn thời gian phù hợp với lịch trình của cố vấn.'
                      },
                      {
                        id: 'faq4',
                        category: 'Tài chính',
                        question: 'Học phí được thanh toán khi nào?',
                        answer: 'Học phí cần được thanh toán trong vòng 2 tuần đầu của mỗi học kỳ. Bạn có thể thanh toán trực tuyến hoặc tại phòng Tài chính.'
                      },
                      {
                        id: 'faq5',
                        category: 'Học bổng',
                        question: 'Điều kiện để nhận học bổng là gì?',
                        answer: 'Điều kiện nhận học bổng bao gồm: GPA >= 3.2, không có môn học nào dưới điểm C, và tham gia đầy đủ các hoạt động học tập.'
                      },
                      {
                        id: 'faq6',
                        category: 'Thực tập',
                        question: 'Khi nào bắt đầu tìm chỗ thực tập?',
                        answer: 'Bạn nên bắt đầu tìm kiếm cơ hội thực tập từ năm thứ 3. Trung tâm Hỗ trợ Sinh viên có danh sách các doanh nghiệp đối tác.'
                      }
                    ].map((faq) => (
                      <div key={faq.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => toggleFaqItem(faq.id)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 text-left">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {faq.category}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                          </div>
                          <i className={`fas fa-chevron-${activeFaqId === faq.id ? 'up' : 'down'} text-gray-400 text-xs flex-shrink-0 ml-2`} />
                        </button>
                        {activeFaqId === faq.id && (
                          <div className="px-3 pb-3 pt-1">
                            <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                            <button
                              onClick={() => insertQuestion(faq.question)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                            >
                              <i className="fas fa-paper-plane" />
                              <span>Gửi câu hỏi này</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={toggleFaq}
                    className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Thu gọn
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* chat list resize handle */}
          <div className="resize-handle" onMouseDown={startChatListResize} style={{ width: 4, cursor: 'col-resize', background: 'transparent' }} />

          {/* MAIN CHAT WINDOW */}
          <main className="flex-1 flex flex-col bg-white">
            {(chatMode === 'advisor' && currentConversation && advisorInfo) || 
             (chatMode === 'students' && activeStudentChat !== null) || 
             (chatMode === 'groups' && activeGroupChat !== null) ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {chatMode === 'advisor' && advisorInfo && (
                        <>
                          <img 
                            src={advisorInfo.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(advisorInfo.name)} 
                            alt={advisorInfo.name} 
                            className="w-10 h-10 rounded-full object-cover" 
                          />
                          <div>
                            <div className="font-medium text-gray-900">{advisorInfo.name}</div>
                            <div className="text-xs text-gray-500">Cố vấn học tập</div>
                          </div>
                        </>
                      )}
                      {chatMode === 'students' && activeStudentChat && (
                        <>
                          <img
                            src={
                              activeStudentChat === 1 ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' :
                              activeStudentChat === 2 ? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face' :
                              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
                            }
                            alt="Student"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {activeStudentChat === 1 ? 'Nguyễn Văn A' : activeStudentChat === 2 ? 'Trần Thị B' : 'Lê Văn C'}
                            </div>
                            <div className="text-xs text-green-600 flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                              Đang hoạt động
                            </div>
                          </div>
                        </>
                      )}
                      {chatMode === 'groups' && activeGroupChat && (
                        <>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-users text-white text-sm" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {activeGroupChat === 1 ? 'Nhóm Nghiên cứu Khoa học' : activeGroupChat === 2 ? 'Nhóm Thuyết trình CNTT' : 'Nhóm Đồ án Tốt nghiệp'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {activeGroupChat === 1 ? '8' : activeGroupChat === 2 ? '5' : '6'} thành viên
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={() => chatMode === 'advisor' && setAdvisorInfoOpen(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <i className="fas fa-info-circle text-lg" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide">
                  <div className="flex justify-center mb-4">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Hôm nay</span>
                  </div>

                  {chatMode === 'advisor' && loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                    </div>
                  ) : chatMode === 'advisor' && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <i className="fas fa-comments text-5xl text-gray-300 mb-4" />
                        <p className="text-gray-500">Chưa có tin nhắn</p>
                        <p className="text-sm text-gray-400 mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                      </div>
                    </div>
                  ) : chatMode === 'advisor' ? (
                    <>
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
                  ) : chatMode === 'students' && activeStudentChat !== null ? (
                    <>
                      {studentMessages[activeStudentChat]?.map((m) => (
                        <div key={m.id} className={m.from === 'other' ? 'flex items-start space-x-3' : 'flex items-end justify-end space-x-3'}>
                          {m.from === 'other' && (
                            <>
                              <img 
                                src={
                                  activeStudentChat === 1 ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' :
                                  activeStudentChat === 2 ? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face' :
                                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
                                }
                                alt="Sinh viên" 
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
                              />
                              <div className="max-w-[70%]">
                                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                  <div className="text-sm text-gray-800">{m.text}</div>
                                </div>
                              </div>
                            </>
                          )}
                          {m.from === 'me' && (
                            <>
                              <div className="max-w-[70%] flex flex-col items-end">
                                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">{m.text}</div>
                              </div>
                              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="Tôi" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            </>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : chatMode === 'groups' && activeGroupChat !== null ? (
                    <>
                      {groupMessages[activeGroupChat]?.map((m) => (
                        <div key={m.id} className={m.from === 'other' ? 'flex items-start space-x-3' : 'flex items-end justify-end space-x-3'}>
                          {m.from === 'other' && (
                            <>
                              <img 
                                src={
                                  m.isTeacher 
                                    ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
                                    : m.sender === 'Trần Văn E' 
                                      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
                                      : m.sender === 'Phạm Thị F'
                                        ? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
                                        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
                                }
                                alt={m.sender} 
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0" 
                              />
                              <div className="max-w-[70%]">
                                <div className="text-xs text-gray-500 mb-1 ml-1">
                                  {m.sender}
                                  {m.isTeacher && <span className="ml-1 text-blue-600 font-medium">(Giảng viên)</span>}
                                </div>
                                <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${m.isTeacher ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'}`}>
                                  <div className="text-sm text-gray-800">{m.text}</div>
                                </div>
                              </div>
                            </>
                          )}
                          {m.from === 'me' && (
                            <>
                              <div className="max-w-[70%] flex flex-col items-end">
                                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">{m.text}</div>
                              </div>
                              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="Tôi" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            </>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : null}
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

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="pb-4 border-b border-gray-100 px-6 pt-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold text-gray-900">Cài đặt</DialogTitle>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-times text-lg" />
                </button>
              </div>
            </DialogHeader>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className="w-56 border-r border-gray-100 bg-gray-50 p-4 overflow-y-auto">
                <nav className="space-y-1">
                  <button
                    onClick={() => setSettingsTab('general')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      settingsTab === 'general'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-cog" />
                    <span className="text-sm font-medium">Chung</span>
                  </button>
                  <button
                    onClick={() => setSettingsTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      settingsTab === 'notifications'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-bell" />
                    <span className="text-sm font-medium">Thông báo</span>
                  </button>
                  <button
                    onClick={() => setSettingsTab('privacy')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      settingsTab === 'privacy'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-shield-alt" />
                    <span className="text-sm font-medium">Bảo mật</span>
                  </button>
                  <button
                    onClick={() => setSettingsTab('appearance')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      settingsTab === 'appearance'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-palette" />
                    <span className="text-sm font-medium">Giao diện</span>
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {settingsTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt chung</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Ngôn ngữ</div>
                            <div className="text-sm text-gray-500">Chọn ngôn ngữ hiển thị</div>
                          </div>
                          <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Tiếng Việt</option>
                            <option>English</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Múi giờ</div>
                            <div className="text-sm text-gray-500">Điều chỉnh múi giờ hiển thị</div>
                          </div>
                          <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>GMT+7 (Hà Nội)</option>
                            <option>GMT+0 (UTC)</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Tự động lưu nháp</div>
                            <div className="text-sm text-gray-500">Lưu tin nhắn đang soạn tự động</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thông báo</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Tin nhắn mới</div>
                            <div className="text-sm text-gray-500">Nhận thông báo khi có tin nhắn mới</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Lịch hẹn</div>
                            <div className="text-sm text-gray-500">Thông báo về các lịch hẹn sắp tới</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Âm thanh</div>
                            <div className="text-sm text-gray-500">Phát âm thanh khi có thông báo</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Email</div>
                            <div className="text-sm text-gray-500">Nhận thông báo qua email</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'privacy' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bảo mật & Quyền riêng tư</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Hiển thị trạng thái</div>
                            <div className="text-sm text-gray-500">Cho phép người khác thấy bạn đang online</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Đã đọc</div>
                            <div className="text-sm text-gray-500">Gửi xác nhận đã đọc tin nhắn</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Lưu trữ tin nhắn</div>
                            <div className="text-sm text-gray-500">Thời gian lưu trữ lịch sử tin nhắn</div>
                          </div>
                          <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Vô thời hạn</option>
                            <option>1 năm</option>
                            <option>6 tháng</option>
                            <option>3 tháng</option>
                          </select>
                        </div>
                        <div className="py-3">
                          <button className="w-full px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors">
                            <i className="fas fa-trash-alt mr-2" />
                            Xóa toàn bộ lịch sử trò chuyện
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Giao diện</h3>
                      <div className="space-y-4">
                        <div className="py-3 border-b border-gray-100">
                          <div className="font-medium text-gray-900 mb-3">Chủ đề</div>
                          <div className="grid grid-cols-3 gap-3">
                            <button className="flex flex-col items-center space-y-2 p-3 border-2 border-blue-500 bg-blue-50 rounded-lg">
                              <div className="w-full h-16 bg-white rounded border border-gray-200"></div>
                              <span className="text-sm font-medium text-gray-900">Sáng</span>
                            </button>
                            <button className="flex flex-col items-center space-y-2 p-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg">
                              <div className="w-full h-16 bg-gray-800 rounded border border-gray-700"></div>
                              <span className="text-sm font-medium text-gray-900">Tối</span>
                            </button>
                            <button className="flex flex-col items-center space-y-2 p-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg">
                              <div className="w-full h-16 bg-gradient-to-br from-white to-gray-800 rounded border border-gray-300"></div>
                              <span className="text-sm font-medium text-gray-900">Tự động</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Cỡ chữ</div>
                            <div className="text-sm text-gray-500">Điều chỉnh kích thước chữ hiển thị</div>
                          </div>
                          <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Nhỏ</option>
                            <option>Trung bình</option>
                            <option>Lớn</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Hiệu ứng</div>
                            <div className="text-sm text-gray-500">Bật/tắt hiệu ứng chuyển động</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900">Chế độ compact</div>
                            <div className="text-sm text-gray-500">Giảm khoảng cách giữa các tin nhắn</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="text-xs text-gray-500">
                Ed Vision Chat v1.0.0
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(false)
                    showToast('success', 'Thành công', 'Cài đặt đã được lưu')
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
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