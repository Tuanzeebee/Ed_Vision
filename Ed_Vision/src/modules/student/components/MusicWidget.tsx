import { useState } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useMusicPlayer } from '../music/MusicPlayerContext';
import { TRACKS } from '../music/mockData';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
};

export default function MusicWidget({
  visible,
  onClose,
  initialX = window.innerWidth - 320,
  initialY = window.innerHeight - 280,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const [expanded, setExpanded] = useState(false);
  
  // Use shared music player context
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    pause,
    resume,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    toggleLike,
    isLiked,
    playTrack,
  } = useMusicPlayer();

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  // Handle play next/previous using TRACKS list when queue is empty
  const handlePlayNext = () => {
    if (queue.length > 0) {
      playNext();
    } else if (currentTrack) {
      const currentIndex = TRACKS.findIndex(t => t.id === currentTrack.id);
      if (currentIndex !== -1 && currentIndex < TRACKS.length - 1) {
        playTrack(TRACKS[currentIndex + 1]);
      }
    }
  };

  const handlePlayPrevious = () => {
    if (currentTrack) {
      const currentIndex = TRACKS.findIndex(t => t.id === currentTrack.id);
      if (currentIndex > 0) {
        playTrack(TRACKS[currentIndex - 1]);
      } else {
        playPrevious();
      }
    }
  };

  if (!visible) return null;

  // Default track info when no track is playing
  const track = currentTrack ? {
    id: currentTrack.id,
    title: currentTrack.title,
    artist: currentTrack.artist,
    duration: currentTrack.duration || formatTime(duration),
    albumArt: currentTrack.thumbnail || 'https://via.placeholder.com/100',
  } : {
    id: '',
    title: 'No track playing',
    artist: 'Select a track from Music Panel',
    duration: '0:00',
    albumArt: 'https://via.placeholder.com/100',
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Get next tracks from queue or from TRACKS list
  const upNextTracks = queue.length > 0 
    ? queue.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        duration: t.duration || '0:00',
        albumArt: t.thumbnail || 'https://via.placeholder.com/40',
      }))
    : currentTrack 
      ? TRACKS.filter(t => t.id !== currentTrack.id).slice(0, 3).map(t => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          duration: t.duration || '0:00',
          albumArt: t.thumbnail || 'https://via.placeholder.com/40',
        }))
      : [];

  return (
    <div
      className="fixed z-30 select-none"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div
        className="w-72 backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-2xl shadow-2xl transition-all duration-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      >
        {/* Draggable Header Bar */}
        <div
          className="h-2 w-full cursor-grab active:cursor-grabbing rounded-t-2xl hover:bg-white/10 transition-colors duration-200 relative group select-none"
          onMouseDown={handleMouseDown}
        >
          {/* Visual indicator on hover */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-8 h-0.5 bg-white/40 rounded-full"></div>
          </div>
        </div>

        <div className="px-4 pt-2 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
              <img
                src={track.albumArt}
                alt="Album Cover"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate flex items-center gap-2">
                {track.title}
              </div>
              <div className="text-white/60 text-xs truncate">{track.artist}</div>
            </div>
            {currentTrack && (
              <button
                onClick={() => toggleLike(currentTrack)}
                className={`transition flex-shrink-0 mr-2 ${isLiked(currentTrack.id) ? 'text-pink-500' : 'text-white/60 hover:text-white'}`}
                title={isLiked(currentTrack.id) ? 'Unlike' : 'Like'}
              >
                <i className={`fas fa-heart text-sm`}></i>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition flex-shrink-0"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={handlePlayPrevious} className="text-white/70 hover:text-white transition">
              <i className="fas fa-backward text-sm"></i>
            </button>
            <button 
              onClick={handleTogglePlay}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
            >
              <i className={`fas fa-${isPlaying ? 'pause' : 'play'} text-xs ${!isPlaying ? 'ml-0.5' : ''}`}></i>
            </button>
            <button onClick={handlePlayNext} className="text-white/70 hover:text-white transition">
              <i className="fas fa-forward text-sm"></i>
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-white/70 hover:text-white transition"
            >
              <i className={`fas ${expanded ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs">{formatTime(currentTime)}</span>
            <div 
              className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percentage = (e.clientX - rect.left) / rect.width;
                seekTo(duration * percentage);
              }}
            >
              <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-white/50 text-xs">{formatTime(duration)}</span>
          </div>

          <div
            className={`overflow-hidden transition-[max-height] duration-400 ${
              expanded ? 'max-h-[500px]' : 'max-h-0'
            }`}
          >
            <div className="pt-4 border-t border-white/20 mt-4">
              <div className="mb-4">
                <div className="text-white/70 text-xs font-medium mb-2">Now Playing</div>
                <div className="text-white text-sm">{currentTrack ? currentTrack.album || 'Music' : 'No track'}</div>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    onClick={() => setVolume(volume === 0 ? 70 : 0)}
                    className="text-white/60 hover:text-white transition"
                  >
                    <i className={`fas fa-volume-${volume === 0 ? 'mute' : volume < 50 ? 'down' : 'up'} text-sm`}></i>
                  </button>
                  <div 
                    className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percentage = (e.clientX - rect.left) / rect.width;
                      setVolume(Math.round(percentage * 100));
                    }}
                  >
                    <div className="h-full bg-white/60 rounded-full" style={{ width: `${volume}%` }}></div>
                  </div>
                  <span className="text-white/60 text-xs">{volume}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-white/60 text-xs mb-4">
                <button className="hover:text-white transition">
                  <i className="fas fa-shuffle"></i>
                </button>
                <button className="hover:text-white transition">
                  <i className="fas fa-repeat"></i>
                </button>
                {currentTrack && (
                  <button 
                    onClick={() => toggleLike(currentTrack)}
                    className={`transition ${isLiked(currentTrack.id) ? 'text-pink-500' : 'hover:text-white'}`}
                  >
                    <i className="fas fa-heart"></i>
                  </button>
                )}
                <button className="hover:text-white transition">
                  <i className="fas fa-list"></i>
                </button>
              </div>
              <div>
                <div className="text-white/70 text-xs font-medium mb-2">Up Next</div>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
                  {upNextTracks.map((nextTrack) => {
                    // Find the original track from TRACKS to play
                    const originalTrack = TRACKS.find(t => t.id === nextTrack.id);
                    return (
                      <div
                        key={nextTrack.id}
                        onClick={() => originalTrack && playTrack(originalTrack)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition group"
                      >
                        <div className="relative">
                          <img
                            src={nextTrack.albumArt}
                            alt="Track"
                            className="w-8 h-8 rounded"
                          />
                          <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <i className="fas fa-play text-white text-[8px]"></i>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs truncate group-hover:text-purple-300 transition">{nextTrack.title}</div>
                          <div className="text-white/50 text-xs truncate">{nextTrack.artist}</div>
                        </div>
                        <div className="text-white/50 text-xs">{nextTrack.duration}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
