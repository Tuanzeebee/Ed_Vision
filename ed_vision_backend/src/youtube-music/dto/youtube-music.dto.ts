// DTOs for YouTube Music API

export class SearchTracksDto {
  q: string;
  pageToken?: string;
  maxResults?: number;
}

export class TopChartsDto {
  regionCode?: string;
  pageToken?: string;
  maxResults?: number;
}

export class PlaylistDto {
  pageToken?: string;
  maxResults?: number;
}

export class PodcastsDto {
  pageToken?: string;
  maxResults?: number;
}

// Response types
export interface YouTubeTrackDto {
  id: string;
  provider: 'youtube';
  title: string;
  artist: string;
  album?: string;
  durationMs?: number;
  duration?: string;
  imageUrl?: string;
  externalUrl: string;
  channelId?: string;
  publishedAt?: string;
  viewCount?: number;
}

export interface YouTubePlaylistDto {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  trackCount?: number;
  channelTitle?: string;
  externalUrl: string;
}

export interface PodcastShowDto {
  id: string;
  title: string;
  channelTitle: string;
  description?: string;
  imageUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  externalUrl: string;
}

export interface PodcastEpisodeDto {
  id: string;
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

export interface YouTubeArtistDto {
  id: string;
  name: string;
  imageUrl?: string;
  subscriberCount?: string;
  videoCount?: number;
  externalUrl: string;
}

export interface SearchTracksResponseDto {
  tracks: YouTubeTrackDto[];
  nextPageToken: string | null;
  totalResults?: number;
}

export interface TopChartsResponseDto {
  tracks: YouTubeTrackDto[];
  nextPageToken: string | null;
}

export interface PlaylistResponseDto {
  playlist: YouTubePlaylistDto;
  tracks: YouTubeTrackDto[];
  nextPageToken: string | null;
}

export interface PodcastsResponseDto {
  shows: PodcastShowDto[];
  episodes: PodcastEpisodeDto[];
}

export interface HomeHeroResponseDto {
  track: YouTubeTrackDto;
  artists: YouTubeArtistDto[];
}
