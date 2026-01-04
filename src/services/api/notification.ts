import apiClient from './client';

export const notificationApi = {
  getNotifications: async () => {
    const response = await apiClient.get('/notification');
    return response.data;
  },
  
  markAsRead: async (notificationIds: string[] | 'all') => {
    const response = await apiClient.put('/notification/read', { notificationIds });
    return response.data;
  },
  
  deleteNotification: async (id: string) => {
    const response = await apiClient.delete(`/notification/${id}`);
    return response.data;
  },

  sendTestNotification: async (title: string, message: string) => {
    const response = await apiClient.post('/notification', { title, message });
    return response.data;
  }
};
