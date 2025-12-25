import type { User } from '../../types/auth.types';
import apiClient from './client';

export const userApi = {
  searchUsers: async (query: string): Promise<{ users: User[] }> => {
    const response = await apiClient.get<{ users: User[] }>(`/user/all?search=${query}`);
    return response.data;
  },

  updateProfile: async (data: {
    name: string;
    username?: string;
    email: string;
    phone?: string;
    avatar?: string;
    isOnlineVisible?: boolean;
    readReceipts?: boolean;
  }): Promise<{ user: User }> => {
    const response = await apiClient.put<{ user: User }>('/users/profile', data);
    return response.data;
  },
};
