import { useState, useRef, useEffect, useCallback } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/parent/Parent_button';
import { Input } from '@/components/ui/parent/Parent_Input';
import { Card } from '@/components/ui/parent/Parent_card';
import {
  ArrowLeft,
  Settings,
  Search,
  Menu,
  Paperclip,
  Smile,
  Send,
} from 'lucide-react';
import { chatService } from '@/services/chatService';
import { socketService } from '@/services/socketService';
import type { Conversation, ChatMessage } from '@/services/chatService';

// Custom Avatar Component
const Avatar = ({ children, className = ''}: { children: React.ReactNode; className?: string }) =>(
  <div className={`relative overflow-hidden ${className}`}>{children}</div>);

const AvatarImage = ({ src, alt }: { src: string; alt: string }) =>(
  <img 
    src={src} 
    alt={alt} 
    className="w-full h-full rounded-full object-cover absolute inset-0 z-10"onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />);

const AvatarFallback = ({ children, className = ''}: { children: React.ReactNode; className?: string }) =>(
  <div className={`w-full h-full rounded-full flex items-center justify-center absolute inset-0 z-0 ${className}`}>
    {children}
  </div>);

// Custom Badge Component
const Badge = ({ 
  children, 
  className = ''}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default'| 'secondary';
}) =>(
  <span className={`inline-flex items-center justify-center rounded-full ${className}`}>
    {children}
  </span>);

interface Teacher {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  status: 'online'| 'away'| 'offline';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isActive?: boolean;
  students?: Array<{
    studentId: string;
    studentName: string;
    studentCode: string;
    className: string;
  }>;
}

type Props = {};

