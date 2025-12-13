// Spotify API Service with hard-coded credentials for demo
// For production, use proper OAuth flow

const CLIENT_ID = '8f6b1d1b8f6a4c5a9b2c3d4e5f6a7b8c';
const CLIENT_SECRET = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  uri: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

async function getAccessToken(): Promise<string> {
  // Check if we have a valid token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET),
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min before expiry

    return accessToken || '';
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

async function spotifyFetch(endpoint: string): Promise<any> {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getTopTracks(limit: number = 50): Promise<SpotifyTrack[]> {
  try {
    // Get top tracks from a popular playlist (Global Top 50)
    const data = await spotifyFetch('/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=' + limit);
    return data.items.map((item: any) => item.track);
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return [];
  }
}

export async function getFeaturedPlaylists(limit: number = 20): Promise<SpotifyPlaylist[]> {
  try {
    const data = await spotifyFetch('/browse/featured-playlists?limit=' + limit);
    return data.playlists.items;
  } catch (error) {
    console.error('Error fetching featured playlists:', error);
    return [];
  }
}

export async function getPlaylistTracks(playlistId: string, limit: number = 50): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyFetch(`/playlists/${playlistId}/tracks?limit=${limit}`);
    return data.items.map((item: any) => item.track);
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    return [];
  }
}

export async function searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
  try {
    const data = await spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`);
    return data.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
    return [];
  }
}

export async function getNewReleases(limit: number = 20): Promise<any[]> {
  try {
    const data = await spotifyFetch(`/browse/new-releases?limit=${limit}`);
    return data.albums.items;
  } catch (error) {
    console.error('Error fetching new releases:', error);
    return [];
  }
}

export async function getCategories(limit: number = 20): Promise<any[]> {
  try {
    const data = await spotifyFetch(`/browse/categories?limit=${limit}`);
    return data.categories.items;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getTrackArtists(track: SpotifyTrack): string {
  return track.artists.map(artist => artist.name).join(', ');
}

export function getAlbumImage(track: SpotifyTrack): string {
  return track.album.images[0]?.url || 'https://via.placeholder.com/300';
}
