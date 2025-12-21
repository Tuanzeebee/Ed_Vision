/**
 * Music Module Exports
 */

// Mock Data
export * from './mockData';

// Components
export { default as YouTubeMusicPlayer } from './YouTubeMusicPlayer';
export type { YouTubeMusicPlayerRef } from './YouTubeMusicPlayer';

// Context
export { MusicPlayerProvider, useMusicPlayer } from './MusicPlayerContext';
export type { RecentlyPlayedTrack } from './MusicPlayerContext';
