import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/student/Student_button"
import {
  ArrowLeft,
  Users,
  Settings,
  Maximize,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  Smile,
  PhoneOff,
  Send,
  FileText,
  Code,
  Upload,
  Download
} from "lucide-react"

interface VideoRoomProps {
  roomData?: {
    id: string
    title: string
    subtitle: string
    description: string
    students: string
  }
  onLeaveRoom?: () => void
}

interface ChatMessage {
  id: string
  user: string
  avatar: string
  time: string
  message: string
}

interface FileItem {
  id: string
  name: string
  type: 'pdf' | 'code' | 'image'
  size: string
  uploadedBy: string
  icon: any
  color: string
}

interface Participant {
  name: string
  avatar: string
  isCurrentUser: boolean
  isMuted: boolean
  isSpeaking?: boolean
}

const TabButton = ({
  isActive,
  onClick,
  children,
  icon
}: {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
  icon: string
}) => (
  <button
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${isActive
        ? 'text-white border-b-2 border-indigo-400 bg-white/5'
        : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
  >
    <span className="mr-2">{icon}</span>
    {children}
  </button>
)

const IconToggleButton = ({
  isOn,
  onToggle,
  onIcon: OnIcon,
  offIcon: OffIcon,
  ariaLabel,
  variant = 'default'
}: {
  isOn: boolean
  onToggle: () => void
  onIcon: any
  offIcon: any
  ariaLabel: string
  variant?: 'default' | 'danger'
}) => {
  const baseClasses = "w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
  const variantClasses = variant === 'danger'
    ? "bg-red-500 hover:bg-red-600 text-white"
    : isOn
      ? "bg-indigo-500 hover:bg-indigo-600 text-white"
      : "bg-red-500 hover:bg-red-600 text-white"

  return (
    <button
      aria-pressed={isOn}
      aria-label={ariaLabel}
      onClick={onToggle}
      className={`${baseClasses} ${variantClasses}`}
    >
      {isOn ? <OnIcon className="w-4 h-4" /> : <OffIcon className="w-4 h-4" />}
    </button>
  )
}

export default function VideoRoom({ roomData, onLeaveRoom }: VideoRoomProps) {
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [currentTab, setCurrentTab] = useState('chat')
  const [showReactions, setShowReactions] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [notes, setNotes] = useState('')

  const [chatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      user: 'Prof. Lee',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      time: '2:15 PM',
      message: 'Welcome everyone! Today we will be covering basic programming concepts.'
    },
    {
      id: '2',
      user: 'Sarah M.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      time: '2:16 PM',
      message: 'Thanks Professor! Excited to learn about loops and functions today.'
    }
  ])

  const files: FileItem[] = useMemo(() => [
    {
      id: '1',
      name: 'Week 3 - Loops & Functions.pdf',
      type: 'pdf',
      size: '2.3 MB',
      uploadedBy: 'Prof. Lee',
      icon: FileText,
      color: 'text-red-400'
    },
    {
      id: '2',
      name: 'example_code.py',
      type: 'code',
      size: '1.2 KB',
      uploadedBy: 'Prof. Lee',
      icon: Code,
      color: 'text-green-400'
    }
  ], [])

  const participants: Participant[] = useMemo(() => [
    {
      name: 'You',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isCurrentUser: true,
      isMuted: false
    },
    {
      name: 'Sarah M.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      isCurrentUser: false,
      isMuted: false,
      isSpeaking: true
    },
    {
      name: 'Mike R.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isCurrentUser: false,
      isMuted: true
    }
  ], [])

  const chatMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSendMessage = useCallback(() => {
    if (chatInput.trim()) {
      console.log('Sending message:', chatInput.trim())
      setChatInput('')
    }
  }, [chatInput])

  const handleLeaveRoom = useCallback(() => {
    if (window.confirm('Are you sure you want to leave the room?')) {
      onLeaveRoom?.()
    }
  }, [onLeaveRoom])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handleSelectReaction = useCallback((emoji: string) => {
    console.log('Sending reaction:', emoji)
    setShowReactions(false)
  }, [])

  return (
    <div className="bg-slate-900 min-h-screen overflow-hidden">
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              onClick={handleLeaveRoom}
              className="w-11 h-11 bg-red-500 hover:bg-red-600 rounded-xl transition-colors focus:ring-2 focus:ring-red-400/60"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div className="relative">
              <h1 className="text-white font-semibold text-lg">
                {roomData?.title || 'Computer Science 101'}
              </h1>
              <p className="text-slate-300 text-sm">
                {roomData?.subtitle || 'Programming Basics  Prof. Lee'}
              </p>
              <div className="absolute -left-2 top-1 w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
            <Users className="w-4 h-4 text-slate-300" />
            <span className="text-white text-sm font-medium">
              {roomData?.students || '18 participants'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-400/60"
            >
              <Settings className="w-5 h-5 text-slate-300" />
            </Button>
            <Button
              size="icon"
              onClick={toggleFullscreen}
              className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-400/60"
            >
              <Maximize className="w-5 h-5 text-slate-300" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-72px)]">
        <div className="flex-1 p-6">
          <div className="mb-4">
            <div className="bg-white/5 rounded-2xl overflow-hidden aspect-video relative border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop"
                alt="Professor Lee presenting"
                className="w-full h-full object-cover"
                loading="lazy"
                width={800}
                height={450}
              />

              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-white text-sm font-medium">Prof. Lee</span>
                </div>
              </div>

              <div className="absolute top-3 right-3 bg-indigo-500/80 backdrop-blur-sm px-2 py-1 rounded text-xs border border-indigo-400/30">
                <div className="flex items-center gap-1">
                  <Monitor className="w-3 h-3 text-white" />
                  <span className="text-white">Screen Share</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 h-20">
            {participants.map((participant, index) => (
              <div
                key={index}
                className={`bg-white/5 rounded overflow-hidden relative transition-all duration-200 hover:ring-1 hover:ring-white/20 border border-white/10 ${participant.isSpeaking ? 'ring-1 ring-emerald-400' : ''
                  }`}
              >
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={120}
                  height={120}
                />

                <div className="absolute bottom-0.5 left-0.5 bg-black/60 px-1 py-0.5 rounded text-xs text-white max-w-[calc(100%-4px)] truncate">
                  {participant.name}
                </div>

                <div className="absolute top-0.5 right-0.5">
                  {participant.isCurrentUser ? (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  ) : participant.isMuted ? (
                    <div className="bg-red-500/80 p-0.5 rounded">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : (
                    <div className="bg-green-500/80 p-0.5 rounded">
                      <Mic className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-white/5 rounded flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors border border-white/10">
              <div className="text-center">
                <span className="text-lg text-slate-300 block">+</span>
                <span className="text-xs text-slate-400">13</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-96 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col">
          <div className="flex border-b border-white/10" role="tablist">
            {[
              { id: 'chat', label: 'Chat', icon: '' },
              { id: 'notes', label: 'Notes', icon: '' },
              { id: 'files', label: 'Files', icon: '' }
            ].map((tab) => (
              <TabButton
                key={tab.id}
                isActive={currentTab === tab.id}
                onClick={() => setCurrentTab(tab.id)}
                icon={tab.icon}
              >
                {tab.label}
              </TabButton>
            ))}
          </div>

          {currentTab === 'chat' && (
            <div className="flex-1 flex flex-col">
              <div
                ref={chatMessagesRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {chatMessages.map((message) => (
                  <div key={message.id} className="hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className="flex items-start gap-3">
                      <img
                        src={message.avatar}
                        alt={message.user}
                        className="w-8 h-8 rounded-full border border-white/20"
                        width={32}
                        height={32}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-sm font-medium">{message.user}</span>
                          <span className="text-slate-400 text-xs">{message.time}</span>
                        </div>
                        <p className="text-slate-200 text-sm">{message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-white/10 text-white placeholder-slate-400 px-3 py-2 rounded-lg border border-white/20 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-colors"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-400/60"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'notes' && (
            <div className="flex-1 flex flex-col p-4">
              <div className="mb-4">
                <h3 className="text-white font-semibold text-lg mb-3">Session Notes</h3>
                <textarea
                  placeholder="Take your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-80 bg-white/10 text-white placeholder-slate-400 p-3 rounded-lg border border-white/20 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 resize-none transition-colors"
                />
                <div className="mt-2 text-xs text-slate-400">
                  Saved just now
                </div>
              </div>
              <div className="space-y-2">
                <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-colors">
                  Save Notes
                </Button>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-medium border border-white/20 transition-colors">
                  Export as PDF
                </Button>
              </div>
            </div>
          )}

          {currentTab === 'files' && (
            <div className="flex-1 flex flex-col p-4">
              <div className="mb-4">
                <h3 className="text-white font-semibold text-lg mb-4">Shared Files</h3>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border border-white/20 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${file.type === 'pdf' ? 'bg-red-500/20 text-red-400' :
                            file.type === 'code' ? 'bg-green-500/20 text-green-400' :
                              'bg-purple-500/20 text-purple-400'
                          }`}>
                          <file.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{file.name}</p>
                          <p className="text-slate-400 text-xs">
                            {file.uploadedBy}  {file.size}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          className="w-8 h-8 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4 text-indigo-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg border-2 border-dashed border-white/30 hover:border-white/50 transition-colors font-medium">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <Card className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl">
          <CardContent className="px-6 py-4">
            <div className="flex items-center gap-3">
              <IconToggleButton
                isOn={isMicOn}
                onToggle={() => setIsMicOn(!isMicOn)}
                onIcon={Mic}
                offIcon={MicOff}
                ariaLabel={isMicOn ? "Mute microphone" : "Unmute microphone"}
              />

              <IconToggleButton
                isOn={isCameraOn}
                onToggle={() => setIsCameraOn(!isCameraOn)}
                onIcon={Video}
                offIcon={VideoOff}
                ariaLabel={isCameraOn ? "Turn off camera" : "Turn on camera"}
              />

              <IconToggleButton
                isOn={isScreenSharing}
                onToggle={() => setIsScreenSharing(!isScreenSharing)}
                onIcon={Monitor}
                offIcon={Monitor}
                ariaLabel={isScreenSharing ? "Stop screen sharing" : "Start screen sharing"}
              />

              <IconToggleButton
                isOn={isHandRaised}
                onToggle={() => setIsHandRaised(!isHandRaised)}
                onIcon={Hand}
                offIcon={Hand}
                ariaLabel={isHandRaised ? "Lower hand" : "Raise hand"}
              />

              <div className="w-px h-8 bg-white/20 mx-2"></div>

              <button
                onClick={() => setShowReactions(!showReactions)}
                aria-label="Show reactions"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
              >
                <Smile className="w-4 h-4 text-white mx-auto" />
              </button>

              <div className="w-px h-8 bg-white/20 mx-2"></div>

              <IconToggleButton
                isOn={false}
                onToggle={handleLeaveRoom}
                onIcon={PhoneOff}
                offIcon={PhoneOff}
                ariaLabel="Leave room"
                variant="danger"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {showReactions && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-40">
          <Card className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl">
            <CardContent className="px-4 py-3">
              <div className="flex gap-2">
                {[
                  { emoji: '', label: 'Like' },
                  { emoji: '', label: 'Love' },
                  { emoji: '', label: 'Laugh' },
                  { emoji: '', label: 'Clap' },
                  { emoji: '', label: 'Think' },
                  { emoji: '', label: 'Fire' }
                ].map((reaction) => (
                  <button
                    key={reaction.emoji}
                    onClick={() => handleSelectReaction(reaction.emoji)}
                    aria-label={reaction.label}
                    className="w-8 h-8 hover:bg-white/20 rounded text-sm bg-white/10 border border-white/20 transition-colors hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
