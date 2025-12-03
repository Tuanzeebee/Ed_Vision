import axios from 'axios';
import { TokenManager } from '@/lib/tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get token from multiple sources
const getAuthToken = (): string | null => {
  return localStorage.getItem('dev-token') || 
         TokenManager.getToken() || 
         localStorage.getItem('token');
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      // Redirect to correct auth login page
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
