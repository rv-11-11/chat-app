import apiClient from './client';

export const channelApi = {
  createChannel: async (data: { name: string; description?: string; isPublic?: boolean; icon?: string; username?: string }) => {
    const res = await apiClient.post('/channel/create', data);
    return res.data;
  },

  getUserChannels: async () => {
    const res = await apiClient.get('/channel/user/my-channels');
    return res.data;
  },

  getPublicChannels: async (page = 1, limit = 20, search?: string) => {
    const params: any = { page, limit };
    if (search) params.search = search;
    const res = await apiClient.get('/channel/public', { params });
    return res.data;
  },

  subscribe: async (channelId: string, userId?: string) => {
    const res = await apiClient.post(`/channel/${channelId}/subscribe`, userId ? { userId } : {});
    return res.data;
  },

  unsubscribe: async (channelId: string, userId?: string) => {
    const res = await apiClient.post(`/channel/${channelId}/unsubscribe`, userId ? { userId } : {});
    return res.data;
  },

  getInfo: async (channelId: string) => {
    const res = await apiClient.get(`/channel/${channelId}/info`);
    return res.data;
  },
};
