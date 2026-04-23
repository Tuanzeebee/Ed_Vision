import {
  API_BASE_URL,
  buildUrl as sharedBuildUrl,
} from '@/services/api/config';

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    INSTRUCTOR_AVAILABILITY: '/instructor-availability',
  },
  TIMEOUT: 30000, // 30 seconds
};

// Helper to build full URL
export function buildUrl(
  endpoint: string,
  params?: Record<string, string>,
): string {
  return sharedBuildUrl(endpoint, params);
}
