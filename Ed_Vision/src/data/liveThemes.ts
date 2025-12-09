export type LiveTheme = {
  id: string;
  title: string;
  category: "Custom" | "Exclusive" | "Chill" | "Focus" | "Anime" | "Pets" | "Kpop";
  youtubeVideoId: string;
  start?: number;
  end?: number;
  thumbnailUrl: string;
  attribution?: string;
};

export const LIVE_THEMES: LiveTheme[] = [
  {
    id: 'rainy-lofi-japan',
    title: 'Rainy Lofi Japan',
    category: 'Chill',
    youtubeVideoId: 'jfKfPfyJRdk', // lofi hip hop radio - beats to relax/study to
    start: 0,
    end: 30,
    thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg', // Rainy city street
    attribution: 'Fall in Chill',
  },
  {
    id: 'minimal-space',
    title: 'Minimal Space',
    category: 'Focus',
    youtubeVideoId: 'DWcJFNfaw9c', // Interstellar Main Theme - Hans Zimmer
    thumbnailUrl: 'https://img.youtube.com/vi/DWcJFNfaw9c/maxresdefault.jpg', // Space/stars
    attribution: 'Lofi Study',
  },
  {
    id: 'cozy-cat-cafe',
    title: 'Cozy Cat Cafe',
    category: 'Pets',
    youtubeVideoId: '5qap5aO4i9A', // lofi hip hop radio - beats to relax/study to
    thumbnailUrl: 'https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg', // Cat
    attribution: 'Chill Vibes',
  },
  {
    id: 'low-poly-city',
    title: 'Low Poly City',
    category: 'Chill',
    youtubeVideoId: 'lTRiuFIWV54', // lofi hip hop radio - beats to sleep/chill to
    thumbnailUrl: 'https://img.youtube.com/vi/lTRiuFIWV54/maxresdefault.jpg', // City night
    attribution: 'Study beats',
  },
  {
    id: 'peaceful-garden',
    title: 'Peaceful Garden',
    category: 'Chill',
    youtubeVideoId: '5yx6BWlEVcY', // Beautiful Relaxing Music - Peaceful Piano Music & Guitar Music
    thumbnailUrl: 'https://img.youtube.com/vi/5yx6BWlEVcY/maxresdefault.jpg', // Japanese garden
    attribution: 'Nature Sounds',
  },
  {
    id: 'forest-waterfall',
    title: 'Forest Waterfall',
    category: 'Focus',
    youtubeVideoId: 'eKFTSSKCzWA', // 3 Hour Study Music, Concentration, Focus, Meditation, Work Music, Relaxing Music
    thumbnailUrl: 'https://img.youtube.com/vi/eKFTSSKCzWA/maxresdefault.jpg', // Waterfall
    attribution: 'Ambient',
  },
  {
    id: 'mountain-view',
    title: 'Mountain View',
    category: 'Focus',
    youtubeVideoId: '4xDzrJKXOOY', // 8 Hours of Beautiful Instrumental Piano & Guitar Music for Relaxation & Meditation
    thumbnailUrl: 'https://img.youtube.com/vi/4xDzrJKXOOY/maxresdefault.jpg', // Mountains
    attribution: 'Relax Music',
  },
  {
    id: 'sunset-sky',
    title: 'Sunset Sky',
    category: 'Chill',
    youtubeVideoId: 'bebuiaSKtU4', // 24/7 lofi radio - beats to chill/study to
    thumbnailUrl: 'https://img.youtube.com/vi/bebuiaSKtU4/maxresdefault.jpg', // Sunset
    attribution: 'Chill Beats',
  },
  {
    id: 'cozy-fireplace',
    title: 'Cozy Fireplace',
    category: 'Chill',
    youtubeVideoId: 'UgHKb_7884o', // Crackling Fireplace with Burning Logs & Crackling Fire Sounds
    thumbnailUrl: 'https://img.youtube.com/vi/UgHKb_7884o/maxresdefault.jpg', // Fireplace
    attribution: 'Winter Vibes',
  },
  {
    id: 'city-night',
    title: 'City Night',
    category: 'Focus',
    youtubeVideoId: 'f02mOEt11OQ', // Coffee Shop Radio // 24/7 lofi hip-hop beats
    thumbnailUrl: 'https://img.youtube.com/vi/f02mOEt11OQ/maxresdefault.jpg', // City lights
    attribution: 'Urban Beats',
  },
  {
    id: 'aurora-borealis',
    title: 'Aurora Borealis',
    category: 'Exclusive',
    youtubeVideoId: 'Lvdj_VyKcGQ', // Northern Lights - Aurora Borealis
    thumbnailUrl: 'https://img.youtube.com/vi/Lvdj_VyKcGQ/maxresdefault.jpg', // Aurora
    attribution: 'Cosmic Sounds',
  },
  {
    id: 'study-with-me',
    title: 'Study with me',
    category: 'Focus',
    youtubeVideoId: '5qap5aO4i9A', // lofi hip hop radio - beats to relax/study to
    thumbnailUrl: 'https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg', // Study desk
    attribution: 'Focus Music',
  },
  {
    id: 'anime-sakura',
    title: 'Anime Sakura',
    category: 'Anime',
    youtubeVideoId: 'hlWiI4xVXKY', // 1 Hour of Relaxing Anime Music
    thumbnailUrl: 'https://img.youtube.com/vi/hlWiI4xVXKY/maxresdefault.jpg', // Cherry blossoms
    attribution: 'Anime Lofi',
  },
  {
    id: 'cute-puppies',
    title: 'Cute Puppies',
    category: 'Pets',
    youtubeVideoId: 'KIePsbJjS-Y', // Relaxing Music with Cute Animals
    thumbnailUrl: 'https://img.youtube.com/vi/KIePsbJjS-Y/maxresdefault.jpg', // Puppies
    attribution: 'Pet Therapy',
  },
  {
    id: 'kpop-study',
    title: 'Kpop Study Beats',
    category: 'Kpop',
    youtubeVideoId: 'WPdWvnAAurg', // 1 Hour Kpop Study Mix
    thumbnailUrl: 'https://img.youtube.com/vi/WPdWvnAAurg/maxresdefault.jpg', // Neon lights
    attribution: 'Kpop Lofi',
  },
  {
    id: 'custom-upload',
    title: 'Your Custom Theme',
    category: 'Custom',
    youtubeVideoId: 'jfKfPfyJRdk', // placeholder
    thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg', // Abstract/upload
    attribution: 'You',
  },
];

// Utility functions
export const getLiveThemesByCategory = (category: LiveTheme['category']) => {
  return LIVE_THEMES.filter(theme => theme.category === category);
};

export const getFeaturedLiveTheme = () => {
  // Return first Chill theme as featured
  return LIVE_THEMES.find(theme => theme.category === 'Chill') || LIVE_THEMES[0];
};

export const getLiveThemeById = (id: string) => {
  return LIVE_THEMES.find(theme => theme.id === id);
};
