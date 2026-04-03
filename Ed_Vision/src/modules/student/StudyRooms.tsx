import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/student/Student_button"
import FriendsView from './FriendsView'
import CreateRoomView from './CreateRoomView'
import FavoritesView from './FavoritesView'
import { LIVE_THEMES, getFeaturedLiveTheme, type LiveTheme } from '@/data/liveThemes'
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
  Sparkles
} from "lucide-react"

type ViewType = 'home' | 'friends' | 'create' | 'chat' | 'favorites' | 'live-themes'
type ThemeCategory = 'all' | 'Custom' | 'Exclusive' | 'Chill' | 'Focus' | 'Anime' | 'Pets' | 'Kpop'

interface Room {
  id: string
  title: string
  subtitle: string
  description: string
  students: string
  image: string
  gradient: string
}

interface StudyRoomsProps {
  onJoinRoom?: (roomId: string) => void
}

export default function StudyRooms({ onJoinRoom }: StudyRoomsProps) {
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [activeView, setActiveView] = useState<ViewType>('home')
  const [liveThemes, setLiveThemes] = useState<LiveTheme[]>(LIVE_THEMES)
  const [featuredTheme, setFeaturedTheme] = useState<LiveTheme | null>(null)
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('all')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  useEffect(() => {
    setLiveThemes(LIVE_THEMES)
    setFeaturedTheme(getFeaturedLiveTheme())
  }, [])

  const rooms: Room[] = [
    {
      id: 'cs101',
      title: 'Computer Science 101',
      subtitle: 'Programming Basics · Prof. Lee',
      description: 'Learn the fundamentals of programming with hands-on coding exercises and interactive discussions.',
      students: '18 students',
      image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=225&fit=crop',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      id: 'history',
      title: 'History Seminar',
      subtitle: 'World War II · Dr. Brown',
      description: 'Explore the major events and impacts of World War II through primary sources and group discussions.',
      students: '26 students',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=225&fit=crop',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      id: 'biology',
      title: 'Biology Workshop',
      subtitle: 'Cell Biology · Dr. Garcia',
      description: 'Dive deep into cellular structures and processes with virtual lab experiments and microscopy.',
      students: '14 students',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=225&fit=crop',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      id: 'art',
      title: 'Art & Design',
      subtitle: 'Digital Art · Ms. Taylor',
      description: 'Create stunning digital artwork using industry-standard tools and creative techniques.',
      students: '11 students',
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      id: 'spanish',
      title: 'Language Exchange',
      subtitle: 'Spanish Conversation · Señora Martínez',
      description: 'Practice Spanish conversation skills with native speakers and fellow learners.',
      students: '28 students',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop',
      gradient: 'from-red-500 to-pink-600'
    },
    {
      id: 'economics',
      title: 'Economics Study Group',
      subtitle: 'Microeconomics · Prof. Anderson',
      description: 'Master microeconomic principles through real-world case studies and problem-solving sessions.',
      students: '21 students',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop',
      gradient: 'from-indigo-500 to-blue-600'
    }
  ]

  const handleJoinRoom = (room: Room) => {
    setSelectedRoom(room)
    setIsJoinDialogOpen(true)
    setIsMobileSidebarOpen(false)
  }

  const handleConfirmJoin = () => {
    if (selectedRoom) {
      // Close dialog first
      setIsJoinDialogOpen(false)
      setSelectedRoom(null)
      
      // Navigate to video room URL
      navigate('/student/video-room')
      
      // Call the parent callback if provided
      if (onJoinRoom) {
        onJoinRoom(selectedRoom.id)
      }
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{room.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{room.subtitle}</p>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{room.students}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
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
                </div>

                {/* Dialog Actions */}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleConfirmJoin}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl"
                  >
                    Join Room
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