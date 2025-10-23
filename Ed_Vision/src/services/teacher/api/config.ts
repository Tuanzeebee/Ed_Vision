// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  ENDPOINTS: {
    INSTRUCTOR_AVAILABILITY: '/instructor-availability',
  },
  TIMEOUT: 30000, // 30 seconds
};

// Helper to build full URL
export function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }
  return url.toString();
}
