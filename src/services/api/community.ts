import apiClient from './client';
import type { CommunityType } from '../../types/community.type';

export interface CreateCommunityData {
  name: string;
  description?: string;
  isPublic: boolean;
  icon?: string;
}

export const communityApi = {
  getMyCommunities: async (): Promise<{ communities: CommunityType[] }> => {
    const response = await apiClient.get<{ communities: CommunityType[] }>(
      '/community/my'
    );
    return response.data;
  },

  getPublicCommunities: async (
    page = 1,
    limit = 20
  ): Promise<{ communities: CommunityType[]; total: number }> => {
    const response = await apiClient.get<{
      communities: CommunityType[];
      total: number;
    }>('/community/public', {
      params: { page, limit },
    });
    return response.data;
  },

  getCommunity: async (
    communityId: string
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.get<{ community: CommunityType }>(
      `/community/${communityId}`
    );
    return response.data;
  },

  updateCommunity: async (
    communityId: string,
    data: Partial<{
      name: string;
      description?: string;
      icon?: string;
      isPublic?: boolean;
      allowInviteLinkJoin?: boolean;
    }>
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.put<{ community: CommunityType }>(
      `/community/${communityId}`,
      data
    );
    return response.data;
  },

  createCommunity: async (
    data: CreateCommunityData
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.post<{ community: CommunityType }>(
      '/community/create',
      data
    );
    return response.data;
  },

  deleteCommunity: async (
    communityId: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/community/${communityId}`
    );
    return response.data;
  },

  joinCommunity: async (
    communityId: string
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.post<{ community: CommunityType }>(
      `/community/${communityId}/join`
    );
    return response.data;
  },

  leaveCommunity: async (
    communityId: string,
    userId: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/community/${communityId}/member/${userId}`
    );
    return response.data;
  },

  addChatToCommunity: async (
    communityId: string,
    chatId: string,
    chatType: 'GROUP' | 'CHANNEL'
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.post<{ community: CommunityType }>(
      `/community/${communityId}/chat/add`,
      { chatId, chatType }
    );
    return response.data;
  },

  removeChatFromCommunity: async (
    communityId: string,
    chatId: string
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.delete<{ community: CommunityType }>(
      `/community/${communityId}/chat/${chatId}`
    );
    return response.data;
  },

  addMember: async (
    communityId: string,
    memberId: string
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.post<{ community: CommunityType }>(
      `/community/${communityId}/member/${memberId}/add`
    );
    return response.data;
  },

  promoteToAdmin: async (
    communityId: string,
    memberId: string
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.post<{ community: CommunityType }>(
      `/community/${communityId}/admin/${memberId}/promote`
    );
    return response.data;
  },

  demoteFromAdmin: async (
    communityId: string,
    memberId: string
  ): Promise<{ community: CommunityType }> => {
    const response = await apiClient.post<{ community: CommunityType }>(
      `/community/${communityId}/admin/${memberId}/demote`
    );
    return response.data;
  },
};
