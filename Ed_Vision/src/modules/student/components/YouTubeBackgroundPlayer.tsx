import { useEffect, useRef, useState } from 'react';
import type { LiveTheme } from '@/data/liveThemes';

type Props = {
  theme: LiveTheme | null;
  enabled: boolean;
  volume?: number;
  muted?: boolean;
  onReady?: () => void;
  onError?: (error: string) => void;
};

// Window.YT types declared in YouTubeMusicPlayer.tsx

export default function YouTubeBackgroundPlayer({ theme, enabled, volume = 30, muted = false, onReady, onError }: Props) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Load the IFrame Player API code asynchronously
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API ready callback
    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  // Initialize player when API is ready and theme is available
  useEffect(() => {
    if (!isAPIReady || !theme || !enabled) return;

    // Destroy existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error('Error destroying player:', e);
      }
      playerRef.current = null;
    }

    // Create new player
    try {
      playerRef.current = new window.YT.Player('youtube-background-player', {
        height: '100%',
        width: '100%',
        videoId: theme.youtubeVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          loop: 1,
          playlist: theme.youtubeVideoId, // Required for loop
          mute: 1, // Mute by default for autoplay
          start: theme.start || 0,
          ...(theme.end != null && { end: theme.end }),
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            event.target.setVolume(30); // Set initial volume to 30%
            if (onReady) onReady();
          },
          onStateChange: (event: any) => {
            // If video ends and we have end time, loop it
            if (event.data === window.YT.PlayerState.ENDED) {
              if (theme.start !== undefined) {
                event.target.seekTo(theme.start);
                event.target.playVideo();
              }
            }
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
            if (onError) {
              const errorMessages: { [key: number]: string } = {
                2: 'Invalid video ID',
                5: 'HTML5 player error',
                100: 'Video not found',
                101: 'Video not available',
                150: 'Video not available',
              };
              onError(errorMessages[event.data] || 'Unknown error');
            }
          },
        },
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
      if (onError) onError('Failed to create player');
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error in cleanup:', e);
        }
      }
    };
  }, [isAPIReady, theme, enabled, onReady, onError]);

  // Control visibility
  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      if (enabled && theme) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [enabled, theme, isPlayerReady]);

  // Control volume
  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      if (muted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      }
    }
  }, [volume, muted, isPlayerReady]);

  if (!enabled || !theme) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex: -1 }}
    >
      {/* YouTube Player Container */}
      <div
        id="youtube-background-player"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style={{
          // Scale to cover entire viewport while maintaining 16:9 aspect ratio
          width: 'max(100vw, 177.78vh)',
          height: 'max(100vh, 56.25vw)',
        }}
      />
      
      {/* Overlay for darkening/styling */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}
