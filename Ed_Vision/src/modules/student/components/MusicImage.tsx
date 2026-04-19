/**
 * MusicImage - Reusable image component with fallback handling for music thumbnails
 * Handles broken images, loading states, and provides a consistent fallback
 */

import { useState, useCallback } from 'react';

interface MusicImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  showGradient?: boolean;
}

interface VinylSleeveImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: string;
  revealOnHover?: boolean;
  loading?: 'lazy' | 'eager';
  showShadow?: boolean;
}

// Default fallback gradient background
const FALLBACK_GRADIENT = 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400';

/**
 * Get YouTube thumbnail with fallback quality levels
 */
function getYouTubeThumbnail(videoId: string, quality: 'maxres' | 'hq' | 'mq' | 'default' = 'hq'): string {
  const qualityMap = {
    maxres: 'maxresdefault',
    hq: 'hqdefault',
    mq: 'mqdefault',
    default: 'default',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Extract YouTube video ID from various URL formats or direct ID
 */
function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  
  // Already a video ID (11 characters, alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
    return urlOrId;
  }
  
  // Extract from YouTube URL
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /img\.youtube\.com\/vi\/([a-zA-Z0-9_-]{11})/,
    /i\.ytimg\.com\/vi\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = urlOrId.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Check if URL is a valid image URL
 */
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.includes('placeholder.com')) return false;
  if (url === '') return false;
  return true;
}

export default function MusicImage({
  src,
  alt,
  className = '',
  fallbackIcon = 'fa-music',
  showGradient = true,
}: MusicImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Process source URL
  const processedSrc = useCallback(() => {
    if (!isValidImageUrl(src)) return null;
    
    const youtubeId = extractYouTubeId(src!);
    if (youtubeId) {
      // Try different quality levels based on retry count
      const qualities: ('hq' | 'mq' | 'default')[] = ['hq', 'mq', 'default'];
      const quality = qualities[Math.min(retryCount, qualities.length - 1)];
      return getYouTubeThumbnail(youtubeId, quality);
    }
    
    return src;
  }, [src, retryCount]);

  // Initialize or update src
  const imgSrc = processedSrc();

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    if (retryCount < 2 && extractYouTubeId(src || '')) {
      // Try lower quality YouTube thumbnail
      setRetryCount(prev => prev + 1);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [retryCount, src]);

  // Show fallback if no valid source or error occurred
  const showFallback = !imgSrc || hasError;

  if (showFallback) {
    return (
      <div 
        className={`${className} ${showGradient ? FALLBACK_GRADIENT : 'bg-white/10'} flex items-center justify-center`}
        title={alt}
      >
        <i className={`fas ${fallbackIcon} text-white/60`} style={{ fontSize: 'clamp(12px, 30%, 24px)' }}></i>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className={`absolute inset-0 ${FALLBACK_GRADIENT} animate-pulse`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        </div>
      )}
      
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}

/**
 * Vinyl sleeve styled album cover inspired by portfolio-like record reveal hover.
 */
export function VinylSleeveImage({
  src,
  alt,
  className = '',
  fallbackIcon = 'fa-music',
  revealOnHover = true,
  loading = 'lazy',
  showShadow = true,
}: VinylSleeveImageProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const resolveSrc = useCallback(() => {
    if (!isValidImageUrl(src)) return null;

    const youtubeId = extractYouTubeId(src!);
    if (youtubeId) {
      const qualities: ('hq' | 'mq' | 'default')[] = ['hq', 'mq', 'default'];
      return getYouTubeThumbnail(youtubeId, qualities[Math.min(retryCount, qualities.length - 1)]);
    }

    return src;
  }, [src, retryCount]);

  const handleError = useCallback(() => {
    if (retryCount < 2 && extractYouTubeId(src || '')) {
      setRetryCount((prev) => prev + 1);
      return;
    }
    setHasError(true);
  }, [retryCount, src]);

  const imageSrc = resolveSrc();
  const showFallback = !imageSrc || hasError;
  const sleeveHoverClass = revealOnHover
    ? 'hover:-translate-x-[3%] hover:-rotate-[1.4deg]'
    : '';
  const recordHoverClass = revealOnHover
    ? 'peer-hover/cover:translate-x-[16%] peer-hover/cover:rotate-[14deg]'
    : 'translate-x-[8%] rotate-[6deg]';
  const sleeveShadowClass = showShadow ? 'shadow-[0_10px_26px_rgba(0,0,0,0.45)]' : '';
  const recordShadowClass = showShadow ? 'shadow-[0_14px_28px_rgba(0,0,0,0.55)]' : 'shadow-none';

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div
        className={`peer/cover relative z-10 h-full w-[84%] overflow-hidden rounded-xl border border-white/20 bg-zinc-900 transition-transform duration-300 ease-[cubic-bezier(0.44,0,0.56,1)] ${sleeveHoverClass} ${sleeveShadowClass}`}
      >
        {showFallback ? (
          <div className={`absolute inset-0 ${FALLBACK_GRADIENT} flex items-center justify-center`} title={alt}>
            <i className={`fas ${fallbackIcon} text-white/60`} style={{ fontSize: 'clamp(12px, 32%, 24px)' }}></i>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={alt}
            className="h-full w-full object-cover"
            onError={handleError}
            loading={loading}
            draggable={false}
          />
        )}
      </div>

      <div
        className={`pointer-events-none absolute inset-y-[5%] right-[2%] z-0 w-[78%] rounded-full bg-zinc-950 transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.1,1)] ${recordHoverClass} ${recordShadowClass}`}
        style={{
          backgroundImage:
            'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.28) 0 6%, rgba(255,255,255,0.03) 28%, rgba(0,0,0,0.36) 78%), repeating-radial-gradient(circle at center, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.25) 1px 3px)',
        }}
      >
        <div className="absolute left-1/2 top-1/2 h-[19%] w-[19%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-zinc-200/80"></div>
        <div className="absolute left-1/2 top-1/2 h-[5%] w-[5%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900"></div>
      </div>
    </div>
  );
}

/**
 * Simple inline image with error handling - for cases where a wrapper div isn't desired
 */
export function MusicImageInline({
  src,
  alt,
  className = '',
  fallbackSrc = '',
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError) {
      // Try YouTube fallback if it's a YouTube URL
      const youtubeId = extractYouTubeId(src || '');
      if (youtubeId && !imgSrc?.includes('default.jpg')) {
        setImgSrc(getYouTubeThumbnail(youtubeId, 'default'));
      } else if (fallbackSrc && imgSrc !== fallbackSrc) {
        setImgSrc(fallbackSrc);
      }
      setHasError(true);
    }
  }, [src, fallbackSrc, imgSrc, hasError]);

  // Update when src changes
  if (src !== imgSrc && !hasError) {
    setImgSrc(src || fallbackSrc);
  }

  return (
    <img
      src={imgSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23374151" width="100" height="100"/%3E%3Ctext x="50" y="55" text-anchor="middle" fill="%239CA3AF" font-size="30"%3E♪%3C/text%3E%3C/svg%3E'}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
