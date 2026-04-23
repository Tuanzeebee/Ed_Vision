/**
 * Music Player Context
 * Manages global player state and recently played tracks
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Track, Playlist } from './mockData';
import YouTubeMusicPlayer from './YouTubeMusicPlayer';
import type { YouTubeMusicPlayerRef } from './YouTubeMusicPlayer';

// Storage keys
const STORAGE_KEYS = {
  RECENTLY_PLAYED: 'music_recently_played',
  LIKED_TRACKS: 'music_liked_tracks',
  PLAYLISTS: 'music_playlists',
  REPEAT_MODE: 'music_repeat_mode',
  VOLUME: 'music_volume',
} as const;

export type RepeatMode = 'off' | 'all' | 'one';

const DEFAULT_PLAYLIST_ID = 'playlist-my-music';
const DEFAULT_PLAYLIST: Playlist = {
  id: DEFAULT_PLAYLIST_ID,
  title: 'My Playlist',
  description: 'Tracks you saved from the player',
  imageUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
  tracks: [],
  createdBy: 'You',
};

export interface RecentlyPlayedTrack extends Track {
  playedAt: Date;
}

interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isBuffering: boolean;
  queue: Track[];
  recentlyPlayed: RecentlyPlayedTrack[];
  likedTracks: Track[];
  playlists: Playlist[];
}

interface MusicPlayerContextValue extends MusicPlayerState {
  // Playback controls
  playTrack: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  cycleRepeatMode: () => void;
  
  // Queue management
  addToQueue: (track: Track) =>void;
  removeFromQueue: (trackId: string) =>void;
  clearQueue: () =>void;
  playNext: () =>void;
  playPrevious: () =>void;
  
  // Liked tracks
  toggleLike: (track: Track) => boolean;
  isLiked: (trackId: string) => boolean;

  // Playlists
  addTrackToPlaylist: (track: Track, playlistId?: string) => void;
  isTrackInPlaylist: (trackId: string, playlistId?: string) => boolean;
  
  // Recently played
  getRecentlyPlayed: (limit?: number) =>RecentlyPlayedTrack[];
  clearRecentlyPlayed: () =>void;
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
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPEAT_MODE);
      if (saved === 'all' || saved === 'one' || saved === 'off') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'off';
  });
  const [isBuffering, setIsBuffering] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((t: RecentlyPlayedTrack) =>({
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
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (saved) {
        const parsed = JSON.parse(saved) as Playlist[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [DEFAULT_PLAYLIST];
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
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch {
      // ignore
    }
  }, [playlists]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPEAT_MODE, repeatMode);
    } catch {
      // ignore
    }
  }, [repeatMode]);

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
      const filtered = prev.filter(t =>t.id !== track.id);
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
      if (playHistoryRef.current.length >50) {
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

  const cycleRepeatMode = useCallback(() => {
    setRepeatModeState(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  // Queue management
  const addToQueue = useCallback((track: Track) => {
    setQueue(prev =>[...prev, track]);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev =>prev.filter(t =>t.id !== trackId));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const playNext = useCallback(() => {
    if (queue.length >0) {
      const nextTrack = queue[0];
      setQueue(prev =>prev.slice(1));
      playTrack(nextTrack);
    }
  }, [queue, playTrack]);

  const playPrevious = useCallback(() => {
    if (playHistoryRef.current.length >0) {
      const prevTrack = playHistoryRef.current.pop();
      if (prevTrack) {
        if (currentTrack) {
          setQueue(prev =>[currentTrack, ...prev]);
        }
        setCurrentTrack(prevTrack);
        setIsPlaying(true);
        playerRef.current?.play(prevTrack.id);
      }
    }
  }, [currentTrack]);

  // Liked tracks
  const toggleLike = useCallback((track: Track) => {
    const isCurrentlyLiked = likedTracks.some(t =>t.id === track.id);
    
    if (isCurrentlyLiked) {
      setLikedTracks(prev =>prev.filter(t =>t.id !== track.id));
    } else {
      setLikedTracks(prev =>[track, ...prev]);
    }
    
    return !isCurrentlyLiked;
  }, [likedTracks]);

  const isLiked = useCallback((trackId: string) => {
    return likedTracks.some(t =>t.id === trackId);
  }, [likedTracks]);

  // Playlist management
  const addTrackToPlaylist = useCallback((track: Track, playlistId = DEFAULT_PLAYLIST_ID) => {
    setPlaylists(prev => {
      const targetPlaylist = prev.find(playlist => playlist.id === playlistId) || prev[0];
      if (!targetPlaylist) {
        return prev;
      }

      const alreadyAdded = targetPlaylist.tracks.some(playlistTrack => playlistTrack.id === track.id);
      if (alreadyAdded) {
        return prev;
      }

      return prev.map(playlist => {
        if (playlist.id !== targetPlaylist.id) {
          return playlist;
        }

        return {
          ...playlist,
          imageUrl: track.imageUrl || playlist.imageUrl,
          tracks: [track, ...playlist.tracks],
        };
      });
    });
  }, []);

  const isTrackInPlaylist = useCallback((trackId: string, playlistId = DEFAULT_PLAYLIST_ID) => {
    const targetPlaylist = playlists.find(playlist => playlist.id === playlistId) || playlists[0];
    if (!targetPlaylist) {
      return false;
    }
    return targetPlaylist.tracks.some(track => track.id === trackId);
  }, [playlists]);

  // Recently played
  const getRecentlyPlayed = useCallback((limit = 10) => {
    return recentlyPlayed.slice(0, limit);
  }, [recentlyPlayed]);

  const clearRecentlyPlayed = useCallback(() => {
    setRecentlyPlayed([]);
  }, []);

  const replayCurrentTrack = useCallback(() => {
    if (!currentTrack) {
      return;
    }

    setCurrentTime(0);
    setIsPlaying(true);
    playerRef.current?.play(currentTrack.id);
  }, [currentTrack]);

  // Player event handlers
  const handleStateChange = useCallback((state: 'playing'| 'paused'| 'ended'| 'buffering') => {
    setIsBuffering(state === 'buffering');
    
    if (state === 'playing') {
      setIsPlaying(true);
    } else if (state === 'paused') {
      setIsPlaying(false);
    } else if (state === 'ended') {
      if (repeatMode === 'one') {
        replayCurrentTrack();
        return;
      }

      if (queue.length > 0) {
        playNext();
        return;
      }

      if (repeatMode === 'all') {
        replayCurrentTrack();
        return;
      }

      setIsPlaying(false);
    }
  }, [queue.length, playNext, repeatMode, replayCurrentTrack]);

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
    repeatMode,
    isBuffering,
    queue,
    recentlyPlayed,
    likedTracks,
    playlists,
    playTrack,
    pause,
    resume,
    stop,
    seekTo,
    setVolume,
    cycleRepeatMode,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext,
    playPrevious,
    toggleLike,
    isLiked,
    addTrackToPlaylist,
    isTrackInPlaylist,
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
    </MusicPlayerContext.Provider>);
}

export default MusicPlayerContext;
