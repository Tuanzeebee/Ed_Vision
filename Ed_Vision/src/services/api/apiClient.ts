import axios from 'axios';
import { TokenManager } from '@/lib/tokenManager';
import { API_BASE_URL } from '@/services/api/config';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Dùng TokenManager để lấy token đúng cách
    const token = TokenManager.getToken();
    
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
    // Chỉ redirect khi 401 và không phải development
    if (error.response?.status === 401 && !import.meta.env.DEV) {
      TokenManager.clearToken();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
