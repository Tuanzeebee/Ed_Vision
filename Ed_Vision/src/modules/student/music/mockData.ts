/**
 * Hardcoded Music Data for Demo
 * Using YouTube video IDs for legal playback via IFrame Player
 */

export type Track = {
  id: string;            // YouTube videoId
  title: string;
  artist: string;
  album?: string;
  thumbnail: string;
  duration?: string;
};

export type Album = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  tracks: Track[];
};

export type Playlist = {
  id: string;
  title: string;
  description: string;
  cover: string;
  tracks: Track[];
};

export type Artist = {
  id: string;
  name: string;
  image: string;
  followers?: string;
};

export type PodcastShow = {
  id: string;
  title: string;
  host: string;
  cover: string;
  episodes: PodcastEpisode[];
};

export type PodcastEpisode = {
  id: string;          // YouTube videoId
  title: string;
  duration: string;
  thumbnail: string;
};

// ============ TRACKS ============
export const TRACKS: Track[] = [
  {
    id: "jfKfPfyJRdk",
    title: "Lofi Hip Hop Radio - Beats to Relax/Study To",
    artist: "Lofi Girl",
    album: "Lofi Beats",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    duration: "LIVE"
  },
  {
    id: "5qap5aO4i9A",
    title: "Chillhop Essentials - Fall 2024",
    artist: "Chillhop Music",
    album: "Chillhop Essentials",
    thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
    duration: "1:02:34"
  },
  {
    id: "lTRiuFIWV54",
    title: "Jazz Piano Radio - Relaxing Jazz Music",
    artist: "Cafe Music BGM",
    album: "Jazz Collection",
    thumbnail: "https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg",
    duration: "LIVE"
  },
  {
    id: "DWcJFNfaw9c",
    title: "Deep Focus - Music For Studying",
    artist: "Quiet Quest",
    album: "Study Music",
    thumbnail: "https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg",
    duration: "3:58:42"
  },
  {
    id: "7NOSDKb0HlU",
    title: "Peaceful Piano & Soft Rain",
    artist: "Soothing Relaxation",
    album: "Piano Collection",
    thumbnail: "https://i.ytimg.com/vi/7NOSDKb0HlU/hqdefault.jpg",
    duration: "3:00:11"
  },
  {
    id: "Na0w3Mz46GA",
    title: "Relaxing Classical Music",
    artist: "HALIDONMUSIC",
    album: "Classical Essentials",
    thumbnail: "https://i.ytimg.com/vi/Na0w3Mz46GA/hqdefault.jpg",
    duration: "3:05:22"
  },
  {
    id: "kgx4WGK0oNU",
    title: "Morning Jazz - Wake Up Coffee",
    artist: "Cafe Music BGM",
    album: "Morning Jazz",
    thumbnail: "https://i.ytimg.com/vi/kgx4WGK0oNU/hqdefault.jpg",
    duration: "3:12:56"
  },
  {
    id: "rUxyKA_-grg",
    title: "Rainy Day Coffee Shop Ambience",
    artist: "Calmed By Nature",
    album: "Ambience",
    thumbnail: "https://i.ytimg.com/vi/rUxyKA_-grg/hqdefault.jpg",
    duration: "8:00:00"
  },
  {
    id: "lP26UCnoH9s",
    title: "Study With Me - 2 Hour Pomodoro",
    artist: "The Sherry Formula",
    album: "Study Sessions",
    thumbnail: "https://i.ytimg.com/vi/lP26UCnoH9s/hqdefault.jpg",
    duration: "2:00:00"
  },
  {
    id: "TURbeWK2wwg",
    title: "Chill Lofi Mix - Homework Radio",
    artist: "The Bootleg Boy",
    album: "Lofi Mixes",
    thumbnail: "https://i.ytimg.com/vi/TURbeWK2wwg/hqdefault.jpg",
    duration: "54:23"
  },
  {
    id: "77ZozI0rw7w",
    title: "Synthwave Radio - Retro Vibes",
    artist: "Synthwave Goose",
    album: "Synthwave",
    thumbnail: "https://i.ytimg.com/vi/77ZozI0rw7w/hqdefault.jpg",
    duration: "LIVE"
  },
  {
    id: "hHW1oY26kxQ",
    title: "Ambient Study Music - Deep Concentration",
    artist: "Yellow Brick Cinema",
    album: "Ambient Music",
    thumbnail: "https://i.ytimg.com/vi/hHW1oY26kxQ/hqdefault.jpg",
    duration: "3:00:32"
  },
  {
    id: "tNkZsRW7h2c",
    title: "Anime Lofi Hip Hop Mix",
    artist: "Dreamy",
    album: "Anime Lofi",
    thumbnail: "https://i.ytimg.com/vi/tNkZsRW7h2c/hqdefault.jpg",
    duration: "1:23:45"
  },
  {
    id: "HuFYqnbVbzY",
    title: "Night City - Cyberpunk Music",
    artist: "Aim To Head",
    album: "Cyberpunk",
    thumbnail: "https://i.ytimg.com/vi/HuFYqnbVbzY/hqdefault.jpg",
    duration: "1:00:12"
  },
  {
    id: "mPZkdNFkNps",
    title: "Acoustic Covers - Popular Songs",
    artist: "Music Lab",
    album: "Acoustic",
    thumbnail: "https://i.ytimg.com/vi/mPZkdNFkNps/hqdefault.jpg",
    duration: "2:15:00"
  }
];

