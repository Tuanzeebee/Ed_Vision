/**
 * Music Player Context
 * Manages global player state and recently played tracks
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Track } from './mockData';
import YouTubeMusicPlayer from './YouTubeMusicPlayer';
import type { YouTubeMusicPlayerRef } from './YouTubeMusicPlayer';

// Storage keys
const STORAGE_KEYS = {
  RECENTLY_PLAYED: 'music_recently_played',
  LIKED_TRACKS: 'music_liked_tracks',
  VOLUME: 'music_volume',
} as const;

export interface RecentlyPlayedTrack extends Track {
  playedAt: Date;
}

interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isBuffering: boolean;
  queue: Track[];
  recentlyPlayed: RecentlyPlayedTrack[];
  likedTracks: Track[];
}

interface MusicPlayerContextValue extends MusicPlayerState {
  // Playback controls
  playTrack: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  
  // Queue management
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  
  // Liked tracks
  toggleLike: (track: Track) => boolean;
  isLiked: (trackId: string) => boolean;
  
  // Recently played
  getRecentlyPlayed: (limit?: number) => RecentlyPlayedTrack[];
  clearRecentlyPlayed: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const playerRef = useRef<YouTubeMusicPlayerRef>(null);
  
  // State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOLUME);
      return saved ? parseInt(saved, 10) : 70;
    } catch {
      return 70;
    }
  });
  const [isBuffering, setIsBuffering] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((t: RecentlyPlayedTrack) => ({
          ...t,
          playedAt: new Date(t.playedAt),
        }));
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [likedTracks, setLikedTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIKED_TRACKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // History for previous track
  const playHistoryRef = useRef<Track[]>([]);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(recentlyPlayed));
    } catch {
      // ignore
    }
  }, [recentlyPlayed]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_TRACKS, JSON.stringify(likedTracks));
    } catch {
      // ignore
    }
  }, [likedTracks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    } catch {
      // ignore
    }
  }, [volume]);

  // Add to recently played
  const addToRecentlyPlayed = useCallback((track: Track) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const newTrack: RecentlyPlayedTrack = {
        ...track,
        playedAt: new Date(),
      };
      return [newTrack, ...filtered].slice(0, 50);
    });
  }, []);

  // Playback controls
  const playTrack = useCallback((track: Track) => {
    if (currentTrack) {
      playHistoryRef.current.push(currentTrack);
      if (playHistoryRef.current.length > 50) {
        playHistoryRef.current.shift();
      }
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    addToRecentlyPlayed(track);
    
    playerRef.current?.play(track.id);
  }, [currentTrack, addToRecentlyPlayed]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(true);
      playerRef.current?.resume();
    }
  }, [currentTrack]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    playerRef.current?.stop();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    playerRef.current?.seekTo(seconds);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clampedVolume = Math.max(0, Math.min(100, vol));
    setVolumeState(clampedVolume);
    playerRef.current?.setVolume(clampedVolume);
  }, []);

  // Queue management
  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const playNext = useCallback(() => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(nextTrack);
    }
  }, [queue, playTrack]);

  const playPrevious = useCallback(() => {
    if (playHistoryRef.current.length > 0) {
      const prevTrack = playHistoryRef.current.pop();
      if (prevTrack) {
        if (currentTrack) {
          setQueue(prev => [currentTrack, ...prev]);
        }
        setCurrentTrack(prevTrack);
        setIsPlaying(true);
        playerRef.current?.play(prevTrack.id);
      }
    }
  }, [currentTrack]);

  // Liked tracks
  const toggleLike = useCallback((track: Track) => {
    const isCurrentlyLiked = likedTracks.some(t => t.id === track.id);
    
    if (isCurrentlyLiked) {
      setLikedTracks(prev => prev.filter(t => t.id !== track.id));
    } else {
      setLikedTracks(prev => [track, ...prev]);
    }
    
    return !isCurrentlyLiked;
  }, [likedTracks]);

  const isLiked = useCallback((trackId: string) => {
    return likedTracks.some(t => t.id === trackId);
  }, [likedTracks]);

  // Recently played
  const getRecentlyPlayed = useCallback((limit = 10) => {
    return recentlyPlayed.slice(0, limit);
  }, [recentlyPlayed]);

  const clearRecentlyPlayed = useCallback(() => {
    setRecentlyPlayed([]);
  }, []);

  // Player event handlers
  const handleStateChange = useCallback((state: 'playing' | 'paused' | 'ended' | 'buffering') => {
    setIsBuffering(state === 'buffering');
    
    if (state === 'playing') {
      setIsPlaying(true);
    } else if (state === 'paused') {
      setIsPlaying(false);
    } else if (state === 'ended') {
      setIsPlaying(false);
      // Auto play next in queue
      if (queue.length > 0) {
        playNext();
      }
    }
  }, [queue.length, playNext]);

  const handleTimeUpdate = useCallback((time: number, dur: number) => {
    setCurrentTime(time);
    setDuration(dur);
  }, []);

  const contextValue: MusicPlayerContextValue = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isBuffering,
    queue,
    recentlyPlayed,
    likedTracks,
    playTrack,
    pause,
    resume,
    stop,
    seekTo,
    setVolume,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    playPrevious,
    toggleLike,
    isLiked,
    getRecentlyPlayed,
    clearRecentlyPlayed,
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
      <YouTubeMusicPlayer
        ref={playerRef}
        onStateChange={handleStateChange}
        onTimeUpdate={handleTimeUpdate}
        initialVolume={volume}
      />
    </MusicPlayerContext.Provider>
  );
}

export default MusicPlayerContext;
