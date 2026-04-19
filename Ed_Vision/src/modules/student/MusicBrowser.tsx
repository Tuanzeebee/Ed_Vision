import React, { useState, useRef } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Home, 
  Library, 
  PlusCircle, 
  Heart, 
  ArrowLeft, 
  X, 
  Play, 
  Download, 
  Plus, 
  Shuffle, 
  Music,
  FolderOpen,
  Upload,
  SkipBack,
  Pause,
  SkipForward,
  RotateCcw,
  Image
} from "lucide-react"
import { VinylSleeveImage } from './components/MusicImage'

interface Track {
  id: string
  title: string
  artist: string
  duration: string
  cover?: string
}

interface Album {
  id: string
  title: string
  artist: string
  cover: string
  meta: string
  tracks: Track[]
}

interface Playlist {
  id: string
  name: string
  description?: string
  cover?: string
  tracks: Track[]
  createdAt: Date
}

type Props = {
  isOpen: boolean
  onClose: () => void
  onPlayTrack?: (track: Track) => void
  onTogglePlayPause?: () => void
  isPlaying?: boolean
  currentTrack?: Track | null
}

export default function MusicBrowser({ 
  isOpen, 
  onClose, 
  onPlayTrack, 
  onTogglePlayPause,
  isPlaying = false,
  currentTrack = null
}: Props) {
  const [currentView, setCurrentView] = useState<'home' | 'album' | 'library' | 'liked'>('home')
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [likedSongsSearch, setLikedSongsSearch] = useState('')
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())
  
  // Create playlist form states
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [playlistCover, setPlaylistCover] = useState<string | null>(null)
  const [nameError, setNameError] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sample album data with comprehensive tracks
  const albumData: Record<string, Album> = {
    'lofi-beats': {
      id: 'lofi-beats',
      title: 'Lo-Fi Beats',
      artist: 'Chill Hop',
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
      meta: '2023 • 12 tracks • 38 min',
      tracks: [
        { id: 'lofi-1', title: 'Midnight Study', artist: 'Chill Hop', duration: '3:24' },
        { id: 'lofi-2', title: 'Coffee Shop Vibes', artist: 'Chill Hop', duration: '4:12' },
        { id: 'lofi-3', title: 'Rainy Day Focus', artist: 'Chill Hop', duration: '3:45' },
        { id: 'lofi-4', title: 'Lazy Sunday', artist: 'Chill Hop', duration: '4:08' },
        { id: 'lofi-5', title: 'Study Hall', artist: 'Chill Hop', duration: '3:32' },
        { id: 'lofi-6', title: 'Night Owl', artist: 'Chill Hop', duration: '3:58' },
        { id: 'lofi-7', title: 'Paper Planes', artist: 'Chill Hop', duration: '4:22' },
        { id: 'lofi-8', title: 'Warm Tea', artist: 'Chill Hop', duration: '3:15' },
        { id: 'lofi-9', title: 'Library Silence', artist: 'Chill Hop', duration: '4:45' },
        { id: 'lofi-10', title: 'Dawn Light', artist: 'Chill Hop', duration: '3:38' },
        { id: 'lofi-11', title: 'Focus Flow', artist: 'Chill Hop', duration: '4:02' },
        { id: 'lofi-12', title: 'Peaceful Mind', artist: 'Chill Hop', duration: '3:28' }
      ]
    },
    'study-jazz': {
      id: 'study-jazz',
      title: 'Study Jazz',
      artist: 'Jazz Collective',
      cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop',
      meta: '2023 • 15 tracks • 52 min',
      tracks: [
        { id: 'jazz-1', title: 'Smooth Study', artist: 'Jazz Collective', duration: '4:18' },
        { id: 'jazz-2', title: 'Piano Reflections', artist: 'Jazz Collective', duration: '3:56' },
        { id: 'jazz-3', title: 'Mellow Saxophone', artist: 'Jazz Collective', duration: '4:42' },
        { id: 'jazz-4', title: 'Evening Blues', artist: 'Jazz Collective', duration: '3:24' },
        { id: 'jazz-5', title: 'Soft Trumpet', artist: 'Jazz Collective', duration: '4:15' },
        { id: 'jazz-6', title: 'Coffee House', artist: 'Jazz Collective', duration: '3:38' },
        { id: 'jazz-7', title: 'Late Night Study', artist: 'Jazz Collective', duration: '4:52' },
        { id: 'jazz-8', title: 'Vintage Vibes', artist: 'Jazz Collective', duration: '3:29' },
        { id: 'jazz-9', title: 'Quiet Storm', artist: 'Jazz Collective', duration: '4:06' },
        { id: 'jazz-10', title: 'City Lights', artist: 'Jazz Collective', duration: '3:44' },
        { id: 'jazz-11', title: 'Midnight Jazz', artist: 'Jazz Collective', duration: '4:28' },
        { id: 'jazz-12', title: 'Contemplation', artist: 'Jazz Collective', duration: '3:51' },
        { id: 'jazz-13', title: 'Sunday Morning', artist: 'Jazz Collective', duration: '4:17' },
        { id: 'jazz-14', title: 'Peaceful Evening', artist: 'Jazz Collective', duration: '3:33' },
        { id: 'jazz-15', title: 'Relaxed State', artist: 'Jazz Collective', duration: '4:09' }
      ]
    },
    'focus-flow': {
      id: 'focus-flow',
      title: 'Focus Flow',
      artist: 'Ambient Sounds',
      cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
      meta: '2023 • 10 tracks • 42 min',
      tracks: [
        { id: 'focus-1', title: 'Deep Concentration', artist: 'Ambient Sounds', duration: '4:32' },
        { id: 'focus-2', title: 'Mind Clarity', artist: 'Ambient Sounds', duration: '3:58' },
        { id: 'focus-3', title: 'Pure Focus', artist: 'Ambient Sounds', duration: '4:15' },
        { id: 'focus-4', title: 'Mental Flow', artist: 'Ambient Sounds', duration: '4:48' },
        { id: 'focus-5', title: 'Cognitive Enhancement', artist: 'Ambient Sounds', duration: '3:42' },
        { id: 'focus-6', title: 'Brain Waves', artist: 'Ambient Sounds', duration: '4:22' },
        { id: 'focus-7', title: 'Study Zone', artist: 'Ambient Sounds', duration: '4:05' },
        { id: 'focus-8', title: 'Productivity Mode', artist: 'Ambient Sounds', duration: '3:36' },
        { id: 'focus-9', title: 'Learning State', artist: 'Ambient Sounds', duration: '4:18' },
        { id: 'focus-10', title: 'Deep Work', artist: 'Ambient Sounds', duration: '4:52' }
      ]
    },
    'deep-work': {
      id: 'deep-work',
      title: 'Deep Work',
      artist: 'Productivity Mix',
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
      meta: '2023 • 8 tracks • 35 min',
      tracks: [
        { id: 'deep-1', title: 'Intense Focus', artist: 'Productivity Mix', duration: '4:45' },
        { id: 'deep-2', title: 'Concentrated Effort', artist: 'Productivity Mix', duration: '4:28' },
        { id: 'deep-3', title: 'Laser Focus', artist: 'Productivity Mix', duration: '4:12' },
        { id: 'deep-4', title: 'Peak Performance', artist: 'Productivity Mix', duration: '4:38' },
        { id: 'deep-5', title: 'Ultimate Concentration', artist: 'Productivity Mix', duration: '4:55' },
        { id: 'deep-6', title: 'Maximum Productivity', artist: 'Productivity Mix', duration: '4:02' },
        { id: 'deep-7', title: 'Flow State', artist: 'Productivity Mix', duration: '4:25' },
        { id: 'deep-8', title: 'Hyper Focus', artist: 'Productivity Mix', duration: '4:15' }
      ]
    },
    'calm-piano': {
      id: 'calm-piano',
      title: 'Calm Piano',
      artist: 'Classical Focus',
      cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop',
      meta: '2023 • 12 tracks • 45 min',
      tracks: [
        { id: 'piano-1', title: 'Gentle Keys', artist: 'Classical Focus', duration: '3:48' },
        { id: 'piano-2', title: 'Soft Melody', artist: 'Classical Focus', duration: '4:12' },
        { id: 'piano-3', title: 'Peaceful Harmony', artist: 'Classical Focus', duration: '3:55' },
        { id: 'piano-4', title: 'Quiet Reflection', artist: 'Classical Focus', duration: '4:22' },
        { id: 'piano-5', title: 'Serene Thoughts', artist: 'Classical Focus', duration: '3:38' },
        { id: 'piano-6', title: 'Tranquil Moments', artist: 'Classical Focus', duration: '4:05' },
        { id: 'piano-7', title: 'Calm Waters', artist: 'Classical Focus', duration: '3:42' },
        { id: 'piano-8', title: 'Silent Contemplation', artist: 'Classical Focus', duration: '4:28' },
        { id: 'piano-9', title: 'Mindful Meditation', artist: 'Classical Focus', duration: '3:51' },
        { id: 'piano-10', title: 'Inner Peace', artist: 'Classical Focus', duration: '4:16' },
        { id: 'piano-11', title: 'Gentle Breeze', artist: 'Classical Focus', duration: '3:34' },
        { id: 'piano-12', title: 'Restful Mind', artist: 'Classical Focus', duration: '4:08' }
      ]
    },
    'nature-sounds': {
      id: 'nature-sounds',
      title: 'Nature Sounds',
      artist: 'Relaxation',
      cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
      meta: '2023 • 9 tracks • 38 min',
      tracks: [
        { id: 'nature-1', title: 'Forest Rain', artist: 'Relaxation', duration: '4:32' },
        { id: 'nature-2', title: 'Ocean Waves', artist: 'Relaxation', duration: '4:18' },
        { id: 'nature-3', title: 'Bird Songs', artist: 'Relaxation', duration: '3:45' },
        { id: 'nature-4', title: 'Flowing Stream', artist: 'Relaxation', duration: '4:55' },
        { id: 'nature-5', title: 'Wind Through Trees', artist: 'Relaxation', duration: '4:12' },
        { id: 'nature-6', title: 'Thunderstorm', artist: 'Relaxation', duration: '4:38' },
        { id: 'nature-7', title: 'Mountain Breeze', artist: 'Relaxation', duration: '3:52' },
        { id: 'nature-8', title: 'Peaceful Lake', artist: 'Relaxation', duration: '4:25' },
        { id: 'nature-9', title: 'Sunrise Sounds', artist: 'Relaxation', duration: '4:08' }
      ]
    },
    'synthwave': {
      id: 'synthwave',
      title: 'Synthwave',
      artist: 'Electronic',
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
      meta: '2023 • 11 tracks • 44 min',
      tracks: [
        { id: 'synth-1', title: 'Neon Dreams', artist: 'Electronic', duration: '4:15' },
        { id: 'synth-2', title: 'Retro Future', artist: 'Electronic', duration: '3:58' },
        { id: 'synth-3', title: 'Digital Horizon', artist: 'Electronic', duration: '4:32' },
        { id: 'synth-4', title: 'Cyber Focus', artist: 'Electronic', duration: '4:08' },
        { id: 'synth-5', title: 'Electric Study', artist: 'Electronic', duration: '3:42' },
        { id: 'synth-6', title: 'Synthetic Calm', artist: 'Electronic', duration: '4:25' },
        { id: 'synth-7', title: 'Code Flow', artist: 'Electronic', duration: '4:18' },
        { id: 'synth-8', title: 'Programming Zone', artist: 'Electronic', duration: '3:56' },
        { id: 'synth-9', title: 'Digital Mindset', artist: 'Electronic', duration: '4:42' },
        { id: 'synth-10', title: 'Tech Meditation', artist: 'Electronic', duration: '4:05' },
        { id: 'synth-11', title: 'Virtual Reality', artist: 'Electronic', duration: '4:28' }
      ]
    },
    'acoustic': {
      id: 'acoustic',
      title: 'Acoustic',
      artist: 'Indie Folk',
      cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop',
      meta: '2023 • 10 tracks • 41 min',
      tracks: [
        { id: 'acoustic-1', title: 'Wooden Strings', artist: 'Indie Folk', duration: '4:12' },
        { id: 'acoustic-2', title: 'Campfire Stories', artist: 'Indie Folk', duration: '3:48' },
        { id: 'acoustic-3', title: 'Morning Light', artist: 'Indie Folk', duration: '4:25' },
        { id: 'acoustic-4', title: 'Folk Memories', artist: 'Indie Folk', duration: '3:58' },
        { id: 'acoustic-5', title: 'Simple Melody', artist: 'Indie Folk', duration: '4:38' },
        { id: 'acoustic-6', title: 'Country Road', artist: 'Indie Folk', duration: '4:05' },
        { id: 'acoustic-7', title: 'Sunset Guitar', artist: 'Indie Folk', duration: '3:42' },
        { id: 'acoustic-8', title: 'Gentle Strum', artist: 'Indie Folk', duration: '4:22' },
        { id: 'acoustic-9', title: 'Organic Sound', artist: 'Indie Folk', duration: '4:15' },
        { id: 'acoustic-10', title: 'Natural Harmony', artist: 'Indie Folk', duration: '3:52' }
      ]
    }
  }

  const albums = [
    { id: 'lofi-beats', title: 'Lo-Fi Beats', artist: 'Chill Hop', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop' },
    { id: 'study-jazz', title: 'Study Jazz', artist: 'Jazz Collective', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&h=150&fit=crop' },
    { id: 'focus-flow', title: 'Focus Flow', artist: 'Ambient Sounds', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop' },
    { id: 'deep-work', title: 'Deep Work', artist: 'Productivity Mix', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop' },
    { id: 'calm-piano', title: 'Calm Piano', artist: 'Classical Focus', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&h=150&fit=crop' }
  ]

  const recentlyPlayed = [
    { id: 'nature-sounds', title: 'Nature Sounds', artist: 'Relaxation', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop' },
    { id: 'synthwave', title: 'Synthwave', artist: 'Electronic', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop' },
    { id: 'acoustic', title: 'Acoustic', artist: 'Indie Folk', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&h=150&fit=crop' }
  ]

  const handleAlbumClick = (albumId: string) => {
    const album = albumData[albumId]
    if (album) {
      setSelectedAlbum(album)
      setCurrentView('album')
    }
  }

  const handleTrackClick = (track: Track) => {
    onPlayTrack?.(track)
  }

  const handleLikeToggle = (trackId: string) => {
    setLikedTracks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(trackId)) {
        newSet.delete(trackId)
      } else {
        newSet.add(trackId)
      }
      return newSet
    })
  }

  const validatePlaylistName = () => {
    if (playlistName.trim() === '') {
      setNameError(true)
      return false
    }
    setNameError(false)
    return true
  }

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePlaylistName()) return

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: playlistName.trim(),
      description: playlistDescription.trim(),
      cover: playlistCover || undefined,
      tracks: [],
      createdAt: new Date()
    }

    setPlaylists(prev => [...prev, newPlaylist])
    setShowCreatePlaylist(false)
    setPlaylistName('')
    setPlaylistDescription('')
    setPlaylistCover(null)
    setNameError(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPlaylistCover(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const renderTrackList = (tracks: Track[]) => {
    return (
      <div className="space-y-2">
        {tracks.map((track, index) => (
          <div 
            key={track.id} 
            className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-white/20 transition-colors cursor-pointer ${
              currentTrack?.id === track.id ? 'bg-white/20' : ''
            }`}
            onClick={() => handleTrackClick(track)}
          >
            <div className="w-8 text-center">
              {currentTrack?.id === track.id ? (
                <Play className="h-4 w-4 text-purple-500" />
              ) : (
                <span className="text-gray-400">{index + 1}</span>
              )}
            </div>
            <img 
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=40&h=40&fit=crop" 
              alt="Track" 
              className="w-10 h-10 rounded object-cover" 
            />
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{track.title}</h4>
              <p className="text-gray-600 text-sm">{track.artist}</p>
            </div>
            <div className="text-gray-500 text-sm">{track.duration}</div>
            <Button
              size="sm"
              variant="ghost"
              className={`${likedTracks.has(track.id) ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
              onClick={(e) => {
                e.stopPropagation()
                handleLikeToggle(track.id)
              }}
            >
              <Heart className={`h-4 w-4 ${likedTracks.has(track.id) ? 'fill-current' : ''}`} />
            </Button>
          </div>
        ))}
      </div>
    )
  }

  const getViewTitle = () => {
    switch (currentView) {
      case 'home': return 'Music Browser'
      case 'album': return selectedAlbum?.title || 'Album'
      case 'library': return 'Your Library'
      case 'liked': return 'Liked Songs'
      default: return 'Music Browser'
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 backdrop-blur-[30px] border border-white/50 w-screen h-screen max-w-none max-h-none p-0 rounded-none overflow-hidden">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-white/60 backdrop-blur-[20px] border-r border-white/30 p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 bg-white/70 border border-white/40 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Search music..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <nav className="space-y-2">
              <button
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                  currentView === 'home' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'text-gray-700 hover:bg-white/50'
                }`}
                onClick={() => setCurrentView('home')}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
              <button
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                  currentView === 'library' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'text-gray-700 hover:bg-white/50'
                }`}
                onClick={() => setCurrentView('library')}
              >
                <Library className="h-5 w-5" />
                <span>Your Library</span>
              </button>
              <button
                className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-700 hover:bg-white/50 transition-colors"
                onClick={() => setShowCreatePlaylist(true)}
              >
                <PlusCircle className="h-5 w-5" />
                <span>Create Playlist</span>
              </button>
              <button
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors ${
                  currentView === 'liked' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'text-gray-700 hover:bg-white/50'
                }`}
                onClick={() => setCurrentView('liked')}
              >
                <Heart className="h-5 w-5" />
                <span>Liked Songs</span>
                <div className="ml-auto text-red-500"></div>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/30 bg-gradient-to-r from-white/80 to-white/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {currentView !== 'home' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setCurrentView('home')}
                      className="rounded-full hover:bg-white/50"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <h2 className="text-2xl font-bold text-gray-800">{getViewTitle()}</h2>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onClose}
                  className="rounded-full hover:bg-white/50"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentView === 'home' && (
                <div className="space-y-8">
                  {/* Hero Banner */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-white/30">
                    <div className="flex items-center space-x-6">
                      <div className="flex-1">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">NECTAR</h1>
                        <p className="text-xl text-gray-600 mb-2">Joji</p>
                        <p className="text-sm text-gray-500 mb-6">2020 • 18 tracks • 53 min</p>
                        <div className="flex items-center space-x-4">
                          <Button 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-8 py-3 hover:from-purple-600 hover:to-pink-600"
                            onClick={onTogglePlayPause}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            PLAY
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full">
                            <Download className="h-5 w-5 text-gray-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full">
                            <Plus className="h-5 w-5 text-gray-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full">
                            <Shuffle className="h-5 w-5 text-gray-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="w-48 h-48">
                        <img 
                          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" 
                          alt="Album Cover" 
                          className="w-full h-full object-cover rounded-xl shadow-lg" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* My Favorites */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">My Favorites</h3>
                      <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
                        SEE ALL
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {albums.map((album) => (
                        <div 
                          key={album.id}
                          className="cursor-pointer"
                          onClick={() => handleAlbumClick(album.id)}
                        >
                          <Card className="bg-white/70 hover:bg-white/80 transition-all duration-200 rounded-xl overflow-hidden group">
                            <CardContent className="p-4">
                              <div className="relative w-full h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-3 overflow-hidden">
                                <img 
                                  src={album.cover} 
                                  alt={album.title} 
                                  className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <Play className="w-6 h-6 text-white ml-0.5" />
                                  </div>
                                </div>
                              </div>
                              <h4 className="font-medium text-gray-800 text-sm truncate mb-1">{album.title}</h4>
                              <p className="text-gray-600 text-xs truncate">{album.artist}</p>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recently Played */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Recently Played</h3>
                      <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
                        SEE ALL
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {recentlyPlayed.map((album) => (
                        <div 
                          key={album.id}
                          className="cursor-pointer"
                          onClick={() => handleAlbumClick(album.id)}
                        >
                          <Card className="bg-white/70 hover:bg-white/80 transition-all duration-200 rounded-xl overflow-hidden group"
                          >
                          <CardContent className="p-4">
                            <div className="relative w-full h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-3 overflow-hidden">
                              <img 
                                src={album.cover} 
                                alt={album.title} 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <Play className="w-6 h-6 text-white ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <h4 className="font-medium text-gray-800 text-sm truncate mb-1">{album.title}</h4>
                            <p className="text-gray-600 text-xs truncate">{album.artist}</p>
                          </CardContent>
                        </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentView === 'album' && selectedAlbum && (
                <div className="space-y-8">
                  {/* Album Hero Banner */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-white/30">
                    <div className="flex items-center space-x-6">
                      <div className="flex-1">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">{selectedAlbum.title}</h1>
                        <p className="text-xl text-gray-600 mb-2">{selectedAlbum.artist}</p>
                        <p className="text-sm text-gray-500 mb-6">{selectedAlbum.meta}</p>
                        <div className="flex items-center space-x-4">
                          <Button 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-8 py-3 hover:from-purple-600 hover:to-pink-600"
                            onClick={onTogglePlayPause}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            PLAY
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full">
                            <Download className="h-5 w-5 text-gray-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full">
                            <Plus className="h-5 w-5 text-gray-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-full">
                            <Shuffle className="h-5 w-5 text-gray-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="w-48 h-48">
                        <img 
                          src={selectedAlbum.cover} 
                          alt="Album Cover" 
                          className="w-full h-full object-cover rounded-xl shadow-lg" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Track List */}
                  {renderTrackList(selectedAlbum.tracks)}
                </div>
              )}

              {currentView === 'library' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Library</h3>
                    <div className="flex items-center justify-between mb-4">
                      <select className="px-3 py-2 bg-white/70 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="recent">Recently Added</option>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="mostPlayed">Most Played</option>
                      </select>
                      <Button 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600"
                        onClick={() => setShowCreatePlaylist(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Playlist
                      </Button>
                    </div>
                  </div>
                  
                  {playlists.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="w-12 h-12 text-gray-400" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-600 mb-2">No items yet</h4>
                      <p className="text-gray-500 mb-6">Start building your music library by creating playlists or importing music.</p>
                      <div className="flex justify-center space-x-4">
                        <Button 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600"
                          onClick={() => setShowCreatePlaylist(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Playlist
                        </Button>
                        <Button variant="outline" className="px-6 py-3 rounded-lg">
                          <Upload className="w-4 h-4 mr-2 text-gray-600" />
                          Import Music
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {playlists.map((playlist) => (
                        <Card key={playlist.id} className="bg-white/70 hover:bg-white/80 transition-all duration-200 cursor-pointer rounded-xl overflow-hidden">
                          <CardContent className="p-4">
                            <div className="w-full h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg mb-3 flex items-center justify-center">
                              {playlist.cover ? (
                                <img src={playlist.cover} alt={playlist.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <Music className="w-8 h-8 text-white" />
                              )}
                            </div>
                            <h4 className="font-medium text-gray-800 text-sm truncate mb-1">{playlist.name}</h4>
                            <p className="text-gray-600 text-xs truncate">{playlist.tracks.length} tracks</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentView === 'liked' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Liked Songs</h3>
                    <div className="relative mb-4">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2 bg-white/70 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Search liked songs..."
                        value={likedSongsSearch}
                        onChange={(e) => setLikedSongsSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {likedTracks.size === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-12 h-12 text-white" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-600 mb-2">No liked songs yet</h4>
                      <p className="text-gray-500 mb-6">Songs you like will appear here</p>
                      <Button 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        onClick={() => setCurrentView('home')}
                      >
                        Find Music
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Render liked tracks */}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Now Playing Bar */}
            {currentTrack && (
              <div className="border-t border-white/20 p-4 flex items-center justify-between bg-white/60 backdrop-blur-[20px]">
                <div className="flex items-center space-x-4 flex-1">
                  <VinylSleeveImage
                    src={currentTrack.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop'}
                    alt="Now Playing"
                    className="w-12 h-12"
                    showShadow={false}
                  />
                  <div>
                    <h4 className="font-medium text-gray-800">{currentTrack.title}</h4>
                    <p className="text-gray-600 text-sm">{currentTrack.artist}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <SkipBack className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button 
                    size="icon" 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600"
                    onClick={onTogglePlayPause}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <SkipForward className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <RotateCcw className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 flex-1 justify-end">
                  <span className="text-sm text-gray-500">2:15</span>
                  <div className="w-24 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full" style={{ width: '48%' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">4:32</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Create Playlist Modal */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className="bg-white/95 backdrop-blur-[30px] border border-white/50 max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Create Playlist</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCreatePlaylist(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleCreatePlaylist} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Playlist Name *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 bg-white/70 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  nameError ? 'border-red-500' : 'border-white/40'
                }`}
                placeholder="Enter playlist name"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                required
              />
              {nameError && (
                <div className="text-red-500 text-sm mt-1">Playlist name is required</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (Optional)</label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {playlistCover ? (
                  <img src={playlistCover} alt="Cover preview" className="w-24 h-24 object-cover rounded-lg mx-auto" />
                ) : (
                  <div>
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload cover image</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-lg text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe your playlist..."
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowCreatePlaylist(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                Create Playlist
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}