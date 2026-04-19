/**
 * Spotify Music Service
 * Handles searching and fetching Spotify tracks via backend proxy
 */

import type { MusicTrack, SpotifySearchResult } from '../types/musicTypes';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Search for tracks on Spotify
 * @param query Search query string
 * @param limit Number of results to return (default: 20, max: 50)
 * @param offset Offset for pagination (default: 0)
 * @returns Promise<SpotifySearchResult>
 */
export async function searchSpotifyTracks(
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<SpotifySearchResult> {
  if (!query || query.trim() === '') {
    return {
      tracks: [],
      nextOffset: null,
      total: 0,
    };
  }

  try {
    const token = localStorage.getItem('token');
    
    const url = new URL(`${API_BASE_URL}/student/spotify/search-tracks`);
    url.searchParams.append('q', query.trim());
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());
    url.searchParams.append('market', 'VN');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Spotify service is temporarily unavailable. Please try again later.');
      }
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      tracks: data.tracks || [],
      nextOffset: data.nextOffset ?? null,
      total: data.total || 0,
    };
  } catch (error) {
    console.error('Error searching Spotify tracks:', error);
    throw error;
  }
}

/**
 * Append new search results to existing results
 * Useful for "Load More" functionality
 */
export function appendSearchResults(
  oldResult: SpotifySearchResult | null,
  newResult: SpotifySearchResult
): SpotifySearchResult {
  if (!oldResult) {
    return newResult;
  }

  return {
    tracks: [...oldResult.tracks, ...newResult.tracks],
    nextOffset: newResult.nextOffset,
    total: newResult.total,
  };
}

/**
 * Format duration from milliseconds to MM:SS
 */
export function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Create a local track object for backward compatibility
 */
export function createLocalTrack(
  id: string,
  title: string,
  artist: string,
  duration: string,
  albumArt?: string,
  album?: string
): MusicTrack {
  return {
    id: `local:${id}`,
    source: 'local',
    title,
    artist,
    album,
    duration,
    imageUrl: albumArt,
  };
}
