/**
 * MusicPanel - Music Player with YouTube Search and hardcoded demo data
 * Uses YouTube IFrame Player API for legal audio playback via MusicPlayerContext
 * Supports both local (hardcoded) search and YouTube API search
 */

import { useState, useCallback, useEffect } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import { useMusicPlayer } from '../music/MusicPlayerContext';
import { searchTracks as searchYouTube } from '../services/youtubeService';
import type { YouTubeTrack } from '../types/youtubeTypes';
import AnimatedList from './AnimatedList';
import {
  TRACKS,
  ALBUMS,
  PLAYLISTS,
  ARTISTS,
  PODCAST_SHOWS,
  MUSIC_TAGS,
  searchAll,
  type Track,
  type Album,
} from '../music/mockData';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function MusicPanel({
  visible,
  onClose,
  initialX = (window.innerWidth - 1200) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 1200,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 1000, 600);
  
  // Use shared music player context
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isBuffering,
    recentlyPlayed,
    likedTracks,
    playTrack: contextPlayTrack,
    pause,
    resume,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    toggleLike,
    isLiked,
  } = useMusicPlayer();
  
  // View state
  const [currentView, setCurrentView] = useState<'home' | 'albums' | 'discover' | 'podcasts' | 'search'>('home');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Tags & Search
  const [selectedTags, setSelectedTags] = useState<string[]>(['Lofi', 'Jazz', 'Study', 'Chill']);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ tracks: Track[]; albums: Album[] }>({ tracks: [], albums: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'local' | 'youtube'>('youtube'); // Default to YouTube search
  const [youtubeSearchResults, setYoutubeSearchResults] = useState<YouTubeTrack[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Song Detail Modal
  const [showSongDetail, setShowSongDetail] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Track | null>(null);
  
  // Liked Songs List Modal
  const [showLikedSongsList, setShowLikedSongsList] = useState(false);

  // Lyrics data with timestamps
  const lyrics = [
    { time: 0, text: "In the silence of the night" },
    { time: 15, text: "I hear your voice calling out to me" },
    { time: 30, text: "Through the darkness and the light" },
    { time: 45, text: "You're the only one I see" },
    { time: 60, text: "But I can't follow to meet you" },
    { time: 75, text: "You are far away out, out on the other side" },
    { time: 90, text: "When the stars begin to fade" },
    { time: 105, text: "And the morning breaks the sky" },
    { time: 120, text: "I'll be waiting for the day" },
    { time: 135, text: "When our worlds collide" },
    { time: 150, text: "Can you feel my heartbeat" },
    { time: 165, text: "Racing through the endless time" },
    { time: 180, text: "Every moment incomplete" },
    { time: 195, text: "Until you're finally mine" },
    { time: 210, text: "Forever in my dreams" },
    { time: 225, text: "You'll always be the one" },
  ];

  // Get current and next lyrics based on current time
  const getCurrentLyrics = useCallback(() => {
    let currentIndex = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        currentIndex = i;
      } else {
        break;
      }
    }
    
    const current = lyrics[currentIndex];
    const next = lyrics[currentIndex + 1];
    
    return { current, next };
  }, [currentTime]);

  // Handle progress circle click/drag for circular design
  const handleProgressCircleInteraction = useCallback((e: React.MouseEvent<SVGCircleElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const updateProgress = (clientX: number, clientY: number) => {
      const angle = Math.atan2(clientY - centerY, clientX - centerX);
      let percentage = (angle + Math.PI / 2) / (2 * Math.PI);
      if (percentage < 0) percentage += 1;
      
      const newTime = Math.round(percentage * duration);
      seekTo(Math.max(0, Math.min(duration, newTime)));
    };

    updateProgress(e.clientX, e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateProgress(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [duration, seekTo]);

  // Debounce search for YouTube API
  useEffect(() => {
    if (searchMode !== 'youtube' || !searchQuery.trim()) {
      setYoutubeSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const response = await searchYouTube(searchQuery, undefined, 15);
        setYoutubeSearchResults(response.tracks);
      } catch (error) {
        console.error('YouTube search error:', error);
        setSearchError('Search failed. Using local results.');
        // Fallback to local search
        const localResults = searchAll(searchQuery);
        setSearchResults({ tracks: localResults.tracks, albums: localResults.albums });
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchMode]);

  // Convert YouTubeTrack to local Track format for playback
  const convertYouTubeTrackToTrack = useCallback((ytTrack: YouTubeTrack): Track => {
    return {
      id: ytTrack.id,
      title: ytTrack.title,
      artist: ytTrack.artist,
      album: ytTrack.album,
      thumbnail: ytTrack.imageUrl || `https://i.ytimg.com/vi/${ytTrack.id}/hqdefault.jpg`,
      duration: ytTrack.duration,
    };
  }, []);

  // Play track wrapper (convert local Track to context Track)
  const playTrack = useCallback((track: Track) => {
    contextPlayTrack(track);
  }, [contextPlayTrack]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (currentTrack) {
      resume();
    }
  }, [isPlaying, currentTrack, pause, resume]);

  // Volume change handler
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
  }, [setVolume]);

  // Play next/previous using TRACKS list when queue is empty
  const handlePlayNext = useCallback(() => {
    const currentIndex = TRACKS.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex !== -1 && currentIndex < TRACKS.length - 1) {
      playTrack(TRACKS[currentIndex + 1]);
    } else {
      playNext();
    }
  }, [currentTrack, playTrack, playNext]);

  const handlePlayPrevious = useCallback(() => {
    const currentIndex = TRACKS.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      playTrack(TRACKS[currentIndex - 1]);
    } else {
      playPrevious();
    }
  }, [currentTrack, playTrack, playPrevious]);

  // Local search handler
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ tracks: [], albums: [] });
      setYoutubeSearchResults([]);
      return;
    }
    if (searchMode === 'local') {
      const results = searchAll(searchQuery);
      setSearchResults({ tracks: results.tracks, albums: results.albums });
    }
    // YouTube search is handled by useEffect with debounce
  }, [searchQuery, searchMode]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ tracks: [], albums: [] });
    setYoutubeSearchResults([]);
    setSearchError(null);
  }, []);

  // Format time - Video music standard format (HH:MM:SS or MM:SS)
  // Shows "LIVE" for live streams (duration = 0 or very large)
  const formatTime = (seconds: number, isLive?: boolean) => {
    // Check for live stream
    if (isLive || seconds <= 0 || seconds >= 86400) { // 86400 = 24 hours
      return 'LIVE';
    }
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!visible) return null;

  // Data for display
  const heroTrack = TRACKS[0];
  const topCharts = TRACKS.slice(0, 4);
  const topBillboard = TRACKS.slice(0, 10).map((track, index) => ({
    rank: index + 1,
    ...track,
    image: track.thumbnail,
  }));
  const displayRecentlyPlayed = recentlyPlayed.length > 0 
    ? recentlyPlayed.slice(0, 5) 
    : TRACKS.slice(0, 5);

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      {/* YouTube Player is managed by MusicPlayerContext Provider */}

      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex relative overflow-hidden">
        {/* Sidebar - Hidden when showSongDetail is true */}
        {!showSongDetail && (
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-black/30 backdrop-blur-sm border-r border-white/10 flex flex-col transition-all duration-300`}>
          {/* Header with drag handle */}
          <div
            className="h-12 cursor-move flex items-center justify-between px-4 border-b border-white/10"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition"
              >
                <i className="fas fa-times"></i>
              </button>
              {!sidebarCollapsed && <span className="text-white font-bold text-lg">Music</span>}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white/60 hover:text-white transition"
            >
              <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
            </button>
          </div>

          {/* Search with YouTube/Local toggle */}
          {!sidebarCollapsed && (
            <div className="p-4">
              {/* Search Mode Toggle */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setSearchMode('youtube')}
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition ${
                    searchMode === 'youtube' 
                      ? 'bg-red-600/80 text-white' 
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  YouTube
                </button>
                <button
                  onClick={() => setSearchMode('local')}
                  className={`flex-1 py-1 px-2 rounded text-xs font-medium transition ${
                    searchMode === 'local' 
                      ? 'bg-purple-600/80 text-white' 
                      : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  <i className="fas fa-music mr-1"></i>
                  Local
                </button>
              </div>

              {/* Search Input */}
              <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                {isSearching ? (
                  <i className="fas fa-spinner fa-spin text-white/50 text-sm"></i>
                ) : (
                  <i className="fas fa-search text-white/50 text-sm"></i>
                )}
                <input
                  type="text"
                  placeholder={searchMode === 'youtube' ? "Search YouTube..." : "Search local music..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="bg-transparent text-white placeholder-white/50 text-sm outline-none flex-1"
                />
                {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="text-white/50 hover:text-white"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                )}
              </div>

              {/* Search Error */}
              {searchError && (
                <div className="mt-2 text-orange-400 text-xs px-1">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  {searchError}
                </div>
              )}
              
              {/* YouTube Search Results */}
              {searchMode === 'youtube' && youtubeSearchResults.length > 0 && (
                <div className="mt-2 bg-white/15 backdrop-blur-xl border border-white/20 rounded-lg max-h-80 overflow-y-auto scrollbar-none">
                  <div className="p-2 border-b border-white/10">
                    <span className="text-white/50 text-xs">
                      {youtubeSearchResults.length} results
                    </span>
                  </div>
                  {youtubeSearchResults.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(convertYouTubeTrackToTrack(track))}
                      className="flex items-center gap-3 p-2 hover:bg-white/10 cursor-pointer transition group"
                    >
                      <div className="relative">
                        <img
                          src={track.imageUrl || `https://i.ytimg.com/vi/${track.id}/default.jpg`}
                          alt={track.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded">
                          <i className="fas fa-play text-white text-xs"></i>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{track.title}</div>
                        <div className="text-white/50 text-xs truncate">{track.artist}</div>
                      </div>
                      <div className="text-white/40 text-xs">{track.duration || ''}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Local Search Results */}
              {searchMode === 'local' && searchResults.tracks.length > 0 && (
                <div className="mt-2 bg-white/15 backdrop-blur-xl border border-white/20 rounded-lg max-h-80 overflow-y-auto scrollbar-none">
                  <div className="p-2 border-b border-white/10">
                    <span className="text-white/50 text-xs">
                      <i className="fas fa-music text-purple-400 mr-1"></i>
                      {searchResults.tracks.length} local results
                    </span>
                  </div>
                  {searchResults.tracks.slice(0, 8).map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track)}
                      className="flex items-center gap-3 p-2 hover:bg-white/10 cursor-pointer transition group"
                    >
                      <div className="relative">
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded">
                          <i className="fas fa-play text-white text-xs"></i>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{track.title}</div>
                        <div className="text-white/50 text-xs truncate">{track.artist}</div>
                      </div>
                      <div className="text-white/40 text-xs">{track.duration}</div>
                    </div>
                  ))}
                  
                  {/* Album Results */}
                  {searchResults.albums.length > 0 && (
                    <>
                      <div className="p-2 border-t border-b border-white/10 mt-2">
                        <span className="text-white/50 text-xs">
                          <i className="fas fa-compact-disc text-purple-400 mr-1"></i>
                          {searchResults.albums.length} albums
                        </span>
                      </div>
                      {searchResults.albums.slice(0, 4).map((album) => (
                        <div
                          key={album.id}
                          onClick={() => setSelectedAlbum(album)}
                          className="flex items-center gap-3 p-2 hover:bg-white/10 cursor-pointer transition"
                        >
                          <img
                            src={album.cover}
                            alt={album.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm truncate">{album.title}</div>
                            <div className="text-white/50 text-xs truncate">{album.artist} • {album.tracks.length} tracks</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Menu */}
          <div className="flex-1 px-3 space-y-1">
            {!sidebarCollapsed && <div className="text-white/50 text-xs font-semibold px-3 mb-2">Menu</div>}
            <button 
              onClick={() => { setCurrentView('home'); setSelectedAlbum(null); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition ${
                currentView === 'home' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Home"
            >
              <i className="fas fa-home"></i>
              {!sidebarCollapsed && <span>Home</span>}
            </button>
            <button 
              onClick={() => { setCurrentView('discover'); setSelectedAlbum(null); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition ${
                currentView === 'discover' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Discover"
            >
              <i className="fas fa-compass"></i>
              {!sidebarCollapsed && <span>Discover</span>}
            </button>
            <button
              onClick={() => { setCurrentView('podcasts'); setSelectedAlbum(null); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition ${
                currentView === 'podcasts' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Podcasts"
            >
              <i className="fas fa-podcast"></i>
              {!sidebarCollapsed && <span>Podcasts</span>}
            </button>

            {!sidebarCollapsed && <div className="text-white/50 text-xs font-semibold px-3 pt-4 mb-2">Library</div>}
            <button 
              onClick={() => { setCurrentView('albums'); setSelectedAlbum(null); }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition ${
                currentView === 'albums' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Albums"
            >
              <i className="fas fa-compact-disc"></i>
              {!sidebarCollapsed && <span>Albums</span>}
            </button>
          </div>
        </div>
        )}

        {/* Main Content - Hidden when showSongDetail is true */}
        {!showSongDetail && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <div className="h-12 flex items-center gap-3 px-6 border-b border-white/10">
            {selectedAlbum ? (
              <>
                <button 
                  onClick={() => setSelectedAlbum(null)}
                  className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/60 hover:text-white transition"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span className="text-white font-semibold">{selectedAlbum.title}</span>
              </>
            ) : (
              <h2 className="text-white font-semibold text-lg capitalize">{currentView}</h2>
            )}
            {isBuffering && (
              <span className="text-white/50 text-xs flex items-center gap-2">
                <i className="fas fa-spinner fa-spin"></i>
                Buffering...
              </span>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto scrollbar-none">
            {selectedAlbum ? (
              // Album Detail View
              <div className="p-6">
                <div className="flex gap-6 mb-6">
                  <img
                    src={selectedAlbum.cover}
                    alt={selectedAlbum.title}
                    className="w-48 h-48 rounded-2xl shadow-lg"
                  />
                  <div className="flex flex-col justify-end">
                    <div className="text-white/60 text-sm">Album</div>
                    <h2 className="text-white text-4xl font-bold mb-2">{selectedAlbum.title}</h2>
                    <div className="text-white/70">{selectedAlbum.artist} • {selectedAlbum.tracks.length} tracks</div>
                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => selectedAlbum.tracks[0] && playTrack(selectedAlbum.tracks[0])}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full flex items-center gap-2 transition"
                      >
                        <i className="fas fa-play"></i>
                        Play
                      </button>
                      <button className="border border-white/30 text-white px-6 py-2 rounded-full hover:bg-white/10 transition">
                        <i className="fas fa-random"></i>
                        Shuffle
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Album Tracks */}
                <div className="space-y-2">
                  {selectedAlbum.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track)}
                      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition group ${
                        currentTrack?.id === track.id ? 'bg-purple-600/30' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="text-white/60 text-sm w-6 text-center group-hover:hidden">
                        {index + 1}
                      </span>
                      <i className="fas fa-play text-purple-400 text-xs hidden group-hover:block w-6 text-center"></i>
                      <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                          {track.title}
                        </div>
                        <div className="text-white/50 text-xs truncate">{track.artist}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                        className={`opacity-0 group-hover:opacity-100 transition ${isLiked(track.id) ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
                      >
                        <i className={`${isLiked(track.id) ? 'fas' : 'far'} fa-heart`}></i>
                      </button>
                      <div className="text-white/60 text-xs">{track.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : currentView === 'search' ? (
              // Search View - Full page search results
              <div className="p-6">
                {/* Search Header */}
                <div className="mb-6">
                  <h3 className="text-white text-2xl font-bold mb-4">Search Music</h3>
                  
                  {/* Large Search Box */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                      {isSearching ? (
                        <i className="fas fa-spinner fa-spin text-white/50"></i>
                      ) : (
                        <i className="fas fa-search text-white/50"></i>
                      )}
                      <input
                        type="text"
                        placeholder={searchMode === 'youtube' ? "Search any song on YouTube..." : "Search local library..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSearch();
                        }}
                        className="bg-transparent text-white placeholder-white/50 text-lg outline-none flex-1"
                        autoFocus
                      />
                      {searchQuery && (
                        <button onClick={clearSearch} className="text-white/50 hover:text-white">
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Mode Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSearchMode('youtube')}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition ${
                        searchMode === 'youtube' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      YouTube
                    </button>
                    <button
                      onClick={() => setSearchMode('local')}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition ${
                        searchMode === 'local' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <i className="fas fa-music mr-2"></i>
                      Local Library
                    </button>
                  </div>
                </div>

                {/* Search Error */}
                {searchError && (
                  <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-300 text-sm">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {searchError}
                  </div>
                )}

                {/* YouTube Search Results */}
                {searchMode === 'youtube' && (
                  <div>
                    {!searchQuery.trim() ? (
                      <div className="text-center py-16">
                        <i className="fas fa-music text-purple-400 text-6xl mb-4"></i>
                        <h4 className="text-white text-xl font-semibold mb-2">Search Music</h4>
                        <p className="text-white/60">Type to search for any song, artist, or album</p>
                      </div>
                    ) : isSearching ? (
                      <div className="text-center py-16">
                        <i className="fas fa-spinner fa-spin text-purple-400 text-4xl mb-4"></i>
                        <p className="text-white/60">Searching YouTube...</p>
                      </div>
                    ) : youtubeSearchResults.length > 0 ? (
                      <div>
                        <h4 className="text-white/60 text-sm mb-3">
                          {youtubeSearchResults.length} results for "{searchQuery}"
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {youtubeSearchResults.map((track) => (
                            <div
                              key={track.id}
                              onClick={() => playTrack(convertYouTubeTrackToTrack(track))}
                              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition group ${
                                currentTrack?.id === track.id ? 'bg-purple-600/30' : 'hover:bg-white/5'
                              }`}
                            >
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <img
                                  src={track.imageUrl || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                                  alt={track.title}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg">
                                  <i className="fas fa-play text-white text-lg"></i>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                                  {track.title}
                                </div>
                                <div className="text-white/50 text-sm truncate">{track.artist}</div>
                                {track.viewCount && (
                                  <div className="text-white/40 text-xs mt-1">
                                    <i className="fas fa-eye mr-1"></i>
                                    {track.viewCount.toLocaleString()} views
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-white/50 text-sm">{track.duration || ''}</span>
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    toggleLike(convertYouTubeTrackToTrack(track)); 
                                  }}
                                  className={`opacity-0 group-hover:opacity-100 transition ${
                                    isLiked(track.id) ? 'text-red-400' : 'text-white/40 hover:text-red-400'
                                  }`}
                                >
                                  <i className={`${isLiked(track.id) ? 'fas' : 'far'} fa-heart`}></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : searchQuery.trim() ? (
                      <div className="text-center py-16">
                        <i className="fas fa-search text-white/30 text-4xl mb-4"></i>
                        <p className="text-white/60">No results found for "{searchQuery}"</p>
                        <p className="text-white/40 text-sm mt-2">Try a different search term</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Local Search Results */}
                {searchMode === 'local' && (
                  <div>
                    {!searchQuery.trim() ? (
                      <div className="text-center py-16">
                        <i className="fas fa-music text-purple-400 text-6xl mb-4"></i>
                        <h4 className="text-white text-xl font-semibold mb-2">Search Local Library</h4>
                        <p className="text-white/60">Search through your local music collection</p>
                      </div>
                    ) : searchResults.tracks.length > 0 || searchResults.albums.length > 0 ? (
                      <div>
                        {/* Tracks */}
                        {searchResults.tracks.length > 0 && (
                          <div className="mb-8">
                            <h4 className="text-white/60 text-sm mb-3">
                              <i className="fas fa-music text-purple-400 mr-2"></i>
                              Tracks ({searchResults.tracks.length})
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {searchResults.tracks.map((track) => (
                                <div
                                  key={track.id}
                                  onClick={() => playTrack(track)}
                                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition group ${
                                    currentTrack?.id === track.id ? 'bg-purple-600/30' : 'hover:bg-white/5'
                                  }`}
                                >
                                  <div className="relative w-12 h-12 flex-shrink-0">
                                    <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg">
                                      <i className="fas fa-play text-white text-sm"></i>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                                      {track.title}
                                    </div>
                                    <div className="text-white/50 text-sm truncate">{track.artist}</div>
                                  </div>
                                  <div className="text-white/50 text-sm">{track.duration}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Albums */}
                        {searchResults.albums.length > 0 && (
                          <div>
                            <h4 className="text-white/60 text-sm mb-3">
                              <i className="fas fa-compact-disc text-purple-400 mr-2"></i>
                              Albums ({searchResults.albums.length})
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {searchResults.albums.map((album) => (
                                <div
                                  key={album.id}
                                  onClick={() => setSelectedAlbum(album)}
                                  className="group cursor-pointer"
                                >
                                  <div className="relative mb-3">
                                    <img
                                      src={album.cover}
                                      alt={album.title}
                                      className="w-full aspect-square object-cover rounded-xl"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center">
                                      <button className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                        <i className="fas fa-play ml-1"></i>
                                      </button>
                                    </div>
                                  </div>
                                  <h5 className="text-white font-medium truncate">{album.title}</h5>
                                  <p className="text-white/60 text-sm truncate">{album.artist} • {album.tracks.length} tracks</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : searchQuery.trim() ? (
                      <div className="text-center py-16">
                        <i className="fas fa-search text-white/30 text-4xl mb-4"></i>
                        <p className="text-white/60">No local results for "{searchQuery}"</p>
                        <p className="text-white/40 text-sm mt-2">Try searching online instead</p>
                        <button
                          onClick={() => setSearchMode('youtube')}
                          className="mt-4 px-4 py-2 bg-purple-600 rounded-full text-white text-sm hover:bg-purple-700 transition"
                        >
                          Search Online
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : currentView === 'discover' ? (
              // Discover View
              <div className="p-6">
                {/* Recently Played */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold text-sm mb-4">RECENTLY PLAYED</h3>
                  <div className="grid grid-cols-5 gap-4">
                    {displayRecentlyPlayed.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => playTrack(item)}
                        className="cursor-pointer hover:bg-white/5 rounded-xl p-3 transition group"
                      >
                        <div className="relative mb-3">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full aspect-square rounded-xl object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center">
                            <button className="w-12 h-12 bg-white/0 group-hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
                              <i className="fas fa-play text-black ml-1"></i>
                            </button>
                          </div>
                        </div>
                        <div className="text-white text-sm font-bold truncate">{item.title}</div>
                        <div className="text-white/60 text-xs truncate">{item.artist}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Billboard */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <i className="fas fa-fire text-orange-400"></i>
                    TOP TRACKS
                  </h3>
                  <div className="space-y-3">
                    {topBillboard.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => playTrack(song)}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition group ${
                          currentTrack?.id === song.id ? 'bg-purple-600/30' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 w-8">
                          {song.rank <= 3 ? (
                            <div className="flex items-center gap-1">
                              <i className={`fas fa-trophy text-${song.rank === 1 ? 'yellow' : song.rank === 2 ? 'gray' : 'orange'}-500 text-xs`}></i>
                              <span className="text-white/60 text-sm font-semibold">#{song.rank}</span>
                            </div>
                          ) : (
                            <span className="text-white/60 text-sm font-semibold">#{song.rank}</span>
                          )}
                        </div>
                        <img src={song.image} alt={song.title} className="w-12 h-12 rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${currentTrack?.id === song.id ? 'text-purple-400' : 'text-white'}`}>
                            {song.title}
                          </div>
                          <div className="text-white/50 text-xs truncate">{song.artist}</div>
                        </div>
                        <div className="text-white/60 text-xs">{song.album}</div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                          className={`opacity-0 group-hover:opacity-100 transition ${isLiked(song.id) ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
                        >
                          <i className={`${isLiked(song.id) ? 'fas' : 'far'} fa-heart`}></i>
                        </button>
                        <div className="text-white/60 text-xs w-16 text-right">{song.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : currentView === 'podcasts' ? (
              // Podcasts View
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-white font-semibold text-sm mb-4">FEATURED PODCASTS</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {PODCAST_SHOWS.map((show) => (
                      <div
                        key={show.id}
                        className="cursor-pointer hover:bg-white/5 rounded-xl p-4 transition group"
                      >
                        <div className="relative mb-3">
                          <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center overflow-hidden">
                            <img
                              src={show.cover}
                              alt={show.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                // Show fallback icon
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.fallback-icon')) {
                                  const icon = document.createElement('i');
                                  icon.className = 'fas fa-podcast text-white/80 text-4xl fallback-icon';
                                  parent.appendChild(icon);
                                }
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center">
                            <button className="w-12 h-12 bg-white/0 group-hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
                              <i className="fas fa-play text-black ml-1"></i>
                            </button>
                          </div>
                        </div>
                        <div className="text-white text-sm font-bold truncate">{show.title}</div>
                        <div className="text-white/60 text-xs truncate">{show.host}</div>
                        <div className="text-white/50 text-xs mt-1">{show.episodes.length} episodes</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Episodes */}
                <div>
                  <h3 className="text-white font-semibold text-sm mb-4">EPISODES</h3>
                  <div className="space-y-3">
                    {PODCAST_SHOWS.flatMap(show => 
                      show.episodes.map(episode => ({
                        ...episode,
                        showTitle: show.title,
                      }))
                    ).map((episode) => (
                      <div
                        key={episode.id}
                        onClick={() => playTrack({
                          id: episode.id,
                          title: episode.title,
                          artist: episode.showTitle,
                          thumbnail: episode.thumbnail,
                          duration: episode.duration,
                        })}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition group"
                      >
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img 
                            src={episode.thumbnail} 
                            alt={episode.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const icon = document.createElement('i');
                                icon.className = 'fas fa-microphone text-white/80 text-xl fallback-icon';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{episode.title}</div>
                          <div className="text-white/50 text-xs truncate">{episode.showTitle}</div>
                          <div className="text-white/40 text-xs mt-1">{episode.duration}</div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition text-white/40 hover:text-white">
                          <i className="fas fa-bookmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : currentView === 'albums' ? (
              // Albums View
              <div className="p-6">
                <h3 className="text-white font-semibold text-sm mb-4">ALL ALBUMS</h3>
                <div className="grid grid-cols-4 gap-4">
                  {ALBUMS.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => setSelectedAlbum(album)}
                      className="cursor-pointer hover:bg-white/5 rounded-xl p-4 transition group"
                    >
                      <div className="relative mb-3">
                        <img
                          src={album.cover}
                          alt={album.title}
                          className="w-full aspect-square rounded-xl object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center">
                          <button className="w-12 h-12 bg-white/0 group-hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
                            <i className="fas fa-play text-black ml-1"></i>
                          </button>
                        </div>
                      </div>
                      <div className="text-white text-sm font-bold truncate">{album.title}</div>
                      <div className="text-white/60 text-xs truncate">{album.artist}</div>
                      <div className="text-white/50 text-xs mt-1">{album.tracks.length} tracks</div>
                    </div>
                  ))}
                </div>

                {/* Playlists */}
                <h3 className="text-white font-semibold text-sm mb-4 mt-8">PLAYLISTS</h3>
                <div className="grid grid-cols-4 gap-4">
                  {PLAYLISTS.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="cursor-pointer hover:bg-white/5 rounded-xl p-4 transition group"
                    >
                      <div className="relative mb-3">
                        <img
                          src={playlist.cover}
                          alt={playlist.title}
                          className="w-full aspect-square rounded-xl object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (playlist.tracks[0]) playTrack(playlist.tracks[0]);
                            }}
                            className="w-12 h-12 bg-white/0 group-hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100"
                          >
                            <i className="fas fa-play text-black ml-1"></i>
                          </button>
                        </div>
                      </div>
                      <div className="text-white text-sm font-bold truncate">{playlist.title}</div>
                      <div className="text-white/60 text-xs truncate">{playlist.description}</div>
                      <div className="text-white/50 text-xs mt-1">{playlist.tracks.length} tracks</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Home View
              <div className="p-6">
                {/* Hero - First Track */}
                <div className="mb-6">
                  <div className="text-white/60 text-sm mb-2 flex items-center gap-2">
                    <i className="fas fa-headphones text-purple-400"></i>
                    Now Playing
                  </div>
                  <div className="bg-gradient-to-br from-slate-800 to-black rounded-2xl p-8 relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-white text-4xl font-bold mb-2 truncate max-w-lg">
                        {heroTrack.title}
                      </h2>
                      <div className="flex items-center gap-2 text-white/80 text-sm mb-6">
                        <span className="font-semibold">{heroTrack.artist}</span>
                        <span>• {heroTrack.album}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => playTrack(heroTrack)}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                        >
                          <i className="fas fa-play"></i>
                          Listen Now
                        </button>
                        <button 
                          onClick={() => toggleLike(heroTrack)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                            isLiked(heroTrack.id) ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          <i className={`${isLiked(heroTrack.id) ? 'fas' : 'far'} fa-heart`}></i>
                        </button>
                      </div>
                    </div>
                    <img
                      src={heroTrack.thumbnail}
                      alt="Hero Track"
                      className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-50"
                    />
                  </div>
                </div>

                {/* Top Artists */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-star text-yellow-400 text-sm"></i>
                    Top Artists
                  </h3>
                  <div className="grid grid-cols-6 gap-3">
                    {ARTISTS.slice(0, 6).map((artist) => (
                      <div
                        key={artist.id}
                        className="cursor-pointer hover:bg-white/5 rounded-xl p-3 transition group"
                      >
                        <div className="relative w-full aspect-square rounded-xl mb-2 overflow-hidden bg-gradient-to-br from-purple-600/40 to-pink-600/40">
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="absolute inset-0 items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 hidden"
                          >
                            <span className="text-white text-2xl font-bold">
                              {artist.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="text-white text-sm font-semibold truncate">{artist.name}</div>
                        <div className="text-white/50 text-xs">{artist.followers}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Charts */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-line text-green-400 text-sm"></i>
                    Top Charts
                  </h3>
                  <div className="space-y-2">
                    {topCharts.map((song, index) => (
                      <div
                        key={song.id}
                        onClick={() => playTrack(song)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition group ${
                          currentTrack?.id === song.id ? 'bg-purple-600/30' : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="text-white/60 text-sm font-semibold w-8">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${currentTrack?.id === song.id ? 'text-purple-400' : 'text-white'}`}>
                            {song.title}
                          </div>
                          <div className="text-white/50 text-xs truncate">{song.artist}</div>
                        </div>
                        <div className="text-white/60 text-xs">{song.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Music Player Bar */}
          <div className="h-20 border-t border-white/10 flex items-center px-6 gap-6">
            {/* Album Art & Info */}
            <div className="flex items-center gap-3 w-64">
              <div 
                className="relative group cursor-pointer"
                onClick={() => {
                  if (currentTrack) {
                    setSelectedSong(currentTrack);
                    setShowSongDetail(true);
                  }
                }}
              >
                <img
                  src={currentTrack?.thumbnail || 'https://via.placeholder.com/100'}
                  alt="Album"
                  className="w-14 h-14 rounded-lg transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <i className="fas fa-expand text-white text-sm"></i>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold truncate flex items-center gap-2">
                  {currentTrack?.title || 'No track selected'}
                </div>
                <div className="text-white/60 text-xs truncate">
                  {currentTrack?.artist || 'Select a track to play'}
                </div>
              </div>
              {currentTrack && (
                <button
                  onClick={() => toggleLike(currentTrack)}
                  className={`transition ${isLiked(currentTrack.id) ? 'text-red-400' : 'text-white/60 hover:text-red-400'}`}
                >
                  <i className={`${isLiked(currentTrack.id) ? 'fas' : 'far'} fa-heart`}></i>
                </button>
              )}
            </div>

            {/* Player Controls */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <button onClick={handlePlayPrevious} className="text-white/60 hover:text-white transition">
                  <i className="fas fa-step-backward"></i>
                </button>
                <button 
                  onClick={() => seekTo(Math.max(0, currentTime - 10))}
                  className="text-white/60 hover:text-white transition"
                >
                  <i className="fas fa-backward"></i>
                </button>
                <button 
                  onClick={togglePlayPause}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition"
                >
                  <i className={`fas fa-${isPlaying ? 'pause' : 'play'} ${!isPlaying ? 'ml-0.5' : ''}`}></i>
                </button>
                <button 
                  onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                  className="text-white/60 hover:text-white transition"
                >
                  <i className="fas fa-forward"></i>
                </button>
                <button onClick={handlePlayNext} className="text-white/60 hover:text-white transition">
                  <i className="fas fa-step-forward"></i>
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full max-w-2xl flex items-center gap-3">
                {/* Check if LIVE stream */}
                {duration <= 0 || duration >= 86400 ? (
                  <>
                    <span className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400/60 rounded-full w-full animate-pulse"></div>
                    </div>
                    <span className="text-white/60 text-xs font-mono">{formatTime(currentTime)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-white/60 text-xs font-mono">{formatTime(currentTime)}</span>
                    <div 
                      className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percentage = (e.clientX - rect.left) / rect.width;
                        seekTo(percentage * duration);
                      }}
                    >
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-pink-500 relative"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition"></div>
                      </div>
                    </div>
                    <span className="text-white/60 text-xs font-mono">{formatTime(duration)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 w-40">
              <button 
                onClick={() => handleVolumeChange(volume === 0 ? 70 : 0)}
                className="text-white/60 hover:text-white transition"
              >
                <i className={`fas fa-volume-${volume === 0 ? 'mute' : volume < 50 ? 'down' : 'up'}`}></i>
              </button>
              <div 
                className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percentage = (e.clientX - rect.left) / rect.width;
                  handleVolumeChange(percentage * 100);
                }}
              >
                <div 
                  className="h-full bg-white/60 rounded-full"
                  style={{ width: `${volume}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Right Sidebar - Hidden when showSongDetail is true */}
        {!showSongDetail && (
        <div className="w-64 flex-shrink-0 bg-black/30 backdrop-blur-sm border-l border-white/10 flex flex-col">
          {/* Tags */}
          <div className="p-4 border-b border-white/10 relative">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Tags</h4>
              <button 
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="text-white/60 hover:text-white"
              >
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-purple-600/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="ml-1 hover:text-red-300"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </span>
              ))}
            </div>

            {/* Tag Selector Popup */}
            {showTagSelector && (
              <div className="absolute top-12 right-4 z-50 backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl shadow-2xl p-4 w-80">
                <h5 className="text-white text-sm font-semibold mb-3">Available Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_TAGS.filter(tag => !selectedTags.includes(tag)).map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedTags([...selectedTags, tag])}
                      className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs px-3 py-1.5 rounded-full transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recently Played */}
          <div className="flex-1 overflow-auto scrollbar-none p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Recently Played</h4>
            </div>
            <div className="space-y-3">
              {recentlyPlayed.slice(0, 6).map((track) => (
                <div 
                  key={track.id} 
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition"
                >
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{track.title}</div>
                    <div className="text-white/50 text-xs truncate">{track.artist}</div>
                  </div>
                  <div className="text-white/40 text-xs whitespace-nowrap">
                    {getRelativeTime(track.playedAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Liked Tracks */}
            {likedTracks.length > 0 && (
              <div className="mt-6 relative">
                <div className="flex items-center justify-between mb-3">
                  <h4 
                    className={`text-white font-semibold ${likedTracks.length >= 10 ? 'cursor-pointer hover:text-purple-400 transition' : ''}`}
                    onClick={() => likedTracks.length >= 10 && setShowLikedSongsList(true)}
                  >
                    Liked Songs
                    <span className="ml-2 text-white/50 text-sm font-normal">({likedTracks.length})</span>
                  </h4>
                  {likedTracks.length >= 10 && (
                    <button
                      onClick={() => setShowLikedSongsList(true)}
                      className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
                      title="View all liked songs"
                    >
                      <i className="fas fa-ellipsis-h text-sm"></i>
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {likedTracks.slice(0, 4).map((track) => (
                    <div 
                      key={track.id} 
                      onClick={() => playTrack(track)}
                      className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition"
                    >
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{track.title}</div>
                        <div className="text-white/50 text-xs truncate">{track.artist}</div>
                      </div>
                      <i className="fas fa-heart text-red-400 text-xs"></i>
                    </div>
                  ))}
                  {likedTracks.length > 4 && (
                    <button
                      onClick={() => setShowLikedSongsList(true)}
                      className="w-full text-center text-white/60 hover:text-white text-sm py-2 hover:bg-white/5 rounded-lg transition"
                    >
                      View all {likedTracks.length} songs
                    </button>
                  )}
                </div>
                
                {/* Liked Songs List Modal */}
                {showLikedSongsList && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl w-[500px] max-h-[70vh] flex flex-col shadow-2xl">
                      {/* Modal Header */}
                      <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                            <i className="fas fa-heart text-white text-xl"></i>
                          </div>
                          <div>
                            <h3 className="text-white font-bold text-lg">Liked Songs</h3>
                            <p className="text-white/60 text-sm">{likedTracks.length} songs</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowLikedSongsList(false)}
                          className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      
                      {/* Modal Content - Scrollable List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-none">
                        {likedTracks.map((track, index) => (
                          <div 
                            key={track.id} 
                            onClick={() => {
                              playTrack(track);
                              setShowLikedSongsList(false);
                            }}
                            className={`flex items-center gap-3 cursor-pointer hover:bg-white/10 p-3 rounded-lg transition group ${
                              currentTrack?.id === track.id ? 'bg-purple-600/30' : ''
                            }`}
                          >
                            <span className="text-white/40 text-sm w-6 text-right">{index + 1}</span>
                            <div className="relative">
                              <img
                                src={track.thumbnail}
                                alt={track.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                <i className={`fas fa-${currentTrack?.id === track.id && isPlaying ? 'pause' : 'play'} text-white text-sm`}></i>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                                {track.title}
                              </div>
                              <div className="text-white/50 text-xs truncate">{track.artist}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-white/40 text-xs">{track.duration || ''}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLike(track);
                                }}
                                className="text-red-400 hover:text-red-300 transition"
                              >
                                <i className="fas fa-heart"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Modal Footer */}
                      <div className="p-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-white/50 text-sm">
                          Total: {likedTracks.length} songs
                        </span>
                        <button
                          onClick={() => {
                            // Play all liked songs
                            if (likedTracks.length > 0) {
                              playTrack(likedTracks[0]);
                              setShowLikedSongsList(false);
                            }
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-sm font-medium transition flex items-center gap-2"
                        >
                          <i className="fas fa-play"></i>
                          Play All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Song Detail View - Full screen within Music Panel */}
        {showSongDetail && (selectedSong || currentTrack) && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Background Album Art - Always sync with currentTrack */}
            <div className="absolute inset-0 opacity-15">
              <img
                src={currentTrack?.thumbnail || selectedSong?.thumbnail}
                alt={currentTrack?.title || selectedSong?.title || 'Album Art'}
                className="w-full h-full object-cover blur-3xl scale-110"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>

            {/* Header with drag handle and back button */}
            <div
              className="h-14 cursor-move flex items-center gap-4 px-6 border-b border-white/10 relative z-10"
              onMouseDown={handleMouseDown}
            >
              <button
                onClick={() => setShowSongDetail(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
              >
                <i className="fas fa-chevron-left text-lg"></i>
              </button>
              <span className="text-white font-bold text-lg">Now Playing</span>
              <div className="flex-1"></div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto relative z-10 flex items-center justify-center px-8 py-6">
              <div className="flex items-center gap-16 max-w-6xl w-full">
                {/* Left Section - Current Track Album Art */}
                <div className="w-[420px] h-[400px] flex-shrink-0 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center">
                    {/* Album Art - Synced with current playing track */}
                    <div className="relative group">
                      <img
                        src={currentTrack?.thumbnail || selectedSong?.thumbnail || '/default-album.png'}
                        alt={currentTrack?.title || selectedSong?.title || 'Album Art'}
                        className="w-64 h-64 rounded-2xl shadow-2xl object-cover transition-all duration-500 group-hover:scale-105"
                        style={{
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(148, 255, 181, 0.15)'
                        }}
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={togglePlayPause}
                          className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
                        >
                          <i className={`fas fa-${isPlaying ? 'pause' : 'play'} text-2xl ${!isPlaying ? 'ml-1' : ''}`}></i>
                        </button>
                      </div>
                    </div>
                    
                    {/* Track Info */}
                    <div className="text-center mt-6 px-4">
                      <div className="text-white font-bold text-2xl mb-2 leading-tight">
                        {currentTrack?.title || selectedSong?.title || 'Unknown Track'}
                      </div>
                      <div className="text-white/70 text-lg">
                        {currentTrack?.artist || selectedSong?.artist || 'Unknown Artist'}
                      </div>
                      {(currentTrack?.album || selectedSong?.album) && (
                        <div className="text-white/50 text-sm mt-1">
                          {currentTrack?.album || selectedSong?.album}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right - Circular Progress */}
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="relative w-[260px] h-[260px]">
                    {/* Main Circle Container */}
                    <div 
                      className="absolute inset-0 rounded-full bg-white/[0.02] backdrop-blur-sm"
                      style={{
                        boxShadow: '0 0 25px rgba(148, 255, 181, 0.35)'
                      }}
                    />

                    {/* Circular Timeline Ring */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 260 260">
                      {/* Background Ring */}
                      <circle
                        cx="130"
                        cy="130"
                        r="125"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="3"
                      />
                      
                      {/* Progress Ring with Gradient */}
                      <circle
                        cx="130"
                        cy="130"
                        r="125"
                        fill="none"
                        stroke="url(#timelineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(currentTime / duration) * 785} 785`}
                        className="cursor-pointer transition-all"
                        onMouseDown={handleProgressCircleInteraction}
                      />
                      
                      <defs>
                        <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a7ff5a" />
                          <stop offset="50%" stopColor="#94ffb5" />
                          <stop offset="100%" stopColor="#a7ff5a" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Circular Thumb on Timeline */}
                    <div 
                      className="absolute w-2.5 h-2.5 rounded-full bg-[#a7ff5a] pointer-events-none transition-all"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${(currentTime / duration) * 360}deg) translateY(-125px)`,
                        boxShadow: '0 0 12px rgba(167, 255, 90, 0.9), 0 0 20px rgba(167, 255, 90, 0.5)'
                      }}
                    />

                    {/* Center Play/Pause Button */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <button
                        onClick={togglePlayPause}
                        className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ease-out pointer-events-auto hover:scale-105"
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '2px solid rgba(167, 255, 90, 0.7)',
                          boxShadow: '0 0 8px rgba(167, 255, 90, 0.4)'
                        }}
                      >
                        {isPlaying ? (
                          <div className="flex gap-1.5">
                            <div className="w-1.5 h-5 rounded bg-[#a7ff5a]"></div>
                            <div className="w-1.5 h-5 rounded bg-[#a7ff5a]"></div>
                          </div>
                        ) : (
                          <div 
                            className="w-0 h-0 ml-1"
                            style={{
                              borderLeft: '12px solid #a7ff5a',
                              borderTop: '8px solid transparent',
                              borderBottom: '8px solid transparent'
                            }}
                          />
                        )}
                      </button>
                    </div>

                    {/* Time Labels */}
                    <div 
                      className="absolute text-[10px] font-light pointer-events-none"
                      style={{
                        left: '50%',
                        top: '8px',
                        transform: 'translateX(-50%)',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      {duration <= 0 || duration >= 86400 ? (
                        <span className="flex items-center gap-1 text-red-400 font-semibold">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                          LIVE
                        </span>
                      ) : formatTime(currentTime)}
                    </div>
                    
                    <div 
                      className="absolute text-[10px] font-light pointer-events-none"
                      style={{
                        left: '50%',
                        bottom: '8px',
                        transform: 'translateX(-50%)',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      {duration <= 0 || duration >= 86400 ? formatTime(currentTime) : formatTime(duration)}
                    </div>

                    {/* Side Icons Stack */}
                    <div 
                      className="absolute flex flex-col gap-2"
                      style={{
                        right: '-50px',
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    >
                      {/* Volume Control with Vertical Slider */}
                      <div className="flex flex-col items-center gap-1.5 bg-black/40 rounded-full px-2 py-2.5 backdrop-blur-sm">
                        <button 
                          onClick={() => handleVolumeChange(Math.min(100, volume + 10))}
                          className="w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                          style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                          title="Volume Up"
                        >
                          <i className="fas fa-volume-up text-xs"></i>
                        </button>
                        
                        {/* Vertical Volume Slider */}
                        <div className="relative w-1 h-16 bg-white/10 rounded-full overflow-hidden">
                          {/* Volume Fill */}
                          <div 
                            className="absolute bottom-0 w-full rounded-full transition-all duration-150"
                            style={{
                              height: `${volume}%`,
                              background: 'linear-gradient(to top, #a7ff5a, #94ffb5)'
                            }}
                          />
                          
                          {/* Interactive Overlay */}
                          <div 
                            className="absolute inset-0 cursor-pointer"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const y = e.clientY - rect.top;
                              const percentage = 1 - (y / rect.height);
                              handleVolumeChange(Math.max(0, Math.min(100, percentage * 100)));
                            }}
                          />
                          
                          {/* Volume Thumb */}
                          <div 
                            className="absolute w-2.5 h-2.5 rounded-full bg-[#a7ff5a] pointer-events-none transition-all duration-150"
                            style={{
                              left: '50%',
                              bottom: `${volume}%`,
                              transform: 'translate(-50%, 50%)',
                              boxShadow: '0 0 8px rgba(167, 255, 90, 0.8)'
                            }}
                          />
                        </div>
                        
                        <button 
                          onClick={() => handleVolumeChange(Math.max(0, volume - 10))}
                          className="w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                          style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                          title="Volume Down"
                        >
                          <i className="fas fa-volume-down text-xs"></i>
                        </button>
                        
                        <div className="text-[8px] font-light text-white/60">
                          {Math.round(volume)}%
                        </div>
                      </div>
                      
                      <div className="h-px bg-white/20 w-5 mx-auto"></div>
                      
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                        style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                        title="Repeat"
                      >
                        <i className="fas fa-repeat text-sm"></i>
                      </button>
                      <button 
                        onClick={() => currentTrack && toggleLike(currentTrack)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${
                          currentTrack && isLiked(currentTrack.id) ? 'text-red-400' : ''
                        }`}
                        style={{ color: currentTrack && isLiked(currentTrack.id) ? undefined : 'rgba(167, 255, 90, 0.85)' }}
                        title="Like"
                      >
                        <i className={`${currentTrack && isLiked(currentTrack.id) ? 'fas' : 'far'} fa-heart text-sm`}></i>
                      </button>
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                        style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                        title="Add to playlist"
                      >
                        <i className="fas fa-plus text-sm"></i>
                      </button>
                    </div>
                  </div>

                  {/* Lyrics - Dynamic based on current time */}
                  <div className="text-center max-w-md mt-6">
                    <div className="text-white/70 text-sm leading-relaxed">
                      <p className="mb-1 transition-all duration-500 ease-in-out transform">
                        {getCurrentLyrics().current?.text || " Playing music..."}
                      </p>
                      <p className="text-white/50 text-xs transition-all duration-500 ease-in-out transform opacity-60">
                        {getCurrentLyrics().next?.text || "..."}
                      </p>
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-6 mt-6">
                    <button 
                      onClick={handlePlayPrevious}
                      className="w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition"
                    >
                      <i className="fas fa-step-backward text-base"></i>
                    </button>
                    <button 
                      onClick={handlePlayNext}
                      className="w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition"
                    >
                      <i className="fas fa-step-forward text-base"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resize Handle */}
        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        ></div>
      </div>
    </div>
  );
}
