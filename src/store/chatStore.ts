import { create } from 'zustand';
import { chatApi } from '../services/api/chat';
import type { Chat, Message, CreateChatData, CreateMessageData } from '../types/chat.types';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  users: any[];
  
  isChatsLoading: boolean;
  isMessagesLoading: boolean;
  isSendingMessage: boolean;
  
  // Actions
  fetchChats: () => Promise<void>;
  fetchChat: (chatId: string) => Promise<void>;
  createChat: (data: CreateChatData) => Promise<Chat | null>;
  sendMessage: (data: CreateMessageData) => Promise<void>;
  addNewMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  updateChatLastMessage: (chatId: string, message: Message) => void;
  updateChatUnread: (chatId: string, increment?: number) => void;
  addNewChat: (chat: Chat) => void;
  markAsRead: (chatId: string) => Promise<void>;
  clearCurrentChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  users: [],
  
  isChatsLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  
  fetchChats: async () => {
    set({ isChatsLoading: true });
    try {
      const response = await chatApi.getAllChats();
      set({ chats: response.chats });
    } catch (error: any) {
      console.error('Failed to fetch chats:', error);
    } finally {
      set({ isChatsLoading: false });
    }
  },
  
  fetchChat: async (chatId: string) => {
    set({ isMessagesLoading: true });
    try {
      const response = await chatApi.getChat(chatId);
      set({ 
        currentChat: response.chat,
        messages: response.messages 
      });
      // Mark as read
      await get().markAsRead(chatId);
    } catch (error: any) {
      console.error('Failed to fetch chat:', error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  
  createChat: async (data: CreateChatData) => {
    try {
      const response = await chatApi.createChat(data);
      set((state) => ({
        chats: [response.chat, ...state.chats]
      }));
      return response.chat;
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      return null;
    }
  },
  
  sendMessage: async (data: CreateMessageData) => {
    set({ isSendingMessage: true });
    try {
      const response = await chatApi.sendMessage(data);
      // Add message to current chat if it matches
      if (get().currentChat?._id === data.chatId) {
        set((state) => ({
          messages: [...state.messages, response.userMessage]
        }));
      }
      // Update chat list
      get().updateChatLastMessage(data.chatId, response.userMessage);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      throw error;
    } finally {
      set({ isSendingMessage: false });
    }
  },
  
  addNewMessage: (message: Message) => {
    // Only add if it's for current chat
    if (get().currentChat?._id === message.chatId) {
      set((state) => {
        // Check if message already exists
        if (state.messages.some(m => m._id === message._id)) {
          return state;
        }
        return {
          messages: [...state.messages, message]
        };
      });
    }
    // Always update chat list last message
    get().updateChatLastMessage(message.chatId, message);
  },
  
  removeMessage: (messageId: string) => {
    set((state) => ({
      messages: state.messages.filter(m => m._id !== messageId)
    }));
  },
  
  updateChatLastMessage: (chatId: string, message: Message) => {
    set((state) => ({
      chats: state.chats.map(chat =>
        chat._id === chatId
          ? { ...chat, lastMessage: message, updatedAt: message.createdAt }
          : chat
      ).sort((a, b) => {
        // Sort by updatedAt, most recent first
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      })
    }));
  },

  updateChatUnread: (chatId: string, increment: number = 1) => {
    set((state) => ({
      chats: state.chats.map(chat =>
        chat._id === chatId
          ? { ...chat, unreadCount: (chat.unreadCount || 0) + increment }
          : chat
      )
    }));
  },

  addNewChat: (chat: Chat) => {
    set((state) => {
      // Check if chat already exists
      if (state.chats.some(c => c._id === chat._id)) {
        return state;
      }
      return {
        chats: [chat, ...state.chats]
      };
    });
  },
  
  markAsRead: async (chatId: string) => {
    try {
      await chatApi.markAsRead(chatId);
      set((state) => ({
        chats: state.chats.map(chat =>
          chat._id === chatId
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },
  clearCurrentChat: () => {
  set({
    currentChat: null,
    messages: [],
    isMessagesLoading: false,
    isSendingMessage: false,
  });
},
}));

