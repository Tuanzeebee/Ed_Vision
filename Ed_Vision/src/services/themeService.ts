import { LIVE_THEMES, type LiveTheme } from '@/data/liveThemes';

/**
 * Mock service to simulate API calls for Live Themes
 * Replace with real API calls when backend is ready
 */

/**
 * Simulate network delay
 */
const delay = (ms: number) =>new Promise(resolve =>setTimeout(resolve, ms));

/**
 * Fetch all live themes
 * @returns Promise<LiveTheme[]>*/
export async function listLiveThemes(): Promise<LiveTheme[]> {
  // Simulate API delay (100-200ms)
  await delay(100 + Math.random() * 100);
  
  return LIVE_THEMES;
}

/**
 * Fetch live themes by category
 * @param category - Theme category
 * @returns Promise<LiveTheme[]>*/
export async function listLiveThemesByCategory(
  category: LiveTheme['category']
): Promise<LiveTheme[]> {
  await delay(100 + Math.random() * 100);
  
  return LIVE_THEMES.filter(theme =>theme.category === category);
}

/**
 * Fetch a single live theme by ID
 * @param id - Theme ID
 * @returns Promise<LiveTheme | undefined>*/
export async function getLiveThemeById(id: string): Promise<LiveTheme | undefined> {
  await delay(50 + Math.random() * 50);
  
  return LIVE_THEMES.find(theme =>theme.id === id);
}

/**
 * Get featured live theme (first Chill theme)
 * @returns Promise<LiveTheme>*/
export async function getFeaturedLiveTheme(): Promise<LiveTheme> {
  await delay(50);
  
  const featured = LIVE_THEMES.find(theme =>theme.category === 'Chill');
  return featured || LIVE_THEMES[0];
}

// TODO: Replace these with actual API endpoints when backend is ready
// Example:
// export async function listLiveThemes(): Promise<LiveTheme[]> {
//   const response = await fetch('/api/live-themes');
//   return response.json();
// }
