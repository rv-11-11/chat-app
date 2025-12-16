import { useEffect, useRef } from 'react';
import { useSocketStore } from '../store/socketStore';
import { getSocket } from '../services/socket/socketClient';
import { SOCKET_EVENTS } from '../utils/constants';
import type { Message, Chat } from '../types/chat.types';

interface UseSocketOptions {
  onNewMessage?: (message: Message) => void;
  onMessageDeleted?: (data: { chatId: string; messageId: string }) => void;
  onChatNew?: (chat: Chat) => void;
  onChatUpdate?: (data: { chatId: string; lastMessage: Message }) => void;
  onOnlineUsers?: (userIds: string[]) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { socket, isConnected, setOnlineUsers } = useSocketStore();
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const currentSocket = socket || getSocket();
    if (!currentSocket) return;

    // Online users
    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUsers(userIds);
      optionsRef.current.onOnlineUsers?.(userIds);
    };

    // Messages - handle both full message object and lightweight { chatId } payload
    const handleNewMessage = (data: Message | { chatId?: string }) => {
      // Check if it's a full message object or lightweight payload
      if (data && typeof data === 'object' && '_id' in data && 'content' in data) {
        // Full message object
        optionsRef.current.onNewMessage?.(data as Message);
      } else if (data && typeof data === 'object' && 'chatId' in data) {
        // Lightweight payload - just update unread count
        // This will be handled by chat:update event or chat list
        // We can trigger a callback here if needed
        const chatId = (data as { chatId: string }).chatId;
        if (chatId) {
          // Import and update unread count
          const { useChatStore } = require('../store/chatStore');
          useChatStore.getState().updateChatUnread(chatId, 1);
        }
      }
    };

    const handleMessageDeleted = (data: { chatId: string; messageId: string }) => {
      optionsRef.current.onMessageDeleted?.(data);
    };

    // Chats
    const handleChatNew = (chat: Chat) => {
      optionsRef.current.onChatNew?.(chat);
    };

    const handleChatUpdate = (data: { chatId: string; lastMessage: Message }) => {
      optionsRef.current.onChatUpdate?.(data);
    };

    // Register event listeners
    currentSocket.on(SOCKET_EVENTS.ONLINE_USERS, handleOnlineUsers);
    currentSocket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
    currentSocket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    currentSocket.on(SOCKET_EVENTS.CHAT_NEW, handleChatNew);
    currentSocket.on(SOCKET_EVENTS.CHAT_UPDATE, handleChatUpdate);

    // Cleanup
    return () => {
      currentSocket.off(SOCKET_EVENTS.ONLINE_USERS, handleOnlineUsers);
      currentSocket.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage);
      currentSocket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      currentSocket.off(SOCKET_EVENTS.CHAT_NEW, handleChatNew);
      currentSocket.off(SOCKET_EVENTS.CHAT_UPDATE, handleChatUpdate);
    };
  }, [socket, setOnlineUsers]);

  return {
    socket,
    isConnected,
    joinChat: (chatId: string, callback?: (err?: string) => void) => {
      socket?.emit(SOCKET_EVENTS.CHAT_JOIN, chatId, callback);
    },
    leaveChat: (chatId: string) => {
      socket?.emit(SOCKET_EVENTS.CHAT_LEAVE, chatId);
    },
  };
};


