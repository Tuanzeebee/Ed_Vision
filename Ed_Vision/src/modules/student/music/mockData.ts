/**
 * Mock Data for Music Module
 * Hard-coded data cho demo - Dễ dàng thay thế bằng API thật sau này
 */

import type { Track, Album, Playlist, Artist, PodcastShow, PodcastEpisode } from './types';

// ============ TOP TRACKS (Top Charts) ============
export const TOP_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: '3:20',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    plays: 3_500_000_000,
  },
  {
    id: 'track-2',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    duration: '3:53',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
    plays: 3_400_000_000,
  },
  {
    id: 'track-3',
    title: 'Someone Like You',
    artist: 'Adele',
    album: '21',
    duration: '4:45',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b2732118bf9b198b05a95ded6300',
    plays: 1_500_000_000,
  },
  {
    id: 'track-4',
    title: 'Dance Monkey',
    artist: 'Tones and I',
    album: 'The Kids Are Coming',
    duration: '3:29',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273c6f7af36ecdc3ed6e0a1f169',
    plays: 2_800_000_000,
  },
  {
    id: 'track-5',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    duration: '2:54',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b27377fdcfda6535601aff081b6a',
    plays: 2_100_000_000,
  },
  {
    id: 'track-6',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: '3:23',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946',
    plays: 1_900_000_000,
  },
  {
    id: 'track-7',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3: OVER YOU',
    duration: '2:21',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273a51460f6bdc55fa9f0fad8cf',
    plays: 2_500_000_000,
  },
  {
    id: 'track-8',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    duration: '3:58',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273712701c5e263efc8726b1464',
    plays: 2_200_000_000,
  },
  {
    id: 'track-9',
    title: 'Peaches',
    artist: 'Justin Bieber ft. Daniel Caesar',
    album: 'Justice',
    duration: '3:18',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738aa3f71695cd1cf3103ee5e5',
    plays: 1_800_000_000,
  },
  {
    id: 'track-10',
    title: 'Bad Guy',
    artist: 'Billie Eilish',
    album: 'WHEN WE ALL FALL ASLEEP',
    duration: '3:14',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce',
    plays: 2_300_000_000,
  },
  {
    id: 'track-11',
    title: 'Shivers',
    artist: 'Ed Sheeran',
    album: '= (Equals)',
    duration: '3:27',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ef24c3fdbf856340d55cfeb2',
    plays: 1_600_000_000,
  },
  {
    id: 'track-12',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: '2:47',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0',
    plays: 2_700_000_000,
  },
];

