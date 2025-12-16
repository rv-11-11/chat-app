import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export const formatChatTime = (date: string | Date): string => {
  const messageDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  }
  
  if (isYesterday(messageDate)) {
    return 'Yesterday';
  }
  
  return format(messageDate, 'MMM d');
};

export const formatMessageTime = (date: string | Date): string => {
  const messageDate = typeof date === 'string' ? new Date(date) : date;
  return format(messageDate, 'HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  const messageDate = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(messageDate, { addSuffix: true });
};

export const generateUUID = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Helper to get other user info from chat
export const getOtherUserAndGroup = (
  chat: any,
  currentUserId: string | null,
  onlineUsers: string[] = []
) => {
  const isGroup = chat?.isGroup || chat?.type === 'GROUP';

  if (isGroup) {
    return {
      name: chat.groupName || 'Unnamed Group',
      avatar: chat.icon || null,
      isGroup: true,
      isOnline: false,
    };
  }

  const other = chat?.participants?.find((p: any) => {
    const participantId = typeof p === 'string' ? p : p._id;
    return participantId?.toString() !== currentUserId?.toString();
  });

  const otherUserId = typeof other === 'string' ? other : other?._id;
  const isOnline = otherUserId ? onlineUsers.includes(otherUserId.toString()) : false;

  return {
    name: (typeof other === 'object' ? other?.name : null) || 'Unknown',
    avatar: (typeof other === 'object' ? other?.avatar : null) || null,
    isGroup: false,
    isOnline,
  };
};

export const isUserOnline = (userId: string | null | undefined, onlineUsers: string[] = []): boolean => {
  if (!userId) return false;
  return onlineUsers.includes(userId.toString());
};


