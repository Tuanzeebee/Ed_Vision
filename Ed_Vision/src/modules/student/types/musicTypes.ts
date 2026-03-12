// Music data types for unified handling of local and Spotify content

export type MusicSource = 'local' | 'spotify';

export type MusicTrack = {
  id: string;            // e.g., 'spotify:track:<id>' or local id
  source: MusicSource;   // 'spotify' for Spotify data
  title: string;
  artist: string;
  album?: string;
  duration?: string;     // formatted string like "3:45"
  durationMs?: number;   // duration in milliseconds
  imageUrl?: string;     // album art URL
  previewUrl?: string;   // 30s preview URL from Spotify
  spotifyUrl?: string;   // link to open in Spotify web/app
  explicit?: boolean;
};

export type ArtistCard = {
  id: string;
  name: string;
  imageUrl?: string;
  followers?: number;
  popularity?: number;
  plays?: string;        // formatted string like "44M Plays"
};

export type AlbumCard = {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
  totalTracks?: number;
  releaseDate?: string;
  spotifyUrl?: string;
};

export type PodcastShow = {
  id: string;
  title: string;
  publisher: string;
  imageUrl?: string;
  totalEpisodes?: number;
  description?: string;
  spotifyUrl?: string;
};

export type PodcastEpisode = {
  id: string;
  title: string;
  showTitle: string;
  imageUrl?: string;
  durationMs?: number;
  duration?: string;     // formatted string
  description?: string;
  spotifyUrl?: string;
  releaseDate?: string;
  explicit?: boolean;
};

export type FeaturedHero = {
  title: string;
  subtitle: string;      // artist or description
  imageUrl?: string;
  primaryTrack?: MusicTrack;
  spotifyUrl?: string;
};

export type SearchResults = {
  tracks: MusicTrack[];
  artists: ArtistCard[];
  albums: AlbumCard[];
  shows: PodcastShow[];
  episodes: PodcastEpisode[];
};

// Player state types
export type PlayerState = 'playing' | 'paused' | 'stopped';

export type PlayerStore = {
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  history: MusicTrack[];
  playerState: PlayerState;
  currentTime: number;
  volume: number;
};
