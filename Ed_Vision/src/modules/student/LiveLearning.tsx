import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/student/Student_button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import MusicBrowser from './MusicBrowser'
import StudyRooms from './StudyRooms'
import { LearningSessionIndicator } from '@/components/LearningSessionIndicator'
import { Clock, Play, Pause,RotateCcw, ArrowLeft, Image as ImageIcon,GraduationCap,Music,PlayCircle,CloudRain,Settings,X,Plus,Minus,
  SkipBack,
  SkipForward,
  Volume2,
  Move,
  Maximize2,
  Minimize2
} from "lucide-react"

// Track interface for music functionality
interface Track {
  id: string
  title: string
  artist: string
  duration: string
  cover?: string
}

export default function LiveLearning() {
  const [currentTime, setCurrentTime] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [showPomodoroModal, setShowPomodoroModal] = useState(false)
  
  // Timer states
  const [timerMinutes, setTimerMinutes] = useState(25)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [totalTimeInSeconds, setTotalTimeInSeconds] = useState(25 * 60)
  const [currentTab, setCurrentTab] = useState('focus')
  const intervalRef = useRef<number | null>(null)
  
  // Background states
  const [backgroundUrl, setBackgroundUrl] = useState('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop')
  const [backgroundBlur, setBackgroundBlur] = useState(0)
  const [backgroundBrightness, setBackgroundBrightness] = useState(100)
  const [backgroundFit, setBackgroundFit] = useState('cover')
  const [showBackgroundControls, setShowBackgroundControls] = useState(false)
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  
  // Music states
  const [showMusicBrowser, setShowMusicBrowser] = useState(false)
  const [showMusicPlayer, setShowMusicPlayer] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [musicCurrentTime] = useState('0:00')
  const [volume, setVolume] = useState(70)

  // Study Rooms states
  const [showStudyRooms, setShowStudyRooms] = useState(false)

  // Draggable & Resizable states
  const [musicPlayerPos, setMusicPlayerPos] = useState({ x: 0, y: 0 })
  const [musicPlayerSize, setMusicPlayerSize] = useState({ width: 700, height: 120 })
  const [backgroundControlsPos, setBackgroundControlsPos] = useState({ x: 0, y: 0 })
  const [backgroundControlsSize, setBackgroundControlsSize] = useState({ width: 256, height: 200 })
  const [isMinimized, setIsMinimized] = useState({ musicPlayer: false, backgroundControls: false })
  
  // Dragging states
  const [isDragging, setIsDragging] = useState('')
  const [isResizing, setIsResizing] = useState('')
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // Custom hook for draggable functionality
  const useDraggable = useCallback((id: string) => {
    const handleMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.no-drag')) return
      e.preventDefault()
      setIsDragging(id)
      setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isDragging === id) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        
        if (id === 'musicPlayer') {
          setMusicPlayerPos(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
        } else if (id === 'backgroundControls') {
          setBackgroundControlsPos(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
        }
        
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }, [isDragging, dragStart, id])

    const handleMouseUp = useCallback(() => {
      setIsDragging('')
    }, [])

    useEffect(() => {
      if (isDragging === id) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isDragging, handleMouseMove, handleMouseUp, id])

    return { handleMouseDown }
  }, [isDragging, dragStart])

  // Custom hook for resizable functionality
  const useResizable = useCallback((id: string) => {
    const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(`${id}-${direction}`)
      setDragStart({ x: e.clientX, y: e.clientY })
      
      if (id === 'musicPlayer') {
        setResizeStart({ x: e.clientX, y: e.clientY, width: musicPlayerSize.width, height: musicPlayerSize.height })
      } else if (id === 'backgroundControls') {
        setResizeStart({ x: e.clientX, y: e.clientY, width: backgroundControlsSize.width, height: backgroundControlsSize.height })
      }
    }

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
      if (isResizing.startsWith(id)) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        
        const newWidth = Math.max(300, resizeStart.width + deltaX)
        const newHeight = Math.max(100, resizeStart.height + deltaY)
        
        if (id === 'musicPlayer') {
          setMusicPlayerSize({ width: newWidth, height: newHeight })
        } else if (id === 'backgroundControls') {
          setBackgroundControlsSize({ width: newWidth, height: newHeight })
        }
      }
    }, [isResizing, resizeStart, id])

    const handleResizeMouseUp = useCallback(() => {
      setIsResizing('')
    }, [])

    useEffect(() => {
      if (isResizing.startsWith(id)) {
        document.addEventListener('mousemove', handleResizeMouseMove)
        document.addEventListener('mouseup', handleResizeMouseUp)
        return () => {
          document.removeEventListener('mousemove', handleResizeMouseMove)
          document.removeEventListener('mouseup', handleResizeMouseUp)
        }
      }
    }, [isResizing, handleResizeMouseMove, handleResizeMouseUp, id])

    return { handleResizeMouseDown }
  }, [isResizing, resizeStart, musicPlayerSize, backgroundControlsSize])

  const musicPlayerDrag = useDraggable('musicPlayer')
  const musicPlayerResize = useResizable('musicPlayer')
  const backgroundControlsDrag = useDraggable('backgroundControls')
  const backgroundControlsResize = useResizable('backgroundControls')
  
  // Presets for timer
  const presets = {
    focus: { minutes: 25, seconds: 0 },
    shortBreak: { minutes: 5, seconds: 0 },
    longBreak: { minutes: 15, seconds: 0 }
  }
  
  // Timer functions
  const startTimer = () => {
    if (!isTimerRunning) {
      setIsTimerRunning(true)
      intervalRef.current = window.setInterval(() => {
        setTotalTimeInSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            if (intervalRef.current) window.clearInterval(intervalRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }
  
  const pauseTimer = () => {
    setIsTimerRunning(false)
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }
  
  const resetTimer = () => {
    setIsTimerRunning(false)
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    const preset = presets[currentTab as keyof typeof presets]
    setTotalTimeInSeconds(preset.minutes * 60 + preset.seconds)
  }
  
  // Background functions
  const handleBackgroundClick = () => {
    backgroundInputRef.current?.click()
  }
  
  const handleBackgroundChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setBackgroundUrl(url)
    }
  }
  
  // Music functions
  const handleMusicClick = () => {
    setShowMusicBrowser(true)
  }

  // Study Rooms functions
  const handleVideoClick = () => {
    setShowStudyRooms(true)
  }

  const handleJoinRoom = (roomId: string) => {
    console.log('Joining room:', roomId)
    // Implement room joining logic here
    setShowStudyRooms(false)
  }

  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    setShowMusicPlayer(true)
    setShowMusicBrowser(false)
  }
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (!currentTrack) {
      // Set a default track if none is selected
      const defaultTrack: Track = {
        id: 'default-1',
        title: 'Lofi Study Mix',
        artist: 'ChillHop Essentials',
        duration: '45:32'
      }
      setCurrentTrack(defaultTrack)
    }
    setShowMusicPlayer(true)
  }
  
  const skipToNext = () => {
    // Logic to skip to next track
    console.log('Skip to next track')
  }
  
  const skipToPrevious = () => {
    // Logic to skip to previous track
    console.log('Skip to previous track')
  }
  
  // Timer tab switching
  const switchTimerTab = (tab: string) => {
    setCurrentTab(tab)
    const preset = presets[tab as keyof typeof presets]
    setTotalTimeInSeconds(preset.minutes * 60 + preset.seconds)
    resetTimer()
  }
  
  // Update timer display when totalTimeInSeconds changes
  useEffect(() => {
    const minutes = Math.floor(totalTimeInSeconds / 60)
    const seconds = totalTimeInSeconds % 60
    setTimerMinutes(minutes)
    setTimerSeconds(seconds)
  }, [totalTimeInSeconds])
  
  // Clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
      const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      })
      setCurrentTime(timeString)
      setCurrentDate(dateString)
    }

    updateClock()
    const interval = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(interval)
  }, [])
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={backgroundUrl}
          alt="Background" 
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{
            filter: `blur(${backgroundBlur}px) brightness(${backgroundBrightness}%)`,
            objectFit: backgroundFit as any
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Top Section */}
        <div className="flex justify-between items-start p-4 sm:p-6">
          {/* Back Button */}
          <Button
            size="icon"
            className="rounded-full bg-white/15 backdrop-blur-[20px] border border-white/30 hover:bg-white/25 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>

          {/* Focus Timer - Top Center */}
          <Card className="px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-[30px] border-2 border-white/40 transition-all duration-400 hover:translate-y-[-2px] rounded-2xl">
            <CardContent className="text-center p-0">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent font-bold text-xs uppercase tracking-wider mb-2">
                Focus Time
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/30 rounded-2xl py-3 px-5 mb-4">
                <div className="text-white text-3xl sm:text-4xl font-bold font-mono">
                  {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={isTimerRunning ? pauseTimer : startTimer}
                  className="bg-gradient-to-r from-white/25 to-white/10 backdrop-blur-[20px] border border-white/30 text-white text-xs font-semibold hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-pink-500/30 hover:scale-105 transition-all duration-300"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={resetTimer}
                  className="bg-gradient-to-r from-white/25 to-white/10 backdrop-blur-[20px] border border-white/30 text-white text-xs font-semibold hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-pink-500/30 hover:scale-105 transition-all duration-300"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Digital Clock + Date */}
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="text-center">
              <div className="text-white text-xl sm:text-2xl font-bold mb-1 drop-shadow-lg">
                {currentTime}
              </div>
              <div className="text-white/80 text-sm sm:text-base drop-shadow-lg">
                {currentDate}
              </div>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-white text-4xl sm:text-6xl font-light mb-4 opacity-80">
              Focus & Learn
            </h1>
            <p className="text-white/60 text-lg sm:text-xl">
              Create your perfect study environment
            </p>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className={`fixed ${showMusicPlayer ? 'bottom-32' : 'bottom-6'} left-1/2 transform -translate-x-1/2 z-20 transition-all duration-300`}>
          <Card className="bg-white/15 backdrop-blur-[25px] border border-white/20 px-4 sm:px-6 py-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-center space-x-4 sm:space-x-6">
                <div className="relative group">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                    onClick={() => setShowPomodoroModal(true)}
                  >
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 whitespace-nowrap">
                    Timer
                  </div>
                </div>
                
                <div className="relative group">
                  <div
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setShowBackgroundControls(true)
                    }}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white/80 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                      onClick={handleBackgroundClick}
                    >
                      <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 whitespace-nowrap">
                    Background (Right-click for controls)
                  </div>
                </div>

                <div className="relative group">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                  >
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 whitespace-nowrap">
                    Learn
                  </div>
                </div>

                <div className="relative group">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`text-white/80 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300 ${
                      showMusicPlayer ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200' : ''
                    }`}
                    onClick={handleMusicClick}
                  >
                    <Music className={`h-4 w-4 sm:h-5 sm:w-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                    {/* Playing indicator */}
                    {isPlaying && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 whitespace-nowrap">
                    {isPlaying ? 'Music Playing' : 'Music'}
                  </div>
                </div>

                <div className="relative group">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                    onClick={handleVideoClick}
                  >
                    <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 whitespace-nowrap">
                    Video
                  </div>
                </div>

                <div className="relative group">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                  >
                    <CloudRain className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 whitespace-nowrap">
                    Ambience
                  </div>
                </div>

                <div className="relative group">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                  >
                    <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 whitespace-nowrap">
                    Settings
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pomodoro Timer Modal */}
      <Dialog open={showPomodoroModal} onOpenChange={setShowPomodoroModal}>
        <DialogContent className="bg-white/90 backdrop-blur-[30px] border border-white/50 max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowPomodoroModal(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-2xl font-bold text-gray-800">Pomodoro Timer</DialogTitle>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Timer Tabs */}
            <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
              {[
                { key: 'focus', label: 'Focus', time: '25:00' },
                { key: 'shortBreak', label: 'Short Break', time: '5:00' },
                { key: 'longBreak', label: 'Long Break', time: '15:00' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => switchTimerTab(tab.key)}
                  className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentTab === tab.key
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <div>{tab.label}</div>
                  <div className="text-xs opacity-80">{tab.time}</div>
                </button>
              ))}
            </div>

            {/* Large Timer Display */}
            <div className="text-center py-8">
              <div className="text-6xl font-bold font-mono text-gray-800 mb-4">
                {String(Math.floor(totalTimeInSeconds / 3600)).padStart(2, '0')}:
                {String(Math.floor((totalTimeInSeconds % 3600) / 60)).padStart(2, '0')}:
                {String(totalTimeInSeconds % 60).padStart(2, '0')}
              </div>
              
              {/* Timer Controls */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={isTimerRunning ? pauseTimer : startTimer}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetTimer}
                  variant="outline"
                  className="px-8 py-3 rounded-xl"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Custom Time Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Custom Duration</h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <label className="text-sm text-gray-600 block mb-2">Hours</label>
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          const newHours = Math.max(0, Math.floor(totalTimeInSeconds / 3600) - 1)
                          const minutes = Math.floor((totalTimeInSeconds % 3600) / 60)
                          const seconds = totalTimeInSeconds % 60
                          setTotalTimeInSeconds(newHours * 3600 + minutes * 60 + seconds)
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-lg font-bold text-gray-800 w-12 text-center">
                        {Math.floor(totalTimeInSeconds / 3600)}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          const newHours = Math.min(23, Math.floor(totalTimeInSeconds / 3600) + 1)
                          const minutes = Math.floor((totalTimeInSeconds % 3600) / 60)
                          const seconds = totalTimeInSeconds % 60
                          setTotalTimeInSeconds(newHours * 3600 + minutes * 60 + seconds)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <label className="text-sm text-gray-600 block mb-2">Minutes</label>
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          const hours = Math.floor(totalTimeInSeconds / 3600)
                          const newMinutes = Math.max(0, Math.floor((totalTimeInSeconds % 3600) / 60) - 1)
                          const seconds = totalTimeInSeconds % 60
                          setTotalTimeInSeconds(hours * 3600 + newMinutes * 60 + seconds)
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-lg font-bold text-gray-800 w-12 text-center">
                        {Math.floor((totalTimeInSeconds % 3600) / 60)}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          const hours = Math.floor(totalTimeInSeconds / 3600)
                          const newMinutes = Math.min(59, Math.floor((totalTimeInSeconds % 3600) / 60) + 1)
                          const seconds = totalTimeInSeconds % 60
                          setTotalTimeInSeconds(hours * 3600 + newMinutes * 60 + seconds)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <label className="text-sm text-gray-600 block mb-2">Seconds</label>
                    <div className="flex items-center">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          const hours = Math.floor(totalTimeInSeconds / 3600)
                          const minutes = Math.floor((totalTimeInSeconds % 3600) / 60)
                          const newSeconds = Math.max(0, (totalTimeInSeconds % 60) - 1)
                          setTotalTimeInSeconds(hours * 3600 + minutes * 60 + newSeconds)
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-lg font-bold text-gray-800 w-12 text-center">
                        {totalTimeInSeconds % 60}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => {
                          const hours = Math.floor(totalTimeInSeconds / 3600)
                          const minutes = Math.floor((totalTimeInSeconds % 3600) / 60)
                          const newSeconds = Math.min(59, (totalTimeInSeconds % 60) + 1)
                          setTotalTimeInSeconds(hours * 3600 + minutes * 60 + newSeconds)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Timer Presets */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-600">Quick Presets</h4>
              <div className="grid grid-cols-4 gap-2">
                {[15, 25, 45, 60].map((minutes) => (
                  <Button
                    key={minutes}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                    onClick={() => {
                      setTotalTimeInSeconds(minutes * 60)
                      resetTimer()
                    }}
                  >
                    {minutes}m
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                onClick={() => {
                  setShowPomodoroModal(false)
                  if (!isTimerRunning) {
                    startTimer()
                  }
                }}
              >
                {isTimerRunning ? 'Continue Timer' : 'Start Timer'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowPomodoroModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Music Player Widget - Draggable & Resizable */}
      {showMusicPlayer && (
        <div 
          className="fixed z-30 music-player select-none"
          style={{
            left: `calc(50% + ${musicPlayerPos.x}px)`,
            bottom: `calc(6px + ${musicPlayerPos.y}px)`,
            transform: 'translateX(-50%)',
            width: `${musicPlayerSize.width}px`,
            minWidth: '400px',
            maxWidth: '1000px'
          }}
        >
          <Card className="bg-white/90 backdrop-blur-[30px] border border-white/50 rounded-2xl shadow-lg relative overflow-hidden">
            {/* Drag Handle & Controls */}
            <div 
              className="flex items-center justify-between p-2 border-b border-white/30 cursor-move hover:bg-white/10 transition-colors"
              onMouseDown={musicPlayerDrag.handleMouseDown}
            >
              <div className="flex items-center space-x-2">
                <Move className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Music Player</span>
              </div>
              <div className="flex items-center space-x-1 no-drag">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsMinimized(prev => ({ ...prev, musicPlayer: !prev.musicPlayer }))}
                >
                  {isMinimized.musicPlayer ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowMusicPlayer(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Music Player Content */}
            {!isMinimized.musicPlayer && (
              <CardContent className="p-4">
                <div className="flex items-center space-x-4" style={{ minHeight: '60px' }}>
                  {/* Album Art & Track Info */}
                  <div className="flex items-center space-x-3 flex-shrink-0" style={{ width: '200px' }}>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {currentTrack?.title || 'No track selected'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {currentTrack?.artist || 'Unknown artist'}
                      </div>
                    </div>
                  </div>

                  {/* Controls & Progress - Center */}
                  <div className="flex-1 flex flex-col space-y-3">
                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-3">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-600 hover:text-gray-800"
                        onClick={skipToPrevious}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-full"
                        onClick={togglePlayPause}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-600 hover:text-gray-800"
                        onClick={skipToNext}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 w-10 text-right">{musicCurrentTime}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 cursor-pointer">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-left">{currentTrack?.duration || '0:00'}</span>
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center space-x-2 flex-shrink-0" style={{ width: '120px' }}>
                    <Volume2 className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}

            {/* Resize Handle */}
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => musicPlayerResize.handleResizeMouseDown(e, 'se')}
            >
              <div className="absolute bottom-1 right-1 w-3 h-3">
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="absolute bottom-0 right-1.5 w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="absolute bottom-1.5 right-0 w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MusicBrowser Component */}
      <MusicBrowser 
        isOpen={showMusicBrowser}
        onClose={() => setShowMusicBrowser(false)}
        onPlayTrack={handlePlayTrack}
        onTogglePlayPause={togglePlayPause}
        isPlaying={isPlaying}
        currentTrack={currentTrack}
      />

      {/* StudyRooms Component */}
      {showStudyRooms && (
        <div className="fixed inset-0 z-50 bg-white">
          <StudyRooms 
            onJoinRoom={handleJoinRoom}
          />
          {/* Close button for StudyRooms */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowStudyRooms(false)}
            className="fixed top-4 right-4 z-50 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white"
          >
            <X className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
      )}
      {/* Background Controls Panel - Draggable & Resizable */}
      {showBackgroundControls && (
        <div 
          className="fixed z-30 select-none"
          style={{
            right: `calc(24px - ${backgroundControlsPos.x}px)`,
            bottom: `calc(80px - ${backgroundControlsPos.y}px)`,
            width: `${backgroundControlsSize.width}px`,
            minWidth: '200px',
            maxWidth: '400px'
          }}
        >
          <Card className="bg-white/95 backdrop-blur-[30px] border border-white/50 relative overflow-hidden">
            {/* Drag Handle & Controls */}
            <div 
              className="flex items-center justify-between p-2 border-b border-white/30 cursor-move hover:bg-white/10 transition-colors"
              onMouseDown={backgroundControlsDrag.handleMouseDown}
            >
              <div className="flex items-center space-x-2">
                <Move className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Background Controls</span>
              </div>
              <div className="flex items-center space-x-1 no-drag">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsMinimized(prev => ({ ...prev, backgroundControls: !prev.backgroundControls }))}
                >
                  {isMinimized.backgroundControls ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowBackgroundControls(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Background Controls Content */}
            {!isMinimized.backgroundControls && (
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Blur</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={backgroundBlur}
                      onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{backgroundBlur}px</span>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Brightness</label>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      value={backgroundBrightness}
                      onChange={(e) => setBackgroundBrightness(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">{backgroundBrightness}%</span>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Fit</label>
                    <select
                      value={backgroundFit}
                      onChange={(e) => setBackgroundFit(e.target.value)}
                      className="w-full bg-white/80 border border-white/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="fill">Fill</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            )}

            {/* Resize Handle */}
            <div 
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => backgroundControlsResize.handleResizeMouseDown(e, 'se')}
            >
              <div className="absolute bottom-1 right-1 w-3 h-3">
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="absolute bottom-0 right-1.5 w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="absolute bottom-1.5 right-0 w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Hidden file input for background */}
      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundChange}
        className="hidden"
      />

      {/* Learning Session Indicator - hiển thị ở góc phải trên */}
      <LearningSessionIndicator 
        position="top-right" 
        showAlways={false}
        autoExtend={false}
      />
    </div>
  )
}