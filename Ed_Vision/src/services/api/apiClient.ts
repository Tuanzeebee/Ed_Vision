import axios from 'axios';
import { TokenManager } from '@/lib/tokenManager';
import { API_BASE_URL } from '@/services/api/config';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Timeout 30s — tránh request bị hang vô hạn khi backend chậm/treo. Các call
  // dài (AI tutor, Groq) có thể override timeout riêng nếu cần.
  timeout: 30000,
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

    // File upload (multipart/form-data) — vd upload audio, OCR PDF, chunk
    // listening audio, … — backend chạy Whisper/OCR có thể >30s. Bỏ timeout
    // riêng cho các call này để không bị "timeout of 30000ms exceeded".
    const contentType =
      (config.headers?.['Content-Type'] as string | undefined) ??
      (config.headers?.['content-type'] as string | undefined);
    const isMultipart =
      typeof contentType === 'string' &&
      contentType.toLowerCase().includes('multipart/form-data');
    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isMultipart || isFormData) {
      config.timeout = 0; // không giới hạn
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) =>response,
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