// ============ LOFI / STUDY TRACKS ============
export const LOFI_TRACKS: Track[] = [
  {
    id: 'lofi-1',
    title: 'Cozy Coffee Shop',
    artist: 'Lofi Girl',
    album: 'Chilledcow Sessions',
    duration: '3:24',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273a8f7c0ae8bf2f6f7e2d1e8c9',
    plays: 50_000_000,
  },
  {
    id: 'lofi-2',
    title: 'Rainy Day Vibes',
    artist: 'Chillhop Music',
    album: 'Essentials',
    duration: '2:58',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273c4d6e8b9f4a5c3d2e1f0a9b8',
    plays: 45_000_000,
  },
  {
    id: 'lofi-3',
    title: 'Late Night Study',
    artist: 'Sleepy Fish',
    album: 'Midnight Dreams',
    duration: '4:12',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273d5e7f8a9b0c1d2e3f4a5b6c7',
    plays: 38_000_000,
  },
  {
    id: 'lofi-4',
    title: 'Autumn Leaves',
    artist: 'L.Dre',
    album: 'Seasonal Beats',
    duration: '3:45',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273e8f9a0b1c2d3e4f5a6b7c8d9',
    plays: 32_000_000,
  },
  {
    id: 'lofi-5',
    title: 'Peaceful Morning',
    artist: 'Idealism',
    album: 'Sunrise Collection',
    duration: '3:15',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273f0a1b2c3d4e5f6a7b8c9d0e1',
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
export const ALBUMS: Album[] = [
  {
    id: 'album-1',
    title: 'After Hours',
    artist: 'The Weeknd',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    year: 2020,
    tracks: [
      { id: 'ah-1', title: 'Alone Again', artist: 'The Weeknd', duration: '4:10', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      { id: 'ah-2', title: 'Too Late', artist: 'The Weeknd', duration: '3:59', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      { id: 'ah-3', title: 'Hardest To Love', artist: 'The Weeknd', duration: '3:31', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      { id: 'ah-4', title: 'Scared To Live', artist: 'The Weeknd', duration: '3:11', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      { id: 'ah-5', title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      { id: 'ah-6', title: 'In Your Eyes', artist: 'The Weeknd', duration: '3:57', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
      { id: 'ah-7', title: 'Save Your Tears', artist: 'The Weeknd', duration: '3:35', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36' },
    ],
  },
  {
    id: 'album-2',
    title: '÷ (Divide)',
    artist: 'Ed Sheeran',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
    year: 2017,
    tracks: [
      { id: 'div-1', title: 'Eraser', artist: 'Ed Sheeran', duration: '3:47', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
      { id: 'div-2', title: 'Castle on the Hill', artist: 'Ed Sheeran', duration: '4:21', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
      { id: 'div-3', title: 'Dive', artist: 'Ed Sheeran', duration: '3:58', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
      { id: 'div-4', title: 'Shape of You', artist: 'Ed Sheeran', duration: '3:53', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
      { id: 'div-5', title: 'Perfect', artist: 'Ed Sheeran', duration: '4:23', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
      { id: 'div-6', title: 'Galway Girl', artist: 'Ed Sheeran', duration: '2:50', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96' },
    ],
  },
  {
    id: 'album-3',
    title: 'Future Nostalgia',
    artist: 'Dua Lipa',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946',
    year: 2020,
    tracks: [
      { id: 'fn-1', title: 'Future Nostalgia', artist: 'Dua Lipa', duration: '3:04', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946' },
      { id: 'fn-2', title: "Don't Start Now", artist: 'Dua Lipa', duration: '3:03', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946' },
      { id: 'fn-3', title: 'Cool', artist: 'Dua Lipa', duration: '3:29', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946' },
      { id: 'fn-4', title: 'Physical', artist: 'Dua Lipa', duration: '3:13', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946' },
      { id: 'fn-5', title: 'Levitating', artist: 'Dua Lipa', duration: '3:23', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946' },
      { id: 'fn-6', title: 'Break My Heart', artist: 'Dua Lipa', duration: '3:41', imageUrl: 'https://i.scdn.co/image/ab67616d0000b273bd26ede1ae69327010d49946' },
    ],
  },
  {
    id: 'album-4',
    title: "Harry's House",
    artist: 'Harry Styles',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0',
    year: 2022,
    tracks: [
      { id: 'hh-1', title: 'Music For a Sushi Restaurant', artist: 'Harry Styles', duration: '3:12', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0' },
      { id: 'hh-2', title: 'Late Night Talking', artist: 'Harry Styles', duration: '2:57', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0' },
      { id: 'hh-3', title: 'As It Was', artist: 'Harry Styles', duration: '2:47', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0' },
      { id: 'hh-4', title: 'Daylight', artist: 'Harry Styles', duration: '2:44', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0' },
      { id: 'hh-5', title: 'Matilda', artist: 'Harry Styles', duration: '4:05', imageUrl: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0' },
    ],
  },
  {
    id: 'album-5',
    title: 'WHEN WE ALL FALL ASLEEP',
    artist: 'Billie Eilish',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce',
    year: 2019,
    tracks: [
      { id: 'ww-1', title: '!!!!!!!', artist: 'Billie Eilish', duration: '0:13', imageUrl: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce' },
      { id: 'ww-2', title: 'bad guy', artist: 'Billie Eilish', duration: '3:14', imageUrl: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce' },
      { id: 'ww-3', title: 'xanny', artist: 'Billie Eilish', duration: '4:03', imageUrl: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce' },
      { id: 'ww-4', title: 'you should see me in a crown', artist: 'Billie Eilish', duration: '3:00', imageUrl: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce' },
      { id: 'ww-5', title: 'bury a friend', artist: 'Billie Eilish', duration: '3:13', imageUrl: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce' },
      { id: 'ww-6', title: 'lovely', artist: 'Billie Eilish & Khalid', duration: '3:20', imageUrl: 'https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce' },
    ],
  },
];

// ============ PODCASTS ============
export const PODCAST_SHOWS: PodcastShow[] = [
  {
    id: 'podcast-1',
    title: 'The Joe Rogan Experience',
    host: 'Joe Rogan',
    description: 'The podcast of comedian Joe Rogan',
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a7a7b9c1c2d3e4f5a6b7c8d9e',
    episodes: [],
  },
  {
    id: 'podcast-2',
    title: 'TED Talks Daily',
    host: 'TED',
    description: 'Every weekday, TED Talks Daily brings you the latest talks in audio',
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a8e9f0a1b2c3d4e5f6a7b8c9d',
    episodes: [],
  },
  {
    id: 'podcast-3',
    title: 'The Daily',
    host: 'The New York Times',
    description: "This is what the news should sound like",
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a9f0a1b2c3d4e5f6a7b8c9d0e',
    episodes: [],
  },
];

export const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: 'episode-1',
    title: 'How to Build Good Habits',
    show: 'TED Talks Daily',
    duration: '18:24',
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a8e9f0a1b2c3d4e5f6a7b8c9d',
    description: 'Learn the science behind habit formation',
    publishedAt: '2025-12-18',
  },
  {
    id: 'episode-2',
    title: 'The Science of Sleep',
    show: 'The Joe Rogan Experience',
    duration: '2:45:30',
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a7a7b9c1c2d3e4f5a6b7c8d9e',
    description: 'Deep dive into sleep science with Dr. Matthew Walker',
    publishedAt: '2025-12-17',
  },
  {
    id: 'episode-3',
    title: 'Breaking News Today',
    show: 'The Daily',
    duration: '25:10',
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a9f0a1b2c3d4e5f6a7b8c9d0e',
    description: 'The latest headlines and analysis',
    publishedAt: '2025-12-20',
  },
  {
    id: 'episode-4',
    title: 'Mindfulness for Beginners',
    show: 'TED Talks Daily',
    duration: '15:42',
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a8e9f0a1b2c3d4e5f6a7b8c9d',
    description: 'Start your mindfulness journey',
    publishedAt: '2025-12-16',
  },
  {
    id: 'episode-5',
    title: 'AI and the Future of Work',
    show: 'TED Talks Daily',
    duration: '22:15',
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a8e9f0a1b2c3d4e5f6a7b8c9d',
    description: 'How AI is reshaping our careers',
    publishedAt: '2025-12-15',
  },
  {
    id: 'episode-6',
    title: 'Comedy Special Review',
    show: 'The Joe Rogan Experience',
    duration: '1:32:45',
    imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a7a7b9c1c2d3e4f5a6b7c8d9e',
    description: 'Discussing the best comedy specials of the year',
    publishedAt: '2025-12-14',
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