// ============ ALBUMS ============
export const ALBUMS: Album[] = [
  {
    id: "lofi-beats",
    title: "Lofi Beats to Study/Relax To",
    artist: "Lofi Girl",
    cover: "https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg",
    tracks: TRACKS.filter(t => t.album === "Lofi Beats" || t.album === "Lofi Mixes" || t.album === "Anime Lofi")
  },
  {
    id: "jazz-collection",
    title: "Jazz & Coffee",
    artist: "Various Artists",
    cover: "https://i.ytimg.com/vi/lTRiuFIWV54/maxresdefault.jpg",
    tracks: TRACKS.filter(t => t.album?.includes("Jazz") || t.album === "Morning Jazz")
  },
  {
    id: "study-focus",
    title: "Deep Focus & Study",
    artist: "Various Artists",
    cover: "https://i.ytimg.com/vi/DWcJFNfaw9c/maxresdefault.jpg",
    tracks: TRACKS.filter(t => t.album === "Study Music" || t.album === "Study Sessions" || t.album === "Ambient Music")
  },
  {
    id: "piano-classics",
    title: "Piano & Classical",
    artist: "Various Artists",
    cover: "https://i.ytimg.com/vi/7NOSDKb0HlU/maxresdefault.jpg",
    tracks: TRACKS.filter(t => t.album?.includes("Piano") || t.album?.includes("Classical"))
  },
  {
    id: "chillhop",
    title: "Chillhop Essentials",
    artist: "Chillhop Music",
    cover: "https://i.ytimg.com/vi/5qap5aO4i9A/maxresdefault.jpg",
    tracks: TRACKS.filter(t => t.album === "Chillhop Essentials")
  },
  {
    id: "synthwave-cyber",
    title: "Synthwave & Cyberpunk",
    artist: "Various Artists",
    cover: "https://i.ytimg.com/vi/77ZozI0rw7w/maxresdefault.jpg",
    tracks: TRACKS.filter(t => t.album === "Synthwave" || t.album === "Cyberpunk")
  }
];

// ============ PLAYLISTS ============
export const PLAYLISTS: Playlist[] = [
  {
    id: "study-playlist",
    title: "Study Session",
    description: "Perfect background music for studying and focusing",
    cover: "https://i.ytimg.com/vi/DWcJFNfaw9c/maxresdefault.jpg",
    tracks: [TRACKS[0], TRACKS[3], TRACKS[4], TRACKS[8], TRACKS[11]]
  },
  {
    id: "chill-vibes",
    title: "Chill Vibes",
    description: "Relaxing music to unwind",
    cover: "https://i.ytimg.com/vi/5qap5aO4i9A/maxresdefault.jpg",
    tracks: [TRACKS[1], TRACKS[9], TRACKS[12], TRACKS[7]]
  },
  {
    id: "morning-coffee",
    title: "Morning Coffee",
    description: "Start your day with great music",
    cover: "https://i.ytimg.com/vi/kgx4WGK0oNU/maxresdefault.jpg",
    tracks: [TRACKS[2], TRACKS[6], TRACKS[4]]
  },
  {
    id: "late-night",
    title: "Late Night Coding",
    description: "Music for late night productivity",
    cover: "https://i.ytimg.com/vi/77ZozI0rw7w/maxresdefault.jpg",
    tracks: [TRACKS[10], TRACKS[13], TRACKS[0], TRACKS[12]]
  }
];

