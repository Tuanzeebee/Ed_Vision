/**
 * YouTube Music Service for Frontend
 * Calls the backend API to fetch YouTube music data
 */

import type {
  YouTubeTrack,
  YouTubePlaylist,
  PodcastShow,
  PodcastEpisode,
  YouTubeArtist,
  SearchTracksResponse,
  TopChartsResponse,
  PlaylistResponse,
  PodcastsResponse,
  HomeHeroResponse,
  RecentlyPlayedTrack,
  MUSIC_STORAGE_KEYS,
} from '../types/youtubeTypes';
import { API_BASE_URL } from '@/services/api/config';

/**
 * Generic fetch helper with error handling
 */
async function fetchApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API error: ${response.status} - ${errorText}`);
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Search for music tracks
 */
export async function searchTracks(
  query: string,
  pageToken?: string,
  maxResults = 20,
): Promise<SearchTracksResponse> {
  return fetchApi<SearchTracksResponse>('/api/music/search', {
    q: query,
    pageToken: pageToken || '',
    maxResults: maxResults.toString(),
  });
}

/**
 * Get top music charts for a region
 */
export async function fetchTopCharts(
  regionCode = 'VN',
  pageToken?: string,
  maxResults = 20,
): Promise<TopChartsResponse> {
  return fetchApi<TopChartsResponse>('/api/music/top-charts', {
    regionCode,
    pageToken: pageToken || '',
    maxResults: maxResults.toString(),
  });
}

/**
 * Get home hero content (featured track + top artists)
 */
export async function fetchHomeHero(regionCode = 'VN'): Promise<HomeHeroResponse> {
  return fetchApi<HomeHeroResponse>('/api/music/home-hero', {
    regionCode,
  });
}

/**
 * Get a playlist with its tracks
 */
export async function fetchPlaylist(
  playlistId: string,
  pageToken?: string,
  maxResults = 50,
): Promise<PlaylistResponse> {
  return fetchApi<PlaylistResponse>(`/api/music/playlist/${playlistId}`, {
    pageToken: pageToken || '',
    maxResults: maxResults.toString(),
  });
}

/**
 * Get podcast shows and episodes
 */
export async function fetchPodcasts(maxResults = 10): Promise<PodcastsResponse> {
  return fetchApi<PodcastsResponse>('/api/music/podcasts', {
    maxResults: maxResults.toString(),
  });
}

// ============ Local Storage Utilities ============

const STORAGE_KEYS = {
  RECENTLY_PLAYED: 'youtube_music_recently_played',
  LIKED_TRACKS: 'youtube_music_liked_tracks',
  VOLUME: 'youtube_music_volume',
} as const;

/**
 * Get recently played tracks from local storage
 */
export function getRecentlyPlayed(limit = 10): RecentlyPlayedTrack[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
    if (!stored) return [];
    
    const tracks: RecentlyPlayedTrack[] = JSON.parse(stored);
    return tracks.slice(0, limit).map(track =>({
      ...track,
      playedAt: new Date(track.playedAt),
    }));
  } catch (error) {
    console.error('Error reading recently played:', error);
    return [];
  }
}

/**
 * Add a track to recently played
 */
export function addToRecentlyPlayed(track: YouTubeTrack): void {
  try {
    const existing = getRecentlyPlayed(50);
    
    // Remove if already exists
    const filtered = existing.filter(t =>t.id !== track.id);
    
    // Add to front
    const newTrack: RecentlyPlayedTrack = {
      ...track,
      playedAt: new Date(),
    };
    
    const updated = [newTrack, ...filtered].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recently played:', error);
  }
}

/**
 * Get liked tracks from local storage
 */
export function getLikedTracks(): YouTubeTrack[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LIKED_TRACKS);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading liked tracks:', error);
    return [];
  }
}

/**
 * Check if a track is liked
 */
export function isTrackLiked(trackId: string): boolean {
  const liked = getLikedTracks();
  return liked.some(t =>t.id === trackId);
}

/**
 * Toggle like status for a track
 */
export function toggleLikeTrack(track: YouTubeTrack): boolean {
  try {
    const existing = getLikedTracks();
    const isLiked = existing.some(t =>t.id === track.id);
    
    let updated: YouTubeTrack[];
    if (isLiked) {
      updated = existing.filter(t =>t.id !== track.id);
    } else {
      updated = [track, ...existing];
    }
    
    localStorage.setItem(STORAGE_KEYS.LIKED_TRACKS, JSON.stringify(updated));
    return !isLiked;
  } catch (error) {
    console.error('Error toggling like:', error);
    return false;
  }
}

/**
 * Get saved volume level
 */
export function getSavedVolume(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.VOLUME);
    if (!stored) return 0.7;
    return parseFloat(stored);
  } catch (error) {
    return 0.7;
  }
}

/**
 * Save volume level
 */
export function saveVolume(volume: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
  } catch (error) {
    console.error('Error saving volume:', error);
  }
}

// ============ Utility Functions ============

/**
 * Format view count to human readable (e.g., "1.2M")
 */
export function formatViewCount(count?: number): string {
  if (!count) return '';
  
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B Plays`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M Plays`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K Plays`;
  }
  return `${count} Plays`;
}

/**
 * Get relative time string (e.g., "5 min ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays >1 ? 's': ''} ago`;
  
  return date.toLocaleDateString();
}

/**
 * Get YouTube thumbnail URL with specified quality
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'default'| 'medium'| 'high'| 'standard'| 'maxres'= 'high',
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality === 'medium'? 'mqdefault': quality === 'high'? 'hqdefault': quality === 'standard'? 'sddefault': quality === 'maxres'? 'maxresdefault': 'default'}.jpg`;
}

/**
 * Convert YouTubeTrack to format compatible with existing Track type
 */
export function toCompatibleTrack(track: YouTubeTrack): {
  id: string;
  title: string;
  artist: string;
  duration: string;
  albumArt: string;
  source: 'youtube';
  externalUrl: string;
} {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    duration: track.duration || '0:00',
    albumArt: track.imageUrl || getYouTubeThumbnail(track.id),
    source: 'youtube',
    externalUrl: track.externalUrl,
  };
}

// Export types for convenience
export type {
  YouTubeTrack,
  YouTubePlaylist,
  PodcastShow,
  PodcastEpisode,
  YouTubeArtist,
  SearchTracksResponse,
  TopChartsResponse,
  PlaylistResponse,
  PodcastsResponse,
  HomeHeroResponse,
  RecentlyPlayedTrack,
};
