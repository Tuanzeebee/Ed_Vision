/**
 * YouTube IFrame Player API Hook
 * Provides a React-friendly interface to the YouTube IFrame Player API
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { YouTubeTrack, PlayerState, PlayerStatus } from '../types/youtubeTypes';
import { addToRecentlyPlayed, getSavedVolume, saveVolume } from '../services/youtubeService';

// YouTube IFrame API types - use type assertions to avoid conflicts with other declarations
interface YTPlayerConfig {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    fs?: 0 | 1;
    iv_load_policy?: 1 | 3;
    modestbranding?: 0 | 1;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    origin?: string;
  };
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onError?: (event: { data: number }) => void;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getVideoData: () => { video_id: string; title: string; author: string };
  destroy: () => void;
}

interface YTApi {
  Player: new (elementId: string, config: YTPlayerConfig) => YTPlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

// Helper to get YT API from window
function getYTApi(): YTApi | null {
  return (window as unknown as { YT?: YTApi }).YT || null;
}

// Map YouTube player state numbers to readable strings
function mapPlayerState(state: number): PlayerState {
  switch (state) {
    case -1:
      return 'unstarted';
    case 0:
      return 'ended';
    case 1:
      return 'playing';
    case 2:
      return 'paused';
    case 3:
      return 'buffering';
    case 5:
      return 'cued';
    default:
      return 'unstarted';
  }
}

// Load YouTube IFrame API script
let apiLoadingPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiLoadingPromise) return apiLoadingPromise;

  const yt = getYTApi();
  if (yt && yt.Player) {
    return Promise.resolve();
  }

  apiLoadingPromise = new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      resolve();
    };
  });

  return apiLoadingPromise;
}

export interface UseYouTubePlayerOptions {
  containerId?: string;
  onStateChange?: (status: PlayerStatus) => void;
  onError?: (errorCode: number) => void;
  onTrackEnd?: () => void;
}

export interface UseYouTubePlayerReturn {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  currentTrack: YouTubeTrack | null;
  playerState: PlayerState;
  playTrack: (track: YouTubeTrack) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

export function useYouTubePlayer(
  options: UseYouTubePlayerOptions = {}
): UseYouTubePlayerReturn {
  const {
    containerId = 'yt-music-player',
    onStateChange,
    onError,
    onTrackEnd,
  } = options;

  const playerRef = useRef<YTPlayer | null>(null);
  const currentTrackRef = useRef<YouTubeTrack | null>(null);
  const timeUpdateIntervalRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(getSavedVolume() * 100);
  const [muted, setMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<YouTubeTrack | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('unstarted');

  // Initialize player
  useEffect(() => {
    let destroyed = false;

    async function initPlayer() {
      await loadYouTubeApi();

      if (destroyed) return;

      // Create container if it doesn't exist
      let container = document.getElementById(containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'fixed';
        container.style.bottom = '-1000px';
        container.style.left = '-1000px';
        container.style.width = '1px';
        container.style.height = '1px';
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
      }

      const yt = getYTApi();
      if (!yt) {
        console.error('YouTube API not loaded');
        return;
      }

      playerRef.current = new yt.Player(containerId, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setIsReady(true);
            // Set initial volume - check if method exists
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
              playerRef.current.setVolume(volume);
            }
          },
          onStateChange: (event) => {
            if (destroyed) return;
            const state = mapPlayerState(event.data);
            setPlayerState(state);
            setIsPlaying(state === 'playing');

            if (state === 'playing') {
              // Start time update interval
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
              }
              timeUpdateIntervalRef.current = window.setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                  setCurrentTime(playerRef.current.getCurrentTime());
                  setDuration(playerRef.current.getDuration());
                }
              }, 250);
            } else {
              // Clear interval when not playing
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
                timeUpdateIntervalRef.current = null;
              }
            }

            if (state === 'ended' && onTrackEnd) {
              onTrackEnd();
            }

            if (onStateChange && playerRef.current && typeof playerRef.current.getVideoData === 'function') {
              const videoData = playerRef.current.getVideoData();
              onStateChange({
                state,
                currentTime: typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : 0,
                duration: typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() : 0,
                volume: typeof playerRef.current.getVolume === 'function' ? playerRef.current.getVolume() : 0,
                muted: typeof playerRef.current.isMuted === 'function' ? playerRef.current.isMuted() : false,
                videoId: videoData?.video_id || null,
              });
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
            if (onError) {
              onError(event.data);
            }
          },
        },
      });
    }

    initPlayer();

    return () => {
      destroyed = true;
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [containerId]);

  // Play a track
  const playTrack = useCallback((track: YouTubeTrack) => {
    if (!playerRef.current || !isReady) {
      console.warn('Player not ready');
      return;
    }

    currentTrackRef.current = track;
    setCurrentTrack(track);
    setCurrentTime(0);
    
    if (typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(track.id);
    }
    
    // Add to recently played
    addToRecentlyPlayed(track);
  }, [isReady]);

  // Play
  const play = useCallback(() => {
    if (playerRef.current && isReady && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  }, [isReady]);

  // Pause
  const pause = useCallback(() => {
    if (playerRef.current && isReady && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
  }, [isReady]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);


  // Seek to time
  const seek = useCallback((seconds: number) => {
    if (playerRef.current && isReady && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    }
  }, [isReady]);

  // Set volume (0-100)
  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(100, vol));
    if (playerRef.current && isReady && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(clampedVol);
    }
    setVolumeState(clampedVol);
    saveVolume(clampedVol / 100);
  }, [isReady]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (playerRef.current && isReady) {
      if (muted && typeof playerRef.current.unMute === 'function') {
        playerRef.current.unMute();
      } else if (typeof playerRef.current.mute === 'function') {
        playerRef.current.mute();
      }
      setMuted(!muted);
    }
  }, [muted, isReady]);

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    currentTrack,
    playerState,
    playTrack,
    play,
    pause,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
  };
}

export default useYouTubePlayer;