// ============ ARTISTS ============
export const ARTISTS: Artist[] = [
  {
    id: "lofi-girl",
    name: "Lofi Girl",
    image: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    followers: "14.2M"
  },
  {
    id: "chillhop",
    name: "Chillhop Music",
    image: "https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg",
    followers: "3.8M"
  },
  {
    id: "cafe-music",
    name: "Cafe Music BGM",
    image: "https://i.ytimg.com/vi/rUxyKA_-grg/hqdefault.jpg",
    followers: "8.5M"
  },
  {
    id: "quiet-quest",
    name: "Quiet Quest",
    image: "https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg",
    followers: "1.2M"
  },
  {
    id: "soothing-relaxation",
    name: "Soothing Relaxation",
    image: "https://i.ytimg.com/vi/hlWiI4xVXKY/hqdefault.jpg",
    followers: "5.1M"
  },
  {
    id: "halidonmusic",
    name: "HALIDONMUSIC",
    image: "https://i.ytimg.com/vi/mOYZaiDZ7BM/hqdefault.jpg",
    followers: "6.3M"
  }
];

// ============ PODCASTS ============
export const PODCAST_SHOWS: PodcastShow[] = [
  {
    id: "ted-ed",
    title: "TED-Ed",
    host: "TED",
    cover: "https://yt3.googleusercontent.com/ytc/AIdro_kxYaqdLj_jO64I5jNZ_i5bSNj8uMtYS0vGQuKWbQ=s176-c-k-c0x00ffffff-no-rj",
    episodes: [
      {
        id: "Z0ipq4cS9TE",
        title: "How to learn any language in 6 months",
        duration: "14:36",
        thumbnail: "https://i.ytimg.com/vi/Z0ipq4cS9TE/hqdefault.jpg"
      },
      {
        id: "5MgBikgcWnY",
        title: "The science of sleep",
        duration: "5:12",
        thumbnail: "https://i.ytimg.com/vi/5MgBikgcWnY/hqdefault.jpg"
      }
    ]
  },
  {
    id: "crash-course",
    title: "Crash Course",
    host: "Complexly",
    cover: "https://yt3.googleusercontent.com/ytc/AIdro_nj1X6N0y5rOUBF_IgKVgBME2YCCk0PCXI8D0Jfig=s176-c-k-c0x00ffffff-no-rj",
    episodes: [
      {
        id: "kBdfcR-8hEY",
        title: "The Psychology of Memory",
        duration: "11:23",
        thumbnail: "https://i.ytimg.com/vi/kBdfcR-8hEY/hqdefault.jpg"
      }
    ]
  },
  {
    id: "kurzgesagt",
    title: "Kurzgesagt – In a Nutshell",
    host: "Kurzgesagt",
    cover: "https://yt3.googleusercontent.com/ytc/AIdro_lJ-w7UVoqNVJsLqGfWPZq0y7sEuLL7M7L4E_u36A=s176-c-k-c0x00ffffff-no-rj",
    episodes: [
      {
        id: "JtUAAXe_0VI",
        title: "The Immune System Explained",
        duration: "6:48",
        thumbnail: "https://i.ytimg.com/vi/JtUAAXe_0VI/hqdefault.jpg"
      },
      {
        id: "n3Xv_g3g-mA",
        title: "Optimistic Nihilism",
        duration: "6:02",
        thumbnail: "https://i.ytimg.com/vi/n3Xv_g3g-mA/hqdefault.jpg"
      }
    ]
  }
];

// ============ CATEGORIES / TAGS ============
export const MUSIC_TAGS = [
  'Lofi', 'Jazz', 'Classical', 'Pop', 'Rock', 'Hip Hop',
  'R&B', 'Electronic', 'Acoustic', 'Piano', 'Guitar',
  'Instrumental', 'Chill', 'Study', 'Focus', 'Ambient',
  'Synthwave', 'Cyberpunk', 'Coffee Shop', 'Rain'
];

// ============ UTILITY FUNCTIONS ============

/**
 * Search tracks locally
 */
export function searchTracks(query: string): Track[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  return TRACKS.filter(track => 
    track.title.toLowerCase().includes(lowerQuery) ||
    track.artist.toLowerCase().includes(lowerQuery) ||
    track.album?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search albums locally
 */
export function searchAlbums(query: string): Album[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  return ALBUMS.filter(album =>
    album.title.toLowerCase().includes(lowerQuery) ||
    album.artist.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search everything
 */
export function searchAll(query: string): { tracks: Track[]; albums: Album[]; artists: Artist[] } {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return { tracks: [], albums: [], artists: [] };
  
  return {
    tracks: searchTracks(query),
    albums: searchAlbums(query),
    artists: ARTISTS.filter(artist => artist.name.toLowerCase().includes(lowerQuery))
  };
}

/**
 * Get track by ID
 */
export function getTrackById(id: string): Track | undefined {
  return TRACKS.find(track => track.id === id);
}

/**
 * Get album by ID
 */
export function getAlbumById(id: string): Album | undefined {
  return ALBUMS.find(album => album.id === id);
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  return `https://i.ytimg.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
