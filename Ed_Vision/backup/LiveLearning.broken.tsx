import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/student/Student_button"
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
                    className="text-white/80 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300"
                  >
                    <StickyNote className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-300 whitespace-nowrap">
                    Notes
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
                        {currentTrack.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {currentTrack.artist}
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
                      <span className="text-xs text-gray-500 w-10 text-right">{formatTime(currentTimeSeconds)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 cursor-pointer">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-left">{formatTime(durationSeconds)}</span>
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

      {/* Music Browser Modal - Combined Style */}
      <Dialog open={showMusicBrowser} onOpenChange={setShowMusicBrowser}>
        <DialogContent className="w-[1600px] max-w-[95vw] max-h-[80vh] p-0 rounded-2xl overflow-hidden">
          <div className="flex h-[80vh] bg-[rgba(10,10,10,0.35)] backdrop-blur-lg">
            {/* Sidebar */}
            <div className="w-72 bg-[rgba(255,255,255,0.04)] backdrop-blur-xl border-r border-white/8 p-5 space-y-4">
              <div className="space-y-2">
                {/** Sidebar buttons with glassy active state */}
                <button
                  onClick={() => setCurrentView('home')}
                  className={`flex items-center w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 justify-start ${currentView === 'home' ? 'bg-gradient-to-r from-purple-500/80 via-pink-500/70 to-indigo-500/60 text-white shadow-lg' : 'text-white/80 hover:bg-white/5'}`}
                >
                  <Home className="w-4 h-4 mr-3" />
                  Discover
                </button>
                <button
                  onClick={() => setCurrentView('library')}
                  className={`flex items-center w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 justify-start ${currentView === 'library' ? 'bg-gradient-to-r from-purple-500/80 via-pink-500/70 to-indigo-500/60 text-white shadow-lg' : 'text-white/80 hover:bg-white/5'}`}
                >
                  <Library className="w-4 h-4 mr-3" />
                  Your Library
                </button>
                <button
                  onClick={() => setCurrentView('create')}
                  className="flex items-center w-full rounded-2xl px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/5 justify-start"
                >
                  <PlusCircle className="w-4 h-4 mr-3" />
                  Create Playlist
                </button>
                <button
                  onClick={() => setCurrentView('liked')}
                  className={`flex items-center w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 justify-start ${currentView === 'liked' ? 'bg-gradient-to-r from-purple-500/80 via-pink-500/70 to-indigo-500/60 text-white shadow-lg' : 'text-white/80 hover:bg-white/5'}`}
                >
                  <Heart className="w-4 h-4 mr-3" />
                  Liked
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {currentView !== 'home' && (
                      <button
                        onClick={() => setCurrentView('home')}
                        className="p-2 rounded-full bg-white/5 text-white/90 hover:bg-white/10"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    <h1 className="text-2xl font-semibold text-white">{currentView === 'home' ? 'Discover Music' : currentView === 'library' ? 'Your Library' : currentView === 'liked' ? 'Liked Songs' : 'Create Playlist'}</h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                      <input
                        type="text"
                        placeholder="Search music..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[rgba(255,255,255,0.04)] border border-white/6 rounded-full pl-10 pr-4 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-[rgba(139,92,246,0.16)] w-72"
                      />
                    </div>
                    <button
                      onClick={() => setShowMusicBrowser(false)}
                      className="p-2 rounded-full bg-white/5 text-white/90 hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 overflow-y-auto text-white">
                {currentView === 'home' && (
                  <div className="space-y-8">
                    {/* Featured Section */}
                    <div className="rounded-2xl p-6 bg-gradient-to-r from-[rgba(139,92,246,0.12)] via-[rgba(236,72,153,0.08)] to-[rgba(59,130,246,0.06)] border border-white/6 shadow-lg">
                      <h2 className="text-xl font-semibold mb-4">Featured Mix</h2>
                      <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899,#60a5fa)' }}>
                          <Music className="w-8 h-8 text-white/95" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg">Focus & Study Mix</h3>
                          <p className="text-white/70 text-sm">Curated tracks to keep you focused and calm while studying.</p>
                          <div className="mt-4">
                            <button onClick={togglePlayPause} className="inline-flex items-center rounded-full px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md hover:brightness-105 transition">
                              <Play className="w-4 h-4 mr-2" />
                              Play Mix
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Albums Grid */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Popular Albums</h2>
                        <button className="text-white/80 hover:text-white px-3 py-1 rounded-full bg-white/3">See all</button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[
                          { title: 'Lofi Hip Hop', artist: 'ChillHop Music', tracks: 24 },
                          { title: 'Nature Sounds', artist: 'Ambient World', tracks: 18 },
                          { title: 'Classical Focus', artist: 'Various Artists', tracks: 32 },
                          { title: 'Jazz Study', artist: 'Smooth Jazz Collective', tracks: 28 },
                          { title: 'Electronic Beats', artist: 'Synth Masters', tracks: 20 },
                          { title: 'Acoustic Guitar', artist: 'String Harmony', tracks: 16 }
                        ].map((album, index) => (
                          <div key={index} className="rounded-2xl overflow-hidden group cursor-pointer shadow-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div className="p-4">
                              <div className="relative w-full h-36 rounded-lg mb-4 overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(139,92,246,0.9), rgba(236,72,153,0.9))` }}>
                                <div className="absolute inset-0 opacity-60" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899,#60a5fa)' }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Music className="w-10 h-10 text-white/95" />
                                </div>
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-10 transition" />
                              </div>
                              <h3 className="font-medium text-white text-sm truncate mb-1">{album.title}</h3>
                              <p className="text-white/70 text-xs truncate">{album.artist}</p>
                              <p className="text-white/60 text-xs">{album.tracks} tracks</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recently Played */}
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Recently Played</h2>
                      <div className="space-y-3">
                        {[
                          { title: 'Peaceful Piano', artist: 'Ambient Collective', duration: '4:32' },
                          { title: 'Forest Rain', artist: 'Nature Sounds', duration: '8:15' },
                          { title: 'Study Vibes', artist: 'Lofi Masters', duration: '3:48' },
                          { title: 'Ocean Waves', artist: 'Relaxation Hub', duration: '6:22' }
                        ].map((track, index) => (
                          <div key={index} className="flex items-center space-x-4 p-3 rounded-2xl bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)' }}>
                              <Music className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-white text-sm">{track.title}</h4>
                              <p className="text-white/70 text-xs">{track.artist}</p>
                            </div>
                            <span className="text-white/60 text-xs mr-2">{track.duration}</span>
                            <button onClick={togglePlayPause} className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}