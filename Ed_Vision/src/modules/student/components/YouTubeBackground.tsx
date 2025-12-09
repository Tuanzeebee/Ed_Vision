import { useEffect, useRef } from 'react';

type Props = {
  videoId: string;
  start?: number;
  end?: number;
  className?: string;
  muted?: boolean;
  volume?: number;
};

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubeBackground({ videoId, start = 0, end, className = '', muted = true, volume = 70 }: Props) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [videoId]);

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

  const initializePlayer = () => {
    if (!containerRef.current) return;

    // Destroy existing player if any
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Create new player
    playerRef.current = new window.YT.Player(containerRef.current, {
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
        end: end,
        loop: 1,
        playlist: videoId, // Required for looping
        mute: 1, // Mute audio
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  const onPlayerReady = (event: any) => {
    if (muted) {
      event.target.mute();
    } else {
      event.target.unMute();
      event.target.setVolume(volume);
    }
    event.target.playVideo();
  };

  const onPlayerStateChange = (event: any) => {
    // When video ends, replay it (backup for loop)
    if (event.data === window.YT.PlayerState.ENDED) {
      event.target.seekTo(start || 0);
      event.target.playVideo();
    }
  };

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
