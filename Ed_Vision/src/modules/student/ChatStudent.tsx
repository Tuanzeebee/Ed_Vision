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

  // FAQ state
  const [faqExpanded, setFaqExpanded] = useState(false)
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null)

  // Advisor info dialog state
  const [advisorInfoOpen, setAdvisorInfoOpen] = useState(false)

  // Chat input and messages
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<Array<{ id: string; from: 'advisor' | 'student'; text: string }>>([
    { id: 'm1', from: 'advisor', text: 'Chào em, em muốn hỏi gì hôm nay?' },
    { id: 'm2', from: 'student', text: 'Em muốn hỏi về kế hoạch học tập.' }
  ])
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
    setMessages(prev => [...prev, { id, from: 'student', text: chatInput }])
    setChatInput('')
  }

  return (
    <Card className="h-screen w-screen overflow-hidden">
      <CardContent className="p-0 h-full">
        {/* Custom modern scrollbars for component (overrides .scrollbar-hide to show unified thumb) */}
        <style>{`
          .scrollbar-hide { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.18) transparent; }
          .scrollbar-hide::-webkit-scrollbar { width: 10px; height: 10px; }
          .scrollbar-hide::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-hide::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.18); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          .scrollbar-hide::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.28); }

          /* utility class if you prefer explicit naming */
          .scrollbar-custom { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.18) transparent; }
          .scrollbar-custom::-webkit-scrollbar { width: 10px; height: 10px; }
          .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
          .scrollbar-custom::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.18); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          .scrollbar-custom::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.28); }

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
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-graduation-cap text-white" />
                </div>
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
                      <button className={navCollapsed ? `${baseCollapsed} text-blue-600 bg-blue-50 rounded-lg` : `${baseExpanded} text-blue-600 bg-blue-50 rounded-lg`}>
                        <i className="fas fa-user-tie text-lg flex-shrink-0" />
                        {!navCollapsed && <span className="sidebar-label font-medium text-sm">Cố vấn</span>}
                      </button>

                      <button className={navCollapsed ? `${baseCollapsed} text-gray-600 rounded-lg` : `${baseExpanded} text-gray-600 hover:bg-gray-50 rounded-lg`}>
                        <i className="fas fa-users text-lg flex-shrink-0" />
                        {!navCollapsed && <span className="sidebar-label font-medium text-sm">Sinh viên</span>}
                      </button>

                      <button className={navCollapsed ? `${baseCollapsed} text-gray-600 rounded-lg` : `${baseExpanded} text-gray-600 hover:bg-gray-50 rounded-lg`}>
                        <i className="fas fa-user-friends text-lg flex-shrink-0" />
                        {!navCollapsed && <span className="sidebar-label font-medium text-sm">Nhóm học tập</span>}
                      </button>

                      <button className={navCollapsed ? `${baseCollapsed} text-gray-600 rounded-lg relative` : `${baseExpanded} text-gray-600 hover:bg-gray-50 rounded-lg`}>
                        <i className="fas fa-bell text-lg flex-shrink-0" />
                        {!navCollapsed && <span className="sidebar-label font-medium text-sm">Thông báo</span>}
                        <span className={navCollapsed ? 'absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full' : 'sidebar-label ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full'}>3</span>
                      </button>
                    </>
                  )
                })()}
              </div>

              <div className="mt-auto pt-6 space-y-1">
                <button className={navCollapsed ? 'w-full flex items-center justify-center py-3 text-gray-500 rounded-lg' : 'w-full flex items-center space-x-3 px-3 py-3 text-gray-500 hover:bg-gray-50 rounded-lg'}>
                  <i className="fas fa-cog text-lg flex-shrink-0" />
                  {!navCollapsed && <span className="sidebar-label font-medium text-sm">Cài đặt</span>}
                </button>
                <button className={navCollapsed ? 'w-full flex items-center justify-center py-3 text-gray-500 rounded-lg' : 'w-full flex items-center space-x-3 px-3 py-3 text-gray-500 hover:bg-gray-50 rounded-lg'}>
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
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Cố vấn học tập</h2>
              <div className="relative mb-4">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Tìm kiếm cố vấn..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg">
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
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {!faqExpanded && (
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

              {/* FAQ expanded */}
              {faqExpanded && (
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
                  <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face" alt="Cố vấn" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <div className="font-medium">Cố vấn học tập</div>
                    <div className="text-xs text-gray-500">Sẵn sàng trợ giúp</div>
                  </div>
                </div>
                <button title="Thông tin cố vấn" aria-label="Thông tin cố vấn" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => setAdvisorInfoOpen(true)}>
                  <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
                    <i className="fas fa-info text-sm" />
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
              <div className="flex justify-center">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Hôm nay</span>
              </div>

              {messages.map((m) => (
                <div key={m.id} className={m.from === 'advisor' ? 'flex items-start space-x-3' : 'flex items-end justify-end space-x-3'}>
                  {m.from === 'advisor' && (
                    <>
                      <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face" alt="Cố vấn" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                          <div className="text-sm text-gray-800">{m.text}</div>
                        </div>
                      </div>
                    </>
                  )}

                  {m.from === 'student' && (
                    <>
                      <div className="flex-1 flex flex-col items-end">
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
                <button className="flex-1 flex items-center justify-center space-x-2 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
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
      </CardContent>
    </Card>
  )
}
