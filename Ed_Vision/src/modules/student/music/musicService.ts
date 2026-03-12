/**
 * Music Service - Giả lập API từ Mock Data
 * Dễ dàng thay thế bằng API thật sau này
 * Chỉ cần đổi implementation, giữ nguyên interface
 */

import type { Track, Album, Playlist, Artist, PodcastShow, PodcastEpisode, RecentlyPlayed, SearchResult } from './types';
import {
  TOP_TRACKS,
  LOFI_TRACKS,
  TOP_ARTISTS,
  PLAYLISTS,
  ALBUMS,
  PODCAST_SHOWS,
  PODCAST_EPISODES,
  HERO_TRACK,
  AVAILABLE_TAGS,
  ALL_TRACKS,
} from './mockData';

// Storage keys
const STORAGE_KEYS = {
  RECENTLY_PLAYED: 'music_recently_played',
  LIKED_TRACKS: 'music_liked_tracks',
  VOLUME: 'music_volume',
} as const;

/**
 * Music Service Object - Giả lập API calls
 */
export const musicService = {
  // ============ TRACKS ============
  
  /**
   * Get top tracks (Top Charts)
   */
  getTopTracks(limit?: number): Track[] {
    return limit ? TOP_TRACKS.slice(0, limit) : TOP_TRACKS;
  },

  /**
   * Get lofi/study tracks
   */
  getLofiTracks(limit?: number): Track[] {
    return limit ? LOFI_TRACKS.slice(0, limit) : LOFI_TRACKS;
  },

  /**
   * Get hero/featured track
   */
  getHeroTrack(): Track {
    return HERO_TRACK;
  },

  /**
   * Get track by ID
   */
  getTrackById(id: string): Track | undefined {
    return ALL_TRACKS.find(t => t.id === id);
  },

  // ============ ARTISTS ============

  /**
   * Get top artists
   */
  getTopArtists(limit?: number): Artist[] {
    return limit ? TOP_ARTISTS.slice(0, limit) : TOP_ARTISTS;
  },

  /**
   * Get artist by ID
   */
  getArtistById(id: string): Artist | undefined {
    return TOP_ARTISTS.find(a => a.id === id);
  },

  /**
   * Get tracks by artist name
   */
  getTracksByArtist(artistName: string): Track[] {
    return ALL_TRACKS.filter(t => 
      t.artist.toLowerCase().includes(artistName.toLowerCase())
    );
  },

  // ============ PLAYLISTS ============

  /**
   * Get all playlists
   */
  getPlaylists(limit?: number): Playlist[] {
    return limit ? PLAYLISTS.slice(0, limit) : PLAYLISTS;
  },

  /**
   * Get playlist by ID
   */
  getPlaylistById(id: string): Playlist | undefined {
    return PLAYLISTS.find(p => p.id === id);
  },

  // ============ ALBUMS ============

  /**
   * Get all albums
   */
  getAlbums(limit?: number): Album[] {
    return limit ? ALBUMS.slice(0, limit) : ALBUMS;
  },

  /**
   * Get album by ID
   */
  getAlbumById(id: string): Album | undefined {
    return ALBUMS.find(a => a.id === id);
  },

  // ============ PODCASTS ============

  /**
   * Get podcast shows
   */
  getPodcastShows(limit?: number): PodcastShow[] {
    return limit ? PODCAST_SHOWS.slice(0, limit) : PODCAST_SHOWS;
  },

  /**
   * Get podcast episodes
   */
  getPodcastEpisodes(limit?: number): PodcastEpisode[] {
    return limit ? PODCAST_EPISODES.slice(0, limit) : PODCAST_EPISODES;
  },

  /**
   * Get episodes by show
   */
  getEpisodesByShow(showName: string): PodcastEpisode[] {
    return PODCAST_EPISODES.filter(e => 
      e.show.toLowerCase().includes(showName.toLowerCase())
    );
  },

  // ============ SEARCH ============

  /**
   * Search tracks by keyword
   */
  searchTracks(keyword: string): Track[] {
    if (!keyword.trim()) return [];
    const lowerKeyword = keyword.toLowerCase();
    return ALL_TRACKS.filter(t =>
      t.title.toLowerCase().includes(lowerKeyword) ||
      t.artist.toLowerCase().includes(lowerKeyword) ||
      t.album?.toLowerCase().includes(lowerKeyword)
    );
  },

  /**
   * Search artists by keyword
   */
  searchArtists(keyword: string): Artist[] {
    if (!keyword.trim()) return [];
    const lowerKeyword = keyword.toLowerCase();
    return TOP_ARTISTS.filter(a =>
      a.name.toLowerCase().includes(lowerKeyword)
    );
  },

  /**
   * Search all (tracks, artists, albums, playlists)
   */
  searchAll(keyword: string): SearchResult {
    if (!keyword.trim()) {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }
    const lowerKeyword = keyword.toLowerCase();
    
    return {
      tracks: ALL_TRACKS.filter(t =>
        t.title.toLowerCase().includes(lowerKeyword) ||
        t.artist.toLowerCase().includes(lowerKeyword)
      ),
      artists: TOP_ARTISTS.filter(a =>
        a.name.toLowerCase().includes(lowerKeyword)
      ),
      albums: ALBUMS.filter(a =>
        a.title.toLowerCase().includes(lowerKeyword) ||
        a.artist.toLowerCase().includes(lowerKeyword)
      ),
      playlists: PLAYLISTS.filter(p =>
        p.title.toLowerCase().includes(lowerKeyword) ||
        p.description?.toLowerCase().includes(lowerKeyword)
      ),
    };
  },

  // ============ TAGS / GENRES ============

  /**
   * Get available tags
   */
  getAvailableTags(): string[] {
    return AVAILABLE_TAGS;
  },

  // ============ LOCAL STORAGE UTILITIES ============

  /**
   * Get recently played tracks
   */
  getRecentlyPlayed(limit = 10): RecentlyPlayed[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
      if (!stored) return [];
      
      const tracks: RecentlyPlayed[] = JSON.parse(stored);
      return tracks.slice(0, limit).map(track => ({
        ...track,
        playedAt: new Date(track.playedAt),
      }));
    } catch (error) {
      console.error('Error reading recently played:', error);
      return [];
    }
  },

  /**
   * Add track to recently played
   */
  addToRecentlyPlayed(track: Track): void {
    try {
      const existing = this.getRecentlyPlayed(50);
      
      // Remove if already exists
      const filtered = existing.filter(t => t.id !== track.id);
      
      // Add to front
      const newTrack: RecentlyPlayed = {
        ...track,
        playedAt: new Date(),
      };
      
      const updated = [newTrack, ...filtered].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recently played:', error);
    }
  },

  /**
   * Get liked tracks
   */
  getLikedTracks(): Track[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LIKED_TRACKS);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error reading liked tracks:', error);
      return [];
    }
  },

  /**
   * Check if track is liked
   */
  isTrackLiked(trackId: string): boolean {
    const liked = this.getLikedTracks();
    return liked.some(t => t.id === trackId);
  },

  /**
   * Toggle like status
   */
  toggleLikeTrack(track: Track): boolean {
    try {
      const existing = this.getLikedTracks();
      const isLiked = existing.some(t => t.id === track.id);
      
      let updated: Track[];
      if (isLiked) {
        updated = existing.filter(t => t.id !== track.id);
      } else {
        updated = [track, ...existing];
      }
      
      localStorage.setItem(STORAGE_KEYS.LIKED_TRACKS, JSON.stringify(updated));
      return !isLiked;
    } catch (error) {
      console.error('Error toggling like:', error);
      return false;
    }
  },

  /**
   * Get saved volume
   */
  getSavedVolume(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOLUME);
      return stored ? parseFloat(stored) : 0.7;
    } catch {
      return 0.7;
    }
  },

  /**
   * Save volume
   */
  saveVolume(volume: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
    } catch (error) {
      console.error('Error saving volume:', error);
    }
  },

  // ============ UTILITY FUNCTIONS ============

  /**
   * Format play count (e.g., "1.2M")
   */
  formatPlayCount(count?: number): string {
    if (!count) return '0 plays';
    
    if (count >= 1_000_000_000) {
      return `${(count / 1_000_000_000).toFixed(1)}B plays`;
    }
    if (count >= 1_000_000) {
      return `${(count / 1_000_000).toFixed(1)}M plays`;
    }
    if (count >= 1_000) {
      return `${(count / 1_000).toFixed(1)}K plays`;
    }
    return `${count} plays`;
  },

  /**
   * Get relative time string (e.g., "5 min ago")
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  },

  /**
   * Parse duration string to seconds
   */
  parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  },

  /**
   * Format seconds to duration string
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
};

// Export types for convenience
export type { Track, Album, Playlist, Artist, PodcastShow, PodcastEpisode, RecentlyPlayed, SearchResult };