export default function ChatWithTeachers({}: Props) {
  const { t } = useTranslation(['parent', 'common']);
  
  // Real data states
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load teachers and conversations on mount
  useEffect(() => {
    loadTeachers();
    loadConversations();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await chatService.getParentTeachers();
      
      // Transform data to Teacher interface
      const transformedTeachers: Teacher[] = data.map((teacher: any) =>({
        id: teacher.id,
        name: teacher.name,
        title: teacher.students && teacher.students.length >0 
          ? `${t('parent:chat.teacherRoles.classTeacher')} - ${teacher.students[0].className}`
          : t('parent:chat.teacherRoles.teacher'),
        avatar: teacher.avatar,
        status: 'online'as const,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0,
        isActive: false,
        students: teacher.students,
      }));
      
      setTeachers(transformedTeachers);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getParentConversations();
      setConversations(data);
      
      // Update teachers with conversation info
      setTeachers(prev =>prev.map(teacher => {
        const conv = data.find((c: Conversation) =>c.participants.some(p =>p.userId === teacher.id && p.userType === 'teacher')
        );
        if (conv) {
          return {
            ...teacher,
            lastMessage: conv.lastMessage?.content || '',
            lastMessageTime: conv.lastMessage?.timestamp 
              ? new Date(conv.lastMessage.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'})
              : '',
            unreadCount: conv.unreadCount || 0,
          };
        }
        return teacher;
      }));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const data = await chatService.getParentConversationMessages(conversationId);
      setMessages(data.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Socket.IO setup
  const handleNewMessage = useCallback((message: ChatMessage) => {
    if (currentConversationId && message.conversationId === currentConversationId) {
      setMessages(prev => {
        // Check duplicate
        if (prev.some(m =>m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    }
  }, [currentConversationId]);

  const handleConversationUpdated = useCallback((data: any) => {
    setConversations(prev =>prev.map(conv => {
      if (conv._id === data.conversationId) {
        const isCurrentlyViewing = currentConversationId === data.conversationId;
        return {
          ...conv,
          lastMessage: data.lastMessage,
          unreadCount: isCurrentlyViewing ? 0 : (conv.unreadCount || 0) + 1
        };
      }
      return conv;
    }));
    
    // Update teachers list
    setTeachers(prev =>prev.map(teacher => {
      const conv = conversations.find(c =>c._id === data.conversationId && 
        c.participants.some(p =>p.userId === teacher.id)
      );
      if (conv) {
        return {
          ...teacher,
          lastMessage: data.lastMessage.content,
          lastMessageTime: new Date(data.lastMessage.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'}),
          unreadCount: currentConversationId === data.conversationId ? 0 : (teacher.unreadCount || 0) + 1
        };
      }
      return teacher;
    }));
  }, [currentConversationId, conversations]);

  useEffect(() => {
    if (conversations.length === 0) return;

    // Get parent userId from first conversation
    const firstConv = conversations[0];
    const parentParticipant = firstConv?.participants.find(p =>p.userType === 'parent');
    
    if (!parentParticipant) {
      console.warn('No parent participant found in conversations');
      return;
    }

    const setupSocket = async () => {
      if (!socketService.isConnected()) {
        try {
          await socketService.connect(parentParticipant.userId, 'parent');
          console.log('Parent socket ready');
        } catch (error) {
          console.error('Failed to connect parent socket:', error);
          return;
        }
      }

      socketService.onNewMessage(handleNewMessage);
      socketService.onConversationUpdated(handleConversationUpdated);
    };

    setupSocket();

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('conversationUpdated', handleConversationUpdated);
    };
  }, [conversations.length, handleNewMessage, handleConversationUpdated]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () =>socketService.disconnect();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, showTyping]);

  const handleSelectTeacher = async (teacher: Teacher) => {
    // Leave previous conversation room
    if (currentConversationId) {
      socketService.leaveConversation(currentConversationId);
    }

    setSelectedTeacher(teacher);
    setLoading(true);
    
    try {
      // Create or get conversation
      const conversation = await chatService.createParentConversation(teacher.id);
      
      // Save conversation ID
      setCurrentConversationId(conversation._id);
      
      // Join conversation room
      socketService.joinConversation(conversation._id);
      
      // Load messages
      await loadMessages(conversation._id);
      
      // Mark as read
      await chatService.markParentAsRead(conversation._id);
      
      // Refresh conversations
      await loadConversations();
      
      // Update teacher as active
      setTeachers(prev =>prev.map(t =>({
        ...t,
        isActive: t.id === teacher.id,
        unreadCount: t.id === teacher.id ? 0 : t.unreadCount
      })));
    } catch (error) {
      console.error('Error selecting teacher:', error);
      alert('Có lỗi khi tải cuộc trò chuyện. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !currentConversationId) return;

    // Get parent userId from conversations
    const currentConv = conversations.find(c =>c._id === currentConversationId);
    if (!currentConv) {
      alert('Không tìm thấy cuộc trò chuyện');
      return;
    }

    const parentParticipant = currentConv.participants.find(p =>p.userType === 'parent');
    if (!parentParticipant) {
      alert('Không tìm thấy thông tin phụ huynh trong cuộc trò chuyện');
      return;
    }

    const messageText = text;
    setMessageInput(''); // Clear immediately
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Send via Socket.IO for real-time
      await socketService.sendMessage(
        currentConversationId,
        parentParticipant.userId,
        'parent',
        messageText
      );
      
      // Update local conversation lastMessage
      setConversations(prev =>prev.map(conv =>conv._id === currentConversationId
          ? { 
              ...conv, 
              lastMessage: {
                content: messageText,
                senderId: parentParticipant.userId,
                senderName: parentParticipant.userName,
                timestamp: new Date()
              }
            }
          : conv
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Có lỗi khi gửi tin nhắn. Vui lòng thử lại!');
      setMessageInput(messageText); // Restore on error
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter'&& !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Helper function to get initials from name (skip titles like Dr., Mr., Ms., Mrs.)
  const getInitials = (name: string) => {
    const words = name.split('');
    // If first word is a title, skip it
    const titles = ['Dr.', 'Mr.', 'Ms.', 'Mrs.', 'Dr', 'Mr', 'Ms', 'Mrs'];
    const filteredWords = words.filter(word =>!titles.includes(word));
    
    if (filteredWords.length === 0) return words[0].substring(0, 2).toUpperCase();
    
    // Get first letter of first name and last name
    if (filteredWords.length === 1) {
      return filteredWords[0].substring(0, 2).toUpperCase();
    }
    
    return (filteredWords[0][0] + filteredWords[filteredWords.length - 1][0]).toUpperCase();
  };

  // Check if sender is parent (current user)
  const isMessageFromParent = (message: ChatMessage): boolean => {
    return message.senderType === 'parent';
  };

  // Show loading state
  if (loadingTeachers) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common:loading')}</p>
        </div>
      </div>);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"size="icon"className="p-2 hover:bg-gray-100 rounded-lg"onClick={() =>window.history.back()}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600"/>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <svg className="w-6 h-6 text-white"fill="currentColor"viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">{t('parent:chat.title')}</h1>
                <p className="text-sm text-gray-500">{t('parent:chat.subtitle')}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost"size="icon"className="p-2 text-gray-400 hover:text-gray-600">
              <Settings className="w-5 h-5"/>
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">ST
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Teachers List Sidebar */}
        <div
          className={`w-80 bg-white border-r border-gray-200 flex-col ${
            showSidebar ? 'flex': 'hidden'} lg:flex`}
        >
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <Input
                type="text"placeholder={t('parent:chat.searchTeachers')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
          </div>

          {/* Teachers List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="p-2">
              {teachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('parent:chat.noTeachers')}</p>
                </div>) : (
                teachers.map((teacher) =>(
                  <div
                    key={teacher.id}
                    onClick={() =>handleSelectTeacher(teacher)}
                    className="cursor-pointer">
                    <Card
                      className={`p-3 mb-2 transition-colors border ${
                        teacher.isActive
                          ? 'bg-blue-50 border-blue-200': 'hover:bg-gray-50 border-transparent'}`}
                    >
                      <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={teacher.avatar || ''} alt={teacher.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                            {getInitials(teacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(
                            teacher.status
                          )} border-2 border-white rounded-full`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate whitespace-nowrap">{teacher.name}</h3>
                          {teacher.lastMessageTime && (
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{teacher.lastMessageTime}</span>)}
                        </div>
                        <p className="text-sm text-gray-600 truncate whitespace-nowrap">{teacher.title}</p>
                        {teacher.lastMessage && (
                          <p
                            className={`text-sm truncate ${
                              teacher.isActive ? 'text-blue-600 font-medium': 'text-gray-500'}`}
                          >
                            {teacher.lastMessage}
                          </p>)}
                      </div>
                      {teacher.unreadCount && teacher.unreadCount >0 && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-2 py-1 text-xs">
                          {teacher.unreadCount}
                        </Badge>)}
                      {teacher.isActive && !teacher.unreadCount && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"/>)}
                    </div>
                    </Card>
                  </div>))
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedTeacher ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"size="icon"className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"onClick={() =>setShowSidebar(!showSidebar)}
                  >
                    <Menu className="w-5 h-5 text-gray-600"/>
                  </Button>
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedTeacher.avatar || ''} alt={selectedTeacher.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {getInitials(selectedTeacher.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(
                        selectedTeacher.status
                      )} border-2 border-white rounded-full`}
                    />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 whitespace-nowrap">{selectedTeacher.name}</h2>
                    <p className="text-sm text-gray-500 whitespace-nowrap">
                      {selectedTeacher.title} •{''}
                      <span className="text-green-600 capitalize">{t(`parent:chat.${selectedTeacher.status}`)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-4 space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg className="w-16 h-16 mb-4"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                      <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <p>{t('parent:chat.noMessages')}</p>
                    <p className="text-sm mt-2">{t('parent:chat.startConversation')}</p>
                  </div>) : (
                  <>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center">
                      <Badge variant="secondary"className="bg-gray-100 text-gray-600 text-xs px-3 py-1">
                        {t('parent:chat.today')}
                      </Badge>
                    </div>

                    {/* Messages */}
                    {messages.map((message) => {
                      const isSent = isMessageFromParent(message);
                      return (
                        <div
                          key={message._id}
                          className={`flex items-start space-x-3 animate-in slide-in-from-bottom-5 duration-300 ${
                            isSent ? 'justify-end': ''}`}
                        >
                          {!isSent && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={selectedTeacher.avatar || ''} alt={selectedTeacher.name} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-xs">
                                {getInitials(selectedTeacher.name)}
                              </AvatarFallback>
                            </Avatar>)}

                          <div className={`flex-1 flex flex-col ${isSent ? 'items-end': ''}`}>
                            <div
                              className={`rounded-lg p-3 max-w-md break-words ${
                                isSent ? 'bg-blue-600 text-white': 'bg-gray-100 text-gray-900'}`}
                            >
                              <p className="break-words">{message.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit'})}
                            </p>
                          </div>

                          {isSent && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">PH
                              </AvatarFallback>
                            </Avatar>)}
                        </div>);
                    })}

                    {/* Typing Indicator */}
                    {showTyping && (
                      <div className="flex items-start space-x-3 animate-in slide-in-from-bottom-5 duration-300">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={selectedTeacher.avatar || ''} alt={selectedTeacher.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-xs">
                            {getInitials(selectedTeacher.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"/>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"style={{ animationDelay: '0.2s'}}
                            />
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"style={{ animationDelay: '0.4s'}}
                            />
                          </div>
                        </div>
                      </div>)}
                  </>)}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end space-x-3">
                  <Button
                    variant="ghost"size="icon"className="p-2 text-gray-400 hover:text-gray-600">
                    <Paperclip className="w-5 h-5"/>
                  </Button>
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      placeholder={t('parent:chat.typeMessage')}
                      value={messageInput}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      disabled={!currentConversationId}
                      className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"/>
                    <Button
                      variant="ghost"size="icon"className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                      <Smile className="w-5 h-5"/>
                    </Button>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"onClick={handleSendMessage}
                    disabled={!currentConversationId || !messageInput.trim()}
                  >
                    <Send className="w-5 h-5"/>
                  </Button>
                </div>
              </div>
            </>) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto mb-4"fill="none"stroke="currentColor"viewBox="0 0 24 24">
                  <path strokeLinecap="round"strokeLinejoin="round"strokeWidth="2"d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <p className="text-lg font-medium">{t('parent:chat.selectTeacher')}</p>
                <p className="text-sm mt-2">{t('parent:chat.selectTeacherDescription')}</p>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}
