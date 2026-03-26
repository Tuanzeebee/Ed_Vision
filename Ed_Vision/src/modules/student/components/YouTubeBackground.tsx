import { useEffect, useRef, useCallback } from 'react';

type Props = {
  videoId: string;
  start?: number;
  end?: number;
  className?: string;
  muted?: boolean;
  volume?: number;
};

// YouTube Player types for background video (local interface to avoid conflict)
interface YTBackgroundPlayer {
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  playVideo: () => void;
  seekTo: (seconds: number) => void;
}

interface YTBackgroundPlayerEvent {
  target: YTBackgroundPlayer;
  data?: number;
}

export default function YouTubeBackground({ videoId, start = 0, end, className = '', muted = true, volume = 70 }: Props) {
  const playerRef = useRef<YTBackgroundPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerId = useRef(`yt-bg-${videoId}-${Date.now()}`);

  const onPlayerReady = useCallback((event: YTBackgroundPlayerEvent) => {
    if (muted) {
      event.target.mute();
    } else {
      event.target.unMute();
      event.target.setVolume(volume);
    }
    event.target.playVideo();
  }, [muted, volume]);

  const onPlayerStateChange = useCallback((event: YTBackgroundPlayerEvent) => {
    // When video ends, replay it (backup for loop)
    if (event.data === window.YT?.PlayerState?.ENDED) {
      event.target.seekTo(start || 0);
      event.target.playVideo();
    }
  }, [start]);

  const initializePlayer = useCallback(() => {
    if (!containerRef.current) return;

    // Set the id on the container for YouTube API
    containerRef.current.id = playerContainerId.current;

    // Destroy existing player if any
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Create new player using element ID (string) - cast to our local type
    playerRef.current = new window.YT.Player(playerContainerId.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
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
        start: start,
        end: end || 0,
        loop: 1,
        playlist: videoId, // Required for looping
        mute: 1, // Mute audio
      },
      events: {
        onReady: onPlayerReady as (event: { target: unknown }) => void,
        onStateChange: onPlayerStateChange as (event: { data: number; target: unknown }) => void,
      },
    }) as unknown as YTBackgroundPlayer;
  }, [videoId, start, end, onPlayerReady, onPlayerStateChange]);

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [initializePlayer]);

  // Handle mute/unmute when prop changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.mute && playerRef.current.unMute) {
      if (muted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume); // Set to specified volume when unmuted
      }
    }
  }, [muted, volume]);

  return (
    <div className={`youtube-background ${className}`}>
      <div 
        ref={containerRef}
        className="youtube-player"
      />
      <style>{`
        .youtube-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: -1;
          pointer-events: none;
        }
        
        .youtube-player {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          /* Cover entire screen while maintaining aspect ratio */
          width: 100vw;
          height: 56.25vw; /* 16:9 aspect ratio */
          min-height: 100vh;
          min-width: 177.77vh; /* 16:9 aspect ratio */
        }

        .youtube-player iframe {
          width: 100%;
          height: 100%;
        }

        /* Dark overlay for better text readability */
        .youtube-background::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.3);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
