/**
 * Mock Data for Music Module
 * Hard-coded data cho demo - Dễ dàng thay thế bằng API thật sau này
 */

import type { Track, Album, Playlist, Artist, PodcastShow, PodcastEpisode } from './types';

// ============ TOP TRACKS (Top Charts) ============
// NOTE: id must be a valid YouTube video ID for playback to work
export const TOP_TRACKS: Track[] = [
  {
    id: '4NRXx6U8ABQ', // YouTube video ID for Blinding Lights
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: '3:20',
    imageUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    plays: 3_500_000_000,
  },
  {
    id: 'JGwWNGJdvx8', // YouTube video ID for Shape of You
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: '3:53',
    imageUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    plays: 3_400_000_000,
  },
  {
    id: 'hLQl3WQQoQ0', // YouTube video ID for Someone Like You
    title: 'Someone Like You',
    artist: 'Adele',
    album: '21',
    duration: '4:45',
    imageUrl: 'https://i.ytimg.com/vi/hLQl3WQQoQ0/hqdefault.jpg',
    plays: 1_500_000_000,
  },
  {
    id: 'q0hyYWKXF0Q', // YouTube video ID for Dance Monkey
    title: 'Dance Monkey',
    artist: 'Tones and I',
    album: 'The Kids Are Coming',
    duration: '3:29',
    imageUrl: 'https://i.ytimg.com/vi/q0hyYWKXF0Q/hqdefault.jpg',
    plays: 2_800_000_000,
  },
  {
    id: 'E07s5ZYygMg', // YouTube video ID for Watermelon Sugar
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    duration: '2:54',
    imageUrl: 'https://i.ytimg.com/vi/E07s5ZYygMg/hqdefault.jpg',
    plays: 2_100_000_000,
  },
  {
    id: 'TUVcZfQe-Kw', // YouTube video ID for Levitating
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: '3:23',
    imageUrl: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg',
    plays: 1_900_000_000,
  },
  {
    id: 'kTJczUoc26U', // YouTube video ID for Stay
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3: OVER YOU',
    duration: '2:21',
    imageUrl: 'https://i.ytimg.com/vi/kTJczUoc26U/hqdefault.jpg',
    plays: 2_500_000_000,
  },
  {
    id: 'mRD0-GxqHVo', // YouTube video ID for Heat Waves
    title: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    duration: '3:58',
    imageUrl: 'https://i.ytimg.com/vi/mRD0-GxqHVo/hqdefault.jpg',
    plays: 2_200_000_000,
  },
  {
    id: 'tQ0yjYUFKAE', // YouTube video ID for Peaches
    title: 'Peaches',
    artist: 'Justin Bieber ft. Daniel Caesar',
    album: 'Justice',
    duration: '3:18',
    imageUrl: 'https://i.ytimg.com/vi/tQ0yjYUFKAE/hqdefault.jpg',
    plays: 1_800_000_000,
  },
  {
    id: 'DyDfgMOUjCI', // YouTube video ID for Bad Guy
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    album: 'WHEN WE ALL FALL ASLEEP',
    duration: '3:14',
    imageUrl: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg',
    plays: 2_300_000_000,
  },
  {
    id: 'Il0S8BoucSA', // YouTube video ID for Shivers
    title: 'Shivers',
    artist: 'Ed Sheeran',
    album: '= (Equals)',
    duration: '3:27',
    imageUrl: 'https://i.ytimg.com/vi/Il0S8BoucSA/hqdefault.jpg',
    plays: 1_600_000_000,
  },
  {
    id: 'H5v3kku4y6Q', // YouTube video ID for As It Was
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: '2:47',
    imageUrl: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg',
    plays: 2_700_000_000,
  },
];

