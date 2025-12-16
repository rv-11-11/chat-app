import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket/socketClient';
import { SOCKET_EVENTS } from '../utils/constants';

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  isConnected: boolean;
  reconnectAttempts: number;

  // Actions
  connect: () => void;
  disconnect: () => void;
  setOnlineUsers: (users: string[]) => void;
  setIsConnected: (connected: boolean) => void;
  setReconnectAttempts: (attempts: number) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  isConnected: false,
  reconnectAttempts: 0,

  connect: () => {
    const socket = connectSocket();
    set({ socket });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      set({ isConnected: true, reconnectAttempts: 0 });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      set({ isConnected: false });
      
      // Auto-reconnect on unexpected disconnects
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      const attempts = get().reconnectAttempts;
      set({ reconnectAttempts: attempts + 1 });
    });

    socket.on(SOCKET_EVENTS.ONLINE_USERS, (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnect: () => {
    disconnectSocket();
    set({ socket: null, isConnected: false, onlineUsers: [], reconnectAttempts: 0 });
  },

  setOnlineUsers: (users: string[]) => {
    set({ onlineUsers: users });
  },

  setIsConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  setReconnectAttempts: (attempts: number) => {
    set({ reconnectAttempts: attempts });
  },
}));

