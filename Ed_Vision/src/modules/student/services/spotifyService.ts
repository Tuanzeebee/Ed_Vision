/**
 * Spotify Service Stub
 * This file provides backward compatibility while transitioning to YouTube
 * @deprecated Use youtubeService instead
 */

// Legacy functions - now redirecting to YouTube service or returning empty data
export async function getTopTracks(_limit = 50): Promise<any[]> {
  console.warn('spotifyService.getTopTracks is deprecated. Use youtubeService.fetchTopCharts instead.');
  return [];
}

export async function getFeaturedPlaylists(_limit = 10): Promise<any[]> {
  console.warn('spotifyService.getFeaturedPlaylists is deprecated. Use youtubeService.fetchPlaylist instead.');
  return [];
}

export function getTrackArtists(track: any): string {
  if (track?.artists && Array.isArray(track.artists)) {
    return track.artists.map((a: any) => a.name).join(', ');
  }
  return track?.artist || 'Unknown Artist';
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getAlbumImage(track: any): string {
  if (track?.album?.images?.[0]?.url) {
    return track.album.images[0].url;
  }
  if (track?.imageUrl) {
    return track.imageUrl;
  }
  return 'https://via.placeholder.com/100x100?text=No+Image';
}
