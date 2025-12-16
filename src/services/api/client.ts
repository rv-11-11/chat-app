import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../../config/env';
import * as SecureStore from 'expo-secure-store';

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${ENV.API_URL}/api`,
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Token is handled via cookies, but we can add custom headers if needed
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
      // Unauthorized - clear auth and redirect to login
      await SecureStore.deleteItemAsync('authToken').catch(() => {});
      // Navigation will be handled by auth hook
    }
    return Promise.reject(error);
  }
);

export default apiClient;


