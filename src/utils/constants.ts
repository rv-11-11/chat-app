export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  SETTINGS: 'settings',
  OFFLINE_QUEUE: 'offlineQueue',
} as const;

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Users
  ONLINE_USERS: 'online:users',
  
  // Chat
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  CHAT_NEW: 'chat:new',
  CHAT_UPDATE: 'chat:update',
  
  // Messages
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELETED: 'message:deleted',
  
  // Channel
  CHANNEL_SUBSCRIBE: 'channel:subscribe',
  CHANNEL_UNSUBSCRIBE: 'channel:unsubscribe',
  SUBSCRIBER_JOINED: 'subscriber:joined',
  SUBSCRIBER_LEFT: 'subscriber:left',
  ADMIN_ADDED: 'admin:added',
  ADMIN_REMOVED: 'admin:removed',
  
  // WebRTC
  WEBRTC_JOIN: 'webrtc:join',
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE: 'webrtc:ice',
  
  // Reports (Admin)
  ADMIN_JOIN_REPORTS: 'admin:join-reports-room',
  ADMIN_LEAVE_REPORTS: 'admin:leave-reports-room',
  REPORT_CREATED: 'report:created',
  REPORT_STATUS_CHANGED: 'report:status-changed',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    STATUS: '/auth/status',
  },
  CHAT: {
    ALL: '/chat/all',
    CREATE: '/chat/create',
    GET: (id: string) => `/chat/${id}`,
    UPDATE: (id: string) => `/chat/${id}`,
    DELETE: (id: string) => `/chat/${id}`,
    MARK_READ: (id: string) => `/chat/${id}/mark-as-read`,
  },
} as const;


