import { io, Socket } from 'socket.io-client';
import { ENV } from '../../config/env';
import { secureStorage } from '../storage/secureStore';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  return socket;
};

export const connectSocket = (): Socket => {
  if (socket && socket.connected) return socket;

  // If there's an existing socket, disconnect it first
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (e) {
      // ignore
    }
    socket = null;
  }

  // Create socket synchronously but do not auto connect until we attach auth
  const options: any = {
    path: '/socket.io/',
    transports: ['polling', 'websocket'],
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    auth: {},
  };

  console.log('[Socket Client] Connecting to:', ENV.SOCKET_URL);
  socket = io(ENV.SOCKET_URL, options);

  // Attach basic listeners immediately
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error?.message || error);
  });

  // Async: fetch token and then connect
  (async () => {
    try {
      const token = await secureStorage.get('authToken');
      if (token && socket) {
        // set auth then connect
        try {
          (socket as any).auth = { token };
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
    try {
      socket?.connect();
    } catch (e) {
      // ignore
    }
  })();

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (e) {
      // ignore
    }
    socket = null;
  }
};

export default getSocket;

