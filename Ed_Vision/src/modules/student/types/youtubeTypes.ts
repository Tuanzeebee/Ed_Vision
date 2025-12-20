// YouTube Music types for the Music module
// These types abstract away the raw YouTube API responses

export type MusicProvider = 'youtube';

/**
 * A track represents a single music video from YouTube
 */
export interface YouTubeTrack {
  id: string;              // YouTube videoId
  provider: MusicProvider;
  title: string;
  artist: string;          // channelTitle or parsed from title
  album?: string;
  durationMs?: number;
  duration?: string;       // Formatted duration string (e.g., "3:45")
  imageUrl?: string;       // Thumbnail URL
  externalUrl: string;     // https://www.youtube.com/watch?v=...
  channelId?: string;
  publishedAt?: string;
  viewCount?: number;
}

/**
 * A playlist from YouTube
 */
export interface YouTubePlaylist {
  id: string;              // playlistId
  title: string;
  description?: string;
  imageUrl?: string;
  trackCount?: number;
  channelTitle?: string;
  externalUrl: string;
}

/**
 * A podcast show (represented as a YouTube channel or playlist)
 */
export interface PodcastShow {
  id: string;              // channelId or playlistId
  title: string;
  channelTitle: string;
  description?: string;
  imageUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  externalUrl: string;
}

/**
 * A podcast episode (represented as a YouTube video)
 */
export interface PodcastEpisode {
  id: string;              // videoId
  title: string;
  showTitle: string;
  showId?: string;
  description?: string;
  imageUrl?: string;
  durationMs?: number;
  duration?: string;
  publishedAt?: string;
  externalUrl: string;
}

/**
 * Artist derived from YouTube channel
 */
export interface YouTubeArtist {
  id: string;              // channelId
  name: string;
  imageUrl?: string;
  subscriberCount?: string;
  videoCount?: number;
  externalUrl: string;
}

/**
 * API response types
 */
export interface SearchTracksResponse {
  tracks: YouTubeTrack[];
  nextPageToken: string | null;
  totalResults?: number;
}

export interface TopChartsResponse {
  tracks: YouTubeTrack[];
  nextPageToken: string | null;
}

export interface PlaylistResponse {
  playlist: YouTubePlaylist;
  tracks: YouTubeTrack[];
  nextPageToken: string | null;
}

export interface PodcastsResponse {
  shows: PodcastShow[];
  episodes: PodcastEpisode[];
}

export interface HomeHeroResponse {
  track: YouTubeTrack;
  artists: YouTubeArtist[];
}

/**
 * Player state for YouTube IFrame API
 */
export type PlayerState = 
  | 'unstarted'
  | 'ended'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'cued';

export interface PlayerStatus {
  state: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  videoId: string | null;
}

/**
 * Recently played track with timestamp
 */
export interface RecentlyPlayedTrack extends YouTubeTrack {
  playedAt: Date;
}

/**
 * Local storage keys for music module
 */
export const MUSIC_STORAGE_KEYS = {
  RECENTLY_PLAYED: 'youtube_music_recently_played',
  LIKED_TRACKS: 'youtube_music_liked_tracks',
  PLAYLISTS: 'youtube_music_playlists',
  VOLUME: 'youtube_music_volume',
} as const;

/**
 * Utility type for converting existing Track type to YouTubeTrack
 */
export function toYouTubeTrack(track: {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  albumArt?: string;
  imageUrl?: string;
}): YouTubeTrack {
  return {
    id: track.id,
    provider: 'youtube',
    title: track.title,
    artist: track.artist,
    duration: track.duration,
    imageUrl: track.imageUrl || track.albumArt,
    externalUrl: `https://www.youtube.com/watch?v=${track.id}`,
  };
}

/**
 * Format duration from milliseconds to string (e.g., "3:45")
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parse ISO 8601 duration to milliseconds (e.g., "PT3M45S" -> 225000)
 */
export function parseIsoDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}