// ============ LOFI / STUDY TRACKS ============
// NOTE: id must be a valid YouTube video ID for playback to work
export const LOFI_TRACKS: Track[] = [
  {
    id: 'jfKfPfyJRdk', // lofi hip hop radio - beats to relax/study to
    title: 'Lofi Hip Hop Radio',
    artist: 'Lofi Girl',
    album: 'Chilledcow Sessions',
    duration: 'LIVE',
    imageUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    plays: 50_000_000,
  },
  {
    id: '5qap5aO4i9A', // lofi hip hop radio - beats to sleep/chill to
    title: 'Lofi Sleep Radio',
    artist: 'Lofi Girl',
    album: 'Sleep Sessions',
    duration: 'LIVE',
    imageUrl: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    plays: 45_000_000,
  },
  {
    id: 'lTRiuFIWV54', // 1 hour study music
    title: 'Study Session',
    artist: 'Chillhop Music',
    album: 'Study Beats',
    duration: '1:00:00',
    imageUrl: 'https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg',
    plays: 38_000_000,
  },
  {
    id: 'n61ULEU7CO0', // Jazz Radio
    title: 'Jazz Radio',
    artist: 'Cafe Music BGM',
    album: 'Coffee Jazz',
    duration: 'LIVE',
    imageUrl: 'https://i.ytimg.com/vi/n61ULEU7CO0/hqdefault.jpg',
    plays: 32_000_000,
  },
  {
    id: 'HuFYqnbVbzY', // Peaceful Piano
    title: 'Peaceful Piano',
    artist: 'Relaxing Music',
    album: 'Piano Collection',
    duration: '3:00:00',
    imageUrl: 'https://i.ytimg.com/vi/HuFYqnbVbzY/hqdefault.jpg',
    plays: 28_000_000,
  },
];

// ============ TOP ARTISTS ============
export const TOP_ARTISTS: Artist[] = [
  {
    id: 'artist-1',
    name: 'The Weeknd',
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
    followers: '85.2M',
    genres: ['Pop', 'R&B'],
  },
  {
    id: 'artist-2',
    name: 'Ed Sheeran',
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb3bcef85e105dfc42399ef0ba',
    followers: '92.4M',
    genres: ['Pop', 'Folk'],
  },
  {
    id: 'artist-3',
    name: 'Taylor Swift',
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3bc19e3e0a4',
    followers: '88.1M',
    genres: ['Pop', 'Country'],
  },
  {
    id: 'artist-4',
    name: 'Drake',
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
    followers: '73.5M',
    genres: ['Hip-Hop', 'Rap'],
  },
  {
    id: 'artist-5',
    name: 'Billie Eilish',
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebd8b9980db67272cb4d2c3daf',
    followers: '65.8M',
    genres: ['Pop', 'Alternative'],
  },
  {
    id: 'artist-6',
    name: 'Dua Lipa',
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb0c68f6c95232e716f0abee8d',
    followers: '58.3M',
    genres: ['Pop', 'Dance'],
  },
  {
    id: 'artist-7',
    name: 'Lofi Girl',
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb8df3e8f7f3e1b3c2d1a0e9f8',
    followers: '12.5M',
    genres: ['Lofi', 'Chillhop'],
  },
  {
    id: 'artist-8',
    name: 'Harry Styles',
    imageUrl: 'https://i.scdn.co/image/ab6761610000e5ebf7db7c8ede90a019c54590bb',
    followers: '52.1M',
    genres: ['Pop', 'Rock'],
  },
];

// ============ PLAYLISTS ============
export const PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-1',
    title: 'Today\'s Top Hits',
    description: 'The hottest tracks right now',
    imageUrl: 'https://i.scdn.co/image/ab67706f00000003b3f2f6c7d1e8f9a0b1c2d3e4',
    tracks: TOP_TRACKS.slice(0, 6),
    createdBy: 'Spotify',
  },
  {
    id: 'playlist-2',
    title: 'Lofi Beats',
    description: 'Chill beats to study/relax to',
    imageUrl: 'https://i.scdn.co/image/ab67706f00000003cafe91c8a9a5f2e3d4b5c6a7',
    tracks: LOFI_TRACKS,
    createdBy: 'Lofi Girl',
  },
  {
    id: 'playlist-3',
    title: 'Deep Focus',
    description: 'Keep calm and focus with ambient and post-rock music',
    imageUrl: 'https://i.scdn.co/image/ab67706f00000003d5f7e8a9b0c1d2e3f4a5b6c7',
    tracks: [...LOFI_TRACKS.slice(0, 3), ...TOP_TRACKS.slice(6, 9)],
    createdBy: 'Spotify',
  },
  {
    id: 'playlist-4',
    title: 'Chill Vibes',
    description: 'Relaxing music for your day',
    imageUrl: 'https://i.scdn.co/image/ab67706f00000003e8f9a0b1c2d3e4f5a6b7c8d9',
    tracks: [...TOP_TRACKS.slice(2, 5), ...LOFI_TRACKS.slice(1, 4)],
    createdBy: 'Spotify',
  },
  {
    id: 'playlist-5',
    title: 'Mood Booster',
    description: 'Get happy with these feel-good songs',
    imageUrl: 'https://i.scdn.co/image/ab67706f00000003f0a1b2c3d4e5f6a7b8c9d0e1',
    tracks: TOP_TRACKS.slice(4, 10),
    createdBy: 'Spotify',
  },
  {
    id: 'playlist-6',
    title: 'Acoustic Chill',
    description: 'Soft acoustic vibes for any moment',
    imageUrl: 'https://i.scdn.co/image/ab67706f00000003a1b2c3d4e5f6a7b8c9d0e1f2',
    tracks: [...TOP_TRACKS.slice(1, 4), ...LOFI_TRACKS.slice(2, 5)],
    createdBy: 'Spotify',
  },
];

