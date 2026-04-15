import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/student/Student_button"
import toast, { Toaster } from 'react-hot-toast'
import FriendsView from './FriendsView'
import CreateRoomView from './CreateRoomView'
import FavoritesView from './FavoritesView'
import { LIVE_THEMES, getFeaturedLiveTheme, type LiveTheme } from '@/data/liveThemes'
import StudyStreakCard from './components/StudyStreakCard'
import {
  getStudyRoomErrorMessage,
  studyRoomService,
  type MyStudyStats,
  type PublicStudyRoom,
  type StudyRoomMode,
} from '@/services/student/studyRoomService'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  PlusCircle, 
  MessageCircle, 
  Heart, 
  GraduationCap, 
  Clock,
  Play,
  Sparkles,
  Lock
} from "lucide-react"

type ViewType = 'home' | 'friends' | 'create' | 'chat' | 'favorites' | 'live-themes'
type ThemeCategory = 'all' | 'Custom' | 'Exclusive' | 'Chill' | 'Focus' | 'Anime' | 'Pets' | 'Kpop'

interface Room {
  id: string
  roomId: number
  title: string
  subtitle: string
  description: string
  students: string
  image: string
  gradient: string
  hasPassword: boolean
  roomMode: StudyRoomMode
  coverType: string | null
  currentParticipantsCount: number
  maxParticipants: number
}

interface StudyRoomsProps {
  onJoinRoom?: (roomId: string) => void
}

