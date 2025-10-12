import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ChangeEvent } from 'react';
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

// Custom Avatar Component
const Avatar = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative overflow-hidden ${className}`}>{children}</div>
);

const AvatarImage = ({ src, alt }: { src: string; alt: string }) => (
  <img 
    src={src} 
    alt={alt} 
    className="w-full h-full rounded-full object-cover absolute inset-0 z-10" 
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
);

const AvatarFallback = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`w-full h-full rounded-full flex items-center justify-center absolute inset-0 z-0 ${className}`}>
    {children}
  </div>
);

// Custom Badge Component
const Badge = ({ 
  children, 
  className = ''
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'secondary';
}) => (
  <span className={`inline-flex items-center justify-center rounded-full ${className}`}>
    {children}
  </span>
);

interface Teacher {
  id: string;
  name: string;
  title: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isActive?: boolean;
}

interface Message {
  id: string;
  text: string;
  isSent: boolean;
  timestamp: string;
}

type Props = {};

export default function ChatWithTeachers({}: Props) {
  const [teachers] = useState<Teacher[]>([
    {
      id: '1',
      name: 'Dr. Brown',
      title: 'Mathematics Teacher',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face',
      status: 'online',
      lastMessage: 'Regarding John\'s progress...',
      lastMessageTime: '2 min',
      isActive: true,
    },
    {
      id: '2',
      name: 'Ms. Johnson',
      title: 'Science Teacher',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=48&h=48&fit=crop&crop=face',
      status: 'online',
      lastMessage: 'Great improvement in class!',
      lastMessageTime: '1h',
      unreadCount: 2,
    },
    {
      id: '3',
      name: 'Mr. Wilson',
      title: 'Class Teacher',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face',
      status: 'away',
      lastMessage: 'Meeting scheduled for next week',
      lastMessageTime: '3h',
    },
    {
      id: '4',
      name: 'Mrs. Davis',
      title: 'English Teacher',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&crop=face',
      status: 'offline',
      lastMessage: 'Reading assignment feedback',
      lastMessageTime: '1d',
    },
    {
      id: '5',
      name: 'Mr. Garcia',
      title: 'Physical Education',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&crop=face',
      status: 'online',
      lastMessage: 'Sports day preparation',
      lastMessageTime: '2d',
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello Sarah! I wanted to discuss John\'s recent progress in mathematics. He\'s been doing exceptionally well with algebra concepts.',
      isSent: false,
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      text: 'That\'s wonderful to hear! I\'ve noticed he\'s been more confident with his homework lately. Are there any specific areas where he could improve?',
      isSent: true,
      timestamp: '10:32 AM',
    },
    {
      id: '3',
      text: 'I\'ve prepared a detailed progress report for you. Please take a look when you have time.',
      isSent: false,
      timestamp: '10:35 AM',
    },
    {
      id: '4',
      text: 'Thank you so much! I\'ll review it tonight and get back to you if I have any questions.',
      isSent: true,
      timestamp: '10:37 AM',
    },
  ]);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher>(teachers[0]);
  const [messageInput, setMessageInput] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, showTyping]);

  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isSent: true,
      timestamp: currentTime,
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Show typing indicator
    setShowTyping(true);

    // Simulate teacher response
    setTimeout(() => {
      setShowTyping(false);
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your message. I\'ll get back to you shortly with more details.',
        isSent: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, responseMessage]);
    }, 2000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    const words = name.split(' ');
    // If first word is a title, skip it
    const titles = ['Dr.', 'Mr.', 'Ms.', 'Mrs.', 'Dr', 'Mr', 'Ms', 'Mrs'];
    const filteredWords = words.filter(word => !titles.includes(word));
    
    if (filteredWords.length === 0) return words[0].substring(0, 2).toUpperCase();
    
    // Get first letter of first name and last name
    if (filteredWords.length === 1) {
      return filteredWords[0].substring(0, 2).toUpperCase();
    }
    
    return (filteredWords[0][0] + filteredWords[filteredWords.length - 1][0]).toUpperCase();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="p-2 hover:bg-gray-100 rounded-lg"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900">Chat with Teachers</h1>
                <p className="text-sm text-gray-500">Stay connected with your child's educators</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="p-2 text-gray-400 hover:text-gray-600">
              <Settings className="w-5 h-5" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                ST
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
            showSidebar ? 'flex' : 'hidden'
          } lg:flex`}
        >
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search teachers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Teachers List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="p-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="cursor-pointer"
                >
                  <Card
                    className={`p-3 mb-2 transition-colors border ${
                      teacher.isActive
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={teacher.avatar} alt={teacher.name} />
                        <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
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
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{teacher.lastMessageTime}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate whitespace-nowrap">{teacher.title}</p>
                      <p
                        className={`text-sm truncate ${
                          teacher.isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                        }`}
                      >
                        {teacher.lastMessage}
                      </p>
                    </div>
                    {teacher.unreadCount && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        {teacher.unreadCount}
                      </Badge>
                    )}
                    {teacher.isActive && !teacher.unreadCount && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedTeacher.avatar} alt={selectedTeacher.name} />
                  <AvatarFallback>{getInitials(selectedTeacher.name)}</AvatarFallback>
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
                  {selectedTeacher.title} •{' '}
                  <span className="text-green-600 capitalize">{selectedTeacher.status}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-4 space-y-4"
          >
            {/* Date Separator */}
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs px-3 py-1">
                Today
              </Badge>
            </div>

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 animate-in slide-in-from-bottom-5 duration-300 ${
                  message.isSent ? 'justify-end' : ''
                }`}
              >
                {!message.isSent && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={selectedTeacher.avatar} alt={selectedTeacher.name} />
                    <AvatarFallback>{getInitials(selectedTeacher.name)}</AvatarFallback>
                  </Avatar>
                )}

                <div className={`flex-1 flex flex-col ${message.isSent ? 'items-end' : ''}`}>
                  <div
                    className={`rounded-lg p-3 max-w-md break-words ${
                      message.isSent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="break-words">{message.text}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
                </div>

                {message.isSent && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                      ST
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {showTyping && (
              <div className="flex items-start space-x-3 animate-in slide-in-from-bottom-5 duration-300">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={selectedTeacher.avatar} alt={selectedTeacher.name} />
                  <AvatarFallback>{getInitials(selectedTeacher.name)}</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-end space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32 outline-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg"
                onClick={handleSendMessage}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
