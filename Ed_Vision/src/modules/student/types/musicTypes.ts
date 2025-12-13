// Music types for Spotify and local tracks

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  albumArt?: string;
  source: 'local' | 'spotify';
  spotifyUrl?: string;
  preview_url?: string;
  uri?: string;
  album?: string;
}

export interface SpotifyTrack {
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

export interface SpotifyPlaylist {
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

export interface Playlist {
  id: string;
  name: string;
  tracks: MusicTrack[];
  imageUrl?: string;
}
