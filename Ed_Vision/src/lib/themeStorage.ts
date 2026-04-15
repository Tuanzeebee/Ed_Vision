import { getCachedItem, setCachedItem, batchSetCached } from './cacheStorage';

/**
 * Local storage keys for theme state persistence
 */
const STORAGE_KEYS = {
  ACTIVE_LIVE_THEME_ID: 'ed-vision-active-live-theme-id',
  LIVE_ENABLED: 'ed-vision-live-enabled',
  BACKGROUND_IMAGE: 'ed-vision-background-image',
  VIDEO_MUTED: 'ed-vision-video-muted',
  VIDEO_VOLUME: 'ed-vision-video-volume',
} as const;

/**
 * Save active live theme ID to localStorage
 */
export const saveActiveLiveThemeId = (themeId: string | null): void => {
  if (themeId === null) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_LIVE_THEME_ID);
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_LIVE_THEME_ID, themeId);
  }
};

/**
 * Load active live theme ID from localStorage
 */
export const loadActiveLiveThemeId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_LIVE_THEME_ID);
};

/**
 * Save live theme enabled state to localStorage
 */
export const saveLiveEnabled = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.LIVE_ENABLED, JSON.stringify(enabled));
};

/**
 * Load live theme enabled state from localStorage
 */
export const loadLiveEnabled = (): boolean => {
  const saved = localStorage.getItem(STORAGE_KEYS.LIVE_ENABLED);
  return saved ? JSON.parse(saved) : false;
};

/**
 * Save background image URL to localStorage
 */
export const saveBackgroundImage = (url: string): void => {
  localStorage.setItem(STORAGE_KEYS.BACKGROUND_IMAGE, url);
};

/**
 * Load background image URL from localStorage
 */
export const loadBackgroundImage = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.BACKGROUND_IMAGE);
};

/**
 * Save video muted state to localStorage
 */
export const saveVideoMuted = (muted: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.VIDEO_MUTED, JSON.stringify(muted));
};

/**
 * Load video muted state from localStorage
 */
export const loadVideoMuted = (): boolean => {
  const saved = localStorage.getItem(STORAGE_KEYS.VIDEO_MUTED);
  return saved ? JSON.parse(saved) : true; // Default to muted
};

/**
 * Save video volume to localStorage
 */
export const saveVideoVolume = (volume: number): void => {
  localStorage.setItem(STORAGE_KEYS.VIDEO_VOLUME, JSON.stringify(volume));
};

/**
 * Load video volume from localStorage
 */
export const loadVideoVolume = (): number => {
  const saved = localStorage.getItem(STORAGE_KEYS.VIDEO_VOLUME);
  return saved ? JSON.parse(saved) : 70; // Default to 70%
};

/**
 * Clear all theme-related data from localStorage
 */
export const clearThemeState = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

/**
 * Theme state type for easy serialization
 */
export type ThemeState = {
  activeLiveThemeId: string | null;
  liveEnabled: boolean;
  backgroundImage: string | null;
  videoMuted?: boolean;
  videoVolume?: number;
};

/**
 * Save complete theme state to localStorage (optimized with caching)
 */
export const saveThemeState = (state: ThemeState): void => {
  // Use batch set for better performance
  const updates: Record<string, any>= {};
  
  if (state.activeLiveThemeId !== null) {
    updates[STORAGE_KEYS.ACTIVE_LIVE_THEME_ID] = state.activeLiveThemeId;
  }
  updates[STORAGE_KEYS.LIVE_ENABLED] = state.liveEnabled;
  if (state.backgroundImage) {
    updates[STORAGE_KEYS.BACKGROUND_IMAGE] = state.backgroundImage;
  }
  if (state.videoMuted !== undefined) {
    updates[STORAGE_KEYS.VIDEO_MUTED] = state.videoMuted;
  }
  if (state.videoVolume !== undefined) {
    updates[STORAGE_KEYS.VIDEO_VOLUME] = state.videoVolume;
  }
  
  batchSetCached(updates);
};

/**
 * Load complete theme state from localStorage (optimized with caching)
 */
export const loadThemeState = (): ThemeState => {
  return {
    activeLiveThemeId: getCachedItem<string>(STORAGE_KEYS.ACTIVE_LIVE_THEME_ID) as string | null,
    liveEnabled: getCachedItem<boolean>(STORAGE_KEYS.LIVE_ENABLED, false) ?? false,
    backgroundImage: getCachedItem<string>(STORAGE_KEYS.BACKGROUND_IMAGE) as string | null,
    videoMuted: getCachedItem<boolean>(STORAGE_KEYS.VIDEO_MUTED, true) ?? true,
    videoVolume: getCachedItem<number>(STORAGE_KEYS.VIDEO_VOLUME, 70) ?? 70,
  };
};
