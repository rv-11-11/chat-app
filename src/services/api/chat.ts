import apiClient from './client';
import type { Chat, Message, CreateChatData, CreateMessageData } from '../../types/chat.types';

export const chatApi = {
  getAllChats: async (): Promise<{ chats: Chat[] }> => {
    const response = await apiClient.get<{ chats: Chat[] }>('/chat/all');
    return response.data;
  },

  getChat: async (chatId: string): Promise<{ chat: Chat; messages: Message[] }> => {
    const response = await apiClient.get<{ chat: Chat; messages: Message[] }>(`/chat/${chatId}`);
    return response.data;
  },

  createChat: async (data: CreateChatData): Promise<{ chat: Chat }> => {
    const response = await apiClient.post<{ chat: Chat }>('/chat/create', data);
    return response.data;
  },

  updateChat: async (chatId: string, data: Partial<CreateChatData>): Promise<{ chat: Chat }> => {
    const response = await apiClient.put<{ chat: Chat }>(`/chat/${chatId}`, data);
    return response.data;
  },

  deleteChat: async (chatId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/chat/${chatId}`);
    return response.data;
  },

  markAsRead: async (chatId: string): Promise<{ chat: Chat }> => {
    const response = await apiClient.post<{ chat: Chat }>(`/chat/${chatId}/mark-as-read`);
    return response.data;
  },

  addMember: async (chatId: string, userId: string): Promise<{ chat: Chat }> => {
    const response = await apiClient.post<{ chat: Chat }>(`/chat/${chatId}/add-member`, { userId });
    return response.data;
  },

  removeMember: async (chatId: string, memberId: string): Promise<{ chat: Chat }> => {
    const response = await apiClient.post<{ chat: Chat }>(`/chat/${chatId}/remove-member`, { memberId });
    return response.data;
  },

  promoteToAdmin: async (chatId: string, userId: string): Promise<{ chat: Chat }> => {
    const response = await apiClient.post<{ chat: Chat }>(`/chat/${chatId}/promote-member`, { userId });
    return response.data;
  },

  sendMessage: async (data: CreateMessageData): Promise<{ userMessage: Message; chat: Chat }> => {
    const response = await apiClient.post<{ userMessage: Message; chat: Chat }>('/chat/message/send', data);
    return response.data;
  },

  editMessage: async (messageId: string, content: string): Promise<{ message: string; data: Message }> => {
    const response = await apiClient.put<{ message: string; data: Message }>(`/chat/message/${messageId}/edit`, { content });
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/chat/message/${messageId}`);
    return response.data;
  },

  pinMessage: async (messageId: string): Promise<{ message: string; data: Message }> => {
    const response = await apiClient.put<{ message: string; data: Message }>(`/chat/message/${messageId}/pin`);
    return response.data;
  },

  forwardMessage: async (messageId: string, targetChatId: string): Promise<{ message: string; userMessage: Message }> => {
    const response = await apiClient.post<{ message: string; userMessage: Message }>(`/chat/message/${messageId}/forward`, { targetChatId });
    return response.data;
  },

  incrementViewCount: async (messageId: string): Promise<{ viewCount: number }> => {
    const response = await apiClient.post<{ viewCount: number }>(`/chat/message/${messageId}/view`);
    return response.data;
  },
};


