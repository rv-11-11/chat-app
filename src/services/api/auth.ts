import apiClient from './client';
import type { RegisterData, LoginData, AuthResponse } from '../../types/auth.types';

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    return response.data;
  },

  getStatus: async (): Promise<AuthResponse> => {
    const response = await apiClient.get<AuthResponse>('/auth/status');
    return response.data;
  },
};