export default function StudyRooms({ onJoinRoom }: StudyRoomsProps) {
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [joinPassword, setJoinPassword] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joiningRoomId, setJoiningRoomId] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<ViewType>('home')
  const [liveThemes, setLiveThemes] = useState<LiveTheme[]>(LIVE_THEMES)
  const [featuredTheme, setFeaturedTheme] = useState<LiveTheme | null>(null)
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('all')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [rooms, setRooms] = useState<PublicStudyRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [roomsError, setRoomsError] = useState<string | null>(null)
  const [stats, setStats] = useState<MyStudyStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)

  const getRoomGradientByMode = useCallback((roomMode: StudyRoomMode): string => {
    switch (roomMode) {
      case 'audio':
        return 'from-orange-500 to-amber-600'
      case 'video':
        return 'from-blue-500 to-indigo-600'
      case 'focus':
      default:
        return 'from-emerald-500 to-teal-600'
    }
  }, [])

  const buildRoomSubtitle = useCallback((room: PublicStudyRoom): string => {
    const modeLabel = room.roomMode.charAt(0).toUpperCase() + room.roomMode.slice(1)
    const lockLabel = room.hasPassword ? 'Private access' : 'Open access'
    return `${modeLabel} mode · ${lockLabel}`
  }, [])

  const buildRoomDescription = useCallback((room: PublicStudyRoom): string => {
    const base = `Live room with ${room.currentParticipantsCount} participant(s) online.`
    if (room.hasPassword) {
      return `${base} Password required before joining.`
    }

    return `${base} Join instantly and start studying.`
  }, [])

  const mapRoomToCard = useCallback(
    (room: PublicStudyRoom): Room => ({
      id: String(room.roomId),
      roomId: room.roomId,
      title: room.title || `Study Room #${room.roomId}`,
      subtitle: buildRoomSubtitle(room),
      description: buildRoomDescription(room),
      students: `${room.currentParticipantsCount}/${room.maxParticipants} participants`,
      image:
        room.coverUrl ||
        'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=225&fit=crop',
      gradient: getRoomGradientByMode(room.roomMode),
      hasPassword: room.hasPassword,
      roomMode: room.roomMode,
      coverType: room.coverType,
      currentParticipantsCount: room.currentParticipantsCount,
      maxParticipants: room.maxParticipants,
    }),
    [buildRoomDescription, buildRoomSubtitle, getRoomGradientByMode],
  )

  const roomCards = useMemo(() => rooms.map(mapRoomToCard), [mapRoomToCard, rooms])

  const loadPublicRooms = useCallback(async () => {
    try {
      setRoomsLoading(true)
      setRoomsError(null)
      const data = await studyRoomService.getPublicRooms()
      setRooms(data)
    } catch (error) {
      const message = getStudyRoomErrorMessage(error, 'Failed to load study rooms')
      setRoomsError(message)
    } finally {
      setRoomsLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      setStatsError(null)
      const data = await studyRoomService.getMyStudyStats()
      setStats(data)
    } catch (error) {
      setStatsError(getStudyRoomErrorMessage(error, 'Failed to load study streak'))
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    setLiveThemes(LIVE_THEMES)
    setFeaturedTheme(getFeaturedLiveTheme())
    void loadPublicRooms()
    void loadStats()
  }, [loadPublicRooms, loadStats])

  const handleJoinRoom = (room: Room) => {
    setSelectedRoom(room)
    setIsJoinDialogOpen(true)
    setJoinPassword('')
    setJoinError(null)
    setIsMobileSidebarOpen(false)
  }

  const handleConfirmJoin = async () => {
    if (!selectedRoom) {
      return
    }

    if (selectedRoom.hasPassword && !joinPassword.trim()) {
      setJoinError('This room requires a password')
      return
    }

    try {
      setJoiningRoomId(selectedRoom.roomId)
      setJoinError(null)

      const joinResult = await studyRoomService.joinPublicRoom(selectedRoom.roomId, {
        password: joinPassword.trim() || undefined,
      })

      if (!joinResult.success) {
        throw new Error('Join room request was rejected')
      }

      toast.success(`Joined room: ${selectedRoom.title}`)
      setIsJoinDialogOpen(false)

      const routeState = {
        roomId: joinResult.roomId,
        participantId: joinResult.participantId,
        livekitToken: joinResult.livekitToken,
        password: joinPassword.trim() || undefined,
        roomData: {
          id: String(selectedRoom.roomId),
          title: selectedRoom.title,
          subtitle: selectedRoom.subtitle,
          description: selectedRoom.description,
          students: selectedRoom.students,
        },
      }

      navigate('/student/video-room', { state: routeState })

      if (onJoinRoom) {
        onJoinRoom(String(selectedRoom.roomId))
      }

      setSelectedRoom(null)
      setJoinPassword('')
      void loadPublicRooms()
    } catch (error) {
      const message = getStudyRoomErrorMessage(error, 'Unable to join this room')
      setJoinError(message)
      toast.error(message)
    } finally {
      setJoiningRoomId(null)
    }
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  // Extract YouTube video ID from various URL formats
  const extractYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const handleYoutubeUrlSubmit = () => {
    setUrlError('')
    
    if (!youtubeUrl.trim()) {
      setUrlError('Please enter a YouTube URL')
      return
    }

    const videoId = extractYoutubeVideoId(youtubeUrl)
    
    if (!videoId) {
      setUrlError('Invalid YouTube URL. Please use format: https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID')
      return
    }

    // Open the video in a new window/tab or handle it as needed
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')
    setYoutubeUrl('')
    setUrlError('')
  }

  const filteredLiveThemes = activeCategory === 'all' 
    ? liveThemes 
    : liveThemes.filter(theme => theme.category === activeCategory)

  // Render view content based on activeView
  const renderViewContent = () => {
    switch (activeView) {
      case 'friends':
        return <FriendsView />
      case 'create':
        return <CreateRoomView />
      case 'favorites':
        return <FavoritesView />
      case 'live-themes':
        return (
          <div className="p-6 md:p-8">
            {/* Section Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                <Play className="w-4 h-4" />
                <span>Live Themes</span>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  All Themes
                </button>
                {[
                  { id: 'Custom', icon: '', label: 'Custom' },
                  { id: 'Exclusive', icon: '', label: 'Exclusive' },
                  { id: 'Chill', icon: '', label: 'Chill' },
                  { id: 'Focus', icon: '', label: 'Focus' },
                  { id: 'Anime', icon: '', label: 'Anime' },
                  { id: 'Pets', icon: '', label: 'Pets' },
                  { id: 'Kpop', icon: '', label: 'Kpop' },
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id as ThemeCategory)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Theme */}
            {featuredTheme && activeCategory === 'all' && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Featured Theme
                </h2>
                <Card className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="aspect-video relative overflow-hidden group cursor-pointer"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${featuredTheme.youtubeVideoId}`, '_blank')}
                  >
                    <img 
                      src={featuredTheme.thumbnailUrl} 
                      alt={featuredTheme.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-purple-600 ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Featured
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-2xl font-bold mb-1">{featuredTheme.title}</h3>
                      <p className="text-white/80 text-sm">{featuredTheme.category} · {featuredTheme.attribution}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* All Themes Grid */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {activeCategory === 'all' ? 'All Live Themes' : `${activeCategory} Themes`}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLiveThemes.map((theme) => (
                  <div
                    key={theme.id}
                    className="cursor-pointer"
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${theme.youtubeVideoId}`, '_blank')}
                  >
                    <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="aspect-video relative overflow-hidden group">
                      <img 
                        src={theme.thumbnailUrl} 
                        alt={theme.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-purple-600 ml-1" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium">
                          {theme.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">{theme.title}</h3>
                      {theme.attribution && (
                        <p className="text-gray-600 text-sm">{theme.attribution}</p>
                      )}
                    </CardContent>
                  </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom YouTube URL Section */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-600" />
                  Add Custom YouTube Video
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Paste any YouTube video URL to use as a live theme
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleYoutubeUrlSubmit()}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <Button
                    onClick={handleYoutubeUrlSubmit}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-medium"
                  >
                    Open Video
                  </Button>
                </div>
                {urlError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{urlError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      case 'home':
      default:
        return (
          <div className="p-6 md:p-8">
            {/* Section Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                <GraduationCap className="w-4 h-4" />
                <span>School Channel</span>
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="mb-6">
              <StudyStreakCard
                stats={stats}
                loading={statsLoading}
                error={statsError}
                onRetry={() => void loadStats()}
              />
            </div>

            {roomsError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{roomsError}</p>
                <Button
                  onClick={() => void loadPublicRooms()}
                  className="mt-3 bg-red-600 text-white hover:bg-red-700"
                >
                  Retry
                </Button>
              </div>
            )}

            {roomsLoading && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Loading public rooms...
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomCards.map((room) => (
                <div 
                  key={room.id}
                  onClick={() => handleJoinRoom(room)}
                  className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Card className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className={`aspect-video bg-gradient-to-br ${room.gradient} relative overflow-hidden`}>
                      <img 
                        src={room.image} 
                        alt={room.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <CardContent className="p-5">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{room.title}</h3>
                        {room.hasPassword && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                            <Lock className="h-3 w-3" />
                            Protected
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{room.subtitle}</p>
                      <p className="text-gray-500 text-sm mb-3">{room.description}</p>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{room.students}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Cover: {room.coverType ?? 'none'} · Mode: {room.roomMode}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {!roomsLoading && roomCards.length === 0 && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-600">
                No public study rooms found.
              </div>
            )}
          </div>
        )
    }
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="p-6">
      {/* Header */}
      <div className={`${isMobile ? 'flex justify-between items-center' : ''} mb-8`}>
        <h1 className="text-xl font-bold text-gray-900">Learning Hub</h1>
        {isMobile && (
          <Button
            size="icon"
            variant="ghost"
            onClick={closeMobileSidebar}
            className="w-8 h-8 rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-600" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'home'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveView('live-themes')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'live-themes'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Play className="w-5 h-5" />
          <span>Live Themes</span>
        </button>
        <button
          onClick={() => setActiveView('friends')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'friends'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Friends</span>
        </button>
        <button
          onClick={() => setActiveView('create')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'create'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span>Create Room</span>
        </button>
        <button
          onClick={() => setActiveView('chat')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'chat'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveView('favorites')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            activeView === 'favorites'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span>Favorite Room</span>
        </button>
      </nav>
    </div>
  )

  // Render different views based on activeView state
  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-center" />
      {/* Mobile Hamburger Button */}
      <Button
        size="icon"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-lg shadow-md md:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </Button>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={closeMobileSidebar}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-40 transition-transform duration-300 md:hidden ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent isMobile />
      </aside>

      {/* Main Content */}
      <main className="md:ml-60 min-h-screen">
        {renderViewContent()}
      </main>

      {/* Join Room Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden">
          {selectedRoom && (
            <>
              {/* Dialog Header with Image */}
              <div className="relative">
                <div className={`aspect-video bg-gradient-to-br ${selectedRoom.gradient} relative overflow-hidden`}>
                  <img 
                    src={selectedRoom.image} 
                    alt={selectedRoom.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsJoinDialogOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Dialog Content */}
              <div className="p-6">
                <DialogHeader className="text-left space-y-2 mb-4">
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {selectedRoom.title}
                  </DialogTitle>
                  <p className="text-gray-600">{selectedRoom.subtitle}</p>
                </DialogHeader>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-gray-700 text-sm mb-3">{selectedRoom.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{selectedRoom.students}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Live now</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    {selectedRoom.hasPassword ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 font-medium text-amber-700">
                        <Lock className="h-3 w-3" />
                        Password required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-700">
                        Open room
                      </span>
                    )}
                    <span>Mode: {selectedRoom.roomMode}</span>
                  </div>
                </div>

                {selectedRoom.hasPassword && (
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Room password
                    </label>
                    <input
                      type="password"
                      value={joinPassword}
                      onChange={(event) => setJoinPassword(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                      placeholder="Enter room password"
                    />
                  </div>
                )}

                {joinError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {joinError}
                  </div>
                )}

                {/* Dialog Actions */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleConfirmJoin}
                    disabled={joiningRoomId === selectedRoom.roomId}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl"
                  >
                    {joiningRoomId === selectedRoom.roomId ? 'Joining...' : 'Join Room'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsJoinDialogOpen(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}