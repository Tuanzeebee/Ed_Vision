import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Props = {}

export default function ChatStudent({}: Props) {
  // Sidebar state
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [navWidth, setNavWidth] = useState<number>(240)
  const [chatListWidth, setChatListWidth] = useState<number>(360)

  // Chat mode: 'advisor' or 'students'
  const [chatMode, setChatMode] = useState<'advisor' | 'students' | 'groups'>('advisor')

  // FAQ state
  const [faqExpanded, setFaqExpanded] = useState(false)
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null)

  // Advisor info dialog state
  const [advisorInfoOpen, setAdvisorInfoOpen] = useState(false)

  // Group info dialog state
  const [groupInfoOpen, setGroupInfoOpen] = useState(false)
  const [groupMemberTab, setGroupMemberTab] = useState<'teachers' | 'students'>('teachers')
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null)
  const [showTeacherDetail, setShowTeacherDetail] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [showStudentDetail, setShowStudentDetail] = useState(false)
  const [groupDialogSize, setGroupDialogSize] = useState({ width: 512, height: 600 })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'general' | 'notifications' | 'privacy' | 'appearance'>('general')

  // Notifications state
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'info' | 'warning' | 'error'
    title: string
    message: string
    timestamp: Date
    read: boolean
  }>>([
    {
      id: 'n1',
      type: 'success',
      title: 'Đặt lịch thành công',
      message: 'Lịch hẹn với cố vấn vào 14:00 ngày 15/11/2025 đã được xác nhận.',
      timestamp: new Date(Date.now() - 3600000),
      read: false
    },
    {
      id: 'n2',
      type: 'info',
      title: 'Tin nhắn mới',
      message: 'Bạn có tin nhắn mới từ nhóm học tập.',
      timestamp: new Date(Date.now() - 7200000),
      read: false
    },
    {
      id: 'n3',
      type: 'warning',
      title: 'Nhắc nhở',
      message: 'Bạn có lịch hẹn vào 10:00 sáng mai.',
      timestamp: new Date(Date.now() - 86400000),
      read: true
    }
  ])
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const [toastNotifications, setToastNotifications] = useState<Array<{
    id: string
    type: 'success' | 'info' | 'warning' | 'error'
    title: string
    message: string
  }>>([])

  // Active chat (for students mode)
  const [activeStudentChat, setActiveStudentChat] = useState<number | null>(null)

  // Active group chat
  const [activeGroupChat, setActiveGroupChat] = useState<number | null>(null)

  // Chat input and messages
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<Array<{ id: string; from: 'advisor' | 'student'; text: string }>>([
    { id: 'm1', from: 'advisor', text: 'Chào em, em muốn hỏi gì hôm nay?' },
    { id: 'm2', from: 'student', text: 'Em muốn hỏi về kế hoạch học tập.' }
  ])
  
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
  const navigate = useNavigate()

  // Resize refs
  const navResizingRef = useRef(false)
  const chatListResizingRef = useRef(false)
  const navStartXRef = useRef(0)
  const navStartWidthRef = useRef(0)
  const chatListStartXRef = useRef(0)
  const chatListStartWidthRef = useRef(0)

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

  useEffect(() => {
    // auto-resize textarea
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 128) + 'px'
  }, [chatInput])

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
    // visual feedback not necessary here
  }

  function sendMessage() {
    if (!chatInput.trim()) return
    const id = 'm' + Date.now()
    
    if (chatMode === 'advisor') {
      setMessages(prev => [...prev, { id, from: 'student', text: chatInput }])
    } else if (chatMode === 'students' && activeStudentChat !== null) {
      setStudentMessages(prev => ({
        ...prev,
        [activeStudentChat]: [
          ...(prev[activeStudentChat] || []),
          { id, from: 'me', text: chatInput }
        ]
      }))
    } else if (chatMode === 'groups' && activeGroupChat !== null) {
      setGroupMessages(prev => ({
        ...prev,
        [activeGroupChat]: [
          ...(prev[activeGroupChat] || []),
          { id, from: 'me', sender: 'Tôi', text: chatInput }
        ]
      }))
    }
    setChatInput('')
  }

  // Handle dialog resize
  const startDialogResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    // capture start values in closure (no need for separate state)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = groupDialogSize.width
    const startHeight = groupDialogSize.height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      setGroupDialogSize(prev => {
        let newWidth = prev.width
        let newHeight = prev.height

        if (direction.includes('e')) newWidth = Math.max(400, startWidth + deltaX)
        if (direction.includes('w')) newWidth = Math.max(400, startWidth - deltaX)
        if (direction.includes('s')) newHeight = Math.max(400, startHeight + deltaY)
        if (direction.includes('n')) newHeight = Math.max(400, startHeight - deltaY)

        return { width: newWidth, height: newHeight }
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
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

  // Add new notification
  function addNotification(type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) {
    const newNotification = {
      id: 'n' + Date.now(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev])
    showToast(type, title, message)
  }

  // Mark notification as read
  function markNotificationAsRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  // Mark all notifications as read
  function markAllNotificationsAsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Delete notification
  function deleteNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Card className="h-screen w-screen overflow-hidden">
      <CardContent className="p-0 h-full">
        {/* Custom modern scrollbars for component (overrides .scrollbar-hide to show unified thumb) */}
        <style>{`
          .scrollbar-hide { scrollbar-width: thin; scrollbar-color: white transparent; }
          .scrollbar-hide::-webkit-scrollbar { width: 10px; height: 10px; }
          .scrollbar-hide::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-hide::-webkit-scrollbar-thumb { background: white; border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          .scrollbar-hide::-webkit-scrollbar-thumb:hover { background: white; }

          /* utility class if you prefer explicit naming */
          .scrollbar-custom { scrollbar-width: thin; scrollbar-color: white transparent; }
          .scrollbar-custom::-webkit-scrollbar { width: 10px; height: 10px; }
          .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-custom::-webkit-scrollbar-thumb { background: white; border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: white; }

          /* make scrollbars blend softly on dark/light backgrounds */
          .scrollbar-hide, .scrollbar-custom { -ms-overflow-style: auto; }
        `}</style>
        <div className="flex h-full">
          {/* NAV SIDEBAR */}
          <aside
            id="navSidebar"
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
                    aria-label="Back"
                  >
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                      <i className="fas fa-arrow-left text-sm text-gray-700" />
                    </span>
                    <span className="font-medium">Quay lại</span>
                  </button>
                )}
              </div>
              <button
                id="toggleNavBtn"
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
                {(() => {
                  const baseCollapsed = 'w-full flex items-center justify-center py-3'
                  const baseExpanded = 'w-full flex items-center space-x-3 px-3 py-3'
                  return (
                    <>
                      <button 
                        onClick={() => switchChatMode('advisor')}
                        className={navCollapsed ? `${baseCollapsed} ${chatMode === 'advisor' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'} rounded-lg` : `${baseExpanded} ${chatMode === 'advisor' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                      >
                        <i className="fas fa-user-tie text-lg flex-shrink-0" />
                        {!navCollapsed && <span className="sidebar-label font-medium text-sm">Cố vấn</span>}
                      </button>

                      <button 
                        onClick={() => switchChatMode('students')}
                        className={navCollapsed ? `${baseCollapsed} ${chatMode === 'students' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'} rounded-lg` : `${baseExpanded} ${chatMode === 'students' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                      >
                        <i className="fas fa-users text-lg flex-shrink-0" />
                        {!navCollapsed && <span className="sidebar-label font-medium text-sm">Sinh viên</span>}
                      </button>

                      <button 
                        onClick={() => switchChatMode('groups')}
                        className={navCollapsed ? `${baseCollapsed} ${chatMode === 'groups' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'} rounded-lg` : `${baseExpanded} ${chatMode === 'groups' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'} rounded-lg`}
                      >
                        <i className="fas fa-user-friends text-lg flex-shrink-0" />
                        {!navCollapsed && <span className="sidebar-label font-medium text-sm">Nhóm học tập</span>}
                      </button>

                      <button 
                        onClick={() => setNotificationPanelOpen(true)}
                        className={navCollapsed ? `${baseCollapsed} text-gray-600 rounded-lg relative` : `${baseExpanded} text-gray-600 hover:bg-gray-50 rounded-lg`}
                      >
                        <i className="fas fa-bell text-lg flex-shrink-0" />
                        {!navCollapsed && <span className="sidebar-label font-medium text-sm">Thông báo</span>}
                        {unreadCount > 0 && (
                          <span className={navCollapsed ? 'absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full' : 'sidebar-label ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full'}>
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </>
                  )
                })()}
              </div>

              <div className="mt-auto pt-6 space-y-1">
                <button 
                  onClick={() => setSettingsOpen(true)}
                  className={navCollapsed ? 'w-full flex items-center justify-center py-3 text-gray-500 hover:bg-gray-50 rounded-lg' : 'w-full flex items-center space-x-3 px-3 py-3 text-gray-500 hover:bg-gray-50 rounded-lg'}
                >
                  <i className="fas fa-cog text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="sidebar-label font-medium text-sm">Cài đặt</span>}
                </button>
                <button className={navCollapsed ? 'w-full flex items-center justify-center py-3 text-gray-500 hover:bg-gray-50 rounded-lg' : 'w-full flex items-center space-x-3 px-3 py-3 text-gray-500 hover:bg-gray-50 rounded-lg'}>
                  <i className="fas fa-question-circle text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="sidebar-label font-medium text-sm">Trợ giúp</span>}
                </button>
              </div>
            </nav>
          </aside>

          {/* nav resize handle */}
          <div
            id="navResizeHandle"
            className="resize-handle"
            onMouseDown={startNavResize}
            style={{ width: 4, cursor: 'col-resize', background: 'transparent' }}
          />

          {/* CHAT LIST SIDEBAR */}
          <aside id="chatListSidebar" className="bg-white border-r border-gray-200 flex flex-col" style={{ width: chatListWidth, minWidth: 280, maxWidth: 460 }}>
            <div className="p-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">
                {chatMode === 'advisor' ? 'Cố vấn học tập' : chatMode === 'students' ? 'Sinh viên' : 'Nhóm học tập'}
              </h2>
              <div className="relative mb-4">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder={chatMode === 'advisor' ? 'Tìm kiếm cố vấn...' : chatMode === 'students' ? 'Tìm kiếm sinh viên...' : 'Tìm kiếm nhóm...'}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {chatMode === 'advisor' ? (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      navigate('/student/booking/scheduler')
                    }}
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
              ) : chatMode === 'students' ? (
                <button className="w-full flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg">
                  <i className="fas fa-user-plus" />
                  <span>Thêm bạn mới</span>
                </button>
              ) : (
                <button className="w-full flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg">
                  <i className="fas fa-plus-circle" />
                  <span>Tạo nhóm mới</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {chatMode === 'advisor' && !faqExpanded && (
                <div className="border-b border-gray-100">
                  {/* Advisor items - simplified */}
                  {[1, 2, 3].map((n) => (
                    <div key={n} className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${n === 1 ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start space-x-3">
                        <img
                          src={`https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop&crop=face`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm text-gray-900">Cố vấn {n}</div>
                            </div>
                            <div className="text-xs text-gray-400">2h trước</div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">Sẵn sàng hỗ trợ về lộ trình học tập và lựa chọn môn.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {chatMode === 'students' && (
                <div className="border-b border-gray-100">
                  {/* Student items */}
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

              {chatMode === 'groups' && (
                <div className="border-b border-gray-100">
                  {/* Group items */}
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
                <div id="faq-expanded" className="p-4 bg-gray-50">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-gray-900">Tất cả FAQ cho sinh viên</h5>
                      <button onClick={toggleFaq} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Đóng FAQ">
                        <i className="fas fa-times text-lg" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Chọn chủ đề để xem nhanh câu hỏi trước khi nhắn cố vấn</p>

                    {/* Filter Pills */}
                    <div className="flex space-x-2 overflow-x-auto scrollbar-hide mb-3">
                      <button className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-full">Tất cả</button>
                      <button className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors">Đăng ký môn học</button>
                      <button className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors">Thủ tục</button>
                      <button className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors">Tốt nghiệp</button>
                      <button className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-colors">Học phí</button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Tìm câu hỏi theo từ khóa (ví dụ: đăng ký bổ sung, bảo lưu, học phí...)"
                        className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* FAQ Topics Grid */}
                  <div id="faq-topics-grid" className="space-y-2 mb-4">
                    {/* Topic 1 */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => toggleFaqItem('faq1')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">📘</span>
                          <span className="text-sm font-medium text-gray-700">Đăng ký môn học</span>
                        </div>
                        <i className="fas fa-chevron-down text-gray-400 text-xs transition-transform" id="icon-faq1" />
                      </button>
                      <div id="faq1" className={`faq-content ${activeFaqId === 'faq1' ? 'active' : ''}`}>
                        <div className="px-3 pb-3 space-y-1">
                          <button onClick={() => insertQuestion('Em không đăng ký được vì trùng lịch thì làm sao?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Em không đăng ký được vì trùng lịch thì làm sao?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                          <button onClick={() => insertQuestion('Thời gian mở đăng ký bổ sung là khi nào?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Thời gian mở đăng ký bổ sung là khi nào?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                          <button onClick={() => insertQuestion('Có thể học vượt tín chỉ không?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Có thể học vượt tín chỉ không?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Topic 2 */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => toggleFaqItem('faq2')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">📝</span>
                          <span className="text-sm font-medium text-gray-700">Thủ tục - đơn từ</span>
                        </div>
                        <i className="fas fa-chevron-down text-gray-400 text-xs transition-transform" id="icon-faq2" />
                      </button>
                      <div id="faq2" className={`faq-content ${activeFaqId === 'faq2' ? 'active' : ''}`}>
                        <div className="px-3 pb-3 space-y-1">
                          <button onClick={() => insertQuestion('Xin nghỉ học có phép cần làm thủ tục gì?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Xin nghỉ học có phép cần làm thủ tục gì?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                          <button onClick={() => insertQuestion('Đơn xin bảo lưu kết quả học tập nộp ở đâu?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Đơn xin bảo lưu kết quả học tập nộp ở đâu?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Topic 3 */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => toggleFaqItem('faq3')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">🎓</span>
                          <span className="text-sm font-medium text-gray-700">Tốt nghiệp</span>
                        </div>
                        <i className="fas fa-chevron-down text-gray-400 text-xs transition-transform" id="icon-faq3" />
                      </button>
                      <div id="faq3" className={`faq-content ${activeFaqId === 'faq3' ? 'active' : ''}`}>
                        <div className="px-3 pb-3 space-y-1">
                          <button onClick={() => insertQuestion('Điều kiện tốt nghiệp là gì?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Điều kiện tốt nghiệp là gì?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                          <button onClick={() => insertQuestion('Khoá luận tốt nghiệp có bắt buộc không?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Khoá luận tốt nghiệp có bắt buộc không?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Topic 4 */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => toggleFaqItem('faq4')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">💳</span>
                          <span className="text-sm font-medium text-gray-700">Học phí - lệ phí</span>
                        </div>
                        <i className="fas fa-chevron-down text-gray-400 text-xs transition-transform" id="icon-faq4" />
                      </button>
                      <div id="faq4" className={`faq-content ${activeFaqId === 'faq4' ? 'active' : ''}`}>
                        <div className="px-3 pb-3 space-y-1">
                          <button onClick={() => insertQuestion('Học phí 1 tín chỉ là bao nhiêu?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Học phí 1 tín chỉ là bao nhiêu?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                          <button onClick={() => insertQuestion('Hạn nộp học phí là khi nào?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                            <span>Hạn nộp học phí là khi nào?</span>
                            <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Popular Questions Section */}
                  <div id="faq-popular-list" className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <h6 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Câu hỏi nổi bật</h6>
                    <div className="space-y-2">
                      <button onClick={() => insertQuestion('Em không đăng ký được vì trùng lịch thì làm sao?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                        <span>Em không đăng ký được vì trùng lịch thì làm sao?</span>
                        <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                      </button>
                      <button onClick={() => insertQuestion('Điều kiện tốt nghiệp là gì?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                        <span>Điều kiện tốt nghiệp là gì?</span>
                        <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                      </button>
                      <button onClick={() => insertQuestion('Học phí 1 tín chỉ là bao nhiêu?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                        <span>Học phí 1 tín chỉ là bao nhiêu?</span>
                        <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                      </button>
                      <button onClick={() => insertQuestion('Xin nghỉ học có phép cần làm thủ tục gì?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                        <span>Xin nghỉ học có phép cần làm thủ tục gì?</span>
                        <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                      </button>
                      <button onClick={() => insertQuestion('Thời gian mở đăng ký bổ sung là khi nào?')} className="w-full flex items-center justify-between p-2 text-left text-xs text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors group">
                        <span>Thời gian mở đăng ký bổ sung là khi nào?</span>
                        <i className="fas fa-arrow-right text-gray-300 group-hover:text-blue-500 text-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Collapse Button */}
                  <button onClick={toggleFaq} className="w-full py-2.5 text-xs text-gray-600 hover:text-gray-800 font-medium bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                    <i className="fas fa-chevron-up mr-1" /> Thu gọn FAQ
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* chat list resize handle */}
          <div id="chatListResizeHandle" className="resize-handle" onMouseDown={startChatListResize} style={{ width: 4, cursor: 'col-resize', background: 'transparent' }} />

          {/* MAIN CHAT WINDOW */}
          <main className="flex-1 flex flex-col bg-white">
            <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {chatMode === 'advisor' ? (
                    <>
                      <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face" alt="Cố vấn" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-gray-900">Cố vấn học tập</div>
                        <div className="text-xs text-gray-500">Sẵn sàng trợ giúp</div>
                      </div>
                    </>
                  ) : chatMode === 'students' ? (
                    <>
                      {activeStudentChat !== null && (
                        <>
                          <img 
                            src={
                              activeStudentChat === 1 ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' :
                              activeStudentChat === 2 ? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face' :
                              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
                            }
                            alt="Sinh viên" 
                            className="w-8 h-8 rounded-full object-cover" 
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {activeStudentChat === 1 ? 'Nguyễn Văn A' : activeStudentChat === 2 ? 'Trần Thị B' : 'Lê Văn C'}
                            </div>
                            <div className="text-xs text-green-500 flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                              Đang hoạt động
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {activeGroupChat !== null && (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-users text-white text-xs" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {activeGroupChat === 1 ? 'Nhóm Nghiên cứu Khoa học' : activeGroupChat === 2 ? 'Nhóm Thuyết trình CNTT' : 'Nhóm Đồ án Tốt nghiệp'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {activeGroupChat === 1 ? '8 thành viên' : activeGroupChat === 2 ? '5 thành viên' : '6 thành viên'}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                {chatMode === 'advisor' && (
                  <button title="Thông tin cố vấn" aria-label="Thông tin cố vấn" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => setAdvisorInfoOpen(true)}>
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                      <i className="fas fa-info text-sm" />
                    </span>
                  </button>
                )}
                {chatMode === 'groups' && (
                  <button 
                    title="Thông tin nhóm" 
                    aria-label="Thông tin nhóm" 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                    onClick={() => setGroupInfoOpen(true)}
                  >
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                      <i className="fas fa-info-circle text-sm" />
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
              <div className="flex justify-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Hôm nay</span>
              </div>

              {chatMode === 'advisor' ? (
                <>
                  {messages.map((m) => (
                    <div key={m.id} className={m.from === 'advisor' ? 'flex items-start space-x-3' : 'flex items-end justify-end space-x-3'}>
                      {m.from === 'advisor' && (
                        <>
                          <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face" alt="Cố vấn" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          <div className="max-w-[70%]">
                            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                              <div className="text-sm text-gray-800">{m.text}</div>
                            </div>
                          </div>
                        </>
                      )}

                      {m.from === 'student' && (
                        <>
                          <div className="max-w-[70%] flex flex-col items-end">
                            <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">{m.text}</div>
                          </div>
                          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Sinh viên" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        </>
                      )}
                    </div>
                  ))}

                  {/* Typing indicator example */}
                  <div className="flex items-start space-x-3">
                    <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face" alt="Cố vấn" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="text-sm text-gray-800">...</div>
                    </div>
                  </div>
                </>
              ) : chatMode === 'students' ? (
                <>
                  {activeStudentChat !== null && studentMessages[activeStudentChat]?.map((m) => (
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
                </>
              ) : (
                <>
                  {activeGroupChat !== null && groupMessages[activeGroupChat]?.map((m) => (
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
                </>
              )}
            </div>

            {/* Chat Input (from chatstudent.html, converted to JSX) */}
            <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
              {/* Input Area */}
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    id="chatInput"
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
                    aria-label="Nhập tin nhắn"
                  />
                </div>
                <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex-shrink-0" title="Emoji" aria-label="Emoji">
                  <i className="fas fa-smile" />
                </button>
                <button onClick={sendMessage} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg transition-colors flex-shrink-0" title="Gửi tin nhắn" aria-label="Gửi tin nhắn">
                  <i className="fas fa-paper-plane" />
                </button>
              </div>
            </div>
          </main>
        </div>

        {/* Group Info Dialog */}
        <Dialog open={groupInfoOpen} onOpenChange={setGroupInfoOpen}>
          <DialogContent 
            className="max-w-none p-0 overflow-hidden"
            style={{ 
              width: `${groupDialogSize.width}px`, 
              height: `${groupDialogSize.height}px`,
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
          >
            <div className="relative w-full h-full flex flex-col">
              {/* Resize handles */}
              <div 
                className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50"
                onMouseDown={(e) => startDialogResize(e, 'ne')}
                style={{ background: 'transparent' }}
              />
              <div 
                className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50"
                onMouseDown={(e) => startDialogResize(e, 'nw')}
                style={{ background: 'transparent' }}
              />
              <div 
                className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50"
                onMouseDown={(e) => startDialogResize(e, 'se')}
                style={{ background: 'transparent' }}
              />
              <div 
                className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50"
                onMouseDown={(e) => startDialogResize(e, 'sw')}
                style={{ background: 'transparent' }}
              />
              <div 
                className="absolute top-0 left-3 right-3 h-2 cursor-n-resize z-40"
                onMouseDown={(e) => startDialogResize(e, 'n')}
                style={{ background: 'transparent' }}
              />
              <div 
                className="absolute bottom-0 left-3 right-3 h-2 cursor-s-resize z-40"
                onMouseDown={(e) => startDialogResize(e, 's')}
                style={{ background: 'transparent' }}
              />
              <div 
                className="absolute left-0 top-3 bottom-3 w-2 cursor-w-resize z-40"
                onMouseDown={(e) => startDialogResize(e, 'w')}
                style={{ background: 'transparent' }}
              />
              <div 
                className="absolute right-0 top-3 bottom-3 w-2 cursor-e-resize z-40"
                onMouseDown={(e) => startDialogResize(e, 'e')}
                style={{ background: 'transparent' }}
              />

            <DialogHeader className="pb-4 border-b border-gray-100 px-6 pt-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-gray-900">Thông tin nhóm học tập</DialogTitle>
                <button 
                  onClick={() => setGroupInfoOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng"
                >
                  <i className="fas fa-times text-lg" />
                </button>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="space-y-5">
              {!showTeacherDetail && !showStudentDetail ? (
                <>
              {/* Group Info */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-3 ring-2 ring-blue-100">
                  <i className="fas fa-users text-white text-2xl" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {activeGroupChat === 1 ? 'Nhóm Nghiên cứu Khoa học' : 
                   activeGroupChat === 2 ? 'Nhóm Thuyết trình CNTT' : 
                   'Nhóm Đồ án Tốt nghiệp'}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {activeGroupChat === 1 ? '8 thành viên' : 
                   activeGroupChat === 2 ? '5 thành viên' : 
                   '6 thành viên'}
                </p>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">Đang hoạt động</span>
              </div>

              {/* Members List */}
              <div className="px-2">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 px-2">Danh sách thành viên</h4>
                
                {/* Tab Navigation - Toggle Switch Style */}
                <div className="relative bg-gray-100 rounded-full p-1 mb-4 mx-2">
                  <div 
                    className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out"
                    style={{
                      left: groupMemberTab === 'teachers' ? '4px' : 'calc(50% + 0px)',
                      right: groupMemberTab === 'teachers' ? 'calc(50% + 0px)' : '4px'
                    }}
                  />
                  <div className="relative flex">
                    <button
                      onClick={() => {
                        setGroupMemberTab('teachers')
                        setSelectedTeacher(null)
                      }}
                      className={`flex-1 py-2 px-4 text-xs font-medium rounded-full transition-colors duration-300 relative z-10 ${
                        groupMemberTab === 'teachers'
                          ? 'text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <i className="fas fa-chalkboard-teacher mr-1.5" />
                      Giảng viên ({activeGroupChat === 1 ? '1' : activeGroupChat === 2 ? '1' : '1'})
                    </button>
                    <button
                      onClick={() => {
                        setGroupMemberTab('students')
                        setSelectedTeacher(null)
                      }}
                      className={`flex-1 py-2 px-4 text-xs font-medium rounded-full transition-colors duration-300 relative z-10 ${
                        groupMemberTab === 'students'
                          ? 'text-gray-900'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <i className="fas fa-user-graduate mr-1.5" />
                      Sinh viên ({activeGroupChat === 1 ? '7' : activeGroupChat === 2 ? '4' : '5'})
                    </button>
                  </div>
                </div>

                {/* Teachers Section */}
                {groupMemberTab === 'teachers' && (
                  <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '300px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {activeGroupChat === 1 && (
                      <button
                        onClick={() => {
                          setSelectedTeacher(1)
                          setShowTeacherDetail(true)
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-50 border-2 border-transparent hover:border-blue-200"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                            alt="Giảng viên"
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-100"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">TS. Nguyễn Văn D</div>
                            <div className="text-xs text-gray-500">Khoa Công nghệ thông tin</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </button>
                      )}
                    {activeGroupChat === 2 && (
                      <button
                        onClick={() => {
                          setSelectedTeacher(2)
                          setShowTeacherDetail(true)
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-50 border-2 border-transparent hover:border-blue-200"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
                            alt="Giảng viên"
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-100"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">ThS. Trần Văn K</div>
                            <div className="text-xs text-gray-500">Khoa Công nghệ thông tin</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
                          </div>
                        </button>
                      )}
                    {activeGroupChat === 3 && (
                      <button
                        onClick={() => {
                          setSelectedTeacher(3)
                          setShowTeacherDetail(true)
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-gray-50 border-2 border-transparent hover:border-blue-200"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
                            alt="Giảng viên"
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-blue-100"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">ThS. Lê Thị G</div>
                            <div className="text-xs text-gray-500">Khoa Công nghệ thông tin</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                      </button>
                    )}
                  </div>
                )}

                {/* Students Section */}
                {groupMemberTab === 'students' && (
                  <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '300px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {activeGroupChat === 1 && (
                        <>
                        <button 
                          onClick={() => {
                            setSelectedStudent(1)
                            setShowStudentDetail(true)
                          }}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">Trần Văn E</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063001</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(2)
                            setShowStudentDetail(true)
                          }}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">Nguyễn Thị I</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063002</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(3)
                            setShowStudentDetail(true)
                          }}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">Lê Văn J</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063003</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
                          </div>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(4)
                            setShowStudentDetail(true)
                          }}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">Phạm Văn M</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063004</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(5)
                            setShowStudentDetail(true)
                          }}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">Hoàng Thị N</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063005</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
                          </div>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(6)
                            setShowStudentDetail(true)
                          }}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">Vũ Văn O</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063006</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(7)
                            setShowStudentDetail(true)
                          }}
                          className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <img 
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm text-gray-900">Đỗ Thị P</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063007</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
                          </div>
                        </button>
                      </>
                    )}
                    {activeGroupChat === 2 && (
                      <>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Phạm Thị F</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063011</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Nguyễn Văn Q</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063012</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Trần Văn R</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063013</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Lê Thị S</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063014</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </div>
                      </>
                    )}
                    {activeGroupChat === 3 && (
                      <>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Hoàng Văn H</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063021</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Nguyễn Văn T</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063022</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Trần Thị U</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063023</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Phạm Văn V</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063024</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                          <img 
                            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
                            alt="Sinh viên"
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">Lê Thị W</div>
                            <div className="text-xs text-gray-500">MSSV: 2051063025</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
                          </div>
                        </div>
                    </>
                    )}
                  </div>
                )}
              </div>

              </>
              ) : showTeacherDetail ? (
                /* Teacher Detail View */
                <div className="space-y-5">
                  {/* Back Button */}
                  <button 
                    onClick={() => setShowTeacherDetail(false)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <i className="fas fa-arrow-left" />
                    <span>Quay lại</span>
                  </button>

                  {/* Teacher Avatar & Basic Info */}
                  <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                    <img
                      src={
                        selectedTeacher === 1 ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' :
                        selectedTeacher === 2 ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' :
                        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face'
                      }
                      alt="Giảng viên"
                      className="w-24 h-24 rounded-full object-cover ring-2 ring-blue-100 mb-3"
                    />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {selectedTeacher === 1 ? 'TS. Nguyễn Văn D' :
                       selectedTeacher === 2 ? 'ThS. Trần Văn K' :
                       'ThS. Lê Thị G'}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded mb-2">Giảng viên</span>
                    <p className="text-sm text-gray-600 mb-3">Khoa Công nghệ thông tin</p>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${selectedTeacher === 1 || selectedTeacher === 3 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-xs text-gray-500">
                        {selectedTeacher === 1 || selectedTeacher === 3 ? 'Đang hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="px-8">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                          <i className="fas fa-envelope text-blue-600 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500">Email</div>
                          <div className="text-sm text-gray-900 break-all">
                            {selectedTeacher === 1 ? 'nguyenvand@university.edu.vn' :
                             selectedTeacher === 2 ? 'tranvank@university.edu.vn' :
                             'lethig@university.edu.vn'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                          <i className="fas fa-phone text-blue-600 text-sm" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Điện thoại</div>
                          <div className="text-sm text-gray-900">
                            {selectedTeacher === 1 ? '0123 456 789' :
                             selectedTeacher === 2 ? '0123 456 790' :
                             '0123 456 791'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                          <i className="fas fa-map-marker-alt text-blue-600 text-sm" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Phòng làm việc</div>
                          <div className="text-sm text-gray-900">
                            {selectedTeacher === 1 ? 'Phòng A201' :
                             selectedTeacher === 2 ? 'Phòng B305' :
                             'Phòng C102'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                          <i className="fas fa-clock text-blue-600 text-sm" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Giờ làm việc</div>
                          <div className="text-sm text-gray-900">Thứ 2-6, 8:00 - 17:00</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button 
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                      onClick={() => {
                        setGroupInfoOpen(false)
                        setShowTeacherDetail(false)
                        // Logic to open chat with teacher
                      }}
                    >
                      <i className="fas fa-comment-dots text-sm" />
                      <span>Gửi tin nhắn</span>
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      onClick={() => {
                        // Logic to send email
                      }}
                    >
                      <i className="fas fa-envelope text-sm" />
                      <span>Gửi email</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Student Detail View */
                <div className="space-y-5">
                  {/* Back Button */}
                  <button 
                    onClick={() => setShowStudentDetail(false)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <i className="fas fa-arrow-left" />
                    <span>Quay lại</span>
                  </button>

                  {/* Student Avatar & Basic Info */}
                  <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                    <img
                      src={
                        selectedStudent === 1 ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face' :
                        selectedStudent === 2 ? 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face' :
                        selectedStudent === 3 ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face' :
                        selectedStudent === 4 ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' :
                        selectedStudent === 5 ? 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face' :
                        selectedStudent === 6 ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face' :
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'
                      }
                      alt="Sinh viên"
                      className="w-24 h-24 rounded-full object-cover ring-2 ring-blue-100 mb-3"
                    />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {selectedStudent === 1 ? 'Trần Văn E' :
                       selectedStudent === 2 ? 'Nguyễn Thị I' :
                       selectedStudent === 3 ? 'Lê Văn J' :
                       selectedStudent === 4 ? 'Phạm Văn M' :
                       selectedStudent === 5 ? 'Hoàng Thị N' :
                       selectedStudent === 6 ? 'Vũ Văn O' :
                       'Đỗ Thị P'}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded mb-2">Sinh viên</span>
                    <p className="text-sm text-gray-600 mb-3">
                      MSSV: {selectedStudent === 1 ? '2051063001' :
                             selectedStudent === 2 ? '2051063002' :
                             selectedStudent === 3 ? '2051063003' :
                             selectedStudent === 4 ? '2051063004' :
                             selectedStudent === 5 ? '2051063005' :
                             selectedStudent === 6 ? '2051063006' :
                             '2051063007'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${selectedStudent === 1 || selectedStudent === 2 || selectedStudent === 4 || selectedStudent === 6 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className="text-xs text-gray-500">
                        {selectedStudent === 1 || selectedStudent === 2 || selectedStudent === 4 || selectedStudent === 6 ? 'Đang hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="px-8">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                          <i className="fas fa-envelope text-blue-600 text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500">Email</div>
                          <div className="text-sm text-gray-900 break-all">
                            {selectedStudent === 1 ? 'tranvane@student.edu.vn' :
                             selectedStudent === 2 ? 'nguyenthi@student.edu.vn' :
                             selectedStudent === 3 ? 'levanj@student.edu.vn' :
                             selectedStudent === 4 ? 'phamvanm@student.edu.vn' :
                             selectedStudent === 5 ? 'hoangthin@student.edu.vn' :
                             selectedStudent === 6 ? 'vuvano@student.edu.vn' :
                             'dothip@student.edu.vn'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                          <i className="fas fa-phone text-blue-600 text-sm" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500">Điện thoại</div>
                          <div className="text-sm text-gray-900">
                            {selectedStudent === 1 ? '0123 456 001' :
                             selectedStudent === 2 ? '0123 456 002' :
                             selectedStudent === 3 ? '0123 456 003' :
                             selectedStudent === 4 ? '0123 456 004' :
                             selectedStudent === 5 ? '0123 456 005' :
                             selectedStudent === 6 ? '0123 456 006' :
                             '0123 456 007'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <button 
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                      onClick={() => {
                        setGroupInfoOpen(false)
                        setShowStudentDetail(false)
                        // Logic to open chat with student
                      }}
                    >
                      <i className="fas fa-comment-dots text-sm" />
                      <span>Gửi tin nhắn</span>
                    </button>
                    <button 
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      onClick={() => {
                        // Logic to send email
                      }}
                    >
                      <i className="fas fa-envelope text-sm" />
                      <span>Gửi email</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-3" style={{ maxWidth: '400px' }}>
          {toastNotifications.map((toast) => (
            <div
              key={toast.id}
              className={`
                bg-white rounded-lg shadow-lg border-l-4 p-4 flex items-start space-x-3
                animate-in slide-in-from-right duration-300
                ${toast.type === 'success' ? 'border-green-500' : ''}
                ${toast.type === 'info' ? 'border-blue-500' : ''}
                ${toast.type === 'warning' ? 'border-yellow-500' : ''}
                ${toast.type === 'error' ? 'border-red-500' : ''}
              `}
            >
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${toast.type === 'success' ? 'bg-green-100' : ''}
                ${toast.type === 'info' ? 'bg-blue-100' : ''}
                ${toast.type === 'warning' ? 'bg-yellow-100' : ''}
                ${toast.type === 'error' ? 'bg-red-100' : ''}
              `}>
                <i className={`
                  fas text-lg
                  ${toast.type === 'success' ? 'fa-check-circle text-green-600' : ''}
                  ${toast.type === 'info' ? 'fa-info-circle text-blue-600' : ''}
                  ${toast.type === 'warning' ? 'fa-exclamation-triangle text-yellow-600' : ''}
                  ${toast.type === 'error' ? 'fa-times-circle text-red-600' : ''}
                `} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{toast.title}</h4>
                <p className="text-xs text-gray-600">{toast.message}</p>
              </div>
              <button
                onClick={() => setToastNotifications(prev => prev.filter(t => t.id !== toast.id))}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>
          ))}
        </div>

        {/* Notification Panel Dialog */}
        <Dialog open={notificationPanelOpen} onOpenChange={setNotificationPanelOpen}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
            <DialogHeader className="pb-4 border-b border-gray-100 px-6 pt-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DialogTitle className="text-lg font-semibold text-gray-900">Thông báo</DialogTitle>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                  <button 
                    onClick={() => setNotificationPanelOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Đóng"
                  >
                    <i className="fas fa-times text-lg" />
                  </button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <i className="fas fa-bell-slash text-gray-400 text-2xl" />
                  </div>
                  <p className="text-sm text-gray-500">Không có thông báo nào</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 rounded-lg border transition-colors cursor-pointer
                        ${notification.read 
                          ? 'bg-white border-gray-200 hover:bg-gray-50' 
                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }
                      `}
                      onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`
                          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                          ${notification.type === 'success' ? 'bg-green-100' : ''}
                          ${notification.type === 'info' ? 'bg-blue-100' : ''}
                          ${notification.type === 'warning' ? 'bg-yellow-100' : ''}
                          ${notification.type === 'error' ? 'bg-red-100' : ''}
                        `}>
                          <i className={`
                            fas text-sm
                            ${notification.type === 'success' ? 'fa-check-circle text-green-600' : ''}
                            ${notification.type === 'info' ? 'fa-info-circle text-blue-600' : ''}
                            ${notification.type === 'warning' ? 'fa-exclamation-triangle text-yellow-600' : ''}
                            ${notification.type === 'error' ? 'fa-times-circle text-red-600' : ''}
                          `} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full ml-2" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {new Date(notification.timestamp).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <i className="fas fa-trash text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Advisor Info Dialog */}
        <Dialog open={advisorInfoOpen} onOpenChange={setAdvisorInfoOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-gray-900">Thông tin cố vấn học tập</DialogTitle>
                <button 
                  onClick={() => setAdvisorInfoOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng"
                >
                  <i className="fas fa-times text-lg" />
                </button>
              </div>
            </DialogHeader>
            
            <div className="space-y-5 py-4">
              {/* Advisor Avatar & Basic Info */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face"
                  alt="Cố vấn"
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-blue-100 mb-3"
                />
                <h3 className="text-base font-semibold text-gray-900 mb-1">TS. Nguyễn Thị Minh</h3>
                <p className="text-sm text-gray-600 mb-3">Cố vấn học tập</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">Tư vấn học tập</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">Hướng nghiệp</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="px-8">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                      <i className="fas fa-envelope text-blue-600 text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="text-sm text-gray-900 truncate">nguyenthiminh@university.edu.vn</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                      <i className="fas fa-phone text-blue-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Điện thoại</p>
                      <p className="text-sm text-gray-900">+84 123 456 789</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                      <i className="fas fa-map-marker-alt text-blue-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Phòng làm việc</p>
                      <p className="text-sm text-gray-900">Phòng A205, Nhà A</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-lg">
                      <i className="fas fa-clock text-blue-600 text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Giờ làm việc</p>
                      <p className="text-sm text-gray-900">Thứ 2 - Thứ 6: 8:00 - 17:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-start space-x-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                  <i className="fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Để đặt lịch hẹn, vui lòng gửi email hoặc nhắn tin trực tiếp qua hệ thống.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <button 
                  onClick={() => {
                    addNotification('success', 'Đặt lịch thành công', 'Lịch hẹn với cố vấn TS. Nguyễn Thị Minh vào 14:00 ngày 15/11/2025 đã được xác nhận.')
                    setAdvisorInfoOpen(false)
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  <i className="fas fa-calendar-plus text-sm" />
                  <span>Đặt lịch</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <i className="fas fa-envelope text-sm" />
                  <span>Gửi email</span>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="pb-4 border-b border-gray-100 px-6 pt-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-semibold text-gray-900">Cài đặt Chat</DialogTitle>
                <button 
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng"
                >
                  <i className="fas fa-times text-lg" />
                </button>
              </div>
            </DialogHeader>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Settings Sidebar */}
              <div className="w-56 border-r border-gray-100 bg-gray-50 p-4 overflow-y-auto">
                <nav className="space-y-1">
                  <button
                    onClick={() => setSettingsTab('general')}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      settingsTab === 'general'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-sliders-h text-base" />
                    <span>Chung</span>
                  </button>
                  <button
                    onClick={() => setSettingsTab('notifications')}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      settingsTab === 'notifications'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-bell text-base" />
                    <span>Thông báo</span>
                  </button>
                  <button
                    onClick={() => setSettingsTab('privacy')}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      settingsTab === 'privacy'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-shield-alt text-base" />
                    <span>Quyền riêng tư</span>
                  </button>
                  <button
                    onClick={() => setSettingsTab('appearance')}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      settingsTab === 'appearance'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <i className="fas fa-palette text-base" />
                    <span>Giao diện</span>
                  </button>
                </nav>
              </div>

              {/* Settings Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {settingsTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt chung</h3>
                      
                      {/* Auto-download */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Tự động tải xuống file</div>
                            <div className="text-xs text-gray-500 mt-1">Tự động tải xuống ảnh, video và tài liệu</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Enter to send */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Enter để gửi tin nhắn</div>
                            <div className="text-xs text-gray-500 mt-1">Sử dụng Shift+Enter để xuống dòng</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Message preview */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Xem trước tin nhắn</div>
                            <div className="text-xs text-gray-500 mt-1">Hiển thị nội dung tin nhắn trong thông báo</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Language */}
                        <div className="py-3 border-b border-gray-100">
                          <div className="font-medium text-gray-900 text-sm mb-2">Ngôn ngữ</div>
                          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Tiếng Việt</option>
                            <option>English</option>
                            <option>中文</option>
                          </select>
                        </div>

                        {/* Font size */}
                        <div className="py-3">
                          <div className="font-medium text-gray-900 text-sm mb-2">Kích thước chữ</div>
                          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Nhỏ</option>
                            <option selected>Trung bình</option>
                            <option>Lớn</option>
                            <option>Rất lớn</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông báo</h3>
                      
                      <div className="space-y-4">
                        {/* Desktop notifications */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Thông báo trên máy tính</div>
                            <div className="text-xs text-gray-500 mt-1">Nhận thông báo ngay cả khi không mở ứng dụng</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Sound */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Âm thanh thông báo</div>
                            <div className="text-xs text-gray-500 mt-1">Phát âm thanh khi có tin nhắn mới</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Message notifications */}
                        <div className="py-3 border-b border-gray-100">
                          <div className="font-medium text-gray-900 text-sm mb-3">Thông báo tin nhắn</div>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="radio" name="msgNotif" className="text-blue-600 focus:ring-blue-500" defaultChecked />
                              <span className="text-sm text-gray-700">Tất cả tin nhắn</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="radio" name="msgNotif" className="text-blue-600 focus:ring-blue-500" />
                              <span className="text-sm text-gray-700">Chỉ từ cố vấn và nhóm</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="radio" name="msgNotif" className="text-blue-600 focus:ring-blue-500" />
                              <span className="text-sm text-gray-700">Tắt thông báo</span>
                            </label>
                          </div>
                        </div>

                        {/* Do not disturb */}
                        <div className="py-3">
                          <div className="font-medium text-gray-900 text-sm mb-2">Không làm phiền</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Từ</label>
                              <input type="time" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="22:00" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">Đến</label>
                              <input type="time" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="07:00" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'privacy' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quyền riêng tư & Bảo mật</h3>
                      
                      <div className="space-y-4">
                        {/* Last seen */}
                        <div className="py-3 border-b border-gray-100">
                          <div className="font-medium text-gray-900 text-sm mb-3">Trạng thái hoạt động</div>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="radio" name="lastSeen" className="text-blue-600 focus:ring-blue-500" defaultChecked />
                              <span className="text-sm text-gray-700">Mọi người</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="radio" name="lastSeen" className="text-blue-600 focus:ring-blue-500" />
                              <span className="text-sm text-gray-700">Chỉ bạn bè</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="radio" name="lastSeen" className="text-blue-600 focus:ring-blue-500" />
                              <span className="text-sm text-gray-700">Không ai</span>
                            </label>
                          </div>
                        </div>

                        {/* Read receipts */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Xác nhận đã đọc</div>
                            <div className="text-xs text-gray-500 mt-1">Cho người khác biết bạn đã đọc tin nhắn</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Typing indicator */}
                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Hiển thị đang nhập</div>
                            <div className="text-xs text-gray-500 mt-1">Cho người khác biết khi bạn đang soạn tin nhắn</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Blocked users */}
                        <div className="py-3 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900 text-sm">Người dùng đã chặn</div>
                            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Quản lý</button>
                          </div>
                          <div className="text-xs text-gray-500">Không có người dùng nào bị chặn</div>
                        </div>

                        {/* Two-factor auth */}
                        <div className="py-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">Xác thực hai yếu tố</div>
                              <div className="text-xs text-gray-500 mt-1">Tăng cường bảo mật tài khoản</div>
                            </div>
                            <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                              Bật
                            </button>
                          </div>
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
                        {/* Theme */}
                        <div className="py-3 border-b border-gray-100">
                          <div className="font-medium text-gray-900 text-sm mb-3">Chủ đề</div>
                          <div className="grid grid-cols-3 gap-3">
                            <button className="p-3 border-2 border-blue-500 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                              <div className="w-full h-12 bg-white border border-gray-200 rounded mb-2"></div>
                              <div className="text-xs font-medium text-center">Sáng</div>
                            </button>
                            <button className="p-3 border-2 border-transparent rounded-lg bg-white hover:bg-gray-50 transition-colors">
                              <div className="w-full h-12 bg-gray-800 rounded mb-2"></div>
                              <div className="text-xs font-medium text-center">Tối</div>
                            </button>
                            <button className="p-3 border-2 border-transparent rounded-lg bg-white hover:bg-gray-50 transition-colors">
                              <div className="w-full h-12 bg-gradient-to-r from-white to-gray-800 rounded mb-2"></div>
                              <div className="text-xs font-medium text-center">Tự động</div>
                            </button>
                          </div>
                        </div>

                        {/* Accent color */}
                        <div className="py-3 border-b border-gray-100">
                          <div className="font-medium text-gray-900 text-sm mb-3">Màu chủ đạo</div>
                          <div className="flex space-x-3">
                            {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-red-500'].map((color) => (
                              <button key={color} className={`w-10 h-10 ${color} rounded-full border-2 ${color === 'bg-blue-500' ? 'border-gray-800' : 'border-transparent'} hover:scale-110 transition-transform`}></button>
                            ))}
                          </div>
                        </div>

                        {/* Bubble style */}
                        <div className="py-3 border-b border-gray-100">
                          <div className="font-medium text-gray-900 text-sm mb-3">Kiểu bong bóng chat</div>
                          <div className="space-y-3">
                            <button className="w-full p-3 border-2 border-blue-500 rounded-lg bg-white hover:bg-gray-50 transition-colors text-left">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <div className="text-xs font-medium mb-2">Bo tròn (Mặc định)</div>
                                  <div className="flex space-x-2">
                                    <div className="px-3 py-1.5 bg-gray-100 rounded-2xl text-xs">Xin chào</div>
                                    <div className="px-3 py-1.5 bg-blue-500 text-white rounded-2xl text-xs">Hi bạn!</div>
                                  </div>
                                </div>
                              </div>
                            </button>
                            <button className="w-full p-3 border-2 border-transparent rounded-lg bg-white hover:bg-gray-50 transition-colors text-left">
                              <div className="flex items-center space-x-3">
                                <div className="flex-1">
                                  <div className="text-xs font-medium mb-2">Vuông góc</div>
                                  <div className="flex space-x-2">
                                    <div className="px-3 py-1.5 bg-gray-100 rounded text-xs">Xin chào</div>
                                    <div className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs">Hi bạn!</div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Background */}
                        <div className="py-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-medium text-gray-900 text-sm">Hình nền chat</div>
                            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Thay đổi</button>
                          </div>
                          <div className="w-full h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-gray-200"></div>
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    setSettingsOpen(false)
                    addNotification('success', 'Đã lưu cài đặt', 'Các thay đổi của bạn đã được lưu thành công.')
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
