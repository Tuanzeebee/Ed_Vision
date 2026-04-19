import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/student/Student_button"
import { TokenManager } from '@/lib/tokenManager'
import { studyRoomRealtime } from '@/services/student/studyRoomRealtime'
import {
  getStudyRoomErrorMessage,
  studyRoomService,
  type StudyRoomDetail,
  type StudyRoomParticipantPresence,
} from '@/services/student/studyRoomService'
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

interface VideoRoomRouteState {
  roomId?: number
  participantId?: number
  livekitToken?: string
  password?: string
  roomData?: VideoRoomProps['roomData']
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
  accountId: number
  name: string
  avatar: string
  isCurrentUser: boolean
  isMuted: boolean
  isSpeaking?: boolean
  isVideoOff: boolean
  isHost: boolean
}

function resolveCurrentAccountId(): number | null {
  try {
    const rawUser = localStorage.getItem('user')
    if (!rawUser) {
      return null
    }

    const parsed = JSON.parse(rawUser) as Record<string, unknown>
    const id = parsed.account_id ?? parsed.accountId ?? parsed.id

    if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
      return Math.trunc(id)
    }

    if (typeof id === 'string') {
      const parsedId = Number.parseInt(id, 10)
      if (!Number.isNaN(parsedId) && parsedId > 0) {
        return parsedId
      }
    }

    return null
  } catch {
    return null
  }
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
  const location = useLocation()
  const routeState = (location.state ?? {}) as VideoRoomRouteState
  const routeRoomData = routeState.roomData

  const parsedPropRoomId = roomData?.id ? Number.parseInt(roomData.id, 10) : Number.NaN
  const effectiveRoomId =
    typeof routeState.roomId === 'number' && Number.isFinite(routeState.roomId)
      ? routeState.roomId
      : Number.isFinite(parsedPropRoomId)
        ? parsedPropRoomId
        : null
  const currentAccountId = useMemo(() => resolveCurrentAccountId(), [])

  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [currentTab, setCurrentTab] = useState('chat')
  const [showReactions, setShowReactions] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [notes, setNotes] = useState('')
  const [roomDetail, setRoomDetail] = useState<StudyRoomDetail | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [roomLoading, setRoomLoading] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const localMediaStreamRef = useRef<MediaStream | null>(null)

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

  const mapPresenceToParticipant = useCallback((presence: StudyRoomParticipantPresence): Participant => {
    return {
      accountId: presence.accountId,
      name: presence.fullName ?? presence.email ?? `User #${presence.accountId}`,
      avatar:
        presence.avatarUrl ||
        `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&u=${presence.accountId}`,
      isCurrentUser: currentAccountId === presence.accountId,
      isMuted: !presence.micOn,
      isSpeaking: presence.micOn,
      isVideoOff: !presence.cameraOn,
      isHost: presence.isHost,
    }
  }, [currentAccountId])

  const chatMessagesRef = useRef<HTMLDivElement>(null)

  const stopLocalMediaTracks = useCallback(() => {
    if (!localMediaStreamRef.current) {
      return
    }

    localMediaStreamRef.current.getTracks().forEach((track) => {
      track.stop()
    })
    localMediaStreamRef.current = null
  }, [])

  const ensureMediaPermissions = useCallback(async (
    options: { audio?: boolean; video?: boolean },
    silent = false,
  ): Promise<boolean> => {
    const wantsAudio = Boolean(options.audio)
    const wantsVideo = Boolean(options.video)

    if (!wantsAudio && !wantsVideo) {
      return true
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const message = 'Your browser does not support camera/microphone permissions'
      setMediaError(message)
      if (!silent) {
        toast.error(message)
      }
      return false
    }

    const activeStream = localMediaStreamRef.current
    const hasAudio = Boolean(activeStream?.getAudioTracks().length)
    const hasVideo = Boolean(activeStream?.getVideoTracks().length)
    const needsAudio = wantsAudio && !hasAudio
    const needsVideo = wantsVideo && !hasVideo

    if (!needsAudio && !needsVideo) {
      setMediaError(null)
      return true
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: wantsAudio || hasAudio,
        video: wantsVideo || hasVideo,
      })

      stopLocalMediaTracks()
      localMediaStreamRef.current = stream
      setMediaError(null)
      return true
    } catch {
      const message = 'Please allow camera and microphone to use this room'
      setMediaError(message)
      if (!silent) {
        toast.error(message)
      }
      return false
    }
  }, [stopLocalMediaTracks])

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatMessages])

  useEffect(() => {
    let active = true

    const requestMediaPermissions = async () => {
      const granted = await ensureMediaPermissions({ audio: true, video: true }, true)
      if (active && !granted) {
        setIsMicOn(false)
        setIsCameraOn(false)
      }
    }

    void requestMediaPermissions()

    return () => {
      active = false
      stopLocalMediaTracks()
    }
  }, [ensureMediaPermissions, stopLocalMediaTracks])

  const upsertParticipant = useCallback((presence: StudyRoomParticipantPresence) => {
    const mapped = mapPresenceToParticipant(presence)
    setParticipants((previous) => {
      const index = previous.findIndex((participant) => participant.accountId === mapped.accountId)
      if (index < 0) {
        return [...previous, mapped]
      }

      const next = [...previous]
      next[index] = mapped
      return next
    })
  }, [mapPresenceToParticipant])

  useEffect(() => {
    if (!effectiveRoomId) {
      return
    }

    let active = true

    const loadRoomDetail = async () => {
      try {
        setRoomLoading(true)
        setRoomError(null)
        const detail = await studyRoomService.getRoomById(effectiveRoomId)

        if (!active) {
          return
        }

        setRoomDetail(detail)
        setParticipants(detail.participants.map(mapPresenceToParticipant))
      } catch (error) {
        if (active) {
          setRoomError(getStudyRoomErrorMessage(error, 'Failed to load room details'))
        }
      } finally {
        if (active) {
          setRoomLoading(false)
        }
      }
    }

    void loadRoomDetail()

    return () => {
      active = false
    }
  }, [effectiveRoomId, mapPresenceToParticipant])

  useEffect(() => {
    if (!effectiveRoomId) {
      return
    }

    let active = true

    const onParticipantJoined = (payload: { roomId: number; participant: StudyRoomParticipantPresence }) => {
      if (payload.roomId !== effectiveRoomId) {
        return
      }

      upsertParticipant(payload.participant)
    }

    const onParticipantUpdated = (payload: { roomId: number; participant: StudyRoomParticipantPresence }) => {
      if (payload.roomId !== effectiveRoomId) {
        return
      }

      upsertParticipant(payload.participant)
    }

    const onParticipantLeft = (payload: { roomId: number; participant: StudyRoomParticipantPresence }) => {
      if (payload.roomId !== effectiveRoomId) {
        return
      }

      setParticipants((previous) =>
        previous.filter((participant) => participant.accountId !== payload.participant.accountId),
      )
    }

    const onRoomError = (payload: { message?: string }) => {
      if (!active) {
        return
      }

      const message = payload.message?.trim() || 'Study room realtime error'
      setRoomError(message)
      toast.error(message)
    }

    const connectRealtime = async () => {
      const token = TokenManager.getToken()
      if (!token) {
        return
      }

      try {
        await studyRoomRealtime.connect(token)
        await studyRoomRealtime.joinRoom({
          roomId: effectiveRoomId,
          password: routeState.password,
        })
      } catch (error) {
        if (active) {
          const message = getStudyRoomErrorMessage(error, 'Unable to join realtime room')
          setRoomError(message)
          toast.error(message)
        }
      }
    }

    void connectRealtime()

    studyRoomRealtime.on('room.participant.joined', onParticipantJoined)
    studyRoomRealtime.on('room.participant.updated', onParticipantUpdated)
    studyRoomRealtime.on('room.participant.left', onParticipantLeft)
    studyRoomRealtime.on('room.error', onRoomError)

    return () => {
      active = false

      studyRoomRealtime.off('room.participant.joined', onParticipantJoined as (...args: unknown[]) => void)
      studyRoomRealtime.off('room.participant.updated', onParticipantUpdated as (...args: unknown[]) => void)
      studyRoomRealtime.off('room.participant.left', onParticipantLeft as (...args: unknown[]) => void)
      studyRoomRealtime.off('room.error', onRoomError as (...args: unknown[]) => void)

      void studyRoomRealtime.leaveRoom(effectiveRoomId).catch(() => {
        // Ignore cleanup leave errors.
      })
      studyRoomRealtime.disconnect()
    }
  }, [effectiveRoomId, routeState.password, upsertParticipant])

  useEffect(() => {
    setRoomDetail((previous) =>
      previous
        ? {
            ...previous,
            onlineCount: participants.length,
          }
        : previous,
    )
  }, [participants.length])

  const displayTitle = roomDetail?.title || routeRoomData?.title || roomData?.title || 'Computer Science 101'
  const displaySubtitle = roomDetail
    ? `${roomDetail.roomMode.toUpperCase()} mode · ${participants.length}/${roomDetail.maxParticipants} participants`
    : routeRoomData?.subtitle || roomData?.subtitle || 'Programming Basics · Study Room'

  const handleSendMessage = useCallback(() => {
    if (chatInput.trim()) {
      console.log('Sending message:', chatInput.trim())
      setChatInput('')
    }
  }, [chatInput])

  const handleLeaveRoom = useCallback(() => {
    if (window.confirm('Are you sure you want to leave the room?')) {
      const leave = async () => {
        try {
          if (effectiveRoomId) {
            await studyRoomRealtime.leaveRoom(effectiveRoomId)
          }
        } catch {
          // Ignore leave errors and continue closing.
        } finally {
          stopLocalMediaTracks()
          studyRoomRealtime.disconnect()
          onLeaveRoom?.()
        }
      }

      void leave()
    }
  }, [effectiveRoomId, onLeaveRoom, stopLocalMediaTracks])

  const handleToggleMic = useCallback(async () => {
    const next = !isMicOn
    if (next) {
      const granted = await ensureMediaPermissions({ audio: true })
      if (!granted) {
        setIsMicOn(false)
        return
      }
    }

    setIsMicOn(next)

    if (!effectiveRoomId) {
      return
    }

    try {
      await studyRoomRealtime.updateParticipantState({ roomId: effectiveRoomId, micOn: next })
      await studyRoomRealtime.toggleMic({ roomId: effectiveRoomId, enabled: next })
    } catch (error) {
      setIsMicOn(!next)
      toast.error(getStudyRoomErrorMessage(error, 'Unable to update microphone state'))
    }
  }, [effectiveRoomId, ensureMediaPermissions, isMicOn])

  const handleToggleCamera = useCallback(async () => {
    const next = !isCameraOn
    if (next) {
      const granted = await ensureMediaPermissions({ video: true })
      if (!granted) {
        setIsCameraOn(false)
        return
      }
    }

    setIsCameraOn(next)

    if (!effectiveRoomId) {
      return
    }

    try {
      await studyRoomRealtime.updateParticipantState({ roomId: effectiveRoomId, cameraOn: next })
      await studyRoomRealtime.toggleCamera({ roomId: effectiveRoomId, enabled: next })
    } catch (error) {
      setIsCameraOn(!next)
      toast.error(getStudyRoomErrorMessage(error, 'Unable to update camera state'))
    }
  }, [effectiveRoomId, ensureMediaPermissions, isCameraOn])

  const handleToggleHandRaised = useCallback(async () => {
    const next = !isHandRaised
    setIsHandRaised(next)

    if (!effectiveRoomId) {
      return
    }

    try {
      await studyRoomRealtime.updateParticipantState({ roomId: effectiveRoomId, handRaised: next })
    } catch (error) {
      setIsHandRaised(!next)
      toast.error(getStudyRoomErrorMessage(error, 'Unable to update hand raise state'))
    }
  }, [effectiveRoomId, isHandRaised])

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
                {displayTitle}
              </h1>
              <p className="text-slate-300 text-sm">
                {displaySubtitle}
              </p>
              <div className="absolute -left-2 top-1 w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
            <Users className="w-4 h-4 text-slate-300" />
            <span className="text-white text-sm font-medium">
              {participants.length} participants
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
          {roomLoading && (
            <div className="mb-4 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/80">
              Loading room details...
            </div>
          )}

          {roomError && (
            <div className="mb-4 rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {roomError}
            </div>
          )}

          {mediaError && (
            <div className="mb-4 rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {mediaError}
            </div>
          )}

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
            {participants.map((participant) => (
              <div
                key={participant.accountId}
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
                  {participant.name}{participant.isHost ? ' (Host)' : ''}
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

            {participants.length === 0 && (
              <div className="col-span-2 rounded border border-white/10 bg-white/5 p-2 text-center text-xs text-slate-300 sm:col-span-4 md:col-span-5 lg:col-span-7">
                No participants online yet.
              </div>
            )}
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
                onToggle={() => void handleToggleMic()}
                onIcon={Mic}
                offIcon={MicOff}
                ariaLabel={isMicOn ? "Mute microphone" : "Unmute microphone"}
              />

              <IconToggleButton
                isOn={isCameraOn}
                onToggle={() => void handleToggleCamera()}
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
                onToggle={() => void handleToggleHandRaised()}
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