// ============ ALBUMS ============
// NOTE: All track IDs must be valid YouTube video IDs for playback to work
export const ALBUMS: Album[] = [
  {
    id: 'album-1',
    title: 'After Hours',
    artist: 'The Weeknd',
    imageUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    year: 2020,
    tracks: [
      { id: 'JH398xAYpZA', title: 'Alone Again', artist: 'The Weeknd', duration: '4:10', imageUrl: 'https://i.ytimg.com/vi/JH398xAYpZA/hqdefault.jpg' },
      { id: 'nbXgHAzUWB0', title: 'Too Late', artist: 'The Weeknd', duration: '3:59', imageUrl: 'https://i.ytimg.com/vi/nbXgHAzUWB0/hqdefault.jpg' },
      { id: 'Dsp_8Lm1eSk', title: 'Hardest To Love', artist: 'The Weeknd', duration: '3:31', imageUrl: 'https://i.ytimg.com/vi/Dsp_8Lm1eSk/hqdefault.jpg' },
      { id: '4NRXx6U8ABQ', title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', imageUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg' },
      { id: 'dqRZDebPIGs', title: 'In Your Eyes', artist: 'The Weeknd', duration: '3:57', imageUrl: 'https://i.ytimg.com/vi/dqRZDebPIGs/hqdefault.jpg' },
      { id: 'XXYlFuWEuKI', title: 'Save Your Tears', artist: 'The Weeknd', duration: '3:35', imageUrl: 'https://i.ytimg.com/vi/XXYlFuWEuKI/hqdefault.jpg' },
    ],
  },
  {
    id: 'album-2',
    title: '÷ (Divide)',
    artist: 'Ed Sheeran',
    imageUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    year: 2017,
    tracks: [
      { id: 'K0ibBPhiaG0', title: 'Castle on the Hill', artist: 'Ed Sheeran', duration: '4:21', imageUrl: 'https://i.ytimg.com/vi/K0ibBPhiaG0/hqdefault.jpg' },
      { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', duration: '3:53', imageUrl: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
      { id: '2Vv-BfVoq4g', title: 'Perfect', artist: 'Ed Sheeran', duration: '4:23', imageUrl: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg' },
      { id: '87gWaABqGYs', title: 'Galway Girl', artist: 'Ed Sheeran', duration: '2:50', imageUrl: 'https://i.ytimg.com/vi/87gWaABqGYs/hqdefault.jpg' },
    ],
  },
  {
    id: 'album-3',
    title: 'Future Nostalgia',
    artist: 'Dua Lipa',
    imageUrl: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg',
    year: 2020,
    tracks: [
      { id: 'oygrmJFKYZY', title: "Don't Start Now", artist: 'Dua Lipa', duration: '3:03', imageUrl: 'https://i.ytimg.com/vi/oygrmJFKYZY/hqdefault.jpg' },
      { id: '9HDEHj2yzew', title: 'Physical', artist: 'Dua Lipa', duration: '3:13', imageUrl: 'https://i.ytimg.com/vi/9HDEHj2yzew/hqdefault.jpg' },
      { id: 'TUVcZfQe-Kw', title: 'Levitating', artist: 'Dua Lipa', duration: '3:23', imageUrl: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg' },
      { id: 'Nj2U6rhnucI', title: 'Break My Heart', artist: 'Dua Lipa', duration: '3:41', imageUrl: 'https://i.ytimg.com/vi/Nj2U6rhnucI/hqdefault.jpg' },
    ],
  },
  {
    id: 'album-4',
    title: "Harry's House",
    artist: 'Harry Styles',
    imageUrl: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg',
    year: 2022,
    tracks: [
      { id: 'xKwGq9di8EE', title: 'Music For a Sushi Restaurant', artist: 'Harry Styles', duration: '3:12', imageUrl: 'https://i.ytimg.com/vi/xKwGq9di8EE/hqdefault.jpg' },
      { id: 'R7cJGZd3mKE', title: 'Late Night Talking', artist: 'Harry Styles', duration: '2:57', imageUrl: 'https://i.ytimg.com/vi/R7cJGZd3mKE/hqdefault.jpg' },
      { id: 'H5v3kku4y6Q', title: 'As It Was', artist: 'Harry Styles', duration: '2:47', imageUrl: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg' },
      { id: 'E07s5ZYygMg', title: 'Watermelon Sugar', artist: 'Harry Styles', duration: '2:54', imageUrl: 'https://i.ytimg.com/vi/E07s5ZYygMg/hqdefault.jpg' },
    ],
  },
  {
    id: 'album-5',
    title: 'WHEN WE ALL FALL ASLEEP',
    artist: 'Billie Eilish',
    imageUrl: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg',
    year: 2019,
    tracks: [
      { id: 'DyDfgMOUjCI', title: 'bad guy', artist: 'Billie Eilish', duration: '3:14', imageUrl: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg' },
      { id: 'pbMwTqkKSps', title: 'xanny', artist: 'Billie Eilish', duration: '4:03', imageUrl: 'https://i.ytimg.com/vi/pbMwTqkKSps/hqdefault.jpg' },
      { id: 'Ah0Ys50CqO8', title: 'you should see me in a crown', artist: 'Billie Eilish', duration: '3:00', imageUrl: 'https://i.ytimg.com/vi/Ah0Ys50CqO8/hqdefault.jpg' },
      { id: 'HUHC9tYz8ik', title: 'bury a friend', artist: 'Billie Eilish', duration: '3:13', imageUrl: 'https://i.ytimg.com/vi/HUHC9tYz8ik/hqdefault.jpg' },
      { id: 'V1Pl8CzNzCw', title: 'lovely', artist: 'Billie Eilish & Khalid', duration: '3:20', imageUrl: 'https://i.ytimg.com/vi/V1Pl8CzNzCw/hqdefault.jpg' },
    ],
  },
];

// ============ PODCASTS ============
// NOTE: All episode IDs must be valid YouTube video IDs for playback to work

// Define episodes first so we can reference them in shows
export const PODCAST_EPISODES: PodcastEpisode[] = [
  // TED Talks Daily episodes
  {
    id: 'arj7oStGLkU', // TED: How to make stress your friend
    title: 'How to Make Stress Your Friend',
    show: 'TED Talks Daily',
    duration: '14:28',
    imageUrl: 'https://i.ytimg.com/vi/arj7oStGLkU/hqdefault.jpg',
    description: 'Stress makes your heart pound and makes you breathe faster. But can it also make you healthier?',
    publishedAt: '2025-12-18',
  },
  {
    id: 'Hu4Yvq-g7_Y', // TED: The power of introverts
    title: 'The Power of Introverts',
    show: 'TED Talks Daily',
    duration: '19:04',
    imageUrl: 'https://i.ytimg.com/vi/Hu4Yvq-g7_Y/hqdefault.jpg',
    description: 'Susan Cain argues that introverts bring extraordinary talents to the world',
    publishedAt: '2025-12-16',
  },
  {
    id: 'UF8uR6Z6KLc', // TED: Start with why
    title: 'How Great Leaders Inspire Action',
    show: 'TED Talks Daily',
    duration: '18:04',
    imageUrl: 'https://i.ytimg.com/vi/UF8uR6Z6KLc/hqdefault.jpg',
    description: 'Simon Sinek explores why some people and organizations are more successful',
    publishedAt: '2025-12-15',
  },
  {
    id: 'iCvmsMzlF7o', // TED: The puzzle of motivation 
    title: 'The Puzzle of Motivation',
    show: 'TED Talks Daily',
    duration: '18:36',
    imageUrl: 'https://i.ytimg.com/vi/iCvmsMzlF7o/hqdefault.jpg',
    description: 'Dan Pink examines the puzzle of motivation',
    publishedAt: '2025-12-14',
  },
  // Joe Rogan Experience episodes
  {
    id: 'pwaWilO_Pig', // JRE: Elon Musk
    title: 'Elon Musk on AI and Mars',
    show: 'The Joe Rogan Experience',
    duration: '2:36:56',
    imageUrl: 'https://i.ytimg.com/vi/pwaWilO_Pig/hqdefault.jpg',
    description: 'Elon Musk discusses SpaceX, Tesla, AI, and the future',
    publishedAt: '2025-12-17',
  },
  {
    id: '5tSTk1083VY', // JRE: Naval Ravikant
    title: 'Naval Ravikant on Happiness',
    show: 'The Joe Rogan Experience',
    duration: '2:08:24',
    imageUrl: 'https://i.ytimg.com/vi/5tSTk1083VY/hqdefault.jpg',
    description: 'Naval Ravikant shares wisdom on wealth and happiness',
    publishedAt: '2025-12-13',
  },
  // Educational / Documentary episodes
  {
    id: 'SJeQ-e9MvCU', // Kurzgesagt: Immune System
    title: 'The Immune System Explained',
    show: 'The Daily',
    duration: '7:14',
    imageUrl: 'https://i.ytimg.com/vi/SJeQ-e9MvCU/hqdefault.jpg',
    description: 'How your immune system works to keep you healthy',
    publishedAt: '2025-12-20',
  },
  {
    id: 'JQVmkDUkZT4', // Veritasium: Math genius
    title: 'The Genius Behind Math',
    show: 'The Daily',
    duration: '22:15',
    imageUrl: 'https://i.ytimg.com/vi/JQVmkDUkZT4/hqdefault.jpg',
    description: 'Exploring the minds of mathematical geniuses',
    publishedAt: '2025-12-19',
  },
];

export const PODCAST_SHOWS: PodcastShow[] = [
  {
    id: 'podcast-1',
    title: 'The Joe Rogan Experience',
    host: 'Joe Rogan',
    description: 'The podcast of comedian Joe Rogan with fascinating guests',
    imageUrl: 'https://i.ytimg.com/vi/pwaWilO_Pig/hqdefault.jpg',
    episodes: PODCAST_EPISODES.filter(ep => ep.show === 'The Joe Rogan Experience'),
  },
  {
    id: 'podcast-2',
    title: 'TED Talks Daily',
    host: 'TED',
    description: 'Every weekday, TED Talks Daily brings you the latest talks in audio',
    imageUrl: 'https://i.ytimg.com/vi/arj7oStGLkU/hqdefault.jpg',
    episodes: PODCAST_EPISODES.filter(ep => ep.show === 'TED Talks Daily'),
  },
  {
    id: 'podcast-3',
    title: 'The Daily',
    host: 'Educational',
    description: 'Daily educational content and documentaries',
    imageUrl: 'https://i.ytimg.com/vi/SJeQ-e9MvCU/hqdefault.jpg',
    episodes: PODCAST_EPISODES.filter(ep => ep.show === 'The Daily'),
  },
];

// ============ FEATURED / HERO TRACK ============
export const HERO_TRACK: Track = TOP_TRACKS[0];

// ============ GENRES / TAGS ============
export const AVAILABLE_TAGS = [
  'Lofi', 'Jazz', 'Classical', 'Pop', 'Rock', 'Hip Hop',
  'R&B', 'Electronic', 'Acoustic', 'Piano', 'Guitar',
  'Instrumental', 'Chill', 'Study', 'Focus', 'Workout',
  'Party', 'Sleep', 'Meditation', 'Nature Sounds'
];

// ============ ALL TRACKS (for search) ============
export const ALL_TRACKS: Track[] = [
  ...TOP_TRACKS,
  ...LOFI_TRACKS,
  ...ALBUMS.flatMap(album => album.tracks),
];

// ============ ALIASES for backward compatibility ============
export const TRACKS = TOP_TRACKS;
export const ARTISTS = TOP_ARTISTS;
export const MUSIC_TAGS = AVAILABLE_TAGS;

// Re-export types for convenience
export type { Track, Album, Playlist, Artist, PodcastShow, PodcastEpisode } from './types';

// ============ SEARCH FUNCTION ============
export function searchAll(query: string): { tracks: Track[]; albums: Album[]; artists: Artist[]; playlists: Playlist[] } {
  const q = query.toLowerCase().trim();
  if (!q) return { tracks: [], albums: [], artists: [], playlists: [] };
  
  const tracks = ALL_TRACKS.filter(t => 
    t.title.toLowerCase().includes(q) || 
    t.artist.toLowerCase().includes(q) ||
    (t.album?.toLowerCase().includes(q))
  );
  
  const albums = ALBUMS.filter(a => 
    a.title.toLowerCase().includes(q) || 
    a.artist.toLowerCase().includes(q)
  );
  
  const artists = TOP_ARTISTS.filter(a => 
    a.name.toLowerCase().includes(q)
  );
  
  const playlists = PLAYLISTS.filter(p => 
    p.title.toLowerCase().includes(q) ||
    (p.description?.toLowerCase().includes(q))
  );
  
  return { tracks, albums, artists, playlists };
}

// ============ LYRICS DATABASE ============
// Lyrics with timestamps for synchronized display
// NOTE: For demo purposes, using placeholder timestamps. 
// In production, integrate with a lyrics API like Musixmatch, Genius, or LyricFind
export interface LyricLine {
  time: number; // Time in seconds
  text: string;
}

// Generic placeholder lyrics structure for demo
// Real lyrics should be fetched from licensed APIs
export const LYRICS_DATABASE: Record<string, LyricLine[]> = {
  // Lofi Hip Hop Radio (Live) - Instrumental
  'jfKfPfyJRdk': [
    { time: 0, text: "♪ Lofi beats to relax/study to ♪" },
    { time: 30, text: "♪ Chill instrumental vibes ♪" },
    { time: 60, text: "♪ Late night study session ♪" },
    { time: 90, text: "♪ Coffee and concentration ♪" },
    { time: 120, text: "♪ Peaceful lo-fi melodies ♪" },
    { time: 150, text: "♪ Deep focus mode ♪" },
    { time: 180, text: "♪ Aesthetic sound waves ♪" },
    { time: 210, text: "♪ Study with me ♪" },
    { time: 240, text: "♪ Productive vibes only ♪" },
    { time: 270, text: "♪ Late night coding session ♪" },
    { time: 300, text: "♪ Rainy day feels ♪" },
    { time: 330, text: "♪ Calm and collected ♪" },
    { time: 360, text: "♪ Keep the flow going ♪" },
  ],

  // Lofi Sleep Radio - Instrumental
  '5qap5aO4i9A': [
    { time: 0, text: "♪ Gentle sleep melodies ♪" },
    { time: 30, text: "♪ Drift into dreams ♪" },
    { time: 60, text: "♪ Peaceful night sounds ♪" },
    { time: 90, text: "♪ Soft ambient tones ♪" },
    { time: 120, text: "♪ Rest and relax ♪" },
    { time: 150, text: "♪ Tranquil moments ♪" },
    { time: 180, text: "♪ Dreamscape soundscape ♪" },
  ],

  // Jazz Radio - Instrumental 
  'n61ULEU7CO0': [
    { time: 0, text: "♪ Smooth jazz ambiance ♪" },
    { time: 30, text: "♪ Coffee shop vibes ♪" },
    { time: 60, text: "♪ Piano melodies flowing ♪" },
    { time: 90, text: "♪ Saxophone serenade ♪" },
    { time: 120, text: "♪ Late night jazz club ♪" },
    { time: 150, text: "♪ Sophisticated sounds ♪" },
    { time: 180, text: "♪ Instrumental elegance ♪" },
  ],

  // Peaceful Piano - Instrumental
  'HuFYqnbVbzY': [
    { time: 0, text: "♪ Gentle piano notes ♪" },
    { time: 30, text: "♪ Soft melodies drifting ♪" },
    { time: 60, text: "♪ Peaceful harmonies ♪" },
    { time: 90, text: "♪ Calming soundscape ♪" },
    { time: 120, text: "♪ Musical meditation ♪" },
    { time: 150, text: "♪ Keys of tranquility ♪" },
  ],
};

// Helper function to get lyrics for a track
export function getLyricsForTrack(trackId: string): LyricLine[] {
  return LYRICS_DATABASE[trackId] || [];
}

// Helper to check if track has lyrics
export function hasLyrics(trackId: string): boolean {
  return trackId in LYRICS_DATABASE && LYRICS_DATABASE[trackId].length > 0;
}
