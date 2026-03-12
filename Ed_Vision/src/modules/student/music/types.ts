/**
 * Music Types - Dùng chung cho toàn bộ Music module
 * Dễ dàng refactor khi chuyển sang API thật
 */

export type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  imageUrl: string;
  audioUrl?: string; // để trống hoặc fake cho demo
  plays?: number;
};

export type Album = {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  year?: number;
  tracks: Track[];
};

export type Playlist = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  tracks: Track[];
  createdBy?: string;
};

export type PodcastShow = {
  id: string;
  title: string;
  host: string;
  description?: string;
  imageUrl: string;
  episodes: PodcastEpisode[];
};

export type PodcastEpisode = {
  id: string;
  title: string;
  show: string;
  duration: string;
  imageUrl: string;
  description?: string;
  publishedAt?: string;
};

export type Artist = {
  id: string;
  name: string;
  imageUrl: string;
  followers?: string;
  genres?: string[];
};

export type RecentlyPlayed = Track & {
  playedAt: Date;
};

// Player state type
export type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
};

// Search result type
export type SearchResult = {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
};
