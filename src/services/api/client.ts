import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../../config/env';
import { secureStorage } from '../storage/secureStore';

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${ENV.API_URL}/api`,
  withCredentials: true, // keep for web compatibility
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - attach Bearer token if present (for native builds)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await secureStorage.get('authToken');
      if (token) {
        config.headers = config.headers || {};
        // Only set Authorization if not already provided
        if (!('authorization' in (config.headers as any))) {
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      // ignore
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth token
      await secureStorage.remove('authToken').catch(() => {});
    }
    return Promise.reject(error);
  }
);

export default apiClient;


