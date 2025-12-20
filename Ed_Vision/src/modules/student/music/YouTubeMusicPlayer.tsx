/**
 * YouTube Music Player Component
 * Uses YouTube IFrame Player API for legal audio playback
 * Player is hidden (1x1 pixel) - audio only
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

// YouTube Player API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string | number;
          width: string | number;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
  setVolume: (volume: number) => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

export interface YouTubeMusicPlayerRef {
  play: (videoId: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}

interface Props {
  onStateChange?: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (errorCode: number) => void;
  onReady?: () => void;
  initialVolume?: number;
}

const YouTubeMusicPlayer = forwardRef<YouTubeMusicPlayerRef, Props>(
  ({ onStateChange, onTimeUpdate, onError, onReady, initialVolume = 70 }, ref) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeUpdateIntervalRef = useRef<number | null>(null);
    const isReadyRef = useRef(false);
    const pendingVideoIdRef = useRef<string | null>(null);

    // Load YouTube IFrame API
    useEffect(() => {
      // Check if API is already loaded
      if (window.YT && window.YT.Player) {
        initializePlayer();
        return;
      }

      // Load the API script
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Set up callback
      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };

      return () => {
        if (timeUpdateIntervalRef.current) {
          clearInterval(timeUpdateIntervalRef.current);
        }
        if (playerRef.current) {
          playerRef.current.destroy();
        }
      };
    }, []);

    const initializePlayer = useCallback(() => {
      if (!containerRef.current || playerRef.current) return;

      const playerId = `yt-player-${Date.now()}`;
      const playerDiv = document.createElement('div');
      playerDiv.id = playerId;
      containerRef.current.appendChild(playerDiv);

      playerRef.current = new window.YT.Player(playerId, {
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
          showinfo: 0,
        },
        events: {
          onReady: handlePlayerReady,
          onStateChange: handleStateChange,
          onError: handleError,
        },
      });
    }, []);

    const handlePlayerReady = useCallback((event: { target: YTPlayer }) => {
      isReadyRef.current = true;
      event.target.setVolume(initialVolume);
      onReady?.();

      // If there was a pending video, play it now
      if (pendingVideoIdRef.current) {
        event.target.loadVideoById(pendingVideoIdRef.current);
        pendingVideoIdRef.current = null;
      }

      // Start time update interval
      timeUpdateIntervalRef.current = window.setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (duration > 0) {
            onTimeUpdate?.(currentTime, duration);
          }
        }
      }, 1000);
    }, [initialVolume, onReady, onTimeUpdate]);

    const handleStateChange = useCallback((event: { data: number }) => {
      const stateMap: Record<number, 'playing' | 'paused' | 'ended' | 'buffering'> = {
        [window.YT?.PlayerState?.PLAYING ?? 1]: 'playing',
        [window.YT?.PlayerState?.PAUSED ?? 2]: 'paused',
        [window.YT?.PlayerState?.ENDED ?? 0]: 'ended',
        [window.YT?.PlayerState?.BUFFERING ?? 3]: 'buffering',
      };
      const state = stateMap[event.data];
      if (state) {
        onStateChange?.(state);
      }
    }, [onStateChange]);

    const handleError = useCallback((event: { data: number }) => {
      console.error('YouTube Player Error:', event.data);
      onError?.(event.data);
    }, [onError]);

    // Expose player methods via ref
    useImperativeHandle(ref, () => ({
      play: (videoId: string) => {
        if (playerRef.current && isReadyRef.current) {
          playerRef.current.loadVideoById(videoId);
        } else {
          pendingVideoIdRef.current = videoId;
        }
      },
      pause: () => {
        playerRef.current?.pauseVideo();
      },
      resume: () => {
        playerRef.current?.playVideo();
      },
      stop: () => {
        playerRef.current?.stopVideo();
      },
      seekTo: (seconds: number) => {
        playerRef.current?.seekTo(seconds, true);
      },
      setVolume: (volume: number) => {
        playerRef.current?.setVolume(Math.max(0, Math.min(100, volume)));
      },
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime() ?? 0;
      },
      getDuration: () => {
        return playerRef.current?.getDuration() ?? 0;
      },
      isPlaying: () => {
        return playerRef.current?.getPlayerState() === window.YT?.PlayerState?.PLAYING;
      },
    }), []);

    return (
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
    );
  }
);

YouTubeMusicPlayer.displayName = 'YouTubeMusicPlayer';

export default YouTubeMusicPlayer;
